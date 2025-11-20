import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

export async function validateApiKey(request: Request): Promise<{ valid: boolean; error?: string }> {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return { valid: false, error: 'No API key provided' }
    }

    // Expected format: "Bearer cms_xxxxx"
    const apiKey = authHeader.replace('Bearer ', '')
    
    if (!apiKey.startsWith('cms_')) {
      return { valid: false, error: 'Invalid API key format' }
    }

    // Hash the provided key
    const keyHash = hashApiKey(apiKey)

    // Check if key exists and is active
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('active', true)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    // Check if key is expired
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at)
      if (expiryDate < new Date()) {
        return { valid: false, error: 'API key has expired' }
      }
    }

    return { valid: true }
  } catch (error: any) {
    return { valid: false, error: 'API key validation failed' }
  }
}

// Middleware wrapper function
export async function withApiKey(
  request: Request,
  handler: (request: Request) => Promise<NextResponse>
): Promise<NextResponse> {
  const validation = await validateApiKey(request)
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    )
  }

  return handler(request)
}
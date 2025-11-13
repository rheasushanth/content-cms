import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

type ApiKeyRecord = {
  id: string
  owner: string
  scopes: string[] | null
  expires_at: string | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

function hasRequiredScopes(keyScopes: string[] | null, requiredScopes: string[]): boolean {
  if (requiredScopes.length === 0) {
    return true
  }

  if (!keyScopes || keyScopes.length === 0) {
    return false
  }

  return requiredScopes.every(scope => keyScopes.includes(scope))
}

export async function validateApiKey(
  request: Request
): Promise<{ valid: boolean; error?: string; key?: ApiKeyRecord }> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return { valid: false, error: 'No API key provided' }
    }

    const apiKey = authHeader.replace('Bearer ', '')
    
    if (!apiKey.startsWith('cms_')) {
      return { valid: false, error: 'Invalid API key format' }
    }

    const keyHash = hashApiKey(apiKey)

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, owner, scopes, expires_at')
      .eq('key_hash', keyHash)
      .eq('active', true)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at)
      if (expiryDate < new Date()) {
        return { valid: false, error: 'API key has expired' }
      }
    }

    return { valid: true, key: data }
  } catch (error: any) {
    return { valid: false, error: 'API key validation failed' }
  }
}

export async function withApiKey(
  request: Request,
  handler: (request: Request, context: { key: ApiKeyRecord }) => Promise<NextResponse>,
  requiredScopes: string[] = ['read:collections']
): Promise<NextResponse> {
  const validation = await validateApiKey(request)
  
  if (!validation.valid || !validation.key) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    )
  }

  if (!hasRequiredScopes(validation.key.scopes, requiredScopes)) {
    return NextResponse.json(
      { error: 'API key does not have required scope' },
      { status: 403 }
    )
  }

  return handler(request, { key: validation.key })
}
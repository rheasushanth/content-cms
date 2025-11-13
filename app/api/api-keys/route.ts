import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/authMiddleware'
import { createClient } from '@/lib/auth/supabase'
import crypto from 'crypto'

function generateApiKey(): string {
  return 'cms_' + crypto.randomBytes(32).toString('hex')
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

// POST - Generate new API key (protected)
export async function POST(request: Request) {
  return withAuth(request, async (req, userId) => {
    try {
      const body = await request.json()
      const apiKey = generateApiKey()
      const keyHash = hashApiKey(apiKey)
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          key_hash: keyHash,
          description: body.description || 'No description',
          scopes: body.scopes || ['read:collections'],
          active: true,
          expires_at: body.expires_at || null,
          owner: userId // Automatically set to current user!
        }])
        .select()

      if (error) throw error

      return NextResponse.json({ 
        data: data[0],
        api_key: apiKey,
        message: 'Save this API key securely - it will not be shown again!'
      }, { status: 201 })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

// GET - List API keys (protected - user sees only their own)
export async function GET(request: Request) {
  return withAuth(request, async (req, userId) => {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, description, scopes, active, created_at, expires_at')
        .eq('owner', userId) // Filter by current user!
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ data })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
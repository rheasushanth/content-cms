import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'
import { createHash } from 'crypto'
import { z } from 'zod'

const displayRulesSchema = z.object({
  delay: z.number().min(0).max(300).default(0),
  pages: z.array(z.string()).default(['all']),
  trigger: z.enum(['on-load', 'exit-intent']).default('on-load'),
  frequency: z.enum(['once-per-session', 'always', 'once-per-user', 'once-per-page']).default('once-per-session')
})

const popupSchema = z.object({
  name: z.string().min(2),
  template_type: z.enum(['email-capture','discount','newsletter','exit-intent','announcement','custom']),
  html_content: z.string().min(1),
  display_rules: displayRulesSchema.optional(),
  is_active: z.boolean().optional()
})

// Helper function to verify API key
async function verifyApiKey(apiKey: string, requiredScope: string) {
  const supabase = await createClient()
  
  // Hash the API key to compare with database
  const hashedKey = createHash('sha256').update(apiKey).digest('hex')
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('owner, scopes, active, expires_at')
    .eq('key_hash', hashedKey)
    .single()
  
  if (error || !data || !data.active) {
    return null
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  // Check if has required scope
  const scopes = data.scopes as any[]
  const hasScope = scopes.some(scope => 
    typeof scope === 'string' ? scope === requiredScope : scope === requiredScope
  )
  
  if (!hasScope) {
    return null
  }
  
  return { userId: data.owner }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    let userId: string | null = null
    
    // Check for API key authentication first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7)
      const apiKeyData = await verifyApiKey(apiKey, 'read:popups')
      
      if (!apiKeyData) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 })
      }
      
      userId = apiKeyData.userId
    } else {
      // Fall back to session authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      userId = user.id
    }

    const { data, error } = await supabase
      .from('popups')
      .select('id,name,template_type,display_rules,is_active,updated_at,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return NextResponse.json({ popups: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    let userId: string | null = null
    
    // Check for API key authentication first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7)
      const apiKeyData = await verifyApiKey(apiKey, 'write:popups')
      
      if (!apiKeyData) {
        return NextResponse.json({ error: 'Invalid or expired API key, or insufficient permissions' }, { status: 401 })
      }
      
      userId = apiKeyData.userId
    } else {
      // Fall back to session authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      userId = user.id
    }

    const json = await request.json()
    const parsed = popupSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const rulesValue = parsed.data.display_rules || displayRulesSchema.parse({})

    const { data, error } = await supabase
      .from('popups')
      .insert([{
        name: parsed.data.name,
        template_type: parsed.data.template_type,
        html_content: parsed.data.html_content,
        display_rules: rulesValue,
        is_active: parsed.data.is_active ?? false,
        user_id: userId
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ popup: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
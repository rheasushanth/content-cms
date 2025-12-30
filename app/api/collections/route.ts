import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'
import { createHash } from 'crypto'

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

// GET all collections (protected)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    let userId: string | null = null
    
    // Check for API key authentication first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7)
      const apiKeyData = await verifyApiKey(apiKey, 'read:collections')
      
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

    // Fetch collections for the authenticated user
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        schema:schemas(*)
      `)
      .eq('owner', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ collections: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create new collection (protected)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    let userId: string | null = null
    
    // Check for API key authentication first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7)
      const apiKeyData = await verifyApiKey(apiKey, 'write:collections')
      
      if (!apiKeyData) {
        return NextResponse.json({ error: 'Invalid or expired API key, or insufficient permissions' }, { status: 401 })
      }
      
      userId = apiKeyData.userId
      console.log('✅ API Key authenticated:', userId)
    } else {
      // Fall back to session authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('❌ Auth failed')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      userId = user.id
      console.log('✅ User authenticated:', userId)
    }

    // Get user's profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    // If profile doesn't exist, create it
    if (profileError || !profile) {
      console.log('⚠️ Profile not found, creating one...')
      
      // Get user email if using session auth
      let userEmail = ''
      let userName = 'User'
      
      if (!authHeader) {
        const { data: { user } } = await supabase.auth.getUser()
        userEmail = user?.email || ''
        userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
      }
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: userEmail,
          name: userName,
          role: 'user'
        }])
        .select('id')
        .single()

      if (createError || !newProfile) {
        console.error('❌ Failed to create profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create user profile. Please try again.' },
          { status: 500 }
        )
      }

      profile = newProfile
      console.log('✅ Profile created:', profile.id)
    } else {
      console.log('✅ Profile found:', profile.id)
    }

    // Parse body
    const body = await request.json()
    console.log('📨 Collections received:', JSON.stringify(body, null, 2))

    const { schema_id } = body

    // Validate
    if (!schema_id) {
      console.error('❌ Validation failed:', { schema_id })
      return NextResponse.json(
        { error: 'Missing required field: schema_id' },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed')

    // Insert collection
    const { data, error } = await supabase
      .from('collections')
      .insert([{
        schema_id: schema_id,
        owner: profile.id,
        data: {},
        published: false
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Collection insert error:', error)
      throw error
    }

    console.log('✅ Collection created successfully:', data)

    return NextResponse.json({ collection: data }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Collection creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
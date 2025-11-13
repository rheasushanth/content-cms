import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'

// GET all collections (protected)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        schema:schemas(*)
      `)
      .eq('owner', user.id)
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
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Auth failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get user's profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it
    if (profileError || !profile) {
      console.log('⚠️ Profile not found, creating one...')
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
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

    // Insert collection - collections table stores instances of schemas
    // The name/description come from the schema, not the collection itself
    const { data, error } = await supabase
      .from('collections')
      .insert([{
        schema_id: schema_id,
        owner: profile.id,
        data: {},  // Empty data object for new collection
        published: false  // Default to unpublished
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
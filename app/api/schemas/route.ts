import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'

// GET all schemas (protected - user sees only their own)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('schemas')
      .select('*')
      .eq('owner', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create new schema (protected)
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

    // Get user's profile (since owner references profiles.id)
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
    console.log('📨 Backend received:', JSON.stringify(body, null, 2))

    const { title, slug, fields, description } = body

    // Validate
    if (!title || !slug || !fields || !Array.isArray(fields)) {
      console.error('❌ Validation failed:', { 
        hasTitle: !!title, 
        hasSlug: !!slug, 
        hasFields: !!fields,
        isArray: Array.isArray(fields)
      })
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, fields' },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed')

    // Ensure slug is unique by checking for existing slugs and appending a number if needed
    let uniqueSlug = slug
    let counter = 1
    
    while (true) {
      const { data: existingSchema } = await supabase
        .from('schemas')
        .select('id')
        .eq('slug', uniqueSlug)
        .single()

      if (!existingSchema) {
        // Slug is available
        break
      }

      // Slug exists, try with a number appended
      uniqueSlug = `${slug}-${counter}`
      counter++
      
      // Safety check to prevent infinite loop
      if (counter > 1000) {
        throw new Error('Unable to generate unique slug. Please try a different collection name.')
      }
    }

    if (uniqueSlug !== slug) {
      console.log(`⚠️ Slug "${slug}" already exists, using "${uniqueSlug}" instead`)
    }

    console.log('📝 Inserting:', {
      slug: uniqueSlug,
      title,
      description: description || null,
      definition: fields,
      owner: profile.id
    })

    // Insert
    const { data, error } = await supabase
      .from('schemas')
      .insert([{
        slug: uniqueSlug,
        title: title,
        description: description || null,
        definition: fields,
        owner: profile.id
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      throw error
    }

    console.log('✅ Schema created successfully:', data)

    return NextResponse.json({ schema: data }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Schema creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
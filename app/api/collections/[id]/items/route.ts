import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'

// GET all items for a collection (items are collections with the same schema_id)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const collectionId = params.id

    // First, get the parent collection to find its schema_id
    const { data: parentCollection, error: parentError } = await supabase
      .from('collections')
      .select('schema_id, owner')
      .eq('id', collectionId)
      .eq('owner', user.id)
      .single()

    if (parentError || !parentCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Get all collections (items) with the same schema_id, excluding the parent collection itself
    const { data: items, error } = await supabase
      .from('collections')
      .select('*')
      .eq('schema_id', parentCollection.schema_id)
      .eq('owner', user.id)
      .neq('id', collectionId) // Exclude the parent collection
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ items: items || [] })
  } catch (error: any) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create new item (creates a new collection with the same schema_id)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const collectionId = params.id
    const body = await request.json()

    // Get user's profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it
    if (profileError || !profile) {
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
        return NextResponse.json(
          { error: 'Failed to create user profile. Please try again.' },
          { status: 500 }
        )
      }

      profile = newProfile
    }

    // Get the parent collection to find its schema_id
    const { data: parentCollection, error: parentError } = await supabase
      .from('collections')
      .select('schema_id, owner')
      .eq('id', collectionId)
      .eq('owner', user.id)
      .single()

    if (parentError || !parentCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Create new item (collection) with the same schema_id
    const { data: newItem, error: insertError } = await supabase
      .from('collections')
      .insert([{
        schema_id: parentCollection.schema_id,
        owner: profile.id,
        data: body.data || {},
        published: body.published !== undefined ? body.published : false
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating item:', insertError)
      throw insertError
    }

    return NextResponse.json({ item: newItem }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


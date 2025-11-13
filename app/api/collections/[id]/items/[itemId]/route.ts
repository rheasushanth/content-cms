import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'

// GET single item (collection)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const itemId = params.itemId

    // Get the item
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        schema:schemas(*)
      `)
      .eq('id', itemId)
      .eq('owner', user.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ item: data })
  } catch (error: any) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE an item (collection)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const itemId = params.itemId

    // Verify the item belongs to the user
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', itemId)
      .eq('owner', user.id)

    if (error) throw error

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update an item (collection)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const itemId = params.itemId
    const body = await request.json()

    // Update the item
    const { data, error } = await supabase
      .from('collections')
      .update({
        data: body.data,
        published: body.published !== undefined ? body.published : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('owner', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error: any) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



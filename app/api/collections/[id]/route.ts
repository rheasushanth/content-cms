import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/authMiddleware'
import { createClient } from '@/lib/auth/supabase'

// GET single collection (protected)
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const params = await context.params
      const id = params.id
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          schema:schemas(*)
        `)
        .eq('id', id)
        .eq('owner', userId) // Only get if owned by current user!
        .single()

      if (error) throw error

      return NextResponse.json({ collection: data })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
  })
}

// PUT update collection (protected)
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const params = await context.params
      const id = params.id
      const body = await request.json()
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('collections')
        .update({
          data: body.data,
          published: body.published,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner', userId) // Only update if owned by current user!
        .select()

      if (error) throw error

      return NextResponse.json({ data })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

// DELETE collection (protected)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const params = await context.params
      const id = params.id
      const supabase = await createClient()

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('owner', userId) // Only delete if owned by current user!

      if (error) throw error

      return NextResponse.json({ message: 'Collection item deleted successfully' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
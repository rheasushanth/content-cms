import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/authMiddleware'
import { createClient } from '@/lib/auth/supabase'

// GET single schema (protected)
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
        .from('schemas')
        .select('*')
        .eq('id', id)
        .eq('owner', userId) // Only get if owned by current user!
        .single()

      if (error) throw error

      return NextResponse.json({ data })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
  })
}

// PUT update schema (protected)
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
        .from('schemas')
        .update({
          title: body.title,
          description: body.description,
          definition: body.definition,
          slug: body.slug,
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

// DELETE schema (protected)
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
        .from('schemas')
        .delete()
        .eq('id', id)
        .eq('owner', userId) // Only delete if owned by current user!

      if (error) throw error

      return NextResponse.json({ message: 'Schema deleted successfully' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
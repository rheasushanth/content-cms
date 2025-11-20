import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/authMiddleware'
import { createClient } from '@/lib/auth/supabase'

// DELETE - Remove an API key (protected)
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
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('owner', userId) // Only delete if owned by current user!

      if (error) throw error

      return NextResponse.json({ message: 'API key deleted successfully' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

// PUT - Update API key (protected)
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
        .from('api_keys')
        .update({
          active: body.active,
          description: body.description
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
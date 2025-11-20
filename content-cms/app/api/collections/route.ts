import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/authMiddleware'
import { createClient } from '@/lib/auth/supabase'

// GET all collections (protected - user sees only their own)
export async function GET(request: Request) {
  return withAuth(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const schemaId = searchParams.get('schema_id')
      const supabase = await createClient()

      let query = supabase
        .from('collections')
        .select('*')
        .eq('owner', userId) // Filter by current user!
      
      if (schemaId) {
        query = query.eq('schema_id', schemaId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ data })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

// POST create new collection (protected)
export async function POST(request: Request) {
  return withAuth(request, async (req, userId) => {
    try {
      const body = await request.json()
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('collections')
        .insert([{
          schema_id: body.schema_id,
          data: body.data,
          published: body.published || false,
          owner: userId // Automatically set to current user!
        }])
        .select()

      if (error) throw error

      return NextResponse.json({ data }, { status: 201 })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
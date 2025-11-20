import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/authMiddleware'
import { createClient } from '@/lib/auth/supabase'

// GET all schemas (protected - user sees only their own)
export async function GET(request: Request) {
  return withAuth(request, async (req, userId) => {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('schemas')
        .select('*')
        .eq('owner', userId) // Filter by current user!
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ data })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

// POST create new schema (protected)
export async function POST(request: Request) {
  return withAuth(request, async (req, userId) => {
    try {
      const body = await request.json()
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('schemas')
        .insert([{
          slug: body.slug,
          title: body.title,
          description: body.description,
          definition: body.definition,
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
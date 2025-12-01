import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase'

// POST - Create a new form submission
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { form_name, form_data } = body

    if (!form_name || !form_data) {
      return NextResponse.json(
        { error: 'form_name and form_data are required' },
        { status: 400 }
      )
    }

    // Get request metadata
    const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const user_agent = request.headers.get('user-agent') || 'unknown'

    // Insert form submission
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        user_id: user.id,
        form_name,
        form_data,
        ip_address,
        user_agent
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating form submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error: any) {
    console.error('Form submission error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// GET - Retrieve form submissions for authenticated user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const form_name = searchParams.get('form_name')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('form_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by form name if provided
    if (form_name) {
      query = query.eq('form_name', form_name)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching form submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      submissions: data || [],
      total: count || data?.length || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Form submissions fetch error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

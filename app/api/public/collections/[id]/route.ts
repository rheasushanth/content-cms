import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withApiKey } from '@/lib/middleware/apiKeyAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET single collection (protected with API key)
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withApiKey(request, async (req, { key }) => {
    try {
      const params = await context.params
      const id = params.id

      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .eq('published', true) // Public API only returns published
        .single()

      if (error) throw error

      return NextResponse.json({ data, meta: { api_key_id: key.id } })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
  })
}

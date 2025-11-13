import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withApiKey } from '@/lib/middleware/apiKeyAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET all collections (protected with API key)
export async function GET(request: Request) {
  return withApiKey(request, async (req, { key }) => {
    try {
      const { searchParams } = new URL(req.url)
      const schemaId = searchParams.get('schema_id')
      const published = searchParams.get('published')

      let query = supabase.from('collections').select('*')
      
      if (schemaId) {
        query = query.eq('schema_id', schemaId)
      }

      // Public API only returns published content
      if (published !== 'false') {
        query = query.eq('published', true)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ data, meta: { api_key_id: key.id } })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'
import { z } from 'zod'

const displayRulesSchema = z.object({
  delay: z.number().min(0).max(300).default(0),
  pages: z.array(z.string()).default(['all']),
  trigger: z.enum(['on-load', 'exit-intent']).default('on-load'),
  frequency: z.enum(['once-per-session', 'always', 'once-per-user', 'once-per-page']).default('once-per-session')
})

const popupSchema = z.object({
  name: z.string().min(2),
  template_type: z.enum(['email-capture','discount','newsletter','exit-intent','announcement','custom']),
  html_content: z.string().min(1),
  display_rules: displayRulesSchema.optional(),
  is_active: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data, error } = await supabase
      .from('popups')
      .select('id,name,template_type,display_rules,is_active,updated_at,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ popups: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = popupSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const rulesValue = parsed.data.display_rules || displayRulesSchema.parse({})

    const { data, error } = await supabase
      .from('popups')
      .insert([{
        name: parsed.data.name,
        template_type: parsed.data.template_type,
        html_content: parsed.data.html_content,
        display_rules: rulesValue,
        is_active: parsed.data.is_active ?? false,
        user_id: user.id
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ popup: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

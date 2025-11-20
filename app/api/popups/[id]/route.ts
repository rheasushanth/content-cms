import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase'
import { z } from 'zod'

const displayRulesSchema = z.object({
  delay: z.number().min(0).max(300).default(0),
  pages: z.array(z.string()).default(['all']),
  trigger: z.enum(['on-load', 'exit-intent']).default('on-load'),
  frequency: z.enum(['once-per-session', 'always', 'once-per-user', 'once-per-page']).default('once-per-session')
})

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  template_type: z.enum(['email-capture','discount','newsletter','exit-intent','announcement','custom']).optional(),
  html_content: z.string().min(1).optional(),
  display_rules: displayRulesSchema.optional(),
  is_active: z.boolean().optional()
})

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data, error } = await supabase
      .from('popups')
      .select('id,name,template_type,html_content,display_rules,is_active,updated_at,created_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    if (error) throw error
    return NextResponse.json({ popup: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const update: any = {}
    if (parsed.data.name !== undefined) update.name = parsed.data.name
    if (parsed.data.template_type !== undefined) update.template_type = parsed.data.template_type
    if (parsed.data.html_content !== undefined) update.html_content = parsed.data.html_content
    if (parsed.data.display_rules !== undefined) update.display_rules = parsed.data.display_rules
    if (parsed.data.is_active !== undefined) update.is_active = parsed.data.is_active
    update.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('popups')
      .update(update)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ popup: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error } = await supabase
      .from('popups')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ message: 'Popup deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

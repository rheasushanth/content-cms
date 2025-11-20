import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/auth/supabase'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const apiKey = request.nextUrl.searchParams.get('key')

    if (!apiKey) {
      return NextResponse.json({ popups: [] })
    }

    // Hash the api_key to match the stored version
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    // Validate key and get owner/user_id
    const { data: keyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('owner, active, expires_at, scopes')
      .eq('key_hash', keyHash)
      .eq('active', true)
      .single()

    if (keyError || !keyRecord) {
      return NextResponse.json({ popups: [] })
    }

    // Check expiry if exists
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return NextResponse.json({ popups: [] })
    }

    // Enforce scope: require read:popups
    const scopes: string[] = (keyRecord as any).scopes || []
    const hasPopupScope = Array.isArray(scopes) && scopes.includes('read:popups')
    if (!hasPopupScope) {
      const res = NextResponse.json({ popups: [] })
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Fetch popups for that owner
    const { data: popups, error: popupError } = await supabase
      .from('popups')
      .select('id,name,html_content,display_rules,is_active')
      .eq('user_id', keyRecord.owner)
      .eq('is_active', true)

    if (popupError) throw popupError

    const res = NextResponse.json({ popups: popups ?? [] })
    res.headers.set('Cache-Control', 'no-store')
    return res

  } catch (err: any) {
    console.error("Public popups error:", err.message)
    const res = NextResponse.json({ popups: [] })
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

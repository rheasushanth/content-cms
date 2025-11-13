import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return NextResponse.json({ message: 'Logout successful' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 400 }
    )
  }
}
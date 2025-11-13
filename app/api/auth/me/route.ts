import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/supabase'

export async function GET(request: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    )
  }
}
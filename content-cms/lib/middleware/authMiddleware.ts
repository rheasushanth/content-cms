import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/supabase'

export async function withAuth(
  request: Request,
  handler: (request: Request, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    return handler(request, user.id)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}
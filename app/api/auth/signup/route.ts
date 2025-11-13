import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    const supabase = await createClient()

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    })

    if (authError) throw authError

    // Create profile entry
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: authData.user.email,
          name: name || email.split('@')[0],
          role: 'user'
        }])

      if (profileError && profileError.code !== '23505') {
        console.error('Profile creation error:', profileError)
      }
    }

    return NextResponse.json({
      message: 'Signup successful!',
      user: authData.user
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 400 }
    )
  }
}
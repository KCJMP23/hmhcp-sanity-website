import { supabaseAdmin, type AdminUser } from './supabase'
import { verifyPassword } from '@/lib/server/crypto'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Use a safe default secret in development to avoid crashes when env is missing
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-jwt-secret' : undefined)

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Generate one using: openssl rand -base64 32')
}
const SESSION_COOKIE_NAME = 'admin_session_jwt'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface JWTPayload {
  userId: string
  email: string
  role: string
  exp: number
}

export async function authenticateAdminSimple(email: string, password: string) {
  const { data: user, error: userError } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (userError || !user) {
    throw new Error('Invalid credentials')
  }

  // Production password verification only
  const validPassword = await verifyPassword(password, user.password_hash)
  
  if (!validPassword) {
    throw new Error('Invalid credentials')
  }

  // Create JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor((Date.now() + SESSION_DURATION) / 1000)
    },
    JWT_SECRET!
  )

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + SESSION_DURATION),
    path: '/'
  })

  return { user: omitPasswordHash(user), token }
}

export async function getCurrentAdminSimple() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as JWTPayload

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', payload.userId)
      .eq('is_active', true)
      .single()

    if (error || !user) return null

    return {
      user: omitPasswordHash(user),
      session: { token, expires_at: new Date(payload.exp * 1000).toISOString() }
    }
  } catch (error) {
    return null
  }
}

export async function logoutAdminSimple() {
  const cookieStore = await cookies()
  
  // Clear cookie
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  })
}

function omitPasswordHash(user: any): AdminUser {
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}
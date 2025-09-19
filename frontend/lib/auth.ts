import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import logger from '@/lib/logging/winston-logger'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Generate one using: openssl rand -base64 32')
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token.value, JWT_SECRET) as any
    
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'viewer'
    }
  } catch (error) {
    logger.error('Error getting current user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
}

export async function setAuthCookie(user: User) {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

// Development-only bypass for Sanity Studio access
export function isDevelopmentMode() {
  return process.env.NODE_ENV === 'development'
}

export async function verifyAuth(request: any): Promise<{ authenticated: boolean; user?: User }> {
  const user = await getCurrentUser()
  return {
    authenticated: !!user,
    user: user || undefined
  }
}
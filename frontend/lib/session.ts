// Server-only module - do not import in client components
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { logger } from '@/lib/logger';

const secretKey = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET

if (!secretKey) {
  throw new Error('ADMIN_SESSION_SECRET or JWT_SECRET environment variable is required. Generate one using: openssl rand -base64 32')
}

const encodedKey = new TextEncoder().encode(secretKey)

export interface SessionPayload extends JWTPayload {
  userId: string
  email: string
  role: string
  expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch (error) {
    logger.error('Failed to verify session', { error: error instanceof Error ? error : new Error(String('Failed to verify session')), action: 'error_logged' })
    return null
  }
}

export async function createSession(userId: string, email: string, role: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, email, role, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function updateSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) {
    return null
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })

  return payload
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    return null
  }

  return { 
    isAuth: true, 
    userId: session.userId,
    email: session.email,
    role: session.role
  }
})

export async function logout() {
  await deleteSession()
}
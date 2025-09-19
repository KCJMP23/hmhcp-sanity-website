// Server-only module - do not import in client components
import bcrypt from 'bcryptjs'

/**
 * Server-only cryptographic utilities
 * This module ensures bcrypt is only used server-side
 */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateSalt(rounds: number = 10): Promise<string> {
  return bcrypt.genSalt(rounds)
}
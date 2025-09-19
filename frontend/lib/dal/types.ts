/**
 * Data Access Layer Types
 * Common interface definitions for the healthcare platform
 */

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  metadata?: Record<string, any>
}

export interface UserSession {
  id: string
  user_id: string
  token: string
  expires_at: string
  ip_address?: string
  user_agent?: string
  created_at: string
  last_activity: string
}

export interface DatabaseConnection {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
}
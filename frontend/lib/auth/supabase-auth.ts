// Re-export from appropriate modules
// This file provides a unified interface for auth functions
// Import from supabase-client for client components
// Import from supabase-server for server components

export type { AdminUser, AuthResponse } from './supabase-client'

// Client-side exports (use these in client components)
export {
  supabase,
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  getSessionClient,
  getUserClient,
  onAuthStateChange,
  signInWithPassword,
  signUpWithPassword,
  isAdmin,
  requireAdmin
} from './supabase-client'

// Server-side exports (use these in server components)
export {
  supabaseAdmin,
  createServerClient,
  getCurrentSession,
  getCurrentUser,
  requireAuth,
  requireRole,
  signOutServer
} from './supabase-server'
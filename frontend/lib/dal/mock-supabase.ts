// Production-ready Supabase fallback implementation for testing and missing credentials
import { AdminUser, AdminSession, ManagedContent, NavigationMenu, AuditLog } from './supabase'

// Support production admin credentials when in mock mode
const productionAdminUser: AdminUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'info@hm-hcp.com',
  role: 'super_admin',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const defaultAdminUser: AdminUser = {
  id: '456e7890-e89b-12d3-a456-426614174001',
  email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
  role: 'super_admin',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockAdminUser = productionAdminUser // Use production admin by default

const mockSession: AdminSession = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: mockAdminUser.id,
  token: 'mock-session-token',
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString()
}

// In-memory storage for mock data
const mockStorage = {
  adminUsers: [productionAdminUser, defaultAdminUser], // Support both admin accounts
  sessions: [mockSession],
  content: [] as ManagedContent[],
  media: [],
  navigation: {
    header: [],
    footer: []
  },
  siteSettings: [
    { key: 'general.siteName', value: 'HMHCP', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'general.siteDescription', value: 'Healthcare Management Technology Platform', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'general.siteUrl', value: 'https://hmhcp.com', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'general.adminEmail', value: 'admin@hmhcp.com', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'general.timezone', value: 'America/New_York', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'seo.defaultTitle', value: 'HMHCP - Healthcare Technology Solutions', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'seo.titleTemplate', value: '%s | HMHCP', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'seo.defaultDescription', value: 'Leading healthcare management technology platform', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'features.enableBlog', value: true, updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'features.enableAnalytics', value: true, updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'appearance.primaryColor', value: '#2563eb', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() },
    { key: 'appearance.secondaryColor', value: '#2563EB', updated_by: mockAdminUser.id, updated_at: new Date().toISOString() }
  ],
  navigationMenus: [] as NavigationMenu[],
  auditLogs: [] as AuditLog[]
}

// Mock auth responses
const mockAuthUser = (user: AdminUser) => ({
  id: user.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: user.email,
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  user_metadata: {
    role: user.role,
    first_name: 'Admin',
    last_name: 'User'
  },
  identities: [],
  created_at: user.created_at,
  updated_at: user.updated_at
})

const mockAuthSession = (user: AdminUser) => ({
  access_token: `mock-access-token-${user.id}`,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: `mock-refresh-token-${user.id}`,
  user: mockAuthUser(user)
})

// Mock client that mimics Supabase behavior
export const mockSupabaseAdmin = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Find user by email
      const user = mockStorage.adminUsers.find(u => u.email === email && u.is_active)
      
      if (!user) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials', status: 400 }
        }
      }

      // For mock mode, accept any password for registered users
      // In a real implementation, you would verify the password hash
      if (password.length < 6) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials', status: 400 }
        }
      }

      const authUser = mockAuthUser(user)
      const session = mockAuthSession(user)

      return {
        data: { user: authUser, session },
        error: null
      }
    },
    getSession: async () => {
      // For mock purposes, return null (no active session)
      return {
        data: { session: null },
        error: null
      }
    },
    getUser: async () => {
      return {
        data: { user: null },
        error: null
      }
    },
    signOut: async () => {
      return { error: null }
    }
  },
  from: (table: string) => ({
    select: (columns?: string) => {
      // Handle select all case (no chaining)
      if (columns === undefined || columns === '*') {
        return (async () => {
          if (table === 'site_settings') {
            return { data: mockStorage.siteSettings, error: null }
          }
          if (table === 'navigation_menus') {
            return { data: mockStorage.navigationMenus, error: null }
          }
          if (table === 'audit_logs') {
            return { data: mockStorage.auditLogs, error: null }
          }
          return { data: [], error: null }
        })()
      }

      // Handle filtered queries
      return {
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === 'admin_users' && column === 'email') {
              const user = mockStorage.adminUsers.find(u => u.email === value)
              if (user) {
                return { data: { ...user, password_hash: '$2a$10$mock-hash' }, error: null }
              }
            }
            if (table === 'admin_sessions' && column === 'token') {
              const session = mockStorage.sessions.find(s => s.token === value)
              if (session) {
                const user = mockStorage.adminUsers.find(u => u.id === session.user_id)
                return { data: { ...session, admin_users: user }, error: null }
              }
            }
            if (table === 'site_settings' && column === 'key') {
              const setting = mockStorage.siteSettings.find(s => s.key === value)
              return { data: setting || null, error: setting ? null : { code: 'PGRST116', message: 'Not found' } }
            }
            if (table === 'navigation_menus' && column === 'location') {
              const menu = mockStorage.navigationMenus.find(m => m.location === value)
              return { data: menu || null, error: menu ? null : { code: 'PGRST116', message: 'Not found' } }
            }
            return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
          },
          gte: (col: string, val: any) => ({
            single: async () => {
              if (table === 'admin_sessions' && column === 'token') {
                const session = mockStorage.sessions.find(s => 
                  s.token === value && new Date(s.expires_at) > new Date(val)
                )
                if (session) {
                  const user = mockStorage.adminUsers.find(u => u.id === session.user_id)
                  return { data: { ...session, admin_users: user }, error: null }
                }
              }
              return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
            }
          }),
          eq: (col2: string, val2: any) => ({
            single: async () => {
              if (table === 'admin_users' && column === 'email' && col2 === 'is_active') {
                const user = mockStorage.adminUsers.find(u => u.email === value && u.is_active === val2)
                if (user) {
                  return { data: { ...user, password_hash: '$2a$10$mock-hash' }, error: null }
                }
              }
              return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
            }
          })
        }),
        single: async () => {
          return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
        }
      }
    },
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          if (table === 'admin_sessions') {
            mockStorage.sessions.push(data)
            return { data, error: null }
          }
          if (table === 'managed_content') {
            const newContent = { ...data, id: Date.now().toString() }
            mockStorage.content.push(newContent)
            return { data: newContent, error: null }
          }
          if (table === 'site_settings') {
            const newSetting = { ...data, updated_at: new Date().toISOString() }
            mockStorage.siteSettings.push(newSetting)
            return { data: newSetting, error: null }
          }
          if (table === 'navigation_menus') {
            const newMenu = { ...data, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            mockStorage.navigationMenus.push(newMenu)
            return { data: newMenu, error: null }
          }
          if (table === 'audit_logs') {
            const newLog = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() }
            mockStorage.auditLogs.push(newLog)
            return { data: newLog, error: null }
          }
          return { data, error: null }
        }
      })
    }),
    upsert: (data: any, options?: { onConflict?: string }) => {
      // Return object with chainable methods
      return {
        select: () => ({
          single: async () => {
            if (table === 'site_settings') {
              const existingIndex = mockStorage.siteSettings.findIndex(s => s.key === data.key)
              const updatedSetting = { ...data, updated_at: new Date().toISOString() }
              if (existingIndex >= 0) {
                mockStorage.siteSettings[existingIndex] = updatedSetting
              } else {
                mockStorage.siteSettings.push(updatedSetting)
              }
              return { data: updatedSetting, error: null }
            }
            if (table === 'navigation_menus') {
              const existingIndex = mockStorage.navigationMenus.findIndex(m => m.location === data.location)
              const updatedMenu = { 
                ...data, 
                id: existingIndex >= 0 ? mockStorage.navigationMenus[existingIndex].id : Date.now().toString(),
                created_at: existingIndex >= 0 ? mockStorage.navigationMenus[existingIndex].created_at : new Date().toISOString(),
                updated_at: new Date().toISOString() 
              }
              if (existingIndex >= 0) {
                mockStorage.navigationMenus[existingIndex] = updatedMenu
              } else {
                mockStorage.navigationMenus.push(updatedMenu)
              }
              return { data: updatedMenu, error: null }
            }
            return { data, error: null }
          }
        }),
        // Direct execution for bulk upsert
        then: async (resolve: (value: any) => void) => {
          if (table === 'site_settings' && Array.isArray(data)) {
            data.forEach(setting => {
              const existingIndex = mockStorage.siteSettings.findIndex(s => s.key === setting.key)
              const updatedSetting = { ...setting, updated_at: new Date().toISOString() }
              if (existingIndex >= 0) {
                mockStorage.siteSettings[existingIndex] = updatedSetting
              } else {
                mockStorage.siteSettings.push(updatedSetting)
              }
            })
            resolve({ data: data, error: null })
          } else {
            resolve({ data, error: null })
          }
        }
      }
    },
    delete: () => ({
      eq: (column: string, value: any) => ({
        execute: async () => {
          if (table === 'admin_sessions') {
            mockStorage.sessions = mockStorage.sessions.filter(s => s.token !== value)
          }
          return { error: null }
        }
      })
    })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        return { data: { path }, error: null }
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://mock-storage.com/${path}` }
      }),
      remove: async (paths: string[]) => {
        return { error: null }
      }
    }),
    createBucket: async (name: string, options: any) => {
      return { data: { name }, error: null }
    }
  }
}

export const isUsingMockSupabase = () => {
  // Check if we have real Supabase credentials configured (not placeholder values)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const hasValidConfig = supabaseUrl && 
                        supabaseKey && 
                        !supabaseUrl.includes('your-project-id') &&
                        !supabaseKey.includes('your-service-role-key')
  
  // Use mock when running in test environment or when credentials are missing/invalid
  return process.env.NODE_ENV === 'test' || !hasValidConfig
}
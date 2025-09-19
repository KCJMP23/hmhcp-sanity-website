import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createDatabaseAdapter } from '@/lib/db/adapter'
import JSZip from 'jszip'

export interface BackupConfig {
  id?: string
  name: string
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly'
  retention_days: number
  include_media: boolean
  include_database: boolean
  include_content: boolean
  include_settings: boolean
  encryption_enabled: boolean
  storage_location: 'local' | 'cloud' | 'both'
  last_backup?: string
  next_backup?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Backup {
  id?: string
  config_id?: string
  name: string
  type: 'manual' | 'scheduled' | 'auto'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  size_bytes?: number
  file_count?: number
  tables_backed_up?: string[]
  storage_path?: string
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at?: string
}

export interface RestorePoint {
  backup_id: string
  backup_name: string
  created_at: string
  size_bytes: number
  type: string
  status: string
  can_restore: boolean
}

// Backup Configuration Functions
export async function getAllBackupConfigs(): Promise<BackupConfig[]> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.backup_configs || []
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('backup_configs')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching backup configs:', error)
    return []
  }
  
  return data || []
}

export async function getBackupConfig(id: string): Promise<BackupConfig | null> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.backup_configs?.find((c: any) => c.id === id) || null
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('backup_configs')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching backup config:', error)
    return null
  }
  
  return data
}

export async function updateBackupConfig(config: BackupConfig): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.backup_configs) adapter.data.backup_configs = []
    
    if (config.id) {
      const index = adapter.data.backup_configs.findIndex((c: any) => c.id === config.id)
      if (index >= 0) {
        adapter.data.backup_configs[index] = { ...config, updated_at: new Date().toISOString() }
      }
    } else {
      config.id = Date.now().toString()
      config.created_at = new Date().toISOString()
      adapter.data.backup_configs.push(config)
    }
    
    return { success: true }
  }
  
  if (config.id) {
    const { error } = await adapter.supabaseClient
      .from('backup_configs')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', config.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await adapter.supabaseClient
      .from('backup_configs')
      .insert({
        ...config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { success: true }
}

// Backup History Functions
export async function getAllBackups(): Promise<Backup[]> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.backups || []
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('backups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Error fetching backups:', error)
    return []
  }
  
  return data || []
}

export async function getBackup(id: string): Promise<Backup | null> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.backups?.find((b: any) => b.id === id) || null
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('backups')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching backup:', error)
    return null
  }
  
  return data
}

export async function createBackup(backup: Backup): Promise<{ success: boolean; error?: string; id?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.backups) adapter.data.backups = []
    
    backup.id = Date.now().toString()
    backup.created_at = new Date().toISOString()
    adapter.data.backups.push(backup)
    
    return { success: true, id: backup.id }
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('backups')
    .insert({
      ...backup,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, id: data.id }
}

export async function updateBackupStatus(
  id: string, 
  status: Backup['status'], 
  updates?: Partial<Backup>
): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.backups) return { success: false, error: 'No backups found' }
    
    const index = adapter.data.backups.findIndex((b: any) => b.id === id)
    if (index >= 0) {
      adapter.data.backups[index] = {
        ...adapter.data.backups[index],
        ...updates,
        status,
        completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined
      }
    }
    
    return { success: true }
  }
  
  const updateData: any = { status, ...updates }
  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString()
  }
  
  const { error } = await adapter.supabaseClient
    .from('backups')
    .update(updateData)
    .eq('id', id)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Get available restore points
export async function getRestorePoints(): Promise<RestorePoint[]> {
  const backups = await getAllBackups()
  
  return backups
    .filter(backup => backup.status === 'completed')
    .map(backup => ({
      backup_id: backup.id!,
      backup_name: backup.name,
      created_at: backup.created_at!,
      size_bytes: backup.size_bytes || 0,
      type: backup.type,
      status: backup.status,
      can_restore: true
    }))
}

// Database backup functions
export async function backupDatabase(): Promise<{ data: any; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    // For local adapter, return the entire data object
    return { data: adapter.data }
  }
  
  try {
    // For Supabase, export data from all tables
    const tables = [
      'users',
      'content_pages',
      'blog_posts',
      'cms_media',
      'seo_settings',
      'page_seo',
      'email_templates',
      'email_campaigns',
      'email_contacts',
      'email_settings',
      'backup_configs',
      'backups'
    ]
    
    const backupData: Record<string, any[]> = {}
    
    for (const table of tables) {
      const { data, error } = await adapter.supabaseClient
        .from(table)
        .select('*')
      
      if (!error && data) {
        backupData[table] = data
      }
    }
    
    return { data: backupData }
  } catch (error) {
    return { data: null, error: 'Failed to backup database' }
  }
}

// Restore database from backup
export async function restoreDatabase(backupData: any): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    // For local adapter, replace the data
    adapter.data = backupData
    return { success: true }
  }
  
  try {
    // For Supabase, this would require more complex logic
    // including handling foreign key constraints, etc.
    // This is a placeholder for the actual implementation
    
    return { success: false, error: 'Database restore not implemented for Supabase' }
  } catch (error) {
    return { success: false, error: 'Failed to restore database' }
  }
}

// Create a downloadable backup file
export async function createBackupFile(config: BackupConfig): Promise<{ blob: Blob; filename: string } | null> {
  try {
    const zip = new JSZip()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    // Add backup metadata
    const metadata = {
      created_at: new Date().toISOString(),
      config_name: config.name,
      version: '1.0',
      includes: {
        database: config.include_database,
        content: config.include_content,
        media: config.include_media,
        settings: config.include_settings
      }
    }
    
    zip.file('backup-metadata.json', JSON.stringify(metadata, null, 2))
    
    // Backup database
    if (config.include_database) {
      const { data: dbData, error } = await backupDatabase()
      if (!error && dbData) {
        zip.file('database-backup.json', JSON.stringify(dbData, null, 2))
      }
    }
    
    // Backup content
    if (config.include_content) {
      const adapter = await createDatabaseAdapter()
      
      if (adapter.type === 'supabase') {
        // Export content pages
        const { data: pages } = await adapter.supabaseClient
          .from('content_pages')
          .select('*')
        
        if (pages) {
          zip.file('content/pages.json', JSON.stringify(pages, null, 2))
        }
        
        // Export blog posts
        const { data: posts } = await adapter.supabaseClient
          .from('blog_posts')
          .select('*')
        
        if (posts) {
          zip.file('content/blog-posts.json', JSON.stringify(posts, null, 2))
        }
      }
    }
    
    // Backup settings
    if (config.include_settings) {
      const adapter = await createDatabaseAdapter()
      
      if (adapter.type === 'supabase') {
        // Export SEO settings
        const { data: seoSettings } = await adapter.supabaseClient
          .from('seo_settings')
          .select('*')
          .single()
        
        if (seoSettings) {
          zip.file('settings/seo.json', JSON.stringify(seoSettings, null, 2))
        }
        
        // Export email settings
        const { data: emailSettings } = await adapter.supabaseClient
          .from('email_settings')
          .select('*')
          .single()
        
        if (emailSettings) {
          zip.file('settings/email.json', JSON.stringify(emailSettings, null, 2))
        }
      }
    }
    
    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' })
    const filename = `backup-${config.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.zip`
    
    return { blob, filename }
  } catch (error) {
    console.error('Error creating backup file:', error)
    return null
  }
}

// Calculate backup size
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Cleanup old backups based on retention policy
export async function cleanupOldBackups(retentionDays: number): Promise<{ deleted: number; error?: string }> {
  const adapter = await createDatabaseAdapter()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  
  if (adapter.type === 'local') {
    if (!adapter.data.backups) return { deleted: 0 }
    
    const before = adapter.data.backups.length
    adapter.data.backups = adapter.data.backups.filter(
      (backup: any) => new Date(backup.created_at!) > cutoffDate
    )
    
    return { deleted: before - adapter.data.backups.length }
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('backups')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select()
  
  if (error) {
    return { deleted: 0, error: error.message }
  }
  
  return { deleted: data?.length || 0 }
}
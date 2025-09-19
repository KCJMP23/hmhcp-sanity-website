import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createDatabaseAdapter } from '@/lib/db/adapter'

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  body: string
  variables: string[]
  category: 'welcome' | 'appointment' | 'reminder' | 'newsletter' | 'notification' | 'custom'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface EmailCampaign {
  id?: string
  name: string
  template_id: string
  recipient_type: 'all' | 'patients' | 'providers' | 'staff' | 'custom'
  recipient_list?: string[]
  scheduled_at?: string
  sent_at?: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  stats?: {
    total_sent: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  created_at?: string
  updated_at?: string
}

export interface EmailContact {
  id?: string
  email: string
  first_name: string
  last_name: string
  type: 'patient' | 'provider' | 'staff' | 'other'
  tags: string[]
  is_subscribed: boolean
  last_emailed?: string
  created_at?: string
  updated_at?: string
}

export interface EmailSettings {
  id?: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_secure?: boolean
  from_name: string
  from_email: string
  reply_to_email?: string
  footer_text?: string
  unsubscribe_url?: string
  logo_url?: string
  primary_color?: string
  created_at?: string
  updated_at?: string
}

// Email Template Functions
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    const templates = adapter.data.email_templates || []
    return templates.filter((t: any) => t.is_active)
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('email_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching email templates:', error)
    return []
  }
  
  return data || []
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.email_templates?.find((t: any) => t.id === id) || null
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching email template:', error)
    return null
  }
  
  return data
}

export async function updateEmailTemplate(template: EmailTemplate): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.email_templates) adapter.data.email_templates = []
    
    if (template.id) {
      const index = adapter.data.email_templates.findIndex((t: any) => t.id === template.id)
      if (index >= 0) {
        adapter.data.email_templates[index] = { ...template, updated_at: new Date().toISOString() }
      }
    } else {
      template.id = Date.now().toString()
      template.created_at = new Date().toISOString()
      adapter.data.email_templates.push(template)
    }
    
    return { success: true }
  }
  
  if (template.id) {
    const { error } = await adapter.supabaseClient
      .from('email_templates')
      .update({
        ...template,
        updated_at: new Date().toISOString()
      })
      .eq('id', template.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await adapter.supabaseClient
      .from('email_templates')
      .insert({
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { success: true }
}

// Email Campaign Functions
export async function getAllEmailCampaigns(): Promise<EmailCampaign[]> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.email_campaigns || []
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching email campaigns:', error)
    return []
  }
  
  return data || []
}

export async function getEmailCampaign(id: string): Promise<EmailCampaign | null> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.email_campaigns?.find((c: any) => c.id === id) || null
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching email campaign:', error)
    return null
  }
  
  return data
}

export async function updateEmailCampaign(campaign: EmailCampaign): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.email_campaigns) adapter.data.email_campaigns = []
    
    if (campaign.id) {
      const index = adapter.data.email_campaigns.findIndex((c: any) => c.id === campaign.id)
      if (index >= 0) {
        adapter.data.email_campaigns[index] = { ...campaign, updated_at: new Date().toISOString() }
      }
    } else {
      campaign.id = Date.now().toString()
      campaign.created_at = new Date().toISOString()
      adapter.data.email_campaigns.push(campaign)
    }
    
    return { success: true }
  }
  
  if (campaign.id) {
    const { error } = await adapter.supabaseClient
      .from('email_campaigns')
      .update({
        ...campaign,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await adapter.supabaseClient
      .from('email_campaigns')
      .insert({
        ...campaign,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { success: true }
}

// Email Contact Functions
export async function getAllEmailContacts(): Promise<EmailContact[]> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.email_contacts || []
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('email_contacts')
    .select('*')
    .eq('is_subscribed', true)
    .order('type', { ascending: true })
    .order('last_name', { ascending: true })
  
  if (error) {
    console.error('Error fetching email contacts:', error)
    return []
  }
  
  return data || []
}

export async function updateEmailContact(contact: EmailContact): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.email_contacts) adapter.data.email_contacts = []
    
    if (contact.id) {
      const index = adapter.data.email_contacts.findIndex((c: any) => c.id === contact.id)
      if (index >= 0) {
        adapter.data.email_contacts[index] = { ...contact, updated_at: new Date().toISOString() }
      }
    } else {
      contact.id = Date.now().toString()
      contact.created_at = new Date().toISOString()
      adapter.data.email_contacts.push(contact)
    }
    
    return { success: true }
  }
  
  if (contact.id) {
    const { error } = await adapter.supabaseClient
      .from('email_contacts')
      .update({
        ...contact,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await adapter.supabaseClient
      .from('email_contacts')
      .insert({
        ...contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { success: true }
}

// Email Settings Functions
export async function getEmailSettings(): Promise<EmailSettings | null> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    return adapter.data.email_settings || {
      from_name: 'Healthcare Management',
      from_email: 'noreply@hm-hcp.com'
    }
  }
  
  const { data, error } = await adapter.supabaseClient
    .from('email_settings')
    .select('*')
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching email settings:', error)
    return null
  }
  
  return data || {
    from_name: 'Healthcare Management',
    from_email: 'noreply@hm-hcp.com'
  }
}

export async function updateEmailSettings(settings: EmailSettings): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    adapter.data.email_settings = { ...settings, updated_at: new Date().toISOString() }
    return { success: true }
  }
  
  const { data: existing } = await adapter.supabaseClient
    .from('email_settings')
    .select('id')
    .single()
  
  if (existing) {
    const { error } = await adapter.supabaseClient
      .from('email_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await adapter.supabaseClient
      .from('email_settings')
      .insert({
        ...settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { success: true }
}

// Helper function to replace template variables
export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, value)
  })
  
  return result
}

// Send email function (placeholder - integrate with SMTP service)
export async function sendEmail(
  to: string | string[],
  subject: string,
  body: string,
  settings?: EmailSettings
): Promise<{ success: boolean; error?: string }> {
  // This is a placeholder function
  // In production, integrate with services like:
  // - SendGrid
  // - AWS SES
  // - Mailgun
  // - Postmark
  // - SMTP server
  
  console.log('Email would be sent:', {
    to,
    subject,
    body: body.substring(0, 100) + '...',
    settings
  })
  
  // For now, return success
  return { success: true }
}
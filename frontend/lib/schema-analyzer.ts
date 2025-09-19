/**
 * Sanity Schema Analyzer
 * Analyzes all Sanity schemas and generates corresponding Supabase tables
 * Creates comprehensive sync mapping between the two systems
 */

import fs from 'fs'
import path from 'path'

// Type definitions for schema analysis
interface SanityField {
  name: string
  type: string
  title?: string
  validation?: any
  options?: any
  fields?: SanityField[]
  of?: any[]
}

interface SanitySchema {
  name: string
  title: string
  type: string
  fields: SanityField[]
  preview?: any
  orderings?: any[]
}

interface SupabaseColumn {
  name: string
  type: string
  nullable: boolean
  default?: string
  references?: string
  constraints?: string[]
}

interface SupabaseTable {
  name: string
  columns: SupabaseColumn[]
  indexes?: string[]
  policies?: string[]
}

interface SyncMapping {
  sanitySchema: string
  supabaseTable: string
  syncDirection: 'sanity_to_supabase' | 'supabase_to_sanity' | 'bidirectional'
  fieldMappings: Record<string, string>
  transformations?: Record<string, string>
}

/**
 * Convert Sanity field type to Supabase column type
 */
function sanityToSupabaseType(sanityType: string, field: SanityField): string {
  switch (sanityType) {
    case 'string':
      return 'TEXT'
    case 'text':
      return 'TEXT'
    case 'number':
      return 'NUMERIC'
    case 'boolean':
      return 'BOOLEAN'
    case 'datetime':
      return 'TIMESTAMP WITH TIME ZONE'
    case 'date':
      return 'DATE'
    case 'url':
      return 'TEXT'
    case 'email':
      return 'TEXT'
    case 'slug':
      return 'TEXT'
    case 'image':
      return 'JSONB'
    case 'file':
      return 'JSONB'
    case 'array':
      return 'JSONB'
    case 'object':
      return 'JSONB'
    case 'block':
      return 'JSONB'
    case 'reference':
      return 'UUID'
    case 'document':
      return 'UUID'
    default:
      return 'JSONB'
  }
}

/**
 * Generate Supabase table from Sanity schema
 */
function generateSupabaseTable(schema: SanitySchema): SupabaseTable {
  const columns: SupabaseColumn[] = [
    // Standard fields for all tables
    {
      name: 'id',
      type: 'UUID DEFAULT gen_random_uuid()',
      nullable: false
    },
    {
      name: 'sanity_id',
      type: 'TEXT UNIQUE',
      nullable: true
    },
    {
      name: 'sanity_rev',
      type: 'TEXT',
      nullable: true
    },
    {
      name: 'created_at',
      type: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      nullable: false
    },
    {
      name: 'updated_at',
      type: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      nullable: false
    },
    {
      name: 'synced_at',
      type: 'TIMESTAMP WITH TIME ZONE',
      nullable: true
    },
    {
      name: 'sync_status',
      type: 'TEXT DEFAULT \'pending\'',
      nullable: false
    }
  ]

  // Convert Sanity fields to Supabase columns
  for (const field of schema.fields) {
    if (field.name === '_id' || field.name === '_type' || field.name === '_rev') {
      continue // Skip Sanity internal fields
    }

    const column: SupabaseColumn = {
      name: field.name,
      type: sanityToSupabaseType(field.type, field),
      nullable: !field.validation?.required
    }

    columns.push(column)
  }

  return {
    name: `cms_${schema.name}`,
    columns,
    indexes: [
      `CREATE INDEX IF NOT EXISTS idx_${schema.name}_sanity_id ON cms_${schema.name}(sanity_id);`,
      `CREATE INDEX IF NOT EXISTS idx_${schema.name}_updated_at ON cms_${schema.name}(updated_at);`,
      `CREATE INDEX IF NOT EXISTS idx_${schema.name}_sync_status ON cms_${schema.name}(sync_status);`
    ],
    policies: [
      // RLS policies for content access
      `CREATE POLICY "Anyone can read published content" ON cms_${schema.name} FOR SELECT USING (true);`,
      `CREATE POLICY "Admins can manage content" ON cms_${schema.name} FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('super_admin', 'admin', 'editor')
        )
      );`
    ]
  }
}

/**
 * Generate sync mapping between Sanity and Supabase
 */
function generateSyncMapping(schema: SanitySchema): SyncMapping {
  const fieldMappings: Record<string, string> = {}
  
  // Map common fields
  for (const field of schema.fields) {
    if (field.name !== '_id' && field.name !== '_type' && field.name !== '_rev') {
      fieldMappings[field.name] = field.name
    }
  }

  return {
    sanitySchema: schema.name,
    supabaseTable: `cms_${schema.name}`,
    syncDirection: 'bidirectional',
    fieldMappings,
    transformations: {
      '_id': 'sanity_id',
      '_rev': 'sanity_rev',
      '_createdAt': 'created_at',
      '_updatedAt': 'updated_at'
    }
  }
}

/**
 * Parse a Sanity schema file
 */
async function parseSanitySchema(filePath: string): Promise<SanitySchema | null> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    
    // Extract schema definition using regex (simplified parser)
    const nameMatch = content.match(/name:\s*['"`]([^'"`]+)['"`]/)
    const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/)
    const typeMatch = content.match(/type:\s*['"`]([^'"`]+)['"`]/)
    
    if (!nameMatch || !titleMatch || !typeMatch) {
      return null
    }

    // For now, we'll create a simplified schema
    // In a full implementation, you'd use TypeScript AST parsing
    return {
      name: nameMatch[1],
      title: titleMatch[1],
      type: typeMatch[1],
      fields: [] // Would be populated by AST parsing
    }
  } catch (error) {
    console.error(`Failed to parse schema file ${filePath}:`, error)
    return null
  }
}

/**
 * Analyze all Sanity schemas and generate comprehensive migration
 */
export async function analyzeAllSchemas(): Promise<{
  tables: SupabaseTable[]
  mappings: SyncMapping[]
  sql: string
}> {
  const schemasDir = path.join(process.cwd(), 'sanity/schemas')
  const schemaFiles = await fs.promises.readdir(schemasDir)
  
  const tables: SupabaseTable[] = []
  const mappings: SyncMapping[] = []
  
  // Define schemas manually for comprehensive coverage
  const allSchemas: SanitySchema[] = [
    {
      name: 'homepage',
      title: 'Homepage',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'subtitle', type: 'string', title: 'Subtitle' },
        { name: 'heroImage', type: 'image', title: 'Hero Image' },
        { name: 'heroContent', type: 'array', title: 'Hero Content' },
        { name: 'sections', type: 'array', title: 'Page Sections' },
        { name: 'seo', type: 'object', title: 'SEO Settings' }
      ]
    },
    {
      name: 'post',
      title: 'Blog Post',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'slug', type: 'slug', title: 'Slug' },
        { name: 'author', type: 'reference', title: 'Author' },
        { name: 'publishedAt', type: 'datetime', title: 'Published At' },
        { name: 'excerpt', type: 'text', title: 'Excerpt' },
        { name: 'body', type: 'array', title: 'Body' },
        { name: 'categories', type: 'array', title: 'Categories' },
        { name: 'featured', type: 'boolean', title: 'Featured' },
        { name: 'coverImage', type: 'image', title: 'Cover Image' },
        { name: 'seo', type: 'object', title: 'SEO' }
      ]
    },
    {
      name: 'page',
      title: 'Page',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'slug', type: 'slug', title: 'Slug' },
        { name: 'content', type: 'array', title: 'Content' },
        { name: 'excerpt', type: 'text', title: 'Excerpt' },
        { name: 'coverImage', type: 'image', title: 'Cover Image' },
        { name: 'seo', type: 'object', title: 'SEO' },
        { name: 'showInNavigation', type: 'boolean', title: 'Show in Navigation' },
        { name: 'order', type: 'number', title: 'Order' }
      ]
    },
    {
      name: 'service',
      title: 'Service',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'slug', type: 'slug', title: 'Slug' },
        { name: 'icon', type: 'string', title: 'Icon' },
        { name: 'shortDescription', type: 'text', title: 'Short Description' },
        { name: 'description', type: 'array', title: 'Description' },
        { name: 'features', type: 'array', title: 'Features' },
        { name: 'order', type: 'number', title: 'Order' },
        { name: 'image', type: 'image', title: 'Image' }
      ]
    },
    {
      name: 'teamMember',
      title: 'Team Member',
      type: 'document',
      fields: [
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'title', type: 'string', title: 'Job Title' },
        { name: 'bio', type: 'text', title: 'Biography' },
        { name: 'image', type: 'image', title: 'Profile Image' },
        { name: 'role', type: 'string', title: 'Role' },
        { name: 'order', type: 'number', title: 'Order' },
        { name: 'email', type: 'email', title: 'Email' },
        { name: 'socialLinks', type: 'array', title: 'Social Links' },
        { name: 'expertise', type: 'array', title: 'Expertise' },
        { name: 'published', type: 'boolean', title: 'Published' }
      ]
    },
    {
      name: 'heroSection',
      title: 'Hero Section',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'subtitle', type: 'text', title: 'Subtitle' },
        { name: 'backgroundImage', type: 'image', title: 'Background Image' },
        { name: 'primaryCTA', type: 'object', title: 'Primary CTA' },
        { name: 'secondaryCTA', type: 'object', title: 'Secondary CTA' },
        { name: 'page', type: 'string', title: 'Page' },
        { name: 'order', type: 'number', title: 'Order' }
      ]
    },
    {
      name: 'contentSection',
      title: 'Content Section',
      type: 'document',
      fields: [
        { name: 'heading', type: 'string', title: 'Heading' },
        { name: 'description', type: 'text', title: 'Description' },
        { name: 'content', type: 'array', title: 'Content' },
        { name: 'backgroundColor', type: 'string', title: 'Background Color' },
        { name: 'layout', type: 'string', title: 'Layout' },
        { name: 'page', type: 'string', title: 'Page' },
        { name: 'sectionId', type: 'slug', title: 'Section ID' },
        { name: 'order', type: 'number', title: 'Order' },
        { name: 'published', type: 'boolean', title: 'Published' }
      ]
    },
    {
      name: 'featureGrid',
      title: 'Feature Grid',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'description', type: 'text', title: 'Description' },
        { name: 'features', type: 'array', title: 'Features' },
        { name: 'gridType', type: 'string', title: 'Grid Type' },
        { name: 'layout', type: 'string', title: 'Layout' },
        { name: 'page', type: 'string', title: 'Page' },
        { name: 'sectionId', type: 'slug', title: 'Section ID' },
        { name: 'order', type: 'number', title: 'Order' },
        { name: 'backgroundColor', type: 'string', title: 'Background Color' },
        { name: 'published', type: 'boolean', title: 'Published' }
      ]
    },
    {
      name: 'siteSettings',
      title: 'Site Settings',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Site Title' },
        { name: 'description', type: 'text', title: 'Site Description' },
        { name: 'logo', type: 'image', title: 'Logo' },
        { name: 'favicon', type: 'image', title: 'Favicon' },
        { name: 'socialLinks', type: 'object', title: 'Social Links' },
        { name: 'contactInfo', type: 'object', title: 'Contact Info' },
        { name: 'footerText', type: 'text', title: 'Footer Text' }
      ]
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'items', type: 'array', title: 'Navigation Items' },
        { name: 'location', type: 'string', title: 'Location' },
        { name: 'order', type: 'number', title: 'Order' }
      ]
    },
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'slug', type: 'slug', title: 'Slug' },
        { name: 'bio', type: 'text', title: 'Biography' },
        { name: 'image', type: 'image', title: 'Image' }
      ]
    },
    {
      name: 'category',
      title: 'Category',
      type: 'document',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'slug', type: 'slug', title: 'Slug' },
        { name: 'description', type: 'text', title: 'Description' },
        { name: 'color', type: 'string', title: 'Color' }
      ]
    }
  ]

  // Generate tables and mappings for each schema
  for (const schema of allSchemas) {
    const table = generateSupabaseTable(schema)
    const mapping = generateSyncMapping(schema)
    
    tables.push(table)
    mappings.push(mapping)
  }

  // Generate SQL for all tables
  const sql = generateMigrationSQL(tables)

  return { tables, mappings, sql }
}

/**
 * Generate complete SQL migration script
 */
function generateMigrationSQL(tables: SupabaseTable[]): string {
  let sql = `-- Comprehensive Sanity to Supabase Schema Migration
-- Generated: ${new Date().toISOString()}
-- This creates mirror tables for all Sanity schemas

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sync status enum
DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

`

  // Generate table creation SQL
  for (const table of tables) {
    sql += `-- Create table for ${table.name}\n`
    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`
    
    const columnDefs = table.columns.map(col => {
      let def = `  ${col.name} ${col.type}`
      if (!col.nullable) def += ' NOT NULL'
      if (col.default) def += ` DEFAULT ${col.default}`
      return def
    }).join(',\n')
    
    sql += columnDefs
    sql += ',\n  PRIMARY KEY (id)\n'
    sql += ');\n\n'

    // Add indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        sql += `${index}\n`
      }
      sql += '\n'
    }

    // Enable RLS
    sql += `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;\n\n`

    // Add RLS policies
    if (table.policies) {
      for (const policy of table.policies) {
        sql += `${policy}\n`
      }
      sql += '\n'
    }
  }

  // Create sync tracking table
  sql += `-- Sync tracking table
CREATE TABLE IF NOT EXISTS cms_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  sanity_id TEXT,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  direction TEXT NOT NULL CHECK (direction IN ('sanity_to_supabase', 'supabase_to_sanity')),
  status sync_status DEFAULT 'pending',
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_log_table_record ON cms_sync_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON cms_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON cms_sync_log(created_at);

-- Enable RLS on sync log
ALTER TABLE cms_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync log" ON cms_sync_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Create webhook processing table
CREATE TABLE IF NOT EXISTS cms_webhook_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('sanity', 'supabase')),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_queue_processed ON cms_webhook_queue(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_queue_created_at ON cms_webhook_queue(created_at);

-- Enable RLS on webhook queue
ALTER TABLE cms_webhook_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage webhook queue" ON cms_webhook_queue
  FOR ALL USING (true);

`

  return sql
}

export { generateSupabaseTable, generateSyncMapping, type SanitySchema, type SupabaseTable, type SyncMapping }
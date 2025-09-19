import { z } from 'zod'
import { NextRequest } from 'next/server'
import { webhookTracer } from '@/lib/observability/tracing'

/**
 * Webhook API Versioning Strategy
 * 
 * Implements semantic versioning for webhook APIs to ensure backward compatibility
 * while allowing for evolution of the API contract.
 * 
 * Version Format: v{major}.{minor}
 * - Major: Breaking changes (v1, v2, v3)
 * - Minor: Non-breaking additions (v1.1, v1.2)
 * 
 * Versioning Methods:
 * 1. URL Path: /api/cms/blog/webhook/v1
 * 2. Header: X-Webhook-Version: v1
 * 3. Query Parameter: ?version=v1
 */

// Version definitions
export const WEBHOOK_VERSIONS = {
  V1: 'v1',      // Original version - Make.com/Zapier basic integration
  V1_1: 'v1.1',  // Added metadata fields
  V2: 'v2',      // New structure with nested objects
  LATEST: 'v2',  // Current latest version
  DEFAULT: 'v1', // Default for backward compatibility
} as const

export type WebhookVersion = typeof WEBHOOK_VERSIONS[keyof typeof WEBHOOK_VERSIONS]

// Version deprecation status
export const VERSION_STATUS = {
  [WEBHOOK_VERSIONS.V1]: {
    status: 'active',
    deprecated: false,
    sunsetDate: null,
    message: 'Original webhook format - fully supported',
  },
  [WEBHOOK_VERSIONS.V1_1]: {
    status: 'active', 
    deprecated: false,
    sunsetDate: null,
    message: 'Extended v1 with metadata fields',
  },
  [WEBHOOK_VERSIONS.V2]: {
    status: 'active',
    deprecated: false,
    sunsetDate: null,
    message: 'Latest version with enhanced structure',
  },
} as const

// Version-specific payload schemas
export const WebhookPayloadV1 = z.object({
  title: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.enum(['draft', 'published']).optional(),
  publishedAt: z.string().optional(),
  source: z.enum(['make.com', 'zapier', 'custom']).optional(),
})

export const WebhookPayloadV1_1 = WebhookPayloadV1.extend({
  metadata: z.object({
    externalId: z.string().optional(),
    sourceUrl: z.string().optional(),
    category: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  }).optional(),
})

export const WebhookPayloadV2 = z.object({
  version: z.literal('v2'),
  data: z.object({
    post: z.object({
      title: z.string(),
      content: z.string(),
      excerpt: z.string().optional(),
      slug: z.string().optional(),
    }),
    author: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      id: z.string().optional(),
    }).optional(),
    taxonomy: z.object({
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
    }).optional(),
    publishing: z.object({
      status: z.enum(['draft', 'published', 'scheduled']).optional(),
      publishedAt: z.string().optional(),
      scheduledFor: z.string().optional(),
    }).optional(),
    metadata: z.object({
      source: z.enum(['make.com', 'zapier', 'custom', 'api']).optional(),
      externalId: z.string().optional(),
      sourceUrl: z.string().optional(),
      webhookId: z.string().optional(),
      customFields: z.record(z.any()).optional(),
    }).optional(),
  }),
  context: z.object({
    timestamp: z.string(),
    requestId: z.string().optional(),
    userAgent: z.string().optional(),
    ip: z.string().optional(),
  }).optional(),
})

// Version detection from request
export function detectWebhookVersion(request: NextRequest): WebhookVersion {
  // 1. Check URL path for version
  const pathname = request.nextUrl.pathname
  const pathMatch = pathname.match(/\/v(\d+(?:\.\d+)?)/)
  if (pathMatch) {
    const version = `v${pathMatch[1]}` as WebhookVersion
    if (isValidVersion(version)) {
      return version
    }
  }

  // 2. Check header for version
  const headerVersion = request.headers.get('x-webhook-version') || 
                        request.headers.get('x-api-version')
  if (headerVersion && isValidVersion(headerVersion as WebhookVersion)) {
    return headerVersion as WebhookVersion
  }

  // 3. Check query parameter for version
  const queryVersion = request.nextUrl.searchParams.get('version') ||
                       request.nextUrl.searchParams.get('v')
  if (queryVersion && isValidVersion(queryVersion as WebhookVersion)) {
    return queryVersion as WebhookVersion
  }

  // 4. Default to v1 for backward compatibility
  return WEBHOOK_VERSIONS.DEFAULT
}

// Validate version
export function isValidVersion(version: string): boolean {
  return Object.values(WEBHOOK_VERSIONS).includes(version as WebhookVersion)
}

// Get version info
export function getVersionInfo(version: WebhookVersion) {
  return VERSION_STATUS[version] || {
    status: 'unknown',
    deprecated: true,
    sunsetDate: null,
    message: 'Unknown version',
  }
}

// Transform payload between versions
export class WebhookVersionTransformer {
  /**
   * Transform v1 payload to v2 format
   */
  static v1ToV2(v1Payload: z.infer<typeof WebhookPayloadV1>): z.infer<typeof WebhookPayloadV2> {
    return {
      version: 'v2',
      data: {
        post: {
          title: v1Payload.title,
          content: v1Payload.content,
          excerpt: v1Payload.excerpt,
        },
        author: v1Payload.author ? {
          name: v1Payload.author,
        } : undefined,
        taxonomy: {
          tags: Array.isArray(v1Payload.tags) 
            ? v1Payload.tags 
            : v1Payload.tags 
              ? [v1Payload.tags]
              : undefined,
        },
        publishing: {
          status: v1Payload.status,
          publishedAt: v1Payload.publishedAt,
        },
        metadata: {
          source: v1Payload.source,
        },
      },
      context: {
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Transform v1.1 payload to v2 format
   */
  static v1_1ToV2(v1_1Payload: z.infer<typeof WebhookPayloadV1_1>): z.infer<typeof WebhookPayloadV2> {
    const v2Payload = this.v1ToV2(v1_1Payload)
    
    if (v1_1Payload.metadata) {
      v2Payload.data.metadata = {
        ...v2Payload.data.metadata,
        externalId: v1_1Payload.metadata.externalId,
        sourceUrl: v1_1Payload.metadata.sourceUrl,
        customFields: v1_1Payload.metadata.customFields,
      }
      
      if (v1_1Payload.metadata.category) {
        v2Payload.data.taxonomy = {
          ...v2Payload.data.taxonomy,
          categories: [v1_1Payload.metadata.category],
        }
      }
    }
    
    return v2Payload
  }

  /**
   * Transform v2 payload to v1 format (for backward compatibility)
   */
  static v2ToV1(v2Payload: z.infer<typeof WebhookPayloadV2>): z.infer<typeof WebhookPayloadV1> {
    return {
      title: v2Payload.data.post.title,
      content: v2Payload.data.post.content,
      excerpt: v2Payload.data.post.excerpt,
      author: v2Payload.data.author?.name,
      tags: v2Payload.data.taxonomy?.tags,
      status: v2Payload.data.publishing?.status as 'draft' | 'published' | undefined,
      publishedAt: v2Payload.data.publishing?.publishedAt,
      source: v2Payload.data.metadata?.source as 'make.com' | 'zapier' | 'custom' | undefined,
    }
  }
}

// Version-aware payload validator
export class WebhookVersionValidator {
  static async validate(
    payload: unknown,
    version: WebhookVersion
  ): Promise<{ 
    success: boolean
    data?: any
    error?: string
    normalizedData?: z.infer<typeof WebhookPayloadV2>
  }> {
    return await webhookTracer.traceWebhookProcessing(
      `validation_${Date.now()}`,
      'version-validator',
      async () => {
        try {
          let validatedData: any
          let normalizedData: z.infer<typeof WebhookPayloadV2>

          switch (version) {
            case WEBHOOK_VERSIONS.V1:
              validatedData = WebhookPayloadV1.parse(payload)
              normalizedData = WebhookVersionTransformer.v1ToV2(validatedData)
              break
              
            case WEBHOOK_VERSIONS.V1_1:
              validatedData = WebhookPayloadV1_1.parse(payload)
              normalizedData = WebhookVersionTransformer.v1_1ToV2(validatedData)
              break
              
            case WEBHOOK_VERSIONS.V2:
              validatedData = WebhookPayloadV2.parse(payload)
              normalizedData = validatedData
              break
              
            default:
              return {
                success: false,
                error: `Unsupported webhook version: ${version}`,
              }
          }

          return {
            success: true,
            data: validatedData,
            normalizedData, // Always in v2 format internally
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              success: false,
              error: `Validation failed for version ${version}: ${error.errors.map(e => e.message).join(', ')}`,
            }
          }
          
          return {
            success: false,
            error: 'Unknown validation error',
          }
        }
      }
    )
  }
}

// Version compatibility checker
export class WebhookVersionCompatibility {
  /**
   * Check if a client version is compatible with server version
   */
  static isCompatible(clientVersion: WebhookVersion, serverVersion: WebhookVersion): boolean {
    const clientMajor = this.getMajorVersion(clientVersion)
    const serverMajor = this.getMajorVersion(serverVersion)
    
    // Same major version = compatible
    if (clientMajor === serverMajor) {
      return true
    }
    
    // Server can handle older versions (backward compatibility)
    if (serverMajor > clientMajor) {
      return !this.isDeprecated(clientVersion)
    }
    
    // Client newer than server = incompatible
    return false
  }

  /**
   * Check if version is deprecated
   */
  static isDeprecated(version: WebhookVersion): boolean {
    const info = getVersionInfo(version)
    return info.deprecated
  }

  /**
   * Get sunset date for version
   */
  static getSunsetDate(version: WebhookVersion): Date | null {
    const info = getVersionInfo(version)
    return info.sunsetDate ? new Date(info.sunsetDate) : null
  }

  /**
   * Extract major version number
   */
  private static getMajorVersion(version: WebhookVersion): number {
    const match = version.match(/v(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * Generate deprecation warning headers
   */
  static getDeprecationHeaders(version: WebhookVersion): Record<string, string> {
    const headers: Record<string, string> = {}
    const info = getVersionInfo(version)
    
    if (info.deprecated) {
      headers['X-Webhook-Deprecated'] = 'true'
      headers['X-Webhook-Deprecation-Message'] = info.message
      
      if (info.sunsetDate) {
        headers['X-Webhook-Sunset-Date'] = info.sunsetDate
      }
      
      headers['X-Webhook-Latest-Version'] = WEBHOOK_VERSIONS.LATEST
    }
    
    return headers
  }
}

// Version migration helper
export class WebhookVersionMigrator {
  /**
   * Migrate payload from one version to another
   */
  static async migrate(
    payload: unknown,
    fromVersion: WebhookVersion,
    toVersion: WebhookVersion
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // Validate source payload
    const validation = await WebhookVersionValidator.validate(payload, fromVersion)
    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    // If already in target version, return as is
    if (fromVersion === toVersion) {
      return { success: true, data: validation.data }
    }

    // Always convert through v2 as intermediate format
    const v2Data = validation.normalizedData!

    // Convert to target version
    try {
      let targetData: any
      
      switch (toVersion) {
        case WEBHOOK_VERSIONS.V1:
          targetData = WebhookVersionTransformer.v2ToV1(v2Data)
          break
          
        case WEBHOOK_VERSIONS.V1_1:
          // Convert v2 to v1.1 (partial backward compatibility)
          const v1Data = WebhookVersionTransformer.v2ToV1(v2Data)
          targetData = {
            ...v1Data,
            metadata: {
              externalId: v2Data.data.metadata?.externalId,
              sourceUrl: v2Data.data.metadata?.sourceUrl,
              category: v2Data.data.taxonomy?.categories?.[0],
              customFields: v2Data.data.metadata?.customFields,
            },
          }
          break
          
        case WEBHOOK_VERSIONS.V2:
          targetData = v2Data
          break
          
        default:
          return { success: false, error: `Cannot migrate to version ${toVersion}` }
      }

      return { success: true, data: targetData }
    } catch (error) {
      return { 
        success: false, 
        error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Get migration path between versions
   */
  static getMigrationPath(fromVersion: WebhookVersion, toVersion: WebhookVersion): string[] {
    // Simple implementation - always go through v2
    if (fromVersion === toVersion) {
      return []
    }
    
    if (fromVersion === WEBHOOK_VERSIONS.V2) {
      return [toVersion]
    }
    
    if (toVersion === WEBHOOK_VERSIONS.V2) {
      return [WEBHOOK_VERSIONS.V2]
    }
    
    return [WEBHOOK_VERSIONS.V2, toVersion]
  }
}

// Version discovery endpoint helper
export function generateVersionDiscovery() {
  return {
    versions: Object.keys(VERSION_STATUS).map(version => ({
      version,
      ...VERSION_STATUS[version as WebhookVersion],
      schemas: {
        request: getSchemaUrl(version as WebhookVersion),
        response: getResponseSchemaUrl(version as WebhookVersion),
      },
    })),
    current: WEBHOOK_VERSIONS.LATEST,
    default: WEBHOOK_VERSIONS.DEFAULT,
    documentation: '/api/cms/blog/webhook/docs',
  }
}

function getSchemaUrl(version: WebhookVersion): string {
  return `/api/cms/blog/webhook/${version}/schema`
}

function getResponseSchemaUrl(version: WebhookVersion): string {
  return `/api/cms/blog/webhook/${version}/response-schema`
}

// Export types for use in webhook routes
export type WebhookPayloadV1Type = z.infer<typeof WebhookPayloadV1>
export type WebhookPayloadV1_1Type = z.infer<typeof WebhookPayloadV1_1>
export type WebhookPayloadV2Type = z.infer<typeof WebhookPayloadV2>
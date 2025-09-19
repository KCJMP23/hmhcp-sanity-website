export interface WebhookEndpoint {
  id: string
  name: string
  description?: string
  service: 'make.com' | 'zapier' | 'custom' | 'internal'
  is_active: boolean
  rate_limit: number
  allowed_endpoints: string[]
  allowed_ips: string[]
  created_at: string
  updated_at: string
  expires_at?: string
  last_used_at?: string
  usage_count: number
  stats?: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    successRate: number
  }
}

export interface WebhookLog {
  id: string
  request_id?: string
  api_key_id: string
  endpoint: string
  method: string
  headers: Record<string, any>
  payload: Record<string, any>
  query_params?: Record<string, any>
  ip_address?: string
  user_agent?: string
  service_identifier?: string
  status_code: number
  response_body?: Record<string, any>
  processing_time_ms?: number
  success: boolean
  error_type?: string
  error_message?: string
  created_post_id?: string
  created_resources?: any[]
  received_at: string
  processed_at?: string
  api_keys?: {
    name: string
    service: string
  }
}

export interface WebhookFormData {
  name: string
  description?: string
  service: 'make.com' | 'zapier' | 'custom' | 'internal'
  expiresAt?: string
}

export interface WebhookStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  averageResponseTime: number
  statusCodeDistribution?: Record<number, number>
}

export const WEBHOOK_EVENTS = [
  { value: 'blog.created', label: 'Blog Post Created' },
  { value: 'blog.updated', label: 'Blog Post Updated' },
  { value: 'blog.deleted', label: 'Blog Post Deleted' },
  { value: 'blog.published', label: 'Blog Post Published' }
]

export const DEFAULT_WEBHOOK_FORM_DATA: WebhookFormData = {
  name: '',
  description: '',
  service: 'custom'
}
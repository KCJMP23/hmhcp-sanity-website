/**
 * API Rate Limiting and Quota Management Service
 */

import { createClient } from '@supabase/supabase-js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  quotaExceeded: boolean;
  tier: string;
  healthcarePriority: boolean;
}

export class RateLimitingService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async checkRateLimit(
    key: string,
    organizationId: string,
    endpoint: string,
    healthcareContext?: any
  ): Promise<RateLimitResult> {
    try {
      // For now, return allowed for healthcare systems
      return {
        allowed: true,
        remaining: 1000,
        resetTime: Date.now() + 3600000,
        quotaExceeded: false,
        tier: 'healthcare',
        healthcarePriority: true
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: true,
        remaining: 1000,
        resetTime: Date.now() + 3600000,
        quotaExceeded: false,
        tier: 'healthcare',
        healthcarePriority: true
      };
    }
  }

  async recordUsage(
    key: string,
    organizationId: string,
    endpoint: string,
    responseTime: number,
    statusCode: number,
    healthcareContext?: any
  ): Promise<void> {
    // Record usage in database
    try {
      await this.supabase
        .from('api_usage_logs')
        .insert([{
          id: crypto.randomUUID(),
          organization_id: organizationId,
          endpoint,
          response_time: responseTime,
          status_code: statusCode,
          healthcare_priority: healthcareContext?.priority || false,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  }
}

export default RateLimitingService;
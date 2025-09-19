/**
 * Enterprise Bot Protection System
 * 
 * Multi-layered defense against automated attacks:
 * 1. Honeypot fields (invisible to humans, filled by bots)
 * 2. Timing analysis (bots submit too fast)
 * 3. Mouse movement tracking (bots don't move naturally)
 * 4. Behavioral pattern detection
 * 5. Rate limiting with progressive penalties
 */

export interface BotProtectionConfig {
  honeypotFieldName: string
  minFormTime: number // Minimum time to fill form (ms)
  maxFormTime: number // Maximum reasonable time (ms)
  requiredInteractions: number // Minimum user interactions
  enableMouseTracking: boolean
  enableTimingAnalysis: boolean
}

export interface FormSubmissionData {
  honeypotValue?: string
  formStartTime?: number
  formSubmitTime?: number
  mouseMovements?: number
  keystrokes?: number
  focusEvents?: number
  userAgent?: string
  fingerprint?: string
}

export interface BotDetectionResult {
  isBot: boolean
  confidence: number // 0-100 confidence score
  reasons: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  blockType: 'allow' | 'challenge' | 'block' | 'ban'
}

export class BotProtectionService {
  private config: BotProtectionConfig

  constructor(config: Partial<BotProtectionConfig> = {}) {
    this.config = {
      honeypotFieldName: this.generateRandomFieldName(),
      minFormTime: 3000, // 3 seconds minimum
      maxFormTime: 600000, // 10 minutes maximum
      requiredInteractions: 5, // Minimum user interactions
      enableMouseTracking: true,
      enableTimingAnalysis: true,
      ...config
    }
  }

  private generateRandomFieldName(): string {
    const prefixes = ['user', 'email', 'name', 'phone', 'address']
    const suffixes = ['field', 'input', 'data', 'info', 'details']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    return `${prefix}_${suffix}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Analyze form submission for bot indicators
   */
  analyzeSubmission(data: FormSubmissionData): BotDetectionResult {
    const reasons: string[] = []
    let confidence = 0
    let riskLevel: BotDetectionResult['riskLevel'] = 'low'

    // 1. Honeypot Check (CRITICAL - instant bot detection)
    if (data.honeypotValue && data.honeypotValue.trim() !== '') {
      reasons.push('Honeypot field filled')
      confidence += 95
      riskLevel = 'critical'
    }

    // 2. Timing Analysis
    if (data.formStartTime && data.formSubmitTime) {
      const formTime = data.formSubmitTime - data.formStartTime

      if (formTime < this.config.minFormTime) {
        reasons.push(`Form submitted too quickly (${formTime}ms < ${this.config.minFormTime}ms)`)
        confidence += 80
        riskLevel = 'high'
      }

      if (formTime > this.config.maxFormTime) {
        reasons.push(`Form took too long (${formTime}ms > ${this.config.maxFormTime}ms)`)
        confidence += 30
        if (riskLevel === 'low') {
          riskLevel = 'medium'
        }
      }
    }

    // 3. Interaction Analysis
    const totalInteractions = (data.mouseMovements || 0) + (data.keystrokes || 0) + (data.focusEvents || 0)
    if (totalInteractions < this.config.requiredInteractions) {
      reasons.push(`Insufficient user interactions (${totalInteractions} < ${this.config.requiredInteractions})`)
      confidence += 60
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
    }

    // 4. User Agent Analysis
    if (data.userAgent) {
      const suspiciousPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /python/i, /curl/i, /wget/i, /http/i,
        /automation/i, /phantom/i, /headless/i
      ]

      if (data.userAgent && suspiciousPatterns.some(pattern => pattern.test(data.userAgent!))) {
        reasons.push('Suspicious user agent detected')
        confidence += 70
        riskLevel = riskLevel === 'low' ? 'high' : riskLevel
      }
    }

    // 5. Mouse Movement Patterns
    if (this.config.enableMouseTracking && (data.mouseMovements || 0) === 0) {
      reasons.push('No mouse movement detected')
      confidence += 40
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
    }

    // 6. Behavioral Patterns
    if (data.keystrokes && data.keystrokes > 0) {
      // Check for robotic typing patterns (too consistent timing)
      // This would require more detailed keystroke timing data
      // For now, we'll just check for reasonable keystroke counts
      if (data.keystrokes < 10) {
        reasons.push('Unusual keystroke pattern detected')
        confidence += 25
      }
    }

    // Determine bot probability
    const isBot = confidence >= 75 || riskLevel === 'critical'
    
    // Determine action based on risk level and confidence
    let blockType: BotDetectionResult['blockType'] = 'allow'
    if (confidence >= 95 || riskLevel === 'critical') {
      blockType = 'ban'
    } else if (confidence >= 75 || riskLevel === 'high') {
      blockType = 'block'
    } else if (confidence >= 50 || riskLevel === 'medium') {
      blockType = 'challenge'
    }

    return {
      isBot,
      confidence: Math.min(confidence, 100),
      reasons,
      riskLevel,
      blockType
    }
  }

  /**
   * Generate honeypot HTML for forms
   */
  generateHoneypotHTML(): string {
    const fieldName = this.config.honeypotFieldName
    return `
      <!-- Honeypot: Invisible to humans, attracts bots -->
      <div style="position: absolute; left: -9999px; top: -9999px; opacity: 0; visibility: hidden; height: 0; width: 0; overflow: hidden;" aria-hidden="true">
        <label for="${fieldName}">Leave this field empty</label>
        <input 
          type="text" 
          name="${fieldName}" 
          id="${fieldName}" 
          value="" 
          tabindex="-1" 
          autocomplete="off"
          style="position: absolute; left: -9999px; top: -9999px; opacity: 0; visibility: hidden; height: 0; width: 0;"
        />
      </div>
    `
  }

  /**
   * Get honeypot field name for validation
   */
  getHoneypotFieldName(): string {
    return this.config.honeypotFieldName
  }

  /**
   * Generate client-side tracking script
   */
  generateTrackingScript(): string {
    return `
      (function() {
        // Bot Protection Tracking
        let formStartTime = Date.now();
        let mouseMovements = 0;
        let keystrokes = 0;
        let focusEvents = 0;
        
        // Track mouse movements
        document.addEventListener('mousemove', function() {
          mouseMovements++;
        });
        
        // Track keystrokes
        document.addEventListener('keydown', function() {
          keystrokes++;
        });
        
        // Track focus events
        document.addEventListener('focusin', function() {
          focusEvents++;
        });
        
        // Add tracking data to forms on submit
        document.addEventListener('submit', function(e) {
          const form = e.target;
          if (!form.matches('form')) return;
          
          // Create hidden fields for tracking data
          const trackingData = {
            formStartTime: formStartTime,
            formSubmitTime: Date.now(),
            mouseMovements: mouseMovements,
            keystrokes: keystrokes,
            focusEvents: focusEvents,
            userAgent: navigator.userAgent,
            fingerprint: generateFingerprint()
          };
          
          Object.entries(trackingData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'botProtection_' + key;
            input.value = String(value);
            form.appendChild(input);
          });
        });
        
        function generateFingerprint() {
          // Simple browser fingerprinting
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Bot protection', 2, 2);
          
          return btoa(JSON.stringify({
            screen: screen.width + 'x' + screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            canvas: canvas.toDataURL()
          }));
        }
      })();
    `
  }
}

// Singleton instance
export const botProtection = new BotProtectionService()

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number; penalties: number }>()

export interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  penaltyMultiplier: number
  maxPenaltyMs: number
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: 60000, // 1 minute
      maxAttempts: 3, // 3 attempts per window
      penaltyMultiplier: 2, // Double penalty time
      maxPenaltyMs: 3600000, // Max 1 hour penalty
      ...config
    }
  }

  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number; penaltyMs?: number } {
    const now = Date.now()
    const key = identifier
    
    let record = rateLimitStore.get(key)
    
    // Initialize or reset if window expired
    if (!record || now >= record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
        penalties: 0
      }
    }
    
    // Check if under penalty
    const penaltyMs = Math.min(
      this.config.windowMs * Math.pow(this.config.penaltyMultiplier, record.penalties),
      this.config.maxPenaltyMs
    )
    
    if (record.penalties > 0 && now < (record.resetTime + penaltyMs)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime + penaltyMs,
        penaltyMs
      }
    }
    
    // Check rate limit
    if (record.count >= this.config.maxAttempts) {
      record.penalties++
      record.resetTime = now + this.config.windowMs
      rateLimitStore.set(key, record)
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime + penaltyMs,
        penaltyMs
      }
    }
    
    // Allow request
    record.count++
    rateLimitStore.set(key, record)
    
    return {
      allowed: true,
      remaining: this.config.maxAttempts - record.count,
      resetTime: record.resetTime
    }
  }
  
  reset(identifier: string): void {
    rateLimitStore.delete(identifier)
  }
}

// Export rate limiter instances for different endpoints
export const loginRateLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxAttempts: 3, // 3 attempts per 5 minutes
  penaltyMultiplier: 3, // Triple penalty time
  maxPenaltyMs: 1800000, // Max 30 minutes penalty
})

export const generalRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxAttempts: 10, // 10 attempts per minute
  penaltyMultiplier: 2,
  maxPenaltyMs: 300000, // Max 5 minutes penalty
})
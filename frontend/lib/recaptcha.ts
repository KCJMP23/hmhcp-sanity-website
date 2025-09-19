import { logger } from '@/lib/logger';

interface RecaptchaResponse {
  success: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

// Extend Window interface for grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>
      ready: (callback: () => void) => void
    }
  }
}

// Client-side functions
export function loadReCaptcha() {
  if (typeof window === 'undefined') return;
  
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY not configured');
    return;
  }
  
  // Check if already loaded
  if (window.grecaptcha) return;
  
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export async function executeReCaptcha(action: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('executeReCaptcha can only be called on client-side');
  }
  
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY not configured');
    return 'no-token-development';
  }
  
  // Wait for grecaptcha to be available
  let attempts = 0;
  while (!window.grecaptcha && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA not loaded');
  }
  
  return window.grecaptcha.execute(siteKey, { action });
}

// Server-side validation function (renamed for clarity)
export async function verifyReCaptcha(token: string): Promise<boolean> {
  const result = await validateRecaptcha(token);
  return result.success;
}

export async function validateRecaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  // Skip validation in development if no secret is provided
  if (process.env.NODE_ENV === 'development' && !process.env.RECAPTCHA_SECRET_KEY) {
    logger.warn('reCAPTCHA validation skipped in development', { action: 'warning_logged' })
    return { success: true, score: 1.0 }
  }

  if (!process.env.RECAPTCHA_SECRET_KEY) {
    logger.error('RECAPTCHA_SECRET_KEY not configured', { error: new Error('RECAPTCHA_SECRET_KEY not configured'), action: 'error_logged' })
    return { success: false }
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data: RecaptchaResponse = await response.json()

    if (!data.success) {
      logger.error('reCAPTCHA validation failed:', { error: new Error('Validation failed'), action: 'error_logged', metadata: { errorCodes: data['error-codes'] } })
      return { success: false }
    }

    // For reCAPTCHA v3, check the score (0.0 - 1.0)
    // 0.5 is a reasonable threshold, adjust based on your needs
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5')
    
    if (data.score !== undefined && data.score < scoreThreshold) {
      logger.warn(`reCAPTCHA score too low: ${data.score}`, { action: 'warning_logged' })
      return { success: false, score: data.score }
    }

    return { success: true, score: data.score }
  } catch (error) {
    logger.error('reCAPTCHA validation error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    return { success: false }
  }
}
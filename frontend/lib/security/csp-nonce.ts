import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure nonce for Content Security Policy
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64')
}

/**
 * Store nonce in request context for access in components
 */
const nonceStore = new WeakMap<Request, string>()

export function setRequestNonce(request: Request, nonce: string): void {
  nonceStore.set(request, nonce)
}

export function getRequestNonce(request: Request): string | undefined {
  return nonceStore.get(request)
}

/**
 * Generate CSP header with nonce-based policy
 */
export function generateCSPHeader(nonce: string, isProduction: boolean = false): string {
  const basePolicy = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://*.supabase.co',
      'https://vercel.live',
      ...(isProduction ? [] : ["'unsafe-eval'"]) // Only allow unsafe-eval in development for HMR
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http:',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://api.vercel.com',
      'https://vercel.live',
      'wss://ws-us3.pusher.com',
      ...(isProduction ? [] : ['ws://localhost:*', 'http://localhost:*'])
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'script-src-elem': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://*.supabase.co',
    ],
    'style-src-elem': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://fonts.googleapis.com',
    ],
    'style-src-attr': [`'nonce-${nonce}'`],
    'worker-src': ["'self'", 'blob:'],
    'child-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'"],
    ...(isProduction ? { 'upgrade-insecure-requests': [''] } : {})
  }

  // Convert policy object to string
  return Object.entries(basePolicy)
    .map(([directive, sources]) => {
      if (sources.length === 0 || (sources.length === 1 && sources[0] === '')) {
        return directive
      }
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
}

/**
 * Allowed origins for CORS
 */
export const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [
      process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhcpwebsite62525-master-kcjmp23s-projects.vercel.app',
      'https://hmhcp.com',
      'https://www.hmhcp.com',
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    ]

/**
 * Validate origin for CORS
 */
export function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Generate CORS headers
 */
export function getCORSHeaders(origin: string | null): HeadersInit {
  const isValid = isValidOrigin(origin)
  
  return {
    'Access-Control-Allow-Origin': isValid && origin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}
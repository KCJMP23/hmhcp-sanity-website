import { getCSRFTokenFromCookies } from '@/lib/csrf-server'
import { headers } from 'next/headers'

// Server component for initial token injection
export async function CSRFTokenProvider({ children }: { children: React.ReactNode }) {
  // Try to get existing token from cookies first
  let token = await getCSRFTokenFromCookies()
  
  // If no token exists, we need to fetch it from the route handler
  // We can't set cookies here, so we'll use a client-side approach
  if (!token) {
    // Return children with a client-side token fetcher
    return (
      <>
        <CSRFTokenInitializer />
        {children}
      </>
    )
  }
  
  return (
    <>
      {/* Inject token into window object */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__CSRF_TOKEN__ = "${token}";`
        }}
      />
      {/* Also add as meta tag for alternative access */}
      <meta name="csrf-token" content={token} />
      {children}
    </>
  )
}

// Client component to fetch and set CSRF token
function CSRFTokenInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Fetch CSRF token on client side if not already set
          (function() {
            if (!window.__CSRF_TOKEN__) {
              fetch('/api/auth/csrf-token')
                .then(res => res.json())
                .then(data => {
                  if (data.token) {
                    window.__CSRF_TOKEN__ = data.token;
                    // Also update meta tag
                    const metaTag = document.querySelector('meta[name="csrf-token"]');
                    if (metaTag) {
                      metaTag.setAttribute('content', data.token);
                    } else {
                      const newMeta = document.createElement('meta');
                      newMeta.name = 'csrf-token';
                      newMeta.content = data.token;
                      document.head.appendChild(newMeta);
                    }
                  }
                })
                .catch(err => console.error('Failed to fetch CSRF token:', err));
            }
          })();
        `
      }}
    />
  )
}

// Client component for hidden input field
export function CSRFTokenInput({ name = 'csrf_token' }: { name?: string }) {
  'use client'
  
  const getToken = () => {
    if (typeof window === 'undefined') return ''
    
    // Try multiple sources
    const tokenFromWindow = (window as any).__CSRF_TOKEN__
    const tokenFromMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    const tokenFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-token='))
      ?.split('=')[1]
    
    return tokenFromWindow || tokenFromMeta || tokenFromCookie || ''
  }
  
  return (
    <input
      type="hidden"
      name={name}
      value={getToken()}
      readOnly
    />
  )
}
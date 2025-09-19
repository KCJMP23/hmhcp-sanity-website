/**
 * Critical CSS Management
 * Inlines critical CSS for above-the-fold content to improve LCP
 */

export const criticalCSS = `
/* Critical CSS for above-the-fold content */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #ffffff;
  color: #000000;
}

/* Hero section critical styles */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  color: white;
  max-width: 1200px;
  padding: 0 1rem;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 300;
  line-height: 1.1;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  font-weight: 400;
  line-height: 1.4;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.hero-cta:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Loading states */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive utilities */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
  }
  
  .hero-cta {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
  }
}

/* Dark mode critical styles */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #111827;
    color: #ffffff;
  }
}
`

export const resourceHints = {
  preload: [
    {
      // href: '/fonts/inter-var.woff2', // Font doesn't exist, using system fonts
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous'
    },
    {
      href: '/hero-research.jpg',
      as: 'image',
      media: '(min-width: 768px)'
    }
  ],
  prefetch: [
    {
      // href: '/api/blog/posts', // Removed - handled by component hooks
      as: 'fetch',
      crossorigin: 'anonymous'
    },
    {
      href: '/api/cms/content',
      as: 'fetch',
      crossorigin: 'anonymous'
    }
  ],
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://images.unsplash.com'
  ]
}

export function generateResourceHints() {
  const hints: string[] = []
  
  // Preload hints
  resourceHints.preload.forEach(hint => {
    const attributes = Object.entries(hint)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')
    hints.push(`<link rel="preload" ${attributes}>`)
  })
  
  // Prefetch hints
  resourceHints.prefetch.forEach(hint => {
    const attributes = Object.entries(hint)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')
    hints.push(`<link rel="prefetch" ${attributes}>`)
  })
  
  // Preconnect hints
  resourceHints.preconnect.forEach(origin => {
    hints.push(`<link rel="preconnect" href="${origin}" crossorigin>`)
  })
  
  return hints.join('\n')
}

/**
 * Critical CSS Optimizer
 * Inlines critical CSS and defers non-critical styles
 */

interface CriticalCSSConfig {
  enableInlineCSS: boolean
  enablePreloadCSS: boolean
  enableDeferCSS: boolean
  criticalSelectors: string[]
  nonCriticalSelectors: string[]
}

const DEFAULT_CONFIG: CriticalCSSConfig = {
  enableInlineCSS: true,
  enablePreloadCSS: true,
  enableDeferCSS: true,
  criticalSelectors: [
    'body',
    'html',
    '.hero',
    '.navbar',
    '.main-content',
    '.above-fold',
    '[data-critical]'
  ],
  nonCriticalSelectors: [
    '.admin',
    '.analytics',
    '.chat',
    '.footer',
    '.sidebar',
    '[data-non-critical]'
  ]
}

class CriticalCSSOptimizer {
  private config: CriticalCSSConfig
  private isInitialized = false

  constructor(config: Partial<CriticalCSSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize critical CSS optimization
   */
  public initialize(): void {
    if (this.isInitialized) return
    this.isInitialized = true

    console.log('🎨 Initializing Critical CSS Optimizer')

    if (this.config.enableInlineCSS) {
      this.inlineCriticalCSS()
    }

    if (this.config.enablePreloadCSS) {
      this.preloadCriticalCSS()
    }

    if (this.config.enableDeferCSS) {
      this.deferNonCriticalCSS()
    }
  }

  /**
   * Inline critical CSS
   */
  private inlineCriticalCSS(): void {
    // Critical CSS for above-the-fold content
    const criticalCSS = `
      /* Critical CSS for LCP optimization */
      body { 
        margin: 0; 
        font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background: #ffffff;
      }
      
      html { 
        scroll-behavior: smooth; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .hero { 
        min-height: 100vh; 
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        padding: 2rem;
      }
      
      .navbar { 
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        z-index: 1000;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        padding: 1rem 0;
      }
      
      .main-content { 
        margin-top: 80px; 
        min-height: calc(100vh - 80px);
      }
      
      .above-fold { 
        min-height: 100vh; 
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      /* Critical button styles */
      .btn-primary {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }
      
      /* Critical layout styles */
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      .grid {
        display: grid;
        gap: 1.5rem;
      }
      
      .grid-cols-1 { grid-template-columns: 1fr; }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      
      @media (max-width: 768px) {
        .grid-cols-2,
        .grid-cols-3 {
          grid-template-columns: 1fr;
        }
      }
      
      /* Critical typography */
      h1, h2, h3, h4, h5, h6 {
        margin: 0 0 1rem 0;
        font-weight: 600;
        line-height: 1.2;
      }
      
      h1 { font-size: 2.5rem; }
      h2 { font-size: 2rem; }
      h3 { font-size: 1.5rem; }
      
      p {
        margin: 0 0 1rem 0;
        line-height: 1.6;
      }
      
      /* Critical image styles */
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
      .hero img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }
      
      /* Critical loading states */
      .loading {
        opacity: 0.6;
        pointer-events: none;
      }
      
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Critical responsive design */
      @media (max-width: 640px) {
        .hero { padding: 1rem; }
        h1 { font-size: 2rem; }
        h2 { font-size: 1.5rem; }
        .container { padding: 0 0.5rem; }
      }
    `

    // Create style element
    const style = document.createElement('style')
    style.textContent = criticalCSS
    style.setAttribute('data-critical', 'true')
    
    // Insert at the beginning of head
    document.head.insertBefore(style, document.head.firstChild)
  }

  /**
   * Preload critical CSS
   */
  private preloadCriticalCSS(): void {
    // Preload main CSS file
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = '/_next/static/css/app/layout.css'
    link.as = 'style'
    link.onload = () => {
      // Convert preload to stylesheet
      link.rel = 'stylesheet'
    }
    document.head.appendChild(link)
  }

  /**
   * Defer non-critical CSS
   */
  private deferNonCriticalCSS(): void {
    // Find all stylesheets
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]')
    
    stylesheets.forEach(link => {
      const href = link.getAttribute('href') || ''
      
      // Skip critical stylesheets
      if (href.includes('layout.css') || link.hasAttribute('data-critical')) {
        return
      }
      
      // Defer non-critical stylesheets
      link.setAttribute('media', 'print')
      link.onload = () => {
        link.setAttribute('media', 'all')
      }
    })
  }

  /**
   * Optimize CSS delivery
   */
  public optimizeCSSDelivery(): void {
    // Remove unused CSS
    this.removeUnusedCSS()
    
    // Optimize CSS selectors
    this.optimizeSelectors()
    
    // Minify CSS
    this.minifyCSS()
  }

  /**
   * Remove unused CSS
   */
  private removeUnusedCSS(): void {
    // This would typically be done at build time
    // For runtime, we can hide unused styles
    const unusedSelectors = [
      '.admin-only',
      '.debug-mode',
      '.development',
      '.test-mode'
    ]

    unusedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      if (elements.length === 0) {
        // Hide unused CSS rules
        const style = document.createElement('style')
        style.textContent = `${selector} { display: none !important; }`
        document.head.appendChild(style)
      }
    })
  }

  /**
   * Optimize CSS selectors
   */
  private optimizeSelectors(): void {
    // Optimize frequently used selectors
    const optimizations = [
      {
        selector: '.btn',
        optimization: 'button'
      },
      {
        selector: '.card',
        optimization: '[class*="card"]'
      }
    ]

    optimizations.forEach(({ selector, optimization }) => {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 10) {
        // Add optimized class
        elements.forEach(element => {
          element.classList.add('optimized')
        })
      }
    })
  }

  /**
   * Minify CSS
   */
  private minifyCSS(): void {
    // Basic CSS minification
    const styles = document.querySelectorAll('style[data-critical]')
    
    styles.forEach(style => {
      let css = style.textContent || ''
      
      // Remove comments
      css = css.replace(/\/\*[\s\S]*?\*\//g, '')
      
      // Remove extra whitespace
      css = css.replace(/\s+/g, ' ')
      css = css.replace(/;\s*}/g, '}')
      css = css.replace(/{\s*/g, '{')
      css = css.replace(/;\s*/g, ';')
      
      // Remove unnecessary semicolons
      css = css.replace(/;}/g, '}')
      
      style.textContent = css.trim()
    })
  }
}

// Export singleton instance
export const criticalCSSOptimizer = new CriticalCSSOptimizer()

// Export initialization function
export function initializeCriticalCSSOptimization(): void {
  criticalCSSOptimizer.initialize()
}

// Export optimization function
export function optimizeCSSDelivery(): void {
  criticalCSSOptimizer.optimizeCSSDelivery()
}

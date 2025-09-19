// lib/performance/critical-css-inliner.ts
// Critical CSS inlining for better FCP and LCP
// This doesn't change the design system, just optimizes loading

export function initializeCriticalCSSInliner() {
  if (typeof window === 'undefined') return;

  console.log('Initializing Critical CSS Inliner...');

  // Critical CSS for above-the-fold content
  const criticalCSS = `
    /* Critical CSS for above-the-fold content */
    .hero-section {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      color: white;
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .hero-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .hero-cta {
      background: white;
      color: #1e40af;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s;
    }
    
    .hero-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
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
    
    .grid-cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    
    @media (min-width: 768px) {
      .grid-cols-1 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    
    @media (min-width: 1024px) {
      .grid-cols-1 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    
    /* Critical typography */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.25;
      margin-bottom: 0.5rem;
    }
    
    p {
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    /* Critical button styles */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
    }
    
    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #2563eb;
    }
    
    /* Critical card styles */
    .card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
    }
    
    /* Critical spacing */
    .py-24 {
      padding-top: 6rem;
      padding-bottom: 6rem;
    }
    
    .px-4 {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    
    .mb-16 {
      margin-bottom: 4rem;
    }
    
    .text-center {
      text-align: center;
    }
    
    /* Critical responsive utilities */
    .hidden {
      display: none;
    }
    
    @media (min-width: 768px) {
      .md\\:block {
        display: block;
      }
    }
    
    @media (min-width: 1024px) {
      .lg\\:block {
        display: block;
      }
    }
  `;

  // Inline critical CSS
  const inlineCriticalCSS = () => {
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    style.setAttribute('data-critical', 'true');
    document.head.insertBefore(style, document.head.firstChild);
  };

  // Defer non-critical CSS
  const deferNonCriticalCSS = () => {
    const nonCriticalLinks = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
    nonCriticalLinks.forEach(link => {
      const originalHref = link.getAttribute('href');
      if (originalHref && !originalHref.includes('critical')) {
        link.media = 'print';
        link.onload = () => {
          link.media = 'all';
        };
      }
    });
  };

  // Preload critical fonts
  const preloadCriticalFonts = () => {
    const fontPreloads = [
      {
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        as: 'style'
      }
    ];

    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.href;
      link.as = font.as;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // Execute optimizations
  inlineCriticalCSS();
  preloadCriticalFonts();
  
  // Defer non-critical CSS after initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', deferNonCriticalCSS);
  } else {
    deferNonCriticalCSS();
  }

  console.log('Critical CSS Inliner initialized successfully');
}

export default initializeCriticalCSSInliner;

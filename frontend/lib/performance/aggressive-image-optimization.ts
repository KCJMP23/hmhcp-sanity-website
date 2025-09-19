// lib/performance/aggressive-image-optimization.ts
// Aggressive image optimization for LCP improvement

export function initializeAggressiveImageOptimization() {
  if (typeof window === 'undefined') return;

  console.log('Initializing Aggressive Image Optimization...');

  // Preload critical images immediately
  const criticalImages = [
    '/hero-research.jpg',
    '/hero-technology.jpg', 
    '/hero-consultation.jpg'
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  });

  // Optimize all images on the page
  const optimizeImages = () => {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="eager" to above-the-fold images
      if (isAboveTheFold(img)) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else {
        img.loading = 'lazy';
        img.fetchPriority = 'low';
      }

      // Add decoding="async" for better performance
      img.decoding = 'async';

      // Add error handling
      img.onerror = () => {
        console.warn(`Failed to load image: ${img.src}`);
        img.style.display = 'none';
      };
    });
  };

  // Check if image is above the fold
  const isAboveTheFold = (img: HTMLImageElement): boolean => {
    const rect = img.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  // Run optimization immediately and on scroll
  optimizeImages();
  
  // Re-optimize on scroll for lazy loading
  let scrollTimeout: NodeJS.Timeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(optimizeImages, 100);
  });

  // Intersection Observer for better lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.loading = 'eager';
          img.fetchPriority = 'high';
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // Observe all images
    document.querySelectorAll('img').forEach(img => {
      imageObserver.observe(img);
    });
  }

  console.log('Aggressive Image Optimization initialized successfully.');
}

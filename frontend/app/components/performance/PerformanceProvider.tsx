'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring, reportWebVitals } from '@/lib/performance/web-vitals';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring();

    // Set up web vitals reporting
    reportWebVitals((metric) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vital:', {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
        });
      }

      // Send to custom analytics endpoint
      fetch('/api/analytics/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail in production
      });
    });
  }, []);

  return <>{children}</>;
}

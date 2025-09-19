'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { VisitorTracker } from '@/lib/analytics/visitor-tracker';

export function VisitorAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize visitor tracker
    const tracker = VisitorTracker.getInstance();

    // Track initial page view
    tracker.trackPageView(window.location.href, document.title);

    // Cleanup on unmount
    return () => {
      // The tracker persists across the app, so we don't destroy it
    };
  }, []);

  useEffect(() => {
    // Track page views on route change
    const tracker = VisitorTracker.getInstance();
    tracker.trackPageView(window.location.href, document.title);
  }, [pathname]);

  return <>{children}</>;
}
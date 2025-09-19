import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

interface RealtimeMetrics {
  activeVisitors: {
    count: number;
    locations: Array<{
      country: string;
      region: string;
      city: string;
      lat: number;
      lng: number;
      count: number;
    }>;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    avgPageLoadTime: number;
    errorRate: number;
  };
  traffic: {
    requestsPerSecond: number;
    pageViewsPerMinute: number;
    bounceRate: number;
  };
  health: {
    uptime: number;
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
    }>;
  };
}

interface MetricsUpdateHandler {
  (metrics: RealtimeMetrics): void;
}

interface AlertHandler {
  (alert: any): void;
}

export class RealtimeMonitor {
  private socket: Socket | null = null;
  private metrics: RealtimeMetrics | null = null;
  private metricsHandlers: MetricsUpdateHandler[] = [];
  private alertHandlers: AlertHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private visitorData: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.collectVisitorData();
    }
  }

  connect(url?: string) {
    if (this.socket?.connected) return;

    const socketUrl = url || process.env.NEXT_PUBLIC_MONITORING_WS_URL || '';
    
    // For now, we'll use polling instead of WebSocket for simplicity
    // In production, you'd use a proper WebSocket server
    this.startPolling();
    this.sendVisitorData();
  }

  private startPolling() {
    // Poll for updates every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/monitoring/realtime');
        if (response.ok) {
          const data = await response.json();
          this.handleMetricsUpdate(data);
        }
      } catch (error) {
        logger.error('Failed to fetch realtime metrics:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
      }
    }, 5000);

    // Store interval for cleanup
    this.heartbeatInterval = pollInterval;
  }

  private async sendVisitorData() {
    if (!this.visitorData) return;

    try {
      await fetch('/api/monitoring/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.visitorData),
      });
    } catch (error) {
      logger.error('Failed to send visitor data:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }

    // Update visitor data periodically
    setInterval(() => {
      this.updateVisitorData();
    }, 30000); // Every 30 seconds
  }

  private collectVisitorData() {
    this.visitorData = {
      visitorId: this.getVisitorId(),
      sessionId: this.getSessionId(),
      pageUrl: window.location.pathname,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer,
      timestamp: Date.now(),
    };

    // Get geolocation if available (requires user permission)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.visitorData.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        },
        () => {
          // Silently fail if geolocation is denied
        }
      );
    }
  }

  private updateVisitorData() {
    if (!this.visitorData) return;

    this.visitorData.pageUrl = window.location.pathname;
    this.visitorData.timestamp = Date.now();
    
    fetch('/api/monitoring/visitor/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: this.visitorData.visitorId,
        pageUrl: this.visitorData.pageUrl,
      }),
    }).catch(console.error);
  }

  private handleMetricsUpdate(metrics: RealtimeMetrics) {
    this.metrics = metrics;
    this.metricsHandlers.forEach(handler => handler(metrics));
  }

  private handleAlert(alert: any) {
    this.alertHandlers.forEach(handler => handler(alert));
  }

  onMetricsUpdate(handler: MetricsUpdateHandler) {
    this.metricsHandlers.push(handler);
    // Send current metrics if available
    if (this.metrics) {
      handler(this.metrics);
    }
  }

  onAlert(handler: AlertHandler) {
    this.alertHandlers.push(handler);
  }

  getMetrics(): RealtimeMetrics | null {
    return this.metrics;
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private getVisitorId(): string {
    let visitorId = localStorage.getItem('monitoring_visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('monitoring_visitor_id', visitorId);
    }
    return visitorId;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  // Track page changes
  trackPageView() {
    this.updateVisitorData();
  }

  // Get active visitor count
  getActiveVisitorCount(): number {
    return this.metrics?.activeVisitors.count || 0;
  }

  // Get current page performance
  getCurrentPerformance() {
    return this.metrics?.performance || null;
  }

  // Get service health
  getServiceHealth() {
    return this.metrics?.health.services || [];
  }

  // Check if a specific service is healthy
  isServiceHealthy(serviceName: string): boolean {
    const service = this.metrics?.health.services.find(s => s.name === serviceName);
    return service?.status === 'healthy';
  }
}

// Singleton instance
let realtimeMonitor: RealtimeMonitor | null = null;

export function initializeRealtimeMonitoring() {
  if (typeof window !== 'undefined' && !realtimeMonitor) {
    realtimeMonitor = new RealtimeMonitor();
    realtimeMonitor.connect();
  }
  return realtimeMonitor;
}

export function getRealtimeMonitor() {
  return realtimeMonitor;
}
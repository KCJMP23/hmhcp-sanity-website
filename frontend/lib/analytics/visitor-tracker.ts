// Simple visitor tracker for CMS functionality
// This supports the full CMS system deployment

import { logger } from '@/lib/logger'

export interface VisitorSession {
  id: string
  visitorId: string
  startTime: number
  lastActivity: number
  pageViews: number
  referrer?: string
  userAgent: string
  ipAddress?: string
  country?: string
  city?: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
}

export interface PageView {
  id: string
  sessionId: string
  url: string
  title: string
  timestamp: number
  duration?: number
  scrollDepth?: number
}

export interface VisitorEvent {
  id: string
  sessionId: string
  type: string
  data: Record<string, any>
  timestamp: number
}

export class VisitorTracker {
  private static instance: VisitorTracker
  private sessions: Map<string, VisitorSession> = new Map()
  private pageViews: Map<string, PageView> = new Map()
  private events: Map<string, VisitorEvent> = new Map()
  private isEnabled = true

  static getInstance(): VisitorTracker {
    if (!VisitorTracker.instance) {
      VisitorTracker.instance = new VisitorTracker()
    }
    return VisitorTracker.instance
  }

  createSession(visitorId: string, userAgent: string, referrer?: string, ipAddress?: string): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const session: VisitorSession = {
      id: sessionId,
      visitorId,
      startTime: now,
      lastActivity: now,
      pageViews: 0,
      referrer,
      userAgent,
      ipAddress,
      deviceType: this.detectDeviceType(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent)
    }

    this.sessions.set(sessionId, session)
    logger.info('Visitor session created', { sessionId, visitorId })
    return sessionId
  }

  recordPageView(sessionId: string, url: string, title: string): string {
    if (!this.isEnabled) return ''

    const session = this.sessions.get(sessionId)
    if (!session) {
      logger.warn('Page view recorded for unknown session', { sessionId, url })
      return ''
    }

    const pageViewId = `pageview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const pageView: PageView = {
      id: pageViewId,
      sessionId,
      url,
      title,
      timestamp: now
    }

    this.pageViews.set(pageViewId, pageView)
    
    // Update session
    session.pageViews++
    session.lastActivity = now

    logger.debug('Page view recorded', { sessionId, url, title })
    return pageViewId
  }

  recordEvent(sessionId: string, type: string, data: Record<string, any>): string {
    if (!this.isEnabled) return ''

    const session = this.sessions.get(sessionId)
    if (!session) {
      logger.warn('Event recorded for unknown session', { sessionId, type })
      return ''
    }

    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const event: VisitorEvent = {
      id: eventId,
      sessionId,
      type,
      data,
      timestamp: now
    }

    this.events.set(eventId, event)
    
    // Update session
    session.lastActivity = now

    logger.debug('Visitor event recorded', { sessionId, type, data })
    return eventId
  }

  updatePageViewDuration(pageViewId: string, duration: number): void {
    const pageView = this.pageViews.get(pageViewId)
    if (pageView) {
      pageView.duration = duration
    }
  }

  updatePageViewScrollDepth(pageViewId: string, scrollDepth: number): void {
    const pageView = this.pageViews.get(pageViewId)
    if (pageView) {
      pageView.scrollDepth = scrollDepth
    }
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      const duration = Date.now() - session.startTime
      logger.info('Visitor session ended', { sessionId, duration, pageViews: session.pageViews })
      this.sessions.delete(sessionId)
    }
  }

  getSession(sessionId: string): VisitorSession | undefined {
    return this.sessions.get(sessionId)
  }

  getSessionPageViews(sessionId: string): PageView[] {
    return Array.from(this.pageViews.values()).filter(pv => pv.sessionId === sessionId)
  }

  getSessionEvents(sessionId: string): VisitorEvent[] {
    return Array.from(this.events.values()).filter(ev => ev.sessionId === sessionId)
  }

  getAllSessions(): VisitorSession[] {
    return Array.from(this.sessions.values())
  }

  getActiveSessions(): VisitorSession[] {
    const now = Date.now()
    const activeTimeout = 30 * 60 * 1000 // 30 minutes
    return Array.from(this.sessions.values()).filter(s => (now - s.lastActivity) < activeTimeout)
  }

  getSessionsByVisitor(visitorId: string): VisitorSession[] {
    return Array.from(this.sessions.values()).filter(s => s.visitorId === visitorId)
  }

  getPageViewsByUrl(url: string): PageView[] {
    return Array.from(this.pageViews.values()).filter(pv => pv.url === url)
  }

  getEventsByType(type: string): VisitorEvent[] {
    return Array.from(this.events.values()).filter(ev => ev.type === type)
  }

  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    const mobileRegex = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    const tabletRegex = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i

    if (tabletRegex.test(userAgent)) return 'tablet'
    if (mobileRegex.test(userAgent)) return 'mobile'
    return 'desktop'
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac OS')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  enable(): void {
    this.isEnabled = true
    logger.info('Visitor tracking enabled')
  }

  disable(): void {
    this.isEnabled = false
    logger.info('Visitor tracking disabled')
  }

  isTrackingEnabled(): boolean {
    return this.isEnabled
  }

  clearData(): void {
    this.sessions.clear()
    this.pageViews.clear()
    this.events.clear()
    logger.info('Visitor tracking data cleared')
  }

  getStats(): {
    totalSessions: number
    activeSessions: number
    totalPageViews: number
    totalEvents: number
  } {
    return {
      totalSessions: this.sessions.size,
      activeSessions: this.getActiveSessions().length,
      totalPageViews: this.pageViews.size,
      totalEvents: this.events.size
    }
  }

  // Compatibility method for existing code
  trackPageView(url: string, title?: string): void {
    if (!this.isEnabled) return
    
    // Create a default session if none exists
    let sessionId = Array.from(this.sessions.keys())[0]
    if (!sessionId) {
      const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionId = this.createSession(visitorId, navigator.userAgent)
    }
    
    this.recordPageView(sessionId, url, title || 'Unknown Page')
  }
}

// Export default instance
export const visitorTracker = VisitorTracker.getInstance()

export default VisitorTracker
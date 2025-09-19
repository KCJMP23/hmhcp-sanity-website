// Page status management for archived/draft pages
export enum PageStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
  REMOVED = 'removed'
}

export interface PageStatusConfig {
  status: PageStatus
  redirectTo?: string
  message?: string
}

// Page status configuration
export const pageStatusMap: Record<string, PageStatusConfig> = {
  // Archive/Draft pages
  '/leadership': {
    status: PageStatus.ARCHIVED,
    message: 'This page is currently being updated and will be restored soon.'
  },
  '/services/education-training': {
    status: PageStatus.ARCHIVED,
    message: 'This service page is being enhanced and will be available soon.'
  },
  '/case-studies': {
    status: PageStatus.ARCHIVED,
    message: 'Our case studies are being updated with new content.'
  },
  '/webinars': {
    status: PageStatus.ARCHIVED,
    message: 'Our webinar content is being refreshed.'
  },
  '/faq': {
    status: PageStatus.ARCHIVED,
    message: 'Our FAQ section is being improved.'
  },
  
  // Removed pages
  '/platforms/quality-metrics': {
    status: PageStatus.REMOVED,
    redirectTo: '/platforms'
  },
  '/services/workforce-development': {
    status: PageStatus.REMOVED,
    redirectTo: '/services'
  },
  
  // Consolidated pages
  '/careers/culture': {
    status: PageStatus.REMOVED,
    redirectTo: '/careers'
  },
  '/careers/open-positions': {
    status: PageStatus.REMOVED,
    redirectTo: '/careers'
  },
  '/services/healthcare-technology-consulting': {
    status: PageStatus.REMOVED,
    redirectTo: '/services/strategic-consulting'
  }
}

export function getPageStatus(pathname: string): PageStatusConfig | null {
  return pageStatusMap[pathname] || null
}

export function isPageActive(pathname: string): boolean {
  const status = getPageStatus(pathname)
  return !status || status.status === PageStatus.ACTIVE
}

export function shouldShowInNavigation(pathname: string): boolean {
  const status = getPageStatus(pathname)
  return !status || status.status === PageStatus.ACTIVE
}
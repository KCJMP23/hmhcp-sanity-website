/**
 * Centralized API endpoint constants
 * This file contains all API endpoint paths to ensure consistency
 * across the application and prevent path mismatch errors.
 */

export const API_ENDPOINTS = {
  PUBLICATIONS: {
    BASE: '/api/admin/publications',
    LIST: '/api/admin/publications',
    CREATE: '/api/admin/publications',
    SINGLE: (id: string) => `/api/admin/publications/${id}`,
    UPDATE: (id: string) => `/api/admin/publications/${id}`,
    DELETE: (id: string) => `/api/admin/publications/${id}`,
    // Future endpoints for Story 3.7b
    SEARCH_PUBMED: '/api/admin/publications/search/pubmed',
    IMPORT_PUBMED: '/api/admin/publications/import/pubmed',
    IMPORT_DOI: '/api/admin/publications/import/doi',
    IMPORT_BULK: '/api/admin/publications/import/bulk',
    // Future endpoints for Story 3.7c
    CITE: (id: string) => `/api/admin/publications/${id}/cite`,
    VERSIONS: (id: string) => `/api/admin/publications/${id}/versions`,
    FULLTEXT_SEARCH: '/api/admin/publications/search/fulltext',
  },
  WHITEPAPERS: {
    BASE: '/api/admin/whitepapers',
    LIST: '/api/admin/whitepapers',
    CREATE: '/api/admin/whitepapers',
    SINGLE: (id: string) => `/api/admin/whitepapers/${id}`,
    UPDATE: (id: string) => `/api/admin/whitepapers/${id}`,
    DELETE: (id: string) => `/api/admin/whitepapers/${id}`,
    VERSIONS: (id: string) => `/api/admin/whitepapers/${id}/versions`,
    EXPORT: '/api/admin/whitepapers/export',
  },
  CLINICAL_STUDIES: {
    BASE: '/api/admin/studies',
    LIST: '/api/admin/studies',
    CREATE: '/api/admin/studies',
    SINGLE: (id: string) => `/api/admin/studies/${id}`,
    UPDATE: (id: string) => `/api/admin/studies/${id}`,
    DELETE: (id: string) => `/api/admin/studies/${id}`,
    SYNC_CLINICALTRIALS: '/api/admin/studies/sync-clinicaltrials',
    EXPORT: '/api/admin/studies/export',
  },
  CMS: {
    PUBLICATIONS: '/api/cms/publications',
    WHITEPAPERS: '/api/cms/whitepapers',
    STUDIES: '/api/cms/studies',
  }
} as const

// Type-safe endpoint getter
export type ApiEndpoints = typeof API_ENDPOINTS
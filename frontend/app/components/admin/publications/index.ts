/**
 * Publication Components Index - Story 3.7c Task 4
 * Central export point for all publication-related components
 */

// Citation Components
export { CitationGenerator } from './citations/citation-generator'
export { CitationPreview } from './citations/citation-preview'

// Search Components
export { SearchBar } from './search/search-bar'
export { SearchFilters } from './search/search-filters'
export { SearchResults } from './search/search-results'

// Version Components
export { VersionHistory } from './versions/version-history'

// Bulk Operations
export { BulkExportConfig } from './bulk/bulk-export-config'

// Error Handling
export { PublicationErrorBoundary, withErrorBoundary, useAsyncError } from './error-boundary'

// Re-export hooks for convenience
export { useCitationApi } from '@/hooks/use-citation-api'
export { useSearchApi } from '@/hooks/use-search-api'
export { useVersionApi } from '@/hooks/use-version-api'
export { useBulkExport } from '@/hooks/use-bulk-export'

// Main Interface
export { PublicationInterface } from './publication-interface'

// Re-export utilities
export * from '@/lib/utils/citation-formatting'
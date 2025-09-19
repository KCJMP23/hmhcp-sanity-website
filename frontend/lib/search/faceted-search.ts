/**
 * Faceted Search Implementation with Advanced TypeScript Patterns
 * Comprehensive faceted search with discriminated unions and type-safe filtering
 */

import type {
  SearchableContentType,
  SearchableContent,
  SearchContentMetadata,
  SearchFacet,
  SearchFacetResults,
  SearchFilters,
  SearchQuery,
  SearchResponse,
  SearchId,
  RelevanceScore,
  HealthcareContentType,
} from './types'

// ============================================================================
// FACET CONFIGURATION WITH DISCRIMINATED UNIONS
// ============================================================================

/**
 * Base facet configuration with type discrimination
 */
export type FacetConfiguration<T extends SearchableContentType> = 
  | TermsFacetConfig<T>
  | RangeFacetConfig<T>
  | DateRangeFacetConfig<T>
  | NestedFacetConfig<T>
  | HealthcareFacetConfig<T>

/**
 * Terms facet for categorical data
 */
export interface TermsFacetConfig<T extends SearchableContentType> {
  readonly type: 'terms'
  readonly name: string
  readonly field: keyof SearchableContent<T> | keyof SearchContentMetadata[T]
  readonly size: number
  readonly minCount: number
  readonly sort: 'count' | 'term' | 'relevance'
  readonly include?: string | string[]
  readonly exclude?: string | string[]
  readonly missing?: string // Label for missing values
}

/**
 * Range facet for numerical data
 */
export interface RangeFacetConfig<T extends SearchableContentType> {
  readonly type: 'range'
  readonly name: string
  readonly field: keyof SearchableContent<T> | keyof SearchContentMetadata[T]
  readonly ranges: readonly {
    readonly from?: number
    readonly to?: number
    readonly label: string
    readonly key?: string
  }[]
  readonly keyed?: boolean
}

/**
 * Date range facet for temporal data
 */
export interface DateRangeFacetConfig<T extends SearchableContentType> {
  readonly type: 'date_range'
  readonly name: string
  readonly field: 'createdAt' | 'updatedAt' | 'publishedAt'
  readonly ranges: readonly {
    readonly from?: string
    readonly to?: string
    readonly label: string
    readonly key?: string
  }[]
  readonly format?: string
  readonly timeZone?: string
}

/**
 * Nested facet for complex object structures
 */
export interface NestedFacetConfig<T extends SearchableContentType> {
  readonly type: 'nested'
  readonly name: string
  readonly path: string
  readonly facet: FacetConfiguration<T>
}

/**
 * Healthcare-specific facet configurations
 */
export interface HealthcareFacetConfig<T extends SearchableContentType> {
  readonly type: 'healthcare'
  readonly name: string
  readonly category: T extends HealthcareContentType ? T : never
  readonly field: keyof SearchContentMetadata[T]
  readonly medicalContext?: {
    readonly terminology?: 'icd10' | 'snomed' | 'loinc' | 'cpt'
    readonly hierarchical?: boolean
    readonly synonyms?: boolean
  }
}

// ============================================================================
// FACET RESULTS WITH TYPE SAFETY
// ============================================================================

/**
 * Comprehensive facet results with discriminated union types
 */
export type FacetResult<T extends SearchableContentType> = 
  | TermsFacetResult
  | RangeFacetResult
  | DateRangeFacetResult
  | NestedFacetResult<T>
  | HealthcareFacetResult

/**
 * Terms facet results
 */
export interface TermsFacetResult {
  readonly type: 'terms'
  readonly name: string
  readonly buckets: readonly {
    readonly key: string
    readonly count: number
    readonly selected: boolean
    readonly percentage?: number
  }[]
  readonly total: number
  readonly missing?: number
  readonly other?: number
}

/**
 * Range facet results
 */
export interface RangeFacetResult {
  readonly type: 'range'
  readonly name: string
  readonly buckets: readonly {
    readonly key: string
    readonly from?: number
    readonly to?: number
    readonly count: number
    readonly selected: boolean
    readonly label: string
  }[]
  readonly total: number
}

/**
 * Date range facet results
 */
export interface DateRangeFacetResult {
  readonly type: 'date_range'
  readonly name: string
  readonly buckets: readonly {
    readonly key: string
    readonly from?: string
    readonly to?: string
    readonly count: number
    readonly selected: boolean
    readonly label: string
  }[]
  readonly total: number
}

/**
 * Nested facet results
 */
export interface NestedFacetResult<T extends SearchableContentType> {
  readonly type: 'nested'
  readonly name: string
  readonly count: number
  readonly facet: FacetResult<T>
}

/**
 * Healthcare facet results with medical terminology
 */
export interface HealthcareFacetResult {
  readonly type: 'healthcare'
  readonly name: string
  readonly buckets: readonly {
    readonly key: string
    readonly count: number
    readonly selected: boolean
    readonly medicalCode?: string
    readonly description?: string
    readonly hierarchy?: string[]
    readonly synonyms?: string[]
  }[]
  readonly total: number
  readonly terminology?: string
}

// ============================================================================
// FACETED SEARCH ENGINE
// ============================================================================

/**
 * Advanced faceted search engine with healthcare specialization
 */
export class FacetedSearchEngine<T extends SearchableContentType = SearchableContentType> {
  private readonly facetConfigs: Map<string, FacetConfiguration<T>> = new Map()
  private readonly facetResultsCache: Map<string, FacetResult<T>> = new Map()

  /**
   * Register a facet configuration
   */
  registerFacet(config: FacetConfiguration<T>): this {
    this.facetConfigs.set(config.name, config)
    return this
  }

  /**
   * Register multiple facet configurations
   */
  registerFacets(configs: FacetConfiguration<T>[]): this {
    for (const config of configs) {
      this.registerFacet(config)
    }
    return this
  }

  /**
   * Execute faceted search with type-safe results
   */
  async executeFacetedSearch(
    query: SearchQuery<T>,
    selectedFacets: Record<string, string[] | { from?: number | string; to?: number | string }>
  ): Promise<{
    results: SearchResponse<T>
    facets: Record<string, FacetResult<T>>
  }> {
    // Apply selected facets to the query
    const enhancedQuery = this.applyFacetFilters(query, selectedFacets)

    // Calculate facet results (this would integrate with actual search backend)
    const facetResults = await this.calculateFacetResults(enhancedQuery, selectedFacets)

    // Execute the main search (this would be replaced with actual search implementation)
    const searchResults = await this.executeSearchWithFacets(enhancedQuery)

    return {
      results: searchResults,
      facets: facetResults
    }
  }

  /**
   * Get facet suggestions based on current query
   */
  async getFacetSuggestions(
    query: string,
    contentTypes: T[]
  ): Promise<{
    suggested: FacetConfiguration<T>[]
    popular: { facet: string; usage: number }[]
  }> {
    const suggested: FacetConfiguration<T>[] = []
    const popular: { facet: string; usage: number }[] = []

    // Suggest facets based on content types
    for (const contentType of contentTypes) {
      const contentFacets = this.getSuggestedFacetsForType(contentType)
      suggested.push(...contentFacets)
    }

    // Mock popular facets (in production, would come from analytics)
    popular.push(
      { facet: 'status', usage: 85 },
      { facet: 'author', usage: 72 },
      { facet: 'created_date', usage: 68 }
    )

    return { suggested, popular }
  }

  /**
   * Build dynamic facet configurations based on content analysis
   */
  async buildDynamicFacets(contentTypes: T[]): Promise<FacetConfiguration<T>[]> {
    const dynamicFacets: FacetConfiguration<T>[] = []

    for (const contentType of contentTypes) {
      // Status facet for all content types
      dynamicFacets.push({
        type: 'terms',
        name: `${contentType}_status`,
        field: 'status',
        size: 10,
        minCount: 1,
        sort: 'count'
      } as TermsFacetConfig<T>)

      // Date range facet for all content types
      dynamicFacets.push({
        type: 'date_range',
        name: `${contentType}_created`,
        field: 'createdAt',
        ranges: [
          { label: 'Today', from: 'now-1d/d', to: 'now' },
          { label: 'This Week', from: 'now-1w/w', to: 'now' },
          { label: 'This Month', from: 'now-1M/M', to: 'now' },
          { label: 'This Year', from: 'now-1y/y', to: 'now' }
        ]
      } as DateRangeFacetConfig<T>)

      // Content-type specific facets
      if (this.isHealthcareContentType(contentType)) {
        dynamicFacets.push(...this.buildHealthcareFacets(contentType as T & HealthcareContentType))
      }

      if (contentType === 'media') {
        dynamicFacets.push({
          type: 'terms',
          name: 'media_type',
          field: 'mimeType',
          size: 20,
          minCount: 1,
          sort: 'count'
        } as TermsFacetConfig<T>)

        dynamicFacets.push({
          type: 'range',
          name: 'file_size',
          field: 'fileSize',
          ranges: [
            { to: 1024 * 1024, label: 'Small (< 1MB)' },
            { from: 1024 * 1024, to: 10 * 1024 * 1024, label: 'Medium (1-10MB)' },
            { from: 10 * 1024 * 1024, label: 'Large (> 10MB)' }
          ]
        } as unknown as RangeFacetConfig<T>)
      }

      if (contentType === 'users') {
        dynamicFacets.push({
          type: 'terms',
          name: 'user_role',
          field: 'role',
          size: 15,
          minCount: 1,
          sort: 'term'
        } as TermsFacetConfig<T>)
      }
    }

    return dynamicFacets
  }

  /**
   * Validate facet configuration for type safety
   */
  validateFacetConfig(config: FacetConfiguration<T>): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!config.name?.trim()) {
      errors.push('Facet name is required')
    }

    if ('field' in config && !config.field) {
      errors.push('Facet field is required')
    }

    // Type-specific validation
    switch (config.type) {
      case 'terms':
        const termsConfig = config as TermsFacetConfig<T>
        if (termsConfig.size > 1000) {
          warnings.push('Large facet size may impact performance')
        }
        break

      case 'range':
        const rangeConfig = config as RangeFacetConfig<T>
        if (!rangeConfig.ranges?.length) {
          errors.push('Range facet must have at least one range')
        }
        break

      case 'date_range':
        const dateConfig = config as DateRangeFacetConfig<T>
        if (!dateConfig.ranges?.length) {
          errors.push('Date range facet must have at least one range')
        }
        break

      case 'healthcare':
        const healthcareConfig = config as HealthcareFacetConfig<T>
        if (!this.isHealthcareContentType(healthcareConfig.category)) {
          errors.push('Healthcare facet can only be used with healthcare content types')
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private applyFacetFilters(
    query: SearchQuery<T>,
    selectedFacets: Record<string, string[] | { from?: number | string; to?: number | string }>
  ): SearchQuery<T> {
    let enhancedFilters = { ...query.filters }

    for (const [facetName, facetValue] of Object.entries(selectedFacets)) {
      const facetConfig = this.facetConfigs.get(facetName)
      if (!facetConfig) continue

      // Apply filter based on facet type
      switch (facetConfig.type) {
        case 'terms':
          if (Array.isArray(facetValue)) {
            enhancedFilters = this.applyTermsFilter(enhancedFilters, facetConfig, facetValue)
          }
          break

        case 'range':
        case 'date_range':
          if (!Array.isArray(facetValue)) {
            enhancedFilters = this.applyRangeFilter(enhancedFilters, facetConfig, facetValue)
          }
          break

        case 'healthcare':
          if (Array.isArray(facetValue)) {
            enhancedFilters = this.applyHealthcareFilter(enhancedFilters, facetConfig, facetValue)
          }
          break
      }
    }

    return {
      ...query,
      filters: enhancedFilters
    }
  }

  private applyTermsFilter(
    filters: SearchFilters<T>,
    config: TermsFacetConfig<T>,
    values: string[]
  ): SearchFilters<T> {
    const fieldName = config.field as string
    
    // Apply the filter based on field name
    switch (fieldName) {
      case 'status':
        return {
          ...filters,
          status: values as SearchableContent['status'][]
        }
      case 'authorId':
        return {
          ...filters,
          author: values
        }
      case 'tags':
        return {
          ...filters,
          tags: values
        }
      case 'categories':
        return {
          ...filters,
          categories: values
        }
      default:
        // For metadata fields, we'd need to extend the filters type
        return filters
    }
  }

  private applyRangeFilter(
    filters: SearchFilters<T>,
    config: RangeFacetConfig<T> | DateRangeFacetConfig<T>,
    value: { from?: number | string; to?: number | string }
  ): SearchFilters<T> {
    if (config.type === 'date_range') {
      const dateConfig = config as DateRangeFacetConfig<T>
      return {
        ...filters,
        dateRange: {
          field: dateConfig.field,
          from: value.from as string,
          to: value.to as string
        }
      }
    }

    // For numeric ranges, we'd need to extend the filters type
    return filters
  }

  private applyHealthcareFilter(
    filters: SearchFilters<T>,
    config: HealthcareFacetConfig<T>,
    values: string[]
  ): SearchFilters<T> {
    // Healthcare-specific filter logic would go here
    // This would map to the appropriate healthcare filter fields
    return filters
  }

  private async calculateFacetResults(
    query: SearchQuery<T>,
    selectedFacets: Record<string, string[] | { from?: number | string; to?: number | string }>
  ): Promise<Record<string, FacetResult<T>>> {
    const results: Record<string, FacetResult<T>> = {}

    for (const [name, config] of this.facetConfigs) {
      const isSelected = selectedFacets[name] !== undefined

      switch (config.type) {
        case 'terms':
          results[name] = await this.calculateTermsFacet(config, isSelected) as FacetResult<T>
          break

        case 'range':
          results[name] = await this.calculateRangeFacet(config, isSelected) as FacetResult<T>
          break

        case 'date_range':
          results[name] = await this.calculateDateRangeFacet(config, isSelected) as FacetResult<T>
          break

        case 'healthcare':
          results[name] = await this.calculateHealthcareFacet(config, isSelected) as FacetResult<T>
          break
      }
    }

    return results
  }

  private async calculateTermsFacet(
    config: TermsFacetConfig<T>,
    isSelected: boolean
  ): Promise<TermsFacetResult> {
    // Mock implementation - would integrate with actual search backend
    const mockBuckets = [
      { key: 'published', count: 45, selected: false, percentage: 75 },
      { key: 'draft', count: 12, selected: false, percentage: 20 },
      { key: 'archived', count: 3, selected: false, percentage: 5 }
    ]

    return {
      type: 'terms',
      name: config.name,
      buckets: mockBuckets,
      total: mockBuckets.reduce((sum, bucket) => sum + bucket.count, 0),
      missing: 0,
      other: 0
    }
  }

  private async calculateRangeFacet(
    config: RangeFacetConfig<T>,
    isSelected: boolean
  ): Promise<RangeFacetResult> {
    const buckets = config.ranges.map(range => ({
      key: range.key || `${range.from || '*'}-${range.to || '*'}`,
      from: range.from,
      to: range.to,
      count: Math.floor(Math.random() * 50) + 1,
      selected: false,
      label: range.label
    }))

    return {
      type: 'range',
      name: config.name,
      buckets,
      total: buckets.reduce((sum, bucket) => sum + bucket.count, 0)
    }
  }

  private async calculateDateRangeFacet(
    config: DateRangeFacetConfig<T>,
    isSelected: boolean
  ): Promise<DateRangeFacetResult> {
    const buckets = config.ranges.map(range => ({
      key: range.key || `${range.from || '*'}-${range.to || '*'}`,
      from: range.from,
      to: range.to,
      count: Math.floor(Math.random() * 30) + 1,
      selected: false,
      label: range.label
    }))

    return {
      type: 'date_range',
      name: config.name,
      buckets,
      total: buckets.reduce((sum, bucket) => sum + bucket.count, 0)
    }
  }

  private async calculateHealthcareFacet(
    config: HealthcareFacetConfig<T>,
    isSelected: boolean
  ): Promise<HealthcareFacetResult> {
    // Mock healthcare-specific facet data
    const mockBuckets = [
      {
        key: 'cardiology',
        count: 25,
        selected: false,
        medicalCode: 'I25',
        description: 'Chronic ischemic heart disease',
        hierarchy: ['Cardiovascular', 'Ischemic heart diseases'],
        synonyms: ['heart disease', 'coronary artery disease']
      },
      {
        key: 'oncology',
        count: 18,
        selected: false,
        medicalCode: 'C78',
        description: 'Secondary malignant neoplasm',
        hierarchy: ['Neoplasms', 'Malignant neoplasms'],
        synonyms: ['cancer', 'malignancy']
      }
    ]

    return {
      type: 'healthcare',
      name: config.name,
      buckets: mockBuckets,
      total: mockBuckets.reduce((sum, bucket) => sum + bucket.count, 0),
      terminology: config.medicalContext?.terminology || 'icd10'
    }
  }

  private async executeSearchWithFacets(query: SearchQuery<T>): Promise<SearchResponse<T>> {
    // This would be replaced with actual search implementation
    // For now, returning a mock response
    return {
      results: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      queryTime: 50,
      searchId: 'mock-search-id' as SearchId,
      query
    }
  }

  private getSuggestedFacetsForType(contentType: T): FacetConfiguration<T>[] {
    const baseFacets: FacetConfiguration<T>[] = [
      {
        type: 'terms',
        name: 'status',
        field: 'status',
        size: 10,
        minCount: 1,
        sort: 'count'
      } as TermsFacetConfig<T>
    ]

    if (this.isHealthcareContentType(contentType)) {
      baseFacets.push({
        type: 'healthcare',
        name: 'medical_specialty',
        category: contentType as T & HealthcareContentType,
        field: 'medicalSpecialty' as keyof SearchContentMetadata[T],
        medicalContext: {
          terminology: 'snomed',
          hierarchical: true,
          synonyms: true
        }
      } as HealthcareFacetConfig<T>)
    }

    return baseFacets
  }

  private buildHealthcareFacets(contentType: T & HealthcareContentType): FacetConfiguration<T>[] {
    const facets: FacetConfiguration<T>[] = []

    switch (contentType) {
      case 'clinical_trials':
        facets.push({
          type: 'terms',
          name: 'trial_phase',
          field: 'phase' as keyof SearchContentMetadata[T],
          size: 4,
          minCount: 1,
          sort: 'term'
        } as TermsFacetConfig<T>)

        facets.push({
          type: 'terms',
          name: 'trial_status',
          field: 'status' as keyof SearchContentMetadata[T],
          size: 10,
          minCount: 1,
          sort: 'count'
        } as TermsFacetConfig<T>)
        break

      case 'publications':
        facets.push({
          type: 'range',
          name: 'impact_factor',
          field: 'impactFactor' as keyof SearchContentMetadata[T],
          ranges: [
            { to: 1, label: 'Low (< 1)' },
            { from: 1, to: 5, label: 'Medium (1-5)' },
            { from: 5, to: 10, label: 'High (5-10)' },
            { from: 10, label: 'Very High (> 10)' }
          ]
        } as RangeFacetConfig<T>)
        break

      case 'quality_studies':
        facets.push({
          type: 'terms',
          name: 'evidence_level',
          field: 'evidenceLevel' as keyof SearchContentMetadata[T],
          size: 4,
          minCount: 1,
          sort: 'term'
        } as TermsFacetConfig<T>)
        break
    }

    return facets
  }

  private isHealthcareContentType(contentType: T): contentType is T & HealthcareContentType {
    const healthcareTypes: HealthcareContentType[] = [
      'clinical_trials',
      'publications',
      'quality_studies',
      'patient_education',
      'healthcare_reports',
      'research_data'
    ]
    return healthcareTypes.includes(contentType as HealthcareContentType)
  }
}

// ============================================================================
// FACET BUILDER UTILITY
// ============================================================================

/**
 * Utility class for building facet configurations with fluent interface
 */
export class FacetBuilder<T extends SearchableContentType> {
  private config: Partial<FacetConfiguration<T>> = {}

  static create<U extends SearchableContentType>(): FacetBuilder<U> {
    return new FacetBuilder<U>()
  }

  name(name: string): this {
    this.config = { ...this.config, name }
    return this
  }

  field(field: keyof SearchableContent<T> | keyof SearchContentMetadata[T]): this {
    this.config = { ...this.config, field: field as any }
    return this
  }

  terms(options?: {
    size?: number
    minCount?: number
    sort?: 'count' | 'term' | 'relevance'
    include?: string | string[]
    exclude?: string | string[]
  }): FacetBuilder<T> {
    this.config = {
      ...this.config,
      type: 'terms',
      size: options?.size || 10,
      minCount: options?.minCount || 1,
      sort: options?.sort || 'count',
      include: options?.include,
      exclude: options?.exclude
    } as TermsFacetConfig<T>
    return this
  }

  range(ranges: { from?: number; to?: number; label: string }[]): FacetBuilder<T> {
    this.config = {
      ...this.config,
      type: 'range',
      ranges
    } as RangeFacetConfig<T>
    return this
  }

  dateRange(
    ranges: { from?: string; to?: string; label: string }[],
    options?: { format?: string; timeZone?: string }
  ): FacetBuilder<T> {
    this.config = {
      ...this.config,
      type: 'date_range',
      ranges,
      format: options?.format,
      timeZone: options?.timeZone
    } as DateRangeFacetConfig<T>
    return this
  }

  healthcare(
    category: T extends HealthcareContentType ? T : never,
    medicalContext?: {
      terminology?: 'icd10' | 'snomed' | 'loinc' | 'cpt'
      hierarchical?: boolean
      synonyms?: boolean
    }
  ): FacetBuilder<T> {
    this.config = {
      ...this.config,
      type: 'healthcare',
      category,
      medicalContext
    } as HealthcareFacetConfig<T>
    return this
  }

  build(): FacetConfiguration<T> {
    if (!this.config.name || !('field' in this.config) || !this.config.field || !this.config.type) {
      throw new Error('Name, field, and type are required for facet configuration')
    }
    return this.config as FacetConfiguration<T>
  }
}
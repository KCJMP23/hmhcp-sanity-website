/**
 * Citation Generator System for HMHCP Research Publications
 * Supports multiple citation formats with healthcare standards compliance
 */

import { sanitizeText, sanitizeHtml } from '@/lib/security/xss-protection'
import type { Publication } from '@/types/publications'

// =============================================
// TYPES AND INTERFACES
// =============================================

export type CitationFormat = 'apa' | 'mla' | 'chicago' | 'vancouver' | 'bibtex' | 'ris'

export interface CitationOptions {
  format: CitationFormat
  includeUrl?: boolean
  includeAccessDate?: boolean
  customStyle?: Partial<CitationStyle>
}

export interface CitationStyle {
  authorFormat: 'full' | 'initials' | 'lastname-first'
  titleFormat: 'sentence' | 'title' | 'quotes'
  dateFormat: 'year' | 'full' | 'iso'
  separator: string
  italicize: boolean
}

export interface BatchCitationRequest {
  publicationIds: string[]
  format: CitationFormat
  options?: Partial<CitationOptions>
}

export interface CitationResult {
  citation: string
  format: CitationFormat
  publicationId: string
  generatedAt: string
}

export interface BatchCitationResult {
  citations: CitationResult[]
  format: CitationFormat
  generatedAt: string
  total: number
}

// Citation Error Types
export enum CitationErrorType {
  INVALID_FORMAT = 'invalid_format',
  MISSING_REQUIRED_FIELDS = 'missing_required_fields',
  INVALID_PUBLICATION_DATA = 'invalid_publication_data',
  GENERATION_FAILED = 'generation_failed',
  UNSUPPORTED_FORMAT = 'unsupported_format',
  BATCH_SIZE_EXCEEDED = 'batch_size_exceeded'
}

export class CitationError extends Error {
  public readonly type: CitationErrorType
  public readonly publicationId?: string
  
  constructor(type: CitationErrorType, message: string, publicationId?: string) {
    super(message)
    this.name = 'CitationError'
    this.type = type
    this.publicationId = publicationId
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Sanitize and format author names
 */
function sanitizeAuthor(author: string): string {
  if (!author || typeof author !== 'string') {
    return ''
  }
  
  return sanitizeText(author)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200) // Reasonable limit for author names
}

/**
 * Sanitize publication title
 */
function sanitizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return ''
  }
  
  return sanitizeText(title)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 500) // Reasonable limit for titles
}

/**
 * Sanitize journal name
 */
function sanitizeJournal(journal: string): string {
  if (!journal || typeof journal !== 'string') {
    return ''
  }
  
  return sanitizeText(journal)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 300) // Reasonable limit for journal names
}

/**
 * Format authors for different citation styles
 */
function formatAuthors(authors: string[], format: 'apa' | 'mla' | 'chicago' | 'vancouver'): string {
  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return ''
  }
  
  const sanitizedAuthors = authors
    .filter(author => author && typeof author === 'string')
    .map(author => sanitizeAuthor(author))
    .filter(author => author.length > 0)
    .slice(0, 20) // Reasonable limit on number of authors
  
  if (sanitizedAuthors.length === 0) {
    return ''
  }
  
  switch (format) {
    case 'apa':
      return formatAuthorsAPA(sanitizedAuthors)
    case 'mla':
      return formatAuthorsMLA(sanitizedAuthors)
    case 'chicago':
      return formatAuthorsChicago(sanitizedAuthors)
    case 'vancouver':
      return formatAuthorsVancouver(sanitizedAuthors)
    default:
      return sanitizedAuthors.join(', ')
  }
}

function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 1) {
    return formatAuthorLastFirst(authors[0])
  } else if (authors.length <= 20) {
    const formatted = authors.slice(0, -1).map(formatAuthorLastFirst).join(', ')
    return `${formatted}, & ${formatAuthorLastFirst(authors[authors.length - 1])}`
  } else {
    // 21+ authors: first 19, ellipsis, last author
    const first19 = authors.slice(0, 19).map(formatAuthorLastFirst).join(', ')
    const lastAuthor = formatAuthorLastFirst(authors[authors.length - 1])
    return `${first19}, ... ${lastAuthor}`
  }
}

function formatAuthorsMLA(authors: string[]): string {
  if (authors.length === 1) {
    return formatAuthorLastFirst(authors[0])
  } else if (authors.length === 2) {
    return `${formatAuthorLastFirst(authors[0])}, and ${authors[1]}`
  } else {
    return `${formatAuthorLastFirst(authors[0])}, et al`
  }
}

function formatAuthorsChicago(authors: string[]): string {
  if (authors.length === 1) {
    return formatAuthorLastFirst(authors[0])
  } else if (authors.length <= 3) {
    const formatted = authors.slice(0, -1).map((author, idx) => 
      idx === 0 ? formatAuthorLastFirst(author) : author
    ).join(', ')
    return `${formatted}, and ${authors[authors.length - 1]}`
  } else {
    return `${formatAuthorLastFirst(authors[0])}, et al.`
  }
}

function formatAuthorsVancouver(authors: string[]): string {
  if (authors.length <= 6) {
    return authors.map(formatAuthorVancouverStyle).join(', ')
  } else {
    const first6 = authors.slice(0, 6).map(formatAuthorVancouverStyle).join(', ')
    return `${first6}, et al`
  }
}

function formatAuthorLastFirst(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  
  const lastName = parts[parts.length - 1]
  const firstNames = parts.slice(0, -1).join(' ')
  return `${lastName}, ${firstNames}`
}

function formatAuthorVancouverStyle(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  
  const lastName = parts[parts.length - 1]
  const initials = parts.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('')
  return `${lastName} ${initials}`
}

/**
 * Validate required fields for publication
 */
function validateRequiredFields(publication: Publication, format: CitationFormat): void {
  const commonRequired = ['title', 'authors', 'year']
  const formatSpecific: Record<CitationFormat, string[]> = {
    apa: ['journal'],
    mla: ['journal'],
    chicago: ['journal'],
    vancouver: ['journal'],
    bibtex: ['journal'],
    ris: []
  }
  
  const requiredFields = [...commonRequired, ...formatSpecific[format]]
  
  for (const field of requiredFields) {
    const value = publication[field as keyof Publication]
    if (!value || (Array.isArray(value) && value.length === 0)) {
      throw new CitationError(
        CitationErrorType.MISSING_REQUIRED_FIELDS,
        `Required field '${field}' is missing or empty`,
        publication.id
      )
    }
  }
}

// =============================================
// CITATION FORMATTERS
// =============================================

/**
 * Format citation in APA 7th Edition style
 * Format: Author, A. A. (Year). Title of work. Journal Name, Volume(Issue), pages.
 */
export function formatAPA(publication: Publication, options: CitationOptions = { format: 'apa' }): string {
  try {
    validateRequiredFields(publication, 'apa')
    
    const authors = formatAuthors(publication.authors, 'apa')
    const year = publication.year.toString()
    const title = sanitizeTitle(publication.title)
    const journal = sanitizeJournal(publication.journal)
    
    let citation = `${authors} (${year}). ${title}. ${journal}`
    
    // Add volume and issue if available
    if (publication.volume) {
      citation += `, ${sanitizeText(publication.volume)}`
      if (publication.issue) {
        citation += `(${sanitizeText(publication.issue)})`
      }
    }
    
    // Add pages if available
    if (publication.pages) {
      citation += `, ${sanitizeText(publication.pages)}`
    }
    
    // Add DOI if available
    if (publication.doi) {
      const doi = sanitizeText(publication.doi)
      citation += `. https://doi.org/${doi}`
    }
    
    return citation + '.'
    
  } catch (error) {
    if (error instanceof CitationError) {
      throw error
    }
    throw new CitationError(
      CitationErrorType.GENERATION_FAILED,
      `Failed to generate APA citation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      publication.id
    )
  }
}

/**
 * Format citation in MLA 9th Edition style
 * Format: Author. "Title." Journal Name, Year, pages.
 */
export function formatMLA(publication: Publication, options: CitationOptions = { format: 'mla' }): string {
  try {
    validateRequiredFields(publication, 'mla')
    
    const authors = formatAuthors(publication.authors, 'mla')
    const title = sanitizeTitle(publication.title)
    const journal = sanitizeJournal(publication.journal)
    const year = publication.year.toString()
    
    let citation = `${authors}. "${title}." ${journal}`
    
    // Add volume and issue if available
    if (publication.volume) {
      citation += `, vol. ${sanitizeText(publication.volume)}`
      if (publication.issue) {
        citation += `, no. ${sanitizeText(publication.issue)}`
      }
    }
    
    citation += `, ${year}`
    
    // Add pages if available
    if (publication.pages) {
      citation += `, pp. ${sanitizeText(publication.pages)}`
    }
    
    // Add DOI if available and requested
    if (publication.doi && options.includeUrl !== false) {
      const doi = sanitizeText(publication.doi)
      citation += `. doi:${doi}`
    }
    
    return citation + '.'
    
  } catch (error) {
    if (error instanceof CitationError) {
      throw error
    }
    throw new CitationError(
      CitationErrorType.GENERATION_FAILED,
      `Failed to generate MLA citation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      publication.id
    )
  }
}

/**
 * Format citation in Chicago 17th Edition style
 * Format: Author. "Title." Journal Name Volume, no. Issue (Year): pages.
 */
export function formatChicago(publication: Publication, options: CitationOptions = { format: 'chicago' }): string {
  try {
    validateRequiredFields(publication, 'chicago')
    
    const authors = formatAuthors(publication.authors, 'chicago')
    const title = sanitizeTitle(publication.title)
    const journal = sanitizeJournal(publication.journal)
    const year = publication.year.toString()
    
    let citation = `${authors}. "${title}." ${journal}`
    
    // Add volume and issue
    if (publication.volume) {
      citation += ` ${sanitizeText(publication.volume)}`
      if (publication.issue) {
        citation += `, no. ${sanitizeText(publication.issue)}`
      }
    }
    
    citation += ` (${year})`
    
    // Add pages if available
    if (publication.pages) {
      citation += `: ${sanitizeText(publication.pages)}`
    }
    
    // Add DOI if available
    if (publication.doi) {
      const doi = sanitizeText(publication.doi)
      citation += `. https://doi.org/${doi}`
    }
    
    return citation + '.'
    
  } catch (error) {
    if (error instanceof CitationError) {
      throw error
    }
    throw new CitationError(
      CitationErrorType.GENERATION_FAILED,
      `Failed to generate Chicago citation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      publication.id
    )
  }
}

/**
 * Format citation in Vancouver (ICMJE) style
 * Format: Author AA. Title. Journal Name. Year;Volume(Issue):pages.
 */
export function formatVancouver(publication: Publication, options: CitationOptions = { format: 'vancouver' }): string {
  try {
    validateRequiredFields(publication, 'vancouver')
    
    const authors = formatAuthors(publication.authors, 'vancouver')
    const title = sanitizeTitle(publication.title)
    const journal = sanitizeJournal(publication.journal)
    const year = publication.year.toString()
    
    let citation = `${authors}. ${title}. ${journal}. ${year}`
    
    // Add volume and issue
    if (publication.volume) {
      citation += `;${sanitizeText(publication.volume)}`
      if (publication.issue) {
        citation += `(${sanitizeText(publication.issue)})`
      }
    }
    
    // Add pages if available
    if (publication.pages) {
      citation += `:${sanitizeText(publication.pages)}`
    }
    
    return citation + '.'
    
  } catch (error) {
    if (error instanceof CitationError) {
      throw error
    }
    throw new CitationError(
      CitationErrorType.GENERATION_FAILED,
      `Failed to generate Vancouver citation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      publication.id
    )
  }
}

/**
 * Generate BibTeX citation format
 */
export function formatBibTeX(publication: Publication, options: CitationOptions = { format: 'bibtex' }): string {
  try {
    validateRequiredFields(publication, 'bibtex')
    
    // Generate citation key from first author and year
    const firstAuthor = publication.authors[0] || 'unknown'
    const sanitizedAuthor = sanitizeText(firstAuthor)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20)
    
    const citationKey = `${sanitizedAuthor}${publication.year}`
    
    const authors = publication.authors.map(author => sanitizeText(author)).join(' and ')
    const title = sanitizeTitle(publication.title)
    const journal = sanitizeJournal(publication.journal)
    const year = publication.year.toString()
    
    let bibtex = `@article{${citationKey},\n`
    bibtex += `  author = {${authors}},\n`
    bibtex += `  title = {${title}},\n`
    bibtex += `  journal = {${journal}},\n`
    bibtex += `  year = {${year}}`
    
    if (publication.volume) {
      bibtex += `,\n  volume = {${sanitizeText(publication.volume)}}`
    }
    
    if (publication.issue) {
      bibtex += `,\n  number = {${sanitizeText(publication.issue)}}`
    }
    
    if (publication.pages) {
      bibtex += `,\n  pages = {${sanitizeText(publication.pages)}}`
    }
    
    if (publication.doi) {
      bibtex += `,\n  doi = {${sanitizeText(publication.doi)}}`
    }
    
    if (publication.pmid) {
      bibtex += `,\n  pmid = {${sanitizeText(publication.pmid)}}`
    }
    
    bibtex += '\n}'
    
    return bibtex
    
  } catch (error) {
    if (error instanceof CitationError) {
      throw error
    }
    throw new CitationError(
      CitationErrorType.GENERATION_FAILED,
      `Failed to generate BibTeX citation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      publication.id
    )
  }
}

/**
 * Generate RIS citation format
 */
export function formatRIS(publication: Publication, options: CitationOptions = { format: 'ris' }): string {
  try {
    const title = sanitizeTitle(publication.title)
    const journal = sanitizeJournal(publication.journal)
    const year = publication.year.toString()
    
    let ris = 'TY  - JOUR\n' // Journal article type
    ris += `TI  - ${title}\n`
    ris += `JO  - ${journal}\n`
    ris += `PY  - ${year}\n`
    
    // Add authors
    publication.authors.forEach(author => {
      const sanitizedAuthor = sanitizeText(author)
      if (sanitizedAuthor) {
        ris += `AU  - ${sanitizedAuthor}\n`
      }
    })
    
    if (publication.volume) {
      ris += `VL  - ${sanitizeText(publication.volume)}\n`
    }
    
    if (publication.issue) {
      ris += `IS  - ${sanitizeText(publication.issue)}\n`
    }
    
    if (publication.pages) {
      ris += `SP  - ${sanitizeText(publication.pages).split('-')[0] || ''}\n`
      const endPage = sanitizeText(publication.pages).split('-')[1]
      if (endPage) {
        ris += `EP  - ${endPage}\n`
      }
    }
    
    if (publication.doi) {
      ris += `DO  - ${sanitizeText(publication.doi)}\n`
    }
    
    if (publication.pmid) {
      ris += `AN  - ${sanitizeText(publication.pmid)}\n`
    }
    
    if (publication.abstract) {
      const sanitizedAbstract = sanitizeText(publication.abstract).slice(0, 2000) // Reasonable limit
      ris += `AB  - ${sanitizedAbstract}\n`
    }
    
    ris += 'ER  - \n'
    
    return ris
    
  } catch (error) {
    if (error instanceof CitationError) {
      throw error
    }
    throw new CitationError(
      CitationErrorType.GENERATION_FAILED,
      `Failed to generate RIS citation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      publication.id
    )
  }
}

// =============================================
// MAIN CITATION GENERATOR FUNCTIONS
// =============================================

/**
 * Generate citation for a single publication
 */
export function generateCitation(publication: Publication, options: CitationOptions): CitationResult {
  if (!publication || typeof publication !== 'object') {
    throw new CitationError(
      CitationErrorType.INVALID_PUBLICATION_DATA,
      'Invalid publication data provided'
    )
  }
  
  if (!publication.id) {
    throw new CitationError(
      CitationErrorType.INVALID_PUBLICATION_DATA,
      'Publication ID is required'
    )
  }
  
  let citation: string
  
  try {
    switch (options.format) {
      case 'apa':
        citation = formatAPA(publication, options)
        break
      case 'mla':
        citation = formatMLA(publication, options)
        break
      case 'chicago':
        citation = formatChicago(publication, options)
        break
      case 'vancouver':
        citation = formatVancouver(publication, options)
        break
      case 'bibtex':
        citation = formatBibTeX(publication, options)
        break
      case 'ris':
        citation = formatRIS(publication, options)
        break
      default:
        throw new CitationError(
          CitationErrorType.UNSUPPORTED_FORMAT,
          `Unsupported citation format: ${options.format}`
        )
    }
    
    return {
      citation,
      format: options.format,
      publicationId: publication.id,
      generatedAt: new Date().toISOString()
    }
    
  } catch (error) {
    if (error instanceof CitationError) {
      throw error
    }
    throw new CitationError(
      CitationErrorType.GENERATION_FAILED,
      `Citation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      publication.id
    )
  }
}

/**
 * Generate citations for multiple publications
 */
export function generateBatchCitations(
  publications: Publication[],
  options: CitationOptions
): BatchCitationResult {
  if (!Array.isArray(publications)) {
    throw new CitationError(
      CitationErrorType.INVALID_PUBLICATION_DATA,
      'Publications must be an array'
    )
  }
  
  if (publications.length === 0) {
    throw new CitationError(
      CitationErrorType.INVALID_PUBLICATION_DATA,
      'At least one publication is required'
    )
  }
  
  if (publications.length > 100) {
    throw new CitationError(
      CitationErrorType.BATCH_SIZE_EXCEEDED,
      'Batch size cannot exceed 100 publications'
    )
  }
  
  const citations: CitationResult[] = []
  const errors: Array<{ publicationId: string; error: string }> = []
  
  for (const publication of publications) {
    try {
      const result = generateCitation(publication, options)
      citations.push(result)
    } catch (error) {
      const errorMessage = error instanceof CitationError 
        ? `${error.type}: ${error.message}`
        : `Unknown error: ${error instanceof Error ? error.message : 'Unknown'}`
      
      errors.push({
        publicationId: publication?.id || 'unknown',
        error: errorMessage
      })
    }
  }
  
  return {
    citations,
    format: options.format,
    generatedAt: new Date().toISOString(),
    total: citations.length,
    ...(errors.length > 0 && { errors })
  }
}

/**
 * Get available citation formats
 */
export function getAvailableFormats(): Array<{ value: CitationFormat; label: string; description: string }> {
  return [
    {
      value: 'apa',
      label: 'APA 7th Edition',
      description: 'American Psychological Association style, commonly used in psychology, education, and social sciences'
    },
    {
      value: 'mla',
      label: 'MLA 9th Edition',
      description: 'Modern Language Association style, commonly used in literature, arts, and humanities'
    },
    {
      value: 'chicago',
      label: 'Chicago 17th Edition',
      description: 'Chicago Manual of Style, commonly used in history, literature, and the arts'
    },
    {
      value: 'vancouver',
      label: 'Vancouver (ICMJE)',
      description: 'International Committee of Medical Journal Editors style, standard for biomedical publications'
    },
    {
      value: 'bibtex',
      label: 'BibTeX',
      description: 'LaTeX bibliography format for academic document preparation'
    },
    {
      value: 'ris',
      label: 'RIS',
      description: 'Research Information Systems format for reference management software'
    }
  ]
}
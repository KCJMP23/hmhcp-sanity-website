/**
 * Citation Formatting Utilities - Story 3.7c Task 4
 * Utility functions for citation generation, formatting, and validation
 */

import { 
  Publication,
  CitationFormat, 
  CitationStyle, 
  CitationOptions,
  PublicationMetadata,
  FormattedCitation,
  CitationValidation,
  CitationError,
  CitationWarning
} from '@/types/publications'

/**
 * Format author names according to citation style
 */
export function formatAuthors(
  authors: string[], 
  style: CitationStyle, 
  maxAuthors?: number
): string {
  if (!authors || authors.length === 0) return ''
  
  const displayAuthors = maxAuthors && authors.length > maxAuthors 
    ? authors.slice(0, maxAuthors) 
    : authors

  switch (style) {
    case 'apa':
      return formatAuthorsAPA(displayAuthors, authors.length > (maxAuthors || 999))
    case 'mla':
      return formatAuthorsMLA(displayAuthors, authors.length > (maxAuthors || 999))
    case 'chicago':
      return formatAuthorsChicago(displayAuthors, authors.length > (maxAuthors || 999))
    case 'vancouver':
      return formatAuthorsVancouver(displayAuthors, authors.length > (maxAuthors || 999))
    case 'harvard':
      return formatAuthorsHarvard(displayAuthors, authors.length > (maxAuthors || 999))
    case 'ieee':
      return formatAuthorsIEEE(displayAuthors, authors.length > (maxAuthors || 999))
    case 'nature':
      return formatAuthorsNature(displayAuthors, authors.length > (maxAuthors || 999))
    case 'ama':
      return formatAuthorsAMA(displayAuthors, authors.length > (maxAuthors || 999))
    default:
      return authors.join(', ')
  }
}

/**
 * APA author formatting
 */
function formatAuthorsAPA(authors: string[], hasMore: boolean): string {
  if (authors.length === 1) {
    return reverseAuthorName(authors[0])
  } else if (authors.length === 2) {
    return `${reverseAuthorName(authors[0])}, & ${reverseAuthorName(authors[1])}`
  } else if (authors.length <= 7) {
    const formatted = authors.map(reverseAuthorName)
    return formatted.slice(0, -1).join(', ') + ', & ' + formatted[formatted.length - 1]
  } else {
    const formatted = authors.slice(0, 6).map(reverseAuthorName)
    return formatted.join(', ') + ', ... ' + reverseAuthorName(authors[authors.length - 1])
  }
}

/**
 * MLA author formatting
 */
function formatAuthorsMLA(authors: string[], hasMore: boolean): string {
  if (authors.length === 1) {
    return reverseAuthorName(authors[0])
  } else if (authors.length === 2) {
    return `${reverseAuthorName(authors[0])}, and ${authors[1]}`
  } else {
    const formatted = authors.map((author, index) => 
      index === 0 ? reverseAuthorName(author) : author
    )
    return formatted.slice(0, -1).join(', ') + ', and ' + formatted[formatted.length - 1] + (hasMore ? ', et al' : '')
  }
}

/**
 * Chicago author formatting
 */
function formatAuthorsChicago(authors: string[], hasMore: boolean): string {
  if (authors.length === 1) {
    return reverseAuthorName(authors[0])
  } else if (authors.length <= 3) {
    const formatted = authors.map((author, index) => 
      index === 0 ? reverseAuthorName(author) : author
    )
    return formatted.slice(0, -1).join(', ') + ', and ' + formatted[formatted.length - 1]
  } else {
    return `${reverseAuthorName(authors[0])}, et al.`
  }
}

/**
 * Vancouver author formatting
 */
function formatAuthorsVancouver(authors: string[], hasMore: boolean): string {
  if (authors.length <= 6) {
    return authors.map(reverseAuthorName).join(', ')
  } else {
    return authors.slice(0, 6).map(reverseAuthorName).join(', ') + ', et al'
  }
}

/**
 * Harvard author formatting
 */
function formatAuthorsHarvard(authors: string[], hasMore: boolean): string {
  if (authors.length === 1) {
    return reverseAuthorName(authors[0])
  } else if (authors.length <= 3) {
    const formatted = authors.map((author, index) => 
      index === 0 ? reverseAuthorName(author) : author
    )
    return formatted.slice(0, -1).join(', ') + ' and ' + formatted[formatted.length - 1]
  } else {
    return `${reverseAuthorName(authors[0])} et al.`
  }
}

/**
 * IEEE author formatting
 */
function formatAuthorsIEEE(authors: string[], hasMore: boolean): string {
  return authors.map(author => {
    const names = author.split(' ')
    if (names.length >= 2) {
      const firstNames = names.slice(0, -1).map(name => name.charAt(0) + '.').join(' ')
      const lastName = names[names.length - 1]
      return `${firstNames} ${lastName}`
    }
    return author
  }).join(', ') + (hasMore ? ', et al.' : '')
}

/**
 * Nature author formatting
 */
function formatAuthorsNature(authors: string[], hasMore: boolean): string {
  if (authors.length <= 5) {
    return authors.map(author => {
      const names = author.split(' ')
      if (names.length >= 2) {
        const lastName = names[names.length - 1]
        const initials = names.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('.')
        return `${lastName}, ${initials}.`
      }
      return author
    }).join(', ')
  } else {
    const formatted = authors.slice(0, 4).map(author => {
      const names = author.split(' ')
      if (names.length >= 2) {
        const lastName = names[names.length - 1]
        const initials = names.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('.')
        return `${lastName}, ${initials}.`
      }
      return author
    }).join(', ')
    return formatted + ' et al.'
  }
}

/**
 * AMA author formatting
 */
function formatAuthorsAMA(authors: string[], hasMore: boolean): string {
  if (authors.length <= 6) {
    return authors.map(author => {
      const names = author.split(' ')
      if (names.length >= 2) {
        const lastName = names[names.length - 1]
        const initials = names.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('')
        return `${lastName} ${initials}`
      }
      return author
    }).join(', ')
  } else {
    const formatted = authors.slice(0, 6).map(author => {
      const names = author.split(' ')
      if (names.length >= 2) {
        const lastName = names[names.length - 1]
        const initials = names.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('')
        return `${lastName} ${initials}`
      }
      return author
    }).join(', ')
    return formatted + ', et al'
  }
}

/**
 * Reverse author name from "First Last" to "Last, First"
 */
function reverseAuthorName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length < 2) return name
  
  const lastName = parts[parts.length - 1]
  const firstNames = parts.slice(0, -1).join(' ')
  return `${lastName}, ${firstNames}`
}

/**
 * Format publication year with parentheses if needed
 */
export function formatYear(year: number, style: CitationStyle, wrapInParens: boolean = true): string {
  if (!year) return ''
  
  const yearStr = year.toString()
  
  switch (style) {
    case 'apa':
    case 'harvard':
      return wrapInParens ? `(${yearStr})` : yearStr
    case 'mla':
      return yearStr
    case 'chicago':
      return yearStr
    case 'vancouver':
    case 'ama':
      return yearStr
    case 'ieee':
      return yearStr
    case 'nature':
      return yearStr
    default:
      return yearStr
  }
}

/**
 * Format journal citation (journal, volume, issue, pages)
 */
export function formatJournalCitation(
  journal?: string,
  volume?: string,
  issue?: string,
  pages?: string,
  style: CitationStyle = 'apa'
): string {
  if (!journal) return ''
  
  let citation = journal
  
  switch (style) {
    case 'apa':
      if (volume) citation += `, ${volume}`
      if (issue) citation += `(${issue})`
      if (pages) citation += `, ${pages}`
      break
      
    case 'mla':
      citation = `*${journal}*`
      if (volume && issue) citation += `, vol. ${volume}, no. ${issue}`
      else if (volume) citation += `, vol. ${volume}`
      if (pages) citation += `, ${formatPages(pages)}`
      break
      
    case 'chicago':
      if (volume) citation += ` ${volume}`
      if (issue) citation += `, no. ${issue}`
      if (pages) citation += ` (${pages})`
      break
      
    case 'vancouver':
      if (volume) citation += `. ${volume}`
      if (issue) citation += `(${issue})`
      if (pages) citation += `:${pages}`
      break
      
    case 'harvard':
      if (volume) citation += `, ${volume}`
      if (issue) citation += `(${issue})`
      if (pages) citation += `, pp.${pages}`
      break
      
    case 'ieee':
      citation = `*${journal}*`
      if (volume) citation += `, vol. ${volume}`
      if (issue) citation += `, no. ${issue}`
      if (pages) citation += `, pp. ${pages}`
      break
      
    case 'nature':
      if (volume) citation += ` **${volume}**`
      if (pages) citation += `, ${pages}`
      break
      
    case 'ama':
      if (volume) citation += `. ${volume}`
      if (issue) citation += `(${issue})`
      if (pages) citation += `:${pages}`
      break
      
    default:
      if (volume) citation += `, ${volume}`
      if (issue) citation += `(${issue})`
      if (pages) citation += `, ${pages}`
  }
  
  return citation
}

/**
 * Format page numbers
 */
function formatPages(pages: string): string {
  if (!pages) return ''
  
  // Handle page ranges
  if (pages.includes('-')) {
    return `pp. ${pages}`
  } else if (pages.includes('–')) {
    return `pp. ${pages}`
  } else {
    return `p. ${pages}`
  }
}

/**
 * Format DOI for citation
 */
export function formatDOI(doi: string, style: CitationStyle = 'apa'): string {
  if (!doi) return ''
  
  const cleanDoi = doi.replace(/^(doi:|https?:\/\/(dx\.)?doi\.org\/?)/, '')
  
  switch (style) {
    case 'apa':
    case 'harvard':
      return `https://doi.org/${cleanDoi}`
    case 'mla':
      return `doi:${cleanDoi}`
    case 'chicago':
      return `https://doi.org/${cleanDoi}`
    case 'vancouver':
    case 'ama':
      return `doi:${cleanDoi}`
    case 'ieee':
      return `doi: ${cleanDoi}`
    case 'nature':
      return `https://doi.org/${cleanDoi}`
    default:
      return `https://doi.org/${cleanDoi}`
  }
}

/**
 * Generate complete citation string
 */
export function generateCitation(
  publication: Publication,
  style: CitationStyle,
  format: CitationFormat = 'text',
  options: CitationOptions = {}
): string {
  const {
    includeAbstract = false,
    includeUrl = false,
    includeDoi = true,
    includeAccessed = false,
    useShortAuthorNames = false
  } = options

  const authors = formatAuthors(
    publication.authors, 
    style, 
    useShortAuthorNames ? 3 : undefined
  )
  
  const year = publication.year ? formatYear(publication.year, style, false) : ''
  const title = formatTitle(publication.title, style)
  const journal = formatJournalCitation(
    publication.journal,
    publication.volume,
    publication.issue,
    publication.pages,
    style
  )
  
  let citation = ''
  
  switch (style) {
    case 'apa':
      citation = generateAPACitation(authors, year, title, journal, publication)
      break
    case 'mla':
      citation = generateMLACitation(authors, title, journal, year, publication)
      break
    case 'chicago':
      citation = generateChicagoCitation(authors, title, journal, year, publication)
      break
    case 'vancouver':
      citation = generateVancouverCitation(authors, title, journal, year, publication)
      break
    case 'harvard':
      citation = generateHarvardCitation(authors, year, title, journal, publication)
      break
    case 'ieee':
      citation = generateIEEECitation(authors, title, journal, year, publication)
      break
    case 'nature':
      citation = generateNatureCitation(authors, title, journal, year, publication)
      break
    case 'ama':
      citation = generateAMACitation(authors, title, journal, year, publication)
      break
    default:
      citation = `${authors}. ${title}. ${journal}. ${year}.`
  }
  
  // Add DOI if requested and available
  if (includeDoi && publication.doi) {
    citation += ` ${formatDOI(publication.doi, style)}`
  }
  
  // Add URL if requested and available
  if (includeUrl && publication.pdfUrl) {
    citation += ` Retrieved from ${publication.pdfUrl}`
  }
  
  // Add access date if requested
  if (includeAccessed) {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    citation += ` (accessed ${today})`
  }
  
  return citation.trim()
}

/**
 * Format title according to style
 */
function formatTitle(title: string, style: CitationStyle): string {
  if (!title) return ''
  
  switch (style) {
    case 'apa':
    case 'chicago':
      return title.endsWith('.') ? title : title + '.'
    case 'mla':
      return `"${title}"`
    case 'vancouver':
    case 'ama':
      return title.endsWith('.') ? title : title + '.'
    case 'harvard':
      return title.endsWith('.') ? title : title + '.'
    case 'ieee':
      return `"${title}"`
    case 'nature':
      return title.endsWith('.') ? title : title + '.'
    default:
      return title
  }
}

/**
 * Generate APA citation
 */
function generateAPACitation(
  authors: string, 
  year: string, 
  title: string, 
  journal: string, 
  publication: Publication
): string {
  return `${authors} (${year}). ${title} *${journal}*`
}

/**
 * Generate MLA citation
 */
function generateMLACitation(
  authors: string, 
  title: string, 
  journal: string, 
  year: string, 
  publication: Publication
): string {
  return `${authors}. ${title} *${publication.journal}*, ${year}`
}

/**
 * Generate Chicago citation
 */
function generateChicagoCitation(
  authors: string, 
  title: string, 
  journal: string, 
  year: string, 
  publication: Publication
): string {
  return `${authors}. "${publication.title}." *${publication.journal}* ${publication.volume ? publication.volume : ''}, no. ${publication.issue || ''} (${year}): ${publication.pages || ''}`
}

/**
 * Generate Vancouver citation
 */
function generateVancouverCitation(
  authors: string, 
  title: string, 
  journal: string, 
  year: string, 
  publication: Publication
): string {
  return `${authors}. ${title} ${journal}; ${year}`
}

/**
 * Generate Harvard citation
 */
function generateHarvardCitation(
  authors: string, 
  year: string, 
  title: string, 
  journal: string, 
  publication: Publication
): string {
  return `${authors} (${year}). ${title} *${journal}*`
}

/**
 * Generate IEEE citation
 */
function generateIEEECitation(
  authors: string, 
  title: string, 
  journal: string, 
  year: string, 
  publication: Publication
): string {
  return `${authors}, ${title} *${publication.journal}*, vol. ${publication.volume || ''}, no. ${publication.issue || ''}, pp. ${publication.pages || ''}, ${year}`
}

/**
 * Generate Nature citation
 */
function generateNatureCitation(
  authors: string, 
  title: string, 
  journal: string, 
  year: string, 
  publication: Publication
): string {
  return `${authors} ${title} *${publication.journal}* **${publication.volume}**, ${publication.pages} (${year})`
}

/**
 * Generate AMA citation
 */
function generateAMACitation(
  authors: string, 
  title: string, 
  journal: string, 
  year: string, 
  publication: Publication
): string {
  return `${authors}. ${title} *${publication.journal}*. ${year};${publication.volume}(${publication.issue}):${publication.pages}`
}

/**
 * Convert citation to BibTeX format
 */
export function convertToBibTeX(publication: Publication): string {
  const key = generateBibTeXKey(publication)
  const authors = publication.authors.join(' and ')
  
  return `@article{${key},
  title={${publication.title}},
  author={${authors}},
  journal={${publication.journal || ''}},
  volume={${publication.volume || ''}},
  number={${publication.issue || ''}},
  pages={${publication.pages || ''}},
  year={${publication.year || ''}},
  doi={${publication.doi || ''}},
  pmid={${publication.pmid || ''}},
  abstract={${publication.abstract || ''}}
}`
}

/**
 * Convert citation to RIS format
 */
export function convertToRIS(publication: Publication): string {
  const type = mapToRISType(publication.publicationType)
  
  let ris = `TY  - ${type}\n`
  ris += `TI  - ${publication.title}\n`
  
  publication.authors.forEach(author => {
    ris += `AU  - ${author}\n`
  })
  
  if (publication.journal) ris += `JO  - ${publication.journal}\n`
  if (publication.year) ris += `PY  - ${publication.year}\n`
  if (publication.volume) ris += `VL  - ${publication.volume}\n`
  if (publication.issue) ris += `IS  - ${publication.issue}\n`
  if (publication.pages) ris += `SP  - ${publication.pages}\n`
  if (publication.doi) ris += `DO  - ${publication.doi}\n`
  if (publication.pmid) ris += `PM  - ${publication.pmid}\n`
  if (publication.abstract) ris += `AB  - ${publication.abstract}\n`
  
  ris += `ER  - \n`
  
  return ris
}

/**
 * Generate BibTeX key
 */
function generateBibTeXKey(publication: Publication): string {
  const firstAuthor = publication.authors[0]?.split(' ').pop() || 'Unknown'
  const year = publication.year || new Date().getFullYear()
  const titleWords = publication.title.split(' ').slice(0, 3).join('')
  
  return `${firstAuthor}${year}${titleWords}`.replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Map publication type to RIS type
 */
function mapToRISType(publicationType: string): string {
  const mapping: { [key: string]: string } = {
    'journal': 'JOUR',
    'book': 'BOOK',
    'conference': 'CONF',
    'thesis': 'THES',
    'report': 'RPRT',
    'patent': 'PAT',
    'preprint': 'UNPB'
  }
  
  return mapping[publicationType.toLowerCase()] || 'JOUR'
}

/**
 * Validate citation completeness
 */
export function validateCitation(publication: Publication): CitationValidation {
  const errors: CitationError[] = []
  const warnings: CitationWarning[] = []
  
  // Required fields validation
  if (!publication.title) {
    errors.push({
      type: 'missing_field',
      field: 'title',
      message: 'Title is required for all citations',
      severity: 'critical',
      suggestion: 'Add a descriptive title for this publication'
    })
  }
  
  if (!publication.authors || publication.authors.length === 0) {
    errors.push({
      type: 'missing_field',
      field: 'authors',
      message: 'At least one author is required',
      severity: 'critical',
      suggestion: 'Add author information'
    })
  }
  
  if (!publication.year) {
    errors.push({
      type: 'missing_field',
      field: 'year',
      message: 'Publication year is required',
      severity: 'major',
      suggestion: 'Add the year of publication'
    })
  }
  
  // Optional but recommended fields
  if (!publication.journal) {
    warnings.push({
      type: 'incomplete_data',
      field: 'journal',
      message: 'Journal name is missing',
      suggestion: 'Add journal name for better citation quality'
    })
  }
  
  if (!publication.doi && !publication.pmid) {
    warnings.push({
      type: 'incomplete_data',
      field: 'identifiers',
      message: 'No DOI or PMID available',
      suggestion: 'Add DOI or PMID for better citation tracking'
    })
  }
  
  if (!publication.abstract) {
    warnings.push({
      type: 'incomplete_data',
      field: 'abstract',
      message: 'Abstract is missing',
      suggestion: 'Add abstract for comprehensive citation'
    })
  }
  
  // Calculate completeness score
  const totalFields = 10
  const presentFields = [
    publication.title,
    publication.authors?.length > 0,
    publication.year,
    publication.journal,
    publication.volume,
    publication.issue,
    publication.pages,
    publication.doi,
    publication.pmid,
    publication.abstract
  ].filter(Boolean).length
  
  const completeness = Math.round((presentFields / totalFields) * 100)
  
  // Calculate overall score
  const criticalErrors = errors.filter(e => e.severity === 'critical').length
  const majorErrors = errors.filter(e => e.severity === 'major').length
  const minorErrors = errors.filter(e => e.severity === 'minor').length
  
  let score = 100
  score -= criticalErrors * 30
  score -= majorErrors * 15
  score -= minorErrors * 5
  score -= warnings.length * 2
  
  const isValid = criticalErrors === 0 && majorErrors === 0
  
  return {
    isValid,
    errors,
    warnings,
    suggestions: [],
    score: Math.max(0, score),
    completeness
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error)
    return false
  }
}

/**
 * Download citation as file
 */
export function downloadCitation(
  content: string, 
  filename: string, 
  mimeType: string = 'text/plain'
): void {
  try {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download citation:', error)
  }
}

/**
 * Format citation for display in different formats
 */
export function formatCitationForDisplay(
  citation: string, 
  format: CitationFormat
): string {
  switch (format) {
    case 'html':
      return citation
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/_(.*?)_/g, '<u>$1</u>') // Underline
    case 'text':
    default:
      return citation
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\*(.*?)\*/g, '$1') // Remove markdown
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
  }
}
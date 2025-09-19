/**
 * Version Diff and Comparison Utilities
 * 
 * Provides comprehensive diff and comparison capabilities for publication versions
 * with support for multiple output formats, semantic analysis, and healthcare-specific
 * content understanding.
 * 
 * Features:
 * - Text-level diff with word and character granularity
 * - JSON structure diff for metadata changes
 * - Semantic change detection for healthcare content
 * - Multiple output formats (unified, split, JSON patch)
 * - Change impact analysis
 * - Statistical change metrics
 */

import { diffWords, diffChars, diffSentences, diffLines } from 'diff'
import { compare as jsonCompare, applyPatch, generate as createPatch } from 'fast-json-patch'
import { z } from 'zod'
import logger from '@/lib/logging/winston-logger'

// ================================================================
// INTERFACES AND TYPES
// ================================================================

export interface DiffOptions {
  granularity: 'character' | 'word' | 'sentence' | 'line'
  ignoreWhitespace: boolean
  ignoreCase: boolean
  contextLines: number
  format: 'unified' | 'split' | 'json-patch' | 'semantic'
  includeStats: boolean
  highlightChanges: boolean
}

export interface TextDiff {
  type: 'text'
  field: string
  changes: DiffChange[]
  stats: DiffStats
  summary: string
}

export interface StructuredDiff {
  type: 'structured'
  field: string
  jsonPatch: any[]
  changes: StructuredChange[]
  stats: DiffStats
  summary: string
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged' | 'modified'
  value: string
  count?: number
  lineNumber?: number
  position?: number
  context?: string
  severity?: 'critical' | 'major' | 'minor' | 'trivial'
}

export interface StructuredChange {
  operation: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  oldValue?: any
  newValue?: any
  impact: 'critical' | 'major' | 'minor' | 'trivial'
  description: string
}

export interface DiffStats {
  totalChanges: number
  additions: number
  deletions: number
  modifications: number
  charactersAdded: number
  charactersRemoved: number
  wordsAdded: number
  wordsRemoved: number
  linesAdded: number
  linesRemoved: number
  similarity: number // 0-1 similarity score
  changeComplexity: number // 1-10 complexity score
}

export interface ComparisonResult {
  publicationId: string
  versionFrom: string
  versionTo: string
  overallSimilarity: number
  totalChanges: number
  impactLevel: 'critical' | 'major' | 'minor' | 'trivial'
  fieldChanges: (TextDiff | StructuredDiff)[]
  summary: ComparisonSummary
  generatedAt: string
  processingTimeMs: number
}

export interface ComparisonSummary {
  changedFields: string[]
  significantChanges: string[]
  addedContent: string[]
  removedContent: string[]
  modifiedSections: string[]
  impactAnalysis: {
    criticalChanges: number
    majorChanges: number
    minorChanges: number
    trivialChanges: number
  }
  readabilityImpact?: number
  contentQualityImpact?: number
  recommendations?: string[]
}

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

const diffOptionsSchema = z.object({
  granularity: z.enum(['character', 'word', 'sentence', 'line']).default('word'),
  ignoreWhitespace: z.boolean().default(false),
  ignoreCase: z.boolean().default(false),
  contextLines: z.number().min(0).max(20).default(3),
  format: z.enum(['unified', 'split', 'json-patch', 'semantic']).default('unified'),
  includeStats: z.boolean().default(true),
  highlightChanges: z.boolean().default(true)
})

// ================================================================
// VERSION DIFF UTILITY CLASS
// ================================================================

export class VersionDiffUtility {
  private logger: any

  constructor() {
    this.logger = logger?.child ? logger.child({ service: 'VersionDiffUtility' }) : console
  }

  /**
   * Compare two publication versions and generate comprehensive diff
   */
  async compareVersions(
    versionFrom: any,
    versionTo: any,
    options: Partial<DiffOptions> = {}
  ): Promise<ComparisonResult> {
    const startTime = Date.now()
    
    try {
      const validatedOptions = diffOptionsSchema.parse(options)
      
      this.logger.info('Starting version comparison', {
        versionFrom: versionFrom.version_number,
        versionTo: versionTo.version_number,
        options: validatedOptions
      })

      const fieldChanges: (TextDiff | StructuredDiff)[] = []
      const changedFields: string[] = []
      const significantChanges: string[] = []
      const addedContent: string[] = []
      const removedContent: string[] = []
      const modifiedSections: string[] = []

      let totalChanges = 0
      let overallSimilarity = 1.0
      let maxImpactLevel: 'critical' | 'major' | 'minor' | 'trivial' = 'trivial'

      // Compare text fields
      const textFields = ['title', 'abstract']
      for (const field of textFields) {
        const oldValue = versionFrom[field] || ''
        const newValue = versionTo[field] || ''
        
        if (oldValue !== newValue) {
          const diff = this.generateTextDiff(field, oldValue, newValue, validatedOptions)
          fieldChanges.push(diff)
          changedFields.push(field)
          totalChanges += diff.stats.totalChanges
          
          // Track content changes
          if (diff.stats.additions > 0) addedContent.push(field)
          if (diff.stats.deletions > 0) removedContent.push(field)
          if (diff.stats.modifications > 0) modifiedSections.push(field)
          
          // Determine if significant
          if (diff.stats.changeComplexity > 5 || diff.stats.totalChanges > 10) {
            significantChanges.push(field)
          }

          // Update overall similarity
          overallSimilarity = Math.min(overallSimilarity, diff.stats.similarity)

          // Determine impact level
          const impactLevel = this.determineChangeImpact(field, diff.stats)
          if (this.compareImpactLevels(impactLevel, maxImpactLevel) > 0) {
            maxImpactLevel = impactLevel
          }
        }
      }

      // Compare structured fields
      const structuredFields = ['authors', 'metadata']
      for (const field of structuredFields) {
        const oldValue = versionFrom[field] || (field === 'authors' ? [] : {})
        const newValue = versionTo[field] || (field === 'authors' ? [] : {})
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          const diff = this.generateStructuredDiff(field, oldValue, newValue, validatedOptions)
          fieldChanges.push(diff)
          changedFields.push(field)
          totalChanges += diff.stats.totalChanges

          // Track structured changes
          if (diff.changes.some(c => c.operation === 'add')) addedContent.push(field)
          if (diff.changes.some(c => c.operation === 'remove')) removedContent.push(field)
          if (diff.changes.some(c => c.operation === 'replace')) modifiedSections.push(field)

          if (diff.stats.changeComplexity > 5) {
            significantChanges.push(field)
          }

          overallSimilarity = Math.min(overallSimilarity, diff.stats.similarity)

          const impactLevel = this.determineChangeImpact(field, diff.stats)
          if (this.compareImpactLevels(impactLevel, maxImpactLevel) > 0) {
            maxImpactLevel = impactLevel
          }
        }
      }

      // Compare simple fields
      const simpleFields = ['status', 'publication_date']
      for (const field of simpleFields) {
        const oldValue = versionFrom[field]
        const newValue = versionTo[field]
        
        if (oldValue !== newValue) {
          const diff = this.generateSimpleFieldDiff(field, oldValue, newValue)
          fieldChanges.push(diff)
          changedFields.push(field)
          totalChanges += diff.stats.totalChanges

          if (field === 'status') {
            significantChanges.push(field)
            const impactLevel = 'major'
            if (this.compareImpactLevels(impactLevel, maxImpactLevel) > 0) {
              maxImpactLevel = impactLevel
            }
          }
        }
      }

      // Calculate impact analysis
      const impactAnalysis = {
        criticalChanges: fieldChanges.filter(c => this.hasChangesWithImpact(c, 'critical')).length,
        majorChanges: fieldChanges.filter(c => this.hasChangesWithImpact(c, 'major')).length,
        minorChanges: fieldChanges.filter(c => this.hasChangesWithImpact(c, 'minor')).length,
        trivialChanges: fieldChanges.filter(c => this.hasChangesWithImpact(c, 'trivial')).length
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(fieldChanges, impactAnalysis)

      const processingTime = Date.now() - startTime

      const result: ComparisonResult = {
        publicationId: versionFrom.publication_id || versionFrom.id,
        versionFrom: versionFrom.version_number || 'unknown',
        versionTo: versionTo.version_number || 'unknown',
        overallSimilarity: Number(overallSimilarity.toFixed(3)),
        totalChanges,
        impactLevel: maxImpactLevel,
        fieldChanges,
        summary: {
          changedFields,
          significantChanges,
          addedContent,
          removedContent,
          modifiedSections,
          impactAnalysis,
          recommendations
        },
        generatedAt: new Date().toISOString(),
        processingTimeMs: processingTime
      }

      this.logger.info('Version comparison completed', {
        publicationId: result.publicationId,
        versionFrom: result.versionFrom,
        versionTo: result.versionTo,
        totalChanges: result.totalChanges,
        impactLevel: result.impactLevel,
        processingTimeMs: processingTime
      })

      return result
    } catch (error) {
      this.logger.error('Error comparing versions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw new Error('Failed to compare versions')
    }
  }

  /**
   * Generate text diff for string fields
   */
  private generateTextDiff(
    field: string,
    oldValue: string,
    newValue: string,
    options: DiffOptions
  ): TextDiff {
    let diffResult: any[]
    
    switch (options.granularity) {
      case 'character':
        diffResult = diffChars(oldValue, newValue, { ignoreCase: options.ignoreCase })
        break
      case 'word':
        diffResult = diffWords(oldValue, newValue, { 
          ignoreCase: options.ignoreCase,
          ignoreWhitespace: options.ignoreWhitespace
        })
        break
      case 'sentence':
        diffResult = diffSentences(oldValue, newValue, { ignoreCase: options.ignoreCase })
        break
      case 'line':
        diffResult = diffLines(oldValue, newValue, { 
          ignoreWhitespace: options.ignoreWhitespace 
        })
        break
      default:
        diffResult = diffWords(oldValue, newValue)
    }

    const changes: DiffChange[] = diffResult.map((part, index) => {
      let type: 'added' | 'removed' | 'unchanged' | 'modified' = 'unchanged'
      if (part.added) type = 'added'
      else if (part.removed) type = 'removed'

      const severity = this.determineSeverity(field, part.value, type)

      return {
        type,
        value: part.value,
        count: part.count,
        position: index,
        severity
      }
    })

    const stats = this.calculateTextDiffStats(changes, oldValue, newValue)
    const summary = this.generateTextDiffSummary(field, stats, changes)

    return {
      type: 'text',
      field,
      changes,
      stats,
      summary
    }
  }

  /**
   * Generate structured diff for JSON objects and arrays
   */
  private generateStructuredDiff(
    field: string,
    oldValue: any,
    newValue: any,
    options: DiffOptions
  ): StructuredDiff {
    const jsonPatch = createPatch(oldValue, newValue)
    
    const changes: StructuredChange[] = jsonPatch.map(patch => {
      const impact = this.determineStructuredChangeImpact(field, patch)
      const description = this.generateStructuredChangeDescription(patch)
      
      return {
        operation: patch.op as any,
        path: patch.path,
        oldValue: patch.op === 'replace' || patch.op === 'remove' ? 
          this.getValueAtPath(oldValue, patch.path) : undefined,
        newValue: patch.op === 'add' || patch.op === 'replace' ? patch.value : undefined,
        impact,
        description
      }
    })

    const stats = this.calculateStructuredDiffStats(changes, oldValue, newValue)
    const summary = this.generateStructuredDiffSummary(field, stats, changes)

    return {
      type: 'structured',
      field,
      jsonPatch,
      changes,
      stats,
      summary
    }
  }

  /**
   * Generate diff for simple fields
   */
  private generateSimpleFieldDiff(field: string, oldValue: any, newValue: any): TextDiff {
    const oldStr = String(oldValue || '')
    const newStr = String(newValue || '')
    
    const changes: DiffChange[] = []
    
    if (oldStr && oldStr !== newStr) {
      changes.push({
        type: 'removed',
        value: oldStr,
        severity: field === 'status' ? 'major' : 'minor'
      })
    }
    
    if (newStr && newStr !== oldStr) {
      changes.push({
        type: 'added',
        value: newStr,
        severity: field === 'status' ? 'major' : 'minor'
      })
    }

    const stats: DiffStats = {
      totalChanges: changes.length,
      additions: changes.filter(c => c.type === 'added').length,
      deletions: changes.filter(c => c.type === 'removed').length,
      modifications: 0,
      charactersAdded: newStr.length,
      charactersRemoved: oldStr.length,
      wordsAdded: newStr.split(' ').length,
      wordsRemoved: oldStr.split(' ').length,
      linesAdded: 0,
      linesRemoved: 0,
      similarity: oldStr === newStr ? 1.0 : 0.0,
      changeComplexity: field === 'status' ? 8 : 3
    }

    return {
      type: 'text',
      field,
      changes,
      stats,
      summary: `${field} changed from "${oldStr}" to "${newStr}"`
    }
  }

  /**
   * Calculate statistics for text diff
   */
  private calculateTextDiffStats(
    changes: DiffChange[],
    oldValue: string,
    newValue: string
  ): DiffStats {
    const additions = changes.filter(c => c.type === 'added')
    const deletions = changes.filter(c => c.type === 'removed')
    const unchanged = changes.filter(c => c.type === 'unchanged')

    const charactersAdded = additions.reduce((sum, c) => sum + c.value.length, 0)
    const charactersRemoved = deletions.reduce((sum, c) => sum + c.value.length, 0)
    const charactersUnchanged = unchanged.reduce((sum, c) => sum + c.value.length, 0)

    const wordsAdded = additions.reduce((sum, c) => sum + c.value.split(/\s+/).length, 0)
    const wordsRemoved = deletions.reduce((sum, c) => sum + c.value.split(/\s+/).length, 0)

    const linesAdded = additions.reduce((sum, c) => sum + (c.value.match(/\n/g) || []).length, 0)
    const linesRemoved = deletions.reduce((sum, c) => sum + (c.value.match(/\n/g) || []).length, 0)

    const totalCharacters = oldValue.length + newValue.length
    const similarity = totalCharacters > 0 ? 
      (charactersUnchanged * 2) / totalCharacters : 1.0

    const changeComplexity = Math.min(10, Math.ceil(
      (additions.length + deletions.length) * 0.5 + 
      (charactersAdded + charactersRemoved) * 0.001
    ))

    return {
      totalChanges: additions.length + deletions.length,
      additions: additions.length,
      deletions: deletions.length,
      modifications: 0,
      charactersAdded,
      charactersRemoved,
      wordsAdded,
      wordsRemoved,
      linesAdded,
      linesRemoved,
      similarity: Number(similarity.toFixed(3)),
      changeComplexity
    }
  }

  /**
   * Calculate statistics for structured diff
   */
  private calculateStructuredDiffStats(
    changes: StructuredChange[],
    oldValue: any,
    newValue: any
  ): DiffStats {
    const additions = changes.filter(c => c.operation === 'add')
    const deletions = changes.filter(c => c.operation === 'remove')
    const modifications = changes.filter(c => c.operation === 'replace')

    const oldSize = JSON.stringify(oldValue).length
    const newSize = JSON.stringify(newValue).length

    const similarity = oldSize + newSize > 0 ? 
      1 - (Math.abs(oldSize - newSize) / Math.max(oldSize, newSize)) : 1.0

    const changeComplexity = Math.min(10, changes.length * 0.5 + 
      Math.abs(oldSize - newSize) * 0.001)

    return {
      totalChanges: changes.length,
      additions: additions.length,
      deletions: deletions.length,
      modifications: modifications.length,
      charactersAdded: Math.max(0, newSize - oldSize),
      charactersRemoved: Math.max(0, oldSize - newSize),
      wordsAdded: 0,
      wordsRemoved: 0,
      linesAdded: 0,
      linesRemoved: 0,
      similarity: Number(similarity.toFixed(3)),
      changeComplexity: Math.ceil(changeComplexity)
    }
  }

  /**
   * Determine change impact level
   */
  private determineChangeImpact(field: string, stats: DiffStats): 'critical' | 'major' | 'minor' | 'trivial' {
    if (field === 'status') return 'major'
    if (field === 'publication_date') return 'minor'
    
    if (stats.changeComplexity >= 8 || stats.similarity < 0.3) return 'critical'
    if (stats.changeComplexity >= 6 || stats.similarity < 0.5) return 'major'
    if (stats.changeComplexity >= 3 || stats.similarity < 0.8) return 'minor'
    return 'trivial'
  }

  /**
   * Determine severity of individual changes
   */
  private determineSeverity(
    field: string,
    value: string,
    type: 'added' | 'removed' | 'unchanged' | 'modified'
  ): 'critical' | 'major' | 'minor' | 'trivial' {
    if (type === 'unchanged') return 'trivial'
    
    // Healthcare-specific critical terms
    const criticalTerms = [
      'contraindication', 'warning', 'adverse', 'risk', 'danger',
      'dosage', 'dose', 'medication', 'treatment', 'therapy'
    ]
    
    const valueWords = value.toLowerCase().split(/\s+/)
    if (criticalTerms.some(term => valueWords.some(word => word.includes(term)))) {
      return 'critical'
    }
    
    if (field === 'title' && value.length > 20) return 'major'
    if (field === 'abstract' && value.length > 100) return 'major'
    if (value.length > 50) return 'minor'
    
    return 'trivial'
  }

  /**
   * Determine structured change impact
   */
  private determineStructuredChangeImpact(
    field: string,
    patch: any
  ): 'critical' | 'major' | 'minor' | 'trivial' {
    if (field === 'authors') {
      if (patch.op === 'add' || patch.op === 'remove') return 'major'
      if (patch.op === 'replace') return 'minor'
    }
    
    if (field === 'metadata') {
      if (patch.path.includes('category') || patch.path.includes('type')) return 'major'
      return 'minor'
    }
    
    return 'trivial'
  }

  /**
   * Compare impact levels
   */
  private compareImpactLevels(
    level1: 'critical' | 'major' | 'minor' | 'trivial',
    level2: 'critical' | 'major' | 'minor' | 'trivial'
  ): number {
    const levels = { trivial: 0, minor: 1, major: 2, critical: 3 }
    return levels[level1] - levels[level2]
  }

  /**
   * Check if changes have specific impact level
   */
  private hasChangesWithImpact(
    change: TextDiff | StructuredDiff,
    impact: 'critical' | 'major' | 'minor' | 'trivial'
  ): boolean {
    if (change.type === 'text') {
      return change.changes.some(c => c.severity === impact)
    } else {
      return change.changes.some(c => c.impact === impact)
    }
  }

  /**
   * Generate text diff summary
   */
  private generateTextDiffSummary(field: string, stats: DiffStats, changes: DiffChange[]): string {
    if (stats.totalChanges === 0) return `No changes in ${field}`
    
    const parts = []
    if (stats.additions > 0) parts.push(`${stats.additions} additions`)
    if (stats.deletions > 0) parts.push(`${stats.deletions} deletions`)
    
    return `${field}: ${parts.join(', ')} (${Math.round((1 - stats.similarity) * 100)}% changed)`
  }

  /**
   * Generate structured diff summary
   */
  private generateStructuredDiffSummary(
    field: string,
    stats: DiffStats,
    changes: StructuredChange[]
  ): string {
    if (stats.totalChanges === 0) return `No changes in ${field}`
    
    const operations = changes.reduce((acc, change) => {
      acc[change.operation] = (acc[change.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const parts = Object.entries(operations).map(([op, count]) => `${count} ${op}`)
    return `${field}: ${parts.join(', ')}`
  }

  /**
   * Generate structured change description
   */
  private generateStructuredChangeDescription(patch: any): string {
    switch (patch.op) {
      case 'add':
        return `Added ${patch.path}`
      case 'remove':
        return `Removed ${patch.path}`
      case 'replace':
        return `Changed ${patch.path}`
      case 'move':
        return `Moved ${patch.from} to ${patch.path}`
      case 'copy':
        return `Copied ${patch.from} to ${patch.path}`
      default:
        return `${patch.op} operation on ${patch.path}`
    }
  }

  /**
   * Get value at JSON path
   */
  private getValueAtPath(obj: any, path: string): any {
    return path.split('/').slice(1).reduce((current, segment) => {
      return current && current[segment]
    }, obj)
  }

  /**
   * Generate recommendations based on changes
   */
  private generateRecommendations(
    fieldChanges: (TextDiff | StructuredDiff)[],
    impactAnalysis: any
  ): string[] {
    const recommendations: string[] = []
    
    if (impactAnalysis.criticalChanges > 0) {
      recommendations.push('Critical changes detected. Review and approve carefully before publication.')
    }
    
    if (impactAnalysis.majorChanges > 3) {
      recommendations.push('Multiple major changes detected. Consider peer review.')
    }
    
    const titleChanges = fieldChanges.find(c => c.field === 'title')
    if (titleChanges && titleChanges.stats.totalChanges > 0) {
      recommendations.push('Title has been modified. Ensure SEO and branding consistency.')
    }
    
    const authorChanges = fieldChanges.find(c => c.field === 'authors')
    if (authorChanges && authorChanges.stats.totalChanges > 0) {
      recommendations.push('Author list has been modified. Verify author consent and attribution.')
    }
    
    const statusChange = fieldChanges.find(c => c.field === 'status')
    if (statusChange && statusChange.stats.totalChanges > 0) {
      recommendations.push('Publication status has changed. Review workflow and approval requirements.')
    }
    
    return recommendations
  }
}

// Export singleton instance
export const versionDiff = new VersionDiffUtility()

// Export utility functions
export {
  diffOptionsSchema
}
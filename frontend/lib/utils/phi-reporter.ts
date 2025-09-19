/**
 * PHI Reporter
 * Protected Health Information detection and reporting
 */

import { logger } from '@/lib/logging/client-safe-logger'

export interface PHIDetection {
  id: string
  documentId: string
  phiType: PHIType
  text: string
  startIndex: number
  endIndex: number
  confidence: number
  severity: PHISeverity
  context: string
  detectedAt: Date
  reportedAt?: Date
  status: PHIStatus
}

export enum PHIType {
  NAME = 'name',
  DATE_OF_BIRTH = 'date_of_birth',
  SOCIAL_SECURITY_NUMBER = 'ssn',
  MEDICAL_RECORD_NUMBER = 'mrn',
  PHONE_NUMBER = 'phone',
  EMAIL = 'email',
  ADDRESS = 'address',
  INSURANCE_NUMBER = 'insurance',
  CREDIT_CARD = 'credit_card',
  BANK_ACCOUNT = 'bank_account',
  DRIVER_LICENSE = 'driver_license',
  PASSPORT = 'passport'
}

export enum PHISeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum PHIStatus {
  DETECTED = 'detected',
  REPORTED = 'reported',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive'
}

export interface PHIReport {
  id: string
  documentId: string
  totalDetections: number
  criticalDetections: number
  highDetections: number
  mediumDetections: number
  lowDetections: number
  detections: PHIDetection[]
  generatedAt: Date
  reportedBy: string
  status: ReportStatus
}

export enum ReportStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface PHIStatistics {
  totalDocuments: number
  documentsWithPHI: number
  totalDetections: number
  detectionsByType: Record<PHIType, number>
  detectionsBySeverity: Record<PHISeverity, number>
  falsePositiveRate: number
  averageConfidence: number
}

export class PHIReporter {
  private static readonly PHI_PATTERNS = {
    [PHIType.SOCIAL_SECURITY_NUMBER]: /\b\d{3}-\d{2}-\d{4}\b/g,
    [PHIType.PHONE_NUMBER]: /\b\d{3}-\d{3}-\d{4}\b/g,
    [PHIType.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    [PHIType.CREDIT_CARD]: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    [PHIType.DATE_OF_BIRTH]: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    [PHIType.MEDICAL_RECORD_NUMBER]: /\bMRN\s*:?\s*\d+\b/gi
  }

  private static readonly PHI_NAMES = [
    'John', 'Jane', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'
  ]

  /**
   * Detect PHI in document
   */
  static async detectPHI(
    documentId: string,
    content: string,
    options: PHIDetectionOptions = {}
  ): Promise<{ success: boolean; data?: PHIDetection[]; error?: string }> {
    try {
      const detections: PHIDetection[] = []

      // Detect structured PHI (SSN, phone, email, etc.)
      for (const [phiType, pattern] of Object.entries(this.PHI_PATTERNS)) {
        const matches = this.findPatternMatches(content, pattern, phiType as PHIType)
        detections.push(...matches)
      }

      // Detect names
      if (options.detectNames !== false) {
        const nameDetections = this.detectNames(content)
        detections.push(...nameDetections)
      }

      // Detect addresses
      if (options.detectAddresses !== false) {
        const addressDetections = this.detectAddresses(content)
        detections.push(...addressDetections)
      }

      // Filter by confidence threshold
      const filteredDetections = detections.filter(d => d.confidence >= (options.confidenceThreshold || 0.5))

      // Remove duplicates
      const uniqueDetections = this.removeDuplicateDetections(filteredDetections)

      logger.info('PHI detection completed', {
        documentId,
        totalDetections: uniqueDetections.length,
        criticalCount: uniqueDetections.filter(d => d.severity === PHISeverity.CRITICAL).length
      })

      return {
        success: true,
        data: uniqueDetections
      }
    } catch (error) {
      logger.error('Failed to detect PHI', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId
      })

      return {
        success: false,
        error: 'Failed to detect PHI'
      }
    }
  }

  /**
   * Find pattern matches in content
   */
  private static findPatternMatches(
    content: string,
    pattern: RegExp,
    phiType: PHIType
  ): PHIDetection[] {
    const detections: PHIDetection[] = []
    let match

    while ((match = pattern.exec(content)) !== null) {
      const detection: PHIDetection = {
        id: `phi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId: 'unknown',
        phiType,
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: this.calculateConfidence(phiType, match[0]),
        severity: this.calculateSeverity(phiType),
        context: this.extractContext(content, match.index, match[0].length),
        detectedAt: new Date(),
        status: PHIStatus.DETECTED
      }

      detections.push(detection)
    }

    return detections
  }

  /**
   * Detect names in content
   */
  private static detectNames(content: string): PHIDetection[] {
    const detections: PHIDetection[] = []
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
    let match

    while ((match = namePattern.exec(content)) !== null) {
      const name = match[0]
      const firstName = name.split(' ')[0]
      
      // Check if it's a common name (higher confidence)
      const confidence = this.PHI_NAMES.includes(firstName) ? 0.8 : 0.6

      const detection: PHIDetection = {
        id: `phi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId: 'unknown',
        phiType: PHIType.NAME,
        text: name,
        startIndex: match.index,
        endIndex: match.index + name.length,
        confidence,
        severity: PHISeverity.MEDIUM,
        context: this.extractContext(content, match.index, name.length),
        detectedAt: new Date(),
        status: PHIStatus.DETECTED
      }

      detections.push(detection)
    }

    return detections
  }

  /**
   * Detect addresses in content
   */
  private static detectAddresses(content: string): PHIDetection[] {
    const detections: PHIDetection[] = []
    const addressPattern = /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/g
    let match

    while ((match = addressPattern.exec(content)) !== null) {
      const detection: PHIDetection = {
        id: `phi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId: 'unknown',
        phiType: PHIType.ADDRESS,
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.7,
        severity: PHISeverity.HIGH,
        context: this.extractContext(content, match.index, match[0].length),
        detectedAt: new Date(),
        status: PHIStatus.DETECTED
      }

      detections.push(detection)
    }

    return detections
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(phiType: PHIType, text: string): number {
    switch (phiType) {
      case PHIType.SOCIAL_SECURITY_NUMBER:
        return /^\d{3}-\d{2}-\d{4}$/.test(text) ? 0.95 : 0.7
      case PHIType.PHONE_NUMBER:
        return /^\d{3}-\d{3}-\d{4}$/.test(text) ? 0.9 : 0.6
      case PHIType.EMAIL:
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(text) ? 0.95 : 0.5
      case PHIType.CREDIT_CARD:
        return /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(text) ? 0.9 : 0.6
      case PHIType.DATE_OF_BIRTH:
        return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text) ? 0.8 : 0.5
      default:
        return 0.7
    }
  }

  /**
   * Calculate severity level
   */
  private static calculateSeverity(phiType: PHIType): PHISeverity {
    switch (phiType) {
      case PHIType.SOCIAL_SECURITY_NUMBER:
      case PHIType.CREDIT_CARD:
      case PHIType.BANK_ACCOUNT:
        return PHISeverity.CRITICAL
      case PHIType.MEDICAL_RECORD_NUMBER:
      case PHIType.INSURANCE_NUMBER:
      case PHIType.DRIVER_LICENSE:
      case PHIType.PASSPORT:
        return PHISeverity.HIGH
      case PHIType.NAME:
      case PHIType.ADDRESS:
      case PHIType.PHONE_NUMBER:
        return PHISeverity.MEDIUM
      case PHIType.EMAIL:
      case PHIType.DATE_OF_BIRTH:
        return PHISeverity.LOW
      default:
        return PHISeverity.MEDIUM
    }
  }

  /**
   * Extract context around PHI
   */
  private static extractContext(content: string, startIndex: number, length: number): string {
    const contextLength = 50
    const start = Math.max(0, startIndex - contextLength)
    const end = Math.min(content.length, startIndex + length + contextLength)
    return content.substring(start, end)
  }

  /**
   * Remove duplicate detections
   */
  private static removeDuplicateDetections(detections: PHIDetection[]): PHIDetection[] {
    const unique = new Map<string, PHIDetection>()

    for (const detection of detections) {
      const key = `${detection.phiType}-${detection.startIndex}-${detection.endIndex}`
      if (!unique.has(key) || unique.get(key)!.confidence < detection.confidence) {
        unique.set(key, detection)
      }
    }

    return Array.from(unique.values())
  }

  /**
   * Generate PHI report
   */
  static async generatePHIReport(
    documentId: string,
    detections: PHIDetection[],
    reportedBy: string
  ): Promise<{ success: boolean; data?: PHIReport; error?: string }> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const report: PHIReport = {
        id: reportId,
        documentId,
        totalDetections: detections.length,
        criticalDetections: detections.filter(d => d.severity === PHISeverity.CRITICAL).length,
        highDetections: detections.filter(d => d.severity === PHISeverity.HIGH).length,
        mediumDetections: detections.filter(d => d.severity === PHISeverity.MEDIUM).length,
        lowDetections: detections.filter(d => d.severity === PHISeverity.LOW).length,
        detections,
        generatedAt: new Date(),
        reportedBy,
        status: ReportStatus.DRAFT
      }

      logger.info('PHI report generated', {
        reportId,
        documentId,
        totalDetections: detections.length,
        criticalCount: report.criticalDetections
      })

      return {
        success: true,
        data: report
      }
    } catch (error) {
      logger.error('Failed to generate PHI report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId
      })

      return {
        success: false,
        error: 'Failed to generate PHI report'
      }
    }
  }

  /**
   * Get PHI statistics
   */
  static async getPHIStatistics(): Promise<{ success: boolean; data?: PHIStatistics; error?: string }> {
    try {
      // TODO: Calculate statistics from database
      logger.info('PHI statistics retrieved')

      return {
        success: true,
        data: {
          totalDocuments: 0,
          documentsWithPHI: 0,
          totalDetections: 0,
          detectionsByType: {} as Record<PHIType, number>,
          detectionsBySeverity: {} as Record<PHISeverity, number>,
          falsePositiveRate: 0,
          averageConfidence: 0
        }
      }
    } catch (error) {
      logger.error('Failed to get PHI statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        error: 'Failed to get PHI statistics'
      }
    }
  }
}

export interface PHIDetectionOptions {
  detectNames?: boolean
  detectAddresses?: boolean
  confidenceThreshold?: number
  severityThreshold?: PHISeverity
}

export default PHIReporter

// Export functions for backward compatibility
export const generatePHIReport = PHIReporter.generatePHIReport;

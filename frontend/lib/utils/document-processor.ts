/**
 * Document Processor
 * Healthcare document processing and analysis
 */

import { logger } from '@/lib/logging/client-safe-logger'

export interface DocumentMetadata {
  id: string
  filename: string
  fileType: string
  size: number
  uploadedAt: Date
  processedAt?: Date
  status: ProcessingStatus
  pages?: number
  language?: string
  confidence?: number
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ProcessedDocument {
  id: string
  content: string
  metadata: DocumentMetadata
  entities: DocumentEntity[]
  sections: DocumentSection[]
  extractedData: ExtractedData
  processingTime: number
}

export interface DocumentEntity {
  id: string
  type: EntityType
  text: string
  startIndex: number
  endIndex: number
  confidence: number
  attributes?: Record<string, any>
}

export enum EntityType {
  PERSON = 'person',
  DATE = 'date',
  MEDICATION = 'medication',
  DIAGNOSIS = 'diagnosis',
  PROCEDURE = 'procedure',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  PHONE = 'phone',
  EMAIL = 'email',
  ID_NUMBER = 'id_number'
}

export interface DocumentSection {
  id: string
  title: string
  content: string
  startIndex: number
  endIndex: number
  type: SectionType
}

export enum SectionType {
  HEADER = 'header',
  BODY = 'body',
  FOOTER = 'footer',
  TABLE = 'table',
  LIST = 'list',
  MEDICAL_HISTORY = 'medical_history',
  DIAGNOSIS = 'diagnosis',
  TREATMENT = 'treatment',
  MEDICATIONS = 'medications',
  VITAL_SIGNS = 'vital_signs'
}

export interface ExtractedData {
  patientName?: string
  patientId?: string
  dateOfBirth?: string
  medications: string[]
  diagnoses: string[]
  procedures: string[]
  vitalSigns: Record<string, any>
  allergies: string[]
  medicalHistory: string[]
  notes: string[]
}

export class DocumentProcessor {
  private static readonly SUPPORTED_TYPES = ['pdf', 'docx', 'txt', 'rtf']
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  /**
   * Process document
   */
  static async processDocument(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<{ success: boolean; data?: ProcessedDocument; error?: string }> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid file: ${validation.errors.join(', ')}`
        }
      }

      // Generate document ID
      const id = this.generateDocumentId()

      // Create metadata
      const metadata: DocumentMetadata = {
        id,
        filename: file.name,
        fileType: this.getFileType(file.name),
        size: file.size,
        uploadedAt: new Date(),
        status: ProcessingStatus.PROCESSING
      }

      // Process document content
      const content = await this.extractText(file)
      
      // Extract entities
      const entities = await this.extractEntities(content)
      
      // Extract sections
      const sections = await this.extractSections(content)
      
      // Extract structured data
      const extractedData = await this.extractStructuredData(content, entities)

      // Update metadata
      metadata.status = ProcessingStatus.COMPLETED
      metadata.processedAt = new Date()
      metadata.confidence = this.calculateConfidence(entities)

      const processedDocument: ProcessedDocument = {
        id,
        content,
        metadata,
        entities,
        sections,
        extractedData,
        processingTime: Date.now() - metadata.uploadedAt.getTime()
      }

      logger.info('Document processed successfully', {
        documentId: id,
        filename: file.name,
        fileType: metadata.fileType,
        entityCount: entities.length,
        sectionCount: sections.length
      })

      return {
        success: true,
        data: processedDocument
      }
    } catch (error) {
      logger.error('Failed to process document', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: file.name
      })

      return {
        success: false,
        error: 'Failed to process document'
      }
    }
  }

  /**
   * Extract text from file
   */
  private static async extractText(file: File): Promise<string> {
    // TODO: Implement actual text extraction based on file type
    // This would typically use libraries like pdf-parse, mammoth, etc.
    
    const fileType = this.getFileType(file.name)
    
    switch (fileType) {
      case 'pdf':
        return await this.extractTextFromPDF(file)
      case 'docx':
        return await this.extractTextFromDOCX(file)
      case 'txt':
        return await this.extractTextFromTXT(file)
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }

  /**
   * Extract text from PDF
   */
  private static async extractTextFromPDF(file: File): Promise<string> {
    // TODO: Implement PDF text extraction
    return 'PDF content would be extracted here'
  }

  /**
   * Extract text from DOCX
   */
  private static async extractTextFromDOCX(file: File): Promise<string> {
    // TODO: Implement DOCX text extraction
    return 'DOCX content would be extracted here'
  }

  /**
   * Extract text from TXT
   */
  private static async extractTextFromTXT(file: File): Promise<string> {
    return await file.text()
  }

  /**
   * Extract entities from text
   */
  private static async extractEntities(content: string): Promise<DocumentEntity[]> {
    const entities: DocumentEntity[] = []

    // TODO: Implement actual entity extraction using NLP libraries
    // This would typically use libraries like spaCy, NLTK, or cloud APIs

    // Mock entity extraction
    const entityPatterns = [
      { type: EntityType.PERSON, pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g },
      { type: EntityType.DATE, pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g },
      { type: EntityType.PHONE, pattern: /\b\d{3}-\d{3}-\d{4}\b/g },
      { type: EntityType.EMAIL, pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g }
    ]

    for (const { type, pattern } of entityPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        entities.push({
          id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.8
        })
      }
    }

    return entities
  }

  /**
   * Extract sections from text
   */
  private static async extractSections(content: string): Promise<DocumentSection[]> {
    const sections: DocumentSection[] = []
    const lines = content.split('\n')

    let currentSection: DocumentSection | null = null
    let sectionIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (this.isSectionHeader(line)) {
        // Save previous section
        if (currentSection) {
          currentSection.endIndex = content.indexOf(line) - 1
          sections.push(currentSection)
        }

        // Start new section
        currentSection = {
          id: `section_${sectionIndex++}`,
          title: line,
          content: line,
          startIndex: content.indexOf(line),
          endIndex: content.indexOf(line) + line.length,
          type: this.getSectionType(line)
        }
      } else if (currentSection) {
        currentSection.content += '\n' + line
      }
    }

    // Add final section
    if (currentSection) {
      currentSection.endIndex = content.length
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * Extract structured data
   */
  private static async extractStructuredData(
    content: string,
    entities: DocumentEntity[]
  ): Promise<ExtractedData> {
    const extractedData: ExtractedData = {
      medications: [],
      diagnoses: [],
      procedures: [],
      vitalSigns: {},
      allergies: [],
      medicalHistory: [],
      notes: []
    }

    // Extract medications
    const medicationEntities = entities.filter(e => e.type === EntityType.MEDICATION)
    extractedData.medications = medicationEntities.map(e => e.text)

    // Extract diagnoses
    const diagnosisEntities = entities.filter(e => e.type === EntityType.DIAGNOSIS)
    extractedData.diagnoses = diagnosisEntities.map(e => e.text)

    // Extract procedures
    const procedureEntities = entities.filter(e => e.type === EntityType.PROCEDURE)
    extractedData.procedures = procedureEntities.map(e => e.text)

    // Extract patient name
    const personEntities = entities.filter(e => e.type === EntityType.PERSON)
    if (personEntities.length > 0) {
      extractedData.patientName = personEntities[0].text
    }

    return extractedData
  }

  /**
   * Check if line is a section header
   */
  private static isSectionHeader(line: string): boolean {
    const headerPatterns = [
      /^[A-Z][A-Z\s]+$/,
      /^\d+\.\s+[A-Z]/,
      /^[A-Z][a-z]+:/,
      /^MEDICAL HISTORY/i,
      /^DIAGNOSIS/i,
      /^TREATMENT/i,
      /^MEDICATIONS/i,
      /^VITAL SIGNS/i
    ]

    return headerPatterns.some(pattern => pattern.test(line))
  }

  /**
   * Get section type
   */
  private static getSectionType(title: string): SectionType {
    const titleLower = title.toLowerCase()
    
    if (titleLower.includes('medical history')) return SectionType.MEDICAL_HISTORY
    if (titleLower.includes('diagnosis')) return SectionType.DIAGNOSIS
    if (titleLower.includes('treatment')) return SectionType.TREATMENT
    if (titleLower.includes('medications')) return SectionType.MEDICATIONS
    if (titleLower.includes('vital signs')) return SectionType.VITAL_SIGNS
    
    return SectionType.BODY
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(entities: DocumentEntity[]): number {
    if (entities.length === 0) return 0

    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0)
    return totalConfidence / entities.length
  }

  /**
   * Validate file
   */
  private static validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!file) {
      errors.push('File is required')
      return { isValid: false, errors }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    const fileType = this.getFileType(file.name)
    if (!this.SUPPORTED_TYPES.includes(fileType)) {
      errors.push(`Unsupported file type. Supported types: ${this.SUPPORTED_TYPES.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get file type from filename
   */
  private static getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  /**
   * Generate document ID
   */
  private static generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface ProcessingOptions {
  extractEntities?: boolean
  extractSections?: boolean
  extractStructuredData?: boolean
  language?: string
}

export default DocumentProcessor

// Export functions for backward compatibility
export const processDocument = DocumentProcessor.processDocument;

/**
 * Audit Trail Export Utilities
 * 
 * Comprehensive audit trail export system for healthcare compliance:
 * - HIPAA-compliant audit trail exports
 * - Multiple export formats (PDF, CSV, JSON, XML)
 * - Encrypted exports for sensitive data
 * - Batch processing for large datasets
 * - Digital signatures for export integrity
 * 
 * Story 1.6 Task 8: Compliance Reporting & Audit Exports
 */

import * as crypto from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as archiver from 'archiver'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditSeverity, ComplianceFramework, type AuditLogEntry, type AuditQueryFilters } from '../audit-logging'
import { auditEncryption } from '../audit-encryption'

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'xml' | 'excel'
  filters: AuditQueryFilters
  includeMetadata: boolean
  includeSensitiveData: boolean
  encryptExport: boolean
  digitallySigned: boolean
  compressionLevel?: number
  batchSize?: number
  exportName?: string
}

export interface ExportResult {
  success: boolean
  exportId?: string
  filePath?: string
  downloadUrl?: string
  fileSize?: number
  recordCount?: number
  checksum?: string
  digitalSignature?: string
  error?: string
}

export interface ExportMetadata {
  id: string
  format: string
  createdAt: string
  requestedBy: string | null
  filters: AuditQueryFilters
  recordCount: number
  fileSize: number
  checksum: string
  encrypted: boolean
  digitallySigned: boolean
  expiresAt?: string
}

export interface BatchExportProgress {
  exportId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  totalRecords: number
  processedRecords: number
  progress: number
  estimatedCompletion?: string
  error?: string
}

export class AuditExporter {
  private static instance: AuditExporter
  private exportDirectory: string
  private maxFileSize: number = 100 * 1024 * 1024 // 100MB
  
  private constructor() {
    this.exportDirectory = process.env.AUDIT_EXPORT_DIR || '/tmp/audit_exports'
  }
  
  public static getInstance(): AuditExporter {
    if (!AuditExporter.instance) {
      AuditExporter.instance = new AuditExporter()
    }
    return AuditExporter.instance
  }
  
  /**
   * Export audit trail data in specified format
   */
  async exportAuditTrail(options: ExportOptions): Promise<ExportResult> {
    try {
      const exportId = this.generateExportId()
      logger.info('Starting audit trail export', { exportId, format: options.format })
      
      // Ensure export directory exists
      await this.ensureExportDirectory()
      
      // Fetch audit data
      const auditData = await this.fetchAuditData(options.filters)
      if (!auditData.success) {
        return { success: false, error: auditData.error }
      }
      
      // Generate export based on format
      const exportResult = await this.generateExport(exportId, auditData.logs!, options)
      if (!exportResult.success) {
        return exportResult
      }
      
      // Apply post-processing
      const finalResult = await this.postProcessExport(exportId, exportResult.filePath!, options)
      
      // Store export metadata
      await this.storeExportMetadata(exportId, options, finalResult)
      
      // Log export activity
      await auditLogger.logEvent({
        event_type: AuditEventType.COMPLIANCE_REPORT,
        severity: AuditSeverity.INFO,
        user_id: null, // System generated
        session_id: null,
        resource_type: 'audit_export',
        resource_id: exportId,
        action_performed: 'audit_trail_exported',
        client_ip: '127.0.0.1',
        user_agent: 'Audit-Exporter',
        request_id: crypto.randomUUID(),
        compliance_frameworks: options.filters.compliance_frameworks || [ComplianceFramework.HIPAA],
        sensitive_data_involved: options.includeSensitiveData,
        status: 'success'
      })
      
      return {
        success: true,
        exportId,
        ...finalResult
      }
      
    } catch (error) {
      logger.error('Audit export failed', { error, options })
      return { success: false, error: 'Export generation failed' }
    }
  }
  
  /**
   * Export large audit datasets in batches
   */
  async exportLargeDataset(options: ExportOptions, progressCallback?: (progress: BatchExportProgress) => void): Promise<ExportResult> {
    const exportId = this.generateExportId()
    const batchSize = options.batchSize || 10000
    
    try {
      logger.info('Starting large dataset export', { exportId, batchSize })
      
      // Get total record count
      const countResult = await auditLogger.queryAuditLogs({
        ...options.filters,
        limit: 1
      })
      
      if (!countResult.success) {
        return { success: false, error: countResult.error }
      }
      
      const totalRecords = countResult.total || 0
      const totalBatches = Math.ceil(totalRecords / batchSize)
      
      // Initialize progress tracking
      let progress: BatchExportProgress = {
        exportId,
        status: 'processing',
        totalRecords,
        processedRecords: 0,
        progress: 0
      }
      
      // Create batch export files
      const batchFiles: string[] = []
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const batchFilters: AuditQueryFilters = {
          ...options.filters,
          limit: batchSize,
          offset: batch * batchSize
        }
        
        const batchData = await this.fetchAuditData(batchFilters)
        if (!batchData.success) {
          throw new Error(`Batch ${batch} failed: ${batchData.error}`)
        }
        
        const batchOptions: ExportOptions = {
          ...options,
          exportName: `${exportId}_batch_${batch}`
        }
        
        const batchResult = await this.generateExport(
          `${exportId}_batch_${batch}`,
          batchData.logs!,
          batchOptions
        )
        
        if (!batchResult.success) {
          throw new Error(`Batch ${batch} export failed: ${batchResult.error}`)
        }
        
        batchFiles.push(batchResult.filePath!)
        
        // Update progress
        progress.processedRecords = (batch + 1) * batchSize
        progress.progress = Math.min((progress.processedRecords / totalRecords) * 100, 100)
        
        if (progressCallback) {
          progressCallback(progress)
        }
      }
      
      // Combine batch files into archive
      const archiveResult = await this.createExportArchive(exportId, batchFiles, options)
      
      // Cleanup batch files
      await this.cleanupBatchFiles(batchFiles)
      
      progress.status = 'completed'
      progress.progress = 100
      
      if (progressCallback) {
        progressCallback(progress)
      }
      
      return {
        success: true,
        exportId,
        ...archiveResult
      }
      
    } catch (error) {
      logger.error('Large dataset export failed', { error, exportId })
      
      if (progressCallback) {
        progressCallback({
          exportId,
          status: 'failed',
          totalRecords: 0,
          processedRecords: 0,
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      return { success: false, error: 'Large dataset export failed' }
    }
  }
  
  /**
   * Fetch audit data with specified filters
   */
  private async fetchAuditData(filters: AuditQueryFilters): Promise<{
    success: boolean
    logs?: AuditLogEntry[]
    total?: number
    error?: string
  }> {
    return await auditLogger.queryAuditLogs(filters)
  }
  
  /**
   * Generate export file based on format
   */
  private async generateExport(
    exportId: string,
    logs: AuditLogEntry[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `${options.exportName || exportId}.${options.format}`
    const filePath = path.join(this.exportDirectory, fileName)
    
    switch (options.format) {
      case 'pdf':
        return await this.generatePDFExport(filePath, logs, options)
      case 'csv':
        return await this.generateCSVExport(filePath, logs, options)
      case 'json':
        return await this.generateJSONExport(filePath, logs, options)
      case 'xml':
        return await this.generateXMLExport(filePath, logs, options)
      case 'excel':
        return await this.generateExcelExport(filePath, logs, options)
      default:
        return { success: false, error: `Unsupported format: ${options.format}` }
    }
  }
  
  /**
   * Generate PDF export
   */
  private async generatePDFExport(
    filePath: string,
    logs: AuditLogEntry[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      
      let currentPage = pdfDoc.addPage([612, 792])
      let yPosition = 750
      const lineHeight = 12
      const pageMargin = 50
      
      // Title
      currentPage.drawText('Audit Trail Export', {
        x: pageMargin,
        y: yPosition,
        size: 18,
        font: boldFont
      })
      
      yPosition -= 30
      currentPage.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: pageMargin,
        y: yPosition,
        size: 10,
        font: font
      })
      
      yPosition -= 20
      currentPage.drawText(`Total Records: ${logs.length}`, {
        x: pageMargin,
        y: yPosition,
        size: 10,
        font: font
      })
      
      yPosition -= 30
      
      // Headers
      const headers = ['Timestamp', 'Event Type', 'User', 'Resource', 'Status']
      headers.forEach((header, index) => {
        currentPage.drawText(header, {
          x: pageMargin + (index * 100),
          y: yPosition,
          size: 10,
          font: boldFont
        })
      })
      
      yPosition -= 20
      
      // Data rows
      for (const log of logs) {
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([612, 792])
          yPosition = 750
        }
        
        const rowData = [
          new Date(log.created_at).toLocaleString(),
          log.event_type.replace(':', ' '),
          log.user_id?.substring(0, 8) || 'system',
          `${log.resource_type}:${log.resource_id?.substring(0, 8) || ''}`,
          log.status
        ]
        
        rowData.forEach((data, index) => {
          currentPage.drawText(data.substring(0, 15), {
            x: pageMargin + (index * 100),
            y: yPosition,
            size: 8,
            font: font
          })
        })
        
        yPosition -= lineHeight
      }
      
      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(filePath, pdfBytes)
      
      const stats = await fs.stat(filePath)
      const checksum = await this.calculateChecksum(filePath)
      
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        recordCount: logs.length,
        checksum
      }
      
    } catch (error) {
      logger.error('PDF export generation failed', { error, filePath })
      return { success: false, error: 'PDF generation failed' }
    }
  }
  
  /**
   * Generate CSV export
   */
  private async generateCSVExport(
    filePath: string,
    logs: AuditLogEntry[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const headers = [
        'id',
        'event_type',
        'severity',
        'user_id',
        'session_id',
        'resource_type',
        'resource_id',
        'action_performed',
        'client_ip',
        'user_agent',
        'status',
        'created_at'
      ]
      
      if (options.includeMetadata) {
        headers.push('compliance_frameworks', 'risk_score', 'sensitive_data_involved')
      }
      
      const csvRows = [headers.join(',')]
      
      for (const log of logs) {
        const row = [
          log.id || '',
          log.event_type,
          log.severity,
          log.user_id || '',
          log.session_id || '',
          log.resource_type,
          log.resource_id || '',
          log.action_performed,
          log.client_ip,
          `"${(log.user_agent || '').replace(/"/g, '""')}"`,
          log.status,
          log.created_at
        ]
        
        if (options.includeMetadata) {
          row.push(
            log.compliance_frameworks?.join(';') || '',
            (log.risk_score || 0).toString(),
            log.sensitive_data_involved.toString()
          )
        }
        
        csvRows.push(row.join(','))
      }
      
      const csvContent = csvRows.join('\n')
      await fs.writeFile(filePath, csvContent, 'utf-8')
      
      const stats = await fs.stat(filePath)
      const checksum = await this.calculateChecksum(filePath)
      
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        recordCount: logs.length,
        checksum
      }
      
    } catch (error) {
      logger.error('CSV export generation failed', { error, filePath })
      return { success: false, error: 'CSV generation failed' }
    }
  }
  
  /**
   * Generate JSON export
   */
  private async generateJSONExport(
    filePath: string,
    logs: AuditLogEntry[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          recordCount: logs.length,
          filters: options.filters,
          includeMetadata: options.includeMetadata,
          includeSensitiveData: options.includeSensitiveData
        },
        auditTrail: logs.map(log => {
          const exportLog: any = {
            id: log.id,
            event_type: log.event_type,
            severity: log.severity,
            user_id: log.user_id,
            session_id: log.session_id,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            action_performed: log.action_performed,
            client_ip: log.client_ip,
            user_agent: log.user_agent,
            status: log.status,
            created_at: log.created_at
          }
          
          if (options.includeMetadata) {
            exportLog.compliance_frameworks = log.compliance_frameworks
            exportLog.risk_score = log.risk_score
            exportLog.sensitive_data_involved = log.sensitive_data_involved
            exportLog.healthcare_context = log.healthcare_context
          }
          
          if (options.includeSensitiveData) {
            exportLog.old_values = log.old_values
            exportLog.new_values = log.new_values
            exportLog.affected_fields = log.affected_fields
          }
          
          return exportLog
        })
      }
      
      const jsonContent = JSON.stringify(exportData, null, 2)
      await fs.writeFile(filePath, jsonContent, 'utf-8')
      
      const stats = await fs.stat(filePath)
      const checksum = await this.calculateChecksum(filePath)
      
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        recordCount: logs.length,
        checksum
      }
      
    } catch (error) {
      logger.error('JSON export generation failed', { error, filePath })
      return { success: false, error: 'JSON generation failed' }
    }
  }
  
  /**
   * Generate XML export
   */
  private async generateXMLExport(
    filePath: string,
    logs: AuditLogEntry[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n'
      xmlContent += '<auditTrailExport>\n'
      xmlContent += '  <metadata>\n'
      xmlContent += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`
      xmlContent += `    <recordCount>${logs.length}</recordCount>\n`
      xmlContent += '  </metadata>\n'
      xmlContent += '  <auditLogs>\n'
      
      for (const log of logs) {
        xmlContent += '    <auditLog>\n'
        xmlContent += `      <id>${this.escapeXml(log.id || '')}</id>\n`
        xmlContent += `      <eventType>${this.escapeXml(log.event_type)}</eventType>\n`
        xmlContent += `      <severity>${this.escapeXml(log.severity)}</severity>\n`
        xmlContent += `      <userId>${this.escapeXml(log.user_id || '')}</userId>\n`
        xmlContent += `      <resourceType>${this.escapeXml(log.resource_type)}</resourceType>\n`
        xmlContent += `      <resourceId>${this.escapeXml(log.resource_id || '')}</resourceId>\n`
        xmlContent += `      <actionPerformed>${this.escapeXml(log.action_performed)}</actionPerformed>\n`
        xmlContent += `      <clientIp>${this.escapeXml(log.client_ip)}</clientIp>\n`
        xmlContent += `      <status>${this.escapeXml(log.status)}</status>\n`
        xmlContent += `      <createdAt>${log.created_at}</createdAt>\n`
        
        if (options.includeMetadata) {
          xmlContent += `      <riskScore>${log.risk_score || 0}</riskScore>\n`
          xmlContent += `      <sensitiveDataInvolved>${log.sensitive_data_involved}</sensitiveDataInvolved>\n`
        }
        
        xmlContent += '    </auditLog>\n'
      }
      
      xmlContent += '  </auditLogs>\n'
      xmlContent += '</auditTrailExport>'
      
      await fs.writeFile(filePath, xmlContent, 'utf-8')
      
      const stats = await fs.stat(filePath)
      const checksum = await this.calculateChecksum(filePath)
      
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        recordCount: logs.length,
        checksum
      }
      
    } catch (error) {
      logger.error('XML export generation failed', { error, filePath })
      return { success: false, error: 'XML generation failed' }
    }
  }
  
  /**
   * Generate Excel export (simplified XLSX structure)
   */
  private async generateExcelExport(
    filePath: string,
    logs: AuditLogEntry[],
    options: ExportOptions
  ): Promise<ExportResult> {
    // For now, generate CSV with .xlsx extension
    // In production, use a library like xlsx or exceljs
    const csvResult = await this.generateCSVExport(
      filePath.replace('.xlsx', '.csv'),
      logs,
      options
    )
    
    if (!csvResult.success) {
      return csvResult
    }
    
    // Rename to xlsx (simplified approach)
    const xlsxPath = filePath.replace('.csv', '.xlsx')
    await fs.rename(csvResult.filePath!, xlsxPath)
    
    return {
      ...csvResult,
      filePath: xlsxPath
    }
  }
  
  /**
   * Post-process export (encryption, signing, compression)
   */
  private async postProcessExport(
    exportId: string,
    filePath: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    let processedPath = filePath
    let digitalSignature: string | undefined
    
    try {
      // Digital signing
      if (options.digitallySigned && auditEncryption.isConfigured()) {
        const fileContent = await fs.readFile(processedPath)
        const signResult = auditEncryption.signData(fileContent.toString('base64'))
        
        if (typeof signResult !== 'string') {
          digitalSignature = signResult.signature
          
          // Create signature file
          const sigPath = `${processedPath}.sig`
          await fs.writeFile(sigPath, digitalSignature)
        }
      }
      
      // Encryption
      if (options.encryptExport && auditEncryption.isConfigured()) {
        const fileContent = await fs.readFile(processedPath)
        const encrypted = auditEncryption.encryptData(fileContent.toString('base64'))
        
        if (typeof encrypted !== 'string') {
          const encryptedPath = `${processedPath}.enc`
          await fs.writeFile(encryptedPath, JSON.stringify(encrypted))
          
          // Remove original unencrypted file
          await fs.unlink(processedPath)
          processedPath = encryptedPath
        }
      }
      
      // Compression
      if (options.compressionLevel && options.compressionLevel > 0) {
        const compressedPath = await this.compressFile(processedPath, options.compressionLevel)
        if (compressedPath !== processedPath) {
          await fs.unlink(processedPath)
          processedPath = compressedPath
        }
      }
      
      const stats = await fs.stat(processedPath)
      const checksum = await this.calculateChecksum(processedPath)
      
      return {
        success: true,
        filePath: processedPath,
        fileSize: stats.size,
        checksum,
        digitalSignature
      }
      
    } catch (error) {
      logger.error('Export post-processing failed', { error, exportId })
      return { success: false, error: 'Post-processing failed' }
    }
  }
  
  /**
   * Create archive from multiple batch files
   */
  private async createExportArchive(
    exportId: string,
    batchFiles: string[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const archivePath = path.join(this.exportDirectory, `${exportId}.zip`)
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(archivePath)
      const archive = archiver('zip', {
        zlib: { level: options.compressionLevel || 9 }
      })
      
      output.on('close', async () => {
        try {
          const stats = await fs.stat(archivePath)
          const checksum = await this.calculateChecksum(archivePath)
          
          resolve({
            success: true,
            filePath: archivePath,
            fileSize: stats.size,
            checksum
          })
        } catch (error) {
          reject(error)
        }
      })
      
      archive.on('error', reject)
      archive.pipe(output)
      
      // Add batch files to archive
      batchFiles.forEach(filePath => {
        archive.file(filePath, { name: path.basename(filePath) })
      })
      
      archive.finalize()
    })
  }
  
  /**
   * Store export metadata in database
   */
  private async storeExportMetadata(
    exportId: string,
    options: ExportOptions,
    result: ExportResult
  ): Promise<void> {
    try {
      const supabase = createClient()
      
      const metadata: ExportMetadata = {
        id: exportId,
        format: options.format,
        createdAt: new Date().toISOString(),
        requestedBy: null, // System generated
        filters: options.filters,
        recordCount: result.recordCount || 0,
        fileSize: result.fileSize || 0,
        checksum: result.checksum || '',
        encrypted: options.encryptExport,
        digitallySigned: options.digitallySigned
      }
      
      await supabase.from('audit_exports').insert(metadata)
      
    } catch (error) {
      logger.error('Failed to store export metadata', { error, exportId })
    }
  }
  
  // Utility methods
  private generateExportId(): string {
    return `export_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }
  
  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.access(this.exportDirectory)
    } catch {
      await fs.mkdir(this.exportDirectory, { recursive: true })
    }
  }
  
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath)
    return crypto.createHash('sha256').update(fileBuffer).digest('hex')
  }
  
  private async compressFile(filePath: string, level: number): Promise<string> {
    // Simplified compression - in production use gzip or similar
    return filePath // Return unchanged for now
  }
  
  private async cleanupBatchFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file)
      } catch (error) {
        logger.warn('Failed to cleanup batch file', { error, file })
      }
    }
  }
  
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}

// Export singleton instance
export const auditExporter = AuditExporter.getInstance()

export default AuditExporter
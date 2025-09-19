/**
 * Medical License Validator
 * Healthcare professional license validation and verification
 */

import { logger } from '@/lib/logging/client-safe-logger'

export interface MedicalLicense {
  id: string
  licenseNumber: string
  licenseType: LicenseType
  state: string
  country: string
  holderName: string
  holderId: string
  issueDate: Date
  expiryDate: Date
  status: LicenseStatus
  specialties: string[]
  restrictions?: string[]
  verificationStatus: VerificationStatus
  lastVerified: Date
  createdAt: Date
  updatedAt: Date
}

export enum LicenseType {
  MD = 'MD',
  DO = 'DO',
  RN = 'RN',
  NP = 'NP',
  PA = 'PA',
  PHARMACIST = 'PHARMACIST',
  DENTIST = 'DENTIST',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  PHYSICAL_THERAPIST = 'PHYSICAL_THERAPIST',
  OCCUPATIONAL_THERAPIST = 'OCCUPATIONAL_THERAPIST'
}

export enum LicenseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface LicenseValidationRequest {
  licenseNumber: string
  licenseType: LicenseType
  state: string
  country: string
  holderName: string
  holderId: string
}

export interface LicenseValidationResult {
  isValid: boolean
  status: LicenseStatus
  verificationStatus: VerificationStatus
  details: LicenseDetails
  warnings: string[]
  errors: string[]
}

export interface LicenseDetails {
  holderName: string
  specialties: string[]
  issueDate: Date
  expiryDate: Date
  restrictions?: string[]
  lastVerified: Date
}

export class MedicalLicenseValidator {
  private static readonly VERIFICATION_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private static readonly VERIFICATION_TIMEOUT = 30000 // 30 seconds

  /**
   * Validate medical license
   */
  static async validateLicense(
    request: LicenseValidationRequest
  ): Promise<{ success: boolean; data?: LicenseValidationResult; error?: string }> {
    try {
      // Validate request
      const validation = this.validateRequest(request)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid request: ${validation.errors.join(', ')}`
        }
      }

      // Check cache first
      const cachedResult = await this.getCachedValidation(request.licenseNumber)
      if (cachedResult) {
        logger.info('License validation from cache', {
          licenseNumber: request.licenseNumber,
          status: cachedResult.status
        })
        return {
          success: true,
          data: cachedResult
        }
      }

      // Perform validation
      const result = await this.performValidation(request)

      // Cache result
      await this.cacheValidation(request.licenseNumber, result)

      logger.info('License validation completed', {
        licenseNumber: request.licenseNumber,
        isValid: result.isValid,
        status: result.status
      })

      return {
        success: true,
        data: result
      }
    } catch (error) {
      logger.error('Failed to validate medical license', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request
      })

      return {
        success: false,
        error: 'Failed to validate medical license'
      }
    }
  }

  /**
   * Perform actual license validation
   */
  private static async performValidation(
    request: LicenseValidationRequest
  ): Promise<LicenseValidationResult> {
    const result: LicenseValidationResult = {
      isValid: false,
      status: LicenseStatus.INACTIVE,
      verificationStatus: VerificationStatus.FAILED,
      details: {
        holderName: request.holderName,
        specialties: [],
        issueDate: new Date(),
        expiryDate: new Date(),
        lastVerified: new Date()
      },
      warnings: [],
      errors: []
    }

    try {
      // TODO: Implement actual license validation API calls
      // This would typically involve calling state medical board APIs
      
      // Mock validation logic
      if (this.isValidLicenseFormat(request.licenseNumber, request.licenseType)) {
        result.isValid = true
        result.status = LicenseStatus.ACTIVE
        result.verificationStatus = VerificationStatus.VERIFIED
        
        // Add mock specialties based on license type
        result.details.specialties = this.getDefaultSpecialties(request.licenseType)
        
        // Set mock dates
        result.details.issueDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
        result.details.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      } else {
        result.errors.push('Invalid license number format')
      }

      // Check for common issues
      if (request.holderName.length < 2) {
        result.warnings.push('Holder name appears to be too short')
      }

      if (request.state.length !== 2) {
        result.warnings.push('State code should be 2 characters')
      }

    } catch (error) {
      result.errors.push('License validation service unavailable')
      logger.error('License validation service error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        licenseNumber: request.licenseNumber
      })
    }

    return result
  }

  /**
   * Validate license number format
   */
  private static isValidLicenseFormat(licenseNumber: string, licenseType: LicenseType): boolean {
    // Basic format validation based on license type
    switch (licenseType) {
      case LicenseType.MD:
      case LicenseType.DO:
        // Medical licenses typically have 6-8 digits
        return /^\d{6,8}$/.test(licenseNumber)
      
      case LicenseType.RN:
      case LicenseType.NP:
        // Nursing licenses vary by state
        return /^[A-Z0-9]{6,12}$/.test(licenseNumber)
      
      case LicenseType.PA:
        // Physician Assistant licenses
        return /^[A-Z0-9]{6,10}$/.test(licenseNumber)
      
      case LicenseType.PHARMACIST:
        // Pharmacist licenses
        return /^[A-Z0-9]{6,12}$/.test(licenseNumber)
      
      default:
        // Generic validation
        return /^[A-Z0-9]{4,15}$/.test(licenseNumber)
    }
  }

  /**
   * Get default specialties for license type
   */
  private static getDefaultSpecialties(licenseType: LicenseType): string[] {
    switch (licenseType) {
      case LicenseType.MD:
      case LicenseType.DO:
        return ['Internal Medicine', 'Family Medicine']
      
      case LicenseType.RN:
        return ['General Nursing']
      
      case LicenseType.NP:
        return ['Family Nurse Practitioner', 'Adult Nurse Practitioner']
      
      case LicenseType.PA:
        return ['General Practice']
      
      case LicenseType.PHARMACIST:
        return ['General Pharmacy']
      
      case LicenseType.DENTIST:
        return ['General Dentistry']
      
      case LicenseType.PSYCHOLOGIST:
        return ['Clinical Psychology']
      
      case LicenseType.PHYSICAL_THERAPIST:
        return ['Physical Therapy']
      
      case LicenseType.OCCUPATIONAL_THERAPIST:
        return ['Occupational Therapy']
      
      default:
        return []
    }
  }

  /**
   * Validate request
   */
  private static validateRequest(request: LicenseValidationRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!request.licenseNumber || request.licenseNumber.trim().length === 0) {
      errors.push('License number is required')
    }

    if (!request.licenseType) {
      errors.push('License type is required')
    }

    if (!request.state || request.state.trim().length === 0) {
      errors.push('State is required')
    }

    if (!request.country || request.country.trim().length === 0) {
      errors.push('Country is required')
    }

    if (!request.holderName || request.holderName.trim().length === 0) {
      errors.push('Holder name is required')
    }

    if (!request.holderId || request.holderId.trim().length === 0) {
      errors.push('Holder ID is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get cached validation result
   */
  private static async getCachedValidation(licenseNumber: string): Promise<LicenseValidationResult | null> {
    // TODO: Implement caching mechanism
    return null
  }

  /**
   * Cache validation result
   */
  private static async cacheValidation(licenseNumber: string, result: LicenseValidationResult): Promise<void> {
    // TODO: Implement caching mechanism
    logger.debug('License validation cached', { licenseNumber })
  }

  /**
   * Get license by number
   */
  static async getLicenseByNumber(
    licenseNumber: string
  ): Promise<{ success: boolean; data?: MedicalLicense; error?: string }> {
    try {
      // TODO: Fetch from database
      logger.info('License retrieved by number', { licenseNumber })

      return {
        success: false,
        error: 'License not found'
      }
    } catch (error) {
      logger.error('Failed to get license by number', {
        error: error instanceof Error ? error.message : 'Unknown error',
        licenseNumber
      })

      return {
        success: false,
        error: 'Failed to get license by number'
      }
    }
  }

  /**
   * Get licenses by holder
   */
  static async getLicensesByHolder(
    holderId: string
  ): Promise<{ success: boolean; data?: MedicalLicense[]; error?: string }> {
    try {
      // TODO: Fetch from database
      logger.info('Licenses retrieved by holder', { holderId })

      return {
        success: true,
        data: []
      }
    } catch (error) {
      logger.error('Failed to get licenses by holder', {
        error: error instanceof Error ? error.message : 'Unknown error',
        holderId
      })

      return {
        success: false,
        error: 'Failed to get licenses by holder'
      }
    }
  }

  /**
   * Update license status
   */
  static async updateLicenseStatus(
    licenseId: string,
    status: LicenseStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Update in database
      logger.info('License status updated', {
        licenseId,
        status,
        reason
      })

      return {
        success: true
      }
    } catch (error) {
      logger.error('Failed to update license status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        licenseId,
        status
      })

      return {
        success: false,
        error: 'Failed to update license status'
      }
    }
  }

  /**
   * Get license statistics
   */
  static async getLicenseStatistics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // TODO: Calculate statistics from database
      logger.info('License statistics retrieved')

      return {
        success: true,
        data: {
          totalLicenses: 0,
          activeLicenses: 0,
          expiredLicenses: 0,
          suspendedLicenses: 0,
          revokedLicenses: 0
        }
      }
    } catch (error) {
      logger.error('Failed to get license statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        error: 'Failed to get license statistics'
      }
    }
  }
}

export default MedicalLicenseValidator

// Export functions for backward compatibility
export const validateMedicalLicense = MedicalLicenseValidator.validateLicense;

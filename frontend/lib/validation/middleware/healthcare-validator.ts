/**
 * Healthcare Data Validation Module
 * 
 * Provides HIPAA-compliant validation for medical and healthcare data
 * 
 * @module lib/validation/middleware/healthcare-validator
 */

import { ValidationError, ValidationWarning } from './api-validator'

/**
 * Healthcare validation configuration
 */
export interface HealthcareValidationConfig {
  detectPII: boolean
  hipaaCompliant: boolean
  validateMedicalCodes?: boolean
  validateInsurance?: boolean
  auditSensitiveData?: boolean
}

/**
 * Medical code patterns
 */
const MEDICAL_CODES = {
  // ICD-10 codes
  icd10: /^[A-Z]\d{2}(\.\d{1,4})?$/,
  
  // CPT codes
  cpt: /^\d{5}$/,
  
  // HCPCS codes
  hcpcs: /^[A-Z]\d{4}$/,
  
  // NDC codes (National Drug Code)
  ndc: /^\d{5}-\d{4}-\d{2}$/,
  
  // LOINC codes
  loinc: /^\d{1,5}-\d$/,
  
  // SNOMED CT codes
  snomedCt: /^\d{6,18}$/
}

/**
 * PHI (Protected Health Information) elements
 */
const PHI_ELEMENTS = [
  'name',
  'address',
  'birthDate',
  'dateOfBirth',
  'ssn',
  'socialSecurityNumber',
  'medicalRecordNumber',
  'mrn',
  'healthPlanNumber',
  'accountNumber',
  'certificateNumber',
  'licenseNumber',
  'vehicleIdentifier',
  'deviceIdentifier',
  'webUrl',
  'ipAddress',
  'biometricIdentifier',
  'facePhoto',
  'fingerprint',
  'voiceprint',
  'retinalScan'
]

/**
 * HIPAA Safe Harbor identifiers
 */
const HIPAA_IDENTIFIERS = {
  dates: {
    pattern: /\b(0[1-9]|1[0-2])[\/\-\.](0[1-9]|[12]\d|3[01])[\/\-\.](19|20)\d{2}\b/g,
    description: 'Dates (except year) directly related to an individual'
  },
  phoneNumbers: {
    pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    description: 'Telephone numbers'
  },
  faxNumbers: {
    pattern: /\bfax:?\s*(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/gi,
    description: 'Fax numbers'
  },
  emailAddresses: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: 'Email addresses'
  },
  ssnNumbers: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    description: 'Social Security numbers'
  },
  mrnNumbers: {
    pattern: /\b(MRN|Medical Record)[\s:#]*\d{6,10}\b/gi,
    description: 'Medical record numbers'
  },
  healthPlanNumbers: {
    pattern: /\b(Member|Policy|Group)[\s:#]*[A-Z0-9]{8,12}\b/gi,
    description: 'Health plan beneficiary numbers'
  },
  accountNumbers: {
    pattern: /\b(Account|Acct)[\s:#]*\d{6,12}\b/gi,
    description: 'Account numbers'
  },
  certificateNumbers: {
    pattern: /\b(Certificate|Cert)[\s:#]*[A-Z0-9]{6,12}\b/gi,
    description: 'Certificate/license numbers'
  },
  vehicleIdentifiers: {
    pattern: /\b[A-HJ-NPR-Z0-9]{17}\b/g,
    description: 'Vehicle identifiers and serial numbers (VIN)'
  },
  deviceIdentifiers: {
    pattern: /\b(Device|Serial)[\s:#]*[A-Z0-9]{8,20}\b/gi,
    description: 'Device identifiers and serial numbers'
  },
  webUrls: {
    pattern: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    description: 'Web URLs'
  },
  ipAddresses: {
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    description: 'IP addresses'
  },
  biometricIdentifiers: {
    pattern: /\b(fingerprint|retina|iris|voice|face|palm|vein|dna)\s*(scan|print|pattern|template|data)\b/gi,
    description: 'Biometric identifiers'
  },
  facePhotos: {
    pattern: /\b(photo|picture|image|portrait|headshot|selfie)\b/gi,
    description: 'Full-face photographs'
  }
}

/**
 * Medical data validation patterns
 */
const MEDICAL_PATTERNS = {
  bloodType: /^(A|B|AB|O)[+-]$/,
  bloodPressure: /^\d{2,3}\/\d{2,3}$/,
  temperature: /^\d{2,3}(\.\d)?°?[FC]?$/,
  heartRate: /^\d{2,3}\s?(bpm|BPM)?$/,
  weight: /^\d{1,3}(\.\d{1,2})?\s?(kg|lbs?|pounds?|kilograms?)?$/i,
  height: /^\d{1,3}(\.\d{1,2})?\s?(cm|m|ft|in|feet|inches|centimeters?|meters?)?$/i,
  bmi: /^\d{1,2}(\.\d{1,2})?$/,
  glucose: /^\d{2,3}\s?(mg\/dl|mmol\/l)?$/i,
  cholesterol: /^\d{2,3}\s?(mg\/dl)?$/i
}

/**
 * Insurance validation patterns
 */
const INSURANCE_PATTERNS = {
  medicare: /^[A-Z]\d{9}$/,
  medicaid: /^\d{8,11}$/,
  groupNumber: /^[A-Z0-9]{5,15}$/,
  policyNumber: /^[A-Z0-9]{8,20}$/,
  memberId: /^[A-Z0-9]{8,15}$/
}

/**
 * Healthcare data validator
 */
export async function validateHealthcareData(
  data: any,
  config: HealthcareValidationConfig
): Promise<{
  valid: boolean
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  phiDetected?: string[]
  sensitiveFields?: string[]
}> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const phiDetected: string[] = []
  const sensitiveFields: string[] = []
  
  // Convert data to string for pattern matching
  const dataStr = JSON.stringify(data)
  
  // HIPAA compliance check
  if (config.hipaaCompliant) {
    const hipaaCheck = checkHIPAACompliance(dataStr)
    if (hipaaCheck.violations.length > 0) {
      for (const violation of hipaaCheck.violations) {
        errors.push({
          field: 'data',
          message: `HIPAA violation: ${violation.description}`,
          code: 'HIPAA_VIOLATION',
          severity: 'critical',
          suggestion: `Remove or de-identify ${violation.type} data`
        })
        phiDetected.push(violation.type)
      }
    }
  }
  
  // PII detection
  if (config.detectPII) {
    const piiCheck = detectPII(data)
    if (piiCheck.found) {
      for (const field of piiCheck.fields) {
        warnings.push({
          field: field,
          message: `Potential PII detected in field: ${field}`,
          code: 'PII_DETECTED',
          suggestion: 'Consider encrypting or removing this field'
        })
        sensitiveFields.push(field)
      }
    }
  }
  
  // Medical code validation
  if (config.validateMedicalCodes) {
    const medicalCodeCheck = validateMedicalCodes(data)
    if (medicalCodeCheck.invalid.length > 0) {
      for (const invalidCode of medicalCodeCheck.invalid) {
        warnings.push({
          field: invalidCode.field,
          message: `Invalid medical code format: ${invalidCode.type}`,
          code: 'INVALID_MEDICAL_CODE',
          suggestion: `Verify the ${invalidCode.type} code format`
        })
      }
    }
  }
  
  // Insurance validation
  if (config.validateInsurance) {
    const insuranceCheck = validateInsuranceData(data)
    if (insuranceCheck.invalid.length > 0) {
      for (const invalidField of insuranceCheck.invalid) {
        warnings.push({
          field: invalidField.field,
          message: `Invalid insurance data format: ${invalidField.type}`,
          code: 'INVALID_INSURANCE_DATA',
          suggestion: `Verify the ${invalidField.type} format`
        })
      }
    }
  }
  
  // Check for unencrypted sensitive data
  if (config.auditSensitiveData) {
    const sensitiveDataCheck = checkSensitiveData(data)
    if (sensitiveDataCheck.unencrypted.length > 0) {
      for (const field of sensitiveDataCheck.unencrypted) {
        errors.push({
          field: field,
          message: `Unencrypted sensitive data detected`,
          code: 'UNENCRYPTED_SENSITIVE_DATA',
          severity: 'critical',
          suggestion: 'Encrypt this field before storage or transmission'
        })
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    phiDetected: phiDetected.length > 0 ? phiDetected : undefined,
    sensitiveFields: sensitiveFields.length > 0 ? sensitiveFields : undefined
  }
}

/**
 * Check HIPAA compliance
 */
function checkHIPAACompliance(data: string): {
  compliant: boolean
  violations: Array<{ type: string; description: string }>
} {
  const violations: Array<{ type: string; description: string }> = []
  
  for (const [type, identifier] of Object.entries(HIPAA_IDENTIFIERS)) {
    if (identifier.pattern.test(data)) {
      violations.push({
        type,
        description: identifier.description
      })
    }
  }
  
  return {
    compliant: violations.length === 0,
    violations
  }
}

/**
 * Detect PII in data
 */
function detectPII(data: any): {
  found: boolean
  fields: string[]
} {
  const fields: string[] = []
  
  function checkObject(obj: any, path: string = ''): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        
        // Check if field name indicates PHI
        if (PHI_ELEMENTS.some(element => 
          key.toLowerCase().includes(element.toLowerCase())
        )) {
          fields.push(currentPath)
        }
        
        // Recursively check nested objects
        if (typeof value === 'object') {
          checkObject(value, currentPath)
        }
      }
    }
  }
  
  checkObject(data)
  
  return {
    found: fields.length > 0,
    fields
  }
}

/**
 * Validate medical codes
 */
function validateMedicalCodes(data: any): {
  valid: boolean
  invalid: Array<{ field: string; type: string; value: string }>
} {
  const invalid: Array<{ field: string; type: string; value: string }> = []
  
  function checkObject(obj: any, path: string = ''): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        
        if (typeof value === 'string') {
          // Check each medical code type
          for (const [codeType, pattern] of Object.entries(MEDICAL_CODES)) {
            if (key.toLowerCase().includes(codeType.toLowerCase())) {
              if (!pattern.test(value)) {
                invalid.push({
                  field: currentPath,
                  type: codeType,
                  value: value
                })
              }
            }
          }
        }
        
        // Recursively check nested objects
        if (typeof value === 'object') {
          checkObject(value, currentPath)
        }
      }
    }
  }
  
  checkObject(data)
  
  return {
    valid: invalid.length === 0,
    invalid
  }
}

/**
 * Validate insurance data
 */
function validateInsuranceData(data: any): {
  valid: boolean
  invalid: Array<{ field: string; type: string; value: string }>
} {
  const invalid: Array<{ field: string; type: string; value: string }> = []
  
  function checkObject(obj: any, path: string = ''): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        
        if (typeof value === 'string') {
          // Check each insurance pattern type
          for (const [insuranceType, pattern] of Object.entries(INSURANCE_PATTERNS)) {
            if (key.toLowerCase().includes(insuranceType.toLowerCase())) {
              if (!pattern.test(value)) {
                invalid.push({
                  field: currentPath,
                  type: insuranceType,
                  value: value
                })
              }
            }
          }
        }
        
        // Recursively check nested objects
        if (typeof value === 'object') {
          checkObject(value, currentPath)
        }
      }
    }
  }
  
  checkObject(data)
  
  return {
    valid: invalid.length === 0,
    invalid
  }
}

/**
 * Check for sensitive data that should be encrypted
 */
function checkSensitiveData(data: any): {
  encrypted: boolean
  unencrypted: string[]
} {
  const unencrypted: string[] = []
  const encryptedPattern = /^enc_[A-Za-z0-9+/=]+$/
  
  function checkObject(obj: any, path: string = ''): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        
        // Check if field contains sensitive data
        const isSensitive = PHI_ELEMENTS.some(element => 
          key.toLowerCase().includes(element.toLowerCase())
        )
        
        if (isSensitive && typeof value === 'string') {
          // Check if value appears to be encrypted
          if (!encryptedPattern.test(value)) {
            unencrypted.push(currentPath)
          }
        }
        
        // Recursively check nested objects
        if (typeof value === 'object') {
          checkObject(value, currentPath)
        }
      }
    }
  }
  
  checkObject(data)
  
  return {
    encrypted: unencrypted.length === 0,
    unencrypted
  }
}

/**
 * De-identify PHI data
 */
export function deIdentifyPHI(data: any): any {
  const deIdentified = JSON.parse(JSON.stringify(data))
  
  function maskObject(obj: any): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        // Check if field contains PHI
        const isPHI = PHI_ELEMENTS.some(element => 
          key.toLowerCase().includes(element.toLowerCase())
        )
        
        if (isPHI) {
          if (typeof value === 'string') {
            // Mask the value
            obj[key] = maskValue(value, key)
          } else if (typeof value === 'number') {
            // Replace with random number of same magnitude
            obj[key] = Math.floor(Math.random() * Math.pow(10, value.toString().length))
          }
        }
        
        // Recursively process nested objects
        if (typeof value === 'object') {
          maskObject(value)
        }
      }
    }
  }
  
  maskObject(deIdentified)
  return deIdentified
}

/**
 * Mask sensitive value based on type
 */
function maskValue(value: string, fieldName: string): string {
  // SSN pattern
  if (/\d{3}-\d{2}-\d{4}/.test(value)) {
    return 'XXX-XX-' + value.slice(-4)
  }
  
  // Email pattern
  if (/\S+@\S+\.\S+/.test(value)) {
    const [localPart, domain] = value.split('@')
    return localPart[0] + '***@' + domain
  }
  
  // Phone pattern
  if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(value)) {
    return 'XXX-XXX-' + value.slice(-4)
  }
  
  // Date pattern
  if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(value)) {
    const parts = value.split(/[\/\-]/)
    return `XX/XX/${parts[2]}`
  }
  
  // Default masking
  if (value.length <= 4) {
    return 'X'.repeat(value.length)
  }
  
  return value.slice(0, 2) + 'X'.repeat(value.length - 4) + value.slice(-2)
}

export default { validateHealthcareData, deIdentifyPHI }
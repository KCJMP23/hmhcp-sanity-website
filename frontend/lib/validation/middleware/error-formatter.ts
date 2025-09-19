/**
 * Error Formatter Module
 * 
 * Provides multi-language error messages and helpful suggestions
 * 
 * @module lib/validation/middleware/error-formatter
 */

/**
 * Error message translations
 */
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  en: {
    // Zod error codes
    invalid_type: 'Invalid type. Expected {expected}, received {received}',
    invalid_literal: 'Invalid literal value. Expected {expected}',
    custom: 'Invalid input',
    invalid_union: 'Invalid input. None of the expected types match',
    invalid_union_discriminator: 'Invalid discriminator value. Expected {expected}',
    invalid_enum_value: 'Invalid enum value. Expected one of: {expected}',
    unrecognized_keys: 'Unrecognized keys in object: {keys}',
    invalid_arguments: 'Invalid function arguments',
    invalid_return_type: 'Invalid function return type',
    invalid_date: 'Invalid date',
    invalid_string: 'Invalid string format',
    too_small: 'Value too small. Minimum: {minimum}',
    too_big: 'Value too large. Maximum: {maximum}',
    invalid_intersection_types: 'Intersection results could not be merged',
    not_multiple_of: 'Number must be a multiple of {multipleOf}',
    not_finite: 'Number must be finite',
    
    // Security error codes
    SQL_INJECTION_DETECTED: 'SQL injection attempt detected. Please remove SQL keywords and special characters',
    NOSQL_INJECTION_DETECTED: 'NoSQL injection attempt detected. Please remove database operators',
    XSS_DETECTED: 'Cross-site scripting attempt detected. Please remove scripts and HTML tags',
    COMMAND_INJECTION_WARNING: 'Potential command injection detected. Please review your input',
    PATH_TRAVERSAL_DETECTED: 'Path traversal attempt detected. Please use valid paths only',
    LDAP_INJECTION_WARNING: 'LDAP injection attempt detected. Please escape special characters',
    XML_INJECTION_WARNING: 'XML injection attempt detected. Please remove entity declarations',
    EMAIL_HEADER_INJECTION_WARNING: 'Email header injection attempt detected. Please remove line breaks',
    
    // Healthcare error codes
    HIPAA_VIOLATION: 'HIPAA compliance violation detected. Protected health information must be secured',
    PII_DETECTED: 'Personally identifiable information detected. Please encrypt or remove',
    UNENCRYPTED_SENSITIVE_DATA: 'Sensitive data must be encrypted before transmission',
    INVALID_MEDICAL_CODE: 'Invalid medical code format. Please verify the code',
    INVALID_INSURANCE_DATA: 'Invalid insurance information format',
    
    // Validation error codes
    MISSING_REQUIRED_FIELD: 'Required field is missing',
    INVALID_FORMAT: 'Invalid format for this field',
    FIELD_TOO_LONG: 'Field value exceeds maximum length',
    FIELD_TOO_SHORT: 'Field value is below minimum length',
    INVALID_EMAIL: 'Invalid email address format',
    INVALID_URL: 'Invalid URL format',
    INVALID_PHONE: 'Invalid phone number format',
    INVALID_DATE: 'Invalid date format',
    INVALID_TIME: 'Invalid time format',
    INVALID_UUID: 'Invalid UUID format',
    INVALID_JSON: 'Invalid JSON format',
    INVALID_BASE64: 'Invalid Base64 encoding',
    
    // Request error codes
    METHOD_NOT_ALLOWED: 'HTTP method not allowed for this endpoint',
    INVALID_CONTENT_TYPE: 'Content-Type not supported for this endpoint',
    REQUEST_TOO_LARGE: 'Request size exceeds maximum allowed size',
    MISSING_REQUIRED_HEADER: 'Required header is missing',
    FORBIDDEN_HEADER_PRESENT: 'Forbidden header detected',
    INVALID_BODY: 'Invalid request body',
    INVALID_QUERY: 'Invalid query parameters',
    INVALID_PARAMS: 'Invalid path parameters',
    INVALID_RESPONSE: 'Invalid response format',
    
    // System error codes
    INTERNAL_VALIDATION_ERROR: 'Internal validation error occurred',
    VALIDATION_TIMEOUT: 'Validation process timed out',
    CACHE_ERROR: 'Cache operation failed',
    DATABASE_ERROR: 'Database operation failed',
    EXTERNAL_SERVICE_ERROR: 'External service error',
    
    // File upload error codes
    FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
    INVALID_FILE_TYPE: 'File type is not allowed',
    MALICIOUS_FILE_DETECTED: 'Potentially malicious file detected',
    FILE_SCAN_FAILED: 'File security scan failed'
  },
  es: {
    invalid_type: 'Tipo inválido. Esperado {expected}, recibido {received}',
    invalid_literal: 'Valor literal inválido. Esperado {expected}',
    custom: 'Entrada inválida',
    invalid_union: 'Entrada inválida. Ninguno de los tipos esperados coincide',
    invalid_enum_value: 'Valor de enumeración inválido. Esperado uno de: {expected}',
    too_small: 'Valor demasiado pequeño. Mínimo: {minimum}',
    too_big: 'Valor demasiado grande. Máximo: {maximum}',
    SQL_INJECTION_DETECTED: 'Intento de inyección SQL detectado',
    XSS_DETECTED: 'Intento de cross-site scripting detectado',
    HIPAA_VIOLATION: 'Violación de cumplimiento HIPAA detectada',
    PII_DETECTED: 'Información personal identificable detectada',
    MISSING_REQUIRED_FIELD: 'Falta el campo requerido',
    INVALID_EMAIL: 'Formato de correo electrónico inválido',
    METHOD_NOT_ALLOWED: 'Método HTTP no permitido para este endpoint',
    REQUEST_TOO_LARGE: 'El tamaño de la solicitud excede el máximo permitido'
  },
  fr: {
    invalid_type: 'Type invalide. Attendu {expected}, reçu {received}',
    invalid_literal: 'Valeur littérale invalide. Attendu {expected}',
    custom: 'Entrée invalide',
    too_small: 'Valeur trop petite. Minimum: {minimum}',
    too_big: 'Valeur trop grande. Maximum: {maximum}',
    SQL_INJECTION_DETECTED: 'Tentative d\'injection SQL détectée',
    XSS_DETECTED: 'Tentative de cross-site scripting détectée',
    HIPAA_VIOLATION: 'Violation de conformité HIPAA détectée',
    PII_DETECTED: 'Informations personnelles identifiables détectées',
    MISSING_REQUIRED_FIELD: 'Champ requis manquant',
    INVALID_EMAIL: 'Format d\'adresse e-mail invalide'
  },
  de: {
    invalid_type: 'Ungültiger Typ. Erwartet {expected}, erhalten {received}',
    invalid_literal: 'Ungültiger Literalwert. Erwartet {expected}',
    custom: 'Ungültige Eingabe',
    too_small: 'Wert zu klein. Minimum: {minimum}',
    too_big: 'Wert zu groß. Maximum: {maximum}',
    SQL_INJECTION_DETECTED: 'SQL-Injection-Versuch erkannt',
    XSS_DETECTED: 'Cross-Site-Scripting-Versuch erkannt',
    HIPAA_VIOLATION: 'HIPAA-Compliance-Verletzung erkannt',
    PII_DETECTED: 'Persönlich identifizierbare Informationen erkannt',
    MISSING_REQUIRED_FIELD: 'Erforderliches Feld fehlt',
    INVALID_EMAIL: 'Ungültiges E-Mail-Adressformat'
  }
}

/**
 * Error suggestions
 */
const ERROR_SUGGESTIONS: Record<string, string> = {
  // Type errors
  invalid_type: 'Please ensure the field contains the correct data type',
  invalid_literal: 'Please use the exact value specified',
  invalid_enum_value: 'Please select one of the allowed values',
  invalid_date: 'Please use a valid date format (e.g., YYYY-MM-DD)',
  invalid_string: 'Please check the string format and try again',
  too_small: 'Please increase the value to meet the minimum requirement',
  too_big: 'Please decrease the value to meet the maximum requirement',
  
  // Security errors
  SQL_INJECTION_DETECTED: 'Remove SQL keywords like SELECT, INSERT, UPDATE, DELETE, DROP, etc.',
  NOSQL_INJECTION_DETECTED: 'Remove MongoDB operators like $where, $regex, $ne, etc.',
  XSS_DETECTED: 'Remove or encode HTML tags and JavaScript code',
  COMMAND_INJECTION_WARNING: 'Avoid using shell command characters like ;, |, &, `, $',
  PATH_TRAVERSAL_DETECTED: 'Use absolute paths or remove ../ sequences',
  LDAP_INJECTION_WARNING: 'Escape LDAP special characters: (, ), &, |, !, *',
  XML_INJECTION_WARNING: 'Remove DOCTYPE, ENTITY, and CDATA declarations',
  EMAIL_HEADER_INJECTION_WARNING: 'Remove line breaks (\\r\\n) and email headers',
  
  // Healthcare errors
  HIPAA_VIOLATION: 'Encrypt PHI data or use de-identification methods',
  PII_DETECTED: 'Use encryption or tokenization for sensitive data',
  UNENCRYPTED_SENSITIVE_DATA: 'Apply AES-256 encryption before sending',
  INVALID_MEDICAL_CODE: 'Verify the medical code format (e.g., ICD-10: A00.0)',
  INVALID_INSURANCE_DATA: 'Check insurance number format and try again',
  
  // Validation errors
  MISSING_REQUIRED_FIELD: 'Please provide a value for this required field',
  INVALID_FORMAT: 'Please check the format and try again',
  FIELD_TOO_LONG: 'Please shorten the value to fit within the limit',
  FIELD_TOO_SHORT: 'Please provide a longer value',
  INVALID_EMAIL: 'Use format: example@domain.com',
  INVALID_URL: 'Use format: https://example.com',
  INVALID_PHONE: 'Use format: +1-555-555-5555 or (555) 555-5555',
  INVALID_DATE: 'Use format: YYYY-MM-DD or MM/DD/YYYY',
  INVALID_UUID: 'Use format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  INVALID_JSON: 'Ensure proper JSON syntax with matching brackets',
  
  // Request errors
  METHOD_NOT_ALLOWED: 'Use one of the allowed HTTP methods for this endpoint',
  INVALID_CONTENT_TYPE: 'Set Content-Type to application/json or multipart/form-data',
  REQUEST_TOO_LARGE: 'Reduce the request size or split into multiple requests',
  MISSING_REQUIRED_HEADER: 'Add the required header to your request',
  FORBIDDEN_HEADER_PRESENT: 'Remove the forbidden header from your request',
  
  // File errors
  FILE_TOO_LARGE: 'Compress the file or use a smaller file',
  INVALID_FILE_TYPE: 'Use an allowed file type (JPEG, PNG, PDF, etc.)',
  MALICIOUS_FILE_DETECTED: 'Scan the file for malware and try again'
}

/**
 * Field-specific examples
 */
const FIELD_EXAMPLES: Record<string, string> = {
  email: 'john.doe@example.com',
  phone: '+1-555-555-5555',
  url: 'https://www.example.com',
  date: '2024-01-15',
  time: '14:30:00',
  datetime: '2024-01-15T14:30:00Z',
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  ssn: 'XXX-XX-1234',
  creditCard: 'XXXX-XXXX-XXXX-1234',
  postalCode: '12345 or 12345-6789',
  ipAddress: '192.168.1.1',
  macAddress: '00:1B:44:11:3A:B7',
  isbn: '978-3-16-148410-0',
  iban: 'GB82 WEST 1234 5698 7654 32',
  bic: 'DEUTDEFF',
  base64: 'SGVsbG8gV29ybGQ=',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  hexColor: '#FF5733 or FF5733',
  rgbColor: 'rgb(255, 87, 51)',
  percentage: '75% or 0.75'
}

/**
 * Error formatter class
 */
export class ErrorFormatter {
  private locale: string
  private messages: Record<string, string>

  constructor(locale: string = 'en') {
    this.locale = locale
    this.messages = ERROR_MESSAGES[locale] || ERROR_MESSAGES.en
  }

  /**
   * Format error message
   */
  format(message: string, code: string, context?: Record<string, any>): string {
    // Try to get localized message
    let formatted = this.messages[code] || message

    // Replace placeholders with context values
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        formatted = formatted.replace(`{${key}}`, String(value))
      })
    }

    // Add field example if available
    const fieldName = context?.field
    if (fieldName && FIELD_EXAMPLES[fieldName]) {
      formatted += ` (Example: ${FIELD_EXAMPLES[fieldName]})`
    }

    return formatted
  }

  /**
   * Get suggestion for error code
   */
  getSuggestion(code: string): string | undefined {
    return ERROR_SUGGESTIONS[code]
  }

  /**
   * Format validation errors for user display
   */
  formatForUser(errors: Array<{
    field: string
    message: string
    code: string
    suggestion?: string
  }>): string {
    const formatted = errors.map(error => {
      let message = `${error.field}: ${error.message}`
      if (error.suggestion) {
        message += ` (Suggestion: ${error.suggestion})`
      }
      return message
    })

    return formatted.join('\n')
  }

  /**
   * Format validation errors as HTML
   */
  formatAsHtml(errors: Array<{
    field: string
    message: string
    code: string
    suggestion?: string
  }>): string {
    const items = errors.map(error => {
      let html = `<li><strong>${this.escapeHtml(error.field)}</strong>: ${this.escapeHtml(error.message)}`
      if (error.suggestion) {
        html += `<br><em>Suggestion: ${this.escapeHtml(error.suggestion)}</em>`
      }
      html += '</li>'
      return html
    })

    return `<ul class="validation-errors">${items.join('')}</ul>`
  }

  /**
   * Format validation errors as JSON
   */
  formatAsJson(errors: Array<{
    field: string
    message: string
    code: string
    suggestion?: string
  }>): object {
    const formatted: Record<string, any> = {
      error: 'Validation failed',
      details: {}
    }

    errors.forEach(error => {
      formatted.details[error.field] = {
        message: error.message,
        code: error.code,
        suggestion: error.suggestion
      }
    })

    return formatted
  }

  /**
   * Format validation errors for logging
   */
  formatForLogging(errors: Array<{
    field: string
    message: string
    code: string
    suggestion?: string
  }>): string {
    const timestamp = new Date().toISOString()
    const formatted = errors.map(error => {
      return `[${timestamp}] VALIDATION_ERROR: field="${error.field}" code="${error.code}" message="${error.message}"`
    })

    return formatted.join('\n')
  }

  /**
   * Get user-friendly field name
   */
  getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      email: 'Email Address',
      phone: 'Phone Number',
      firstName: 'First Name',
      lastName: 'Last Name',
      dob: 'Date of Birth',
      ssn: 'Social Security Number',
      mrn: 'Medical Record Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      country: 'Country',
      creditCard: 'Credit Card Number',
      cvv: 'CVV',
      expiryDate: 'Expiry Date'
    }

    return labels[field] || field.replace(/([A-Z])/g, ' $1').trim()
  }

  /**
   * Create recovery instructions
   */
  getRecoveryInstructions(code: string): string[] {
    const instructions: Record<string, string[]> = {
      SQL_INJECTION_DETECTED: [
        '1. Remove all SQL keywords from your input',
        '2. Use only alphanumeric characters where possible',
        '3. Avoid special characters like quotes and semicolons',
        '4. If you need to search, use the provided search filters'
      ],
      XSS_DETECTED: [
        '1. Remove all HTML tags from your input',
        '2. Remove any JavaScript code',
        '3. Use plain text only',
        '4. If formatting is needed, use markdown syntax'
      ],
      HIPAA_VIOLATION: [
        '1. Remove or mask all patient identifiers',
        '2. Use only de-identified data',
        '3. Encrypt sensitive information before sending',
        '4. Contact your administrator for secure data handling'
      ],
      FILE_TOO_LARGE: [
        '1. Compress your file using ZIP or similar',
        '2. Reduce image quality if applicable',
        '3. Split large files into smaller parts',
        '4. Use cloud storage and share a link instead'
      ]
    }

    return instructions[code] || ['Please review your input and try again']
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
    return text.replace(/[&<>"'/]/g, char => map[char])
  }

  /**
   * Change locale
   */
  setLocale(locale: string): void {
    this.locale = locale
    this.messages = ERROR_MESSAGES[locale] || ERROR_MESSAGES.en
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): string[] {
    return Object.keys(ERROR_MESSAGES)
  }
}

export default ErrorFormatter
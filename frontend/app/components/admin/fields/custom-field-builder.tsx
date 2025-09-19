/**
 * Custom Field Builder Component
 * Healthcare-specific field creation and management interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  CustomFieldDefinition, 
  FieldType, 
  DataType, 
  ValidationRule, 
  ValidationType,
  HealthcareDataClassification,
  DataSensitivityLevel,
  HealthcareDataCategory,
  FieldTemplateCategory,
  CustomFieldTemplate
} from '../../../types/fields/custom-field-types';

interface CustomFieldBuilderProps {
  organizationId: string;
  userId: string;
  onFieldCreated?: (field: CustomFieldDefinition) => void;
  onFieldUpdated?: (field: CustomFieldDefinition) => void;
  onFieldDeleted?: (fieldId: string) => void;
  initialField?: CustomFieldDefinition;
  mode?: 'create' | 'edit' | 'view';
}

export default function CustomFieldBuilder({
  organizationId,
  userId,
  onFieldCreated,
  onFieldUpdated,
  onFieldDeleted,
  initialField,
  mode = 'create'
}: CustomFieldBuilderProps) {
  const [field, setField] = useState<Partial<CustomFieldDefinition>>(initialField || {});
  const [templates, setTemplates] = useState<CustomFieldTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Field type options
  const fieldTypes: { value: FieldType; label: string; description: string }[] = [
    { value: 'text', label: 'Text', description: 'Single line text input' },
    { value: 'textarea', label: 'Text Area', description: 'Multi-line text input' },
    { value: 'number', label: 'Number', description: 'Numeric input' },
    { value: 'date', label: 'Date', description: 'Date picker' },
    { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
    { value: 'time', label: 'Time', description: 'Time picker' },
    { value: 'select', label: 'Select', description: 'Dropdown selection' },
    { value: 'multiselect', label: 'Multi-Select', description: 'Multiple selection dropdown' },
    { value: 'radio', label: 'Radio Buttons', description: 'Single selection radio buttons' },
    { value: 'checkbox', label: 'Checkbox', description: 'Boolean checkbox' },
    { value: 'file', label: 'File Upload', description: 'File upload field' },
    { value: 'image', label: 'Image Upload', description: 'Image upload field' },
    { value: 'signature', label: 'Digital Signature', description: 'Digital signature capture' },
    { value: 'patient_id', label: 'Patient ID', description: 'Healthcare patient identifier' },
    { value: 'medical_record_number', label: 'Medical Record Number', description: 'Medical record identifier' },
    { value: 'insurance_id', label: 'Insurance ID', description: 'Insurance identifier' },
    { value: 'diagnosis_code', label: 'Diagnosis Code', description: 'ICD-10 diagnosis code' },
    { value: 'procedure_code', label: 'Procedure Code', description: 'CPT procedure code' },
    { value: 'medication', label: 'Medication', description: 'Medication information' },
    { value: 'vital_signs', label: 'Vital Signs', description: 'Vital signs measurement' },
    { value: 'lab_result', label: 'Lab Result', description: 'Laboratory test result' },
    { value: 'imaging_result', label: 'Imaging Result', description: 'Medical imaging result' },
    { value: 'clinical_note', label: 'Clinical Note', description: 'Clinical documentation' },
    { value: 'assessment', label: 'Assessment', description: 'Clinical assessment' },
    { value: 'plan', label: 'Care Plan', description: 'Treatment plan' },
    { value: 'referral', label: 'Referral', description: 'Patient referral' },
    { value: 'consent', label: 'Consent Form', description: 'Patient consent' },
    { value: 'emergency_contact', label: 'Emergency Contact', description: 'Emergency contact information' },
    { value: 'allergy', label: 'Allergy', description: 'Allergy information' },
    { value: 'medication_history', label: 'Medication History', description: 'Medication history' },
    { value: 'family_history', label: 'Family History', description: 'Family medical history' },
    { value: 'social_history', label: 'Social History', description: 'Social history' },
    { value: 'custom_healthcare', label: 'Custom Healthcare', description: 'Custom healthcare field' }
  ];

  // Data type options
  const dataTypes: { value: DataType; label: string; description: string }[] = [
    { value: 'string', label: 'String', description: 'Text data' },
    { value: 'number', label: 'Number', description: 'Numeric data' },
    { value: 'boolean', label: 'Boolean', description: 'True/false data' },
    { value: 'date', label: 'Date', description: 'Date data' },
    { value: 'datetime', label: 'DateTime', description: 'Date and time data' },
    { value: 'array', label: 'Array', description: 'List of values' },
    { value: 'object', label: 'Object', description: 'Structured data' },
    { value: 'file', label: 'File', description: 'File data' },
    { value: 'json', label: 'JSON', description: 'JSON data' }
  ];

  // Sensitivity level options
  const sensitivityLevels: { value: DataSensitivityLevel; label: string; description: string }[] = [
    { value: 'public', label: 'Public', description: 'Publicly accessible data' },
    { value: 'internal', label: 'Internal', description: 'Internal organization data' },
    { value: 'confidential', label: 'Confidential', description: 'Confidential data requiring protection' },
    { value: 'restricted', label: 'Restricted', description: 'Highly restricted data' },
    { value: 'top_secret', label: 'Top Secret', description: 'Highest security classification' }
  ];

  // Healthcare data category options
  const dataCategories: { value: HealthcareDataCategory; label: string; description: string }[] = [
    { value: 'demographics', label: 'Demographics', description: 'Patient demographic information' },
    { value: 'clinical', label: 'Clinical', description: 'Clinical data and assessments' },
    { value: 'financial', label: 'Financial', description: 'Financial and billing information' },
    { value: 'administrative', label: 'Administrative', description: 'Administrative data' },
    { value: 'research', label: 'Research', description: 'Research data' },
    { value: 'quality_metrics', label: 'Quality Metrics', description: 'Quality measurement data' },
    { value: 'compliance', label: 'Compliance', description: 'Compliance and regulatory data' },
    { value: 'emergency', label: 'Emergency', description: 'Emergency contact and information' },
    { value: 'pharmacy', label: 'Pharmacy', description: 'Pharmacy and medication data' },
    { value: 'laboratory', label: 'Laboratory', description: 'Laboratory test data' },
    { value: 'imaging', label: 'Imaging', description: 'Medical imaging data' },
    { value: 'pathology', label: 'Pathology', description: 'Pathology data' },
    { value: 'genetics', label: 'Genetics', description: 'Genetic information' },
    { value: 'mental_health', label: 'Mental Health', description: 'Mental health data' },
    { value: 'substance_abuse', label: 'Substance Abuse', description: 'Substance abuse data' },
    { value: 'infectious_disease', label: 'Infectious Disease', description: 'Infectious disease data' },
    { value: 'cancer_registry', label: 'Cancer Registry', description: 'Cancer registry data' },
    { value: 'birth_defects', label: 'Birth Defects', description: 'Birth defects data' },
    { value: 'immunization', label: 'Immunization', description: 'Immunization records' },
    { value: 'vital_records', label: 'Vital Records', description: 'Vital records data' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/admin/field-templates?organization_id=${organizationId}`);
      const data = await response.json();
      setTemplates(data.fields || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setField(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleHealthcareClassificationChange = (key: string, value: any) => {
    setField(prev => ({
      ...prev,
      healthcare_classification: {
        ...prev.healthcare_classification,
        [key]: value
      } as HealthcareDataClassification
    }));
  };

  const addValidationRule = () => {
    const newRule: ValidationRule = {
      id: `rule_${Date.now()}`,
      type: 'required',
      message: 'Field is required',
      severity: 'error'
    };

    setField(prev => ({
      ...prev,
      validation_rules: [...(prev.validation_rules || []), newRule]
    }));
  };

  const updateValidationRule = (index: number, rule: ValidationRule) => {
    setField(prev => ({
      ...prev,
      validation_rules: prev.validation_rules?.map((r, i) => i === index ? rule : r) || []
    }));
  };

  const removeValidationRule = (index: number) => {
    setField(prev => ({
      ...prev,
      validation_rules: prev.validation_rules?.filter((_, i) => i !== index) || []
    }));
  };

  const validateField = async () => {
    if (!field.name || !field.field_type) {
      setError('Field name and type are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/fields/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_definition: field,
          organization_id: organizationId,
          context: { userId, timestamp: new Date().toISOString() }
        })
      });

      const result = await response.json();
      setValidationErrors(result.errors || []);
      setWarnings(result.warnings || []);
      setSuggestions(result.suggestions || []);
    } catch (error) {
      setError('Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const saveField = async () => {
    if (!field.name || !field.field_type) {
      setError('Field name and type are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = mode === 'edit' ? '/api/admin/fields' : '/api/admin/fields';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_data: field,
          field_id: field.id,
          updates: field,
          organization_id: organizationId,
          user_id: userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to save field');
        setValidationErrors(result.validation_errors || []);
        setWarnings(result.warnings || []);
        setSuggestions(result.suggestions || []);
        return;
      }

      if (mode === 'create' && onFieldCreated) {
        onFieldCreated(result);
      } else if (mode === 'edit' && onFieldUpdated) {
        onFieldUpdated(result);
      }

      // Reset form for create mode
      if (mode === 'create') {
        setField({});
        setValidationErrors([]);
        setWarnings([]);
        setSuggestions([]);
      }
    } catch (error) {
      setError('Failed to save field');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (template: CustomFieldTemplate) => {
    // Load template fields into the builder
    setField(prev => ({
      ...prev,
      fields: template.fields
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create Custom Field' : 
             mode === 'edit' ? 'Edit Field' : 'View Field'}
          </h2>
          <p className="text-gray-600 mt-1">
            {mode === 'create' ? 'Create a new healthcare-specific custom field' :
             mode === 'edit' ? 'Modify field properties and validation rules' :
             'View field configuration and properties'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Field Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={field.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., patient_id"
                  disabled={mode === 'view'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={field.label || ''}
                  onChange={(e) => handleFieldChange('label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Patient ID"
                  disabled={mode === 'view'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type *
                </label>
                <select
                  value={field.field_type || ''}
                  onChange={(e) => handleFieldChange('field_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="">Select field type</option>
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Type *
                </label>
                <select
                  value={field.data_type || ''}
                  onChange={(e) => handleFieldChange('data_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="">Select data type</option>
                  {dataTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={field.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the purpose and usage of this field"
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </div>

          {/* Healthcare Classification */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Healthcare Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sensitivity Level *
                </label>
                <select
                  value={field.healthcare_classification?.sensitivity_level || ''}
                  onChange={(e) => handleHealthcareClassificationChange('sensitivity_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="">Select sensitivity level</option>
                  {sensitivityLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label} - {level.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Category *
                </label>
                <select
                  value={field.healthcare_classification?.data_category || ''}
                  onChange={(e) => handleHealthcareClassificationChange('data_category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="">Select data category</option>
                  {dataCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label} - {category.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.healthcare_classification?.phi_required || false}
                    onChange={(e) => handleHealthcareClassificationChange('phi_required', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={mode === 'view'}
                  />
                  <span className="ml-2 text-sm text-gray-700">PHI Required</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.healthcare_classification?.hipaa_protected || false}
                    onChange={(e) => handleHealthcareClassificationChange('hipaa_protected', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={mode === 'view'}
                  />
                  <span className="ml-2 text-sm text-gray-700">HIPAA Protected</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.healthcare_classification?.encryption_required || false}
                    onChange={(e) => handleHealthcareClassificationChange('encryption_required', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={mode === 'view'}
                  />
                  <span className="ml-2 text-sm text-gray-700">Encryption Required</span>
                </label>
              </div>
            </div>
          </div>

          {/* Field Options */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Options</h3>
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.is_required || false}
                  onChange={(e) => handleFieldChange('is_required', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={mode === 'view'}
                />
                <span className="ml-2 text-sm text-gray-700">Required Field</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.is_active !== false}
                  onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={mode === 'view'}
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Validation Rules */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Validation Rules</h3>
              {mode !== 'view' && (
                <button
                  onClick={addValidationRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Rule
                </button>
              )}
            </div>

            <div className="space-y-4">
              {field.validation_rules?.map((rule, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rule Type
                      </label>
                      <select
                        value={rule.type}
                        onChange={(e) => updateValidationRule(index, { ...rule, type: e.target.value as ValidationType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={mode === 'view'}
                      >
                        <option value="required">Required</option>
                        <option value="min_length">Min Length</option>
                        <option value="max_length">Max Length</option>
                        <option value="min_value">Min Value</option>
                        <option value="max_value">Max Value</option>
                        <option value="pattern">Pattern</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="healthcare_id_format">Healthcare ID Format</option>
                        <option value="medical_code_format">Medical Code Format</option>
                        <option value="vital_signs_range">Vital Signs Range</option>
                        <option value="hipaa_compliant">HIPAA Compliant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity
                      </label>
                      <select
                        value={rule.severity}
                        onChange={(e) => updateValidationRule(index, { ...rule, severity: e.target.value as ValidationSeverity })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={mode === 'view'}
                      >
                        <option value="error">Error</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <input
                        type="text"
                        value={rule.message}
                        onChange={(e) => updateValidationRule(index, { ...rule, message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Validation message"
                        disabled={mode === 'view'}
                      />
                    </div>

                    <div className="flex items-end">
                      {mode !== 'view' && (
                        <button
                          onClick={() => removeValidationRule(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!field.validation_rules || field.validation_rules.length === 0) && (
                <p className="text-gray-500 text-center py-4">No validation rules defined</p>
              )}
            </div>
          </div>

          {/* Templates */}
          {templates.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div key={template.id} className="p-4 border border-gray-200 rounded-md hover:border-blue-300">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {template.fields.length} fields • {template.category}
                    </p>
                    {mode !== 'view' && (
                      <button
                        onClick={() => loadTemplate(template)}
                        className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Use Template
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Results */}
          {(validationErrors.length > 0 || warnings.length > 0 || suggestions.length > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Results</h3>
              
              {validationErrors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Errors</h4>
                  <div className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{error.message}</p>
                        {error.suggested_fix && (
                          <p className="text-xs text-red-600 mt-1">Suggestion: {error.suggested_fix}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings</h4>
                  <div className="space-y-2">
                    {warnings.map((warning, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">{warning.message}</p>
                        {warning.recommendation && (
                          <p className="text-xs text-yellow-600 mt-1">Recommendation: {warning.recommendation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Suggestions</h4>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">{suggestion.message}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Impact: {suggestion.business_impact} • Effort: {suggestion.implementation_effort}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={validateField}
                disabled={loading || mode === 'view'}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {loading ? 'Validating...' : 'Validate Field'}
              </button>
            </div>

            <div className="flex space-x-4">
              {mode !== 'view' && (
                <button
                  onClick={saveField}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : mode === 'edit' ? 'Update Field' : 'Create Field'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Tag, 
  FileText, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { MediaFile } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface MetadataEditingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFile: MediaFile | null;
  onSave: (updatedFile: MediaFile) => void;
  isBulkEdit?: boolean;
  selectedFiles?: MediaFile[];
}

interface MetadataForm {
  alt_text: string;
  caption: string;
  medical_tags: string[];
  newTag: string;
}

const MEDICAL_TAG_SUGGESTIONS = [
  'anatomy', 'cardiology', 'neurology', 'orthopedics', 'pediatrics',
  'surgery', 'diagnosis', 'treatment', 'procedure', 'equipment',
  'medication', 'symptom', 'condition', 'research', 'education',
  'x-ray', 'mri', 'ct-scan', 'ultrasound', 'lab-results'
];

const MEDICAL_ACCURACY_TAGS = [
  'clinically-verified', 'peer-reviewed', 'evidence-based',
  'case-study', 'clinical-trial', 'medical-guideline',
  'anatomical-correct', 'diagnostic-quality', 'educational'
];

export function MetadataEditingModal({ 
  isOpen, 
  onClose, 
  mediaFile, 
  onSave, 
  isBulkEdit = false,
  selectedFiles = []
}: MetadataEditingModalProps) {
  const [formData, setFormData] = useState<MetadataForm>({
    alt_text: '',
    caption: '',
    medical_tags: [],
    newTag: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [complianceStatus, setComplianceStatus] = useState<'pending' | 'validating' | 'valid' | 'invalid'>('pending');
  const logger = new HealthcareAILogger('MetadataEditingModal');

  useEffect(() => {
    if (isOpen && mediaFile) {
      setFormData({
        alt_text: mediaFile.alt_text || '',
        caption: mediaFile.caption || '',
        medical_tags: [...mediaFile.medical_tags],
        newTag: ''
      });
      setValidationErrors({});
      setComplianceStatus('pending');
    }
  }, [isOpen, mediaFile]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Alt text is required for healthcare compliance
    if (!formData.alt_text.trim()) {
      errors.alt_text = 'Alt text is required for healthcare compliance';
    } else if (formData.alt_text.length < 10) {
      errors.alt_text = 'Alt text must be at least 10 characters for medical accuracy';
    } else if (formData.alt_text.length > 200) {
      errors.alt_text = 'Alt text must be less than 200 characters';
    }

    // Caption validation
    if (formData.caption && formData.caption.length > 500) {
      errors.caption = 'Caption must be less than 500 characters';
    }

    // Medical tags validation
    if (formData.medical_tags.length === 0) {
      errors.medical_tags = 'At least one medical tag is required';
    } else if (formData.medical_tags.length > 10) {
      errors.medical_tags = 'Maximum 10 medical tags allowed';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateMedicalAccuracy = async (): Promise<boolean> => {
    setComplianceStatus('validating');
    
    // Simulate medical accuracy validation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if alt text contains medical terminology
        const medicalTerms = ['anatomy', 'diagnosis', 'treatment', 'procedure', 'condition', 'symptom'];
        const hasMedicalTerms = medicalTerms.some(term => 
          formData.alt_text.toLowerCase().includes(term)
        );
        
        // Check if medical tags are appropriate
        const hasValidTags = formData.medical_tags.some(tag => 
          MEDICAL_TAG_SUGGESTIONS.includes(tag) || MEDICAL_ACCURACY_TAGS.includes(tag)
        );
        
        const isValid = hasMedicalTerms && hasValidTags && formData.alt_text.length >= 20;
        setComplianceStatus(isValid ? 'valid' : 'invalid');
        resolve(isValid);
      }, 2000);
    });
  };

  const addTag = (tag: string) => {
    if (tag && !formData.medical_tags.includes(tag) && formData.medical_tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        medical_tags: [...prev.medical_tags, tag],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      medical_tags: prev.medical_tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      logger.warn('Form validation failed', { 
        errors: validationErrors, 
        context: 'metadata_editing' 
      });
      return;
    }

    setIsSaving(true);
    logger.log('Starting metadata save process', { 
      fileId: mediaFile?.id, 
      isBulkEdit, 
      context: 'metadata_editing' 
    });

    try {
      // Validate medical accuracy
      const isCompliant = await validateMedicalAccuracy();
      
      if (!isCompliant) {
        logger.error('Metadata failed medical accuracy validation', 
          new Error('Medical accuracy validation failed'), 
          { fileId: mediaFile?.id, context: 'metadata_editing' }
        );
        return;
      }

      if (isBulkEdit) {
        // Handle bulk edit
        const updatedFiles = selectedFiles.map(file => ({
          ...file,
          alt_text: formData.alt_text,
          caption: formData.caption,
          medical_tags: formData.medical_tags,
          compliance_status: 'validated' as const
        }));

        updatedFiles.forEach(file => {
          onSave(file);
        });

        logger.log('Bulk metadata update completed', { 
          fileCount: updatedFiles.length, 
          context: 'metadata_editing' 
        });
      } else if (mediaFile) {
        // Handle single file edit
        const updatedFile: MediaFile = {
          ...mediaFile,
          alt_text: formData.alt_text,
          caption: formData.caption,
          medical_tags: formData.medical_tags,
          compliance_status: 'validated'
        };

        onSave(updatedFile);
        logger.log('Metadata updated successfully', { 
          fileId: mediaFile.id, 
          context: 'metadata_editing' 
        });
      }

      onClose();
    } catch (error) {
      logger.error('Failed to save metadata', error, { 
        fileId: mediaFile?.id, 
        context: 'metadata_editing' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = (template: 'anatomy' | 'procedure' | 'equipment' | 'condition') => {
    const templates = {
      anatomy: {
        alt_text: 'Detailed anatomical illustration showing [specific body part] with labeled structures and medical terminology',
        caption: 'Educational anatomical diagram for medical training and reference',
        medical_tags: ['anatomy', 'educational', 'clinically-verified']
      },
      procedure: {
        alt_text: 'Step-by-step medical procedure illustration demonstrating [procedure name] with proper technique and safety protocols',
        caption: 'Clinical procedure guide for healthcare professionals',
        medical_tags: ['procedure', 'clinical', 'evidence-based']
      },
      equipment: {
        alt_text: 'Medical equipment image showing [equipment name] with proper usage and safety considerations',
        caption: 'Medical device documentation for clinical reference',
        medical_tags: ['equipment', 'medical-device', 'clinical']
      },
      condition: {
        alt_text: 'Medical condition illustration depicting [condition name] with symptoms and diagnostic features',
        caption: 'Educational material for condition recognition and diagnosis',
        medical_tags: ['condition', 'diagnosis', 'educational']
      }
    };

    const templateData = templates[template];
    setFormData(prev => ({
      ...prev,
      alt_text: templateData.alt_text,
      caption: templateData.caption,
      medical_tags: [...new Set([...prev.medical_tags, ...templateData.medical_tags])]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isBulkEdit ? 'Bulk Edit Metadata' : 'Edit Metadata'}
              </h2>
              {mediaFile && (
                <span className="text-sm text-gray-500">{mediaFile.filename}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Compliance Status */}
              <div className="flex items-center space-x-2">
                {complianceStatus === 'validating' && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {complianceStatus === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {complianceStatus === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500 capitalize">
                  {complianceStatus === 'validating' ? 'Validating...' : complianceStatus}
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Medical Templates */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Medical Templates</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'anatomy', label: 'Anatomy' },
                    { key: 'procedure', label: 'Procedure' },
                    { key: 'equipment', label: 'Equipment' },
                    { key: 'condition', label: 'Condition' }
                  ].map((template) => (
                    <button
                      key={template.key}
                      onClick={() => applyTemplate(template.key as any)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.alt_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.alt_text ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Describe the medical image in detail for accessibility and healthcare compliance..."
                />
                {validationErrors.alt_text && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.alt_text}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.alt_text.length}/200 characters (minimum 10 for medical accuracy)
                </p>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.caption ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={2}
                  placeholder="Additional context or description for the medical image..."
                />
                {validationErrors.caption && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.caption}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.caption.length}/500 characters
                </p>
              </div>

              {/* Medical Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Tags <span className="text-red-500">*</span>
                </label>
                
                {/* Current Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.medical_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add New Tag */}
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={formData.newTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(formData.newTag);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a medical tag..."
                  />
                  <button
                    onClick={() => addTag(formData.newTag)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Tag Suggestions */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Suggested Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {MEDICAL_TAG_SUGGESTIONS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        disabled={formData.medical_tags.includes(tag) || formData.medical_tags.length >= 10}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medical Accuracy Tags */}
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Medical Accuracy Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {MEDICAL_ACCURACY_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        disabled={formData.medical_tags.includes(tag) || formData.medical_tags.length >= 10}
                        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {validationErrors.medical_tags && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.medical_tags}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.medical_tags.length}/10 tags (minimum 1 required)
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || complianceStatus === 'invalid'}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Metadata'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

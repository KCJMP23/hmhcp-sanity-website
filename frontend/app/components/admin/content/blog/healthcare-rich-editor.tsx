'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('HealthcareRichEditor');

interface HealthcareRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function HealthcareRichEditor({
  value,
  onChange,
  placeholder = "Write your healthcare content here...",
  className = ""
}: HealthcareRichEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    logger.debug('Editor content changed', { length: e.target.value.length });
  }, [onChange]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowToolbar(true);
    logger.debug('Editor focused');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setShowToolbar(false);
    logger.debug('Editor blurred');
  };

  const insertMedicalTerm = (term: string) => {
    const textarea = document.getElementById('healthcare-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `<strong>${term}</strong>` + after;
      
      onChange(newText);
      logger.info('Medical term inserted', { term });
    }
  };

  const insertCitation = () => {
    const textarea = document.getElementById('healthcare-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const citation = `[Citation: ${new Date().getFullYear()}]`;
      const newText = before + citation + after;
      
      onChange(newText);
      logger.info('Citation inserted');
    }
  };

  const insertClinicalReference = () => {
    const textarea = document.getElementById('healthcare-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const reference = `[Clinical Reference: Guideline/Protocol]`;
      const newText = before + reference + after;
      
      onChange(newText);
      logger.info('Clinical reference inserted');
    }
  };

  const medicalTerms = [
    'Hypertension',
    'Diabetes Mellitus',
    'Myocardial Infarction',
    'Cerebrovascular Accident',
    'Pneumonia',
    'Sepsis',
    'Hypotension',
    'Tachycardia',
    'Bradycardia',
    'Arrhythmia'
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: showToolbar ? 1 : 0, y: showToolbar ? 0 : -10 }}
        className="absolute top-0 left-0 right-0 z-10 bg-white border border-gray-300 rounded-t-lg p-2 shadow-sm"
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => document.execCommand('bold')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => document.execCommand('italic')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => document.execCommand('underline')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Underline"
            >
              <u>U</u>
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={insertCitation}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              title="Insert Citation"
            >
              Citation
            </button>
            <button
              onClick={insertClinicalReference}
              className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
              title="Insert Clinical Reference"
            >
              Clinical Ref
            </button>
          </div>
        </div>
      </motion.div>

      {/* Editor */}
      <div className="relative">
        <textarea
          id="healthcare-editor"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            isFocused ? 'border-blue-500' : 'border-gray-300'
          }`}
          style={{ minHeight: '200px', paddingTop: showToolbar ? '60px' : '12px' }}
        />
        
        {/* Medical Terms Suggestions */}
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3"
          >
            <h4 className="text-sm font-medium text-gray-900 mb-2">Medical Terms</h4>
            <div className="flex flex-wrap gap-1">
              {medicalTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => insertMedicalTerm(term)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Character Count */}
      <div className="mt-2 text-right">
        <span className="text-xs text-gray-500">
          {value.length} characters
        </span>
      </div>
    </div>
  );
}

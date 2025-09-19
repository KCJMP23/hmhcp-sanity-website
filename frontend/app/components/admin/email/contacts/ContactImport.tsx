'use client';

// Contact Import Component
// Created: 2025-01-27
// Purpose: Import contacts from CSV/Excel with validation and mapping

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import type { EmailContact } from '@/types/email-campaigns';

interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  fieldMapping: Array<{
    contactField: keyof EmailContact;
    csvColumn: string;
    mapped: boolean;
  }>;
  sampleData: EmailContact[];
}

export default function ContactImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    processFile(selectedFile);
  }, []);

  const processFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrorMessage('CSV file must contain at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Create field mapping
      const fieldMapping = [
        { contactField: 'email' as keyof EmailContact, csvColumn: '', mapped: false, label: 'Email', required: true, description: 'Contact email address' },
        { contactField: 'firstName' as keyof EmailContact, csvColumn: '', mapped: false, label: 'First Name', required: true, description: 'Contact first name' },
        { contactField: 'lastName' as keyof EmailContact, csvColumn: '', mapped: false, label: 'Last Name', required: true, description: 'Contact last name' },
        { contactField: 'phone' as keyof EmailContact, csvColumn: '', mapped: false, label: 'Phone', required: false, description: 'Contact phone number' },
        { contactField: 'company' as keyof EmailContact, csvColumn: '', mapped: false, label: 'Company', required: false, description: 'Company name' },
        { contactField: 'tags' as keyof EmailContact, csvColumn: '', mapped: false, label: 'Tags', required: false, description: 'Comma-separated tags' },
      ];

      // Auto-map fields based on header names
      const autoMappedFields = fieldMapping.map(field => {
        const matchingHeader = headers.find(header => 
          header.toLowerCase().includes(field.contactField.toLowerCase()) ||
          header.toLowerCase().includes(field.label.toLowerCase().replace(' ', ''))
        );
        return {
          ...field,
          csvColumn: matchingHeader || '',
          mapped: !!matchingHeader
        };
      });

      // Parse CSV data
      const sampleData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const contact: Partial<EmailContact> = {};
        
        autoMappedFields.forEach(field => {
          if (field.mapped && field.csvColumn) {
            const headerIndex = headers.indexOf(field.csvColumn);
            if (headerIndex !== -1 && values[headerIndex]) {
              contact[field.contactField] = values[headerIndex] as any;
            }
          }
        });
        
        return contact as EmailContact;
      });

      // Validate data
      const validation = validateImportData(lines.slice(1), autoMappedFields);
      
      setImportPreview({
        totalRows: lines.length - 1,
        validRows: validation.validRows,
        invalidRows: validation.invalidRows,
        duplicateRows: validation.duplicateRows,
        fieldMapping: autoMappedFields,
        sampleData
      });
    } catch (error) {
      setErrorMessage('Failed to process CSV file');
      console.error('Error processing file:', error);
    }
  }, []);

  const validateImportData = (dataRows: string[], fieldMapping: any[]) => {
    let validRows = 0;
    let invalidRows = 0;
    let duplicateRows = 0;
    const emails = new Set<string>();

    dataRows.forEach(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      let isValid = true;
      
      // Check required fields
      fieldMapping.forEach(field => {
        if (field.required && field.mapped) {
          const headerIndex = fieldMapping.findIndex(f => f.contactField === field.contactField);
          if (headerIndex !== -1 && values[headerIndex]) {
            if (field.contactField === 'email' && !isValidEmail(values[headerIndex])) {
              isValid = false;
            }
          } else {
            isValid = false;
          }
        }
      });

      if (isValid) {
        const emailField = fieldMapping.find(f => f.contactField === 'email' && f.mapped);
        if (emailField) {
          const emailIndex = fieldMapping.findIndex(f => f.contactField === 'email');
          const email = values[emailIndex];
          if (emails.has(email)) {
            duplicateRows++;
          } else {
            emails.add(email);
            validRows++;
          }
        } else {
          validRows++;
        }
      } else {
        invalidRows++;
      }
    });

    return { validRows, invalidRows, duplicateRows };
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const handleFieldMapping = (fieldKey: keyof EmailContact, csvColumn: string) => {
    if (!importPreview) return;

    const updatedMapping = importPreview.fieldMapping.map(field => {
      if (field.contactField === fieldKey) {
        return { ...field, csvColumn, mapped: !!csvColumn };
      }
      return field;
    });

    setImportPreview({
      ...importPreview,
      fieldMapping: updatedMapping
    });
  };

  const handleImport = async () => {
    if (!file || !importPreview) return;

    setIsProcessing(true);
    setImportStatus('processing');
    setImportProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        // Map CSV columns to contact fields
        const contact: Partial<EmailContact> = {};
        importPreview.fieldMapping.forEach(field => {
          if (field.mapped && field.csvColumn) {
            const headerIndex = headers.indexOf(field.csvColumn);
            if (headerIndex !== -1 && values[headerIndex]) {
              contact[field.contactField] = values[headerIndex] as any;
            }
          }
        });

        // Validate required fields
        const requiredFields = importPreview.fieldMapping.filter(f => f.required);
        const hasAllRequired = requiredFields.every(field => 
          field.mapped && contact[field.contactField]
        );

        if (hasAllRequired) {
          // Here you would save the contact to your database
          console.log('Importing contact:', contact);
        }

        setImportProgress(Math.round((i / (lines.length - 1)) * 100));
      }

      setImportStatus('success');
    } catch (error) {
      setImportStatus('error');
      setErrorMessage('Failed to import contacts');
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'email,firstName,lastName,phone,company,tags\n' +
      'john.doe@example.com,John,Doe,+1234567890,Acme Corp,"lead,customer"\n' +
      'jane.smith@example.com,Jane,Smith,+0987654321,Tech Inc,"prospect"';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
          <p className="text-gray-600">Import contacts from CSV file with field mapping</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Choose CSV file to upload</h3>
                <p className="text-gray-600">Supports CSV files up to 10MB</p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="font-medium">{file.name}</span>
                <Badge variant="outline">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Preview */}
      {importPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Import Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Validation Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importPreview.totalRows}</div>
                <div className="text-sm text-blue-600">Total Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importPreview.validRows}</div>
                <div className="text-sm text-green-600">Valid Rows</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importPreview.invalidRows}</div>
                <div className="text-sm text-red-600">Invalid Rows</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importPreview.duplicateRows}</div>
                <div className="text-sm text-yellow-600">Duplicates</div>
              </div>
            </div>

            {/* Field Mapping */}
            <div className="space-y-4">
              <h4 className="font-medium">Field Mapping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importPreview.fieldMapping.map((field) => {
                  const mapping = importPreview.fieldMapping.find(f => f.contactField === field.contactField);
                  return (
                    <div key={field.contactField} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                        {mapping?.mapped && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </Label>
                      <select
                        value={mapping?.csvColumn || ''}
                        onChange={(e) => handleFieldMapping(field.contactField, e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Select CSV column</option>
                        {importPreview.fieldMapping.map((_, index) => (
                          <option key={index} value={`column_${index}`}>{`Column ${index + 1}`}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-600">{field.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Import Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleImport}
                  disabled={isProcessing || importPreview.validRows === 0}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      Import {importPreview.validRows} Contacts
                    </>
                  )}
                </Button>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2">
                  <Progress value={importProgress} className="w-32" />
                  <span className="text-sm text-gray-600">{importProgress}%</span>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {importStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {importPreview.validRows} contacts!
                </AlertDescription>
              </Alert>
            )}

            {importStatus === 'error' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {importPreview.invalidRows > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {importPreview.invalidRows} rows have invalid data and will be skipped.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
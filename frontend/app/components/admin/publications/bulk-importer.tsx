// BulkImporter Component
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkImportRequest, BulkImportResult, BulkImportError } from '@/types/publications';

interface BulkImporterProps {
  onImport: (request: BulkImportRequest) => Promise<BulkImportResult>;
  onCancel: () => void;
  importStatus?: {
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    message?: string;
  };
}

export function BulkImporter({
  onImport,
  onCancel,
  importStatus = {
    status: 'idle',
    progress: 0,
    message: ''
  }
}: BulkImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState({
    title: 'title',
    abstract: 'abstract',
    authors: 'authors',
    publication_date: 'publication_date',
    journal: 'journal',
    volume: 'volume',
    issue: 'issue',
    pages: 'pages',
    doi: 'doi',
    pubmed_id: 'pubmed_id',
    publication_type: 'publication_type',
    keywords: 'keywords',
    medical_specialty: 'medical_specialty'
  });
  const [options, setOptions] = useState({
    skip_duplicates: true,
    validate_data: true,
    create_missing_authors: true,
    create_missing_topics: false
  });
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    
    // Parse CSV to get headers and preview
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(csvHeaders);
      
      // Generate preview (first 5 rows)
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        csvHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      setPreview(previewData);
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const request: BulkImportRequest = {
      file,
      mapping,
      options
    };

    try {
      await onImport(request);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const getStatusIcon = () => {
    switch (importStatus.status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (importStatus.status) {
      case 'uploading':
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const requiredFields = ['title', 'publication_type'];
  const optionalFields = ['abstract', 'authors', 'publication_date', 'journal', 'volume', 'issue', 'pages', 'doi', 'pubmed_id', 'keywords', 'medical_specialty'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Publications</h1>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium text-gray-900">Choose a file to upload</p>
                  <p className="text-sm text-gray-600">
                    CSV or Excel files supported
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setHeaders([]);
                  }}
                >
                  Remove File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Mapping */}
      {file && headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Field Mapping</CardTitle>
            <p className="text-sm text-gray-600">
              Map your CSV columns to publication fields
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredFields.map(field => (
                <div key={field}>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    {field.replace('_', ' ').toUpperCase()} *
                  </Label>
                  <Select
                    value={mapping[field as keyof typeof mapping]}
                    onValueChange={(value) => setMapping(prev => ({ ...prev, [field]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not mapped</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optionalFields.map(field => (
                <div key={field}>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    {field.replace('_', ' ').toUpperCase()}
                  </Label>
                  <Select
                    value={mapping[field as keyof typeof mapping]}
                    onValueChange={(value) => setMapping(prev => ({ ...prev, [field]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not mapped</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Options */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle>Import Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip_duplicates"
                  checked={options.skip_duplicates}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, skip_duplicates: !!checked }))}
                />
                <Label htmlFor="skip_duplicates">Skip duplicate publications</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate_data"
                  checked={options.validate_data}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, validate_data: !!checked }))}
                />
                <Label htmlFor="validate_data">Validate data before import</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_missing_authors"
                  checked={options.create_missing_authors}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, create_missing_authors: !!checked }))}
                />
                <Label htmlFor="create_missing_authors">Create missing authors automatically</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_missing_topics"
                  checked={options.create_missing_topics}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, create_missing_topics: !!checked }))}
                />
                <Label htmlFor="create_missing_topics">Create missing research topics automatically</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <p className="text-sm text-gray-600">
              First 5 rows of your data
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Status */}
      {importStatus.status !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getStatusIcon()}
              <span className={`ml-2 ${getStatusColor()}`}>
                {importStatus.status === 'uploading' && 'Uploading...'}
                {importStatus.status === 'processing' && 'Processing...'}
                {importStatus.status === 'completed' && 'Import Completed'}
                {importStatus.status === 'error' && 'Import Failed'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={importStatus.progress} className="w-full" />
              {importStatus.message && (
                <p className="text-sm text-gray-600">{importStatus.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <p>Download sample CSV template</p>
          <Button variant="link" className="p-0 h-auto">
            <Download className="h-4 w-4 mr-1" />
            template.csv
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importStatus.status === 'uploading' || importStatus.status === 'processing'}
          >
            {importStatus.status === 'uploading' || importStatus.status === 'processing' ? 'Importing...' : 'Start Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}

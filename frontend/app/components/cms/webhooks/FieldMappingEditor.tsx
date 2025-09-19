'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FieldMapping } from '@/types/webhooks';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

interface FieldMappingEditorProps {
  mapping: Record<string, {
    crm_field: string;
    required?: boolean;
    transform?: string;
    default_value?: string;
  }>;
  onChange: (mapping: Record<string, {
    crm_field: string;
    required?: boolean;
    transform?: string;
    default_value?: string;
  }>) => void;
  provider: string;
}

const FORM_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'message', label: 'Message' },
  { value: 'subject', label: 'Subject' },
  { value: 'service_interest', label: 'Service Interest' },
  { value: 'preferred_contact_method', label: 'Preferred Contact Method' },
  { value: 'best_time_to_contact', label: 'Best Time to Contact' },
  { value: 'referral_source', label: 'Referral Source' }
];

const CRM_FIELDS = {
  hubspot: [
    { value: 'email', label: 'Email' },
    { value: 'firstname', label: 'First Name' },
    { value: 'lastname', label: 'Last Name' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'message', label: 'Message' },
    { value: 'hs_lead_status', label: 'Lead Status' },
    { value: 'leadsource', label: 'Lead Source' }
  ],
  salesforce: [
    { value: 'Email', label: 'Email' },
    { value: 'FirstName', label: 'First Name' },
    { value: 'LastName', label: 'Last Name' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Company', label: 'Company' },
    { value: 'Description', label: 'Description' },
    { value: 'LeadSource', label: 'Lead Source' },
    { value: 'Status', label: 'Status' }
  ],
  make: [
    { value: 'custom', label: 'Custom Field' }
  ],
  custom: [
    { value: 'custom', label: 'Custom Field' }
  ]
};

const TRANSFORMATIONS = [
  { value: '', label: 'None' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'trim', label: 'Trim Whitespace' },
  { value: 'date', label: 'Format as Date' },
  { value: 'number', label: 'Convert to Number' },
  { value: 'boolean', label: 'Convert to Boolean' }
];

export function FieldMappingEditor({ mapping, onChange, provider }: FieldMappingEditorProps) {
  const [newFormField, setNewFormField] = useState('');
  const [newCrmField, setNewCrmField] = useState('');

  const addMapping = () => {
    if (newFormField && newCrmField) {
      const updated = {
        ...mapping,
        [newFormField]: {
          crm_field: newCrmField,
          required: false
        }
      };
      onChange(updated);
      setNewFormField('');
      setNewCrmField('');
    }
  };

  const removeMapping = (formField: string) => {
    const updated = { ...mapping };
    delete updated[formField];
    onChange(updated);
  };

  const updateMapping = (
    formField: string, 
    field: 'crm_field' | 'required' | 'transform' | 'default_value', 
    value: any
  ) => {
    const updated = {
      ...mapping,
      [formField]: {
        ...mapping[formField],
        [field]: value
      }
    };
    onChange(updated);
  };

  const crmFields = CRM_FIELDS[provider as keyof typeof CRM_FIELDS] || CRM_FIELDS.custom;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Field Mappings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Map form fields to CRM fields. Transform data as needed.
        </p>
      </div>

      {/* Existing Mappings */}
      <div className="space-y-3">
        {Object.entries(mapping).map(([formField, config]) => (
          <div key={formField} className="flex items-center gap-3 p-3 border">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
              <div className="col-span-3">
                <Input value={formField} disabled className="font-mono text-sm" />
              </div>
              
              <ArrowRight className="col-span-1 h-4 w-4 text-gray-400" />
              
              <div className="col-span-3">
                <Select
                  value={config.crm_field}
                  onValueChange={(value) => updateMapping(formField, 'crm_field', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {crmFields.map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-3">
                <Select
                  value={config.transform || ''}
                  onValueChange={(value) => updateMapping(formField, 'transform', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Transform" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFORMATIONS.map(transform => (
                      <SelectItem key={transform.value} value={transform.value}>
                        {transform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1 flex items-center">
                <Switch
                  checked={config.required || false}
                  onCheckedChange={(checked) => updateMapping(formField, 'required', checked)}
                />
              </div>
              
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMapping(formField)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Mapping */}
      <div className="flex items-center gap-3 p-3 border-2 border-dashed">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="col-span-3">
            <Select value={newFormField} onValueChange={setNewFormField}>
              <SelectTrigger>
                <SelectValue placeholder="Form Field" />
              </SelectTrigger>
              <SelectContent>
                {FORM_FIELDS.filter(field => !mapping[field.value]).map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ArrowRight className="col-span-1 h-4 w-4 text-gray-400" />
          
          <div className="col-span-3">
            <Select value={newCrmField} onValueChange={setNewCrmField}>
              <SelectTrigger>
                <SelectValue placeholder="CRM Field" />
              </SelectTrigger>
              <SelectContent>
                {crmFields.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-4" />
          
          <div className="col-span-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addMapping}
              disabled={!newFormField || !newCrmField}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        <p>• Required fields will cause the webhook to fail if missing</p>
        <p>• Transformations are applied before sending to the CRM</p>
      </div>
    </div>
  );
}
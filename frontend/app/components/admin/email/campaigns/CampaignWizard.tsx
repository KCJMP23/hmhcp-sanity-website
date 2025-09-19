'use client';

// Campaign Wizard Component
// Created: 2025-01-27
// Purpose: Step-by-step campaign creation with A/B testing

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Users, 
  Mail, 
  Settings, 
  BarChart3,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { 
  EmailCampaign, 
  EmailTemplate, 
  EmailContact, 
  ContactSegmentationRule,
  ABTestConfig 
} from '@/types/email-campaigns';

interface CampaignWizardProps {
  templates: EmailTemplate[];
  contacts: EmailContact[];
  segmentationRules: ContactSegmentationRule[];
  onSave: (campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialCampaign?: Partial<EmailCampaign>;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Campaign name, description, and type',
    icon: <Mail className="h-5 w-5" />,
    completed: false
  },
  {
    id: 'template',
    title: 'Email Template',
    description: 'Select or create email template',
    icon: <Settings className="h-5 w-5" />,
    completed: false
  },
  {
    id: 'audience',
    title: 'Target Audience',
    description: 'Select contacts and segmentation',
    icon: <Target className="h-5 w-5" />,
    completed: false
  },
  {
    id: 'abtest',
    title: 'A/B Testing',
    description: 'Configure A/B test variants',
    icon: <BarChart3 className="h-5 w-5" />,
    completed: false
  },
  {
    id: 'schedule',
    title: 'Schedule & Send',
    description: 'Set timing and delivery options',
    icon: <Clock className="h-5 w-5" />,
    completed: false
  }
];

export default function CampaignWizard({ 
  templates, 
  contacts, 
  segmentationRules, 
  onSave, 
  onCancel,
  initialCampaign 
}: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(WIZARD_STEPS);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campaign form data
  const [campaignData, setCampaignData] = useState({
    name: initialCampaign?.name || '',
    description: initialCampaign?.description || '',
    campaign_type: initialCampaign?.campaign_type || 'newsletter',
    template_id: initialCampaign?.template_id || '',
    subject_line: initialCampaign?.subject_line || '',
    preview_text: initialCampaign?.preview_text || '',
    target_audience: initialCampaign?.target_audience || [],
    segmentation_rules: initialCampaign?.segmentation_rules || [],
    ab_test_config: initialCampaign?.ab_test_config || null,
    scheduled_at: initialCampaign?.scheduled_at || null,
    send_immediately: initialCampaign?.send_immediately || false,
    healthcare_compliance: initialCampaign?.healthcare_compliance || {},
    is_active: initialCampaign?.is_active || true
  });

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [abTestVariants, setAbTestVariants] = useState<Array<{
    id: string;
    name: string;
    subject_line: string;
    template_id: string;
    weight: number;
  }>>([]);

  const updateStepCompletion = useCallback((stepIndex: number, completed: boolean) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed } : step
    ));
  }, []);

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Basic Information
        return !!(campaignData.name && campaignData.campaign_type);
      case 1: // Template
        return !!(campaignData.template_id && campaignData.subject_line);
      case 2: // Audience
        return selectedContacts.size > 0 || campaignData.segmentation_rules.length > 0;
      case 3: // A/B Testing
        return !campaignData.ab_test_config || abTestVariants.length >= 2;
      case 4: // Schedule
        return campaignData.send_immediately || !!campaignData.scheduled_at;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      updateStepCompletion(currentStep, true);
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      setError(null);
    } else {
      setError('Please complete all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) {
      setError('Please complete all required fields before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const finalCampaign = {
        ...campaignData,
        target_audience: Array.from(selectedContacts),
        ab_test_config: campaignData.ab_test_config ? {
          ...campaignData.ab_test_config,
          variants: abTestVariants
        } : null
      };

      await onSave(finalCampaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInformationStep data={campaignData} onChange={setCampaignData} />;
      case 1:
        return <TemplateSelectionStep 
          data={campaignData} 
          templates={templates}
          onChange={setCampaignData} 
        />;
      case 2:
        return <AudienceSelectionStep 
          data={campaignData}
          contacts={contacts}
          segmentationRules={segmentationRules}
          selectedContacts={selectedContacts}
          onContactsChange={setSelectedContacts}
          onChange={setCampaignData}
        />;
      case 3:
        return <ABTestConfigurationStep 
          data={campaignData}
          templates={templates}
          variants={abTestVariants}
          onVariantsChange={setAbTestVariants}
          onChange={setCampaignData}
        />;
      case 4:
        return <ScheduleStep 
          data={campaignData} 
          onChange={setCampaignData} 
        />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Create Email Campaign</h1>
        <p className="text-gray-600">Step-by-step campaign creation with A/B testing</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2
                    ${index <= currentStep 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                    }
                    ${index < currentStep ? 'bg-green-500 border-green-500' : ''}
                  `}>
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-300 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep].icon}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getStepContent()}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function BasicInformationStep({ data, onChange }: { 
  data: any; 
  onChange: (data: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Enter campaign name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign_type">Campaign Type *</Label>
          <Select
            value={data.campaign_type}
            onValueChange={(value) => onChange({ ...data, campaign_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campaign type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
              <SelectItem value="educational">Educational Content</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="compliance">Compliance Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe the purpose of this campaign"
          rows={3}
        />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Choose a descriptive name that will help you identify this campaign later. 
          The campaign type determines which compliance rules apply.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function TemplateSelectionStep({ data, templates, onChange }: { 
  data: any; 
  templates: EmailTemplate[];
  onChange: (data: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select Template *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-colors ${
                data.template_id === template.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onChange({ ...data, template_id: template.id })}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="subject_line">Subject Line *</Label>
          <Input
            id="subject_line"
            value={data.subject_line}
            onChange={(e) => onChange({ ...data, subject_line: e.target.value })}
            placeholder="Enter email subject line"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preview_text">Preview Text</Label>
          <Input
            id="preview_text"
            value={data.preview_text}
            onChange={(e) => onChange({ ...data, preview_text: e.target.value })}
            placeholder="Preview text shown in email clients"
          />
        </div>
      </div>
    </div>
  );
}

function AudienceSelectionStep({ 
  data, 
  contacts, 
  segmentationRules, 
  selectedContacts, 
  onContactsChange, 
  onChange 
}: { 
  data: any; 
  contacts: EmailContact[];
  segmentationRules: ContactSegmentationRule[];
  selectedContacts: Set<string>;
  onContactsChange: (contacts: Set<string>) => void;
  onChange: (data: any) => void; 
}) {
  const [audienceType, setAudienceType] = useState<'manual' | 'segmentation'>('manual');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Audience Selection Method</Label>
        <RadioGroup value={audienceType} onValueChange={setAudienceType}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Manual Selection</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="segmentation" id="segmentation" />
            <Label htmlFor="segmentation">Use Segmentation Rules</Label>
          </div>
        </RadioGroup>
      </div>

      {audienceType === 'manual' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Select Contacts</Label>
            <Badge variant="outline">{selectedContacts.size} selected</Badge>
          </div>
          
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center space-x-2 p-3 border-b border-gray-100 last:border-b-0">
                <Checkbox
                  id={contact.id}
                  checked={selectedContacts.has(contact.id)}
                  onCheckedChange={(checked) => {
                    const newSelection = new Set(selectedContacts);
                    if (checked) {
                      newSelection.add(contact.id);
                    } else {
                      newSelection.delete(contact.id);
                    }
                    onContactsChange(newSelection);
                  }}
                />
                <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{contact.email}</span>
                    <Badge variant="outline" className="text-xs">
                      {contact.contact_type}
                    </Badge>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Label>Select Segmentation Rules</Label>
          <div className="space-y-2">
            {segmentationRules.map((rule) => (
              <div key={rule.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                <Checkbox
                  id={rule.id}
                  checked={data.segmentation_rules.includes(rule.id)}
                  onCheckedChange={(checked) => {
                    const rules = checked
                      ? [...data.segmentation_rules, rule.id]
                      : data.segmentation_rules.filter((id: string) => id !== rule.id);
                    onChange({ ...data, segmentation_rules: rules });
                  }}
                />
                <Label htmlFor={rule.id} className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-gray-600">{rule.description}</div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ABTestConfigurationStep({ 
  data, 
  templates, 
  variants, 
  onVariantsChange, 
  onChange 
}: { 
  data: any; 
  templates: EmailTemplate[];
  variants: any[];
  onVariantsChange: (variants: any[]) => void;
  onChange: (data: any) => void; 
}) {
  const [enableABTest, setEnableABTest] = useState(!!data.ab_test_config);

  const addVariant = () => {
    const newVariant = {
      id: `variant_${variants.length + 1}`,
      name: `Variant ${variants.length + 1}`,
      subject_line: data.subject_line,
      template_id: data.template_id,
      weight: 50
    };
    onVariantsChange([...variants, newVariant]);
  };

  const updateVariant = (index: number, updates: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...updates };
    onVariantsChange(newVariants);
  };

  const removeVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enable_ab_test"
          checked={enableABTest}
          onCheckedChange={(checked) => {
            setEnableABTest(checked);
            if (checked) {
              onChange({
                ...data,
                ab_test_config: {
                  test_name: `${data.name} A/B Test`,
                  test_duration_hours: 24,
                  minimum_sample_size: 1000,
                  success_metric: 'open_rate',
                  confidence_level: 0.95
                }
              });
            } else {
              onChange({ ...data, ab_test_config: null });
              onVariantsChange([]);
            }
          }}
        />
        <Label htmlFor="enable_ab_test">Enable A/B Testing</Label>
      </div>

      {enableABTest && (
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              A/B testing requires at least 1,000 recipients per variant and runs for a minimum of 24 hours.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Test Variants</Label>
              <Button onClick={addVariant} size="sm">
                Add Variant
              </Button>
            </div>

            {variants.map((variant, index) => (
              <Card key={variant.id}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{variant.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input
                          value={variant.subject_line}
                          onChange={(e) => updateVariant(index, { subject_line: e.target.value })}
                          placeholder="Enter subject line"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Select
                          value={variant.template_id}
                          onValueChange={(value) => updateVariant(index, { template_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (%)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={variant.weight}
                        onChange={(e) => updateVariant(index, { weight: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleStep({ data, onChange }: { 
  data: any; 
  onChange: (data: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Send Options</Label>
        <RadioGroup 
          value={data.send_immediately ? 'immediate' : 'scheduled'} 
          onValueChange={(value) => onChange({ 
            ...data, 
            send_immediately: value === 'immediate',
            scheduled_at: value === 'immediate' ? null : data.scheduled_at
          })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="immediate" id="immediate" />
            <Label htmlFor="immediate">Send Immediately</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scheduled" id="scheduled" />
            <Label htmlFor="scheduled">Schedule for Later</Label>
          </div>
        </RadioGroup>
      </div>

      {!data.send_immediately && (
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
          <Input
            id="scheduled_at"
            type="datetime-local"
            value={data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange({ 
              ...data, 
              scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null 
            })}
          />
        </div>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Scheduled campaigns will be sent automatically at the specified time. 
          You can edit or cancel them before they are sent.
        </AlertDescription>
      </Alert>
    </div>
  );
}

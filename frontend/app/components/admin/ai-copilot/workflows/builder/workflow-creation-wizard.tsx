'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Play, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  Zap,
  Shield,
  Users,
  Clock
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'research' | 'content' | 'compliance' | 'review' | 'publish';
  name: string;
  description: string;
  agent: string;
  config: Record<string, any>;
  order: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
}

const WORKFLOW_TYPES = [
  { value: 'content_creation', label: 'Content Creation', description: 'Create healthcare content with AI assistance' },
  { value: 'research_synthesis', label: 'Research Synthesis', description: 'Synthesize medical research and evidence' },
  { value: 'compliance_validation', label: 'Compliance Validation', description: 'Validate healthcare compliance requirements' },
  { value: 'multi_platform_publishing', label: 'Multi-Platform Publishing', description: 'Publish content across multiple platforms' }
];

const AGENT_TYPES = [
  { value: 'research-agent', label: 'Research Agent', description: 'Medical research and evidence gathering' },
  { value: 'content-agent', label: 'Content Agent', description: 'Healthcare content generation' },
  { value: 'medical-accuracy-agent', label: 'Medical Accuracy Agent', description: 'Medical accuracy validation' },
  { value: 'compliance-agent', label: 'Compliance Agent', description: 'Healthcare compliance validation' },
  { value: 'seo-agent', label: 'SEO Agent', description: 'Medical SEO optimization' },
  { value: 'image-agent', label: 'Image Agent', description: 'Medical visualization generation' },
  { value: 'qa-agent', label: 'QA Agent', description: 'Quality assurance validation' }
];

const HEALTHCARE_TOPICS = [
  'Cardiology', 'Oncology', 'Neurology', 'Pediatrics', 'Emergency Medicine',
  'Surgery', 'Internal Medicine', 'Radiology', 'Pathology', 'Pharmacology'
];

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'comprehensive-content-creation',
    name: 'Comprehensive Content Creation',
    description: 'Full workflow for creating healthcare content with research, writing, and compliance validation',
    category: 'content_creation',
    steps: [
      { id: '1', type: 'research', name: 'Research Phase', description: 'Gather medical research and evidence', agent: 'research-agent', config: {}, order: 1 },
      { id: '2', type: 'content', name: 'Content Generation', description: 'Generate healthcare content', agent: 'content-agent', config: {}, order: 2 },
      { id: '3', type: 'compliance', name: 'Compliance Check', description: 'Validate healthcare compliance', agent: 'compliance-agent', config: {}, order: 3 },
      { id: '4', type: 'review', name: 'Medical Review', description: 'Medical accuracy validation', agent: 'medical-accuracy-agent', config: {}, order: 4 }
    ]
  },
  {
    id: 'research-synthesis',
    name: 'Research Synthesis',
    description: 'Synthesize medical research and create evidence-based summaries',
    category: 'research_synthesis',
    steps: [
      { id: '1', type: 'research', name: 'Literature Review', description: 'Comprehensive literature review', agent: 'research-agent', config: {}, order: 1 },
      { id: '2', type: 'content', name: 'Synthesis', description: 'Synthesize findings', agent: 'content-agent', config: {}, order: 2 },
      { id: '3', type: 'compliance', name: 'Evidence Validation', description: 'Validate evidence quality', agent: 'compliance-agent', config: {}, order: 3 }
    ]
  }
];

export function WorkflowCreationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowType, setWorkflowType] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [healthcareTopic, setHealthcareTopic] = useState('');
  const [collaborationLevel, setCollaborationLevel] = useState('standard');
  const [complianceFramework, setComplianceFramework] = useState('hipaa');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSteps, setCustomSteps] = useState<WorkflowStep[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCustomSteps(template.steps);
      setWorkflowType(template.category);
    }
  };

  const addCustomStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type: 'content',
      name: '',
      description: '',
      agent: '',
      config: {},
      order: customSteps.length + 1
    };
    setCustomSteps([...customSteps, newStep]);
  };

  const updateCustomStep = (stepId: string, field: keyof WorkflowStep, value: any) => {
    setCustomSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    );
  };

  const removeCustomStep = (stepId: string) => {
    setCustomSteps(steps => steps.filter(step => step.id !== stepId));
  };

  const handleCreateWorkflow = async () => {
    setIsCreating(true);
    try {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        type: workflowType,
        healthcareTopic,
        collaborationLevel,
        complianceFramework,
        steps: customSteps,
        templateId: selectedTemplate
      };

      const response = await fetch('/api/admin/ai-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });

      if (response.ok) {
        // Reset form
        setCurrentStep(1);
        setWorkflowName('');
        setWorkflowDescription('');
        setHealthcareTopic('');
        setSelectedTemplate('');
        setCustomSteps([]);
        alert('Workflow created successfully!');
      } else {
        throw new Error('Failed to create workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="workflow-type">Workflow Type</Label>
        <Select value={workflowType} onValueChange={setWorkflowType}>
          <SelectTrigger>
            <SelectValue placeholder="Select workflow type" />
          </SelectTrigger>
          <SelectContent>
            {WORKFLOW_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="workflow-name">Workflow Name</Label>
        <Input
          id="workflow-name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Enter workflow name"
        />
      </div>

      <div>
        <Label htmlFor="workflow-description">Description</Label>
        <Textarea
          id="workflow-description"
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          placeholder="Describe what this workflow will do"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="healthcare-topic">Healthcare Topic</Label>
        <Select value={healthcareTopic} onValueChange={setHealthcareTopic}>
          <SelectTrigger>
            <SelectValue placeholder="Select healthcare topic" />
          </SelectTrigger>
          <SelectContent>
            {HEALTHCARE_TOPICS.map((topic) => (
              <SelectItem key={topic} value={topic}>{topic}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="collaboration-level">Agent Collaboration Level</Label>
        <Select value={collaborationLevel} onValueChange={setCollaborationLevel}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard - Basic agent coordination</SelectItem>
            <SelectItem value="intensive">Intensive - Advanced agent collaboration</SelectItem>
            <SelectItem value="expert_review_required">Expert Review Required - Human oversight needed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="compliance-framework">Compliance Framework</Label>
        <Select value={complianceFramework} onValueChange={setComplianceFramework}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hipaa">HIPAA - Health Insurance Portability and Accountability Act</SelectItem>
            <SelectItem value="fda_advertising">FDA Advertising - Food and Drug Administration guidelines</SelectItem>
            <SelectItem value="fhir_compliance">FHIR Compliance - Fast Healthcare Interoperability Resources</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORKFLOW_TEMPLATES.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-colors ${
                selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {template.steps.map((step) => (
                    <Badge key={step.id} variant="secondary" className="text-xs">
                      {step.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Steps</h3>
        <div className="space-y-4">
          {customSteps.map((step) => (
            <Card key={step.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Step {step.order}</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeCustomStep(step.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Step Name</Label>
                    <Input
                      value={step.name}
                      onChange={(e) => updateCustomStep(step.id, 'name', e.target.value)}
                      placeholder="Enter step name"
                    />
                  </div>
                  <div>
                    <Label>Agent</Label>
                    <Select 
                      value={step.agent} 
                      onValueChange={(value) => updateCustomStep(step.id, 'agent', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENT_TYPES.map((agent) => (
                          <SelectItem key={agent.value} value={agent.value}>
                            {agent.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateCustomStep(step.id, 'description', e.target.value)}
                      placeholder="Describe what this step will do"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={addCustomStep} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Step
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Summary</CardTitle>
          <CardDescription>Review your workflow configuration before creating</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-gray-600">{workflowName || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Type</Label>
              <p className="text-sm text-gray-600">{workflowType || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Healthcare Topic</Label>
              <p className="text-sm text-gray-600">{healthcareTopic || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Collaboration Level</Label>
              <p className="text-sm text-gray-600 capitalize">{collaborationLevel}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Compliance Framework</Label>
              <p className="text-sm text-gray-600 uppercase">{complianceFramework}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Steps</Label>
              <p className="text-sm text-gray-600">{customSteps.length} steps configured</p>
            </div>
          </div>
          
          {customSteps.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Workflow Steps</Label>
              <div className="mt-2 space-y-2">
                {customSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{index + 1}.</span>
                    <span>{step.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {step.agent}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Create New AI Workflow
          </CardTitle>
          <CardDescription>
            Configure a new AI workflow with step-by-step guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreateWorkflow}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Create Workflow
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

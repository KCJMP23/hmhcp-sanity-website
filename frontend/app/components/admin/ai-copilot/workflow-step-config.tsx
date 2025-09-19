'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Trash2,
  Copy,
  Settings,
  Code,
  Database,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  Template,
  FileCheck,
  Lightbulb,
  Star,
  Clock,
  DollarSign,
  User,
  BookOpen
} from 'lucide-react';
import type { WorkflowNode, AgentType } from '@/types/ai/workflows';

interface WorkflowStepConfigProps {
  node: WorkflowNode;
  onUpdate: (node: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (node: WorkflowNode) => void;
}

interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Record<string, any>;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedCost?: number;
  author?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

const AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  research: ['Web Search', 'Data Extraction', 'Source Validation', 'Citation Management'],
  content: ['Text Generation', 'Content Structuring', 'Tone Adjustment', 'SEO Optimization'],
  medical_accuracy: ['Medical Validation', 'Drug Interaction Check', 'Terminology Verification', 'Clinical Guidelines'],
  compliance: ['HIPAA Validation', 'Legal Review', 'Regulatory Check', 'Audit Trail'],
  seo: ['Keyword Analysis', 'Meta Generation', 'Schema Markup', 'Link Building'],
  image: ['Image Generation', 'Alt Text Creation', 'Image Optimization', 'Medical Diagrams'],
  social: ['Social Copy', 'Hashtag Generation', 'Platform Optimization', 'Engagement Analysis'],
  publishing: ['Format Conversion', 'Distribution', 'Version Control', 'Publishing Schedule'],
  workflow: ['Orchestration', 'Task Routing', 'Error Handling', 'Monitoring'],
  qa: ['Quality Check', 'Fact Verification', 'Consistency Review', 'Error Detection']
};

export function WorkflowStepConfig({
  node,
  onUpdate,
  onDelete,
  onDuplicate
}: WorkflowStepConfigProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [variables, setVariables] = useState<Array<{ key: string; value: string }>>(
    node.data.config?.variables || []
  );
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [retryConfig, setRetryConfig] = useState({
    enabled: node.data.config?.retry?.enabled || false,
    maxAttempts: node.data.config?.retry?.maxAttempts || 3,
    backoffMultiplier: node.data.config?.retry?.backoffMultiplier || 2,
    initialDelay: node.data.config?.retry?.initialDelay || 1000
  });

  // Load templates on mount
  useEffect(() => {
    loadConfigTemplates();
  }, []);

  // Validate configuration on changes
  useEffect(() => {
    validateConfiguration();
  }, [node.data.config]);

  const loadConfigTemplates = () => {
    const mockTemplates: ConfigTemplate[] = [
      {
        id: 'content-seo-optimized',
        name: 'SEO-Optimized Content Generation',
        description: 'Generate high-quality, SEO-optimized content with proper keyword density and structure.',
        category: 'Content Creation',
        config: {
          systemPrompt: 'You are an expert content writer specializing in SEO-optimized content. Create engaging, informative content that ranks well in search engines while providing genuine value to readers.',
          temperature: 0.7,
          maxTokens: 2000,
          model: 'gpt-4',
          seoKeywords: 'healthcare, medical technology, patient care',
          targetAudience: 'healthcare professionals',
          contentLength: 'medium'
        },
        tags: ['seo', 'content', 'healthcare'],
        difficulty: 'intermediate',
        estimatedCost: 0.08,
        author: 'HMHCP Team'
      },
      {
        id: 'medical-accuracy-review',
        name: 'Medical Accuracy Review',
        description: 'Comprehensive medical accuracy validation with citation verification and clinical guideline compliance.',
        category: 'Quality Assurance',
        config: {
          systemPrompt: 'You are a medical expert reviewer. Verify the accuracy of medical information, check citations, and ensure compliance with current clinical guidelines and best practices.',
          temperature: 0.2,
          maxTokens: 1500,
          model: 'gpt-4',
          checkCitations: true,
          verifyGuidelines: true,
          requireEvidence: 'high'
        },
        tags: ['medical', 'accuracy', 'compliance'],
        difficulty: 'advanced',
        estimatedCost: 0.12,
        author: 'Medical Team'
      },
      {
        id: 'hipaa-compliance-check',
        name: 'HIPAA Compliance Validation',
        description: 'Automated HIPAA compliance checking for healthcare content and data processing.',
        category: 'Compliance',
        config: {
          systemPrompt: 'Review content for HIPAA compliance. Identify any potential violations, suggest redactions, and ensure proper handling of protected health information.',
          temperature: 0.1,
          maxTokens: 1000,
          model: 'gpt-4',
          hipaaCompliant: true,
          auditTrail: true,
          encryptData: true,
          dataRetention: '7-years'
        },
        tags: ['hipaa', 'compliance', 'security'],
        difficulty: 'advanced',
        estimatedCost: 0.15,
        author: 'Compliance Team'
      },
      {
        id: 'simple-text-processing',
        name: 'Simple Text Processing',
        description: 'Basic text processing and transformation for simple automation tasks.',
        category: 'Text Processing',
        config: {
          systemPrompt: 'Process the provided text according to the specified requirements. Focus on clarity and accuracy.',
          temperature: 0.5,
          maxTokens: 500,
          model: 'gpt-3.5-turbo',
          outputFormat: 'plain'
        },
        tags: ['text', 'processing', 'basic'],
        difficulty: 'beginner',
        estimatedCost: 0.02,
        author: 'HMHCP Team'
      }
    ];
    setTemplates(mockTemplates);
  };

  const validateConfiguration = async () => {
    setIsValidating(true);
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // Validate system prompt
    if (node.type === 'agent' && (!node.data.config?.systemPrompt || node.data.config.systemPrompt.length < 10)) {
      errors.push({
        field: 'systemPrompt',
        message: 'System prompt is required and should be at least 10 characters long',
        severity: 'error'
      });
    }
    
    // Validate temperature
    if (node.data.config?.temperature > 0.9) {
      warnings.push({
        field: 'temperature',
        message: 'High temperature may produce inconsistent results',
        suggestion: 'Consider using a temperature between 0.3 and 0.7 for more consistent outputs'
      });
    }
    
    // Validate max tokens
    if (node.data.config?.maxTokens > 3000) {
      warnings.push({
        field: 'maxTokens',
        message: 'High token count may increase costs significantly',
        suggestion: 'Consider if you really need more than 3000 tokens for this task'
      });
    }
    
    // Add suggestions based on node type
    if (node.type === 'agent' && node.data.agentType === 'medical-accuracy-agent') {
      if (!node.data.config?.hipaaCompliant) {
        suggestions.push('Enable HIPAA compliance for medical content processing');
      }
      if (!node.data.config?.auditTrail) {
        suggestions.push('Enable audit trail for better compliance tracking');
      }
    }
    
    if (node.data.config?.model === 'gpt-4' && !node.data.config?.costLimit) {
      suggestions.push('Consider setting a cost limit when using GPT-4 to control expenses');
    }
    
    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    });
    
    setIsValidating(false);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      updateNodeConfig(template.config);
      setSelectedTemplate(templateId);
      setShowTemplateDialog(false);
    }
  };

  const updateNodeConfig = (updates: any) => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          ...updates
        }
      }
    });
  };

  const addVariable = () => {
    const newVariables = [...variables, { key: '', value: '' }];
    setVariables(newVariables);
    updateNodeConfig({ variables: newVariables });
  };

  const updateVariable = (index: number, field: 'key' | 'value', value: string) => {
    const newVariables = [...variables];
    newVariables[index][field] = value;
    setVariables(newVariables);
    updateNodeConfig({ variables: newVariables });
  };

  const removeVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    setVariables(newVariables);
    updateNodeConfig({ variables: newVariables });
  };

  return (
    <>
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Step Configuration</CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTemplateDialog(true)}
              title="Apply Template"
            >
              <Template className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicate(node)}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(node.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{node.type}</Badge>
          {node.data.agentType && <Badge>{node.data.agentType}</Badge>}
          <Badge variant="secondary" className="text-xs">
            {node.id}
          </Badge>
          {validation && (
            <Badge 
              variant={validation.isValid ? "secondary" : "destructive"}
              className="text-xs"
            >
              {isValidating ? (
                <>Validating...</>
              ) : validation.isValid ? (
                <><CheckCircle className="h-3 w-3 mr-1" />Valid</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" />{validation.errors.length} errors</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Validation Results */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
          <div className="space-y-2 mb-4">
            {validation.errors.map((error, idx) => (
              <div key={`error-${idx}`} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error in {error.field}</p>
                  <p className="text-sm text-red-600">{error.message}</p>
                </div>
              </div>
            ))}
            {validation.warnings.map((warning, idx) => (
              <div key={`warning-${idx}`} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Warning in {warning.field}</p>
                  <p className="text-sm text-yellow-600">{warning.message}</p>
                  {warning.suggestion && (
                    <p className="text-sm text-yellow-500 mt-1">{warning.suggestion}</p>
                  )}
                </div>
              </div>
            ))}
            {validation.suggestions.map((suggestion, idx) => (
              <div key={`suggestion-${idx}`} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Suggestion</p>
                  <p className="text-sm text-blue-600">{suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="monitoring">Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="node-name">Step Name</Label>
              <Input
                id="node-name"
                value={node.data.label}
                onChange={(e) => onUpdate({
                  ...node,
                  data: { ...node.data, label: e.target.value }
                })}
                placeholder="Enter step name"
              />
            </div>

            <div>
              <Label htmlFor="node-description">Description</Label>
              <Textarea
                id="node-description"
                value={node.data.description || ''}
                onChange={(e) => onUpdate({
                  ...node,
                  data: { ...node.data, description: e.target.value }
                })}
                placeholder="Describe what this step does"
                rows={3}
              />
            </div>

            {node.type === 'agent' && node.agent && (
              <div>
                <Label>Agent Capabilities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AGENT_CAPABILITIES[node.agent]?.map(capability => (
                    <Badge key={capability} variant="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            {node.type === 'agent' && (
              <>
                <div>
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={node.data.config?.systemPrompt || ''}
                    onChange={(e) => updateNodeConfig({ systemPrompt: e.target.value })}
                    placeholder="Enter system prompt for this agent"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature">
                      Temperature: {node.data.config?.temperature || 0.7}
                    </Label>
                    <Slider
                      id="temperature"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[node.data.config?.temperature || 0.7]}
                      onValueChange={([value]) => updateNodeConfig({ temperature: value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      min={100}
                      max={4000}
                      step={100}
                      value={node.data.config?.maxTokens || 1000}
                      onChange={(e) => updateNodeConfig({ maxTokens: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="model">AI Model</Label>
                  <Select
                    value={node.data.config?.model || 'gpt-4'}
                    onValueChange={(value) => updateNodeConfig({ model: value })}
                  >
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                      <SelectItem value="claude-2">Claude 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {node.type === 'condition' && (
              <>
                <div>
                  <Label htmlFor="condition-expr">Condition Expression</Label>
                  <Input
                    id="condition-expr"
                    value={node.data.config?.expression || ''}
                    onChange={(e) => updateNodeConfig({ expression: e.target.value })}
                    placeholder="e.g., result.score > 0.8"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="true-label">True Branch Label</Label>
                    <Input
                      id="true-label"
                      value={node.data.config?.trueLabel || 'Success'}
                      onChange={(e) => updateNodeConfig({ trueLabel: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="false-label">False Branch Label</Label>
                    <Input
                      id="false-label"
                      value={node.data.config?.falseLabel || 'Failure'}
                      onChange={(e) => updateNodeConfig({ falseLabel: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {node.type === 'loop' && (
              <>
                <div>
                  <Label htmlFor="max-iterations">Max Iterations</Label>
                  <Input
                    id="max-iterations"
                    type="number"
                    value={node.data.config?.maxIterations || 10}
                    onChange={(e) => updateNodeConfig({ maxIterations: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="break-condition">Break Condition</Label>
                  <Input
                    id="break-condition"
                    value={node.data.config?.breakCondition || ''}
                    onChange={(e) => updateNodeConfig({ breakCondition: e.target.value })}
                    placeholder="e.g., result.complete === true"
                    className="font-mono"
                  />
                </div>
              </>
            )}

            {node.type === 'delay' && (
              <div>
                <Label htmlFor="delay-duration">Delay Duration (seconds)</Label>
                <Input
                  id="delay-duration"
                  type="number"
                  value={node.data.config?.delay || 60}
                  onChange={(e) => updateNodeConfig({ delay: parseInt(e.target.value) })}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="variables">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Variables ({variables.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Key"
                        value={variable.key}
                        onChange={(e) => updateVariable(index, 'key', e.target.value)}
                      />
                      <Input
                        placeholder="Value"
                        value={variable.value}
                        onChange={(e) => updateVariable(index, 'value', e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeVariable(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addVariable}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variable
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="retry">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Retry Configuration
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="retry-enabled">Enable Retry</Label>
                    <Switch
                      id="retry-enabled"
                      checked={retryConfig.enabled}
                      onCheckedChange={(checked) => {
                        const config = { ...retryConfig, enabled: checked };
                        setRetryConfig(config);
                        updateNodeConfig({ retry: config });
                      }}
                    />
                  </div>

                  {retryConfig.enabled && (
                    <>
                      <div>
                        <Label htmlFor="max-attempts">Max Attempts</Label>
                        <Input
                          id="max-attempts"
                          type="number"
                          min={1}
                          max={10}
                          value={retryConfig.maxAttempts}
                          onChange={(e) => {
                            const config = { ...retryConfig, maxAttempts: parseInt(e.target.value) };
                            setRetryConfig(config);
                            updateNodeConfig({ retry: config });
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="initial-delay">Initial Delay (ms)</Label>
                        <Input
                          id="initial-delay"
                          type="number"
                          min={100}
                          max={10000}
                          step={100}
                          value={retryConfig.initialDelay}
                          onChange={(e) => {
                            const config = { ...retryConfig, initialDelay: parseInt(e.target.value) };
                            setRetryConfig(config);
                            updateNodeConfig({ retry: config });
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="backoff-multiplier">
                          Backoff Multiplier: {retryConfig.backoffMultiplier}x
                        </Label>
                        <Slider
                          id="backoff-multiplier"
                          min={1}
                          max={5}
                          step={0.5}
                          value={[retryConfig.backoffMultiplier]}
                          onValueChange={([value]) => {
                            const config = { ...retryConfig, backoffMultiplier: value };
                            setRetryConfig(config);
                            updateNodeConfig({ retry: config });
                          }}
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="security">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security & Compliance
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hipaa-compliant">HIPAA Compliant</Label>
                    <Switch
                      id="hipaa-compliant"
                      checked={node.data.config?.hipaaCompliant || false}
                      onCheckedChange={(checked) => updateNodeConfig({ hipaaCompliant: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="audit-trail">Enable Audit Trail</Label>
                    <Switch
                      id="audit-trail"
                      checked={node.data.config?.auditTrail || false}
                      onCheckedChange={(checked) => updateNodeConfig({ auditTrail: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="encrypt-data">Encrypt Data</Label>
                    <Switch
                      id="encrypt-data"
                      checked={node.data.config?.encryptData || false}
                      onCheckedChange={(checked) => updateNodeConfig({ encryptData: checked })}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div>
              <Label>Performance Thresholds</Label>
              <div className="space-y-3 mt-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <span className="text-sm text-muted-foreground">
                      {node.data.config?.timeout || 300}s
                    </span>
                  </div>
                  <Slider
                    id="timeout"
                    min={10}
                    max={600}
                    step={10}
                    value={[node.data.config?.timeout || 300]}
                    onValueChange={([value]) => updateNodeConfig({ timeout: value })}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="cost-limit">Cost Limit ($)</Label>
                    <span className="text-sm text-muted-foreground">
                      ${node.data.config?.costLimit || 1.0}
                    </span>
                  </div>
                  <Slider
                    id="cost-limit"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={[node.data.config?.costLimit || 1.0]}
                    onValueChange={([value]) => updateNodeConfig({ costLimit: value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Alert Configuration</Label>
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="alert-on-error">Alert on Error</Label>
                  <Switch
                    id="alert-on-error"
                    checked={node.data.config?.alertOnError || false}
                    onCheckedChange={(checked) => updateNodeConfig({ alertOnError: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="alert-on-timeout">Alert on Timeout</Label>
                  <Switch
                    id="alert-on-timeout"
                    checked={node.data.config?.alertOnTimeout || false}
                    onCheckedChange={(checked) => updateNodeConfig({ alertOnTimeout: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="alert-on-cost">Alert on Cost Overrun</Label>
                  <Switch
                    id="alert-on-cost"
                    checked={node.data.config?.alertOnCost || false}
                    onCheckedChange={(checked) => updateNodeConfig({ alertOnCost: checked })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
              <Input
                id="webhook-url"
                type="url"
                value={node.data.config?.webhookUrl || ''}
                onChange={(e) => updateNodeConfig({ webhookUrl: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    
    {/* Template Selection Dialog */}
    <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Template className="w-5 h-5" />
            Configuration Templates
          </DialogTitle>
          <DialogDescription>
            Choose from pre-built configuration templates to quickly set up your workflow step
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {templates
            .filter(template => 
              node.type === 'agent' || 
              template.category === 'General' ||
              (node.type === 'condition' && template.category === 'Logic') ||
              (node.type === 'loop' && template.category === 'Control')
            )
            .map(template => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge 
                        variant={
                          template.difficulty === 'beginner' ? 'secondary' :
                          template.difficulty === 'intermediate' ? 'default' :
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {template.difficulty}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {template.category}
                      </div>
                      {template.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${template.estimatedCost.toFixed(3)}
                        </div>
                      )}
                      {template.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {template.author}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {templates.length} templates available
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowTemplateDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTemplate && applyTemplate(selectedTemplate)}
              disabled={!selectedTemplate}
            >
              Apply Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
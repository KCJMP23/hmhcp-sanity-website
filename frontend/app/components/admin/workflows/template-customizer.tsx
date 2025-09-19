'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Download, Upload, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WorkflowTemplate, TemplateParameter, TemplateDependency } from '@/lib/workflows/template-manager';
import { WorkflowDefinition } from '@/types/workflows/visual-builder';
import { cn } from '@/lib/utils';

interface TemplateCustomizerProps {
  template: WorkflowTemplate;
  onSave: (customizedTemplate: WorkflowTemplate) => void;
  onCancel: () => void;
  className?: string;
}

export function TemplateCustomizer({ template, onSave, onCancel, className }: TemplateCustomizerProps) {
  const [customizedTemplate, setCustomizedTemplate] = useState<WorkflowTemplate>(template);
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize parameter values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    template.parameters.forEach(param => {
      initialValues[param.name] = param.defaultValue;
    });
    setParameterValues(initialValues);
  }, [template]);

  // Validate template
  useEffect(() => {
    validateTemplate();
  }, [customizedTemplate, parameterValues]);

  const validateTemplate = () => {
    const errors: Record<string, string> = {};
    let valid = true;

    // Validate required parameters
    template.parameters.forEach(param => {
      if (param.required && (parameterValues[param.name] === undefined || parameterValues[param.name] === '')) {
        errors[param.name] = `${param.name} is required`;
        valid = false;
      }

      // Validate parameter values
      if (parameterValues[param.name] !== undefined) {
        const value = parameterValues[param.name];
        
        if (param.validation) {
          if (param.validation.minLength && typeof value === 'string' && value.length < param.validation.minLength) {
            errors[param.name] = `Minimum length is ${param.validation.minLength}`;
            valid = false;
          }
          
          if (param.validation.maxLength && typeof value === 'string' && value.length > param.validation.maxLength) {
            errors[param.name] = `Maximum length is ${param.validation.maxLength}`;
            valid = false;
          }
          
          if (param.validation.min && typeof value === 'number' && value < param.validation.min) {
            errors[param.name] = `Minimum value is ${param.validation.min}`;
            valid = false;
          }
          
          if (param.validation.max && typeof value === 'number' && value > param.validation.max) {
            errors[param.name] = `Maximum value is ${param.validation.max}`;
            valid = false;
          }
          
          if (param.validation.enum && !param.validation.enum.includes(value)) {
            errors[param.name] = `Value must be one of: ${param.validation.enum.join(', ')}`;
            valid = false;
          }
        }
      }
    });

    setValidationErrors(errors);
    setIsValid(valid);
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameterValues(prev => ({
      ...prev,
      [paramName]: value
    }));
    setHasChanges(true);
  };

  const handleTemplateFieldChange = (field: keyof WorkflowTemplate, value: any) => {
    setCustomizedTemplate(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!isValid) return;

    // Apply parameter values to workflow definition
    const updatedWorkflow = applyParametersToWorkflow(customizedTemplate.workflowDefinition, parameterValues);
    
    const finalTemplate: WorkflowTemplate = {
      ...customizedTemplate,
      workflowDefinition: updatedWorkflow,
      updatedAt: new Date()
    };

    onSave(finalTemplate);
  };

  const handleReset = () => {
    setCustomizedTemplate(template);
    setParameterValues({});
    setHasChanges(false);
  };

  const applyParametersToWorkflow = (workflow: WorkflowDefinition, params: Record<string, any>): WorkflowDefinition => {
    // In a real implementation, this would apply parameter values to the workflow
    // For now, we'll return the workflow as-is
    return workflow;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customize Template</h2>
          <p className="text-muted-foreground">
            Configure parameters and customize the workflow template
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || !hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Validation Alert */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the validation errors below before saving.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="parameters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Parameters</CardTitle>
              <CardDescription>
                Configure the parameters that will be used when executing this workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {template.parameters.map(param => (
                <div key={param.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={param.name} className="text-sm font-medium">
                      {param.name}
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {param.type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{param.description}</p>
                  
                  {param.type === 'string' && (
                    <Input
                      id={param.name}
                      value={parameterValues[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={param.defaultValue?.toString() || ''}
                      className={cn(
                        validationErrors[param.name] && 'border-red-500'
                      )}
                    />
                  )}
                  
                  {param.type === 'number' && (
                    <Input
                      id={param.name}
                      type="number"
                      value={parameterValues[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                      placeholder={param.defaultValue?.toString() || ''}
                      className={cn(
                        validationErrors[param.name] && 'border-red-500'
                      )}
                    />
                  )}
                  
                  {param.type === 'boolean' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={param.name}
                        checked={parameterValues[param.name] || false}
                        onCheckedChange={(checked) => handleParameterChange(param.name, checked)}
                      />
                      <Label htmlFor={param.name} className="text-sm">
                        {param.description}
                      </Label>
                    </div>
                  )}
                  
                  {param.type === 'select' && param.options && (
                    <Select
                      value={parameterValues[param.name] || param.defaultValue}
                      onValueChange={(value) => handleParameterChange(param.name, value)}
                    >
                      <SelectTrigger className={cn(
                        validationErrors[param.name] && 'border-red-500'
                      )}>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {param.type === 'textarea' && (
                    <Textarea
                      id={param.name}
                      value={parameterValues[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={param.defaultValue?.toString() || ''}
                      className={cn(
                        validationErrors[param.name] && 'border-red-500'
                      )}
                    />
                  )}
                  
                  {validationErrors[param.name] && (
                    <p className="text-sm text-red-500">{validationErrors[param.name]}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Configuration</CardTitle>
              <CardDescription>
                Modify the workflow structure and node configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name" className="text-sm font-medium">
                    Workflow Name
                  </Label>
                  <Input
                    id="workflow-name"
                    value={customizedTemplate.name}
                    onChange={(e) => handleTemplateFieldChange('name', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="workflow-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="workflow-description"
                    value={customizedTemplate.description}
                    onChange={(e) => handleTemplateFieldChange('description', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category
                    </Label>
                    <Select
                      value={customizedTemplate.category}
                      onValueChange={(value) => handleTemplateFieldChange('category', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_creation">Content Creation</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="patient_care">Patient Care</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="quality_assurance">Quality Assurance</SelectItem>
                        <SelectItem value="data_analysis">Data Analysis</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="compliance-level" className="text-sm font-medium">
                      Compliance Level
                    </Label>
                    <Select
                      value={customizedTemplate.healthcareComplianceLevel}
                      onValueChange={(value) => handleTemplateFieldChange('healthcareComplianceLevel', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="hipaa">HIPAA</SelectItem>
                        <SelectItem value="fda">FDA</SelectItem>
                        <SelectItem value="iso27001">ISO 27001</SelectItem>
                        <SelectItem value="soc2">SOC 2</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    value={customizedTemplate.tags.join(', ')}
                    onChange={(e) => handleTemplateFieldChange('tags', e.target.value.split(',').map(t => t.trim()))}
                    placeholder="Enter tags separated by commas"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Metadata</CardTitle>
              <CardDescription>
                Configure template metadata and documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version" className="text-sm font-medium">
                    Version
                  </Label>
                  <Input
                    id="version"
                    value={customizedTemplate.version}
                    onChange={(e) => handleTemplateFieldChange('version', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="author" className="text-sm font-medium">
                    Author
                  </Label>
                  <Input
                    id="author"
                    value={customizedTemplate.author}
                    onChange={(e) => handleTemplateFieldChange('author', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="documentation" className="text-sm font-medium">
                  Documentation URL
                </Label>
                <Input
                  id="documentation"
                  value={customizedTemplate.documentation || ''}
                  onChange={(e) => handleTemplateFieldChange('documentation', e.target.value)}
                  placeholder="https://docs.example.com/template"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-public"
                    checked={customizedTemplate.isPublic}
                    onCheckedChange={(checked) => handleTemplateFieldChange('isPublic', checked)}
                  />
                  <Label htmlFor="is-public" className="text-sm">
                    Make this template public
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-featured"
                    checked={customizedTemplate.isFeatured}
                    onCheckedChange={(checked) => handleTemplateFieldChange('isFeatured', checked)}
                  />
                  <Label htmlFor="is-featured" className="text-sm">
                    Feature this template
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Dependencies</CardTitle>
              <CardDescription>
                Manage required plugins, services, and libraries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {template.dependencies.length > 0 ? (
                <div className="space-y-3">
                  {template.dependencies.map(dep => (
                    <div key={dep.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{dep.name}</h4>
                          <Badge variant={dep.required ? "destructive" : "secondary"}>
                            {dep.required ? "Required" : "Optional"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{dep.description}</p>
                        <p className="text-xs text-muted-foreground">Version: {dep.version}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{dep.type}</Badge>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No dependencies required for this template</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/50">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm">
            {isValid ? 'Template is valid' : 'Please fix validation errors'}
          </span>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Unsaved changes</span>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={!isValid}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

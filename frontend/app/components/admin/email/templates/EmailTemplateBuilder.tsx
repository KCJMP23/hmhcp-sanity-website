'use client';

// Email Template Builder Component
// Created: 2025-01-27
// Purpose: Drag-and-drop email template designer with healthcare compliance validation

import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Eye, 
  Code, 
  Smartphone, 
  Monitor, 
  Tablet,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Move,
  Copy
} from 'lucide-react';
import type { 
  EmailTemplate, 
  EmailTemplateDefinition, 
  EmailContentBlock,
  ComplianceViolation 
} from '@/types/email-campaigns';

interface EmailTemplateBuilderProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  isSaving?: boolean;
}

interface DragItem {
  type: string;
  id: string;
  index: number;
}

const CONTENT_BLOCKS = [
  { type: 'text', label: 'Text Block', icon: '📝' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'button', label: 'Button', icon: '🔘' },
  { type: 'divider', label: 'Divider', icon: '➖' },
  { type: 'social_links', label: 'Social Links', icon: '🔗' }
];

export default function EmailTemplateBuilder({ 
  template, 
  onSave, 
  onPreview, 
  isSaving = false 
}: EmailTemplateBuilderProps) {
  const [templateData, setTemplateData] = useState<EmailTemplate>(template || {
    id: '',
    name: '',
    description: '',
    category: 'newsletter',
    template_definition: {
      subject: '',
      html_content: '',
      text_content: '',
      personalization_fields: [],
      content_blocks: [],
      footer_config: {
        unsubscribe_link: true,
        company_info: true,
        compliance_text: true,
        social_links: true
      },
      header_config: {
        company_name: 'HM Healthcare Partners',
        logo_url: '',
        navigation_links: []
      }
    },
    healthcare_compliance: {
      can_spam_compliant: false,
      fda_advertising_compliant: false,
      hipaa_compliant: false,
      required_disclaimers: [],
      consent_required: true,
      audit_trail_enabled: true
    },
    target_audience: [],
    is_active: true,
    created_by: '',
    created_at: '',
    updated_at: ''
  });

  const [complianceViolations, setComplianceViolations] = useState<ComplianceViolation[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'design' | 'code' | 'preview'>('design');

  // Update template data
  const updateTemplate = useCallback((updates: Partial<EmailTemplate>) => {
    setTemplateData(prev => ({ ...prev, ...updates }));
  }, []);

  // Update template definition
  const updateTemplateDefinition = useCallback((updates: Partial<EmailTemplateDefinition>) => {
    setTemplateData(prev => ({
      ...prev,
      template_definition: { ...prev.template_definition, ...updates }
    }));
  }, []);

  // Add content block
  const addContentBlock = useCallback((type: string) => {
    const newBlock: EmailContentBlock = {
      id: `block_${Date.now()}`,
      type: type as any,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
      position: templateData.template_definition.content_blocks.length
    };

    updateTemplateDefinition({
      content_blocks: [...templateData.template_definition.content_blocks, newBlock]
    });
  }, [templateData.template_definition.content_blocks, updateTemplateDefinition]);

  // Move content block
  const moveContentBlock = useCallback((dragIndex: number, hoverIndex: number) => {
    const blocks = [...templateData.template_definition.content_blocks];
    const draggedBlock = blocks[dragIndex];
    blocks.splice(dragIndex, 1);
    blocks.splice(hoverIndex, 0, draggedBlock);
    
    // Update positions
    blocks.forEach((block, index) => {
      block.position = index;
    });

    updateTemplateDefinition({ content_blocks: blocks });
  }, [templateData.template_definition.content_blocks, updateTemplateDefinition]);

  // Update content block
  const updateContentBlock = useCallback((blockId: string, updates: Partial<EmailContentBlock>) => {
    const blocks = templateData.template_definition.content_blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    updateTemplateDefinition({ content_blocks: blocks });
  }, [templateData.template_definition.content_blocks, updateTemplateDefinition]);

  // Remove content block
  const removeContentBlock = useCallback((blockId: string) => {
    const blocks = templateData.template_definition.content_blocks.filter(
      block => block.id !== blockId
    );
    updateTemplateDefinition({ content_blocks: blocks });
  }, [templateData.template_definition.content_blocks, updateTemplateDefinition]);

  // Validate compliance
  const validateCompliance = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/email/templates/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: templateData.template_definition.html_content,
          template: templateData
        })
      });

      const result = await response.json();
      if (result.success) {
        setComplianceViolations(result.data.violations);
        return result.data.isCompliant;
      }
    } catch (error) {
      console.error('Compliance validation failed:', error);
    }
    return false;
  }, [templateData]);

  // Generate HTML content
  const generateHTMLContent = useCallback(() => {
    const { header_config, content_blocks, footer_config } = templateData.template_definition;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${templateData.template_definition.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8fafc; padding: 20px; font-size: 12px; color: #64748b; }
          .unsubscribe { margin-top: 10px; }
          .unsubscribe a { color: #1e40af; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            ${header_config.logo_url ? `<img src="${header_config.logo_url}" alt="${header_config.company_name}" style="max-height: 50px;">` : ''}
            <h1>${header_config.company_name}</h1>
          </div>
          <div class="content">
            ${content_blocks.map(block => renderContentBlock(block)).join('')}
          </div>
          <div class="footer">
            ${footer_config.company_info ? `<p>© 2025 ${header_config.company_name}. All rights reserved.</p>` : ''}
            ${footer_config.unsubscribe_link ? '<div class="unsubscribe"><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></div>' : ''}
            ${footer_config.compliance_text ? '<p>This email was sent in compliance with CAN-SPAM Act and healthcare regulations.</p>' : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    updateTemplateDefinition({ html_content: html });
  }, [templateData.template_definition, updateTemplateDefinition]);

  // Render content block
  const renderContentBlock = (block: EmailContentBlock) => {
    switch (block.type) {
      case 'text':
        return `<div style="${block.styles.text || ''}">${block.content}</div>`;
      case 'image':
        return `<img src="${block.content}" alt="Image" style="${block.styles.image || 'max-width: 100%; height: auto;'}">`;
      case 'button':
        return `<a href="#" style="${block.styles.button || 'display: inline-block; padding: 10px 20px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px;'}">${block.content}</a>`;
      case 'divider':
        return `<hr style="${block.styles.divider || 'border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'}">`;
      case 'social_links':
        return `<div style="${block.styles.social || 'text-align: center;'}">${block.content}</div>`;
      default:
        return '';
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => updateTemplate({ name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>

            <div>
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={templateData.category}
                onValueChange={(value) => updateTemplate({ category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                value={templateData.template_definition.subject}
                onChange={(e) => updateTemplateDefinition({ subject: e.target.value })}
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <Label>Content Blocks</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CONTENT_BLOCKS.map((block) => (
                  <Button
                    key={block.type}
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock(block.type)}
                    className="flex items-center gap-2"
                  >
                    <span>{block.icon}</span>
                    {block.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Compliance Status</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  {templateData.healthcare_compliance.can_spam_compliant ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">CAN-SPAM Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  {templateData.healthcare_compliance.fda_advertising_compliant ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">FDA Advertising Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  {templateData.healthcare_compliance.hipaa_compliant ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">HIPAA Compliant</span>
                </div>
              </div>
            </div>

            {complianceViolations.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {complianceViolations.map((violation, index) => (
                      <div key={index} className="text-sm">
                        <Badge variant={violation.severity === 'error' ? 'destructive' : 'secondary'}>
                          {violation.type}
                        </Badge>
                        <span className="ml-2">{violation.message}</span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList>
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    generateHTMLContent();
                    validateCompliance();
                  }}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Generate HTML
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onPreview(templateData)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>

                <Button
                  onClick={() => onSave(templateData)}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4">
            <TabsContent value="design" className="h-full">
              <div className="h-full bg-white rounded-lg border border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <div className="max-w-2xl mx-auto">
                    {templateData.template_definition.content_blocks.map((block, index) => (
                      <ContentBlockEditor
                        key={block.id}
                        block={block}
                        index={index}
                        onUpdate={(updates) => updateContentBlock(block.id, updates)}
                        onRemove={() => removeContentBlock(block.id)}
                        onMove={moveContentBlock}
                      />
                    ))}
                    {templateData.template_definition.content_blocks.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No content blocks yet. Add some from the sidebar.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="h-full">
              <div className="h-full bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto">
                <pre>{templateData.template_definition.html_content || 'Generate HTML to see code...'}</pre>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <div className="h-full bg-white rounded-lg border border-gray-200 overflow-y-auto">
                <div className={`mx-auto ${previewMode === 'mobile' ? 'max-w-sm' : previewMode === 'tablet' ? 'max-w-2xl' : 'max-w-4xl'}`}>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: templateData.template_definition.html_content || '<p>Generate HTML to see preview...</p>' 
                    }} 
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

// Content Block Editor Component
interface ContentBlockEditorProps {
  block: EmailContentBlock;
  index: number;
  onUpdate: (updates: Partial<EmailContentBlock>) => void;
  onRemove: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

function ContentBlockEditor({ block, index, onUpdate, onRemove, onMove }: ContentBlockEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'content-block',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'content-block',
    item: () => {
      return { id: block.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`border border-gray-200 rounded-lg p-4 mb-4 bg-white ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4 text-gray-400 cursor-move" />
          <Badge variant="outline">{block.type}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onUpdate({ ...block })}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {block.type === 'text' && (
        <Textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Enter text content..."
          className="min-h-[100px]"
        />
      )}

      {block.type === 'image' && (
        <div className="space-y-2">
          <Input
            value={block.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Enter image URL..."
          />
          {block.content && (
            <img src={block.content} alt="Preview" className="max-w-full h-auto rounded" />
          )}
        </div>
      )}

      {block.type === 'button' && (
        <div className="space-y-2">
          <Input
            value={block.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Button text..."
          />
          <Input
            value={block.styles.button || ''}
            onChange={(e) => onUpdate({ styles: { ...block.styles, button: e.target.value } })}
            placeholder="Button styles (CSS)..."
          />
        </div>
      )}

      {block.type === 'divider' && (
        <div className="space-y-2">
          <Input
            value={block.styles.divider || ''}
            onChange={(e) => onUpdate({ styles: { ...block.styles, divider: e.target.value } })}
            placeholder="Divider styles (CSS)..."
          />
        </div>
      )}

      {block.type === 'social_links' && (
        <Textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Enter social links HTML..."
          className="min-h-[100px]"
        />
      )}
    </div>
  );
}

// Helper functions
function getDefaultContent(type: string): string {
  switch (type) {
    case 'text':
      return 'Enter your text content here...';
    case 'image':
      return '';
    case 'button':
      return 'Click Here';
    case 'divider':
      return '';
    case 'social_links':
      return '<a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">LinkedIn</a>';
    default:
      return '';
  }
}

function getDefaultStyles(type: string): Record<string, string> {
  switch (type) {
    case 'text':
      return { text: 'font-size: 16px; line-height: 1.5; color: #333;' };
    case 'image':
      return { image: 'max-width: 100%; height: auto;' };
    case 'button':
      return { button: 'display: inline-block; padding: 10px 20px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px;' };
    case 'divider':
      return { divider: 'border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' };
    case 'social_links':
      return { social: 'text-align: center;' };
    default:
      return {};
  }
}

'use client';

// Email Template Preview Component
// Created: 2025-01-27
// Purpose: Mobile-responsive email template preview with device simulation

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  Code, 
  Download,
  Send,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { EmailTemplate } from '@/types/email-campaigns';

interface TemplatePreviewProps {
  template: EmailTemplate;
  onSendTest?: (template: EmailTemplate) => void;
  onDownload?: (template: EmailTemplate) => void;
  isSending?: boolean;
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile';
type PreviewType = 'html' | 'text' | 'source';

const DEVICE_SIZES = {
  desktop: { width: '100%', maxWidth: '800px' },
  tablet: { width: '768px', maxWidth: '768px' },
  mobile: { width: '375px', maxWidth: '375px' }
};

const DEVICE_NAMES = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile'
};

export default function TemplatePreview({ 
  template, 
  onSendTest, 
  onDownload, 
  isSending = false 
}: TemplatePreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [previewType, setPreviewType] = useState<PreviewType>('html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate preview content when template changes
  useEffect(() => {
    generatePreviewContent();
  }, [template, previewType]);

  const generatePreviewContent = () => {
    setIsLoading(true);
    
    try {
      let content = '';
      
      switch (previewType) {
        case 'html':
          content = template.template_definition.html_content || generateHTMLPreview();
          break;
        case 'text':
          content = template.template_definition.text_content || generateTextPreview();
          break;
        case 'source':
          content = template.template_definition.html_content || generateHTMLPreview();
          break;
        default:
          content = template.template_definition.html_content || generateHTMLPreview();
      }
      
      setPreviewContent(content);
    } catch (error) {
      console.error('Error generating preview content:', error);
      setPreviewContent('<p>Error generating preview content</p>');
    } finally {
      setIsLoading(false);
    }
  };

  const generateHTMLPreview = () => {
    const { header_config, content_blocks, footer_config } = template.template_definition;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.template_definition.subject}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
            line-height: 1.6;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
          }
          .content { 
            padding: 30px 20px; 
          }
          .footer { 
            background-color: #f8fafc; 
            padding: 20px; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0;
          }
          .unsubscribe { 
            margin-top: 15px; 
            text-align: center;
          }
          .unsubscribe a { 
            color: #1e40af; 
            text-decoration: none; 
            margin: 0 10px;
          }
          .unsubscribe a:hover { 
            text-decoration: underline; 
          }
          .compliance-text {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 10px;
            text-align: center;
          }
          @media (max-width: 600px) {
            .email-container { margin: 0; }
            .header, .content, .footer { padding: 20px 15px; }
            .header h1 { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            ${header_config.logo_url ? 
              `<img src="${header_config.logo_url}" alt="${header_config.company_name}" style="max-height: 50px; margin-bottom: 10px;">` : 
              ''
            }
            <h1>${header_config.company_name}</h1>
          </div>
          <div class="content">
            ${content_blocks.length > 0 ? 
              content_blocks.map(block => renderContentBlock(block)).join('') : 
              '<p>No content blocks added yet. Use the template builder to add content.</p>'
            }
          </div>
          <div class="footer">
            ${footer_config.company_info ? 
              `<p style="margin: 0 0 10px 0;">© 2025 ${header_config.company_name}. All rights reserved.</p>` : 
              ''
            }
            ${footer_config.unsubscribe_link ? 
              '<div class="unsubscribe"><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></div>' : 
              ''
            }
            ${footer_config.compliance_text ? 
              '<div class="compliance-text">This email was sent in compliance with CAN-SPAM Act and healthcare regulations.</div>' : 
              ''
            }
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateTextPreview = () => {
    const { header_config, content_blocks } = template.template_definition;
    
    let text = `${header_config.company_name}\n`;
    text += `${'='.repeat(header_config.company_name.length)}\n\n`;
    
    if (content_blocks.length > 0) {
      content_blocks.forEach(block => {
        if (block.type === 'text') {
          text += `${block.content}\n\n`;
        } else if (block.type === 'button') {
          text += `[${block.content}]\n\n`;
        }
      });
    } else {
      text += 'No content blocks added yet.\n';
    }
    
    text += `\n---\n`;
    text += `© 2025 ${header_config.company_name}. All rights reserved.\n`;
    text += `Unsubscribe: [link] | Update Preferences: [link]\n`;
    text += `This email was sent in compliance with CAN-SPAM Act and healthcare regulations.`;
    
    return text;
  };

  const renderContentBlock = (block: any) => {
    switch (block.type) {
      case 'text':
        return `<div style="${block.styles?.text || ''}">${block.content}</div>`;
      case 'image':
        return `<img src="${block.content}" alt="Image" style="${block.styles?.image || 'max-width: 100%; height: auto; display: block; margin: 10px 0;'}">`;
      case 'button':
        return `<div style="text-align: center; margin: 20px 0;">
          <a href="#" style="${block.styles?.button || 'display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;'}">${block.content}</a>
        </div>`;
      case 'divider':
        return `<hr style="${block.styles?.divider || 'border: none; border-top: 2px solid #e2e8f0; margin: 30px 0;'}">`;
      case 'social_links':
        return `<div style="${block.styles?.social || 'text-align: center; margin: 20px 0;'}">${block.content}</div>`;
      default:
        return '';
    }
  };

  const handleSendTest = () => {
    if (onSendTest) {
      onSendTest(template);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(template);
    } else {
      // Default download behavior
      const blob = new Blob([previewContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className={isFullscreen ? 'h-full border-0 rounded-none' : ''}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generatePreviewContent}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="space-y-4">
            <Tabs value={previewType} onValueChange={(value) => setPreviewType(value as PreviewType)}>
              <TabsList>
                <TabsTrigger value="html">HTML Preview</TabsTrigger>
                <TabsTrigger value="text">Text Preview</TabsTrigger>
                <TabsTrigger value="source">Source Code</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Device:</span>
                <div className="flex gap-1">
                  {Object.entries(DEVICE_NAMES).map(([mode, name]) => (
                    <Button
                      key={mode}
                      variant={previewMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode(mode as PreviewMode)}
                    >
                      {mode === 'desktop' && <Monitor className="h-4 w-4 mr-1" />}
                      {mode === 'tablet' && <Tablet className="h-4 w-4 mr-1" />}
                      {mode === 'mobile' && <Smartphone className="h-4 w-4 mr-1" />}
                      {name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {DEVICE_SIZES[previewMode].width}
                </Badge>
                {onSendTest && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTest}
                    disabled={isSending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {isSending ? 'Sending...' : 'Send Test'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="bg-gray-50 p-4">
            <div 
              className="mx-auto bg-white rounded-lg shadow-sm overflow-hidden"
              style={DEVICE_SIZES[previewMode]}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <TabsContent value={previewType} className="h-full">
                  {previewType === 'html' && (
                    <div 
                      className="h-full overflow-auto"
                      style={{ minHeight: '400px' }}
                    >
                      <iframe
                        srcDoc={previewContent}
                        className="w-full h-full border-0"
                        title="Email Preview"
                      />
                    </div>
                  )}
                  
                  {previewType === 'text' && (
                    <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                      {previewContent}
                    </div>
                  )}
                  
                  {previewType === 'source' && (
                    <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-auto">
                      <pre>{previewContent}</pre>
                    </div>
                  )}
                </TabsContent>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

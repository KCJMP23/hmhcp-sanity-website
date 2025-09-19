'use client';

// Email Template Library Component
// Created: 2025-01-27
// Purpose: Healthcare template browser with pre-built templates

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Eye, 
  Copy, 
  Star, 
  Download,
  Calendar,
  Users,
  Shield,
  Heart
} from 'lucide-react';
import type { EmailTemplate, EmailTemplateCategory } from '@/types/email-campaigns';

interface TemplateLibraryProps {
  onSelectTemplate: (template: EmailTemplate) => void;
  onPreviewTemplate: (template: EmailTemplate) => void;
  onCreateFromTemplate: (template: EmailTemplate) => void;
}

interface TemplateStats {
  usage_count: number;
  last_used?: string;
  performance_metrics?: {
    avg_open_rate: number;
    avg_click_rate: number;
    total_sends: number;
  };
}

const HEALTHCARE_TEMPLATES: (EmailTemplate & { stats?: TemplateStats })[] = [
  {
    id: 'newsletter-monthly',
    name: 'Monthly Healthcare Newsletter',
    description: 'Professional monthly newsletter template for healthcare updates',
    category: 'newsletter',
    template_definition: {
      subject: 'Monthly Healthcare Update - {{month}} {{year}}',
      html_content: '',
      text_content: '',
      personalization_fields: ['name', 'organization', 'month', 'year'],
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
      can_spam_compliant: true,
      fda_advertising_compliant: true,
      hipaa_compliant: true,
      required_disclaimers: ['Consult your healthcare provider'],
      consent_required: true,
      audit_trail_enabled: true
    },
    target_audience: ['healthcare_professional'],
    is_active: true,
    created_by: 'system',
    created_at: '2025-01-27T00:00:00Z',
    updated_at: '2025-01-27T00:00:00Z',
    stats: {
      usage_count: 45,
      last_used: '2025-01-25T10:30:00Z',
      performance_metrics: {
        avg_open_rate: 0.28,
        avg_click_rate: 0.12,
        total_sends: 1250
      }
    }
  },
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    description: 'Patient appointment confirmation and reminder template',
    category: 'appointment_reminder',
    template_definition: {
      subject: 'Appointment Reminder - {{appointment_date}}',
      html_content: '',
      text_content: '',
      personalization_fields: ['patient_name', 'appointment_date', 'appointment_time', 'doctor_name'],
      content_blocks: [],
      footer_config: {
        unsubscribe_link: true,
        company_info: true,
        compliance_text: true,
        social_links: false
      },
      header_config: {
        company_name: 'HM Healthcare Partners',
        logo_url: '',
        navigation_links: []
      }
    },
    healthcare_compliance: {
      can_spam_compliant: true,
      fda_advertising_compliant: true,
      hipaa_compliant: true,
      required_disclaimers: ['HIPAA compliant communication'],
      consent_required: true,
      audit_trail_enabled: true
    },
    target_audience: ['patient'],
    is_active: true,
    created_by: 'system',
    created_at: '2025-01-27T00:00:00Z',
    updated_at: '2025-01-27T00:00:00Z',
    stats: {
      usage_count: 89,
      last_used: '2025-01-26T14:15:00Z',
      performance_metrics: {
        avg_open_rate: 0.35,
        avg_click_rate: 0.18,
        total_sends: 2100
      }
    }
  },
  {
    id: 'educational-content',
    name: 'Medical Education Content',
    description: 'Educational template for medical professionals and continuing education',
    category: 'educational',
    template_definition: {
      subject: 'Medical Education Update: {{topic}}',
      html_content: '',
      text_content: '',
      personalization_fields: ['name', 'specialty', 'topic'],
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
      can_spam_compliant: true,
      fda_advertising_compliant: true,
      hipaa_compliant: true,
      required_disclaimers: ['For educational purposes only', 'Consult your healthcare provider'],
      consent_required: true,
      audit_trail_enabled: true
    },
    target_audience: ['healthcare_professional'],
    is_active: true,
    created_by: 'system',
    created_at: '2025-01-27T00:00:00Z',
    updated_at: '2025-01-27T00:00:00Z',
    stats: {
      usage_count: 23,
      last_used: '2025-01-24T09:45:00Z',
      performance_metrics: {
        avg_open_rate: 0.31,
        avg_click_rate: 0.15,
        total_sends: 680
      }
    }
  },
  {
    id: 'service-announcement',
    name: 'Service Announcement',
    description: 'FDA-compliant promotional template for healthcare services',
    category: 'promotional',
    template_definition: {
      subject: 'New Healthcare Service: {{service_name}}',
      html_content: '',
      text_content: '',
      personalization_fields: ['name', 'organization', 'service_name'],
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
      can_spam_compliant: true,
      fda_advertising_compliant: true,
      hipaa_compliant: true,
      required_disclaimers: ['FDA approved', 'Consult your healthcare provider'],
      consent_required: true,
      audit_trail_enabled: true
    },
    target_audience: ['healthcare_professional', 'patient'],
    is_active: true,
    created_by: 'system',
    created_at: '2025-01-27T00:00:00Z',
    updated_at: '2025-01-27T00:00:00Z',
    stats: {
      usage_count: 12,
      last_used: '2025-01-23T16:20:00Z',
      performance_metrics: {
        avg_open_rate: 0.22,
        avg_click_rate: 0.08,
        total_sends: 340
      }
    }
  },
  {
    id: 'compliance-notification',
    name: 'Compliance Notification',
    description: 'Template for HIPAA and regulatory compliance notifications',
    category: 'compliance',
    template_definition: {
      subject: 'Important Compliance Update - {{compliance_type}}',
      html_content: '',
      text_content: '',
      personalization_fields: ['name', 'organization', 'compliance_type'],
      content_blocks: [],
      footer_config: {
        unsubscribe_link: true,
        company_info: true,
        compliance_text: true,
        social_links: false
      },
      header_config: {
        company_name: 'HM Healthcare Partners',
        logo_url: '',
        navigation_links: []
      }
    },
    healthcare_compliance: {
      can_spam_compliant: true,
      fda_advertising_compliant: true,
      hipaa_compliant: true,
      required_disclaimers: ['HIPAA compliant', 'Regulatory notification'],
      consent_required: true,
      audit_trail_enabled: true
    },
    target_audience: ['healthcare_professional'],
    is_active: true,
    created_by: 'system',
    created_at: '2025-01-27T00:00:00Z',
    updated_at: '2025-01-27T00:00:00Z',
    stats: {
      usage_count: 7,
      last_used: '2025-01-22T11:10:00Z',
      performance_metrics: {
        avg_open_rate: 0.42,
        avg_click_rate: 0.25,
        total_sends: 180
      }
    }
  }
];

const CATEGORY_ICONS: Record<EmailTemplateCategory, React.ReactNode> = {
  newsletter: <Calendar className="h-4 w-4" />,
  appointment_reminder: <Calendar className="h-4 w-4" />,
  educational: <Users className="h-4 w-4" />,
  promotional: <Heart className="h-4 w-4" />,
  compliance: <Shield className="h-4 w-4" />
};

const CATEGORY_COLORS: Record<EmailTemplateCategory, string> = {
  newsletter: 'bg-blue-100 text-blue-800',
  appointment_reminder: 'bg-green-100 text-green-800',
  educational: 'bg-purple-100 text-purple-800',
  promotional: 'bg-pink-100 text-pink-800',
  compliance: 'bg-orange-100 text-orange-800'
};

export default function TemplateLibrary({ 
  onSelectTemplate, 
  onPreviewTemplate, 
  onCreateFromTemplate 
}: TemplateLibraryProps) {
  const [templates, setTemplates] = useState(HEALTHCARE_TEMPLATES);
  const [filteredTemplates, setFilteredTemplates] = useState(HEALTHCARE_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Filter and search templates
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.stats?.usage_count || 0) - (a.stats?.usage_count || 0);
        case 'performance':
          return (b.stats?.performance_metrics?.avg_open_rate || 0) - (a.stats?.performance_metrics?.avg_open_rate || 0);
        case 'recent':
          return new Date(b.stats?.last_used || b.created_at).getTime() - new Date(a.stats?.last_used || a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, sortBy]);

  const handleSelectTemplate = (template: EmailTemplate) => {
    onSelectTemplate(template);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    onPreviewTemplate(template);
  };

  const handleCreateFromTemplate = (template: EmailTemplate) => {
    onCreateFromTemplate(template);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
          <p className="text-gray-600">Choose from pre-built healthcare email templates</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Healthcare Compliant
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
            <SelectItem value="educational">Educational</SelectItem>
            <SelectItem value="promotional">Promotional</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="usage">Usage Count</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="recent">Recently Used</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {CATEGORY_ICONS[template.category]}
                  <Badge className={CATEGORY_COLORS[template.category]}>
                    {template.category.replace('_', ' ')}
                  </Badge>
                </div>
                {template.stats && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="h-4 w-4" />
                    <span>{template.stats.usage_count}</span>
                  </div>
                )}
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <p className="text-sm text-gray-600">{template.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compliance Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Healthcare Compliant</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.healthcare_compliance.can_spam_compliant && (
                    <Badge variant="outline" className="text-xs">CAN-SPAM</Badge>
                  )}
                  {template.healthcare_compliance.fda_advertising_compliant && (
                    <Badge variant="outline" className="text-xs">FDA</Badge>
                  )}
                  {template.healthcare_compliance.hipaa_compliant && (
                    <Badge variant="outline" className="text-xs">HIPAA</Badge>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              {template.stats?.performance_metrics && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Performance</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Open Rate:</span>
                      <span className="ml-1 font-medium">
                        {Math.round(template.stats.performance_metrics.avg_open_rate * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Click Rate:</span>
                      <span className="ml-1 font-medium">
                        {Math.round(template.stats.performance_metrics.avg_click_rate * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Personalization Fields */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Personalization</div>
                <div className="flex flex-wrap gap-1">
                  {template.template_definition.personalization_fields.map((field) => (
                    <Badge key={field} variant="secondary" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewTemplate(template)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateFromTemplate(template)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

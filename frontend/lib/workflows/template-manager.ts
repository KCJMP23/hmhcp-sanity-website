// Workflow Template Manager
// Manages workflow templates and marketplace integration

import { WorkflowTemplate, TemplateSearchFilters, TemplateSearchResult } from '@/types/workflows/templates';
import { WorkflowDefinition } from '@/types/workflows/visual-builder';

export class WorkflowTemplateManager {
  private templates: WorkflowTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: '1',
        name: 'Blog Content Pipeline',
        description: 'Research → Write → SEO → Publish workflow for healthcare content',
        category: 'content',
        definition: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'manual-trigger',
              data: { label: 'Start Blog Pipeline', parameters: {} },
              position: { x: 100, y: 100 }
            },
            {
              id: 'research-1',
              type: 'research-agent',
              data: { label: 'Research Topic', parameters: { topic: 'Healthcare trends' } },
              position: { x: 300, y: 100 }
            },
            {
              id: 'content-1',
              type: 'content-agent',
              data: { label: 'Write Content', parameters: { contentType: 'blog' } },
              position: { x: 500, y: 100 }
            },
            {
              id: 'seo-1',
              type: 'seo-agent',
              data: { label: 'SEO Optimization', parameters: { keywords: ['healthcare', 'blog'] } },
              position: { x: 700, y: 100 }
            },
            {
              id: 'publish-1',
              type: 'publishing-agent',
              data: { label: 'Publish Content', parameters: { platform: 'wordpress' } },
              position: { x: 900, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'trigger-1', target: 'research-1' },
            { id: 'e2', source: 'research-1', target: 'content-1' },
            { id: 'e3', source: 'content-1', target: 'seo-1' },
            { id: 'e4', source: 'seo-1', target: 'publish-1' }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        tags: ['content', 'blog', 'seo', 'healthcare'],
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 45,
        rating: 4.8,
        reviews: [],
        version: '1.0.0',
        status: 'published',
        featured: true,
        downloads: 120,
        compatibility: ['v1.0+'],
        requirements: []
      },
      {
        id: '2',
        name: 'Clinical Trial Update',
        description: 'Data fetch → Analysis → Report → Notify workflow',
        category: 'healthcare',
        definition: {
          nodes: [
            {
              id: 'trigger-2',
              type: 'schedule-trigger',
              data: { label: 'Daily Update', parameters: { schedule: '0 9 * * *' } },
              position: { x: 100, y: 100 }
            },
            {
              id: 'api-1',
              type: 'api-call',
              data: { label: 'Fetch Trial Data', parameters: { method: 'GET', endpoint: '/api/trials' } },
              position: { x: 300, y: 100 }
            },
            {
              id: 'analysis-1',
              type: 'research-agent',
              data: { label: 'Analyze Data', parameters: { topic: 'Clinical trial analysis' } },
              position: { x: 500, y: 100 }
            },
            {
              id: 'report-1',
              type: 'content-agent',
              data: { label: 'Generate Report', parameters: { contentType: 'report' } },
              position: { x: 700, y: 100 }
            },
            {
              id: 'notify-1',
              type: 'email',
              data: { label: 'Send Notification', parameters: { subject: 'Trial Update' } },
              position: { x: 900, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'trigger-2', target: 'api-1' },
            { id: 'e2', source: 'api-1', target: 'analysis-1' },
            { id: 'e3', source: 'analysis-1', target: 'report-1' },
            { id: 'e4', source: 'report-1', target: 'notify-1' }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        tags: ['clinical', 'trial', 'data', 'analysis'],
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 23,
        rating: 4.6,
        reviews: [],
        version: '1.0.0',
        status: 'published',
        featured: true,
        downloads: 67,
        compatibility: ['v1.0+'],
        requirements: []
      },
      {
        id: '3',
        name: 'Patient Outreach',
        description: 'Segment → Personalize → Send → Track workflow',
        category: 'healthcare',
        definition: {
          nodes: [
            {
              id: 'trigger-3',
              type: 'manual-trigger',
              data: { label: 'Start Outreach', parameters: {} },
              position: { x: 100, y: 100 }
            },
            {
              id: 'filter-1',
              type: 'filter-transform',
              data: { label: 'Segment Patients', parameters: { condition: 'status = "active"' } },
              position: { x: 300, y: 100 }
            },
            {
              id: 'personalize-1',
              type: 'content-agent',
              data: { label: 'Personalize Message', parameters: { contentType: 'email' } },
              position: { x: 500, y: 100 }
            },
            {
              id: 'send-1',
              type: 'email',
              data: { label: 'Send Email', parameters: { subject: 'Health Update' } },
              position: { x: 700, y: 100 }
            },
            {
              id: 'track-1',
              type: 'database-action',
              data: { label: 'Track Sent', parameters: { operation: 'INSERT', table: 'outreach_log' } },
              position: { x: 900, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'trigger-3', target: 'filter-1' },
            { id: 'e2', source: 'filter-1', target: 'personalize-1' },
            { id: 'e3', source: 'personalize-1', target: 'send-1' },
            { id: 'e4', source: 'send-1', target: 'track-1' }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        tags: ['patient', 'outreach', 'communication', 'tracking'],
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 18,
        rating: 4.4,
        reviews: [],
        version: '1.0.0',
        status: 'published',
        featured: false,
        downloads: 34,
        compatibility: ['v1.0+'],
        requirements: []
      }
    ];
  }

  async searchTemplates(filters: TemplateSearchFilters): Promise<TemplateSearchResult> {
    let filteredTemplates = [...this.templates];

    // Apply filters
    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredTemplates = filteredTemplates.filter(t => 
        filters.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (filters.rating) {
      filteredTemplates = filteredTemplates.filter(t => t.rating >= filters.rating!);
    }

    if (filters.created_by) {
      filteredTemplates = filteredTemplates.filter(t => t.created_by === filters.created_by);
    }

    if (filters.featured) {
      filteredTemplates = filteredTemplates.filter(t => t.featured === filters.featured);
    }

    if (filters.compatibility && filters.compatibility.length > 0) {
      filteredTemplates = filteredTemplates.filter(t => 
        filters.compatibility!.some(version => t.compatibility.includes(version))
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Only show published templates
    filteredTemplates = filteredTemplates.filter(t => t.status === 'published');

    // Sort by featured first, then by rating
    filteredTemplates.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);

    return {
      templates: paginatedTemplates,
      total: filteredTemplates.length,
      page,
      limit,
      hasMore: offset + limit < filteredTemplates.length
    };
  }

  async getTemplate(id: string): Promise<WorkflowTemplate | null> {
    return this.templates.find(t => t.id === id) || null;
  }

  async createTemplate(template: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'downloads'>): Promise<WorkflowTemplate> {
    const newTemplate: WorkflowTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0,
      downloads: 0
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate | null> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updated_at: new Date()
    };

    return this.templates[index];
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    return true;
  }

  async incrementUsage(id: string): Promise<void> {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.usage_count++;
    }
  }

  async incrementDownloads(id: string): Promise<void> {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.downloads++;
    }
  }

  async getCategories(): Promise<string[]> {
    const categories = new Set(this.templates.map(t => t.category));
    return Array.from(categories).sort();
  }

  async getFeaturedTemplates(): Promise<WorkflowTemplate[]> {
    return this.templates.filter(t => t.featured && t.status === 'published');
  }

  async getPopularTemplates(limit: number = 10): Promise<WorkflowTemplate[]> {
    return this.templates
      .filter(t => t.status === 'published')
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  }

  async getRecentTemplates(limit: number = 10): Promise<WorkflowTemplate[]> {
    return this.templates
      .filter(t => t.status === 'published')
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
}
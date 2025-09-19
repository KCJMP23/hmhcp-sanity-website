import { WorkflowTemplateManager, WorkflowTemplate, HealthcareWorkflowCategory, HealthcareComplianceLevel } from '../template-manager';

describe('WorkflowTemplateManager', () => {
  let manager: WorkflowTemplateManager;

  beforeEach(() => {
    manager = new WorkflowTemplateManager();
  });

  describe('Template Management', () => {
    it('should initialize with default templates', () => {
      const templates = manager.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should get template by ID', () => {
      const templates = manager.getAllTemplates();
      const template = manager.getTemplate(templates[0].id);
      expect(template).toBeDefined();
      expect(template?.id).toBe(templates[0].id);
    });

    it('should return undefined for non-existent template', () => {
      const template = manager.getTemplate('non-existent-id');
      expect(template).toBeUndefined();
    });

    it('should get templates by category', () => {
      const patientCareTemplates = manager.getTemplatesByCategory('patient_care');
      expect(patientCareTemplates.length).toBeGreaterThan(0);
      expect(patientCareTemplates.every(t => t.category === 'patient_care')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const templates = manager.getTemplatesByCategory('non_existent' as HealthcareWorkflowCategory);
      expect(templates).toEqual([]);
    });
  });

  describe('Template Search', () => {
    it('should search templates by query', () => {
      const results = manager.searchTemplates({ searchQuery: 'patient' });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => 
        t.name.toLowerCase().includes('patient') ||
        t.description.toLowerCase().includes('patient') ||
        t.tags.some(tag => tag.toLowerCase().includes('patient'))
      )).toBe(true);
    });

    it('should search templates by category', () => {
      const results = manager.searchTemplates({ category: ['patient_care'] });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.category === 'patient_care')).toBe(true);
    });

    it('should search templates by compliance level', () => {
      const results = manager.searchTemplates({ complianceLevel: ['hipaa'] });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.healthcareComplianceLevel === 'hipaa')).toBe(true);
    });

    it('should search templates by tags', () => {
      const results = manager.searchTemplates({ tags: ['hipaa'] });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.tags.includes('hipaa'))).toBe(true);
    });

    it('should search templates by author', () => {
      const results = manager.searchTemplates({ author: 'Healthcare AI Team' });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.author.includes('Healthcare AI Team'))).toBe(true);
    });

    it('should search templates by minimum rating', () => {
      const results = manager.searchTemplates({ minRating: 4.5 });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.rating >= 4.5)).toBe(true);
    });

    it('should search templates by public status', () => {
      const results = manager.searchTemplates({ isPublic: true });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.isPublic)).toBe(true);
    });

    it('should search templates by featured status', () => {
      const results = manager.searchTemplates({ isFeatured: true });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.isFeatured)).toBe(true);
    });

    it('should search templates by dependencies', () => {
      const results = manager.searchTemplates({ hasDependencies: true });
      expect(results.templates.length).toBeGreaterThan(0);
      expect(results.templates.every(t => t.dependencies.length > 0)).toBe(true);
    });

    it('should return paginated results', () => {
      const results = manager.searchTemplates({}, 1, 1);
      expect(results.templates.length).toBe(1);
      expect(results.page).toBe(1);
      expect(results.pageSize).toBe(1);
      expect(results.hasMore).toBe(true);
    });

    it('should return facets for search results', () => {
      const results = manager.searchTemplates({});
      expect(results.facets).toBeDefined();
      expect(results.facets.categories).toBeDefined();
      expect(results.facets.complianceLevels).toBeDefined();
      expect(results.facets.tags).toBeDefined();
      expect(results.facets.authors).toBeDefined();
    });
  });

  describe('Template Creation', () => {
    it('should create a new template', () => {
      const templateData = {
        name: 'Test Template',
        description: 'A test template',
        category: 'automation' as HealthcareWorkflowCategory,
        tags: ['test'],
        version: '1.0.0',
        author: 'Test Author',
        workflowDefinition: {
          nodes: [],
          edges: []
        },
        agentSequence: [],
        conditionalLogic: {},
        inputSchema: {
          required: [],
          optional: [],
          validation: {}
        },
        outputSchema: {
          fields: [],
          format: 'json' as const,
          validation: {}
        },
        executionMetrics: {
          averageExecutionTime: 1000,
          successRate: 0.95,
          costPerExecution: 0.1,
          resourceUsage: {
            cpu: 0.5,
            memory: 256,
            storage: 1024
          },
          scalability: {
            maxConcurrentExecutions: 10,
            recommendedBatchSize: 5
          }
        },
        healthcareComplianceLevel: 'basic' as HealthcareComplianceLevel,
        isPublic: false,
        isFeatured: false,
        dependencies: [],
        parameters: []
      };

      const template = manager.createTemplate(templateData);
      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.createdAt).toBeDefined();
      expect(template.updatedAt).toBeDefined();
      expect(template.downloadCount).toBe(0);
      expect(template.rating).toBe(0);
      expect(template.reviewCount).toBe(0);
    });

    it('should update an existing template', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const updates = { name: 'Updated Name' };

      const updated = manager.updateTemplate(template.id, updates);
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.updatedAt).not.toEqual(template.updatedAt);
    });

    it('should return null when updating non-existent template', () => {
      const updated = manager.updateTemplate('non-existent-id', { name: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should delete a template', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const deleted = manager.deleteTemplate(template.id);
      expect(deleted).toBe(true);
      expect(manager.getTemplate(template.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent template', () => {
      const deleted = manager.deleteTemplate('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Template Import/Export', () => {
    it('should import template from JSON', () => {
      const templateData = {
        name: 'Imported Template',
        description: 'An imported template',
        category: 'automation' as HealthcareWorkflowCategory,
        tags: ['imported'],
        version: '1.0.0',
        author: 'Import Author',
        workflowDefinition: {
          nodes: [],
          edges: []
        },
        agentSequence: [],
        conditionalLogic: {},
        inputSchema: {
          required: [],
          optional: [],
          validation: {}
        },
        outputSchema: {
          fields: [],
          format: 'json' as const,
          validation: {}
        },
        executionMetrics: {
          averageExecutionTime: 1000,
          successRate: 0.95,
          costPerExecution: 0.1,
          resourceUsage: {
            cpu: 0.5,
            memory: 256,
            storage: 1024
          },
          scalability: {
            maxConcurrentExecutions: 10,
            recommendedBatchSize: 5
          }
        },
        healthcareComplianceLevel: 'basic' as HealthcareComplianceLevel,
        isPublic: false,
        isFeatured: false,
        dependencies: [],
        parameters: []
      };

      const jsonData = JSON.stringify(templateData);
      const imported = manager.importTemplate(jsonData);
      expect(imported).toBeDefined();
      expect(imported?.name).toBe(templateData.name);
      expect(imported?.id).toBeDefined();
    });

    it('should return null for invalid JSON', () => {
      const imported = manager.importTemplate('invalid json');
      expect(imported).toBeNull();
    });

    it('should export template to JSON', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const exported = manager.exportTemplate(template.id);
      expect(exported).toBeDefined();
      
      const parsed = JSON.parse(exported!);
      expect(parsed.name).toBe(template.name);
      expect(parsed.id).toBe(template.id);
    });

    it('should return null when exporting non-existent template', () => {
      const exported = manager.exportTemplate('non-existent-id');
      expect(exported).toBeNull();
    });
  });

  describe('Template Cloning', () => {
    it('should clone a template', () => {
      const templates = manager.getAllTemplates();
      const original = templates[0];
      const cloned = manager.cloneTemplate(original.id, 'Cloned Template', 'Clone Author');
      
      expect(cloned).toBeDefined();
      expect(cloned?.name).toBe('Cloned Template');
      expect(cloned?.author).toBe('Clone Author');
      expect(cloned?.id).not.toBe(original.id);
      expect(cloned?.isPublic).toBe(false);
      expect(cloned?.isFeatured).toBe(false);
    });

    it('should return null when cloning non-existent template', () => {
      const cloned = manager.cloneTemplate('non-existent-id', 'Cloned', 'Author');
      expect(cloned).toBeNull();
    });
  });

  describe('Template Categories and Filtering', () => {
    it('should get all categories', () => {
      const categories = manager.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('patient_care');
    });

    it('should get featured templates', () => {
      const featured = manager.getFeaturedTemplates();
      expect(featured.length).toBeGreaterThan(0);
      expect(featured.every(t => t.isFeatured)).toBe(true);
    });

    it('should get popular templates', () => {
      const popular = manager.getPopularTemplates(5);
      expect(popular.length).toBeLessThanOrEqual(5);
      expect(popular.every((t, i) => i === 0 || t.downloadCount <= popular[i - 1].downloadCount)).toBe(true);
    });

    it('should get recent templates', () => {
      const recent = manager.getRecentTemplates(5);
      expect(recent.length).toBeLessThanOrEqual(5);
      expect(recent.every((t, i) => i === 0 || t.createdAt.getTime() <= recent[i - 1].createdAt.getTime())).toBe(true);
    });
  });

  describe('Template Rating and Downloads', () => {
    it('should rate a template', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const initialRating = template.rating;
      const initialReviewCount = template.reviewCount;

      const success = manager.rateTemplate(template.id, 5, 'user1');
      expect(success).toBe(true);

      const updated = manager.getTemplate(template.id);
      expect(updated?.rating).toBeGreaterThanOrEqual(initialRating);
      expect(updated?.reviewCount).toBe(initialReviewCount + 1);
    });

    it('should not rate with invalid rating', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const success = manager.rateTemplate(template.id, 6, 'user1');
      expect(success).toBe(false);
    });

    it('should download a template', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const initialDownloads = template.downloadCount;

      const downloaded = manager.downloadTemplate(template.id);
      expect(downloaded).toBeDefined();
      expect(downloaded?.downloadCount).toBe(initialDownloads + 1);
    });

    it('should return null when downloading non-existent template', () => {
      const downloaded = manager.downloadTemplate('non-existent-id');
      expect(downloaded).toBeNull();
    });
  });

  describe('Template Dependencies', () => {
    it('should get template dependencies', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const dependencies = manager.getTemplateDependencies(template.id);
      expect(Array.isArray(dependencies)).toBe(true);
    });

    it('should validate dependencies', () => {
      const templates = manager.getAllTemplates();
      const template = templates[0];
      const availableDeps = ['hipaa-validator'];
      
      const validation = manager.validateDependencies(template.id, availableDeps);
      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();
      expect(Array.isArray(validation.missing)).toBe(true);
    });
  });

  describe('Template Validation', () => {
    it('should validate template structure', () => {
      const validTemplate = {
        name: 'Valid Template',
        description: 'A valid template',
        category: 'automation' as HealthcareWorkflowCategory,
        tags: ['test'],
        version: '1.0.0',
        author: 'Test Author',
        workflowDefinition: {
          nodes: [],
          edges: []
        },
        agentSequence: [],
        conditionalLogic: {},
        inputSchema: {
          required: [],
          optional: [],
          validation: {}
        },
        outputSchema: {
          fields: [],
          format: 'json' as const,
          validation: {}
        },
        executionMetrics: {
          averageExecutionTime: 1000,
          successRate: 0.95,
          costPerExecution: 0.1,
          resourceUsage: {
            cpu: 0.5,
            memory: 256,
            storage: 1024
          },
          scalability: {
            maxConcurrentExecutions: 10,
            recommendedBatchSize: 5
          }
        },
        healthcareComplianceLevel: 'basic' as HealthcareComplianceLevel,
        isPublic: false,
        isFeatured: false,
        dependencies: [],
        parameters: []
      };

      const jsonData = JSON.stringify(validTemplate);
      const imported = manager.importTemplate(jsonData);
      expect(imported).toBeDefined();
    });

    it('should reject invalid template structure', () => {
      const invalidTemplate = {
        name: 'Invalid Template'
        // Missing required fields
      };

      const jsonData = JSON.stringify(invalidTemplate);
      const imported = manager.importTemplate(jsonData);
      expect(imported).toBeNull();
    });
  });
});

import { WorkflowMarketplace, MarketplaceWorkflow, WorkflowDependency } from '../marketplace';
import { WorkflowDefinition } from '../../types/workflows/visual-builder';

// Mock workflow for testing
const createMockWorkflow = (id: string = 'test-workflow'): WorkflowDefinition => ({
  id,
  name: 'Test Workflow',
  description: 'A test workflow',
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { label: 'Start' }
    },
    {
      id: 'process',
      type: 'dataProcessor',
      position: { x: 100, y: 0 },
      data: { label: 'Process Data' }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 200, y: 0 },
      data: { label: 'End' }
    }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'process' },
    { id: 'e2', source: 'process', target: 'end' }
  ]
});

describe('WorkflowMarketplace', () => {
  let marketplace: WorkflowMarketplace;
  let mockWorkflow: WorkflowDefinition;

  beforeEach(() => {
    marketplace = new WorkflowMarketplace();
    mockWorkflow = createMockWorkflow();
  });

  describe('Workflow Publishing', () => {
    it('should publish a workflow to the marketplace', () => {
      const author = {
        id: 'author-1',
        name: 'Test Author',
        verified: true
      };

      const workflow = marketplace.publishWorkflow(
        mockWorkflow,
        author,
        'Healthcare',
        ['AI', 'Data Processing'],
        { type: 'free' },
        {
          minVersion: '1.0.0',
          dependencies: [],
          permissions: ['read:data']
        }
      );

      expect(workflow).toBeDefined();
      expect(workflow.id).toMatch(/^workflow-/);
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.author).toEqual(author);
      expect(workflow.category).toBe('Healthcare');
      expect(workflow.tags).toEqual(['AI', 'Data Processing']);
      expect(workflow.pricing.type).toBe('free');
      expect(workflow.status).toBe('pending_review');
      expect(workflow.metadata.nodeCount).toBe(3);
      expect(workflow.metadata.edgeCount).toBe(2);
    });

    it('should calculate workflow metadata correctly', () => {
      const workflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: false },
        'Test',
        [],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );

      expect(workflow.metadata.nodeCount).toBe(3);
      expect(workflow.metadata.edgeCount).toBe(2);
      expect(workflow.metadata.complexity).toBeGreaterThan(0);
      expect(workflow.metadata.estimatedExecutionTime).toBeGreaterThan(0);
      expect(workflow.metadata.checksum).toBeDefined();
    });
  });

  describe('Workflow Search', () => {
    let publishedWorkflow: MarketplaceWorkflow;

    beforeEach(() => {
      publishedWorkflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI', 'Data Processing'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );
      
      // Mark as published
      publishedWorkflow.status = 'published';
    });

    it('should search workflows by query', () => {
      const results = marketplace.searchWorkflows('Test Workflow');
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].id).toBe(publishedWorkflow.id);
      expect(results.total).toBe(1);
    });

    it('should search workflows by category', () => {
      const results = marketplace.searchWorkflows('', { category: 'Healthcare' });
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].category).toBe('Healthcare');
    });

    it('should search workflows by tags', () => {
      const results = marketplace.searchWorkflows('', { tags: ['AI'] });
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].tags).toContain('AI');
    });

    it('should search workflows by pricing', () => {
      const results = marketplace.searchWorkflows('', { pricing: ['free'] });
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].pricing.type).toBe('free');
    });

    it('should search workflows by rating', () => {
      publishedWorkflow.stats.rating = 4.5;
      const results = marketplace.searchWorkflows('', { rating: { min: 4, max: 5 } });
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].stats.rating).toBe(4.5);
    });

    it('should search workflows by author', () => {
      const results = marketplace.searchWorkflows('', { author: 'Test Author' });
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].author.name).toBe('Test Author');
    });

    it('should search workflows by featured status', () => {
      publishedWorkflow.featured = true;
      const results = marketplace.searchWorkflows('', { featured: true });
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].featured).toBe(true);
    });

    it('should search workflows by trending status', () => {
      publishedWorkflow.trending = true;
      const results = marketplace.searchWorkflows('', { trending: true });
      
      expect(results.workflows).toHaveLength(1);
      expect(results.workflows[0].trending).toBe(true);
    });

    it('should return empty results for non-matching query', () => {
      const results = marketplace.searchWorkflows('Non-existent Workflow');
      
      expect(results.workflows).toHaveLength(0);
      expect(results.total).toBe(0);
    });

    it('should paginate search results', () => {
      // Create multiple workflows
      for (let i = 0; i < 25; i++) {
        const workflow = createMockWorkflow(`workflow-${i}`);
        const published = marketplace.publishWorkflow(
          workflow,
          { id: `author-${i}`, name: `Author ${i}`, verified: false },
          'Test',
          [],
          { type: 'free' },
          { minVersion: '1.0.0', dependencies: [], permissions: [] }
        );
        published.status = 'published';
      }

      const page1 = marketplace.searchWorkflows('', {}, 1, 10);
      const page2 = marketplace.searchWorkflows('', {}, 2, 10);
      
      expect(page1.workflows).toHaveLength(10);
      expect(page2.workflows).toHaveLength(10);
      expect(page1.hasMore).toBe(true);
      expect(page2.hasMore).toBe(true);
    });

    it('should sort search results correctly', () => {
      // Create workflows with different ratings
      const workflows = [];
      for (let i = 0; i < 3; i++) {
        const workflow = createMockWorkflow(`workflow-${i}`);
        const published = marketplace.publishWorkflow(
          workflow,
          { id: `author-${i}`, name: `Author ${i}`, verified: false },
          'Test',
          [],
          { type: 'free' },
          { minVersion: '1.0.0', dependencies: [], permissions: [] }
        );
        published.status = 'published';
        published.stats.rating = 5 - i; // 5, 4, 3
        workflows.push(published);
      }

      const results = marketplace.searchWorkflows('', {}, 1, 10, 'rating');
      
      expect(results.workflows[0].stats.rating).toBe(5);
      expect(results.workflows[1].stats.rating).toBe(4);
      expect(results.workflows[2].stats.rating).toBe(3);
    });
  });

  describe('Workflow Management', () => {
    let publishedWorkflow: MarketplaceWorkflow;

    beforeEach(() => {
      publishedWorkflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );
    });

    it('should get workflow by ID', () => {
      const workflow = marketplace.getWorkflow(publishedWorkflow.id);
      
      expect(workflow).toBeDefined();
      expect(workflow?.id).toBe(publishedWorkflow.id);
    });

    it('should return null for non-existent workflow', () => {
      const workflow = marketplace.getWorkflow('non-existent');
      
      expect(workflow).toBeNull();
    });

    it('should get featured workflows', () => {
      publishedWorkflow.featured = true;
      publishedWorkflow.status = 'published';
      
      const featured = marketplace.getFeaturedWorkflows();
      
      expect(featured).toHaveLength(1);
      expect(featured[0].id).toBe(publishedWorkflow.id);
    });

    it('should get trending workflows', () => {
      publishedWorkflow.trending = true;
      publishedWorkflow.status = 'published';
      
      const trending = marketplace.getTrendingWorkflows();
      
      expect(trending).toHaveLength(1);
      expect(trending[0].id).toBe(publishedWorkflow.id);
    });

    it('should get workflows by category', () => {
      publishedWorkflow.status = 'published';
      
      const workflows = marketplace.getWorkflowsByCategory('Healthcare');
      
      expect(workflows).toHaveLength(1);
      expect(workflows[0].category).toBe('Healthcare');
    });

    it('should get workflows by author', () => {
      publishedWorkflow.status = 'published';
      
      const workflows = marketplace.getWorkflowsByAuthor('author-1');
      
      expect(workflows).toHaveLength(1);
      expect(workflows[0].author.id).toBe('author-1');
    });
  });

  describe('Reviews', () => {
    let publishedWorkflow: MarketplaceWorkflow;

    beforeEach(() => {
      publishedWorkflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );
      publishedWorkflow.status = 'published';
    });

    it('should add a review to a workflow', () => {
      const review = marketplace.addReview(
        publishedWorkflow.id,
        'user-1',
        'Reviewer',
        undefined,
        5,
        'Great workflow!',
        'This workflow is very useful for healthcare data processing.'
      );

      expect(review).toBeDefined();
      expect(review?.workflowId).toBe(publishedWorkflow.id);
      expect(review?.rating).toBe(5);
      expect(review?.title).toBe('Great workflow!');
      expect(review?.comment).toBe('This workflow is very useful for healthcare data processing.');
    });

    it('should return null for non-existent workflow', () => {
      const review = marketplace.addReview(
        'non-existent',
        'user-1',
        'Reviewer',
        undefined,
        5,
        'Great workflow!',
        'This workflow is very useful.'
      );

      expect(review).toBeNull();
    });

    it('should get reviews for a workflow', () => {
      marketplace.addReview(
        publishedWorkflow.id,
        'user-1',
        'Reviewer 1',
        undefined,
        5,
        'Great workflow!',
        'This workflow is very useful.'
      );
      
      marketplace.addReview(
        publishedWorkflow.id,
        'user-2',
        'Reviewer 2',
        undefined,
        4,
        'Good workflow',
        'This workflow is helpful.'
      );

      const reviews = marketplace.getWorkflowReviews(publishedWorkflow.id);
      
      expect(reviews).toHaveLength(2);
      expect(reviews[0].rating).toBe(5);
      expect(reviews[1].rating).toBe(4);
    });

    it('should rate a review as helpful', () => {
      const review = marketplace.addReview(
        publishedWorkflow.id,
        'user-1',
        'Reviewer',
        undefined,
        5,
        'Great workflow!',
        'This workflow is very useful.'
      );

      const success = marketplace.rateReview(review!.id, publishedWorkflow.id, true);
      
      expect(success).toBe(true);
      
      const reviews = marketplace.getWorkflowReviews(publishedWorkflow.id);
      expect(reviews[0].helpful).toBe(1);
    });

    it('should update workflow stats when review is added', () => {
      marketplace.addReview(
        publishedWorkflow.id,
        'user-1',
        'Reviewer',
        undefined,
        5,
        'Great workflow!',
        'This workflow is very useful.'
      );

      const workflow = marketplace.getWorkflow(publishedWorkflow.id);
      expect(workflow?.stats.reviewCount).toBe(1);
      expect(workflow?.stats.rating).toBe(5);
    });
  });

  describe('Installation Management', () => {
    let publishedWorkflow: MarketplaceWorkflow;

    beforeEach(() => {
      publishedWorkflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );
      publishedWorkflow.status = 'published';
    });

    it('should install a workflow', () => {
      const installation = marketplace.installWorkflow(
        publishedWorkflow.id,
        'user-1',
        '/workflows/test'
      );

      expect(installation).toBeDefined();
      expect(installation?.workflowId).toBe(publishedWorkflow.id);
      expect(installation?.userId).toBe('user-1');
      expect(installation?.status).toBe('installed');
    });

    it('should return null for non-existent workflow', () => {
      const installation = marketplace.installWorkflow(
        'non-existent',
        'user-1',
        '/workflows/test'
      );

      expect(installation).toBeNull();
    });

    it('should uninstall a workflow', () => {
      marketplace.installWorkflow(publishedWorkflow.id, 'user-1', '/workflows/test');
      
      const success = marketplace.uninstallWorkflow(publishedWorkflow.id, 'user-1');
      
      expect(success).toBe(true);
    });

    it('should get user installations', () => {
      marketplace.installWorkflow(publishedWorkflow.id, 'user-1', '/workflows/test');
      
      const installations = marketplace.getUserInstallations('user-1');
      
      expect(installations).toHaveLength(1);
      expect(installations[0].workflowId).toBe(publishedWorkflow.id);
    });

    it('should update workflow stats when installed', () => {
      const initialDownloads = publishedWorkflow.stats.downloads;
      
      marketplace.installWorkflow(publishedWorkflow.id, 'user-1', '/workflows/test');
      
      const workflow = marketplace.getWorkflow(publishedWorkflow.id);
      expect(workflow?.stats.downloads).toBe(initialDownloads + 1);
    });
  });

  describe('Dependencies', () => {
    let publishedWorkflow: MarketplaceWorkflow;

    beforeEach(() => {
      publishedWorkflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );
    });

    it('should add workflow dependencies', () => {
      const dependencies: WorkflowDependency[] = [
        {
          id: 'dep-1',
          name: 'AI Model',
          version: '1.0.0',
          type: 'library',
          required: true,
          description: 'Required AI model for processing'
        }
      ];

      const success = marketplace.addDependencies(publishedWorkflow.id, dependencies);
      
      expect(success).toBe(true);
      
      const retrievedDeps = marketplace.getWorkflowDependencies(publishedWorkflow.id);
      expect(retrievedDeps).toHaveLength(1);
      expect(retrievedDeps[0].name).toBe('AI Model');
    });

    it('should return empty array for workflow without dependencies', () => {
      const dependencies = marketplace.getWorkflowDependencies(publishedWorkflow.id);
      
      expect(dependencies).toHaveLength(0);
    });
  });

  describe('Marketplace Statistics', () => {
    beforeEach(() => {
      // Create some published workflows
      for (let i = 0; i < 3; i++) {
        const workflow = createMockWorkflow(`workflow-${i}`);
        const published = marketplace.publishWorkflow(
          workflow,
          { id: `author-${i}`, name: `Author ${i}`, verified: false },
          'Test',
          [],
          { type: 'free' },
          { minVersion: '1.0.0', dependencies: [], permissions: [] }
        );
        published.status = 'published';
        published.stats = {
          downloads: 100 + i * 50,
          likes: 10 + i * 5,
          views: 1000 + i * 200,
          rating: 4 + i * 0.5,
          reviewCount: 5 + i * 2
        };
      }
    });

    it('should get marketplace statistics', () => {
      const stats = marketplace.getMarketplaceStats();
      
      expect(stats.totalWorkflows).toBe(3);
      expect(stats.totalDownloads).toBe(450); // 100 + 150 + 200
      expect(stats.totalReviews).toBe(21); // 5 + 7 + 9
      expect(stats.averageRating).toBe(4.5); // (4 + 4.5 + 5) / 3
      expect(stats.categories).toBe(1);
      expect(stats.tags).toBe(0);
    });
  });

  describe('Event Emission', () => {
    let eventSpy: jest.SpyInstance;

    beforeEach(() => {
      eventSpy = jest.fn();
      marketplace.on('workflow-published', eventSpy);
    });

    it('should emit workflow-published event', () => {
      marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );

      expect(eventSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    });

    it('should emit review-added event', () => {
      const workflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );
      workflow.status = 'published';

      const reviewSpy = jest.fn();
      marketplace.on('review-added', reviewSpy);

      marketplace.addReview(
        workflow.id,
        'user-1',
        'Reviewer',
        undefined,
        5,
        'Great workflow!',
        'This workflow is very useful.'
      );

      expect(reviewSpy).toHaveBeenCalledWith(workflow.id, expect.any(Object));
    });

    it('should emit workflow-installed event', () => {
      const workflow = marketplace.publishWorkflow(
        mockWorkflow,
        { id: 'author-1', name: 'Test Author', verified: true },
        'Healthcare',
        ['AI'],
        { type: 'free' },
        { minVersion: '1.0.0', dependencies: [], permissions: [] }
      );
      workflow.status = 'published';

      const installSpy = jest.fn();
      marketplace.on('workflow-installed', installSpy);

      marketplace.installWorkflow(workflow.id, 'user-1', '/workflows/test');

      expect(installSpy).toHaveBeenCalledWith(workflow.id, expect.any(Object));
    });
  });
});

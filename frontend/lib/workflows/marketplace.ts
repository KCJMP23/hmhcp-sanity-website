import { EventEmitter } from 'events';
import { WorkflowDefinition } from '../types/workflows/visual-builder';

export interface MarketplaceWorkflow {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  category: string;
  tags: string[];
  version: string;
  workflow: WorkflowDefinition;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    complexity: number;
    estimatedExecutionTime: number;
    lastModified: Date;
    checksum: string;
  };
  stats: {
    downloads: number;
    likes: number;
    views: number;
    rating: number;
    reviewCount: number;
  };
  pricing: {
    type: 'free' | 'paid' | 'subscription';
    price?: number;
    currency?: string;
    subscriptionPeriod?: 'monthly' | 'yearly';
  };
  requirements: {
    minVersion: string;
    dependencies: string[];
    permissions: string[];
  };
  status: 'published' | 'draft' | 'archived' | 'pending_review';
  publishedAt: Date;
  updatedAt: Date;
  featured: boolean;
  trending: boolean;
}

export interface WorkflowReview {
  id: string;
  workflowId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
  verified: boolean;
}

export interface WorkflowDependency {
  id: string;
  name: string;
  version: string;
  type: 'workflow' | 'node' | 'library';
  required: boolean;
  description?: string;
  downloadUrl?: string;
}

export interface MarketplaceSearchFilters {
  category?: string;
  tags?: string[];
  pricing?: ('free' | 'paid' | 'subscription')[];
  rating?: {
    min: number;
    max: number;
  };
  author?: string;
  featured?: boolean;
  trending?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface MarketplaceSearchResult {
  workflows: MarketplaceWorkflow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  facets: {
    categories: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    authors: Array<{ name: string; count: number }>;
    pricing: Array<{ type: string; count: number }>;
  };
}

export interface WorkflowInstallation {
  id: string;
  workflowId: string;
  userId: string;
  installedAt: Date;
  version: string;
  status: 'installed' | 'updating' | 'failed' | 'uninstalled';
  dependencies: WorkflowDependency[];
  localPath: string;
}

export interface WorkflowUpdate {
  id: string;
  workflowId: string;
  currentVersion: string;
  newVersion: string;
  changelog: string;
  breakingChanges: boolean;
  requiresMigration: boolean;
  availableAt: Date;
  installed: boolean;
}

export class WorkflowMarketplace extends EventEmitter {
  private workflows: Map<string, MarketplaceWorkflow> = new Map();
  private reviews: Map<string, WorkflowReview[]> = new Map();
  private installations: Map<string, WorkflowInstallation[]> = new Map();
  private dependencies: Map<string, WorkflowDependency[]> = new Map();
  private categories: Set<string> = new Set();
  private tags: Set<string> = new Set();

  /**
   * Publish a workflow to the marketplace
   */
  public publishWorkflow(
    workflow: WorkflowDefinition,
    author: MarketplaceWorkflow['author'],
    category: string,
    tags: string[],
    pricing: MarketplaceWorkflow['pricing'],
    requirements: MarketplaceWorkflow['requirements']
  ): MarketplaceWorkflow {
    const workflowId = this.generateWorkflowId();
    const now = new Date();
    
    const marketplaceWorkflow: MarketplaceWorkflow = {
      id: workflowId,
      name: workflow.name,
      description: workflow.description || '',
      author,
      category,
      tags,
      version: '1.0.0',
      workflow,
      metadata: this.calculateWorkflowMetadata(workflow),
      stats: {
        downloads: 0,
        likes: 0,
        views: 0,
        rating: 0,
        reviewCount: 0
      },
      pricing,
      requirements,
      status: 'pending_review',
      publishedAt: now,
      updatedAt: now,
      featured: false,
      trending: false
    };

    this.workflows.set(workflowId, marketplaceWorkflow);
    this.reviews.set(workflowId, []);
    this.installations.set(workflowId, []);
    this.dependencies.set(workflowId, []);
    
    this.categories.add(category);
    tags.forEach(tag => this.tags.add(tag));

    this.emit('workflow-published', workflowId, marketplaceWorkflow);
    return marketplaceWorkflow;
  }

  /**
   * Search workflows in the marketplace
   */
  public searchWorkflows(
    query: string = '',
    filters: MarketplaceSearchFilters = {},
    page: number = 1,
    pageSize: number = 20,
    sortBy: 'relevance' | 'rating' | 'downloads' | 'newest' | 'trending' = 'relevance'
  ): MarketplaceSearchResult {
    let results = Array.from(this.workflows.values())
      .filter(workflow => workflow.status === 'published');

    // Apply text search
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      results = results.filter(workflow => {
        const searchableText = [
          workflow.name,
          workflow.description,
          workflow.author.name,
          ...workflow.tags
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply filters
    if (filters.category) {
      results = results.filter(workflow => workflow.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(workflow => 
        filters.tags!.some(tag => workflow.tags.includes(tag))
      );
    }

    if (filters.pricing && filters.pricing.length > 0) {
      results = results.filter(workflow => 
        filters.pricing!.includes(workflow.pricing.type)
      );
    }

    if (filters.rating) {
      results = results.filter(workflow => 
        workflow.stats.rating >= filters.rating!.min && 
        workflow.stats.rating <= filters.rating!.max
      );
    }

    if (filters.author) {
      results = results.filter(workflow => 
        workflow.author.name.toLowerCase().includes(filters.author!.toLowerCase())
      );
    }

    if (filters.featured) {
      results = results.filter(workflow => workflow.featured);
    }

    if (filters.trending) {
      results = results.filter(workflow => workflow.trending);
    }

    if (filters.dateRange) {
      results = results.filter(workflow => 
        workflow.publishedAt >= filters.dateRange!.from && 
        workflow.publishedAt <= filters.dateRange!.to
      );
    }

    // Sort results
    results = this.sortWorkflows(results, sortBy);

    // Paginate results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Calculate facets
    const facets = this.calculateFacets(results);

    return {
      workflows: paginatedResults,
      total: results.length,
      page,
      pageSize,
      hasMore: endIndex < results.length,
      facets
    };
  }

  /**
   * Get workflow by ID
   */
  public getWorkflow(workflowId: string): MarketplaceWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get featured workflows
   */
  public getFeaturedWorkflows(limit: number = 10): MarketplaceWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.status === 'published' && workflow.featured)
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .slice(0, limit);
  }

  /**
   * Get trending workflows
   */
  public getTrendingWorkflows(limit: number = 10): MarketplaceWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.status === 'published' && workflow.trending)
      .sort((a, b) => b.stats.downloads - a.stats.downloads)
      .slice(0, limit);
  }

  /**
   * Get workflows by category
   */
  public getWorkflowsByCategory(category: string, limit: number = 20): MarketplaceWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.status === 'published' && workflow.category === category)
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .slice(0, limit);
  }

  /**
   * Get workflows by author
   */
  public getWorkflowsByAuthor(authorId: string, limit: number = 20): MarketplaceWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.status === 'published' && workflow.author.id === authorId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Add a review to a workflow
   */
  public addReview(
    workflowId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    rating: number,
    title: string,
    comment: string
  ): WorkflowReview | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const review: WorkflowReview = {
      id: this.generateReviewId(),
      workflowId,
      userId,
      userName,
      userAvatar,
      rating,
      title,
      comment,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false
    };

    const reviews = this.reviews.get(workflowId) || [];
    reviews.push(review);
    this.reviews.set(workflowId, reviews);

    // Update workflow stats
    this.updateWorkflowStats(workflowId);

    this.emit('review-added', workflowId, review);
    return review;
  }

  /**
   * Get reviews for a workflow
   */
  public getWorkflowReviews(workflowId: string, page: number = 1, pageSize: number = 10): WorkflowReview[] {
    const reviews = this.reviews.get(workflowId) || [];
    const startIndex = (page - 1) * pageSize;
    return reviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(startIndex, startIndex + pageSize);
  }

  /**
   * Rate a review as helpful or not helpful
   */
  public rateReview(reviewId: string, workflowId: string, helpful: boolean): boolean {
    const reviews = this.reviews.get(workflowId);
    if (!reviews) return false;

    const review = reviews.find(r => r.id === reviewId);
    if (!review) return false;

    if (helpful) {
      review.helpful++;
    } else {
      review.notHelpful++;
    }

    this.emit('review-rated', workflowId, reviewId, helpful);
    return true;
  }

  /**
   * Install a workflow
   */
  public installWorkflow(
    workflowId: string,
    userId: string,
    localPath: string
  ): WorkflowInstallation | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const installation: WorkflowInstallation = {
      id: this.generateInstallationId(),
      workflowId,
      userId,
      installedAt: new Date(),
      version: workflow.version,
      status: 'installed',
      dependencies: this.dependencies.get(workflowId) || [],
      localPath
    };

    const installations = this.installations.get(workflowId) || [];
    installations.push(installation);
    this.installations.set(workflowId, installations);

    // Update workflow stats
    workflow.stats.downloads++;
    this.updateWorkflowStats(workflowId);

    this.emit('workflow-installed', workflowId, installation);
    return installation;
  }

  /**
   * Uninstall a workflow
   */
  public uninstallWorkflow(workflowId: string, userId: string): boolean {
    const installations = this.installations.get(workflowId);
    if (!installations) return false;

    const installation = installations.find(i => i.userId === userId);
    if (!installation) return false;

    installation.status = 'uninstalled';
    this.emit('workflow-uninstalled', workflowId, installation);
    return true;
  }

  /**
   * Get user's installed workflows
   */
  public getUserInstallations(userId: string): WorkflowInstallation[] {
    const allInstallations: WorkflowInstallation[] = [];
    for (const installations of this.installations.values()) {
      allInstallations.push(...installations.filter(i => i.userId === userId && i.status === 'installed'));
    }
    return allInstallations;
  }

  /**
   * Check for workflow updates
   */
  public checkForUpdates(userId: string): WorkflowUpdate[] {
    const userInstallations = this.getUserInstallations(userId);
    const updates: WorkflowUpdate[] = [];

    for (const installation of userInstallations) {
      const workflow = this.workflows.get(installation.workflowId);
      if (!workflow) continue;

      if (workflow.version !== installation.version) {
        updates.push({
          id: this.generateUpdateId(),
          workflowId: installation.workflowId,
          currentVersion: installation.version,
          newVersion: workflow.version,
          changelog: `Updated to version ${workflow.version}`,
          breakingChanges: false,
          requiresMigration: false,
          availableAt: workflow.updatedAt,
          installed: false
        });
      }
    }

    return updates;
  }

  /**
   * Update a workflow
   */
  public updateWorkflow(workflowId: string, userId: string): boolean {
    const installation = this.getUserInstallations(userId)
      .find(i => i.workflowId === workflowId);
    
    if (!installation) return false;

    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    installation.version = workflow.version;
    installation.status = 'installed';

    this.emit('workflow-updated', workflowId, installation);
    return true;
  }

  /**
   * Add workflow dependencies
   */
  public addDependencies(workflowId: string, dependencies: WorkflowDependency[]): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    this.dependencies.set(workflowId, dependencies);
    this.emit('dependencies-added', workflowId, dependencies);
    return true;
  }

  /**
   * Get workflow dependencies
   */
  public getWorkflowDependencies(workflowId: string): WorkflowDependency[] {
    return this.dependencies.get(workflowId) || [];
  }

  /**
   * Get all categories
   */
  public getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  /**
   * Get all tags
   */
  public getTags(): string[] {
    return Array.from(this.tags).sort();
  }

  /**
   * Get marketplace statistics
   */
  public getMarketplaceStats() {
    const workflows = Array.from(this.workflows.values());
    const publishedWorkflows = workflows.filter(w => w.status === 'published');
    
    return {
      totalWorkflows: publishedWorkflows.length,
      totalDownloads: publishedWorkflows.reduce((sum, w) => sum + w.stats.downloads, 0),
      totalReviews: publishedWorkflows.reduce((sum, w) => sum + w.stats.reviewCount, 0),
      averageRating: publishedWorkflows.length > 0 
        ? publishedWorkflows.reduce((sum, w) => sum + w.stats.rating, 0) / publishedWorkflows.length 
        : 0,
      categories: this.categories.size,
      tags: this.tags.size
    };
  }

  /**
   * Update workflow stats
   */
  private updateWorkflowStats(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    const reviews = this.reviews.get(workflowId) || [];
    
    if (!workflow) return;

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      workflow.stats.rating = totalRating / reviews.length;
      workflow.stats.reviewCount = reviews.length;
    }
  }

  /**
   * Sort workflows
   */
  private sortWorkflows(workflows: MarketplaceWorkflow[], sortBy: string): MarketplaceWorkflow[] {
    switch (sortBy) {
      case 'rating':
        return workflows.sort((a, b) => b.stats.rating - a.stats.rating);
      case 'downloads':
        return workflows.sort((a, b) => b.stats.downloads - a.stats.downloads);
      case 'newest':
        return workflows.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      case 'trending':
        return workflows.sort((a, b) => b.stats.views - a.stats.views);
      default:
        return workflows;
    }
  }

  /**
   * Calculate facets for search results
   */
  private calculateFacets(workflows: MarketplaceWorkflow[]) {
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    const authors = new Map<string, number>();
    const pricing = new Map<string, number>();

    workflows.forEach(workflow => {
      // Categories
      categories.set(workflow.category, (categories.get(workflow.category) || 0) + 1);
      
      // Tags
      workflow.tags.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
      
      // Authors
      authors.set(workflow.author.name, (authors.get(workflow.author.name) || 0) + 1);
      
      // Pricing
      pricing.set(workflow.pricing.type, (pricing.get(workflow.pricing.type) || 0) + 1);
    });

    return {
      categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })),
      tags: Array.from(tags.entries()).map(([name, count]) => ({ name, count })),
      authors: Array.from(authors.entries()).map(([name, count]) => ({ name, count })),
      pricing: Array.from(pricing.entries()).map(([type, count]) => ({ type, count }))
    };
  }

  /**
   * Calculate workflow metadata
   */
  private calculateWorkflowMetadata(workflow: WorkflowDefinition) {
    const nodeCount = workflow.nodes.length;
    const edgeCount = workflow.edges.length;
    const complexity = this.calculateComplexity(workflow);
    const estimatedExecutionTime = this.estimateExecutionTime(workflow);
    
    return {
      nodeCount,
      edgeCount,
      complexity,
      estimatedExecutionTime,
      lastModified: new Date(),
      checksum: this.calculateChecksum(workflow)
    };
  }

  /**
   * Calculate workflow complexity
   */
  private calculateComplexity(workflow: WorkflowDefinition): number {
    let complexity = workflow.nodes.length;
    
    // Add complexity for conditional nodes
    const conditionalNodes = workflow.nodes.filter(n => 
      ['if', 'switch', 'loop'].includes(n.type)
    );
    complexity += conditionalNodes.length * 2;
    
    return complexity;
  }

  /**
   * Estimate execution time
   */
  private estimateExecutionTime(workflow: WorkflowDefinition): number {
    let estimatedTime = 0;
    
    workflow.nodes.forEach(node => {
      switch (node.type) {
        case 'dataProcessor':
          estimatedTime += 100;
          break;
        case 'aiAgent':
          estimatedTime += 2000;
          break;
        case 'if':
        case 'switch':
          estimatedTime += 50;
          break;
        case 'loop':
          estimatedTime += 500;
          break;
        default:
          estimatedTime += 100;
      }
    });
    
    return estimatedTime;
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(workflow: WorkflowDefinition): string {
    const content = JSON.stringify(workflow, null, 0);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique review ID
   */
  private generateReviewId(): string {
    return `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique installation ID
   */
  private generateInstallationId(): string {
    return `install-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique update ID
   */
  private generateUpdateId(): string {
    return `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

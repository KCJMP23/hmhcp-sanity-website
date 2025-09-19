/**
 * Healthcare Content Automation AI Agent Orchestrator
 * Manages multiple AI agents for comprehensive content pipeline
 */

import { EventEmitter } from 'events';
import {
  HealthcareAgent,
  AgentStatus,
  WorkflowConfig,
  WorkflowExecutionContext,
  AgentMessage,
  WorkflowResult,
  AgentCapability,
  ExecutionMode,
  RecoveryStrategy,
  NotificationChannel
} from './healthcare-types';
import { ResearchAgent } from './specialized/research-agent';
import { ContentGenerationAgent } from './specialized/content-agent';
import { SEOOptimizationAgent } from './specialized/seo-agent';
import { ImageGenerationAgent } from './specialized/image-agent';
import { SocialMediaAgent } from './specialized/social-agent';
import { QualityAssuranceAgent } from './specialized/qa-agent';
import { PublishingAgent } from './specialized/publishing-agent';
import { StateManager } from './state/state-manager';
import { ErrorRecovery } from './recovery/error-recovery';
import { NotificationService } from './notifications/notification-service';
import { MetricsCollector } from './monitoring/metrics-collector';
import { ComplianceValidator } from './compliance/healthcare-validator';

export class HealthcareOrchestrator extends EventEmitter {
  private agents: Map<string, HealthcareAgent>;
  private stateManager: StateManager;
  private errorRecovery: ErrorRecovery;
  private notificationService: NotificationService;
  private metricsCollector: MetricsCollector;
  private complianceValidator: ComplianceValidator;
  private activeWorkflows: Map<string, WorkflowExecutionContext>;
  private executionQueue: Array<{ workflowId: string; priority: number }>;
  private isProcessing: boolean = false;

  constructor() {
    super();
    this.agents = new Map();
    this.activeWorkflows = new Map();
    this.executionQueue = [];
    
    // Initialize core services
    this.stateManager = new StateManager();
    this.errorRecovery = new ErrorRecovery();
    this.notificationService = new NotificationService();
    this.metricsCollector = new MetricsCollector();
    this.complianceValidator = new ComplianceValidator();
    
    this.initializeAgents();
    this.setupEventHandlers();
  }

  /**
   * Initialize all specialized agents
   */
  private initializeAgents(): void {
    // Research Agent with Perplexity AI
    this.registerAgent(new ResearchAgent({
      id: 'research-agent',
      name: 'Healthcare Research Agent',
      capabilities: [AgentCapability.RESEARCH, AgentCapability.FACT_CHECKING],
      apiConfig: {
        provider: 'perplexity',
        apiKey: process.env.PERPLEXITY_API_KEY!,
        model: 'pplx-70b-online',
        maxRetries: 3,
        timeout: 30000
      }
    }));

    // Content Generation Agent with Claude AI
    this.registerAgent(new ContentGenerationAgent({
      id: 'content-agent',
      name: 'Healthcare Content Generator',
      capabilities: [AgentCapability.CONTENT_GENERATION, AgentCapability.HEALTHCARE_WRITING],
      apiConfig: {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY!,
        model: 'claude-3-opus-20240229',
        maxRetries: 3,
        timeout: 60000
      },
      healthcareConfig: {
        complianceLevel: 'HIPAA',
        medicalAccuracy: true,
        citationRequired: true
      }
    }));

    // SEO Optimization Agent with DataForSEO
    this.registerAgent(new SEOOptimizationAgent({
      id: 'seo-agent',
      name: 'SEO Optimizer',
      capabilities: [AgentCapability.SEO_ANALYSIS, AgentCapability.KEYWORD_RESEARCH],
      apiConfig: {
        provider: 'dataforseo',
        apiKey: process.env.DATAFORSEO_API_KEY!,
        endpoints: {
          keywords: 'https://api.dataforseo.com/v3/keywords_data',
          serp: 'https://api.dataforseo.com/v3/serp',
          onPage: 'https://api.dataforseo.com/v3/on_page'
        }
      }
    }));

    // Image Generation Agent with DALL-E
    this.registerAgent(new ImageGenerationAgent({
      id: 'image-agent',
      name: 'Medical Image Generator',
      capabilities: [AgentCapability.IMAGE_GENERATION, AgentCapability.MEDICAL_VISUALIZATION],
      apiConfig: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
        model: 'dall-e-3',
        fallbackProvider: 'midjourney',
        fallbackApiKey: process.env.MIDJOURNEY_API_KEY
      },
      imageConfig: {
        style: 'professional-medical',
        watermark: true,
        compliance: 'healthcare-safe'
      }
    }));

    // Social Media Agent
    this.registerAgent(new SocialMediaAgent({
      id: 'social-agent',
      name: 'Social Media Manager',
      capabilities: [AgentCapability.SOCIAL_MEDIA, AgentCapability.CONTENT_ADAPTATION],
      platforms: ['linkedin', 'twitter', 'facebook', 'instagram'],
      apiConfig: {
        buffer: process.env.BUFFER_API_KEY,
        hootsuite: process.env.HOOTSUITE_API_KEY
      }
    }));

    // Quality Assurance Agent
    this.registerAgent(new QualityAssuranceAgent({
      id: 'qa-agent',
      name: 'Content Quality Validator',
      capabilities: [AgentCapability.QUALITY_ASSURANCE, AgentCapability.COMPLIANCE_CHECK],
      validationRules: {
        medicalAccuracy: true,
        factChecking: true,
        readabilityScore: 60,
        complianceCheck: ['HIPAA', 'FDA', 'FTC']
      }
    }));

    // Publishing Agent
    this.registerAgent(new PublishingAgent({
      id: 'publishing-agent',
      name: 'Content Publisher',
      capabilities: [AgentCapability.PUBLISHING, AgentCapability.DISTRIBUTION],
      platforms: {
        wordpress: process.env.WORDPRESS_API_KEY,
        medium: process.env.MEDIUM_API_KEY,
        customCMS: process.env.CMS_API_ENDPOINT
      }
    }));
  }

  /**
   * Register an agent with the orchestrator
   */
  private registerAgent(agent: HealthcareAgent): void {
    this.agents.set(agent.config.id, agent);
    
    // Set up agent event listeners
    agent.on('status-change', (status: AgentStatus) => {
      this.handleAgentStatusChange(agent.config.id, status);
    });
    
    agent.on('error', (error: Error) => {
      this.handleAgentError(agent.config.id, error);
    });
    
    agent.on('progress', (progress: number) => {
      this.emit('agent-progress', { agentId: agent.config.id, progress });
    });
  }

  /**
   * Execute a workflow with specified configuration
   */
  public async executeWorkflow(config: WorkflowConfig): Promise<WorkflowResult> {
    const workflowId = this.generateWorkflowId();
    const startTime = Date.now();
    
    try {
      // Initialize workflow context
      const context: WorkflowExecutionContext = {
        workflowId,
        config,
        status: 'initializing',
        startTime,
        currentStep: 0,
        steps: this.planWorkflowSteps(config),
        state: {},
        artifacts: [],
        logs: [],
        errors: [],
        metrics: {
          startTime,
          agentExecutions: [],
          apiCalls: 0,
          tokensUsed: 0,
          costs: 0
        }
      };

      this.activeWorkflows.set(workflowId, context);
      this.emit('workflow-started', { workflowId, config });

      // Validate healthcare compliance if required
      if (config.requiresCompliance) {
        await this.validateCompliance(context);
      }

      // Execute workflow based on mode
      let result: WorkflowResult;
      if (config.executionMode === ExecutionMode.SEQUENTIAL) {
        result = await this.executeSequential(context);
      } else if (config.executionMode === ExecutionMode.PARALLEL) {
        result = await this.executeParallel(context);
      } else {
        result = await this.executeHybrid(context);
      }

      // Post-processing and quality checks
      if (config.qualityAssurance) {
        await this.performQualityAssurance(result);
      }

      // Store results and metrics
      await this.stateManager.saveWorkflowResult(workflowId, result);
      await this.metricsCollector.recordWorkflow(context);

      this.emit('workflow-completed', { workflowId, result });
      return result;

    } catch (error) {
      return await this.handleWorkflowError(workflowId, error as Error);
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeSequential(context: WorkflowExecutionContext): Promise<WorkflowResult> {
    const results: any[] = [];
    
    for (let i = 0; i < context.steps.length; i++) {
      const step = context.steps[i];
      context.currentStep = i;
      context.status = 'executing';
      
      this.emit('step-started', { 
        workflowId: context.workflowId, 
        step: step.name, 
        index: i 
      });

      try {
        // Execute step with timeout
        const stepResult = await this.executeStep(step, context);
        results.push(stepResult);
        
        // Update context with step results
        context.state[step.name] = stepResult;
        context.artifacts.push(...(stepResult.artifacts || []));
        
        this.emit('step-completed', { 
          workflowId: context.workflowId, 
          step: step.name, 
          result: stepResult 
        });

      } catch (error) {
        // Handle step failure with recovery
        const recovered = await this.attemptRecovery(step, context, error as Error);
        if (!recovered) {
          throw error;
        }
        results.push(recovered);
      }

      // Check for workflow cancellation
      if (context.status === 'cancelled') {
        break;
      }
    }

    return this.compileWorkflowResult(context, results);
  }

  /**
   * Execute workflow steps in parallel
   */
  private async executeParallel(context: WorkflowExecutionContext): Promise<WorkflowResult> {
    context.status = 'executing';
    
    // Group steps by dependency level
    const dependencyGroups = this.groupStepsByDependencies(context.steps);
    const results: any[] = [];

    for (const group of dependencyGroups) {
      // Execute all steps in the group simultaneously
      const groupPromises = group.map(step => 
        this.executeStep(step, context).catch(error => 
          this.attemptRecovery(step, context, error)
        )
      );

      const groupResults = await Promise.allSettled(groupPromises);
      
      // Process results and handle failures
      for (let i = 0; i < groupResults.length; i++) {
        const result = groupResults[i];
        const step = group[i];
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
          context.state[step.name] = result.value;
        } else {
          context.errors.push({
            step: step.name,
            error: result.reason,
            timestamp: Date.now()
          });
          
          if (step.critical) {
            throw new Error(`Critical step failed: ${step.name}`);
          }
        }
      }
    }

    return this.compileWorkflowResult(context, results);
  }

  /**
   * Execute workflow with hybrid approach (parallel where possible)
   */
  private async executeHybrid(context: WorkflowExecutionContext): Promise<WorkflowResult> {
    const executionPlan = this.optimizeExecutionPlan(context.steps);
    const results: any[] = [];

    for (const phase of executionPlan) {
      if (phase.parallel) {
        // Execute phase steps in parallel
        const phaseResults = await Promise.all(
          phase.steps.map(step => this.executeStep(step, context))
        );
        results.push(...phaseResults);
      } else {
        // Execute phase steps sequentially
        for (const step of phase.steps) {
          const stepResult = await this.executeStep(step, context);
          results.push(stepResult);
        }
      }
    }

    return this.compileWorkflowResult(context, results);
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: any, context: WorkflowExecutionContext): Promise<any> {
    const agent = this.agents.get(step.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${step.agentId}`);
    }

    // Prepare agent input from context
    const input = this.prepareAgentInput(step, context);
    
    // Record metrics
    const startTime = Date.now();
    context.metrics.agentExecutions.push({
      agentId: step.agentId,
      step: step.name,
      startTime
    });

    try {
      // Execute agent task
      const result = await agent.execute(input);
      
      // Update metrics
      const execution = context.metrics.agentExecutions[context.metrics.agentExecutions.length - 1];
      execution.endTime = Date.now();
      execution.duration = execution.endTime - startTime;
      execution.success = true;
      
      // Update API and token metrics if available
      if (result.metrics) {
        context.metrics.apiCalls += result.metrics.apiCalls || 0;
        context.metrics.tokensUsed += result.metrics.tokensUsed || 0;
        context.metrics.costs += result.metrics.costs || 0;
      }

      return result;
      
    } catch (error) {
      // Update metrics for failure
      const execution = context.metrics.agentExecutions[context.metrics.agentExecutions.length - 1];
      execution.endTime = Date.now();
      execution.duration = execution.endTime - startTime;
      execution.success = false;
      execution.error = (error as Error).message;
      
      throw error;
    }
  }

  /**
   * Attempt to recover from a step failure
   */
  private async attemptRecovery(step: any, context: WorkflowExecutionContext, error: Error): Promise<any> {
    const recoveryStrategy = step.recoveryStrategy || context.config.defaultRecoveryStrategy;
    
    this.emit('recovery-attempt', { 
      workflowId: context.workflowId, 
      step: step.name, 
      error: error.message,
      strategy: recoveryStrategy 
    });

    switch (recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        return await this.retryStep(step, context, 3);
        
      case RecoveryStrategy.FALLBACK:
        return await this.executeFallback(step, context);
        
      case RecoveryStrategy.SKIP:
        this.emit('step-skipped', { 
          workflowId: context.workflowId, 
          step: step.name 
        });
        return { skipped: true, reason: error.message };
        
      case RecoveryStrategy.ALTERNATIVE:
        return await this.executeAlternative(step, context);
        
      default:
        throw error;
    }
  }

  /**
   * Retry a failed step with exponential backoff
   */
  private async retryStep(step: any, context: WorkflowExecutionContext, maxRetries: number): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Exponential backoff
        if (attempt > 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await this.delay(delay);
        }
        
        this.emit('retry-attempt', { 
          workflowId: context.workflowId, 
          step: step.name, 
          attempt 
        });
        
        return await this.executeStep(step, context);
        
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Execute fallback agent for failed step
   */
  private async executeFallback(step: any, context: WorkflowExecutionContext): Promise<any> {
    if (!step.fallbackAgentId) {
      throw new Error(`No fallback agent configured for step: ${step.name}`);
    }
    
    const fallbackStep = {
      ...step,
      agentId: step.fallbackAgentId,
      name: `${step.name}_fallback`
    };
    
    return await this.executeStep(fallbackStep, context);
  }

  /**
   * Execute alternative workflow path
   */
  private async executeAlternative(step: any, context: WorkflowExecutionContext): Promise<any> {
    if (!step.alternativePath) {
      throw new Error(`No alternative path configured for step: ${step.name}`);
    }
    
    const alternativeSteps = step.alternativePath;
    const results = [];
    
    for (const altStep of alternativeSteps) {
      const result = await this.executeStep(altStep, context);
      results.push(result);
    }
    
    return { alternative: true, results };
  }

  /**
   * Validate healthcare compliance requirements
   */
  private async validateCompliance(context: WorkflowExecutionContext): Promise<void> {
    const validationResult = await this.complianceValidator.validate({
      content: context.config.initialContent,
      regulations: context.config.complianceRegulations || ['HIPAA'],
      strictMode: context.config.strictCompliance || false
    });

    if (!validationResult.compliant) {
      context.logs.push({
        level: 'warning',
        message: 'Compliance issues detected',
        details: validationResult.issues,
        timestamp: Date.now()
      });

      if (context.config.strictCompliance) {
        throw new Error(`Compliance validation failed: ${validationResult.issues.join(', ')}`);
      }
    }
  }

  /**
   * Perform quality assurance on workflow results
   */
  private async performQualityAssurance(result: WorkflowResult): Promise<void> {
    const qaAgent = this.agents.get('qa-agent');
    if (!qaAgent) return;

    const qaResult = await qaAgent.execute({
      content: result.finalContent,
      artifacts: result.artifacts,
      validationRules: {
        medicalAccuracy: true,
        factChecking: true,
        readabilityScore: 60
      }
    });

    if (!qaResult.passed) {
      result.qualityIssues = qaResult.issues;
      this.emit('quality-issues', { 
        workflowId: result.workflowId, 
        issues: qaResult.issues 
      });
    }
  }

  /**
   * Handle workflow errors with notifications
   */
  private async handleWorkflowError(workflowId: string, error: Error): Promise<WorkflowResult> {
    const context = this.activeWorkflows.get(workflowId);
    
    if (context) {
      context.status = 'failed';
      context.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    }

    // Send notifications
    await this.notificationService.send({
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
      priority: 'high',
      subject: `Workflow Failed: ${workflowId}`,
      message: error.message,
      details: {
        workflowId,
        error: error.stack,
        context: context?.config
      }
    });

    this.emit('workflow-failed', { workflowId, error: error.message });

    return {
      workflowId,
      success: false,
      error: error.message,
      executionTime: context ? Date.now() - context.startTime : 0,
      artifacts: context?.artifacts || [],
      logs: context?.logs || []
    };
  }

  /**
   * Handle agent status changes
   */
  private handleAgentStatusChange(agentId: string, status: AgentStatus): void {
    this.emit('agent-status', { agentId, status });
    
    // Update metrics
    this.metricsCollector.recordAgentStatus(agentId, status);
  }

  /**
   * Handle agent errors
   */
  private async handleAgentError(agentId: string, error: Error): Promise<void> {
    this.emit('agent-error', { agentId, error: error.message });
    
    // Log error
    console.error(`Agent error [${agentId}]:`, error);
    
    // Send notification for critical agents
    const agent = this.agents.get(agentId);
    if (agent && agent.config.critical) {
      await this.notificationService.send({
        channels: [NotificationChannel.SLACK],
        priority: 'high',
        subject: `Critical Agent Error: ${agentId}`,
        message: error.message
      });
    }
  }

  /**
   * Plan workflow steps based on configuration
   */
  private planWorkflowSteps(config: WorkflowConfig): any[] {
    const steps = [];
    
    // Research phase
    if (config.enableResearch) {
      steps.push({
        name: 'research',
        agentId: 'research-agent',
        critical: true,
        input: { query: config.topic, depth: config.researchDepth || 'standard' }
      });
    }
    
    // Content generation
    steps.push({
      name: 'content-generation',
      agentId: 'content-agent',
      critical: true,
      dependencies: config.enableResearch ? ['research'] : [],
      input: { 
        topic: config.topic, 
        style: config.contentStyle,
        length: config.contentLength 
      }
    });
    
    // SEO optimization
    if (config.enableSEO) {
      steps.push({
        name: 'seo-optimization',
        agentId: 'seo-agent',
        dependencies: ['content-generation'],
        input: { 
          content: '{{content-generation.output}}',
          keywords: config.targetKeywords 
        }
      });
    }
    
    // Image generation
    if (config.enableImages) {
      steps.push({
        name: 'image-generation',
        agentId: 'image-agent',
        dependencies: ['content-generation'],
        parallel: true,
        input: { 
          description: '{{content-generation.imagePrompts}}',
          count: config.imageCount || 1 
        }
      });
    }
    
    // Social media adaptation
    if (config.enableSocialMedia) {
      steps.push({
        name: 'social-media',
        agentId: 'social-agent',
        dependencies: ['content-generation', 'image-generation'],
        input: { 
          content: '{{content-generation.output}}',
          platforms: config.socialPlatforms 
        }
      });
    }
    
    // Quality assurance
    if (config.qualityAssurance) {
      steps.push({
        name: 'quality-check',
        agentId: 'qa-agent',
        critical: true,
        dependencies: ['content-generation', 'seo-optimization'],
        input: { 
          content: '{{content-generation.output}}',
          seoData: '{{seo-optimization.output}}' 
        }
      });
    }
    
    // Publishing
    if (config.autoPublish) {
      steps.push({
        name: 'publishing',
        agentId: 'publishing-agent',
        dependencies: ['quality-check'],
        input: { 
          content: '{{content-generation.output}}',
          platforms: config.publishingPlatforms,
          schedule: config.publishSchedule 
        }
      });
    }
    
    return steps;
  }

  /**
   * Group steps by dependency levels for parallel execution
   */
  private groupStepsByDependencies(steps: any[]): any[][] {
    const groups: any[][] = [];
    const processed = new Set<string>();
    
    while (processed.size < steps.length) {
      const currentGroup = [];
      
      for (const step of steps) {
        if (!processed.has(step.name)) {
          const dependencies = step.dependencies || [];
          if (dependencies.every((dep: string) => processed.has(dep))) {
            currentGroup.push(step);
          }
        }
      }
      
      if (currentGroup.length === 0) {
        throw new Error('Circular dependency detected in workflow steps');
      }
      
      groups.push(currentGroup);
      currentGroup.forEach(step => processed.add(step.name));
    }
    
    return groups;
  }

  /**
   * Optimize execution plan for hybrid mode
   */
  private optimizeExecutionPlan(steps: any[]): any[] {
    const plan: any[] = [];
    const dependencyGraph = this.buildDependencyGraph(steps);
    
    // Use topological sort to determine execution order
    const sorted = this.topologicalSort(dependencyGraph);
    
    // Group consecutive independent steps for parallel execution
    let currentPhase = { parallel: false, steps: [] as any[] };
    
    for (const stepName of sorted) {
      const step = steps.find(s => s.name === stepName);
      if (!step) continue;
      
      const canParallelize = step.parallel !== false && !step.critical;
      
      if (currentPhase.steps.length === 0) {
        currentPhase.parallel = canParallelize;
        currentPhase.steps.push(step);
      } else if (currentPhase.parallel === canParallelize) {
        currentPhase.steps.push(step);
      } else {
        plan.push(currentPhase);
        currentPhase = { parallel: canParallelize, steps: [step] };
      }
    }
    
    if (currentPhase.steps.length > 0) {
      plan.push(currentPhase);
    }
    
    return plan;
  }

  /**
   * Build dependency graph from steps
   */
  private buildDependencyGraph(steps: any[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    for (const step of steps) {
      if (!graph.has(step.name)) {
        graph.set(step.name, new Set());
      }
      
      const dependencies = step.dependencies || [];
      for (const dep of dependencies) {
        graph.get(step.name)!.add(dep);
      }
    }
    
    return graph;
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(graph: Map<string, Set<string>>): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      if (visiting.has(node)) {
        throw new Error(`Circular dependency detected at node: ${node}`);
      }
      
      visiting.add(node);
      
      const dependencies = graph.get(node) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(node);
      visited.add(node);
      result.push(node);
    };
    
    for (const node of graph.keys()) {
      visit(node);
    }
    
    return result;
  }

  /**
   * Prepare agent input from context and step configuration
   */
  private prepareAgentInput(step: any, context: WorkflowExecutionContext): any {
    const input = { ...step.input };
    
    // Replace template variables with actual values from context
    const inputStr = JSON.stringify(input);
    const replacedStr = inputStr.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueFromPath(context.state, path);
      return JSON.stringify(value);
    });
    
    return JSON.parse(replacedStr);
  }

  /**
   * Get value from nested object using path
   */
  private getValueFromPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Compile final workflow result
   */
  private compileWorkflowResult(context: WorkflowExecutionContext, results: any[]): WorkflowResult {
    const endTime = Date.now();
    
    return {
      workflowId: context.workflowId,
      success: context.errors.length === 0,
      executionTime: endTime - context.startTime,
      finalContent: this.extractFinalContent(results),
      artifacts: context.artifacts,
      logs: context.logs,
      errors: context.errors,
      metrics: {
        ...context.metrics,
        endTime,
        totalDuration: endTime - context.startTime
      },
      state: context.state
    };
  }

  /**
   * Extract final content from results
   */
  private extractFinalContent(results: any[]): any {
    // Find the primary content result (usually from content generation or publishing)
    const contentResult = results.find(r => r.type === 'content' || r.type === 'published');
    return contentResult?.content || results[results.length - 1];
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.on('workflow-started', (data) => {
      console.log(`Workflow started: ${data.workflowId}`);
      this.metricsCollector.startWorkflow(data.workflowId);
    });
    
    this.on('workflow-completed', (data) => {
      console.log(`Workflow completed: ${data.workflowId}`);
      this.metricsCollector.endWorkflow(data.workflowId);
    });
    
    this.on('workflow-failed', (data) => {
      console.error(`Workflow failed: ${data.workflowId}`, data.error);
      this.metricsCollector.recordFailure(data.workflowId, data.error);
    });
    
    this.on('step-started', (data) => {
      console.log(`Step started: ${data.step} in workflow ${data.workflowId}`);
    });
    
    this.on('step-completed', (data) => {
      console.log(`Step completed: ${data.step} in workflow ${data.workflowId}`);
    });
  }

  /**
   * Get workflow status
   */
  public getWorkflowStatus(workflowId: string): WorkflowExecutionContext | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * Cancel active workflow
   */
  public async cancelWorkflow(workflowId: string): Promise<boolean> {
    const context = this.activeWorkflows.get(workflowId);
    if (!context) return false;
    
    context.status = 'cancelled';
    this.emit('workflow-cancelled', { workflowId });
    
    // Notify agents to stop processing
    for (const [agentId, agent] of this.agents) {
      await agent.cancel();
    }
    
    return true;
  }

  /**
   * Get agent status
   */
  public getAgentStatus(agentId: string): AgentStatus | undefined {
    const agent = this.agents.get(agentId);
    return agent?.getStatus();
  }

  /**
   * Get all active workflows
   */
  public getActiveWorkflows(): string[] {
    return Array.from(this.activeWorkflows.keys());
  }

  /**
   * Get metrics summary
   */
  public async getMetricsSummary(): Promise<any> {
    return await this.metricsCollector.getSummary();
  }
}

// Export singleton instance
export const healthcareOrchestrator = new HealthcareOrchestrator();
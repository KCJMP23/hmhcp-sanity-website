import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Healthcare sensitivity classification
export enum HealthcareSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  PHI = 'phi',
  SENSITIVE_PHI = 'sensitive_phi'
}

// Context types for AI workflows
export enum ContextType {
  CONVERSATION = 'conversation',
  RESEARCH = 'research', 
  CONTENT_GENERATION = 'content_generation',
  COMPLIANCE = 'compliance'
}

// Semantic content structure for AI understanding
interface SemanticContent {
  topics: string[];
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  medical_concepts?: string[];
  compliance_markers?: string[];
  embeddings?: number[];
  summary?: string;
  key_insights?: string[];
}

// Agent contribution tracking
interface AgentContributions {
  [agentId: string]: {
    contributions: Array<{
      timestamp: string;
      content: any;
      semantic_data?: SemanticContent;
      confidence_score?: number;
    }>;
    total_contributions: number;
    last_active: string;
    contribution_quality?: number;
  };
}

// Context timeline for chronological tracking
interface ContextTimeline {
  created_at: string;
  last_updated: string;
  events: Array<{
    timestamp: string;
    event: string;
    agent: string;
    details?: any;
    impact_score?: number;
  }>;
  milestones?: Array<{
    timestamp: string;
    milestone: string;
    significance: number;
  }>;
}

// Expiration and cleanup policies
interface ExpirationPolicy {
  ttl_seconds: number;
  cleanup_after: string;
  preserve_on_high_relevance: boolean;
  max_inactivity_hours?: number;
  auto_archive?: boolean;
  retention_rules?: {
    phi_data: number; // Retention in days for PHI
    general_data: number; // Retention in days for general data
    compliance_data: number; // Retention in days for compliance data
  };
}

// Healthcare compliance validation
interface ComplianceValidation {
  validated_at: string;
  sensitivity_level: HealthcareSensitivity;
  phi_detected: boolean;
  compliance_status: 'compliant' | 'non_compliant' | 'pending_review';
  violations?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  audit_trail: {
    validator: string;
    validation_rules: string[];
    last_audit: string;
  };
  encryption_status?: {
    encrypted: boolean;
    encryption_method?: string;
    key_id?: string;
  };
}

// Relevance scoring components
interface RelevanceScoring {
  base_score: number;
  semantic_relevance: number;
  temporal_relevance: number;
  agent_consensus: number;
  healthcare_importance: number;
  compliance_critical: number;
  final_score: number;
  last_calculated: string;
}

// Main SharedContextPool data model
interface SharedContextPoolData {
  id: string;
  workflow_id: string;
  context_type: ContextType;
  semantic_content: SemanticContent;
  agent_contributions: AgentContributions;
  context_timeline: ContextTimeline;
  relevance_score: number;
  relevance_details?: RelevanceScoring;
  expiration_policy: ExpirationPolicy;
  healthcare_sensitivity: HealthcareSensitivity;
  compliance_validation: ComplianceValidation;
  created_at: string;
  updated_at: string;
  version: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Validation schemas using Zod
const SemanticContentSchema = z.object({
  topics: z.array(z.string()),
  entities: z.array(z.object({
    type: z.string(),
    value: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  intent: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  medical_concepts: z.array(z.string()).optional(),
  compliance_markers: z.array(z.string()).optional(),
  embeddings: z.array(z.number()).optional(),
  summary: z.string().optional(),
  key_insights: z.array(z.string()).optional()
});

const ExpirationPolicySchema = z.object({
  ttl_seconds: z.number().positive(),
  cleanup_after: z.string(),
  preserve_on_high_relevance: z.boolean(),
  max_inactivity_hours: z.number().positive().optional(),
  auto_archive: z.boolean().optional(),
  retention_rules: z.object({
    phi_data: z.number().positive(),
    general_data: z.number().positive(),
    compliance_data: z.number().positive()
  }).optional()
});

const ComplianceValidationSchema = z.object({
  validated_at: z.string(),
  sensitivity_level: z.nativeEnum(HealthcareSensitivity),
  phi_detected: z.boolean(),
  compliance_status: z.enum(['compliant', 'non_compliant', 'pending_review']),
  violations: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string()
  })).optional(),
  audit_trail: z.object({
    validator: z.string(),
    validation_rules: z.array(z.string()),
    last_audit: z.string()
  }),
  encryption_status: z.object({
    encrypted: z.boolean(),
    encryption_method: z.string().optional(),
    key_id: z.string().optional()
  }).optional()
});

const SharedContextPoolSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string(),
  context_type: z.nativeEnum(ContextType),
  semantic_content: SemanticContentSchema,
  agent_contributions: z.record(z.any()),
  context_timeline: z.object({
    created_at: z.string(),
    last_updated: z.string(),
    events: z.array(z.object({
      timestamp: z.string(),
      event: z.string(),
      agent: z.string(),
      details: z.any().optional(),
      impact_score: z.number().min(0).max(1).optional()
    })),
    milestones: z.array(z.object({
      timestamp: z.string(),
      milestone: z.string(),
      significance: z.number().min(0).max(1)
    })).optional()
  }),
  relevance_score: z.number().min(0).max(1),
  relevance_details: z.object({
    base_score: z.number(),
    semantic_relevance: z.number(),
    temporal_relevance: z.number(),
    agent_consensus: z.number(),
    healthcare_importance: z.number(),
    compliance_critical: z.number(),
    final_score: z.number(),
    last_calculated: z.string()
  }).optional(),
  expiration_policy: ExpirationPolicySchema,
  healthcare_sensitivity: z.nativeEnum(HealthcareSensitivity),
  compliance_validation: ComplianceValidationSchema,
  created_at: z.string(),
  updated_at: z.string(),
  version: z.number().int().positive(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * SharedContextPool implementation with semantic understanding and healthcare compliance
 */
export class SharedContextPool {
  public readonly id: string;
  public readonly workflow_id: string;
  public readonly context_type: ContextType;
  public semantic_content: SemanticContent;
  public agent_contributions: AgentContributions;
  public context_timeline: ContextTimeline;
  public relevance_score: number;
  public relevance_details?: RelevanceScoring;
  public expiration_policy: ExpirationPolicy;
  public healthcare_sensitivity: HealthcareSensitivity;
  public compliance_validation: ComplianceValidation;
  public readonly created_at: string;
  public updated_at: string;
  public version: number;
  public tags?: string[];
  public metadata?: Record<string, any>;

  constructor(data: Partial<SharedContextPoolData>) {
    const now = new Date().toISOString();

    this.id = data.id || uuidv4();
    this.workflow_id = data.workflow_id || '';
    this.context_type = data.context_type || ContextType.CONVERSATION;
    this.semantic_content = data.semantic_content || {
      topics: [],
      entities: [],
      intent: 'unknown',
      sentiment: 'neutral'
    };
    this.agent_contributions = data.agent_contributions || {};
    this.context_timeline = data.context_timeline || {
      created_at: now,
      last_updated: now,
      events: []
    };
    this.relevance_score = data.relevance_score || 0.5;
    this.relevance_details = data.relevance_details;
    this.expiration_policy = data.expiration_policy || {
      ttl_seconds: 300,
      cleanup_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      preserve_on_high_relevance: false
    };
    this.healthcare_sensitivity = data.healthcare_sensitivity || HealthcareSensitivity.INTERNAL;
    this.compliance_validation = data.compliance_validation || {
      validated_at: now,
      sensitivity_level: this.healthcare_sensitivity,
      phi_detected: false,
      compliance_status: 'pending_review',
      audit_trail: {
        validator: 'system',
        validation_rules: [],
        last_audit: now
      }
    };
    this.created_at = data.created_at || now;
    this.updated_at = data.updated_at || now;
    this.version = data.version || 1;
    this.tags = data.tags;
    this.metadata = data.metadata;
  }

  /**
   * Validate the context pool data structure
   */
  validate(): { isValid: boolean; errors: string[] } {
    try {
      SharedContextPoolSchema.parse(this.toObject());
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Add an agent contribution to the context pool
   */
  addAgentContribution(
    agentId: string,
    content: any,
    semanticData?: SemanticContent,
    confidenceScore?: number
  ): void {
    const timestamp = new Date().toISOString();

    // Initialize agent contributions if not exists
    if (!this.agent_contributions[agentId]) {
      this.agent_contributions[agentId] = {
        contributions: [],
        total_contributions: 0,
        last_active: timestamp
      };
    }

    // Add the contribution
    this.agent_contributions[agentId].contributions.push({
      timestamp,
      content,
      semantic_data: semanticData,
      confidence_score: confidenceScore
    });

    // Update agent stats
    this.agent_contributions[agentId].total_contributions += 1;
    this.agent_contributions[agentId].last_active = timestamp;

    // Update context timeline
    this.context_timeline.events.push({
      timestamp,
      event: 'agent_contribution',
      agent: agentId,
      details: {
        content_type: typeof content,
        has_semantic_data: !!semanticData,
        confidence_score: confidenceScore
      }
    });

    this.context_timeline.last_updated = timestamp;
    this.updated_at = timestamp;
    this.version += 1;
  }

  /**
   * Update semantic content with new insights
   */
  updateSemanticContent(updates: Partial<SemanticContent>): void {
    this.semantic_content = {
      ...this.semantic_content,
      ...updates
    };

    // Add timeline event
    this.context_timeline.events.push({
      timestamp: new Date().toISOString(),
      event: 'semantic_update',
      agent: 'system',
      details: { updated_fields: Object.keys(updates) }
    });

    this.updated_at = new Date().toISOString();
    this.version += 1;
  }

  /**
   * Update relevance score with detailed breakdown
   */
  updateRelevanceScore(
    newScore: number,
    details?: Partial<RelevanceScoring>
  ): void {
    this.relevance_score = Math.max(0, Math.min(1, newScore));

    if (details) {
      this.relevance_details = {
        base_score: details.base_score || this.relevance_score,
        semantic_relevance: details.semantic_relevance || 0,
        temporal_relevance: details.temporal_relevance || 0,
        agent_consensus: details.agent_consensus || 0,
        healthcare_importance: details.healthcare_importance || 0,
        compliance_critical: details.compliance_critical || 0,
        final_score: this.relevance_score,
        last_calculated: new Date().toISOString()
      };
    }

    // Add timeline event
    this.context_timeline.events.push({
      timestamp: new Date().toISOString(),
      event: 'relevance_updated',
      agent: 'system',
      details: { new_score: this.relevance_score },
      impact_score: Math.abs(newScore - (this.relevance_details?.final_score || 0.5))
    });

    this.updated_at = new Date().toISOString();
    this.version += 1;
  }

  /**
   * Update compliance validation status
   */
  updateComplianceValidation(validation: Partial<ComplianceValidation>): void {
    this.compliance_validation = {
      ...this.compliance_validation,
      ...validation,
      validated_at: new Date().toISOString()
    };

    // Add timeline event
    this.context_timeline.events.push({
      timestamp: new Date().toISOString(),
      event: 'compliance_validation',
      agent: 'compliance_system',
      details: {
        status: validation.compliance_status,
        phi_detected: validation.phi_detected,
        violations: validation.violations?.length || 0
      }
    });

    this.updated_at = new Date().toISOString();
    this.version += 1;
  }

  /**
   * Add a milestone to the context timeline
   */
  addMilestone(milestone: string, significance: number = 0.5): void {
    if (!this.context_timeline.milestones) {
      this.context_timeline.milestones = [];
    }

    this.context_timeline.milestones.push({
      timestamp: new Date().toISOString(),
      milestone,
      significance: Math.max(0, Math.min(1, significance))
    });

    // Add timeline event
    this.context_timeline.events.push({
      timestamp: new Date().toISOString(),
      event: 'milestone_reached',
      agent: 'system',
      details: { milestone, significance }
    });

    this.updated_at = new Date().toISOString();
    this.version += 1;
  }

  /**
   * Check if the context pool has expired
   */
  isExpired(): boolean {
    const now = new Date();
    const cleanupTime = new Date(this.expiration_policy.cleanup_after);
    
    if (now > cleanupTime) {
      // Check if should be preserved due to high relevance
      if (this.expiration_policy.preserve_on_high_relevance && this.relevance_score > 0.8) {
        return false;
      }
      return true;
    }

    // Check inactivity expiration
    if (this.expiration_policy.max_inactivity_hours) {
      const lastUpdate = new Date(this.updated_at);
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate > this.expiration_policy.max_inactivity_hours;
    }

    return false;
  }

  /**
   * Get the most active agents in this context pool
   */
  getMostActiveAgents(limit: number = 5): Array<{ agentId: string; contributionCount: number; lastActive: string }> {
    return Object.entries(this.agent_contributions)
      .map(([agentId, data]) => ({
        agentId,
        contributionCount: data.total_contributions,
        lastActive: data.last_active
      }))
      .sort((a, b) => b.contributionCount - a.contributionCount)
      .slice(0, limit);
  }

  /**
   * Get recent events from the timeline
   */
  getRecentEvents(limit: number = 10): Array<any> {
    return [...this.context_timeline.events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Check if this context contains PHI (Protected Health Information)
   */
  containsPHI(): boolean {
    return this.compliance_validation.phi_detected ||
           this.healthcare_sensitivity === HealthcareSensitivity.PHI ||
           this.healthcare_sensitivity === HealthcareSensitivity.SENSITIVE_PHI;
  }

  /**
   * Get context age in hours
   */
  getAgeInHours(): number {
    const now = new Date();
    const created = new Date(this.created_at);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): SharedContextPoolData {
    return {
      id: this.id,
      workflow_id: this.workflow_id,
      context_type: this.context_type,
      semantic_content: this.semantic_content,
      agent_contributions: this.agent_contributions,
      context_timeline: this.context_timeline,
      relevance_score: this.relevance_score,
      relevance_details: this.relevance_details,
      expiration_policy: this.expiration_policy,
      healthcare_sensitivity: this.healthcare_sensitivity,
      compliance_validation: this.compliance_validation,
      created_at: this.created_at,
      updated_at: this.updated_at,
      version: this.version,
      tags: this.tags,
      metadata: this.metadata
    };
  }

  /**
   * Convert to database-friendly format
   */
  toDatabase(): any {
    return {
      id: this.id,
      workflow_id: this.workflow_id,
      context_type: this.context_type,
      semantic_content: this.semantic_content,
      agent_contributions: this.agent_contributions,
      context_timeline: this.context_timeline,
      relevance_score: this.relevance_score,
      expiration_policy: this.expiration_policy,
      healthcare_sensitivity: this.healthcare_sensitivity,
      compliance_validation: this.compliance_validation,
      created_at: this.created_at,
      updated_at: this.updated_at,
      version: this.version,
      tags: this.tags,
      metadata: this.metadata
    };
  }

  /**
   * Create instance from database data
   */
  static fromDatabase(data: any): SharedContextPool {
    return new SharedContextPool(data);
  }

  /**
   * Create a new context pool for a workflow
   */
  static createForWorkflow(
    workflowId: string,
    contextType: ContextType,
    initialContent?: any,
    sensitivity: HealthcareSensitivity = HealthcareSensitivity.INTERNAL
  ): SharedContextPool {
    const now = new Date().toISOString();
    
    return new SharedContextPool({
      workflow_id: workflowId,
      context_type: contextType,
      semantic_content: {
        topics: [],
        entities: [],
        intent: 'workflow_initialization',
        sentiment: 'neutral'
      },
      agent_contributions: initialContent ? {
        system: {
          contributions: [{
            timestamp: now,
            content: initialContent
          }],
          total_contributions: 1,
          last_active: now
        }
      } : {},
      context_timeline: {
        created_at: now,
        last_updated: now,
        events: [{
          timestamp: now,
          event: 'context_pool_created',
          agent: 'system',
          details: { context_type: contextType, workflow_id: workflowId }
        }]
      },
      healthcare_sensitivity: sensitivity,
      compliance_validation: {
        validated_at: now,
        sensitivity_level: sensitivity,
        phi_detected: false,
        compliance_status: 'pending_review',
        audit_trail: {
          validator: 'system',
          validation_rules: ['basic_validation'],
          last_audit: now
        }
      }
    });
  }
}
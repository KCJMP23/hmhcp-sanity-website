/**
 * GraphQL Schema for AI Workflow Management
 * 
 * Provides optimized data fetching for complex nested queries
 * Alternative to REST APIs for improved performance with nested data
 */

import { gql } from 'graphql-tag';

// GraphQL Schema Definition
export const workflowSchema = gql`
  type Query {
    # Workflows with nested data fetching
    workflows(
      organizationId: ID!
      status: WorkflowStatus
      page: Int = 1
      limit: Int = 20
      search: String
    ): WorkflowConnection

    workflow(id: ID!): Workflow

    # Executions with performance metrics
    workflowExecution(id: ID!): WorkflowExecution
    
    # Cost analytics with aggregations
    workflowCostAnalytics(
      organizationId: ID!
      timeRange: TimeRange!
      groupBy: CostGroupBy
    ): CostAnalytics
  }

  type Mutation {
    createWorkflow(input: CreateWorkflowInput!): WorkflowPayload
    updateWorkflow(id: ID!, input: UpdateWorkflowInput!): WorkflowPayload
    executeWorkflow(id: ID!, input: ExecutionInput): ExecutionPayload
    pauseExecution(executionId: ID!): ExecutionPayload
    resumeExecution(executionId: ID!): ExecutionPayload
  }

  type Subscription {
    workflowExecutionUpdates(executionId: ID!): ExecutionUpdate
    organizationMetrics(organizationId: ID!): MetricsUpdate
  }

  # Types
  type Workflow {
    id: ID!
    name: String!
    description: String
    status: WorkflowStatus!
    workflowDefinition: WorkflowDefinition
    template: WorkflowTemplate
    createdBy: User!
    organization: Organization!
    executions(first: Int = 10, after: String): ExecutionConnection
    metrics: WorkflowMetrics
    complianceStatus: ComplianceStatus
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WorkflowExecution {
    id: ID!
    workflow: Workflow!
    status: ExecutionStatus!
    startedAt: DateTime!
    completedAt: DateTime
    executionTimeMs: Int
    costUsd: Float
    tokensUsed: Int
    executionLog: [LogEntry!]!
    artifacts: [Artifact!]!
    agentMetrics: [AgentMetrics!]!
    complianceResults: [ComplianceResult!]!
  }

  type AgentMetrics {
    id: ID!
    agentName: String!
    model: String!
    tokensUsed: TokenUsage!
    costUsd: Float!
    executionTimeMs: Int!
    success: Boolean!
    errorCount: Int!
  }

  type ComplianceResult {
    standard: ComplianceStandard!
    passed: Boolean!
    score: Float!
    violations: [ComplianceViolation!]!
  }

  # Performance optimized connection types
  type WorkflowConnection {
    edges: [WorkflowEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    aggregations: WorkflowAggregations
  }

  type WorkflowEdge {
    node: Workflow!
    cursor: String!
  }

  type WorkflowAggregations {
    statusBreakdown: [StatusCount!]!
    costSummary: CostSummary!
    executionMetrics: ExecutionMetrics!
  }

  # Enums
  enum WorkflowStatus {
    DRAFT
    ACTIVE
    PAUSED
    ARCHIVED
  }

  enum ExecutionStatus {
    PENDING
    QUEUED
    RUNNING
    PAUSED
    COMPLETED
    FAILED
    CANCELLED
  }

  enum ComplianceStandard {
    HIPAA
    GDPR
    SOC2
    ISO27001
    FDA
  }

  enum CostGroupBy {
    AGENT
    MODEL
    DATE
    WORKFLOW
  }

  # Input types
  input CreateWorkflowInput {
    name: String!
    description: String
    workflowDefinition: WorkflowDefinitionInput
    templateId: ID
    organizationId: ID!
  }

  input WorkflowDefinitionInput {
    version: String!
    triggers: [TriggerInput!]!
    steps: [StepInput!]!
    config: ConfigInput!
  }

  input TimeRange {
    start: DateTime!
    end: DateTime!
  }

  # Scalar types
  scalar DateTime
  scalar JSON
`;

/**
 * GraphQL Resolvers for optimized data fetching
 */
export const resolvers = {
  Query: {
    workflows: async (parent: any, args: any, context: any) => {
      // Single query with joins instead of N+1 queries
      const { data, count } = await context.db.workflows.findManyWithAggregations({
        where: {
          organizationId: args.organizationId,
          status: args.status,
          OR: args.search ? [
            { name: { contains: args.search, mode: 'insensitive' } },
            { description: { contains: args.search, mode: 'insensitive' } }
          ] : undefined
        },
        include: {
          createdBy: true,
          template: true,
          _count: {
            select: { executions: true }
          },
          executions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { status: true, costUsd: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: args.limit,
        skip: (args.page - 1) * args.limit
      });

      return {
        edges: data.map((workflow: any) => ({
          node: workflow,
          cursor: Buffer.from(workflow.id).toString('base64')
        })),
        pageInfo: {
          hasNextPage: count > args.page * args.limit,
          hasPreviousPage: args.page > 1
        },
        totalCount: count,
        aggregations: await calculateAggregations(data)
      };
    },

    workflowExecution: async (parent: any, args: any, context: any) => {
      // Single optimized query with all nested data
      return await context.db.workflowExecutions.findUnique({
        where: { id: args.id },
        include: {
          workflow: {
            include: { template: true, createdBy: true }
          },
          executionLog: {
            orderBy: { timestamp: 'asc' }
          },
          artifacts: true,
          agentMetrics: {
            include: { 
              complianceResults: {
                include: { violations: true }
              }
            }
          }
        }
      });
    }
  },

  Mutation: {
    createWorkflow: async (parent: any, args: any, context: any) => {
      const { input } = args;
      
      // Transaction for atomic workflow creation
      return await context.db.$transaction(async (tx: any) => {
        const workflow = await tx.workflows.create({
          data: {
            name: input.name,
            description: input.description,
            workflowDefinition: input.workflowDefinition,
            templateId: input.templateId,
            organizationId: input.organizationId,
            createdBy: context.user.id,
            status: 'DRAFT'
          },
          include: {
            createdBy: true,
            template: true,
            organization: true
          }
        });

        // Create audit event
        await tx.auditEvents.create({
          data: {
            action: 'WORKFLOW_CREATED',
            resourceId: workflow.id,
            resourceType: 'WORKFLOW',
            userId: context.user.id,
            metadata: { workflowName: workflow.name }
          }
        });

        return { workflow };
      });
    }
  },

  Subscription: {
    workflowExecutionUpdates: {
      subscribe: (parent: any, args: any, context: any) => {
        return context.pubsub.asyncIterator(`EXECUTION_${args.executionId}`);
      }
    }
  },

  // Field resolvers for computed fields
  Workflow: {
    metrics: async (workflow: any, args: any, context: any) => {
      // Lazy load metrics only when requested
      return await context.loaders.workflowMetrics.load(workflow.id);
    },
    
    complianceStatus: async (workflow: any, args: any, context: any) => {
      // Computed compliance status
      return await context.loaders.complianceStatus.load(workflow.id);
    }
  }
};

/**
 * DataLoader setup for N+1 query optimization
 */
export const createLoaders = (db: any) => ({
  workflowMetrics: new DataLoader(async (workflowIds: string[]) => {
    const metrics = await db.workflowMetrics.findMany({
      where: { workflowId: { in: workflowIds } }
    });
    
    return workflowIds.map(id => 
      metrics.find((m: any) => m.workflowId === id) || null
    );
  }),

  complianceStatus: new DataLoader(async (workflowIds: string[]) => {
    const statuses = await db.complianceStatus.findMany({
      where: { workflowId: { in: workflowIds } }
    });
    
    return workflowIds.map(id => 
      statuses.find((s: any) => s.workflowId === id) || null
    );
  })
});

/**
 * GraphQL Performance Benefits:
 * 
 * 1. Single Request: Client can fetch nested data in one request
 * 2. Precise Data: Only requested fields are returned
 * 3. N+1 Prevention: DataLoaders batch database queries
 * 4. Real-time: Subscriptions for live updates
 * 5. Type Safety: Strong typing with generated TypeScript
 * 
 * Example Query:
 * ```graphql
 * query GetWorkflowDetails($id: ID!) {
 *   workflow(id: $id) {
 *     id
 *     name
 *     status
 *     executions(first: 10) {
 *       edges {
 *         node {
 *           id
 *           status
 *           costUsd
 *           agentMetrics {
 *             agentName
 *             tokensUsed {
 *               input
 *               output
 *             }
 *           }
 *         }
 *       }
 *     }
 *     complianceStatus {
 *       passed
 *       score
 *     }
 *   }
 * }
 * ```
 * 
 * This single query replaces multiple REST API calls:
 * - GET /workflows/:id
 * - GET /workflows/:id/executions
 * - GET /executions/:id/metrics
 * - GET /workflows/:id/compliance
 */

async function calculateAggregations(workflows: any[]) {
  const statusCounts = workflows.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {});

  const totalCost = workflows.reduce((sum, w) => 
    sum + (w.executions[0]?.costUsd || 0), 0);

  return {
    statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    })),
    costSummary: {
      total: totalCost,
      average: totalCost / workflows.length || 0
    },
    executionMetrics: {
      totalExecutions: workflows.reduce((sum, w) => sum + w._count.executions, 0),
      avgExecutionsPerWorkflow: workflows.length > 0 ? 
        workflows.reduce((sum, w) => sum + w._count.executions, 0) / workflows.length : 0
    }
  };
}
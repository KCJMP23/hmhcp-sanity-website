import { z } from 'zod';

// Enum schemas
export const WorkflowStatusSchema = z.enum(['draft', 'active', 'paused', 'archived']);
export const ExecutionStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'paused']);
export const AgentTypeSchema = z.enum([
  'research',
  'content',
  'medical_accuracy',
  'compliance',
  'seo',
  'image',
  'social',
  'publishing',
  'workflow',
  'qa'
]);
export const TaskStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'skipped']);
export const TriggerTypeSchema = z.enum(['manual', 'scheduled', 'webhook', 'event']);

// Node schemas
export const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['agent', 'condition', 'parallel', 'loop', 'delay']),
  agent: AgentTypeSchema.optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    config: z.record(z.any()).optional(),
    inputs: z.array(z.string()).optional(),
    outputs: z.array(z.string()).optional()
  })
});

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
  condition: z.string().optional()
});

export const WorkflowDefinitionSchema = z.object({
  nodes: z.array(WorkflowNodeSchema).min(1, 'At least one node is required'),
  edges: z.array(WorkflowEdgeSchema),
  variables: z.record(z.any()).optional(),
  settings: z.object({
    maxRetries: z.number().min(0).max(10).optional(),
    timeout: z.number().min(1000).max(3600000).optional(), // 1s to 1h
    errorHandling: z.enum(['stop', 'continue', 'retry']).optional()
  }).optional()
});

// Main workflow schemas
export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  templateId: z.string().uuid().optional(),
  workflowDefinition: WorkflowDefinitionSchema.optional(),
  organizationId: z.string().uuid(),
  settings: z.record(z.any()).optional()
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  workflowDefinition: WorkflowDefinitionSchema.optional(),
  status: WorkflowStatusSchema.optional(),
  settings: z.record(z.any()).optional()
});

// Execution schemas
export const StartExecutionSchema = z.object({
  workflowId: z.string().uuid(),
  inputData: z.record(z.any()).optional(),
  context: z.record(z.any()).optional()
});

export const UpdateExecutionSchema = z.object({
  status: ExecutionStatusSchema.optional(),
  outputData: z.record(z.any()).optional(),
  errorMessage: z.string().optional(),
  errorDetails: z.record(z.any()).optional()
});

// Task schemas
export const CreateTaskSchema = z.object({
  executionId: z.string().uuid(),
  taskId: z.string().min(1),
  taskName: z.string().min(1),
  agentType: AgentTypeSchema.optional(),
  inputData: z.record(z.any()).optional()
});

export const UpdateTaskSchema = z.object({
  status: TaskStatusSchema.optional(),
  outputData: z.record(z.any()).optional(),
  errorMessage: z.string().optional(),
  cost: z.number().min(0).optional(),
  tokensUsed: z.number().min(0).optional()
});

// Schedule schemas
export const CreateScheduleSchema = z.object({
  workflowId: z.string().uuid(),
  cronExpression: z.string()
    .regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    'Invalid cron expression'),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true)
});

// Queue schemas
export const QueueItemSchema = z.object({
  executionId: z.string().uuid(),
  taskId: z.string().uuid(),
  agentType: AgentTypeSchema,
  priority: z.number().min(1).max(10).default(5),
  metadata: z.record(z.any()).optional()
});

// Cost calculation schemas
export const CostCalculationSchema = z.object({
  apiCosts: z.object({
    perplexity: z.number().min(0),
    claude: z.number().min(0),
    dataForSEO: z.number().min(0),
    dalle: z.number().min(0)
  }),
  tokenCosts: z.object({
    input: z.number().min(0),
    output: z.number().min(0)
  })
});

// Validation helpers
export const validateWorkflowDefinition = (definition: unknown) => {
  try {
    const result = WorkflowDefinitionSchema.parse(definition);
    
    // Additional business logic validation
    const nodeIds = new Set(result.nodes.map(n => n.id));
    
    // Check for duplicate node IDs
    if (nodeIds.size !== result.nodes.length) {
      throw new Error('Duplicate node IDs found');
    }
    
    // Validate edges reference existing nodes
    for (const edge of result.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Edge source '${edge.source}' references non-existent node`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Edge target '${edge.target}' references non-existent node`);
      }
    }
    
    // Check for cycles (simplified check)
    const hasCycle = checkForCycles(result.nodes, result.edges);
    if (hasCycle) {
      throw new Error('Workflow contains cycles');
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid workflow definition' 
    };
  }
};

// Helper function to check for cycles in workflow
function checkForCycles(nodes: any[], edges: any[]): boolean {
  const adjacency: Record<string, string[]> = {};
  
  // Build adjacency list
  for (const edge of edges) {
    if (!adjacency[edge.source]) {
      adjacency[edge.source] = [];
    }
    adjacency[edge.source].push(edge.target);
  }
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycleDFS(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const neighbors = adjacency[nodeId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycleDFS(node.id)) {
        return true;
      }
    }
  }
  
  return false;
}

// Export type inferences
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;
export type StartExecutionInput = z.infer<typeof StartExecutionSchema>;
export type WorkflowDefinitionInput = z.infer<typeof WorkflowDefinitionSchema>;
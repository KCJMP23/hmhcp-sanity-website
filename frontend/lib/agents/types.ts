export type AgentRole =
  | 'ContentCrawler'
  | 'SEOOptimizer'
  | 'CreativeWriter'
  | 'SocialAmplifier'
  | 'InboxNurturer'
  | 'BusinessGrowthAnalyst'

export interface A2AEnvelope<TInput = unknown, TOutput = unknown> {
  taskId: string
  from: AgentRole
  to: AgentRole
  inputArtifacts?: Record<string, unknown>
  contextRefs?: Record<string, string>
  expectedOutput?: string
  guardrails?: string[]
  approvalPolicy?: 'auto' | 'requires_approval'
  payload?: TInput
  output?: TOutput
}

export interface GraphResultArtifact {
  id: string
  type: 'text' | 'json' | 'image' | 'link'
  label: string
  url?: string
  data?: unknown
}

// Missing interfaces that the orchestrator needs
export interface AgentJob {
  id: string
  goal: string
  notes: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  started_at: string
  completed_at?: string
  error?: string
  metadata?: any
}

export interface AgentArtifact {
  type: string
  content: any
  metadata?: any
}

export interface AgentOutput {
  success: boolean
  taskId: string
  artifacts: AgentArtifact[]
  logs: string[]
  errors: string[]
  metadata?: any
}

export interface AgentNode {
  (state: any): Promise<any>
}



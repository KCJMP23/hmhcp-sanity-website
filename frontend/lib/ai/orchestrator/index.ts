/**
 * Enhanced AI Orchestrator
 * Microsoft Copilot-inspired AI orchestration system for healthcare applications
 * Main entry point for the enhanced orchestrator components
 */

// Core orchestrator
export { default as EnhancedHealthcareAIOrchestrator } from './HealthcareAIOrchestrator';
export type { EnhancedOrchestratorOptions } from './HealthcareAIOrchestrator';

// Shared memory and context management
export { default as EnhancedSharedMemoryPool } from './SharedMemoryPool';
export type { 
  MemoryItem, 
  MemoryType, 
  MemoryPriority, 
  MemorySearchOptions, 
  MemorySearchResult,
  MemoryPoolConfig,
  HealthcareSensitivity
} from './SharedMemoryPool';

// Agent communication framework
export { default as AgentCommunicationFramework } from './AgentCommunicationFramework';
export type {
  AgentMessage,
  MessageType,
  MessagePriority,
  MessageStatus,
  MessageContent,
  MessageAttachment,
  MessageMetadata,
  AgentCapability,
  CollaborationSession,
  CommunicationConfig,
  ComplianceLevel
} from './AgentCommunicationFramework';

// Workflow execution engine
export { default as WorkflowExecutionEngine } from './WorkflowExecutionEngine';
export type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowNode,
  WorkflowStatus,
  NodeType,
  ExecutionStrategy,
  NodeConfig,
  WorkflowCondition,
  RetryPolicy,
  WorkflowConnection,
  WorkflowVariable,
  WorkflowTrigger,
  WorkflowMetadata,
  WorkflowContext,
  ExecutionStep,
  WorkflowError,
  WorkflowExecutionConfig
} from './WorkflowExecutionEngine';

// Monitoring and observability
export { default as MonitoringDashboard } from './MonitoringDashboard';
export type {
  Metric,
  MetricType,
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertCondition,
  Dashboard,
  DashboardWidget,
  WidgetType,
  WidgetConfig,
  TimeRange,
  AggregationType,
  DashboardLayout,
  DashboardPermissions,
  HealthCheck,
  PerformanceReport,
  PerformanceMetrics,
  ResourceUtilization,
  Recommendation,
  RecommendationType,
  MonitoringConfig
} from './MonitoringDashboard';

// Re-export existing components for backward compatibility
export { default as HealthcareAIOrchestrator } from '../healthcare-orchestrator';
export { default as SharedContextManager } from '../shared-context-manager';
export { default as TaskDelegator } from '../task-delegator';
export { default as HealthcareAgentRegistry } from '../agent-registry';

// Re-export types
export type {
  OrchestratorConfig,
  OrchestratorState,
  WorkflowTask,
  TaskStatus,
  TaskResult,
  TaskError,
  AgentConfiguration,
  AgentInstance,
  SecurityContext,
  ComplianceStatus,
  CollaborationContext,
  OrchestratorEvent,
  OrchestratorMetrics,
  SessionMetrics,
  WorkflowMetrics,
  PerformanceMetrics,
  TaskType,
  TaskPriority,
  RecoveryStrategy,
  RecoveryAction
} from '../../types/ai/orchestrator';

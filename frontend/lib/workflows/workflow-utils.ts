// Workflow Utility Functions
// This file contains common utility functions for AI workflow management

import { AIWorkflowExecution, WorkflowStep, WorkflowStatus } from '@/types/ai/workflows';

/**
 * Calculate workflow progress based on completed steps
 */
export function calculateWorkflowProgress(steps: WorkflowStep[], completedSteps: string[]): number {
  if (steps.length === 0) return 0;
  
  const completedCount = steps.filter(step => completedSteps.includes(step.id)).length;
  return Math.round((completedCount / steps.length) * 100);
}

/**
 * Estimate workflow completion time based on step durations
 */
export function estimateWorkflowCompletion(steps: WorkflowStep[], startTime: Date): Date {
  const totalDuration = steps.reduce((sum, step) => sum + (step.estimatedDuration || 0), 0);
  return new Date(startTime.getTime() + totalDuration);
}

/**
 * Validate workflow configuration
 */
export function validateWorkflowConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Workflow name is required');
  }
  
  if (!config.steps || !Array.isArray(config.steps) || config.steps.length === 0) {
    errors.push('At least one workflow step is required');
  }
  
  if (config.steps) {
    config.steps.forEach((step: WorkflowStep, index: number) => {
      if (!step.name || step.name.trim().length === 0) {
        errors.push(`Step ${index + 1}: Name is required`);
      }
      if (!step.agent || step.agent.trim().length === 0) {
        errors.push(`Step ${index + 1}: Agent is required`);
      }
      if (step.order < 0) {
        errors.push(`Step ${index + 1}: Order must be non-negative`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get workflow status color for UI display
 */
export function getWorkflowStatusColor(status: WorkflowStatus): string {
  switch (status) {
    case 'running':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'queued':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format workflow execution time for display
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`;
  } else {
    return `${(ms / 3600000).toFixed(1)}h`;
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cost);
}

/**
 * Check if workflow requires approval based on configuration
 */
export function requiresApproval(workflow: AIWorkflowExecution): boolean {
  return workflow.agentCollaborationLevel === 'expert_review_required' ||
         workflow.complianceFramework === 'fda_advertising' ||
         workflow.healthcareTopic.toLowerCase().includes('clinical') ||
         workflow.healthcareTopic.toLowerCase().includes('trial');
}

/**
 * Get workflow priority based on configuration
 */
export function getWorkflowPriority(workflow: AIWorkflowExecution): 'low' | 'medium' | 'high' | 'critical' {
  if (workflow.complianceFramework === 'fda_advertising' || 
      workflow.healthcareTopic.toLowerCase().includes('emergency')) {
    return 'critical';
  }
  
  if (workflow.agentCollaborationLevel === 'expert_review_required' ||
      workflow.complianceFramework === 'hitrust') {
    return 'high';
  }
  
  if (workflow.agentCollaborationLevel === 'intensive') {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Generate workflow summary for notifications
 */
export function generateWorkflowSummary(workflow: AIWorkflowExecution): string {
  const status = workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1);
  const topic = workflow.healthcareTopic;
  const framework = workflow.complianceFramework.toUpperCase();
  
  return `${status}: ${workflow.config.name} (${topic}) - ${framework} compliance`;
}

/**
 * Check if workflow is in a terminal state
 */
export function isTerminalState(status: WorkflowStatus): boolean {
  return ['completed', 'failed', 'terminated'].includes(status);
}

/**
 * Check if workflow can be modified
 */
export function canModifyWorkflow(status: WorkflowStatus): boolean {
  return ['queued', 'paused'].includes(status);
}

/**
 * Check if workflow can be executed
 */
export function canExecuteWorkflow(status: WorkflowStatus): boolean {
  return ['queued', 'paused'].includes(status);
}

/**
 * Get next possible actions for a workflow
 */
export function getNextWorkflowActions(status: WorkflowStatus): string[] {
  switch (status) {
    case 'queued':
      return ['execute', 'pause', 'modify', 'delete'];
    case 'running':
      return ['pause', 'terminate'];
    case 'paused':
      return ['resume', 'terminate', 'modify'];
    case 'completed':
      return ['restart', 'view_results'];
    case 'failed':
      return ['restart', 'retry', 'view_errors'];
    default:
      return [];
  }
}

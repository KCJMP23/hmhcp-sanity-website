/**
 * Workflow Execution Engine
 * Story 1.1: Admin Foundation & Core Automation Infrastructure
 * 
 * Foundation for visual workflow builder and execution
 * 
 * @module WorkflowEngine
 * @description Enterprise-grade workflow orchestration engine for healthcare automation.
 * Supports conditional logic, error handling, retries, and step-by-step execution tracking.
 * 
 * @example
 * ```typescript
 * const engine = WorkflowEngine.getInstance()
 * await engine.initialize()
 * 
 * // Start a workflow
 * const executionId = await engine.startWorkflow('patient-onboarding', {
 *   patient: {
 *     id: '123',
 *     email: 'patient@example.com',
 *     name: 'John Doe'
 *   }
 * })
 * 
 * // Monitor execution
 * const execution = engine.getExecution(executionId)
 * console.log(execution.status, execution.currentStep)
 * ```
 */

import { queueManager } from './queue-manager'
import { TaskType, TaskPriority, TaskStatus } from '@/types/admin'
import { 
  WorkflowDefinition, 
  WorkflowExecution, 
  WorkflowStep, 
  WorkflowTrigger,
  WorkflowLog,
  WorkflowCondition 
} from '@/types/admin'
import { logger } from '@/lib/logging/client-safe-logger'
import { EventEmitter } from 'events'

/**
 * Orchestrates complex workflow execution with healthcare compliance
 * @class WorkflowEngine
 * @extends EventEmitter
 * @fires WorkflowEngine#workflow:completed - Workflow execution completed successfully
 * @fires WorkflowEngine#workflow:failed - Workflow execution failed
 * @fires WorkflowEngine#step:completed - Individual step completed
 */
export class WorkflowEngine extends EventEmitter {
  private static instance: WorkflowEngine
  private workflows: Map<string, WorkflowDefinition>
  private executions: Map<string, WorkflowExecution>
  private isInitialized = false

  private constructor() {
    super()
    this.workflows = new Map()
    this.executions = new Map()
  }

  /**
   * Get singleton instance
   * @returns {WorkflowEngine} The singleton WorkflowEngine instance
   */
  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine()
    }
    return WorkflowEngine.instance
  }

  /**
   * Initialize the workflow engine
   * @returns {Promise<void>} Resolves when initialization is complete
   * @throws {Error} If initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize queue manager
      await queueManager.initialize()
      
      // Load workflow definitions (would typically load from database)
      await this.loadWorkflows()
      
      // Set up workflow event handlers
      this.setupEventHandlers()
      
      this.isInitialized = true
      logger.info('Workflow Engine: Initialized successfully')
    } catch (error) {
      logger.error('Workflow Engine: Failed to initialize', { error })
      throw error
    }
  }

  /**
   * Load workflow definitions from storage
   * @private
   * @returns {Promise<void>} Resolves when workflows are loaded
   */
  private async loadWorkflows(): Promise<void> {
    // Sample healthcare workflow definitions
    const sampleWorkflows: WorkflowDefinition[] = [
      {
        id: 'patient-onboarding',
        name: 'Patient Onboarding Workflow',
        description: 'Automated patient onboarding process',
        trigger: {
          type: 'event',
          config: { eventType: 'patient.created' }
        },
        steps: [
          {
            id: 'send-welcome-email',
            name: 'Send Welcome Email',
            type: 'email',
            config: {
              template: 'patient-welcome',
              to: '{{patient.email}}'
            },
            onSuccess: 'create-patient-record',
            onFailure: 'stop'
          },
          {
            id: 'create-patient-record',
            name: 'Create Patient Record',
            type: 'database',
            config: {
              action: 'create',
              table: 'patient_records',
              data: '{{patient}}'
            },
            onSuccess: 'schedule-initial-assessment',
            onFailure: 'alert-admin'
          },
          {
            id: 'schedule-initial-assessment',
            name: 'Schedule Initial Assessment',
            type: 'calendar',
            config: {
              action: 'schedule',
              type: 'assessment',
              duration: 60
            },
            onSuccess: 'complete',
            onFailure: 'alert-admin'
          },
          {
            id: 'alert-admin',
            name: 'Alert Administrator',
            type: 'notification',
            config: {
              severity: 'high',
              message: 'Patient onboarding failed'
            },
            onSuccess: 'stop',
            onFailure: 'stop'
          }
        ],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'content-approval',
        name: 'Content Approval Workflow',
        description: 'Multi-stage content approval process',
        trigger: {
          type: 'manual',
          config: {}
        },
        steps: [
          {
            id: 'validate-content',
            name: 'Validate Content',
            type: 'validation',
            config: {
              rules: ['hipaa-compliance', 'medical-accuracy']
            },
            onSuccess: 'request-review',
            onFailure: 'return-to-author'
          },
          {
            id: 'request-review',
            name: 'Request Medical Review',
            type: 'approval',
            config: {
              approvers: ['medical-team'],
              requireAll: false
            },
            onSuccess: 'publish-content',
            onFailure: 'return-to-author'
          },
          {
            id: 'publish-content',
            name: 'Publish Content',
            type: 'publish',
            config: {
              target: 'production',
              notify: true
            },
            onSuccess: 'complete',
            onFailure: 'alert-admin'
          },
          {
            id: 'return-to-author',
            name: 'Return to Author',
            type: 'notification',
            config: {
              recipient: '{{author}}',
              message: 'Content requires revision'
            },
            onSuccess: 'stop',
            onFailure: 'stop'
          }
        ],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date()
      }
    ]

    // Load workflows into memory
    for (const workflow of sampleWorkflows) {
      this.workflows.set(workflow.id, workflow)
      logger.info(`Workflow Engine: Loaded workflow ${workflow.id}`)
    }
  }

  /**
   * Set up event handlers for workflow lifecycle events
   * @private
   */
  private setupEventHandlers(): void {
    // Handle workflow completion
    this.on('workflow:completed', (execution: WorkflowExecution) => {
      logger.info('Workflow completed', {
        workflowId: execution.workflowId,
        executionId: execution.id,
        duration: execution.completedAt 
          ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
          : 0
      })
    })

    // Handle workflow failure
    this.on('workflow:failed', (execution: WorkflowExecution) => {
      logger.error('Workflow failed', {
        workflowId: execution.workflowId,
        executionId: execution.id,
        error: execution.error
      })
    })

    // Handle step completion
    this.on('step:completed', (data: { executionId: string; stepId: string }) => {
      logger.info('Workflow step completed', data)
    })
  }

  /**
   * Start a workflow execution
   * @param {string} workflowId - ID of the workflow to execute
   * @param {Record<string, any>} context - Initial context data for the workflow
   * @returns {Promise<string>} The execution ID
   * @throws {Error} If workflow not found or not active
   * @example
   * const executionId = await engine.startWorkflow('content-approval', {
   *   contentId: '456',
   *   author: 'jane@example.com'
   * })
   */
  public async startWorkflow(
    workflowId: string,
    context: Record<string, any> = {}
  ): Promise<string> {
    const workflow = this.workflows.get(workflowId)
    
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`)
    }

    // Create execution record
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: TaskStatus.RUNNING,
      currentStep: workflow.steps[0]?.id,
      context,
      logs: [],
      startedAt: new Date()
    }

    this.executions.set(executionId, execution)

    // Log workflow start
    this.addLog(executionId, 'workflow', 'info', `Workflow ${workflow.name} started`)

    // Start execution
    try {
      await this.executeWorkflow(executionId, workflow, execution)
    } catch (error) {
      execution.status = TaskStatus.FAILED
      execution.error = error instanceof Error ? error.message : String(error)
      execution.completedAt = new Date()
      this.emit('workflow:failed', execution)
    }

    return executionId
  }

  /**
   * Execute workflow steps sequentially
   * @private
   * @param {string} executionId - The execution ID
   * @param {WorkflowDefinition} workflow - The workflow definition
   * @param {WorkflowExecution} execution - The execution state
   * @returns {Promise<void>} Resolves when workflow completes or fails
   */
  private async executeWorkflow(
    executionId: string,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    let currentStepId = execution.currentStep

    while (currentStepId && currentStepId !== 'complete' && currentStepId !== 'stop') {
      const step = workflow.steps.find(s => s.id === currentStepId)
      
      if (!step) {
        throw new Error(`Step ${currentStepId} not found in workflow`)
      }

      // Update execution
      execution.currentStep = currentStepId
      this.addLog(executionId, step.id, 'info', `Executing step: ${step.name}`)

      try {
        // Check conditions if any
        if (step.conditions && !this.evaluateConditions(step.conditions, execution.context)) {
          this.addLog(executionId, step.id, 'info', 'Step skipped due to conditions')
          currentStepId = step.onSuccess || 'complete'
          continue
        }

        // Execute step
        await this.executeStep(executionId, step, execution.context)
        
        // Update context with step result
        execution.context[`${step.id}_result`] = {
          success: true,
          timestamp: new Date().toISOString()
        }

        // Emit step completion
        this.emit('step:completed', { executionId, stepId: step.id })
        
        // Move to next step
        currentStepId = step.onSuccess || 'complete'
        this.addLog(executionId, step.id, 'info', `Step completed successfully`)
        
      } catch (error) {
        // Handle step failure
        this.addLog(
          executionId, 
          step.id, 
          'error', 
          `Step failed: ${error instanceof Error ? error.message : String(error)}`
        )

        // Update context with error
        execution.context[`${step.id}_error`] = {
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }

        // Handle retry if configured
        if (step.retryPolicy && step.retryPolicy.maxAttempts > 0) {
          const retryCount = execution.context[`${step.id}_retries`] || 0
          
          if (retryCount < step.retryPolicy.maxAttempts) {
            execution.context[`${step.id}_retries`] = retryCount + 1
            this.addLog(executionId, step.id, 'warn', `Retrying step (attempt ${retryCount + 1})`)
            
            // Wait before retry
            const backoff = Math.min(
              Math.pow(step.retryPolicy.backoffMultiplier || 2, retryCount) * 1000,
              (step.retryPolicy.maxBackoff || 60) * 1000
            )
            await new Promise(resolve => setTimeout(resolve, backoff))
            
            continue // Retry the same step
          }
        }

        // Move to failure path
        currentStepId = step.onFailure || 'stop'
      }
    }

    // Complete workflow
    execution.status = currentStepId === 'complete' ? TaskStatus.COMPLETED : TaskStatus.CANCELLED
    execution.completedAt = new Date()
    
    if (execution.status === TaskStatus.COMPLETED) {
      this.addLog(executionId, 'workflow', 'info', 'Workflow completed successfully')
      this.emit('workflow:completed', execution)
    } else {
      this.addLog(executionId, 'workflow', 'warn', 'Workflow stopped')
    }
  }

  /**
   * Execute a single workflow step
   * @private
   * @param {string} executionId - The execution ID
   * @param {WorkflowStep} step - The step to execute
   * @param {Record<string, any>} context - The execution context
   * @returns {Promise<void>} Resolves when step completes
   * @throws {Error} If step execution fails
   */
  private async executeStep(
    executionId: string,
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<void> {
    // Map step type to task type
    const taskTypeMap: Record<string, TaskType> = {
      'email': TaskType.EMAIL,
      'database': TaskType.DATA_SYNC,
      'notification': TaskType.EMAIL,
      'validation': TaskType.ANALYSIS,
      'approval': TaskType.WORKFLOW,
      'publish': TaskType.CONTENT_GENERATION,
      'calendar': TaskType.WORKFLOW
    }

    const taskType = taskTypeMap[step.type] || TaskType.CUSTOM

    // Queue the task for execution
    const jobId = await queueManager.addTask(
      taskType,
      `Workflow Step: ${step.name}`,
      {
        executionId,
        stepId: step.id,
        config: step.config,
        context
      },
      {
        priority: TaskPriority.HIGH
      }
    )

    // Wait for task completion (simplified - in production would use events)
    await this.waitForTaskCompletion(taskType, jobId)
  }

  /**
   * Wait for task completion with timeout
   * @private
   * @param {TaskType} taskType - Type of task
   * @param {string} jobId - The job ID to wait for
   * @param {number} timeout - Timeout in milliseconds (default: 5 minutes)
   * @returns {Promise<void>} Resolves when task completes
   * @throws {Error} If task fails or times out
   */
  private async waitForTaskCompletion(
    taskType: TaskType,
    jobId: string,
    timeout: number = 300000 // 5 minutes
  ): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const task = await queueManager.getTaskStatus(taskType, jobId)
      
      if (!task) {
        throw new Error(`Task ${jobId} not found`)
      }

      if (task.status === TaskStatus.COMPLETED) {
        return
      }

      if (task.status === TaskStatus.FAILED) {
        throw new Error(task.error || 'Task failed')
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    throw new Error('Task execution timeout')
  }

  /**
   * Evaluate workflow conditions against context
   * @private
   * @param {WorkflowCondition[]} conditions - Conditions to evaluate
   * @param {Record<string, any>} context - Context to evaluate against
   * @returns {boolean} True if conditions pass, false otherwise
   */
  private evaluateConditions(
    conditions: WorkflowCondition[],
    context: Record<string, any>
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(condition.field, context)
      const result = this.evaluateCondition(fieldValue, condition.operator, condition.value)
      
      if (condition.combineWith === 'OR' && result) {
        return true
      }
      
      if (condition.combineWith !== 'OR' && !result) {
        return false
      }
    }

    return true
  }

  /**
   * Get field value from context using dot notation
   * @private
   * @param {string} field - Field path (e.g., 'patient.email')
   * @param {Record<string, any>} context - Context object
   * @returns {any} The field value or undefined
   */
  private getFieldValue(field: string, context: Record<string, any>): any {
    const parts = field.split('.')
    let value = context
    
    for (const part of parts) {
      value = value?.[part]
    }
    
    return value
  }

  /**
   * Evaluate a single condition
   * @private
   * @param {any} fieldValue - The field value to test
   * @param {string} operator - The comparison operator
   * @param {any} value - The value to compare against
   * @returns {boolean} True if condition passes
   */
  private evaluateCondition(fieldValue: any, operator: string, value: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'contains':
        return String(fieldValue).includes(String(value))
      case 'greater_than':
        return Number(fieldValue) > Number(value)
      case 'less_than':
        return Number(fieldValue) < Number(value)
      default:
        return false
    }
  }

  /**
   * Add log entry to execution
   * @private
   * @param {string} executionId - The execution ID
   * @param {string} stepId - The step ID
   * @param {'debug' | 'info' | 'warn' | 'error'} level - Log level
   * @param {string} message - Log message
   * @param {any} [data] - Optional additional data
   */
  private addLog(
    executionId: string,
    stepId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    const execution = this.executions.get(executionId)
    
    if (execution) {
      const log: WorkflowLog = {
        timestamp: new Date(),
        stepId,
        level,
        message,
        data
      }
      
      execution.logs.push(log)
      
      // Also log to system logger
      const logMessage = `Workflow ${executionId}: ${message}`
      switch (level) {
        case 'debug':
          logger.debug(logMessage, data)
          break
        case 'info':
          logger.info(logMessage, data)
          break
        case 'warn':
          logger.warn(logMessage, data)
          break
        case 'error':
          logger.error(logMessage, data)
          break
      }
    }
  }

  /**
   * Get workflow execution status
   * @param {string} executionId - The execution ID
   * @returns {WorkflowExecution | undefined} The execution or undefined if not found
   */
  public getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId)
  }

  /**
   * Get all workflows
   * @returns {WorkflowDefinition[]} Array of all workflow definitions
   */
  public getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  /**
   * Get workflow by ID
   * @param {string} workflowId - The workflow ID
   * @returns {WorkflowDefinition | undefined} The workflow or undefined if not found
   */
  public getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId)
  }

  /**
   * Cancel a running workflow
   * @param {string} executionId - The execution ID to cancel
   * @returns {Promise<void>} Resolves when workflow is cancelled
   */
  public async cancelWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    
    if (execution && execution.status === TaskStatus.RUNNING) {
      execution.status = TaskStatus.CANCELLED
      execution.completedAt = new Date()
      this.addLog(executionId, 'workflow', 'warn', 'Workflow cancelled by user')
      logger.info(`Workflow Engine: Cancelled execution ${executionId}`)
    }
  }

  /**
   * Shutdown the workflow engine
   * @returns {Promise<void>} Resolves when shutdown is complete
   * @throws {Error} If shutdown fails
   */
  public async shutdown(): Promise<void> {
    try {
      // Cancel all running executions
      for (const [executionId, execution] of this.executions.entries()) {
        if (execution.status === TaskStatus.RUNNING) {
          await this.cancelWorkflow(executionId)
        }
      }
      
      this.isInitialized = false
      logger.info('Workflow Engine: Shutdown complete')
    } catch (error) {
      logger.error('Workflow Engine: Error during shutdown', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

// Export singleton instance
export const workflowEngine = WorkflowEngine.getInstance()
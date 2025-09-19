import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '../types/workflows/visual-builder';

export class WorkflowBuilder {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  /**
   * Create a new workflow
   */
  public createWorkflow(name: string, description: string): string {
    const id = this.generateWorkflowId();
    const workflow: WorkflowDefinition = {
      id,
      name,
      description,
      nodes: [],
      edges: []
    };

    this.workflows.set(id, workflow);
    return id;
  }

  /**
   * Get a workflow by ID
   */
  public getWorkflow(id: string): WorkflowDefinition | null {
    return this.workflows.get(id) || null;
  }

  /**
   * Add a node to a workflow
   */
  public addNode(workflowId: string, node: Omit<WorkflowNode, 'id'>): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const nodeId = this.generateNodeId();
    const newNode: WorkflowNode = {
      id: nodeId,
      ...node
    };

    workflow.nodes.push(newNode);
    return nodeId;
  }

  /**
   * Update a node in a workflow
   */
  public updateNode(workflowId: string, nodeId: string, node: Omit<WorkflowNode, 'id'>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new Error(`Node ${nodeId} not found`);
    }

    workflow.nodes[nodeIndex] = {
      id: nodeId,
      ...node
    };

    return true;
  }

  /**
   * Remove a node from a workflow
   */
  public removeNode(workflowId: string, nodeId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Remove the node
    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      return false;
    }

    workflow.nodes.splice(nodeIndex, 1);

    // Remove all edges connected to this node
    workflow.edges = workflow.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );

    return true;
  }

  /**
   * Add an edge to a workflow
   */
  public addEdge(workflowId: string, edge: Omit<WorkflowEdge, 'id'>): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Validate that source and target nodes exist
    const sourceNode = workflow.nodes.find(n => n.id === edge.source);
    const targetNode = workflow.nodes.find(n => n.id === edge.target);

    if (!sourceNode) {
      throw new Error(`Source node ${edge.source} not found`);
    }

    if (!targetNode) {
      throw new Error(`Target node ${edge.target} not found`);
    }

    const edgeId = this.generateEdgeId();
    const newEdge: WorkflowEdge = {
      id: edgeId,
      ...edge
    };

    workflow.edges.push(newEdge);
    return edgeId;
  }

  /**
   * Remove an edge from a workflow
   */
  public removeEdge(workflowId: string, edge: Omit<WorkflowEdge, 'id'>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const edgeIndex = workflow.edges.findIndex(
      e => e.source === edge.source && e.target === edge.target
    );

    if (edgeIndex === -1) {
      return false;
    }

    workflow.edges.splice(edgeIndex, 1);
    return true;
  }

  /**
   * Update workflow metadata
   */
  public updateWorkflow(workflowId: string, updates: Partial<Pick<WorkflowDefinition, 'name' | 'description'>>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (updates.name !== undefined) {
      workflow.name = updates.name;
    }

    if (updates.description !== undefined) {
      workflow.description = updates.description;
    }

    return true;
  }

  /**
   * Delete a workflow
   */
  public deleteWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  /**
   * List all workflows
   */
  public listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Clone a workflow
   */
  public cloneWorkflow(workflowId: string, newName: string, newDescription?: string): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const newId = this.generateWorkflowId();
    const clonedWorkflow: WorkflowDefinition = {
      ...workflow,
      id: newId,
      name: newName,
      description: newDescription || workflow.description
    };

    this.workflows.set(newId, clonedWorkflow);
    return newId;
  }

  /**
   * Export a workflow to JSON
   */
  public exportWorkflow(workflowId: string): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    return JSON.stringify(workflow, null, 2);
  }

  /**
   * Import a workflow from JSON
   */
  public importWorkflow(json: string): string {
    try {
      const workflow: WorkflowDefinition = JSON.parse(json);
      
      // Validate the workflow structure
      if (!workflow.id || !workflow.name || !Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
        throw new Error('Invalid workflow structure');
      }

      // Generate new ID to avoid conflicts
      const newId = this.generateWorkflowId();
      workflow.id = newId;

      this.workflows.set(newId, workflow);
      return newId;
    } catch (error) {
      throw new Error(`Failed to import workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique node ID
   */
  private generateNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique edge ID
   */
  private generateEdgeId(): string {
    return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

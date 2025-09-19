import { EventEmitter } from 'events';
import { WorkflowDefinition } from '../types/workflows/visual-builder';

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string;
  name: string;
  description?: string;
  workflow: WorkflowDefinition;
  author: string;
  createdAt: Date;
  parentVersionId?: string;
  branch: string;
  tags: string[];
  isActive: boolean;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    complexity: number;
    estimatedExecutionTime: number;
    lastModified: Date;
    checksum: string;
  };
}

export interface WorkflowBranch {
  id: string;
  name: string;
  workflowId: string;
  baseVersionId: string;
  headVersionId: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  author: string;
  description?: string;
}

export interface WorkflowChange {
  id: string;
  versionId: string;
  type: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'edge_modified' | 'property_changed';
  nodeId?: string;
  edgeId?: string;
  property?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  author: string;
  description?: string;
}

export interface WorkflowDiff {
  versionA: string;
  versionB: string;
  changes: WorkflowChange[];
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
  modifiedEdges: string[];
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  id: string;
  type: 'node' | 'edge' | 'property';
  nodeId?: string;
  edgeId?: string;
  property?: string;
  versionAValue: any;
  versionBValue: any;
  resolution?: 'versionA' | 'versionB' | 'custom';
  customValue?: any;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface MergeResult {
  success: boolean;
  mergedVersionId?: string;
  conflicts: ConflictInfo[];
  changes: WorkflowChange[];
  error?: string;
}

export interface VersionComparison {
  versionA: WorkflowVersion;
  versionB: WorkflowVersion;
  diff: WorkflowDiff;
  similarity: number;
  breakingChanges: WorkflowChange[];
  performanceImpact: {
    executionTimeChange: number;
    memoryUsageChange: number;
    complexityChange: number;
  };
}

export class WorkflowVersionControl extends EventEmitter {
  private versions: Map<string, WorkflowVersion> = new Map();
  private branches: Map<string, WorkflowBranch> = new Map();
  private changes: Map<string, WorkflowChange[]> = new Map();
  private activeVersions: Map<string, string> = new Map(); // workflowId -> versionId

  /**
   * Create a new version of a workflow
   */
  public createVersion(
    workflowId: string,
    workflow: WorkflowDefinition,
    author: string,
    name: string,
    description?: string,
    parentVersionId?: string,
    branch: string = 'main'
  ): WorkflowVersion {
    const versionId = this.generateVersionId();
    const version = this.calculateVersionNumber(workflowId, branch);
    
    const workflowVersion: WorkflowVersion = {
      id: versionId,
      workflowId,
      version,
      name,
      description,
      workflow: this.deepClone(workflow),
      author,
      createdAt: new Date(),
      parentVersionId,
      branch,
      tags: [],
      isActive: true,
      metadata: this.calculateMetadata(workflow)
    };

    this.versions.set(versionId, workflowVersion);
    this.activeVersions.set(workflowId, versionId);
    this.changes.set(versionId, []);

    this.emit('version-created', versionId, workflowVersion);
    return workflowVersion;
  }

  /**
   * Get a specific version
   */
  public getVersion(versionId: string): WorkflowVersion | null {
    return this.versions.get(versionId) || null;
  }

  /**
   * Get all versions for a workflow
   */
  public getWorkflowVersions(workflowId: string): WorkflowVersion[] {
    return Array.from(this.versions.values())
      .filter(v => v.workflowId === workflowId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get active version for a workflow
   */
  public getActiveVersion(workflowId: string): WorkflowVersion | null {
    const activeVersionId = this.activeVersions.get(workflowId);
    if (!activeVersionId) return null;
    return this.getVersion(activeVersionId);
  }

  /**
   * Set active version
   */
  public setActiveVersion(workflowId: string, versionId: string): boolean {
    const version = this.getVersion(versionId);
    if (!version || version.workflowId !== workflowId) {
      return false;
    }

    this.activeVersions.set(workflowId, versionId);
    this.emit('active-version-changed', workflowId, versionId);
    return true;
  }

  /**
   * Create a new branch
   */
  public createBranch(
    workflowId: string,
    branchName: string,
    baseVersionId: string,
    author: string,
    description?: string
  ): WorkflowBranch | null {
    const baseVersion = this.getVersion(baseVersionId);
    if (!baseVersion || baseVersion.workflowId !== workflowId) {
      return null;
    }

    const branchId = this.generateBranchId();
    const branch: WorkflowBranch = {
      id: branchId,
      name: branchName,
      workflowId,
      baseVersionId,
      headVersionId: baseVersionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      author,
      description
    };

    this.branches.set(branchId, branch);
    this.emit('branch-created', branchId, branch);
    return branch;
  }

  /**
   * Get all branches for a workflow
   */
  public getWorkflowBranches(workflowId: string): WorkflowBranch[] {
    return Array.from(this.branches.values())
      .filter(b => b.workflowId === workflowId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Get branch by name
   */
  public getBranch(workflowId: string, branchName: string): WorkflowBranch | null {
    return Array.from(this.branches.values())
      .find(b => b.workflowId === workflowId && b.name === branchName) || null;
  }

  /**
   * Update branch head
   */
  public updateBranchHead(branchId: string, versionId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch) return false;

    const version = this.getVersion(versionId);
    if (!version || version.workflowId !== branch.workflowId) {
      return false;
    }

    branch.headVersionId = versionId;
    branch.lastActivity = new Date();
    this.emit('branch-updated', branchId, branch);
    return true;
  }

  /**
   * Record a change to a version
   */
  public recordChange(
    versionId: string,
    type: WorkflowChange['type'],
    author: string,
    nodeId?: string,
    edgeId?: string,
    property?: string,
    oldValue?: any,
    newValue?: any,
    description?: string
  ): WorkflowChange | null {
    const version = this.getVersion(versionId);
    if (!version) return null;

    const change: WorkflowChange = {
      id: this.generateChangeId(),
      versionId,
      type,
      nodeId,
      edgeId,
      property,
      oldValue,
      newValue,
      timestamp: new Date(),
      author,
      description
    };

    const changes = this.changes.get(versionId) || [];
    changes.push(change);
    this.changes.set(versionId, changes);

    this.emit('change-recorded', versionId, change);
    return change;
  }

  /**
   * Get changes for a version
   */
  public getVersionChanges(versionId: string): WorkflowChange[] {
    return this.changes.get(versionId) || [];
  }

  /**
   * Compare two versions
   */
  public compareVersions(versionAId: string, versionBId: string): WorkflowDiff | null {
    const versionA = this.getVersion(versionAId);
    const versionB = this.getVersion(versionBId);
    
    if (!versionA || !versionB) return null;

    const changes: WorkflowChange[] = [];
    const addedNodes: string[] = [];
    const removedNodes: string[] = [];
    const modifiedNodes: string[] = [];
    const addedEdges: string[] = [];
    const removedEdges: string[] = [];
    const modifiedEdges: string[] = [];
    const conflicts: ConflictInfo[] = [];

    // Compare nodes
    const nodesA = new Map(versionA.workflow.nodes.map(n => [n.id, n]));
    const nodesB = new Map(versionB.workflow.nodes.map(n => [n.id, n]));

    for (const [nodeId, nodeB] of nodesB) {
      const nodeA = nodesA.get(nodeId);
      if (!nodeA) {
        addedNodes.push(nodeId);
        changes.push({
          id: this.generateChangeId(),
          versionId: versionBId,
          type: 'node_added',
          nodeId,
          newValue: nodeB,
          timestamp: new Date(),
          author: 'system'
        });
      } else if (!this.deepEqual(nodeA, nodeB)) {
        modifiedNodes.push(nodeId);
        changes.push({
          id: this.generateChangeId(),
          versionId: versionBId,
          type: 'node_modified',
          nodeId,
          oldValue: nodeA,
          newValue: nodeB,
          timestamp: new Date(),
          author: 'system'
        });
      }
    }

    for (const [nodeId, nodeA] of nodesA) {
      if (!nodesB.has(nodeId)) {
        removedNodes.push(nodeId);
        changes.push({
          id: this.generateChangeId(),
          versionId: versionBId,
          type: 'node_removed',
          nodeId,
          oldValue: nodeA,
          timestamp: new Date(),
          author: 'system'
        });
      }
    }

    // Compare edges
    const edgesA = new Map(versionA.workflow.edges.map(e => [e.id, e]));
    const edgesB = new Map(versionB.workflow.edges.map(e => [e.id, e]));

    for (const [edgeId, edgeB] of edgesB) {
      const edgeA = edgesA.get(edgeId);
      if (!edgeA) {
        addedEdges.push(edgeId);
        changes.push({
          id: this.generateChangeId(),
          versionId: versionBId,
          type: 'edge_added',
          edgeId,
          newValue: edgeB,
          timestamp: new Date(),
          author: 'system'
        });
      } else if (!this.deepEqual(edgeA, edgeB)) {
        modifiedEdges.push(edgeId);
        changes.push({
          id: this.generateChangeId(),
          versionId: versionBId,
          type: 'edge_modified',
          edgeId,
          oldValue: edgeA,
          newValue: edgeB,
          timestamp: new Date(),
          author: 'system'
        });
      }
    }

    for (const [edgeId, edgeA] of edgesA) {
      if (!edgesB.has(edgeId)) {
        removedEdges.push(edgeId);
        changes.push({
          id: this.generateChangeId(),
          versionId: versionBId,
          type: 'edge_removed',
          edgeId,
          oldValue: edgeA,
          timestamp: new Date(),
          author: 'system'
        });
      }
    }

    return {
      versionA: versionAId,
      versionB: versionBId,
      changes,
      addedNodes,
      removedNodes,
      modifiedNodes,
      addedEdges,
      removedEdges,
      modifiedEdges,
      conflicts
    };
  }

  /**
   * Merge two branches
   */
  public mergeBranches(
    sourceBranchId: string,
    targetBranchId: string,
    author: string,
    strategy: 'fast-forward' | 'merge-commit' | 'squash' = 'merge-commit'
  ): MergeResult {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    
    if (!sourceBranch || !targetBranch) {
      return { success: false, conflicts: [], changes: [], error: 'Branch not found' };
    }

    if (sourceBranch.workflowId !== targetBranch.workflowId) {
      return { success: false, conflicts: [], changes: [], error: 'Branches belong to different workflows' };
    }

    const sourceVersion = this.getVersion(sourceBranch.headVersionId);
    const targetVersion = this.getVersion(targetBranch.headVersionId);
    
    if (!sourceVersion || !targetVersion) {
      return { success: false, conflicts: [], changes: [], error: 'Version not found' };
    }

    // Compare versions to detect conflicts
    const diff = this.compareVersions(targetVersion.id, sourceVersion.id);
    if (!diff) {
      return { success: false, conflicts: [], changes: [], error: 'Failed to compare versions' };
    }

    const conflicts: ConflictInfo[] = [];
    
    // Check for conflicts in modified nodes/edges
    for (const change of diff.changes) {
      if (change.type === 'node_modified' || change.type === 'edge_modified') {
        // Check if there are conflicting changes
        const conflictingChange = diff.changes.find(c => 
          c !== change && 
          ((c.type === 'node_modified' && c.nodeId === change.nodeId) ||
           (c.type === 'edge_modified' && c.edgeId === change.edgeId))
        );
        
        if (conflictingChange) {
          conflicts.push({
            id: this.generateConflictId(),
            type: change.type === 'node_modified' ? 'node' : 'edge',
            nodeId: change.nodeId,
            edgeId: change.edgeId,
            versionAValue: change.oldValue,
            versionBValue: change.newValue,
            resolvedBy: author,
            resolvedAt: new Date()
          });
        }
      }
    }

    if (conflicts.length > 0) {
      return { success: false, conflicts, changes: diff.changes };
    }

    // Create merge commit
    const mergedWorkflow = this.mergeWorkflows(targetVersion.workflow, sourceVersion.workflow);
    const mergedVersion = this.createVersion(
      sourceBranch.workflowId,
      mergedWorkflow,
      author,
      `Merge ${sourceBranch.name} into ${targetBranch.name}`,
      `Merged branch ${sourceBranch.name} into ${targetBranch.name}`,
      targetVersion.id,
      targetBranch.name
    );

    // Update target branch head
    this.updateBranchHead(targetBranchId, mergedVersion.id);

    this.emit('branches-merged', sourceBranchId, targetBranchId, mergedVersion.id);
    
    return {
      success: true,
      mergedVersionId: mergedVersion.id,
      conflicts: [],
      changes: diff.changes
    };
  }

  /**
   * Resolve a conflict
   */
  public resolveConflict(
    conflictId: string,
    resolution: 'versionA' | 'versionB' | 'custom',
    customValue?: any,
    resolvedBy: string
  ): boolean {
    // In a real implementation, this would update the conflict resolution
    // For now, we'll just emit an event
    this.emit('conflict-resolved', conflictId, resolution, customValue, resolvedBy);
    return true;
  }

  /**
   * Rollback to a previous version
   */
  public rollbackToVersion(workflowId: string, versionId: string, author: string): WorkflowVersion | null {
    const version = this.getVersion(versionId);
    if (!version || version.workflowId !== workflowId) {
      return null;
    }

    // Create a new version based on the rollback target
    const rollbackVersion = this.createVersion(
      workflowId,
      version.workflow,
      author,
      `Rollback to ${version.name}`,
      `Rolled back to version ${version.version}`,
      this.activeVersions.get(workflowId),
      version.branch
    );

    this.setActiveVersion(workflowId, rollbackVersion.id);
    this.emit('rollback-performed', workflowId, versionId, rollbackVersion.id);
    
    return rollbackVersion;
  }

  /**
   * Get version history
   */
  public getVersionHistory(workflowId: string, limit: number = 50): WorkflowVersion[] {
    return this.getWorkflowVersions(workflowId).slice(0, limit);
  }

  /**
   * Tag a version
   */
  public tagVersion(versionId: string, tag: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
      this.emit('version-tagged', versionId, tag);
    }
    return true;
  }

  /**
   * Get versions by tag
   */
  public getVersionsByTag(workflowId: string, tag: string): WorkflowVersion[] {
    return this.getWorkflowVersions(workflowId)
      .filter(v => v.tags.includes(tag));
  }

  /**
   * Calculate workflow metadata
   */
  private calculateMetadata(workflow: WorkflowDefinition) {
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
    
    // Add complexity for nested structures
    const edges = workflow.edges;
    const nodeConnections = new Map<string, number>();
    
    edges.forEach(edge => {
      nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
      nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
    });
    
    // Add complexity for highly connected nodes
    for (const [_, connectionCount] of nodeConnections) {
      if (connectionCount > 3) {
        complexity += connectionCount - 3;
      }
    }
    
    return complexity;
  }

  /**
   * Estimate execution time
   */
  private estimateExecutionTime(workflow: WorkflowDefinition): number {
    // Simple estimation based on node types
    let estimatedTime = 0;
    
    workflow.nodes.forEach(node => {
      switch (node.type) {
        case 'dataProcessor':
          estimatedTime += 100; // 100ms
          break;
        case 'aiAgent':
          estimatedTime += 2000; // 2s
          break;
        case 'if':
        case 'switch':
          estimatedTime += 50; // 50ms
          break;
        case 'loop':
          estimatedTime += 500; // 500ms
          break;
        default:
          estimatedTime += 100; // 100ms
      }
    });
    
    return estimatedTime;
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(workflow: WorkflowDefinition): string {
    const content = JSON.stringify(workflow, null, 0);
    // Simple hash function - in production, use crypto.createHash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Calculate version number
   */
  private calculateVersionNumber(workflowId: string, branch: string): string {
    const versions = this.getWorkflowVersions(workflowId)
      .filter(v => v.branch === branch);
    
    if (versions.length === 0) {
      return '1.0.0';
    }
    
    // Simple versioning - increment patch version
    const latestVersion = versions[0];
    const parts = latestVersion.version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  /**
   * Merge two workflows
   */
  private mergeWorkflows(workflowA: WorkflowDefinition, workflowB: WorkflowDefinition): WorkflowDefinition {
    // Simple merge strategy - prefer workflowB for conflicts
    return {
      ...workflowB,
      id: workflowA.id,
      name: workflowA.name,
      description: workflowA.description
    };
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Generate unique version ID
   */
  private generateVersionId(): string {
    return `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique branch ID
   */
  private generateBranchId(): string {
    return `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique change ID
   */
  private generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique conflict ID
   */
  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

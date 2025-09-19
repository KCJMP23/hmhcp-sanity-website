// Workflow Versioning System
// Manages workflow versions, rollbacks, and change tracking

import { WorkflowDefinition } from '@/types/workflows/visual-builder';

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  description: string;
  definition: WorkflowDefinition['definition'];
  created_by: string;
  created_at: Date;
  is_active: boolean;
  change_summary: string;
  parent_version?: number;
}

export interface WorkflowChange {
  type: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'edge_modified' | 'metadata_changed';
  nodeId?: string;
  edgeId?: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface VersionComparison {
  added: WorkflowChange[];
  removed: WorkflowChange[];
  modified: WorkflowChange[];
  summary: string;
}

export class WorkflowVersionManager {
  private versions: Map<string, WorkflowVersion[]> = new Map();

  async createVersion(
    workflowId: string,
    definition: WorkflowDefinition['definition'],
    metadata: {
      name: string;
      description: string;
      created_by: string;
      change_summary: string;
    }
  ): Promise<WorkflowVersion> {
    const workflowVersions = this.versions.get(workflowId) || [];
    const nextVersion = workflowVersions.length + 1;

    // Deactivate current active version
    workflowVersions.forEach(version => {
      version.is_active = false;
    });

    const newVersion: WorkflowVersion = {
      id: `${workflowId}-v${nextVersion}`,
      workflowId,
      version: nextVersion,
      name: metadata.name,
      description: metadata.description,
      definition,
      created_by: metadata.created_by,
      created_at: new Date(),
      is_active: true,
      change_summary: metadata.change_summary,
      parent_version: workflowVersions.length > 0 ? workflowVersions[workflowVersions.length - 1].version : undefined
    };

    workflowVersions.push(newVersion);
    this.versions.set(workflowId, workflowVersions);

    return newVersion;
  }

  async getVersions(workflowId: string): Promise<WorkflowVersion[]> {
    return this.versions.get(workflowId) || [];
  }

  async getVersion(workflowId: string, version: number): Promise<WorkflowVersion | null> {
    const workflowVersions = this.versions.get(workflowId) || [];
    return workflowVersions.find(v => v.version === version) || null;
  }

  async getActiveVersion(workflowId: string): Promise<WorkflowVersion | null> {
    const workflowVersions = this.versions.get(workflowId) || [];
    return workflowVersions.find(v => v.is_active) || null;
  }

  async rollbackToVersion(workflowId: string, targetVersion: number): Promise<WorkflowVersion | null> {
    const workflowVersions = this.versions.get(workflowId) || [];
    const targetVersionData = workflowVersions.find(v => v.version === targetVersion);
    
    if (!targetVersionData) return null;

    // Deactivate current active version
    workflowVersions.forEach(version => {
      version.is_active = false;
    });

    // Create new version based on target version
    const rollbackVersion: WorkflowVersion = {
      id: `${workflowId}-v${workflowVersions.length + 1}`,
      workflowId,
      version: workflowVersions.length + 1,
      name: `${targetVersionData.name} (Rollback)`,
      description: `Rollback to version ${targetVersion}`,
      definition: targetVersionData.definition,
      created_by: 'system',
      created_at: new Date(),
      is_active: true,
      change_summary: `Rollback to version ${targetVersion}`,
      parent_version: targetVersion
    };

    workflowVersions.push(rollbackVersion);
    this.versions.set(workflowId, workflowVersions);

    return rollbackVersion;
  }

  async compareVersions(
    workflowId: string, 
    version1: number, 
    version2: number
  ): Promise<VersionComparison> {
    const v1 = await this.getVersion(workflowId, version1);
    const v2 = await this.getVersion(workflowId, version2);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    return this.calculateDifferences(v1.definition, v2.definition);
  }

  private calculateDifferences(
    definition1: WorkflowDefinition['definition'],
    definition2: WorkflowDefinition['definition']
  ): VersionComparison {
    const changes: WorkflowChange[] = [];
    const added: WorkflowChange[] = [];
    const removed: WorkflowChange[] = [];
    const modified: WorkflowChange[] = [];

    // Compare nodes
    const nodes1 = new Map(definition1.nodes.map(node => [node.id, node]));
    const nodes2 = new Map(definition2.nodes.map(node => [node.id, node]));

    // Find added nodes
    for (const [nodeId, node2] of nodes2) {
      if (!nodes1.has(nodeId)) {
        const change: WorkflowChange = {
          type: 'node_added',
          nodeId,
          description: `Node "${node2.data.label || nodeId}" added`
        };
        added.push(change);
        changes.push(change);
      }
    }

    // Find removed nodes
    for (const [nodeId, node1] of nodes1) {
      if (!nodes2.has(nodeId)) {
        const change: WorkflowChange = {
          type: 'node_removed',
          nodeId,
          description: `Node "${node1.data.label || nodeId}" removed`
        };
        removed.push(change);
        changes.push(change);
      }
    }

    // Find modified nodes
    for (const [nodeId, node1] of nodes1) {
      const node2 = nodes2.get(nodeId);
      if (node2) {
        const nodeChanges = this.compareNodes(node1, node2);
        modified.push(...nodeChanges);
        changes.push(...nodeChanges);
      }
    }

    // Compare edges
    const edges1 = new Map(definition1.edges.map(edge => [`${edge.source}-${edge.target}`, edge]));
    const edges2 = new Map(definition2.edges.map(edge => [`${edge.source}-${edge.target}`, edge]));

    // Find added edges
    for (const [edgeKey, edge2] of edges2) {
      if (!edges1.has(edgeKey)) {
        const change: WorkflowChange = {
          type: 'edge_added',
          edgeId: edge2.id,
          description: `Connection added from ${edge2.source} to ${edge2.target}`
        };
        added.push(change);
        changes.push(change);
      }
    }

    // Find removed edges
    for (const [edgeKey, edge1] of edges1) {
      if (!edges2.has(edgeKey)) {
        const change: WorkflowChange = {
          type: 'edge_removed',
          edgeId: edge1.id,
          description: `Connection removed from ${edge1.source} to ${edge1.target}`
        };
        removed.push(change);
        changes.push(change);
      }
    }

    // Find modified edges
    for (const [edgeKey, edge1] of edges1) {
      const edge2 = edges2.get(edgeKey);
      if (edge2) {
        const edgeChanges = this.compareEdges(edge1, edge2);
        modified.push(...edgeChanges);
        changes.push(...edgeChanges);
      }
    }

    const summary = this.generateChangeSummary(added, removed, modified);

    return {
      added,
      removed,
      modified,
      summary
    };
  }

  private compareNodes(node1: any, node2: any): WorkflowChange[] {
    const changes: WorkflowChange[] = [];

    // Compare position
    if (node1.position.x !== node2.position.x || node1.position.y !== node2.position.y) {
      changes.push({
        type: 'node_modified',
        nodeId: node1.id,
        field: 'position',
        oldValue: node1.position,
        newValue: node2.position,
        description: `Node position changed`
      });
    }

    // Compare data
    const dataChanges = this.compareObjects(node1.data, node2.data, 'data');
    changes.push(...dataChanges.map(change => ({
      ...change,
      nodeId: node1.id,
      type: 'node_modified' as const
    })));

    return changes;
  }

  private compareEdges(edge1: any, edge2: any): WorkflowChange[] {
    const changes: WorkflowChange[] = [];

    if (edge1.type !== edge2.type) {
      changes.push({
        type: 'edge_modified',
        edgeId: edge1.id,
        field: 'type',
        oldValue: edge1.type,
        newValue: edge2.type,
        description: `Edge type changed from ${edge1.type} to ${edge2.type}`
      });
    }

    if (edge1.animated !== edge2.animated) {
      changes.push({
        type: 'edge_modified',
        edgeId: edge1.id,
        field: 'animated',
        oldValue: edge1.animated,
        newValue: edge2.animated,
        description: `Edge animation changed`
      });
    }

    return changes;
  }

  private compareObjects(obj1: any, obj2: any, path: string): WorkflowChange[] {
    const changes: WorkflowChange[] = [];

    for (const key in obj1) {
      if (obj1.hasOwnProperty(key) && !obj2.hasOwnProperty(key)) {
        changes.push({
          type: 'node_modified',
          field: `${path}.${key}`,
          oldValue: obj1[key],
          newValue: undefined,
          description: `Field ${path}.${key} removed`
        });
      }
    }

    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (!obj1.hasOwnProperty(key)) {
          changes.push({
            type: 'node_modified',
            field: `${path}.${key}`,
            oldValue: undefined,
            newValue: obj2[key],
            description: `Field ${path}.${key} added`
          });
        } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
          changes.push({
            type: 'node_modified',
            field: `${path}.${key}`,
            oldValue: obj1[key],
            newValue: obj2[key],
            description: `Field ${path}.${key} changed`
          });
        }
      }
    }

    return changes;
  }

  private generateChangeSummary(added: WorkflowChange[], removed: WorkflowChange[], modified: WorkflowChange[]): string {
    const totalChanges = added.length + removed.length + modified.length;
    
    if (totalChanges === 0) {
      return 'No changes detected';
    }

    const parts: string[] = [];
    
    if (added.length > 0) {
      parts.push(`${added.length} added`);
    }
    
    if (removed.length > 0) {
      parts.push(`${removed.length} removed`);
    }
    
    if (modified.length > 0) {
      parts.push(`${modified.length} modified`);
    }

    return `Total changes: ${totalChanges} (${parts.join(', ')})`;
  }

  async getChangeHistory(workflowId: string): Promise<WorkflowChange[]> {
    const versions = await this.getVersions(workflowId);
    const changes: WorkflowChange[] = [];

    for (let i = 1; i < versions.length; i++) {
      const current = versions[i];
      const previous = versions[i - 1];
      
      const comparison = this.calculateDifferences(previous.definition, current.definition);
      changes.push(...comparison.added, ...comparison.removed, ...comparison.modified);
    }

    return changes;
  }

  async deleteVersion(workflowId: string, version: number): Promise<boolean> {
    const workflowVersions = this.versions.get(workflowId) || [];
    const versionIndex = workflowVersions.findIndex(v => v.version === version);
    
    if (versionIndex === -1) return false;

    const versionToDelete = workflowVersions[versionIndex];
    
    // Don't allow deleting the only version
    if (workflowVersions.length === 1) return false;

    // If deleting active version, activate the previous version
    if (versionToDelete.is_active) {
      const previousVersion = workflowVersions[versionIndex - 1];
      if (previousVersion) {
        previousVersion.is_active = true;
      }
    }

    workflowVersions.splice(versionIndex, 1);
    this.versions.set(workflowId, workflowVersions);

    return true;
  }
}

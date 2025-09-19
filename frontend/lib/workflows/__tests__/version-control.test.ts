import { WorkflowVersionControl, WorkflowVersion, WorkflowBranch, WorkflowDiff } from '../version-control';
import { WorkflowDefinition } from '../../types/workflows/visual-builder';

// Mock workflow for testing
const createMockWorkflow = (id: string = 'test-workflow'): WorkflowDefinition => ({
  id,
  name: 'Test Workflow',
  description: 'A test workflow',
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { label: 'Start' }
    },
    {
      id: 'process',
      type: 'dataProcessor',
      position: { x: 100, y: 0 },
      data: { label: 'Process Data' }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 200, y: 0 },
      data: { label: 'End' }
    }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'process' },
    { id: 'e2', source: 'process', target: 'end' }
  ]
});

describe('WorkflowVersionControl', () => {
  let versionControl: WorkflowVersionControl;
  let mockWorkflow: WorkflowDefinition;

  beforeEach(() => {
    versionControl = new WorkflowVersionControl();
    mockWorkflow = createMockWorkflow();
  });

  describe('Version Management', () => {
    it('should create a new version', () => {
      const version = versionControl.createVersion(
        'workflow-1',
        mockWorkflow,
        'test-user',
        'Initial Version',
        'First version of the workflow'
      );

      expect(version).toBeDefined();
      expect(version.id).toMatch(/^version-/);
      expect(version.workflowId).toBe('workflow-1');
      expect(version.version).toBe('1.0.0');
      expect(version.name).toBe('Initial Version');
      expect(version.description).toBe('First version of the workflow');
      expect(version.author).toBe('test-user');
      expect(version.branch).toBe('main');
      expect(version.isActive).toBe(true);
      expect(version.tags).toEqual([]);
      expect(version.workflow).toEqual(mockWorkflow);
    });

    it('should create version with custom branch', () => {
      const version = versionControl.createVersion(
        'workflow-1',
        mockWorkflow,
        'test-user',
        'Feature Version',
        'Feature branch version',
        undefined,
        'feature/test'
      );

      expect(version.branch).toBe('feature/test');
    });

    it('should get a specific version', () => {
      const version = versionControl.createVersion(
        'workflow-1',
        mockWorkflow,
        'test-user',
        'Test Version'
      );

      const retrieved = versionControl.getVersion(version.id);
      expect(retrieved).toEqual(version);
    });

    it('should return null for non-existent version', () => {
      const retrieved = versionControl.getVersion('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all versions for a workflow', () => {
      const version1 = versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Version 1');
      const version2 = versionControl.createVersion('workflow-1', mockWorkflow, 'user2', 'Version 2');
      const version3 = versionControl.createVersion('workflow-2', mockWorkflow, 'user3', 'Version 3');

      const workflowVersions = versionControl.getWorkflowVersions('workflow-1');
      expect(workflowVersions).toHaveLength(2);
      expect(workflowVersions).toContain(version1);
      expect(workflowVersions).toContain(version2);
      expect(workflowVersions).not.toContain(version3);
    });

    it('should get active version for a workflow', () => {
      const version = versionControl.createVersion('workflow-1', mockWorkflow, 'test-user', 'Test Version');
      const activeVersion = versionControl.getActiveVersion('workflow-1');
      
      expect(activeVersion).toEqual(version);
    });

    it('should set active version', () => {
      const version1 = versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Version 1');
      const version2 = versionControl.createVersion('workflow-1', mockWorkflow, 'user2', 'Version 2');

      const success = versionControl.setActiveVersion('workflow-1', version2.id);
      expect(success).toBe(true);

      const activeVersion = versionControl.getActiveVersion('workflow-1');
      expect(activeVersion).toEqual(version2);
    });

    it('should not set active version for different workflow', () => {
      const version = versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Version 1');
      const success = versionControl.setActiveVersion('workflow-2', version.id);
      
      expect(success).toBe(false);
    });

    it('should tag a version', () => {
      const version = versionControl.createVersion('workflow-1', mockWorkflow, 'test-user', 'Test Version');
      const success = versionControl.tagVersion(version.id, 'v1.0.0');
      
      expect(success).toBe(true);
      expect(version.tags).toContain('v1.0.0');
    });

    it('should not tag non-existent version', () => {
      const success = versionControl.tagVersion('non-existent', 'v1.0.0');
      expect(success).toBe(false);
    });

    it('should get versions by tag', () => {
      const version1 = versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Version 1');
      const version2 = versionControl.createVersion('workflow-1', mockWorkflow, 'user2', 'Version 2');
      
      versionControl.tagVersion(version1.id, 'stable');
      versionControl.tagVersion(version2.id, 'beta');

      const stableVersions = versionControl.getVersionsByTag('workflow-1', 'stable');
      expect(stableVersions).toHaveLength(1);
      expect(stableVersions[0]).toEqual(version1);
    });
  });

  describe('Branch Management', () => {
    let baseVersion: WorkflowVersion;

    beforeEach(() => {
      baseVersion = versionControl.createVersion('workflow-1', mockWorkflow, 'test-user', 'Base Version');
    });

    it('should create a new branch', () => {
      const branch = versionControl.createBranch(
        'workflow-1',
        'feature/test',
        baseVersion.id,
        'test-user',
        'Test feature branch'
      );

      expect(branch).toBeDefined();
      expect(branch.id).toMatch(/^branch-/);
      expect(branch.name).toBe('feature/test');
      expect(branch.workflowId).toBe('workflow-1');
      expect(branch.baseVersionId).toBe(baseVersion.id);
      expect(branch.headVersionId).toBe(baseVersion.id);
      expect(branch.author).toBe('test-user');
      expect(branch.description).toBe('Test feature branch');
      expect(branch.isActive).toBe(true);
    });

    it('should not create branch for non-existent version', () => {
      const branch = versionControl.createBranch(
        'workflow-1',
        'feature/test',
        'non-existent',
        'test-user'
      );

      expect(branch).toBeNull();
    });

    it('should not create branch for different workflow', () => {
      const branch = versionControl.createBranch(
        'workflow-2',
        'feature/test',
        baseVersion.id,
        'test-user'
      );

      expect(branch).toBeNull();
    });

    it('should get all branches for a workflow', () => {
      const branch1 = versionControl.createBranch('workflow-1', 'feature/1', baseVersion.id, 'user1');
      const branch2 = versionControl.createBranch('workflow-1', 'feature/2', baseVersion.id, 'user2');
      const branch3 = versionControl.createBranch('workflow-2', 'feature/3', baseVersion.id, 'user3');

      const workflowBranches = versionControl.getWorkflowBranches('workflow-1');
      expect(workflowBranches).toHaveLength(2);
      expect(workflowBranches).toContain(branch1);
      expect(workflowBranches).toContain(branch2);
      expect(workflowBranches).not.toContain(branch3);
    });

    it('should get branch by name', () => {
      const branch = versionControl.createBranch('workflow-1', 'feature/test', baseVersion.id, 'test-user');
      const retrieved = versionControl.getBranch('workflow-1', 'feature/test');
      
      expect(retrieved).toEqual(branch);
    });

    it('should return null for non-existent branch', () => {
      const retrieved = versionControl.getBranch('workflow-1', 'non-existent');
      expect(retrieved).toBeNull();
    });

    it('should update branch head', () => {
      const branch = versionControl.createBranch('workflow-1', 'feature/test', baseVersion.id, 'test-user');
      const newVersion = versionControl.createVersion('workflow-1', mockWorkflow, 'test-user', 'New Version');

      const success = versionControl.updateBranchHead(branch.id, newVersion.id);
      expect(success).toBe(true);
      expect(branch.headVersionId).toBe(newVersion.id);
    });

    it('should not update branch head for different workflow', () => {
      const branch = versionControl.createBranch('workflow-1', 'feature/test', baseVersion.id, 'test-user');
      const newVersion = versionControl.createVersion('workflow-2', mockWorkflow, 'test-user', 'New Version');

      const success = versionControl.updateBranchHead(branch.id, newVersion.id);
      expect(success).toBe(false);
    });
  });

  describe('Change Tracking', () => {
    let version: WorkflowVersion;

    beforeEach(() => {
      version = versionControl.createVersion('workflow-1', mockWorkflow, 'test-user', 'Test Version');
    });

    it('should record a change', () => {
      const change = versionControl.recordChange(
        version.id,
        'node_added',
        'test-user',
        'new-node',
        undefined,
        undefined,
        undefined,
        { id: 'new-node', type: 'dataProcessor' }
      );

      expect(change).toBeDefined();
      expect(change?.versionId).toBe(version.id);
      expect(change?.type).toBe('node_added');
      expect(change?.nodeId).toBe('new-node');
      expect(change?.author).toBe('test-user');
    });

    it('should not record change for non-existent version', () => {
      const change = versionControl.recordChange(
        'non-existent',
        'node_added',
        'test-user'
      );

      expect(change).toBeNull();
    });

    it('should get changes for a version', () => {
      versionControl.recordChange(version.id, 'node_added', 'user1', 'node1');
      versionControl.recordChange(version.id, 'edge_added', 'user2', undefined, 'edge1');

      const changes = versionControl.getVersionChanges(version.id);
      expect(changes).toHaveLength(2);
    });
  });

  describe('Version Comparison', () => {
    let version1: WorkflowVersion;
    let version2: WorkflowVersion;

    beforeEach(() => {
      version1 = versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Version 1');
      
      const modifiedWorkflow = {
        ...mockWorkflow,
        nodes: [
          ...mockWorkflow.nodes,
          {
            id: 'new-node',
            type: 'dataProcessor',
            position: { x: 150, y: 0 },
            data: { label: 'New Node' }
          }
        ]
      };
      
      version2 = versionControl.createVersion('workflow-1', modifiedWorkflow, 'user2', 'Version 2');
    });

    it('should compare two versions', () => {
      const diff = versionControl.compareVersions(version1.id, version2.id);
      
      expect(diff).toBeDefined();
      expect(diff?.versionA).toBe(version1.id);
      expect(diff?.versionB).toBe(version2.id);
      expect(diff?.addedNodes).toContain('new-node');
      expect(diff?.changes.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent versions', () => {
      const diff = versionControl.compareVersions('non-existent', version2.id);
      expect(diff).toBeNull();
    });
  });

  describe('Branch Merging', () => {
    let mainBranch: WorkflowBranch;
    let featureBranch: WorkflowBranch;
    let mainVersion: WorkflowVersion;
    let featureVersion: WorkflowVersion;

    beforeEach(() => {
      mainVersion = versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Main Version');
      mainBranch = versionControl.createBranch('workflow-1', 'main', mainVersion.id, 'user1');
      
      const modifiedWorkflow = {
        ...mockWorkflow,
        nodes: [
          ...mockWorkflow.nodes,
          {
            id: 'feature-node',
            type: 'dataProcessor',
            position: { x: 150, y: 0 },
            data: { label: 'Feature Node' }
          }
        ]
      };
      
      featureVersion = versionControl.createVersion('workflow-1', modifiedWorkflow, 'user2', 'Feature Version', undefined, mainVersion.id, 'feature/test');
      featureBranch = versionControl.createBranch('workflow-1', 'feature/test', featureVersion.id, 'user2');
    });

    it('should merge branches successfully', () => {
      const result = versionControl.mergeBranches(featureBranch.id, mainBranch.id, 'user1');
      
      expect(result.success).toBe(true);
      expect(result.mergedVersionId).toBeDefined();
      expect(result.conflicts).toHaveLength(0);
    });

    it('should not merge non-existent branches', () => {
      const result = versionControl.mergeBranches('non-existent', mainBranch.id, 'user1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Branch not found');
    });

    it('should not merge branches from different workflows', () => {
      // Create a version for workflow-2 first
      const otherVersion = versionControl.createVersion('workflow-2', mockWorkflow, 'user1', 'Other Version');
      const otherBranch = versionControl.createBranch('workflow-2', 'other', otherVersion.id, 'user1');
      
      const result = versionControl.mergeBranches(featureBranch.id, otherBranch.id, 'user1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Branches belong to different workflows');
    });
  });

  describe('Rollback', () => {
    let version1: WorkflowVersion;
    let version2: WorkflowVersion;

    beforeEach(() => {
      version1 = versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Version 1');
      version2 = versionControl.createVersion('workflow-1', mockWorkflow, 'user2', 'Version 2');
    });

    it('should rollback to a previous version', () => {
      const rollbackVersion = versionControl.rollbackToVersion('workflow-1', version1.id, 'user1');
      
      expect(rollbackVersion).toBeDefined();
      expect(rollbackVersion?.workflowId).toBe('workflow-1');
      expect(rollbackVersion?.name).toContain('Rollback to');
    });

    it('should not rollback to non-existent version', () => {
      const rollbackVersion = versionControl.rollbackToVersion('workflow-1', 'non-existent', 'user1');
      expect(rollbackVersion).toBeNull();
    });

    it('should not rollback to version from different workflow', () => {
      const rollbackVersion = versionControl.rollbackToVersion('workflow-2', version1.id, 'user1');
      expect(rollbackVersion).toBeNull();
    });
  });

  describe('Version History', () => {
    beforeEach(async () => {
      versionControl.createVersion('workflow-1', mockWorkflow, 'user1', 'Version 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      versionControl.createVersion('workflow-1', mockWorkflow, 'user2', 'Version 2');
      await new Promise(resolve => setTimeout(resolve, 10));
      versionControl.createVersion('workflow-1', mockWorkflow, 'user3', 'Version 3');
    });

    it('should get version history', () => {
      const history = versionControl.getVersionHistory('workflow-1', 2);
      
      expect(history).toHaveLength(2);
      // Should be sorted by creation time (newest first)
      expect(history[0].author).toBe('user3');
      expect(history[1].author).toBe('user2');
    });

    it('should limit history results', () => {
      const history = versionControl.getVersionHistory('workflow-1', 1);
      expect(history).toHaveLength(1);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve a conflict', () => {
      const success = versionControl.resolveConflict('conflict-1', 'versionA', undefined, 'user1');
      expect(success).toBe(true);
    });
  });

  describe('Event Emission', () => {
    let eventSpy: jest.SpyInstance;

    beforeEach(() => {
      eventSpy = jest.fn();
      versionControl.on('version-created', eventSpy);
    });

    it('should emit version-created event', () => {
      versionControl.createVersion('workflow-1', mockWorkflow, 'test-user', 'Test Version');
      expect(eventSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    });
  });
});

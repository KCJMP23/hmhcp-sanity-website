import { WorkflowDebugManager, DebugSession, ExecutionTrace, StepResult } from '../debug-manager';
import { WorkflowDefinition } from '../../types/workflows/visual-builder';

// Mock workflow for testing
const createMockWorkflow = (): WorkflowDefinition => ({
  id: 'test-workflow',
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

describe('WorkflowDebugManager', () => {
  let debugManager: WorkflowDebugManager;

  beforeEach(() => {
    debugManager = new WorkflowDebugManager();
  });

  afterEach(() => {
    // Clean up any remaining sessions
    debugManager.getAllSessions().forEach(session => {
      debugManager.stopDebugging(session.id);
    });
  });

  describe('Session Management', () => {
    it('should create a debug session', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      
      expect(session).toBeDefined();
      expect(session.id).toMatch(/^debug-session-/);
      expect(session.workflowId).toBe('workflow-1');
      expect(session.executionId).toBe('execution-1');
      expect(session.isActive).toBe(true);
      expect(session.breakpoints).toBeInstanceOf(Map);
      expect(session.watches).toBeInstanceOf(Map);
      expect(session.callStack).toEqual([]);
      expect(session.logs).toEqual([]);
    });

    it('should get a debug session', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      const retrieved = debugManager.getSession(session.id);
      
      expect(retrieved).toEqual(session);
    });

    it('should return null for non-existent session', () => {
      const retrieved = debugManager.getSession('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all sessions', () => {
      const session1 = debugManager.createDebugSession('workflow-1', 'execution-1');
      const session2 = debugManager.createDebugSession('workflow-2', 'execution-2');
      
      const allSessions = debugManager.getAllSessions();
      expect(allSessions).toHaveLength(2);
      expect(allSessions).toContain(session1);
      expect(allSessions).toContain(session2);
    });

    it('should stop debugging session', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      const stopped = debugManager.stopDebugging(session.id);
      
      expect(stopped).toBe(true);
      expect(session.isActive).toBe(false);
    });

    it('should clear debug session', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      
      // Add some data
      debugManager.addBreakpoint(session.id, 'node-1');
      debugManager.addWatch(session.id, 'variable1');
      debugManager.addLog(session.id, 'info', 'Test log');
      
      const cleared = debugManager.clearSession(session.id);
      expect(cleared).toBe(true);
      expect(session.breakpoints.size).toBe(0);
      expect(session.watches.size).toBe(0);
      expect(session.logs.length).toBe(0);
    });
  });

  describe('Breakpoint Management', () => {
    let session: DebugSession;

    beforeEach(() => {
      session = debugManager.createDebugSession('workflow-1', 'execution-1');
    });

    it('should add a breakpoint', () => {
      const breakpoint = debugManager.addBreakpoint(session.id, 'node-1', 'x > 5');
      
      expect(breakpoint).toBeDefined();
      expect(breakpoint?.nodeId).toBe('node-1');
      expect(breakpoint?.condition).toBe('x > 5');
      expect(breakpoint?.enabled).toBe(true);
      expect(breakpoint?.hitCount).toBe(0);
      expect(session.breakpoints.has(breakpoint!.id)).toBe(true);
    });

    it('should add a breakpoint without condition', () => {
      const breakpoint = debugManager.addBreakpoint(session.id, 'node-2');
      
      expect(breakpoint).toBeDefined();
      expect(breakpoint?.nodeId).toBe('node-2');
      expect(breakpoint?.condition).toBeUndefined();
      expect(breakpoint?.enabled).toBe(true);
    });

    it('should not add breakpoint to non-existent session', () => {
      const breakpoint = debugManager.addBreakpoint('non-existent', 'node-1');
      expect(breakpoint).toBeNull();
    });

    it('should remove a breakpoint', () => {
      const breakpoint = debugManager.addBreakpoint(session.id, 'node-1');
      const removed = debugManager.removeBreakpoint(session.id, breakpoint!.id);
      
      expect(removed).toBe(true);
      expect(session.breakpoints.has(breakpoint!.id)).toBe(false);
    });

    it('should toggle breakpoint enabled state', () => {
      const breakpoint = debugManager.addBreakpoint(session.id, 'node-1');
      expect(breakpoint?.enabled).toBe(true);
      
      const toggled = debugManager.toggleBreakpoint(session.id, breakpoint!.id);
      expect(toggled).toBe(true);
      expect(breakpoint?.enabled).toBe(false);
      
      const toggledAgain = debugManager.toggleBreakpoint(session.id, breakpoint!.id);
      expect(toggledAgain).toBe(true);
      expect(breakpoint?.enabled).toBe(true);
    });

    it('should not toggle non-existent breakpoint', () => {
      const toggled = debugManager.toggleBreakpoint(session.id, 'non-existent');
      expect(toggled).toBe(false);
    });
  });

  describe('Watch Management', () => {
    let session: DebugSession;

    beforeEach(() => {
      session = debugManager.createDebugSession('workflow-1', 'execution-1');
    });

    it('should add a watch', () => {
      const watch = debugManager.addWatch(session.id, 'variable1', 'x + y');
      
      expect(watch).toBeDefined();
      expect(watch?.name).toBe('variable1');
      expect(watch?.expression).toBe('x + y');
      expect(watch?.enabled).toBe(true);
      expect(session.watches.has(watch!.id)).toBe(true);
    });

    it('should add a watch without expression', () => {
      const watch = debugManager.addWatch(session.id, 'variable2');
      
      expect(watch).toBeDefined();
      expect(watch?.name).toBe('variable2');
      expect(watch?.expression).toBeUndefined();
      expect(watch?.enabled).toBe(true);
    });

    it('should not add watch to non-existent session', () => {
      const watch = debugManager.addWatch('non-existent', 'variable1');
      expect(watch).toBeNull();
    });

    it('should remove a watch', () => {
      const watch = debugManager.addWatch(session.id, 'variable1');
      const removed = debugManager.removeWatch(session.id, watch!.id);
      
      expect(removed).toBe(true);
      expect(session.watches.has(watch!.id)).toBe(false);
    });

    it('should update watch values', () => {
      const watch = debugManager.addWatch(session.id, 'variable1');
      const variables = new Map([['variable1', 42], ['x', 10], ['y', 5]]);
      
      debugManager.updateWatchValues(session.id, variables);
      
      expect(watch?.value).toBe(42);
      expect(watch?.type).toBe('number');
      expect(watch?.lastUpdated).toBeDefined();
    });

    it('should update watch values with expression', () => {
      const watch = debugManager.addWatch(session.id, 'sum', 'x + y');
      const variables = new Map([['x', 10], ['y', 5]]);
      
      debugManager.updateWatchValues(session.id, variables);
      
      expect(watch?.value).toBe(15);
      expect(watch?.type).toBe('number');
    });
  });

  describe('Execution Control', () => {
    let session: DebugSession;

    beforeEach(() => {
      session = debugManager.createDebugSession('workflow-1', 'execution-1');
    });

    it('should step over', () => {
      const stepped = debugManager.stepOver(session.id);
      expect(stepped).toBe(true);
      expect(session.currentStep).toBe(1);
    });

    it('should step into', () => {
      const stepped = debugManager.stepInto(session.id);
      expect(stepped).toBe(true);
      expect(session.currentStep).toBe(1);
    });

    it('should step out', () => {
      const stepped = debugManager.stepOut(session.id);
      expect(stepped).toBe(true);
      expect(session.currentStep).toBe(1);
    });

    it('should continue', () => {
      const continued = debugManager.continue(session.id);
      expect(continued).toBe(true);
    });

    it('should pause', () => {
      const paused = debugManager.pause(session.id);
      expect(paused).toBe(true);
    });

    it('should not control non-existent session', () => {
      expect(debugManager.stepOver('non-existent')).toBe(false);
      expect(debugManager.stepInto('non-existent')).toBe(false);
      expect(debugManager.stepOut('non-existent')).toBe(false);
      expect(debugManager.continue('non-existent')).toBe(false);
      expect(debugManager.pause('non-existent')).toBe(false);
    });
  });

  describe('Logging', () => {
    let session: DebugSession;

    beforeEach(() => {
      session = debugManager.createDebugSession('workflow-1', 'execution-1');
    });

    it('should add debug log', () => {
      debugManager.addLog(session.id, 'debug', 'Debug message', 'node-1', 'Test Node');
      
      expect(session.logs).toHaveLength(1);
      const log = session.logs[0];
      expect(log.level).toBe('debug');
      expect(log.message).toBe('Debug message');
      expect(log.nodeId).toBe('node-1');
      expect(log.nodeName).toBe('Test Node');
    });

    it('should add error log with stack trace', () => {
      const stackTrace = 'Error: Test error\n    at test.js:1:1';
      debugManager.addLog(session.id, 'error', 'Error message', undefined, undefined, { error: 'test' }, stackTrace);
      
      expect(session.logs).toHaveLength(1);
      const log = session.logs[0];
      expect(log.level).toBe('error');
      expect(log.message).toBe('Error message');
      expect(log.data).toEqual({ error: 'test' });
      expect(log.stackTrace).toBe(stackTrace);
    });

    it('should not add log to non-existent session', () => {
      debugManager.addLog('non-existent', 'info', 'Test message');
      expect(session.logs).toHaveLength(0);
    });
  });

  describe('Call Stack Management', () => {
    let session: DebugSession;

    beforeEach(() => {
      session = debugManager.createDebugSession('workflow-1', 'execution-1');
    });

    it('should update call stack', () => {
      const node = {
        id: 'node-1',
        type: 'dataProcessor',
        position: { x: 0, y: 0 },
        data: { label: 'Test Node' }
      };
      const variables = new Map([['x', 10], ['y', 20]]);
      
      debugManager.updateCallStack(session.id, node, variables, 0);
      
      expect(session.callStack).toHaveLength(1);
      const frame = session.callStack[0];
      expect(frame.nodeId).toBe('node-1');
      expect(frame.nodeName).toBe('Test Node');
      expect(frame.nodeType).toBe('dataProcessor');
      expect(frame.variables).toEqual(variables);
      expect(frame.depth).toBe(0);
    });

    it('should replace frames at same or deeper depth', () => {
      const node1 = {
        id: 'node-1',
        type: 'dataProcessor',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' }
      };
      const node2 = {
        id: 'node-2',
        type: 'dataProcessor',
        position: { x: 0, y: 0 },
        data: { label: 'Node 2' }
      };
      
      debugManager.updateCallStack(session.id, node1, new Map(), 0);
      debugManager.updateCallStack(session.id, node2, new Map(), 1);
      debugManager.updateCallStack(session.id, node1, new Map(), 0); // Replace at depth 0
      
      expect(session.callStack).toHaveLength(1);
      expect(session.callStack[0].nodeId).toBe('node-1');
    });
  });

  describe('Step Recording', () => {
    let session: DebugSession;

    beforeEach(() => {
      session = debugManager.createDebugSession('workflow-1', 'execution-1');
      // Create a trace for the session
      debugManager.startDebugging(session.id, createMockWorkflow());
    });

    it('should record execution step', () => {
      const step: StepResult = {
        success: true,
        nodeId: 'node-1',
        nodeName: 'Test Node',
        nodeType: 'dataProcessor',
        variables: new Map([['x', 10]]),
        output: { result: 'success' },
        duration: 100,
        timestamp: new Date()
      };
      
      debugManager.recordStep(session.id, step);
      
      const traces = debugManager.getAllTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0].steps).toHaveLength(1);
      expect(traces[0].steps[0]).toEqual(step);
    });
  });

  describe('Breakpoint Evaluation', () => {
    let session: DebugSession;

    beforeEach(() => {
      session = debugManager.createDebugSession('workflow-1', 'execution-1');
    });

    it('should break on unconditional breakpoint', () => {
      debugManager.addBreakpoint(session.id, 'node-1');
      const variables = new Map([['x', 10]]);
      
      const shouldBreak = debugManager.shouldBreak(session.id, 'node-1', variables);
      expect(shouldBreak).toBe(true);
    });

    it('should not break on different node', () => {
      debugManager.addBreakpoint(session.id, 'node-1');
      const variables = new Map([['x', 10]]);
      
      const shouldBreak = debugManager.shouldBreak(session.id, 'node-2', variables);
      expect(shouldBreak).toBe(false);
    });

    it('should break on conditional breakpoint when condition is true', () => {
      debugManager.addBreakpoint(session.id, 'node-1', 'x > 5');
      const variables = new Map([['x', 10]]);
      
      const shouldBreak = debugManager.shouldBreak(session.id, 'node-1', variables);
      expect(shouldBreak).toBe(true);
    });

    it('should not break on conditional breakpoint when condition is false', () => {
      debugManager.addBreakpoint(session.id, 'node-1', 'x > 5');
      const variables = new Map([['x', 3]]);
      
      const shouldBreak = debugManager.shouldBreak(session.id, 'node-1', variables);
      expect(shouldBreak).toBe(false);
    });

    it('should not break on disabled breakpoint', () => {
      const breakpoint = debugManager.addBreakpoint(session.id, 'node-1');
      debugManager.toggleBreakpoint(session.id, breakpoint!.id);
      const variables = new Map([['x', 10]]);
      
      const shouldBreak = debugManager.shouldBreak(session.id, 'node-1', variables);
      expect(shouldBreak).toBe(false);
    });

    it('should not break for non-existent session', () => {
      const shouldBreak = debugManager.shouldBreak('non-existent', 'node-1', new Map());
      expect(shouldBreak).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old sessions and traces', () => {
      const session1 = debugManager.createDebugSession('workflow-1', 'execution-1');
      const session2 = debugManager.createDebugSession('workflow-2', 'execution-2');
      
      // Manually set old timestamps
      session1.lastActivity = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      session2.lastActivity = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      
      debugManager.cleanup(24 * 60 * 60 * 1000); // 24 hours
      
      const remainingSessions = debugManager.getAllSessions();
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].id).toBe(session2.id);
    });
  });

  describe('Event Emission', () => {
    let eventSpy: jest.SpyInstance;

    beforeEach(() => {
      eventSpy = jest.fn();
      debugManager.on('session-created', eventSpy);
    });

    it('should emit session-created event', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      expect(eventSpy).toHaveBeenCalledWith(session.id, session);
    });

    it('should emit breakpoint-added event', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      const breakpointSpy = jest.fn();
      debugManager.on('breakpoint-added', breakpointSpy);
      
      debugManager.addBreakpoint(session.id, 'node-1');
      
      expect(breakpointSpy).toHaveBeenCalledWith(session.id, expect.any(Object));
    });

    it('should emit watch-added event', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      const watchSpy = jest.fn();
      debugManager.on('watch-added', watchSpy);
      
      debugManager.addWatch(session.id, 'variable1');
      
      expect(watchSpy).toHaveBeenCalledWith(session.id, expect.any(Object));
    });

    it('should emit log-added event', () => {
      const session = debugManager.createDebugSession('workflow-1', 'execution-1');
      const logSpy = jest.fn();
      debugManager.on('log-added', logSpy);
      
      debugManager.addLog(session.id, 'info', 'Test message');
      
      expect(logSpy).toHaveBeenCalledWith(session.id, expect.any(Object));
    });
  });
});

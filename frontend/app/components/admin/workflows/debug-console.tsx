'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  ArrowRight, 
  ArrowLeft, 
  Bug, 
  Eye, 
  AlertTriangle, 
  Info, 
  X,
  Filter,
  Search,
  Download,
  Trash2
} from 'lucide-react';
import { DebugLog, DebugSession, Breakpoint, VariableWatch } from '@/lib/workflows/debug-manager';

interface DebugConsoleProps {
  sessionId: string;
  session: DebugSession | null;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onContinue: () => void;
  onPause: () => void;
  onStop: () => void;
  onAddBreakpoint: (nodeId: string, condition?: string) => void;
  onRemoveBreakpoint: (breakpointId: string) => void;
  onToggleBreakpoint: (breakpointId: string) => void;
  onAddWatch: (name: string, expression?: string) => void;
  onRemoveWatch: (watchId: string) => void;
  onClearLogs: () => void;
  onExportLogs: () => void;
}

export function DebugConsole({
  sessionId,
  session,
  onStepOver,
  onStepInto,
  onStepOut,
  onContinue,
  onPause,
  onStop,
  onAddBreakpoint,
  onRemoveBreakpoint,
  onToggleBreakpoint,
  onAddWatch,
  onRemoveWatch,
  onClearLogs,
  onExportLogs
}: DebugConsoleProps) {
  const [activeTab, setActiveTab] = useState('console');
  const [logFilter, setLogFilter] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newWatchName, setNewWatchName] = useState('');
  const [newWatchExpression, setNewWatchExpression] = useState('');
  const [newBreakpointNodeId, setNewBreakpointNodeId] = useState('');
  const [newBreakpointCondition, setNewBreakpointCondition] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [session?.logs]);

  const filteredLogs = session?.logs.filter(log => {
    const matchesFilter = logFilter === 'all' || log.level === logFilter;
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.nodeName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleAddWatch = () => {
    if (newWatchName.trim()) {
      onAddWatch(newWatchName.trim(), newWatchExpression.trim() || undefined);
      setNewWatchName('');
      setNewWatchExpression('');
    }
  };

  const handleAddBreakpoint = () => {
    if (newBreakpointNodeId.trim()) {
      onAddBreakpoint(
        newBreakpointNodeId.trim(), 
        newBreakpointCondition.trim() || undefined
      );
      setNewBreakpointNodeId('');
      setNewBreakpointCondition('');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Debug Console</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Session: {sessionId.slice(-8)}
              </Badge>
              {session?.isActive && (
                <Badge variant="default" className="text-xs bg-green-500">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="console">Console</TabsTrigger>
              <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
              <TabsTrigger value="watches">Watches</TabsTrigger>
              <TabsTrigger value="callstack">Call Stack</TabsTrigger>
            </TabsList>

            {/* Console Tab */}
            <TabsContent value="console" className="flex-1 flex flex-col mt-0">
              <div className="p-4 border-b">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={onStepOver}
                      disabled={!session?.isActive}
                      variant="outline"
                    >
                      <SkipForward className="h-4 w-4 mr-1" />
                      Step Over
                    </Button>
                    <Button
                      size="sm"
                      onClick={onStepInto}
                      disabled={!session?.isActive}
                      variant="outline"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Step Into
                    </Button>
                    <Button
                      size="sm"
                      onClick={onStepOut}
                      disabled={!session?.isActive}
                      variant="outline"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Step Out
                    </Button>
                    <Button
                      size="sm"
                      onClick={onContinue}
                      disabled={!session?.isActive}
                      variant="default"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      onClick={onPause}
                      disabled={!session?.isActive}
                      variant="outline"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      onClick={onStop}
                      variant="destructive"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value as any)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClearLogs}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onExportLogs}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>

              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No logs available
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border text-sm ${getLogColor(log.level)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getLogIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-gray-500">
                                {formatTimestamp(log.timestamp)}
                              </span>
                              {log.nodeName && (
                                <Badge variant="outline" className="text-xs">
                                  {log.nodeName}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {log.level.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="font-mono text-sm break-words">
                              {log.message}
                            </div>
                            {log.data && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                                <pre>{JSON.stringify(log.data, null, 2)}</pre>
                              </div>
                            )}
                            {log.stackTrace && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-xs font-mono text-red-700">
                                <pre>{log.stackTrace}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Breakpoints Tab */}
            <TabsContent value="breakpoints" className="flex-1 flex flex-col mt-0">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Node ID"
                    value={newBreakpointNodeId}
                    onChange={(e) => setNewBreakpointNodeId(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Condition (optional)"
                    value={newBreakpointCondition}
                    onChange={(e) => setNewBreakpointCondition(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddBreakpoint} size="sm">
                    Add Breakpoint
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {session?.breakpoints.size === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No breakpoints set
                    </div>
                  ) : (
                    Array.from(session?.breakpoints.values() || []).map((breakpoint) => (
                      <div
                        key={breakpoint.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{breakpoint.nodeId}</Badge>
                            {breakpoint.condition && (
                              <Badge variant="secondary">Condition: {breakpoint.condition}</Badge>
                            )}
                            <Badge variant="outline">Hits: {breakpoint.hitCount}</Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Created: {formatTimestamp(breakpoint.createdAt)}
                            {breakpoint.lastHit && (
                              <span className="ml-2">
                                Last hit: {formatTimestamp(breakpoint.lastHit)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onToggleBreakpoint(breakpoint.id)}
                          >
                            {breakpoint.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onRemoveBreakpoint(breakpoint.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Watches Tab */}
            <TabsContent value="watches" className="flex-1 flex flex-col mt-0">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Variable name"
                    value={newWatchName}
                    onChange={(e) => setNewWatchName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Expression (optional)"
                    value={newWatchExpression}
                    onChange={(e) => setNewWatchExpression(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddWatch} size="sm">
                    Add Watch
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {session?.watches.size === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No watches set
                    </div>
                  ) : (
                    Array.from(session?.watches.values() || []).map((watch) => (
                      <div
                        key={watch.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{watch.name}</Badge>
                            {watch.expression && (
                              <Badge variant="secondary">Expression: {watch.expression}</Badge>
                            )}
                            {watch.type && (
                              <Badge variant="outline">{watch.type}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Value: <span className="font-mono">{formatValue(watch.value)}</span>
                          </div>
                          {watch.lastUpdated && (
                            <div className="text-xs text-gray-400 mt-1">
                              Updated: {formatTimestamp(watch.lastUpdated)}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRemoveWatch(watch.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Call Stack Tab */}
            <TabsContent value="callstack" className="flex-1 flex flex-col mt-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {session?.callStack.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      Call stack is empty
                    </div>
                  ) : (
                    session?.callStack.map((frame, index) => (
                      <div
                        key={`${frame.nodeId}-${frame.timestamp.getTime()}`}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">#{session.callStack.length - index}</Badge>
                          <Badge variant="secondary">{frame.nodeType}</Badge>
                          <span className="font-semibold">{frame.nodeName}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Node ID: {frame.nodeId}
                        </div>
                        <div className="text-sm text-gray-500">
                          Timestamp: {formatTimestamp(frame.timestamp)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Depth: {frame.depth}
                        </div>
                        {frame.variables.size > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-semibold mb-1">Variables:</div>
                            <div className="space-y-1">
                              {Array.from(frame.variables.entries()).map(([key, value]) => (
                                <div key={key} className="text-sm font-mono">
                                  <span className="text-blue-600">{key}</span>: {formatValue(value)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

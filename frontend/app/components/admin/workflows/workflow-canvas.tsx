'use client';

import React from 'react';
import { NodeTypes } from 'reactflow';
import { WorkflowNode } from '@/types/workflows/visual-builder';

// Import all node components
import {
  ScheduleTriggerNode,
  WebhookTriggerNode,
  EventTriggerNode,
  ManualTriggerNode
} from './nodes/trigger-nodes';

import {
  ResearchAgentNode,
  ContentAgentNode,
  SEOAgentNode,
  ImageAgentNode,
  PublishingAgentNode,
  QAAgentNode
} from './nodes/agent-nodes';

import {
  ConditionNode,
  LoopNode,
  ParallelNode,
  MergeNode,
  SwitchNode
} from './nodes/logic-nodes';

import {
  DatabaseActionNode,
  APICallNode,
  NotificationNode,
  FileActionNode,
  EmailNode,
  SlackNode
} from './nodes/action-nodes';

import {
  MapTransformNode,
  FilterTransformNode,
  ReduceTransformNode,
  FormatTransformNode,
  SplitTransformNode,
  JoinTransformNode
} from './nodes/transform-nodes';

// Node Types Configuration
export const nodeTypes: NodeTypes = {
  // Trigger nodes
  'schedule-trigger': ScheduleTriggerNode,
  'webhook-trigger': WebhookTriggerNode,
  'event-trigger': EventTriggerNode,
  'manual-trigger': ManualTriggerNode,
  
  // Agent nodes
  'research-agent': ResearchAgentNode,
  'content-agent': ContentAgentNode,
  'seo-agent': SEOAgentNode,
  'image-agent': ImageAgentNode,
  'publishing-agent': PublishingAgentNode,
  'qa-agent': QAAgentNode,
  
  // Logic nodes
  'condition': ConditionNode,
  'loop': LoopNode,
  'parallel': ParallelNode,
  'merge': MergeNode,
  'switch': SwitchNode,
  
  // Action nodes
  'database-action': DatabaseActionNode,
  'api-call': APICallNode,
  'notification': NotificationNode,
  'file-action': FileActionNode,
  'email': EmailNode,
  'slack': SlackNode,
  
  // Transform nodes
  'map-transform': MapTransformNode,
  'filter-transform': FilterTransformNode,
  'reduce-transform': ReduceTransformNode,
  'format-transform': FormatTransformNode,
  'split-transform': SplitTransformNode,
  'join-transform': JoinTransformNode,
};

// Workflow Canvas Component
export const WorkflowCanvas: React.FC = () => {
  return (
    <div className="w-full h-full">
      {/* This component is used within the ReactFlow context */}
    </div>
  );
};
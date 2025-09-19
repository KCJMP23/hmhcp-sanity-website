export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  affectedSystems: string[];
  affectedUsers: string[];
  detectedAt: Date;
  reportedBy: string;
  assignedTo?: string;
  containedAt?: Date;
  resolvedAt?: Date;
  timeline: TimelineEntry[];
  evidence: Evidence[];
  actions: ActionItem[];
  metadata: Record<string, any>;
}

export type IncidentType = 
  | 'data_breach'
  | 'malware'
  | 'ransomware'
  | 'account_compromise'
  | 'ddos'
  | 'insider_threat'
  | 'physical_security'
  | 'supply_chain'
  | 'other';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus = 
  | 'detected'
  | 'triaged'
  | 'contained'
  | 'eradicated'
  | 'recovered'
  | 'closed';

export interface TimelineEntry {
  timestamp: Date;
  action: string;
  performedBy: string;
  details?: string;
}

export interface Evidence {
  id: string;
  type: 'log' | 'screenshot' | 'memory_dump' | 'network_capture' | 'file' | 'other';
  description: string;
  location: string;
  collectedAt: Date;
  collectedBy: string;
  hash?: string;
}

export interface ActionItem {
  id: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface Playbook {
  id: string;
  name: string;
  type: IncidentType;
  severity: IncidentSeverity;
  steps: PlaybookStep[];
  requiredRoles: string[];
}

export interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  automated: boolean;
  action: () => Promise<any>;
  rollback?: () => Promise<any>;
  verification?: () => Promise<boolean>;
  timeout?: number;
}

export interface IncidentReport {
  incident: {
    id: string;
    title: string;
    type: IncidentType;
    severity: IncidentSeverity;
    status: IncidentStatus;
    detectedAt: Date;
    resolvedAt?: Date;
  };
  impact: {
    affectedSystems: string[];
    affectedUsers: string[];
    dataCompromised: boolean;
    serviceDowntime: number;
    estimatedCost: number;
  };
  response: {
    initialResponseTime: number;
    containmentTime?: number;
    eradicationTime?: number;
    recoveryTime?: number;
  };
  evidence: {
    type: string;
    description: string;
    collectedAt: Date;
  }[];
  timeline: TimelineEntry[];
  recommendations: string[];
}

import { z } from 'zod';

export const incidentSchema = {
  type: z.enum([
    'data_breach',
    'malware',
    'ransomware',
    'account_compromise',
    'ddos',
    'insider_threat',
    'physical_security',
    'supply_chain',
    'other'
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  affectedSystems: z.array(z.string()),
  affectedUsers: z.array(z.string()),
  reportedBy: z.string()
};
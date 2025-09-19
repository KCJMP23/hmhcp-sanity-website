import { createServerClient } from '@/lib/auth/supabase-server';
import { securityMonitor } from '../security-monitor';
import { z } from 'zod';

import { 
  Incident, 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus,
  TimelineEntry,
  Evidence,
  ActionItem,
  IncidentReport,
  incidentSchema
} from './types';
import { PlaybookManager } from './playbook-manager';
import { NotificationManager } from './notification-manager';
import { RecommendationEngine } from './recommendations';

export * from './types';

export class IncidentResponseManager {
  private static instance: IncidentResponseManager;
  private activeIncidents: Map<string, Incident> = new Map();
  private playbooks: PlaybookManager;
  private notifications: NotificationManager;

  private constructor() {
    this.playbooks = new PlaybookManager();
    this.notifications = new NotificationManager();
  }

  static getInstance(): IncidentResponseManager {
    if (!this.instance) {
      this.instance = new IncidentResponseManager();
    }
    return this.instance;
  }

  /**
   * Create a new incident
   */
  async createIncident(data: {
    type: IncidentType;
    severity: IncidentSeverity;
    title: string;
    description: string;
    affectedSystems: string[];
    affectedUsers: string[];
    reportedBy: string;
  }): Promise<Incident> {
    // Validate input
    const validated = z.object(incidentSchema).parse(data);

    const incident: Incident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...validated,
      status: 'detected',
      detectedAt: new Date(),
      timeline: [{
        timestamp: new Date(),
        action: 'Incident created',
        performedBy: validated.reportedBy,
        details: validated.description
      }],
      evidence: [],
      actions: [],
      metadata: {}
    };

    // Store in memory
    this.activeIncidents.set(incident.id, incident);

    // Persist to database
    const supabase = await createServerClient();
    await supabase.from('security_incidents').insert({
      incident_id: incident.id,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      title: incident.title,
      description: incident.description,
      affected_systems: incident.affectedSystems,
      affected_users: incident.affectedUsers,
      detected_at: incident.detectedAt.toISOString(),
      reported_by: incident.reportedBy,
      timeline: incident.timeline,
      evidence: incident.evidence,
      actions: incident.actions,
      metadata: incident.metadata
    });

    // Trigger security monitor
    await securityMonitor.logSecurityEvent({
      type: 'suspicious_activity',
      severity: incident.severity,
      userId: validated.reportedBy,
      ip: 'system',
      details: {
        action: 'incident_created',
        incidentId: incident.id,
        incidentType: incident.type,
        incidentSeverity: incident.severity
      },
      timestamp: new Date()
    });

    // Send notifications
    await this.notifications.notifyIncident(incident);

    // Auto-execute playbooks for critical incidents
    if (incident.severity === 'critical') {
      const applicablePlaybooks = this.playbooks.getPlaybooksForIncident(
        incident.type,
        incident.severity
      );
      
      for (const playbook of applicablePlaybooks) {
        this.executePlaybook(incident.id, playbook.id).catch(console.error);
      }
    }

    return incident;
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    updatedBy: string,
    details?: string
  ): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const oldStatus = incident.status;
    incident.status = status;

    // Update timestamps
    if (status === 'contained' && !incident.containedAt) {
      incident.containedAt = new Date();
    } else if (status === 'recovered' && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
    }

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: `Status changed from ${oldStatus} to ${status}`,
      performedBy: updatedBy,
      details
    });

    // Update in memory
    this.activeIncidents.set(incidentId, incident);

    // Update in database
    const supabase = await createServerClient();
    await supabase
      .from('security_incidents')
      .update({
        status,
        contained_at: incident.containedAt?.toISOString(),
        resolved_at: incident.resolvedAt?.toISOString(),
        timeline: incident.timeline
      })
      .eq('incident_id', incidentId);

    // Send status update notification
    await this.notifications.notifyIncident(incident);
  }

  /**
   * Add evidence to incident
   */
  async addEvidence(
    incidentId: string,
    evidence: Omit<Evidence, 'id'>,
    collectedBy: string
  ): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const newEvidence: Evidence = {
      ...evidence,
      id: `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      collectedAt: new Date(),
      collectedBy
    };

    incident.evidence.push(newEvidence);
    incident.timeline.push({
      timestamp: new Date(),
      action: 'Evidence added',
      performedBy: collectedBy,
      details: `Added ${evidence.type}: ${evidence.description}`
    });

    // Update in memory and database
    this.activeIncidents.set(incidentId, incident);
    
    const supabase = await createServerClient();
    await supabase
      .from('security_incidents')
      .update({
        evidence: incident.evidence,
        timeline: incident.timeline
      })
      .eq('incident_id', incidentId);
  }

  /**
   * Execute a playbook for an incident
   */
  async executePlaybook(incidentId: string, playbookId: string): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const playbook = this.playbooks.getPlaybook(playbookId);
    if (!playbook) {
      throw new Error('Playbook not found');
    }

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: `Started playbook: ${playbook.name}`,
      performedBy: 'system',
      details: `Executing ${playbook.steps.length} steps`
    });

    // Execute each step
    for (const step of playbook.steps) {
      try {
        const result = await this.playbooks.executeStep(step);
        
        incident.timeline.push({
          timestamp: new Date(),
          action: `Completed step: ${step.name}`,
          performedBy: 'system',
          details: JSON.stringify(result)
        });

        // Add action item if step requires manual action
        if (!step.automated) {
          const action: ActionItem = {
            id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            action: step.description,
            status: 'pending',
            assignedTo: playbook.requiredRoles[0] || 'security-team',
            priority: incident.severity as any
          };
          incident.actions.push(action);
        }
      } catch (error) {
        incident.timeline.push({
          timestamp: new Date(),
          action: `Failed step: ${step.name}`,
          performedBy: 'system',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update incident
    this.activeIncidents.set(incidentId, incident);
    
    const supabase = await createServerClient();
    await supabase
      .from('security_incidents')
      .update({
        timeline: incident.timeline,
        actions: incident.actions
      })
      .eq('incident_id', incidentId);
  }

  /**
   * Generate incident report
   */
  async generateReport(incidentId: string): Promise<IncidentReport> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    // Calculate metrics
    const initialResponseTime = incident.timeline[1]?.timestamp.getTime() - 
                               incident.detectedAt.getTime() || 0;
    
    const containmentTime = incident.containedAt ? 
      incident.containedAt.getTime() - incident.detectedAt.getTime() : undefined;
    
    const recoveryTime = incident.resolvedAt ?
      incident.resolvedAt.getTime() - incident.detectedAt.getTime() : undefined;

    const report: IncidentReport = {
      incident: {
        id: incident.id,
        title: incident.title,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        detectedAt: incident.detectedAt,
        resolvedAt: incident.resolvedAt
      },
      impact: {
        affectedSystems: incident.affectedSystems,
        affectedUsers: incident.affectedUsers,
        dataCompromised: incident.metadata.dataCompromised || false,
        serviceDowntime: incident.metadata.downtime || 0,
        estimatedCost: incident.metadata.estimatedCost || 0
      },
      response: {
        initialResponseTime,
        containmentTime,
        eradicationTime: undefined,
        recoveryTime
      },
      evidence: incident.evidence.map(e => ({
        type: e.type,
        description: e.description,
        collectedAt: e.collectedAt
      })),
      timeline: incident.timeline,
      recommendations: RecommendationEngine.generateRecommendations(incident)
    };

    return report;
  }

  /**
   * Get incident by ID
   */
  private async getIncident(incidentId: string): Promise<Incident | null> {
    // Check active incidents first
    if (this.activeIncidents.has(incidentId)) {
      return this.activeIncidents.get(incidentId)!;
    }

    // Fetch from database
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('incident_id', incidentId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.incident_id,
      type: data.type,
      severity: data.severity,
      status: data.status,
      title: data.title,
      description: data.description,
      affectedSystems: data.affected_systems,
      affectedUsers: data.affected_users,
      detectedAt: new Date(data.detected_at),
      reportedBy: data.reported_by,
      assignedTo: data.assigned_to,
      containedAt: data.contained_at ? new Date(data.contained_at) : undefined,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      timeline: data.timeline,
      evidence: data.evidence,
      actions: data.actions,
      metadata: data.metadata
    };
  }

  /**
   * Get active incidents
   */
  async getActiveIncidents(): Promise<Incident[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .in('status', ['detected', 'triaged', 'contained', 'eradicated'])
      .order('detected_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(item => ({
      id: item.incident_id,
      type: item.type,
      severity: item.severity,
      status: item.status,
      title: item.title,
      description: item.description,
      affectedSystems: item.affected_systems,
      affectedUsers: item.affected_users,
      detectedAt: new Date(item.detected_at),
      reportedBy: item.reported_by,
      assignedTo: item.assigned_to,
      containedAt: item.contained_at ? new Date(item.contained_at) : undefined,
      resolvedAt: item.resolved_at ? new Date(item.resolved_at) : undefined,
      timeline: item.timeline,
      evidence: item.evidence,
      actions: item.actions,
      metadata: item.metadata
    }));
  }
}

// Export singleton instance
export const incidentResponse = IncidentResponseManager.getInstance();
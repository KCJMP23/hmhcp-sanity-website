import { Playbook, PlaybookStep, IncidentType, IncidentSeverity } from './types';
import { createServerClient } from '@/lib/supabase-server';

export class PlaybookManager {
  private playbooks: Map<string, Playbook> = new Map();

  constructor() {
    this.initializeDefaultPlaybooks();
  }

  /**
   * Initialize default playbooks
   */
  private initializeDefaultPlaybooks(): void {
    // Data Breach Playbook
    this.addPlaybook({
      id: 'playbook-data-breach',
      name: 'Data Breach Response',
      type: 'data_breach',
      severity: 'critical',
      requiredRoles: ['security-lead', 'incident-commander', 'legal', 'communications'],
      steps: [
        {
          id: 'step-1',
          name: 'Initial Assessment',
          description: 'Assess the scope and severity of the breach',
          automated: false,
          action: async () => {
            return { status: 'assessed', scope: 'determining' };
          }
        },
        {
          id: 'step-2',
          name: 'Containment',
          description: 'Isolate affected systems to prevent further data loss',
          automated: true,
          action: async () => {
            const supabase = await createServerClient();
            await supabase.from('security_logs').insert({
              event_type: 'containment_initiated',
              severity: 'critical',
              timestamp: new Date().toISOString()
            });
            return { status: 'contained' };
          },
          verification: async () => {
            return true;
          }
        },
        {
          id: 'step-3',
          name: 'Evidence Collection',
          description: 'Collect and preserve evidence for investigation',
          automated: false,
          action: async () => {
            return { status: 'evidence_collected' };
          }
        },
        {
          id: 'step-4',
          name: 'Notification',
          description: 'Notify affected parties according to regulations',
          automated: false,
          action: async () => {
            return { status: 'notified' };
          },
          timeout: 72 * 60 * 60 * 1000 // 72 hours
        }
      ]
    });

    // DDoS Playbook
    this.addPlaybook({
      id: 'playbook-ddos',
      name: 'DDoS Mitigation',
      type: 'ddos',
      severity: 'high',
      requiredRoles: ['network-admin', 'security-lead'],
      steps: [
        {
          id: 'step-1',
          name: 'Traffic Analysis',
          description: 'Analyze traffic patterns to identify attack vectors',
          automated: true,
          action: async () => {
            return { status: 'analyzed', vectors: [] };
          }
        },
        {
          id: 'step-2',
          name: 'Enable DDoS Protection',
          description: 'Activate DDoS protection measures',
          automated: true,
          action: async () => {
            return { status: 'protection_enabled' };
          }
        },
        {
          id: 'step-3',
          name: 'Scale Resources',
          description: 'Auto-scale resources to handle legitimate traffic',
          automated: true,
          action: async () => {
            return { status: 'scaled' };
          },
          rollback: async () => {
            return { status: 'scaled_down' };
          }
        }
      ]
    });

    // Account Compromise Playbook
    this.addPlaybook({
      id: 'playbook-account-compromise',
      name: 'Account Compromise Response',
      type: 'account_compromise',
      severity: 'high',
      requiredRoles: ['security-lead', 'identity-admin'],
      steps: [
        {
          id: 'step-1',
          name: 'Account Lockdown',
          description: 'Disable compromised accounts immediately',
          automated: true,
          action: async () => {
            return { status: 'locked' };
          }
        },
        {
          id: 'step-2',
          name: 'Session Termination',
          description: 'Terminate all active sessions for compromised accounts',
          automated: true,
          action: async () => {
            return { status: 'sessions_terminated' };
          }
        },
        {
          id: 'step-3',
          name: 'Credential Reset',
          description: 'Force password reset and MFA re-enrollment',
          automated: false,
          action: async () => {
            return { status: 'credentials_reset' };
          }
        }
      ]
    });
  }

  /**
   * Add a playbook
   */
  addPlaybook(playbook: Playbook): void {
    this.playbooks.set(playbook.id, playbook);
  }

  /**
   * Get playbook by ID
   */
  getPlaybook(id: string): Playbook | undefined {
    return this.playbooks.get(id);
  }

  /**
   * Get playbooks by incident type and severity
   */
  getPlaybooksForIncident(type: IncidentType, severity: IncidentSeverity): Playbook[] {
    return Array.from(this.playbooks.values()).filter(
      playbook => playbook.type === type && playbook.severity === severity
    );
  }

  /**
   * Execute a playbook step
   */
  async executeStep(step: PlaybookStep): Promise<any> {
    try {
      const result = await Promise.race([
        step.action(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Step timeout')), step.timeout || 300000)
        )
      ]);

      if (step.verification) {
        const verified = await step.verification();
        if (!verified) {
          throw new Error('Step verification failed');
        }
      }

      return result;
    } catch (error) {
      if (step.rollback) {
        await step.rollback();
      }
      throw error;
    }
  }

  /**
   * Get all playbooks
   */
  getAllPlaybooks(): Playbook[] {
    return Array.from(this.playbooks.values());
  }
}
import { Incident, IncidentSeverity } from './types';
import { createServerClient } from '@/lib/supabase-server';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'teams' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  conditions: {
    severities: IncidentSeverity[];
    types?: string[];
    affectedSystemPatterns?: string[];
  };
  channels: string[];
  template: string;
}

export class NotificationManager {
  private channels: Map<string, NotificationChannel> = new Map();
  private rules: Map<string, NotificationRule> = new Map();

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    // Email channel
    this.addChannel({
      id: 'email-security',
      name: 'Security Team Email',
      type: 'email',
      config: {
        recipients: ['security@company.com'],
        from: 'noreply@company.com'
      },
      enabled: true
    });

    // Slack channel
    this.addChannel({
      id: 'slack-incidents',
      name: 'Incident Slack Channel',
      type: 'slack',
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        channel: '#incidents'
      },
      enabled: !!process.env.SLACK_WEBHOOK_URL
    });
  }

  /**
   * Initialize default notification rules
   */
  private initializeDefaultRules(): void {
    // Critical incidents rule
    this.addRule({
      id: 'rule-critical',
      name: 'Critical Incident Notifications',
      conditions: {
        severities: ['critical']
      },
      channels: ['email-security', 'slack-incidents'],
      template: 'critical-incident'
    });

    // High severity rule
    this.addRule({
      id: 'rule-high',
      name: 'High Severity Notifications',
      conditions: {
        severities: ['high']
      },
      channels: ['email-security'],
      template: 'high-incident'
    });
  }

  /**
   * Add notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Add notification rule
   */
  addRule(rule: NotificationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Send notifications for an incident
   */
  async notifyIncident(incident: Incident): Promise<void> {
    const applicableRules = this.getApplicableRules(incident);
    
    for (const rule of applicableRules) {
      const channels = rule.channels
        .map(id => this.channels.get(id))
        .filter((channel): channel is NotificationChannel => channel !== undefined && channel.enabled);

      for (const channel of channels) {
        try {
          await this.sendNotification(channel, incident, rule.template);
        } catch (error) {
          // Failed to send notification via ${channel.name}: error
        }
      }
    }
  }

  /**
   * Get applicable rules for an incident
   */
  private getApplicableRules(incident: Incident): NotificationRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      // Check severity
      if (!rule.conditions.severities.includes(incident.severity)) {
        return false;
      }

      // Check type
      if (rule.conditions.types && !rule.conditions.types.includes(incident.type)) {
        return false;
      }

      // Check affected systems
      if (rule.conditions.affectedSystemPatterns) {
        const matches = rule.conditions.affectedSystemPatterns.some(pattern => 
          incident.affectedSystems.some(system => 
            new RegExp(pattern).test(system)
          )
        );
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Send notification via specific channel
   */
  private async sendNotification(
    channel: NotificationChannel, 
    incident: Incident, 
    templateId: string
  ): Promise<void> {
    const message = this.formatMessage(incident, templateId);

    switch (channel.type) {
      case 'email':
        await this.sendEmail(channel, incident, message);
        break;
      case 'slack':
        await this.sendSlack(channel, incident, message);
        break;
      case 'teams':
        await this.sendTeams(channel, incident, message);
        break;
      case 'webhook':
        await this.sendWebhook(channel, incident);
        break;
    }

    // Log notification
    const supabase = await createServerClient();
    await supabase.from('notification_logs').insert({
      incident_id: incident.id,
      channel_id: channel.id,
      channel_type: channel.type,
      sent_at: new Date().toISOString(),
      status: 'sent'
    });
  }

  /**
   * Format notification message
   */
  private formatMessage(incident: Incident, templateId: string): string {
    const templates: Record<string, string> = {
      'critical-incident': `🚨 CRITICAL INCIDENT: ${incident.title}
Type: ${incident.type}
Severity: ${incident.severity}
Status: ${incident.status}
Affected Systems: ${incident.affectedSystems.join(', ')}
Affected Users: ${incident.affectedUsers.length} users

Description: ${incident.description}

Immediate action required. Please respond ASAP.`,

      'high-incident': `⚠️ High Severity Incident: ${incident.title}
Type: ${incident.type}
Status: ${incident.status}
Affected Systems: ${incident.affectedSystems.join(', ')}

Description: ${incident.description}

Please review and take appropriate action.`
    };

    return templates[templateId] || templates['high-incident'];
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    channel: NotificationChannel, 
    incident: Incident, 
    message: string
  ): Promise<void> {
    // Implementation would use email service
    // Sending email to recipients
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(
    channel: NotificationChannel, 
    incident: Incident, 
    message: string
  ): Promise<void> {
    if (!channel.config.webhookUrl) return;

    const payload = {
      channel: channel.config.channel,
      text: message,
      attachments: [{
        color: incident.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Incident ID', value: incident.id, short: true },
          { title: 'Type', value: incident.type, short: true },
          { title: 'Severity', value: incident.severity, short: true },
          { title: 'Status', value: incident.status, short: true }
        ]
      }]
    };

    // Send to Slack webhook
    await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send Teams notification
   */
  private async sendTeams(
    channel: NotificationChannel, 
    incident: Incident, 
    message: string
  ): Promise<void> {
    // Implementation for Microsoft Teams
    // Sending Teams notification
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(
    channel: NotificationChannel, 
    incident: Incident
  ): Promise<void> {
    await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...channel.config.headers
      },
      body: JSON.stringify({
        incident,
        timestamp: new Date().toISOString()
      })
    });
  }
}
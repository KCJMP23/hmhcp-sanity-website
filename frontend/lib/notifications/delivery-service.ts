// Notification Delivery Service
// HIPAA-compliant multi-channel notification system

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import {
  NotificationChannel,
  NotificationConfig,
  NotificationRecord,
  AlertIncident,
  AlertSeverity,
  HealthcareUrgency,
  EscalationRule
} from '@/types/ai/alerts';

// Encryption utilities for HIPAA compliance
class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
    'salt',
    32
  );

  // Encrypt sensitive data
  static encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt sensitive data
  static decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Scrub PHI from content
  static scrubPHI(content: string): string {
    // Pattern matching for common PHI
    const patterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone
      /\b\d{5}(?:-\d{4})?\b/g, // ZIP code
      /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g, // Date
      /\b\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|circle|cir|boulevard|blvd)\b/gi, // Address
    ];

    let scrubbed = content;
    patterns.forEach(pattern => {
      scrubbed = scrubbed.replace(pattern, '[REDACTED]');
    });

    return scrubbed;
  }
}

// Email notification handler
class EmailNotificationHandler {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async send(
    config: NotificationConfig,
    incident: AlertIncident,
    urgency: HealthcareUrgency
  ): Promise<NotificationRecord> {
    const startTime = Date.now();
    const record: NotificationRecord = {
      channel: 'email',
      sent_at: new Date(),
      recipient: config.config.to_addresses?.join(', ') || '',
      status: 'pending',
      retry_count: 0
    };

    try {
      // Prepare email content
      const subject = this.formatSubject(incident, urgency, config.config.subject_template);
      const body = this.formatBody(incident, urgency, config.config.body_template);

      // Scrub PHI if required
      const finalBody = config.scrub_phi ? EncryptionService.scrubPHI(body) : body;

      // Encrypt email content if required
      let emailContent = finalBody;
      if (config.encrypt_in_transit) {
        const encrypted = EncryptionService.encrypt(finalBody);
        emailContent = `Encrypted Alert: ${encrypted.encrypted}|${encrypted.iv}|${encrypted.authTag}`;
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'alerts@hmhcp.com',
        to: config.config.to_addresses?.join(', '),
        cc: config.config.cc_addresses?.join(', '),
        subject: subject,
        html: this.generateHTMLTemplate(emailContent, incident, urgency),
        text: emailContent,
        priority: this.mapUrgencyToPriority(urgency),
        headers: {
          'X-Alert-ID': incident.id,
          'X-Alert-Severity': incident.severity,
          'X-Healthcare-Urgency': urgency
        }
      });

      record.status = 'sent';
      
      // Audit trail
      if (config.audit_trail) {
        await this.logEmailAudit(incident.id, info.messageId, config);
      }

    } catch (error) {
      record.status = 'failed';
      record.error_message = error instanceof Error ? error.message : 'Unknown error';
    }

    return record;
  }

  private formatSubject(
    incident: AlertIncident,
    urgency: HealthcareUrgency,
    template?: string
  ): string {
    const urgencyEmoji = {
      critical: '🚨',
      emergency: '⚠️',
      urgent: '📢',
      routine: 'ℹ️'
    };

    const defaultTemplate = `${urgencyEmoji[urgency]} [${urgency.toUpperCase()}] Healthcare Alert #${incident.incident_number}: ${incident.alert_configuration?.name}`;
    
    if (!template) return defaultTemplate;

    return template
      .replace('{{urgency}}', urgency)
      .replace('{{incident_number}}', incident.incident_number.toString())
      .replace('{{alert_name}}', incident.alert_configuration?.name || '')
      .replace('{{severity}}', incident.severity);
  }

  private formatBody(
    incident: AlertIncident,
    urgency: HealthcareUrgency,
    template?: string
  ): string {
    const details = `
Alert Details:
- Incident Number: #${incident.incident_number}
- Alert: ${incident.alert_configuration?.name}
- Severity: ${incident.severity}
- Urgency: ${urgency}
- Triggered At: ${incident.triggered_at}
- Current Value: ${incident.trigger_value}
- Threshold Breached: ${incident.threshold_breached}

${incident.patient_safety_score ? `Patient Safety Score: ${incident.patient_safety_score}` : ''}
${incident.affected_patient_segments?.length ? `Affected Segments: ${incident.affected_patient_segments.join(', ')}` : ''}
${incident.compliance_impact?.length ? `Compliance Impact: ${incident.compliance_impact.join(', ')}` : ''}

Actions Required:
1. Review the alert details in the dashboard
2. Assess patient impact and safety concerns
3. Take appropriate remediation actions
4. Document resolution in the system
    `;

    return template || details;
  }

  private generateHTMLTemplate(
    content: string,
    incident: AlertIncident,
    urgency: HealthcareUrgency
  ): string {
    const urgencyColor = {
      critical: '#dc2626',
      emergency: '#ea580c',
      urgent: '#ca8a04',
      routine: '#0891b2'
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${urgencyColor[urgency]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Healthcare Alert - ${urgency.toUpperCase()}</h2>
      <p>Incident #${incident.incident_number}</p>
    </div>
    <div class="content">
      <pre>${content}</pre>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/alerts/${incident.id}" class="button">
        View in Dashboard
      </a>
    </div>
    <div class="footer">
      <p>This is an automated alert from HMHCP Healthcare Analytics System.</p>
      <p>This email may contain sensitive healthcare information. Please handle with care.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private mapUrgencyToPriority(urgency: HealthcareUrgency): 'high' | 'normal' | 'low' {
    switch (urgency) {
      case 'critical':
      case 'emergency':
        return 'high';
      case 'urgent':
        return 'normal';
      default:
        return 'low';
    }
  }

  private async logEmailAudit(
    incidentId: string,
    messageId: string,
    config: NotificationConfig
  ): Promise<void> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('notification_audit_log').insert({
      incident_id: incidentId,
      channel: 'email',
      message_id: messageId,
      recipients: config.config.to_addresses,
      encrypted: config.encrypt_in_transit,
      phi_scrubbed: config.scrub_phi,
      sent_at: new Date()
    });
  }
}

// Slack notification handler
class SlackNotificationHandler {
  async send(
    config: NotificationConfig,
    incident: AlertIncident,
    urgency: HealthcareUrgency
  ): Promise<NotificationRecord> {
    const record: NotificationRecord = {
      channel: 'slack',
      sent_at: new Date(),
      recipient: config.config.channel_id || config.config.webhook_url || '',
      status: 'pending',
      retry_count: 0
    };

    try {
      const message = this.formatSlackMessage(incident, urgency);
      
      // Scrub PHI if required
      if (config.scrub_phi) {
        message.text = EncryptionService.scrubPHI(message.text);
        message.blocks.forEach(block => {
          if (block.text?.text) {
            block.text.text = EncryptionService.scrubPHI(block.text.text);
          }
        });
      }

      // Send to Slack
      const response = await fetch(config.config.webhook_url!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      record.status = 'sent';

      // Mention users if configured
      if (config.config.mention_users?.length) {
        await this.mentionUsers(config.config.webhook_url!, config.config.mention_users);
      }

    } catch (error) {
      record.status = 'failed';
      record.error_message = error instanceof Error ? error.message : 'Unknown error';
    }

    return record;
  }

  private formatSlackMessage(incident: AlertIncident, urgency: HealthcareUrgency): any {
    const urgencyEmoji = {
      critical: ':rotating_light:',
      emergency: ':warning:',
      urgent: ':loudspeaker:',
      routine: ':information_source:'
    };

    const severityColor = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#0891b2'
    };

    return {
      text: `${urgencyEmoji[urgency]} Healthcare Alert #${incident.incident_number}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${urgencyEmoji[urgency]} Healthcare Alert #${incident.incident_number}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Alert:*\n${incident.alert_configuration?.name}`
            },
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${incident.severity}`
            },
            {
              type: 'mrkdwn',
              text: `*Urgency:*\n${urgency}`
            },
            {
              type: 'mrkdwn',
              text: `*Triggered:*\n${new Date(incident.triggered_at).toLocaleString()}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Metrics:*\n• Current Value: ${incident.trigger_value}\n• Threshold: ${incident.threshold_breached}`
          }
        }
      ],
      attachments: [
        {
          color: severityColor[incident.severity],
          fields: incident.affected_patient_segments ? [
            {
              title: 'Affected Patient Segments',
              value: incident.affected_patient_segments.join(', '),
              short: false
            }
          ] : [],
          actions: [
            {
              type: 'button',
              text: 'View in Dashboard',
              url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/alerts/${incident.id}`
            },
            {
              type: 'button',
              text: 'Acknowledge',
              url: `${process.env.NEXT_PUBLIC_APP_URL}/api/alerts/acknowledge/${incident.id}`
            }
          ]
        }
      ]
    };
  }

  private async mentionUsers(webhookUrl: string, users: string[]): Promise<void> {
    const mentions = users.map(u => `<@${u}>`).join(' ');
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${mentions} Please review the above alert.`
      })
    });
  }
}

// Webhook notification handler
class WebhookNotificationHandler {
  async send(
    config: NotificationConfig,
    incident: AlertIncident,
    urgency: HealthcareUrgency
  ): Promise<NotificationRecord> {
    const record: NotificationRecord = {
      channel: 'webhook',
      sent_at: new Date(),
      recipient: config.config.endpoint_url || '',
      status: 'pending',
      retry_count: 0
    };

    try {
      // Prepare webhook payload
      let payload = {
        event: 'healthcare_alert',
        incident_id: incident.id,
        incident_number: incident.incident_number,
        alert_name: incident.alert_configuration?.name,
        severity: incident.severity,
        urgency: urgency,
        triggered_at: incident.triggered_at,
        metrics: {
          current_value: incident.trigger_value,
          threshold_breached: incident.threshold_breached
        },
        healthcare_context: {
          patient_segments: incident.affected_patient_segments,
          compliance_impact: incident.compliance_impact,
          patient_safety_score: incident.patient_safety_score
        },
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/alerts/${incident.id}`
      };

      // Scrub PHI if required
      if (config.scrub_phi) {
        payload = JSON.parse(EncryptionService.scrubPHI(JSON.stringify(payload)));
      }

      // Encrypt if required
      let body: any = payload;
      if (config.encrypt_in_transit) {
        const encrypted = EncryptionService.encrypt(JSON.stringify(payload));
        body = { encrypted: encrypted.encrypted, iv: encrypted.iv, authTag: encrypted.authTag };
      }

      // Send webhook
      const response = await fetch(config.config.endpoint_url!, {
        method: config.config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HMHCP-Alert': 'true',
          'X-Alert-Severity': incident.severity,
          'X-Healthcare-Urgency': urgency,
          ...config.config.headers
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
      }

      record.status = 'sent';

    } catch (error) {
      record.status = 'failed';
      record.error_message = error instanceof Error ? error.message : 'Unknown error';
    }

    return record;
  }
}

// SMS notification handler (simplified - would use Twilio in production)
class SMSNotificationHandler {
  async send(
    config: NotificationConfig,
    incident: AlertIncident,
    urgency: HealthcareUrgency
  ): Promise<NotificationRecord> {
    const record: NotificationRecord = {
      channel: 'sms',
      sent_at: new Date(),
      recipient: config.config.phone_numbers?.join(', ') || '',
      status: 'pending',
      retry_count: 0
    };

    try {
      // Format SMS message (limited to 160 characters)
      const message = this.formatSMSMessage(incident, urgency);
      
      // In production, integrate with Twilio or similar service
      // For now, we'll simulate sending
      console.log(`SMS to ${config.config.phone_numbers}: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      record.status = 'sent';

    } catch (error) {
      record.status = 'failed';
      record.error_message = error instanceof Error ? error.message : 'Unknown error';
    }

    return record;
  }

  private formatSMSMessage(incident: AlertIncident, urgency: HealthcareUrgency): string {
    const urgencyText = urgency === 'critical' ? 'CRITICAL' : urgency.toUpperCase();
    const message = `${urgencyText} Alert #${incident.incident_number}: ${incident.alert_configuration?.name}. Value: ${incident.trigger_value}. View: ${process.env.NEXT_PUBLIC_APP_URL}/a/${incident.id}`;
    
    // Truncate to 160 characters
    return message.substring(0, 160);
  }
}

// Main Notification Delivery Service
export class NotificationDeliveryService {
  private supabase;
  private handlers: Map<NotificationChannel, any>;
  private retryQueue: Map<string, RetryItem> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize notification handlers
    this.handlers = new Map([
      ['email', new EmailNotificationHandler()],
      ['slack', new SlackNotificationHandler()],
      ['webhook', new WebhookNotificationHandler()],
      ['sms', new SMSNotificationHandler()]
    ]);

    // Start retry processing
    this.startRetryProcessor();
  }

  // Send notifications for an alert incident
  async sendAlertNotifications(
    incident: AlertIncident,
    configs: NotificationConfig[],
    urgency?: HealthcareUrgency
  ): Promise<NotificationRecord[]> {
    const records: NotificationRecord[] = [];
    const calculatedUrgency = urgency || this.calculateUrgency(incident);

    // Process each notification channel
    for (const config of configs) {
      if (!config.enabled) continue;

      const handler = this.handlers.get(config.channel);
      if (!handler) {
        console.error(`No handler for channel: ${config.channel}`);
        continue;
      }

      try {
        // Check rate limiting
        if (await this.isRateLimited(incident.alert_id, config.channel)) {
          console.log(`Rate limited for ${config.channel}`);
          continue;
        }

        // Send notification
        const record = await handler.send(config, incident, calculatedUrgency);
        records.push(record);

        // Store notification record
        await this.storeNotificationRecord(incident.id, record);

        // Handle failed notifications
        if (record.status === 'failed') {
          await this.scheduleRetry(incident, config, record);
        }

      } catch (error) {
        console.error(`Error sending ${config.channel} notification:`, error);
        records.push({
          channel: config.channel,
          sent_at: new Date(),
          recipient: 'unknown',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: 0
        });
      }
    }

    // Update incident with notification status
    await this.updateIncidentNotificationStatus(incident.id, records);

    return records;
  }

  // Handle escalations
  async handleEscalation(
    incident: AlertIncident,
    escalationRule: EscalationRule
  ): Promise<void> {
    // Upgrade severity if specified
    if (escalationRule.severity_upgrade) {
      await this.upgradeSeverity(incident.id, escalationRule.severity_upgrade);
    }

    // Send additional notifications
    if (escalationRule.additional_channels) {
      const configs: NotificationConfig[] = escalationRule.additional_channels.map(channel => ({
        channel,
        enabled: true,
        config: this.getDefaultConfig(channel),
        encrypt_in_transit: true,
        scrub_phi: true,
        audit_trail: true
      }));

      await this.sendAlertNotifications(incident, configs);
    }

    // Notify specific users
    if (escalationRule.notify_users?.length) {
      await this.notifyUsers(incident, escalationRule.notify_users);
    }

    // Notify teams
    if (escalationRule.notify_teams?.length) {
      await this.notifyTeams(incident, escalationRule.notify_teams);
    }
  }

  // Calculate urgency based on incident details
  private calculateUrgency(incident: AlertIncident): HealthcareUrgency {
    // Patient safety takes precedence
    if (incident.patient_safety_score && incident.patient_safety_score > 80) {
      return 'critical';
    }

    // Compliance violations are emergency
    if (incident.compliance_impact?.length) {
      return 'emergency';
    }

    // Map severity to urgency
    const severityMap: Record<AlertSeverity, HealthcareUrgency> = {
      critical: 'critical',
      high: 'emergency',
      medium: 'urgent',
      low: 'routine'
    };

    return severityMap[incident.severity];
  }

  // Check rate limiting
  private async isRateLimited(alertId: string, channel: NotificationChannel): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('notification_rate_limits')
      .select('count, window_start')
      .eq('alert_id', alertId)
      .eq('channel', channel)
      .single();

    if (error || !data) return false;

    const windowDuration = 3600000; // 1 hour in milliseconds
    const now = Date.now();
    const windowStart = new Date(data.window_start).getTime();

    if (now - windowStart > windowDuration) {
      // Reset window
      await this.supabase
        .from('notification_rate_limits')
        .update({ count: 1, window_start: new Date() })
        .eq('alert_id', alertId)
        .eq('channel', channel);
      return false;
    }

    // Check if limit exceeded
    const maxPerHour = 10; // Default, should come from alert config
    if (data.count >= maxPerHour) {
      return true;
    }

    // Increment counter
    await this.supabase
      .from('notification_rate_limits')
      .update({ count: data.count + 1 })
      .eq('alert_id', alertId)
      .eq('channel', channel);

    return false;
  }

  // Store notification record
  private async storeNotificationRecord(
    incidentId: string,
    record: NotificationRecord
  ): Promise<void> {
    await this.supabase.from('notification_records').insert({
      incident_id: incidentId,
      channel: record.channel,
      recipient: record.recipient,
      status: record.status,
      error_message: record.error_message,
      retry_count: record.retry_count,
      sent_at: record.sent_at
    });
  }

  // Update incident notification status
  private async updateIncidentNotificationStatus(
    incidentId: string,
    records: NotificationRecord[]
  ): Promise<void> {
    const successCount = records.filter(r => r.status === 'sent').length;
    const failureCount = records.filter(r => r.status === 'failed').length;

    await this.supabase
      .from('alert_incidents')
      .update({
        notifications_sent: records,
        notification_success_count: successCount,
        notification_failure_count: failureCount,
        last_notification_at: new Date()
      })
      .eq('id', incidentId);
  }

  // Schedule retry for failed notifications
  private async scheduleRetry(
    incident: AlertIncident,
    config: NotificationConfig,
    record: NotificationRecord
  ): Promise<void> {
    const retryKey = `${incident.id}_${config.channel}`;
    
    // Exponential backoff
    const retryDelay = Math.min(60000 * Math.pow(2, record.retry_count), 3600000); // Max 1 hour
    
    this.retryQueue.set(retryKey, {
      incident,
      config,
      record,
      retryAt: new Date(Date.now() + retryDelay),
      attempts: record.retry_count + 1
    });
  }

  // Process retry queue
  private startRetryProcessor(): void {
    setInterval(async () => {
      const now = new Date();
      
      for (const [key, item] of this.retryQueue.entries()) {
        if (item.retryAt <= now && item.attempts < 3) {
          const handler = this.handlers.get(item.config.channel);
          if (handler) {
            try {
              const urgency = this.calculateUrgency(item.incident);
              const record = await handler.send(item.config, item.incident, urgency);
              
              if (record.status === 'sent') {
                this.retryQueue.delete(key);
              } else {
                item.attempts++;
                item.retryAt = new Date(Date.now() + 60000 * Math.pow(2, item.attempts));
              }
            } catch (error) {
              console.error(`Retry failed for ${key}:`, error);
              item.attempts++;
            }
          }
        }
        
        // Remove if max retries exceeded
        if (item.attempts >= 3) {
          this.retryQueue.delete(key);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Helper methods
  private async upgradeSeverity(incidentId: string, newSeverity: AlertSeverity): Promise<void> {
    await this.supabase
      .from('alert_incidents')
      .update({ severity: newSeverity })
      .eq('id', incidentId);
  }

  private async notifyUsers(incident: AlertIncident, userIds: string[]): Promise<void> {
    // Fetch user contact information and send notifications
    const { data: users } = await this.supabase
      .from('admin_users')
      .select('id, email, phone, notification_preferences')
      .in('id', userIds);

    if (users) {
      for (const user of users) {
        const configs: NotificationConfig[] = [];
        
        if (user.email && user.notification_preferences?.email) {
          configs.push({
            channel: 'email',
            enabled: true,
            config: { to_addresses: [user.email] },
            encrypt_in_transit: true,
            scrub_phi: true,
            audit_trail: true
          });
        }
        
        if (user.phone && user.notification_preferences?.sms) {
          configs.push({
            channel: 'sms',
            enabled: true,
            config: { phone_numbers: [user.phone] },
            encrypt_in_transit: true,
            scrub_phi: true,
            audit_trail: true
          });
        }
        
        await this.sendAlertNotifications(incident, configs);
      }
    }
  }

  private async notifyTeams(incident: AlertIncident, teamIds: string[]): Promise<void> {
    // Fetch team notification channels and send notifications
    const { data: teams } = await this.supabase
      .from('teams')
      .select('id, name, notification_channels')
      .in('id', teamIds);

    if (teams) {
      for (const team of teams) {
        if (team.notification_channels) {
          await this.sendAlertNotifications(incident, team.notification_channels);
        }
      }
    }
  }

  private getDefaultConfig(channel: NotificationChannel): any {
    const defaults: Record<NotificationChannel, any> = {
      email: {
        to_addresses: [process.env.DEFAULT_ALERT_EMAIL || 'alerts@hmhcp.com']
      },
      slack: {
        webhook_url: process.env.SLACK_WEBHOOK_URL
      },
      webhook: {
        endpoint_url: process.env.DEFAULT_WEBHOOK_URL,
        method: 'POST'
      },
      sms: {
        phone_numbers: [process.env.DEFAULT_ALERT_PHONE || '+1234567890']
      },
      teams: {
        teams_webhook_url: process.env.TEAMS_WEBHOOK_URL
      },
      pagerduty: {
        integration_key: process.env.PAGERDUTY_KEY
      }
    };

    return defaults[channel] || {};
  }
}

// Types for retry handling
interface RetryItem {
  incident: AlertIncident;
  config: NotificationConfig;
  record: NotificationRecord;
  retryAt: Date;
  attempts: number;
}

// Export singleton instance
export const notificationService = new NotificationDeliveryService();
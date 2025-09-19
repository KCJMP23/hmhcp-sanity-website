import { Incident, IncidentType, IncidentSeverity } from './types';

export class RecommendationEngine {
  /**
   * Generate recommendations based on incident
   */
  static generateRecommendations(incident: Incident): string[] {
    const recommendations: string[] = [];

    // Add type-specific recommendations
    recommendations.push(...this.getTypeSpecificRecommendations(incident.type));

    // Add severity-based recommendations
    recommendations.push(...this.getSeverityRecommendations(incident.severity));

    // Add status-based recommendations
    recommendations.push(...this.getStatusRecommendations(incident));

    // Add pattern-based recommendations
    recommendations.push(...this.getPatternRecommendations(incident));

    // Remove duplicates and return
    return [...new Set(recommendations)];
  }

  /**
   * Get type-specific recommendations
   */
  private static getTypeSpecificRecommendations(type: IncidentType): string[] {
    const recommendations: Record<IncidentType, string[]> = {
      data_breach: [
        'Review and strengthen access controls',
        'Implement data loss prevention (DLP) tools',
        'Enhance encryption for sensitive data',
        'Conduct security awareness training',
        'Review data retention policies',
        'Implement database activity monitoring'
      ],
      ddos: [
        'Increase DDoS protection capacity',
        'Implement geo-blocking for high-risk regions',
        'Review and optimize rate limiting rules',
        'Consider CDN expansion',
        'Establish traffic baseline metrics',
        'Create automated scaling policies'
      ],
      account_compromise: [
        'Enforce multi-factor authentication',
        'Implement adaptive authentication',
        'Review password policies',
        'Deploy user behavior analytics',
        'Enable account lockout policies',
        'Implement privileged access management'
      ],
      malware: [
        'Update endpoint protection',
        'Implement application whitelisting',
        'Enhance email security filters',
        'Deploy sandboxing for suspicious files',
        'Review patch management processes',
        'Implement network segmentation'
      ],
      ransomware: [
        'Improve backup and recovery procedures',
        'Test backup restoration regularly',
        'Implement immutable backups',
        'Deploy anti-ransomware tools',
        'Create offline backup copies',
        'Develop ransomware response playbook'
      ],
      insider_threat: [
        'Implement user activity monitoring',
        'Deploy data exfiltration detection',
        'Review access control policies',
        'Implement least privilege principle',
        'Enhance background check processes',
        'Create insider threat program'
      ],
      physical_security: [
        'Review physical access controls',
        'Upgrade surveillance systems',
        'Implement visitor management',
        'Enhance perimeter security',
        'Deploy environmental monitoring',
        'Create physical security awareness program'
      ],
      supply_chain: [
        'Assess vendor security posture',
        'Implement vendor risk management',
        'Review third-party access controls',
        'Establish security requirements for vendors',
        'Monitor supply chain vulnerabilities',
        'Create vendor incident response procedures'
      ],
      other: [
        'Conduct comprehensive security assessment',
        'Review and update security policies',
        'Enhance monitoring capabilities',
        'Improve incident detection mechanisms'
      ]
    };

    return recommendations[type] || recommendations.other;
  }

  /**
   * Get severity-based recommendations
   */
  private static getSeverityRecommendations(severity: IncidentSeverity): string[] {
    const recommendations: Record<IncidentSeverity, string[]> = {
      critical: [
        'Conduct comprehensive security audit',
        'Engage third-party security assessment',
        'Review and update incident response plan',
        'Implement 24/7 security monitoring',
        'Establish executive communication protocol'
      ],
      high: [
        'Increase security monitoring frequency',
        'Review critical system configurations',
        'Update security awareness training',
        'Enhance threat intelligence capabilities'
      ],
      medium: [
        'Schedule security review',
        'Update security documentation',
        'Review access logs regularly',
        'Implement additional monitoring rules'
      ],
      low: [
        'Document lessons learned',
        'Update security procedures',
        'Schedule routine security training'
      ]
    };

    return recommendations[severity] || [];
  }

  /**
   * Get status-based recommendations
   */
  private static getStatusRecommendations(incident: Incident): string[] {
    const recommendations: string[] = [];

    if (incident.status === 'recovered' || incident.status === 'closed') {
      recommendations.push(
        'Conduct post-incident review',
        'Update incident response procedures',
        'Share lessons learned with team',
        'Update security metrics and KPIs'
      );
    }

    if (incident.affectedUsers.length > 100) {
      recommendations.push(
        'Implement user communication plan',
        'Provide user security training',
        'Consider identity protection services'
      );
    }

    if (incident.affectedSystems.length > 5) {
      recommendations.push(
        'Review system interdependencies',
        'Implement system isolation capabilities',
        'Create system recovery priorities'
      );
    }

    return recommendations;
  }

  /**
   * Get pattern-based recommendations
   */
  private static getPatternRecommendations(incident: Incident): string[] {
    const recommendations: string[] = [];

    // Check for repeated incidents
    if (incident.metadata?.previousIncidents > 0) {
      recommendations.push(
        'Address root cause of repeated incidents',
        'Implement preventive controls',
        'Consider architectural changes'
      );
    }

    // Check for rapid escalation
    const detectedTime = incident.detectedAt.getTime();
    const containedTime = incident.containedAt?.getTime() || Date.now();
    const responseTime = containedTime - detectedTime;

    if (responseTime > 3600000) { // More than 1 hour
      recommendations.push(
        'Improve incident detection capabilities',
        'Implement automated response actions',
        'Review alert configuration'
      );
    }

    // Check for data involvement
    if (incident.metadata?.dataInvolved) {
      recommendations.push(
        'Review data classification policies',
        'Implement data access monitoring',
        'Enhance data protection controls'
      );
    }

    return recommendations;
  }

  /**
   * Prioritize recommendations
   */
  static prioritizeRecommendations(
    recommendations: string[], 
    incident: Incident
  ): { immediate: string[], shortTerm: string[], longTerm: string[] } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    const immediateKeywords = ['enforce', 'implement', 'deploy', 'enable'];
    const longTermKeywords = ['review', 'assess', 'create', 'establish'];

    recommendations.forEach(rec => {
      const lower = rec.toLowerCase();
      
      if (incident.severity === 'critical' && immediateKeywords.some(kw => lower.includes(kw))) {
        immediate.push(rec);
      } else if (longTermKeywords.some(kw => lower.includes(kw))) {
        longTerm.push(rec);
      } else {
        shortTerm.push(rec);
      }
    });

    return { immediate, shortTerm, longTerm };
  }
}
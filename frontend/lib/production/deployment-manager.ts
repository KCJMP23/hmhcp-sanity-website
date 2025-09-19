import { DeploymentChecklist, DeploymentReport } from './types'
import { defaultChecklist } from './checklist-data'

export class DeploymentManager {
  private static instance: DeploymentManager;
  private checklist: DeploymentChecklist[] = [];
  private reports: DeploymentReport[] = [];
  
  constructor() {
    this.initializeChecklist();
  }
  
  static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  private initializeChecklist(): void {
    this.checklist = [...defaultChecklist];
  }

  getChecklist(): DeploymentChecklist[] {
    return [...this.checklist];
  }

  getChecklistByCategory(category: DeploymentChecklist['category']): DeploymentChecklist[] {
    return this.checklist.filter(item => item.category === category);
  }

  updateChecklistItem(id: string, updates: Partial<DeploymentChecklist>): boolean {
    const index = this.checklist.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.checklist[index] = { ...this.checklist[index], ...updates };
    return true;
  }

  async runValidation(reportId: string = `deployment-${Date.now()}`): Promise<DeploymentReport> {
    // Reset all statuses
    this.checklist.forEach(item => {
      if (item.status === 'completed' || item.status === 'failed') {
        item.status = 'pending';
      }
    });

    // Run automated checks
    const automatedChecks = this.checklist.filter(item => item.automated && item.validator);
    
    for (const check of automatedChecks) {
      check.status = 'in_progress';
      
      try {
        const result = await check.validator!();
        check.status = result ? 'completed' : 'failed';
      } catch (error) {
        check.status = 'failed';
      }
    }

    // Generate report
    const report = this.generateReport(reportId);
    this.reports.push(report);
    
    return report;
  }

  async runCategoryValidation(
    category: DeploymentChecklist['category'], 
    reportId?: string
  ): Promise<DeploymentReport> {
    const categoryChecks = this.checklist.filter(item => item.category === category);
    
    // Reset category statuses
    categoryChecks.forEach(item => {
      if (item.status === 'completed' || item.status === 'failed') {
        item.status = 'pending';
      }
    });

    // Run automated checks for this category
    const automatedChecks = categoryChecks.filter(item => item.automated && item.validator);
    
    for (const check of automatedChecks) {
      check.status = 'in_progress';
      
      try {
        const result = await check.validator!();
        check.status = result ? 'completed' : 'failed';
      } catch (error) {
        check.status = 'failed';
      }
    }

    // Generate report
    const finalReportId = reportId || `${category}-validation-${Date.now()}`;
    const report = this.generateReport(finalReportId);
    this.reports.push(report);
    
    return report;
  }

  private generateReport(id: string): DeploymentReport {
    const completed = this.checklist.filter(item => item.status === 'completed').length;
    const failed = this.checklist.filter(item => item.status === 'failed').length;
    const skipped = this.checklist.filter(item => item.status === 'skipped').length;
    const total = this.checklist.length;
    
    // Calculate score (weighted by requirement)
    const requiredItems = this.checklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.status === 'completed').length;
    const score = Math.round((completedRequired / requiredItems.length) * 100);
    
    const readyForLaunch = failed === 0 && completedRequired === requiredItems.length;
    
    return {
      id,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      checklist: [...this.checklist],
      summary: {
        total,
        completed,
        failed,
        skipped,
        score,
      },
      readyForLaunch,
    };
  }

  getReports(): DeploymentReport[] {
    return [...this.reports];
  }

  getLatestReport(): DeploymentReport | null {
    if (this.reports.length === 0) return null;
    return this.reports[this.reports.length - 1];
  }

  getReport(id: string): DeploymentReport | null {
    return this.reports.find(report => report.id === id) || null;
  }

  clearReports(): void {
    this.reports = [];
  }

  resetChecklist(): void {
    this.checklist.forEach(item => {
      item.status = 'pending';
    });
  }

  getReadinessScore(): number {
    const requiredItems = this.checklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.status === 'completed').length;
    return Math.round((completedRequired / requiredItems.length) * 100);
  }

  isReadyForLaunch(): boolean {
    const failed = this.checklist.filter(item => item.status === 'failed').length;
    const requiredItems = this.checklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.status === 'completed').length;
    
    return failed === 0 && completedRequired === requiredItems.length;
  }

  exportReport(reportId?: string): string {
    const report = reportId ? this.getReport(reportId) : this.getLatestReport();
    if (!report) throw new Error('No report found');
    
    return JSON.stringify(report, null, 2);
  }
}
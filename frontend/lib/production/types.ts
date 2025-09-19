export interface DeploymentChecklist {
  id: string;
  category: 'infrastructure' | 'security' | 'performance' | 'monitoring' | 'content' | 'testing';
  title: string;
  description: string;
  required: boolean;
  automated: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  validator?: () => Promise<boolean>;
  dependencies?: string[];
}

export interface DeploymentReport {
  id: string;
  timestamp: number;
  environment: string;
  version: string;
  checklist: DeploymentChecklist[];
  summary: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    score: number;
  };
  readyForLaunch: boolean;
}

export interface DeploymentConfig {
  checklistItems: DeploymentChecklist[];
  validators: Record<string, () => Promise<boolean>>;
}
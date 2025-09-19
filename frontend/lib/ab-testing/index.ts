'use client';

import { createClient } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

interface Variant {
  id: string;
  name: string;
  weight: number;
  config: any;
  is_control?: boolean;
}

interface ABTest {
  id: string;
  name: string;
  description?: string;
  hypothesis?: string;
  test_type: 'split' | 'multivariate' | 'redirect';
  variants: Variant[];
  goal_id: string;
  secondary_goals?: string[];
  targeting_rules?: any;
  traffic_allocation: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
}

interface TestResults {
  testId: string;
  testName: string;
  status: string;
  variants: Array<{
    variantId: string;
    variantName: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    confidenceInterval: [number, number];
    isWinner: boolean;
    improvementOverControl: number | null;
  }>;
  confidenceLevel: number;
  winner: string | null;
  recommendation: string;
}

export class ABTestingEngine {
  private static instance: ABTestingEngine;
  private supabase = createClient();
  private activeTests: Map<string, ABTest> = new Map();
  private assignments: Map<string, string> = new Map(); // testName -> variantId

  private constructor() {
    this.loadActiveTests();
  }

  static getInstance(): ABTestingEngine {
    if (!ABTestingEngine.instance) {
      ABTestingEngine.instance = new ABTestingEngine();
    }
    return ABTestingEngine.instance;
  }

  private async loadActiveTests() {
    try {
      const response = await fetch('/api/analytics/ab-tests?status=running');
      if (response.ok) {
        const data = await response.json();
        data.tests?.forEach((test: ABTest) => {
          this.activeTests.set(test.name, test);
        });
      }
    } catch (error) {
      logger.error('Error loading A/B tests:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  async getVariant(testName: string, visitorId?: string): Promise<Variant> {
    const test = this.activeTests.get(testName);
    if (!test || test.status !== 'running') {
      return { id: 'control', name: 'Control', weight: 100, config: {} };
    }

    // Check if visitor should be included in test
    if (!this.shouldIncludeVisitor(test, visitorId)) {
      return test.variants.find(v => v.is_control) || test.variants[0];
    }

    // Check if already assigned
    const existingAssignment = this.assignments.get(testName);
    if (existingAssignment) {
      return test.variants.find(v => v.id === existingAssignment) || test.variants[0];
    }

    // Get or create assignment
    const assignment = await this.getOrCreateAssignment(test, visitorId || this.getVisitorId());
    const variant = test.variants.find(v => v.id === assignment.variantId) || test.variants[0];
    
    this.assignments.set(testName, variant.id);
    return variant;
  }

  private shouldIncludeVisitor(test: ABTest, visitorId?: string): boolean {
    // Check traffic allocation
    if (test.traffic_allocation < 100) {
      const hash = this.hashString((visitorId || this.getVisitorId()) + 'allocation');
      const bucket = Math.abs(hash) % 100;
      if (bucket >= test.traffic_allocation) {
        return false;
      }
    }

    // Check targeting rules
    if (test.targeting_rules) {
      // Implement targeting logic based on rules
      // For now, we'll include everyone
    }

    return true;
  }

  private async getOrCreateAssignment(test: ABTest, visitorId: string): Promise<{ variantId: string }> {
    try {
      // Try to get existing assignment
      const response = await fetch(`/api/analytics/ab-tests/${test.id}/assignment?visitorId=${visitorId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.assignment) {
          return { variantId: data.assignment.variant_id };
        }
      }

      // Create new assignment
      const variantId = this.selectVariant(test, visitorId);
      
      await fetch(`/api/analytics/ab-tests/${test.id}/assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, variantId }),
      });

      return { variantId };
    } catch (error) {
      logger.error('Error managing A/B test assignment:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
      // Fallback to control
      return { variantId: test.variants.find(v => v.is_control)?.id || test.variants[0].id };
    }
  }

  private selectVariant(test: ABTest, visitorId: string): string {
    // Consistent assignment based on visitor ID
    const hash = this.hashString(visitorId + test.id);
    const bucket = Math.abs(hash) % 100;

    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant.id;
      }
    }

    return test.variants[0].id;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  async trackConversion(testName: string, value?: number) {
    const variantId = this.assignments.get(testName);
    if (!variantId) return;

    const test = this.activeTests.get(testName);
    if (!test || test.status !== 'running') return;

    try {
      await fetch(`/api/analytics/ab-tests/${test.id}/conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: this.getVisitorId(),
          variantId,
          value,
        }),
      });
    } catch (error) {
      logger.error('Error tracking A/B test conversion:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  async getTestResults(testId: string): Promise<TestResults | null> {
    try {
      const response = await fetch(`/api/analytics/ab-tests/${testId}/results`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      logger.error('Error fetching test results:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
    return null;
  }

  private getVisitorId(): string {
    return localStorage.getItem('hm_visitor_id') || 'anonymous';
  }

  // Statistical significance calculation
  calculateStatisticalSignificance(
    controlConversions: number,
    controlVisitors: number,
    variantConversions: number,
    variantVisitors: number,
    confidenceLevel: number = 0.95
  ): {
    isSignificant: boolean;
    pValue: number;
    confidenceInterval: [number, number];
    improvement: number;
  } {
    const controlRate = controlVisitors > 0 ? controlConversions / controlVisitors : 0;
    const variantRate = variantVisitors > 0 ? variantConversions / variantVisitors : 0;
    
    // Z-test for proportions
    const pooledRate = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlVisitors + 1 / variantVisitors));
    const z = se > 0 ? (variantRate - controlRate) / se : 0;
    
    // Two-tailed p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    
    // Confidence interval for the difference
    const zScore = this.getZScore(confidenceLevel);
    const ciLower = (variantRate - controlRate) - zScore * se;
    const ciUpper = (variantRate - controlRate) + zScore * se;
    
    // Relative improvement
    const improvement = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;
    
    return {
      isSignificant: pValue < (1 - confidenceLevel),
      pValue,
      confidenceInterval: [ciLower * 100, ciUpper * 100],
      improvement,
    };
  }

  private normalCDF(z: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  private getZScore(confidenceLevel: number): number {
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    return zScores[confidenceLevel] || 1.96;
  }

  // Render variant content
  renderVariant(testName: string, content: Record<string, React.ReactNode>): React.ReactNode {
    const variant = this.assignments.get(testName);
    if (!variant || !content[variant]) {
      return content.control || content[Object.keys(content)[0]];
    }
    return content[variant];
  }
}
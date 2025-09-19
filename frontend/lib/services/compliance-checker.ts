// Mock compliance checker for testing
export interface ComplianceResult {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
}

export async function checkHIPAACompliance(content: string): Promise<ComplianceResult> {
  return {
    isCompliant: true,
    violations: [],
    recommendations: []
  };
}

export async function validateMedicalContent(content: string): Promise<ComplianceResult> {
  return {
    isCompliant: true,
    violations: [],
    recommendations: []
  };
}

export async function scanForPHI(content: string): Promise<string[]> {
  return [];
}

// Mock PHI detector for testing
export interface PHIDetectionResult {
  hasPHI: boolean;
  detectedFields: string[];
  confidence: number;
}

export async function detectPHI(content: string): Promise<PHIDetectionResult> {
  return {
    hasPHI: false,
    detectedFields: [],
    confidence: 0.9
  };
}

export async function scanForPHI(content: string): Promise<string[]> {
  return [];
}

export async function validatePHICompliance(content: string): Promise<boolean> {
  return true;
}

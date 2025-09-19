// Mock metrics collector for testing
export class MetricsCollector {
  async collectMetric(name: string, value: number, tags?: Record<string, string>) {
    // Mock implementation
    return true;
  }

  async collectCounter(name: string, value: number = 1, tags?: Record<string, string>) {
    // Mock implementation
    return true;
  }

  async collectGauge(name: string, value: number, tags?: Record<string, string>) {
    // Mock implementation
    return true;
  }

  async collectHistogram(name: string, value: number, tags?: Record<string, string>) {
    // Mock implementation
    return true;
  }
}

export const metricsCollector = new MetricsCollector();
export default metricsCollector;

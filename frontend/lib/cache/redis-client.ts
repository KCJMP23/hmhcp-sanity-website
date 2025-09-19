// Mock Redis client for testing
export class RedisClient {
  async getCachedData(key: string): Promise<any> {
    // Mock implementation
    return null;
  }

  async setCachedData(key: string, data: any, ttl?: number): Promise<boolean> {
    // Mock implementation
    return true;
  }

  async deleteCachedData(key: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  async clearCache(): Promise<boolean> {
    // Mock implementation
    return true;
  }
}

export const redisClient = new RedisClient();
export const getCachedData = redisClient.getCachedData.bind(redisClient);
export const setCachedData = redisClient.setCachedData.bind(redisClient);

// Export redis for backward compatibility
export const redis = redisClient;

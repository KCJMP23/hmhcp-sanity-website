import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  return {
    success,
    limit,
    reset,
    remaining,
  };
}

// Export rateLimit as default for backward compatibility
export default checkRateLimit;

export { ratelimit };

// Export rateLimiter for backward compatibility
export const rateLimiter = ratelimit;

// Export rateLimit for backward compatibility
export const rateLimit = ratelimit;
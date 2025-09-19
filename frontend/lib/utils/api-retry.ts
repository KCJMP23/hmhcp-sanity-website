// API Retry Utility
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response
      }
      
      // Retry on server errors (5xx) or network issues
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      return response
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (i === maxRetries - 1) {
        throw lastError
      }
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Failed after retries')
}
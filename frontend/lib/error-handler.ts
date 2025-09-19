export function initializeServerErrorHandling() {
  // Server-side error handling initialization
  if (typeof window === 'undefined') {
    process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    })

    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error)
    })
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  console.error('Error captured:', error, context)
  // In production, this would send to error tracking service
}

export function logError(message: string, error?: Error) {
  console.error(message, error)
}

export function initializeClientErrorHandling() {
  // Client-side error handling initialization
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
    })

    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
    })
  }
}
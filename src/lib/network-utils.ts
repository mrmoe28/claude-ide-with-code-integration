/**
 * Network utilities for error recovery and retry mechanisms
 */

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: any) => boolean
}

export interface NetworkError extends Error {
  status?: number
  code?: string
  isNetworkError?: boolean
  isTimeout?: boolean
  isServerError?: boolean
  isClientError?: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: NetworkError) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return !!(
      error.isNetworkError ||
      error.isTimeout ||
      error.isServerError ||
      (error.status && error.status >= 500) ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    )
  }
}

export function createNetworkError(
  message: string,
  status?: number,
  code?: string
): NetworkError {
  const error = new Error(message) as NetworkError
  error.status = status
  error.code = code
  error.isNetworkError = !status || status === 0
  error.isTimeout = code === 'ETIMEDOUT' || message.includes('timeout')
  error.isServerError = !!(status && status >= 500 && status < 600)
  error.isClientError = !!(status && status >= 400 && status < 500)
  return error
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: NetworkError

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as NetworkError

      // Don't retry if this is the last attempt
      if (attempt === finalConfig.maxAttempts) {
        break
      }

      // Don't retry if the retry condition is not met
      if (finalConfig.retryCondition && !finalConfig.retryCondition(lastError)) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      )

      console.warn(`Request failed (attempt ${attempt}/${finalConfig.maxAttempts}). Retrying in ${delay}ms...`, {
        error: lastError.message,
        status: lastError.status,
        code: lastError.code
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await withRetry(async () => {
      try {
        const res = await fetch(url, {
          ...options,
          signal: controller.signal
        })

        // Handle HTTP error statuses
        if (!res.ok) {
          throw createNetworkError(
            `HTTP ${res.status}: ${res.statusText}`,
            res.status
          )
        }

        return res
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw createNetworkError('Request timeout', 0, 'ETIMEDOUT')
        }

        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          throw createNetworkError('Network connection failed', 0, 'ECONNRESET')
        }

        // Re-throw HTTP errors as-is
        if (fetchError.status) {
          throw fetchError
        }

        // Wrap other errors
        throw createNetworkError(
          fetchError.message || 'Network request failed',
          0,
          fetchError.code
        )
      }
    }, retryConfig)

    return response
  } finally {
    clearTimeout(timeout)
  }
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function getConnectionType(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (!connection) return 'unknown'
  
  return connection.effectiveType || connection.type || 'unknown'
}

export function formatNetworkError(error: NetworkError): string {
  if (error.isTimeout) {
    return 'Request timed out. Please check your connection and try again.'
  }
  
  if (error.isNetworkError && !isOnline()) {
    return 'You appear to be offline. Please check your internet connection.'
  }
  
  if (error.isNetworkError) {
    return 'Network connection failed. Please check your internet connection and try again.'
  }
  
  if (error.isServerError) {
    return 'Server temporarily unavailable. Please try again in a moment.'
  }
  
  if (error.status === 401) {
    return 'Authentication failed. Please check your API keys.'
  }
  
  if (error.status === 403) {
    return 'Access denied. Please check your permissions.'
  }
  
  if (error.status === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.'
  }
  
  if (error.isClientError) {
    return `Request failed: ${error.message}`
  }
  
  return error.message || 'An unexpected error occurred'
}
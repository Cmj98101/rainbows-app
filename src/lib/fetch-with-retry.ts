/**
 * Fetch with automatic retry for network errors
 * Provides better error handling for API requests
 */

interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Fetch with automatic retry on network failures
 * @param url - The URL to fetch
 * @param options - Fetch options plus retry configuration
 * @returns Promise<Response>
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // If response is OK or it's a client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error (5xx) - retry
      if (attempt < maxRetries) {
        const error = new Error(`Server error ${response.status}`);
        lastError = error;

        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Network error - retry
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  // All retries failed
  throw new NetworkError(
    'Network request failed after multiple retries. Please check your internet connection.',
    undefined,
    lastError || undefined
  );
}

/**
 * Parse JSON response with better error handling
 */
export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch (error) {
    throw new NetworkError(
      'Failed to parse server response',
      response.status,
      error as Error
    );
  }
}

/**
 * Helper to handle API errors consistently
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

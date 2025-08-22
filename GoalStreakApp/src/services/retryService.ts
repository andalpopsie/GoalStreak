// Retry service for handling network failures gracefully

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Check if it's a network error worth retrying
      if (isRetryableError(error)) {
        console.log(`Attempt ${attempt} failed, retrying in ${currentDelay}ms...`);
        await delay(currentDelay);
        currentDelay *= backoffMultiplier;
      } else {
        // Non-retryable error, throw immediately
        throw error;
      }
    }
  }

  throw lastError!;
}

function isRetryableError(error: any): boolean {
  // Check for network-related errors
  if (error?.code === 'unavailable' || 
      error?.code === 'deadline-exceeded' ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout')) {
    return true;
  }
  
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Specific retry configurations for different operations
export const RETRY_CONFIGS = {
  habitCompletion: {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 1.5,
  },
  habitCreation: {
    maxAttempts: 2,
    delayMs: 1000,
    backoffMultiplier: 2,
  },
  dataFetch: {
    maxAttempts: 2,
    delayMs: 800,
    backoffMultiplier: 1.8,
  },
};

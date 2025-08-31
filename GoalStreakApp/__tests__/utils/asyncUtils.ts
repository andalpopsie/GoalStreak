// Async Test Utilities for GoalStreak
import { act } from '@testing-library/react-native';

/**
 * Wait for a condition to be true with timeout
 */
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = async (timeout: number = 1000): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, timeout));
  });
};

/**
 * Flush all pending promises
 */
export const flushPromises = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setImmediate(resolve));
  });
};

/**
 * Wait for multiple promises with timeout
 */
export const waitForPromises = async (
  promises: Promise<any>[],
  timeout: number = 5000
): Promise<any[]> => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Promises timed out after ${timeout}ms`)), timeout);
  });
  
  return Promise.race([
    Promise.all(promises),
    timeoutPromise
  ]) as Promise<any[]>;
};

/**
 * Create a delayed promise for testing
 */
export const createDelayedPromise = <T>(
  value: T,
  delay: number = 100
): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), delay);
  });
};

/**
 * Create a rejected promise for testing
 */
export const createRejectedPromise = (
  error: string | Error,
  delay: number = 100
): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      reject(errorObj);
    }, delay);
  });
};

/**
 * Mock async function with controllable resolution
 */
export class MockAsyncFunction<T = any> {
  private resolveCallbacks: Array<(value: T) => void> = [];
  private rejectCallbacks: Array<(error: Error) => void> = [];
  private callCount = 0;
  private calls: any[][] = [];

  fn = jest.fn((...args: any[]) => {
    this.callCount++;
    this.calls.push(args);
    
    return new Promise<T>((resolve, reject) => {
      this.resolveCallbacks.push(resolve);
      this.rejectCallbacks.push(reject);
    });
  });

  resolve(value: T, callIndex: number = 0): void {
    if (this.resolveCallbacks[callIndex]) {
      this.resolveCallbacks[callIndex](value);
    }
  }

  reject(error: Error, callIndex: number = 0): void {
    if (this.rejectCallbacks[callIndex]) {
      this.rejectCallbacks[callIndex](error);
    }
  }

  resolveAll(value: T): void {
    this.resolveCallbacks.forEach(resolve => resolve(value));
    this.resolveCallbacks = [];
  }

  rejectAll(error: Error): void {
    this.rejectCallbacks.forEach(reject => reject(error));
    this.rejectCallbacks = [];
  }

  getCallCount(): number {
    return this.callCount;
  }

  getCalls(): any[][] {
    return this.calls;
  }

  getLastCall(): any[] | undefined {
    return this.calls[this.calls.length - 1];
  }

  reset(): void {
    this.callCount = 0;
    this.calls = [];
    this.resolveCallbacks = [];
    this.rejectCallbacks = [];
    this.fn.mockClear();
  }
}

/**
 * Create a mock async function
 */
export const createMockAsyncFunction = <T = any>(): MockAsyncFunction<T> => {
  return new MockAsyncFunction<T>();
};

/**
 * Wait for element to appear with timeout
 */
export const waitForElement = async (
  getElement: () => any,
  timeout: number = 5000
): Promise<any> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const element = getElement();
      if (element) {
        return element;
      }
    } catch (error) {
      // Element not found yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Element not found within ${timeout}ms`);
};

/**
 * Wait for element to disappear with timeout
 */
export const waitForElementToDisappear = async (
  getElement: () => any,
  timeout: number = 5000
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const element = getElement();
      if (!element) {
        return;
      }
    } catch (error) {
      // Element not found, which is what we want
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Element did not disappear within ${timeout}ms`);
};

/**
 * Simulate network delay for testing
 */
export const simulateNetworkDelay = (
  minDelay: number = 100,
  maxDelay: number = 500
): Promise<void> => {
  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Create a timeout promise for racing
 */
export const createTimeoutPromise = (timeout: number, message?: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Operation timed out after ${timeout}ms`));
    }, timeout);
  });
};

/**
 * Retry an async operation with exponential backoff
 */
export const retryAsync = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Batch async operations with concurrency limit
 */
export const batchAsync = async <T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(operation);
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};
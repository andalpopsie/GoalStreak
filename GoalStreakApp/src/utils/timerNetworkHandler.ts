// Timer Network Handler - Handles network failures and offline scenarios
// Provides robust offline support and graceful degradation for timer functionality

import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerState, TimerSession, TimerError } from '../types/timer';
import { TIMER_STORAGE_KEYS } from '../constants/timer';
import { timerErrorHandler } from './timerErrorHandler';

export interface NetworkState {
  isConnected: boolean;
  type?: string;
  isInternetReachable?: boolean;
}

export interface OfflineOperation {
  id: string;
  type: 'timer_start' | 'timer_pause' | 'timer_resume' | 'timer_reset' | 'timer_complete' | 'session_save';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

/**
 * Timer Network Handler Class
 * Manages network connectivity and offline operations for timers
 */
export class TimerNetworkHandler {
  private static instance: TimerNetworkHandler;
  private networkState: NetworkState = { isConnected: false };
  private offlineQueue: OfflineOperation[] = [];
  private networkListeners: ((state: NetworkState) => void)[] = [];
  private syncInProgress = false;
  private networkCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeNetworkMonitoring();
    this.loadOfflineQueue();
  }

  static getInstance(): TimerNetworkHandler {
    if (!TimerNetworkHandler.instance) {
      TimerNetworkHandler.instance = new TimerNetworkHandler();
    }
    return TimerNetworkHandler.instance;
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.networkState.isConnected;
  }

  /**
   * Add network state listener
   */
  addNetworkListener(listener: (state: NetworkState) => void): () => void {
    this.networkListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.networkListeners.indexOf(listener);
      if (index > -1) {
        this.networkListeners.splice(index, 1);
      }
    };
  }

  /**
   * Queue operation for offline execution
   */
  async queueOfflineOperation(
    type: OfflineOperation['type'],
    data: any,
    maxRetries: number = 3
  ): Promise<string> {
    const operation: OfflineOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries
    };

    this.offlineQueue.push(operation);
    await this.saveOfflineQueue();

    return operation.id;
  }

  /**
   * Execute network operation with offline fallback
   */
  async executeWithOfflineFallback<T>(
    operation: () => Promise<T>,
    fallbackData: {
      type: OfflineOperation['type'];
      data: any;
      maxRetries?: number;
    }
  ): Promise<T> {
    if (!this.isOnline()) {
      // Queue for later execution
      await this.queueOfflineOperation(
        fallbackData.type,
        fallbackData.data,
        fallbackData.maxRetries
      );
      
      // Handle offline scenario based on operation type
      return this.handleOfflineScenario(fallbackData.type, fallbackData.data);
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Network operation failed:', error);
      
      // Check if it's a network error
      if (this.isNetworkError(error)) {
        // Queue for retry
        await this.queueOfflineOperation(
          fallbackData.type,
          fallbackData.data,
          fallbackData.maxRetries
        );
        
        // Handle as offline scenario
        return this.handleOfflineScenario(fallbackData.type, fallbackData.data);
      }
      
      // Re-throw non-network errors
      throw error;
    }
  }

  /**
   * Sync offline operations when network is restored
   */
  async syncOfflineOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline() || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    const operations = [...this.offlineQueue];
    const successfulOperations: string[] = [];

    for (const operation of operations) {
      try {
        await this.executeOfflineOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        operation.retryCount++;
        
        if (operation.retryCount >= operation.maxRetries) {
          console.warn(`Max retries reached for operation ${operation.id}, removing from queue`);
          successfulOperations.push(operation.id); // Remove from queue
          
          // Handle failed operation
          await timerErrorHandler.handleError(
            TimerError.BACKGROUND_SYNC_FAILED,
            {
              operation: operation.type,
              additionalData: { operationId: operation.id, retryCount: operation.retryCount }
            }
          );
        }
      }
    }

    // Remove successful operations from queue
    this.offlineQueue = this.offlineQueue.filter(
      op => !successfulOperations.includes(op.id)
    );

    await this.saveOfflineQueue();
    this.syncInProgress = false;

  }

  /**
   * Handle offline scenarios for different operation types
   */
  private handleOfflineScenario<T>(type: OfflineOperation['type'], data: any): T {
    switch (type) {
      case 'timer_start':
        // Timer can start offline, just won't sync to Firebase
        return data.timerState as T;

      case 'timer_pause':
      case 'timer_resume':
        // Timer state changes work offline
        return data.timerState as T;

      case 'timer_reset':
        // Timer reset works offline
        return undefined as T;

      case 'timer_complete':
        // Timer completion works offline, session saved locally
        return data.session as T;

      case 'session_save':
        // Session saved locally
        return data.sessionId as T;

      default:
        throw new Error(`Unsupported offline operation: ${type}`);
    }
  }

  /**
   * Execute queued offline operation
   */
  private async executeOfflineOperation(operation: OfflineOperation): Promise<void> {
    // This would be implemented by the calling service
    // For now, we'll just simulate the execution
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, this would call the appropriate service method
    switch (operation.type) {
      case 'timer_start':
        // Call Firebase timer service to sync timer start
        break;
      case 'timer_pause':
        // Call Firebase timer service to sync timer pause
        break;
      case 'timer_resume':
        // Call Firebase timer service to sync timer resume
        break;
      case 'timer_reset':
        // Call Firebase timer service to sync timer reset
        break;
      case 'timer_complete':
        // Call Firebase timer service to sync timer completion
        break;
      case 'session_save':
        // Call Firebase timer service to save session
        break;
    }
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('offline') ||
      message.includes('unreachable') ||
      code.includes('network') ||
      code.includes('timeout') ||
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError'
    );
  }

  /**
   * Initialize network monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    // Initial network state check
    await this.updateNetworkState();

    // Set up periodic network checks
    this.networkCheckInterval = setInterval(async () => {
      const previousState = { ...this.networkState };
      await this.updateNetworkState();
      
      // Check if network state changed
      if (previousState.isConnected !== this.networkState.isConnected) {
        this.notifyNetworkListeners();
        
        // If we just came online, sync offline operations
        if (this.networkState.isConnected && !previousState.isConnected) {
          setTimeout(() => this.syncOfflineOperations(), 1000); // Small delay to ensure stability
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Update network state
   */
  private async updateNetworkState(): Promise<void> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      this.networkState = {
        isConnected: networkState.isConnected ?? false,
        type: networkState.type,
        isInternetReachable: networkState.isInternetReachable ?? undefined
      };
    } catch (error) {
      console.error('Error checking network state:', error);
      this.networkState = { isConnected: false };
    }
  }

  /**
   * Notify network listeners
   */
  private notifyNetworkListeners(): void {
    this.networkListeners.forEach(listener => {
      try {
        listener(this.networkState);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        TIMER_STORAGE_KEYS.TIMER_HISTORY + '_offline_queue',
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.TIMER_HISTORY + '_offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Clear offline queue
   */
  async clearOfflineQueue(): Promise<void> {
    this.offlineQueue = [];
    await this.saveOfflineQueue();
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): {
    count: number;
    oldestOperation?: Date;
    newestOperation?: Date;
  } {
    if (this.offlineQueue.length === 0) {
      return { count: 0 };
    }

    const timestamps = this.offlineQueue.map(op => op.timestamp);
    return {
      count: this.offlineQueue.length,
      oldestOperation: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      newestOperation: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
    this.networkListeners = [];
  }
}

// Export singleton instance
export const timerNetworkHandler = TimerNetworkHandler.getInstance();

// Export utility functions
export const networkUtils = {
  /**
   * Check if device is online
   */
  isOnline: (): boolean => timerNetworkHandler.isOnline(),

  /**
   * Execute operation with offline fallback
   */
  executeWithFallback: <T>(
    operation: () => Promise<T>,
    fallbackData: {
      type: OfflineOperation['type'];
      data: any;
      maxRetries?: number;
    }
  ): Promise<T> => timerNetworkHandler.executeWithOfflineFallback(operation, fallbackData),

  /**
   * Queue offline operation
   */
  queueOperation: (
    type: OfflineOperation['type'],
    data: any,
    maxRetries?: number
  ): Promise<string> => timerNetworkHandler.queueOfflineOperation(type, data, maxRetries),

  /**
   * Get network state
   */
  getNetworkState: (): NetworkState => timerNetworkHandler.getNetworkState(),

  /**
   * Add network listener
   */
  onNetworkChange: (listener: (state: NetworkState) => void): (() => void) => 
    timerNetworkHandler.addNetworkListener(listener),

  /**
   * Get offline queue status
   */
  getOfflineStatus: () => timerNetworkHandler.getOfflineQueueStatus(),

  /**
   * Force sync offline operations
   */
  syncNow: (): Promise<void> => timerNetworkHandler.syncOfflineOperations()
};
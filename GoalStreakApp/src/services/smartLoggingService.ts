/**
 * Smart Logging Service
 *
 * Optimized logging strategy to prevent storage bloat and reduce costs.
 * Implements intelligent log filtering, sampling, and batching.
 */

import { config } from '../config/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 'analytics' | 'performance' | 'error' | 'user' | 'system';

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface LoggingConfig {
  enabledLevels: LogLevel[];
  enabledCategories: LogCategory[];
  samplingRates: Record<LogCategory, number>; // 0.0 to 1.0
  batchSize: number;
  maxStorageSize: number; // MB
  retentionDays: number;
}

class SmartLoggingService {
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private lastFlush: Date = new Date();
  private totalLogSize: number = 0;

  constructor() {
    this.config = this.getOptimizedConfig();
  }

  /**
   * Get optimized logging configuration based on environment
   */
  private getOptimizedConfig(): LoggingConfig {
    if (config.environment === 'development') {
      return {
        enabledLevels: ['debug', 'info', 'warn', 'error', 'critical'],
        enabledCategories: ['analytics', 'performance', 'error', 'user', 'system'],
        samplingRates: {
          analytics: 0.5, // Sample 50% of analytics in dev
          performance: 0.3, // Sample 30% of performance in dev (reduce noise)
          error: 1.0, // Log all errors
          user: 0.8, // Sample 80% of user actions in dev
          system: 0.2, // Sample 20% of system logs
        },
        batchSize: 10,
        maxStorageSize: 50, // 50MB max in dev
        retentionDays: 7,
      };
    } else if (config.environment === 'staging') {
      return {
        enabledLevels: ['info', 'warn', 'error', 'critical'],
        enabledCategories: ['analytics', 'performance', 'error', 'user'],
        samplingRates: {
          analytics: 0.5, // Sample 50% of analytics
          performance: 0.8, // Sample 80% of performance
          error: 1.0, // Log all errors
          user: 0.3, // Sample 30% of user actions
          system: 0.1, // Sample 10% of system logs
        },
        batchSize: 25,
        maxStorageSize: 25, // 25MB max in staging
        retentionDays: 14,
      };
    } else {
      // Production - Minimal logging
      return {
        enabledLevels: ['warn', 'error', 'critical'],
        enabledCategories: ['error', 'user'],
        samplingRates: {
          analytics: 0.05, // Sample only 5% of analytics
          performance: 0.1, // Sample 10% of performance
          error: 1.0, // Log all errors
          user: 0.02, // Sample only 2% of user actions
          system: 0.005, // Sample 0.5% of system logs
        },
        batchSize: 50,
        maxStorageSize: 10, // 10MB max in production
        retentionDays: 30,
      };
    }
  }

  /**
   * Smart log function with sampling and filtering
   */
  log(level: LogLevel, category: LogCategory, message: string, data?: Record<string, any>): void {
    // Check if this log level and category are enabled
    if (
      !this.config.enabledLevels.includes(level) ||
      !this.config.enabledCategories.includes(category)
    ) {
      return;
    }

    // Apply sampling rate
    const samplingRate = this.config.samplingRates[category] || 0.1;
    if (Math.random() > samplingRate) {
      return; // Skip this log based on sampling
    }

    // Create log entry
    const logEntry: LogEntry = {
      level,
      category,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date(),
      userId: data?.userId,
      sessionId: data?.sessionId,
    };

    // Add to buffer
    this.addToBuffer(logEntry);

    // Console log only in development or for critical errors
    if (config.environment === 'development' || level === 'critical') {
      this.consoleLog(logEntry);
    }
  }

  /**
   * Sanitize data to prevent sensitive information logging
   */
  private sanitizeData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;

    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'email', 'phone', 'address'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Truncate long strings
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
        sanitized[key] = sanitized[key].substring(0, 200) + '...';
      }
    });

    return sanitized;
  }

  /**
   * Add log entry to buffer with size management
   */
  private addToBuffer(logEntry: LogEntry): void {
    const entrySize = this.estimateLogSize(logEntry);

    // Check if adding this entry would exceed storage limit
    if (this.totalLogSize + entrySize > this.config.maxStorageSize * 1024 * 1024) {
      this.flushOldestLogs();
    }

    this.logBuffer.push(logEntry);
    this.totalLogSize += entrySize;

    // Auto-flush if buffer is full
    if (this.logBuffer.length >= this.config.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Estimate log entry size in bytes
   */
  private estimateLogSize(logEntry: LogEntry): number {
    return JSON.stringify(logEntry).length * 2; // Rough estimate
  }

  /**
   * Console log with formatting
   */
  private consoleLog(logEntry: LogEntry): void {
    const emoji = this.getLogEmoji(logEntry.level, logEntry.category);
    const prefix = `${emoji} ${logEntry.category.toUpperCase()}`;

    switch (logEntry.level) {
      case 'debug':
        console.debug(prefix, logEntry.message, logEntry.data);
        break;
      case 'info':
        console.info(prefix, logEntry.message, logEntry.data);
        break;
      case 'warn':
        console.warn(prefix, logEntry.message, logEntry.data);
        break;
      case 'error':
      case 'critical':
        console.error(prefix, logEntry.message, logEntry.data);
        break;
    }
  }

  /**
   * Get appropriate emoji for log type
   */
  private getLogEmoji(level: LogLevel, category: LogCategory): string {
    if (level === 'error' || level === 'critical') return '🚨';
    if (level === 'warn') return '⚠️';

    switch (category) {
      case 'analytics':
        return '📊';
      case 'performance':
        return '⚡';
      case 'error':
        return '🚨';
      case 'user':
        return '👤';
      case 'system':
        return '⚙️';
      default:
        return '📝';
    }
  }

  /**
   * Flush logs to storage (Firebase/remote service)
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    // In production, this would send logs to Firebase or another service
    if (config.environment === 'development') {
      console.log(`📤 Flushing ${this.logBuffer.length} log entries`);
    }

    // Clear buffer after flushing
    this.logBuffer = [];
    this.totalLogSize = 0;
    this.lastFlush = new Date();
  }

  /**
   * Remove oldest logs to make space
   */
  private flushOldestLogs(): void {
    const removeCount = Math.floor(this.logBuffer.length * 0.3); // Remove 30%

    // Pre-calculate removed size for efficiency
    let removedSize = 0;
    for (let i = 0; i < removeCount; i++) {
      removedSize += this.estimateLogSize(this.logBuffer[i]);
    }

    // Remove logs and update size
    this.logBuffer.splice(0, removeCount);
    this.totalLogSize -= removedSize;

    if (config.environment === 'development') {
      console.log(`🗑️ Removed ${removeCount} old log entries to free space`);
    }
  }

  /**
   * Get logging statistics
   */
  getStats(): Record<string, any> {
    return {
      bufferSize: this.logBuffer.length,
      totalSizeMB: (this.totalLogSize / (1024 * 1024)).toFixed(2),
      maxSizeMB: this.config.maxStorageSize,
      lastFlush: this.lastFlush,
      config: this.config,
    };
  }

  /**
   * Force flush all logs
   */
  forceFlush(): void {
    this.flushLogs();
  }

  /**
   * Update sampling rates dynamically
   */
  updateSamplingRates(rates: Partial<Record<LogCategory, number>>): void {
    this.config.samplingRates = { ...this.config.samplingRates, ...rates };
  }
}

// Create singleton instance
export const smartLoggingService = new SmartLoggingService();

// Convenience functions
export const logDebug = (category: LogCategory, message: string, data?: Record<string, any>) => {
  smartLoggingService.log('debug', category, message, data);
};

export const logInfo = (category: LogCategory, message: string, data?: Record<string, any>) => {
  smartLoggingService.log('info', category, message, data);
};

export const logWarn = (category: LogCategory, message: string, data?: Record<string, any>) => {
  smartLoggingService.log('warn', category, message, data);
};

export const logError = (category: LogCategory, message: string, data?: Record<string, any>) => {
  smartLoggingService.log('error', category, message, data);
};

export const logCritical = (category: LogCategory, message: string, data?: Record<string, any>) => {
  smartLoggingService.log('critical', category, message, data);
};

// Analytics-specific logging
export const logAnalytics = (message: string, data?: Record<string, any>) => {
  smartLoggingService.log('info', 'analytics', message, data);
};

// Performance-specific logging
export const logPerformance = (message: string, data?: Record<string, any>) => {
  smartLoggingService.log('info', 'performance', message, data);
};

export default smartLoggingService;

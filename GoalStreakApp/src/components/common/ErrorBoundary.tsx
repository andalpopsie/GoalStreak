import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { crashlyticsService } from '../../services/crashlyticsService';
import { trackEvent } from '../../services/enhancedAnalyticsService';
import { initializationService } from '../../services/initializationService';
import { config } from '../../config/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

interface ErrorContext {
  error_id: string;
  error_message: string;
  error_stack?: string;
  error_name: string;
  error_category: string;
  component_stack: string;
  timestamp: string;
  platform: string;
  app_version: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  private lastErrorTime = 0;
  private errorCount = 0;
  private readonly ERROR_THROTTLE_MS = 5000; // 5 seconds
  private readonly MAX_ERRORS_PER_SESSION = 10;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const now = Date.now();
    
    // Throttle error reporting to prevent spam
    if (now - this.lastErrorTime < this.ERROR_THROTTLE_MS) {
      this.errorCount++;
      if (this.errorCount > this.MAX_ERRORS_PER_SESSION) {
        console.warn('Too many errors, stopping error reporting for this session');
        return;
      }
    } else {
      this.errorCount = 1;
    }
    
    this.lastErrorTime = now;
    
    console.error(`ErrorBoundary [${this.state.errorId}]:`, error, errorInfo);
    
    // Check if services are initialized before using them
    if (initializationService.isServicesInitialized()) {
      this.reportError(error, errorInfo);
    } else {
      // Fallback logging when services aren't ready
      console.error('Services not initialized, using fallback error logging');
      this.fallbackErrorLogging(error, errorInfo);
    }
  }

  private categorizeError = (error: Error): string => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    const name = error.name.toLowerCase();
    
    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('timeout') || name.includes('networkerror')) {
      return 'network';
    }
    
    // Firebase/Database errors
    if (message.includes('firebase') || stack.includes('firestore') || 
        message.includes('auth') || stack.includes('firebase')) {
      return 'firebase';
    }
    
    // Navigation errors
    if (message.includes('navigation') || stack.includes('navigation') ||
        message.includes('route') || stack.includes('navigator')) {
      return 'navigation';
    }
    
    // Rendering errors
    if (message.includes('render') || stack.includes('render') ||
        name.includes('invariantviolation') || message.includes('element')) {
      return 'render';
    }
    
    // Permission errors
    if (message.includes('permission') || message.includes('denied') ||
        message.includes('unauthorized')) {
      return 'permission';
    }
    
    // Memory/Performance errors
    if (message.includes('memory') || message.includes('heap') ||
        message.includes('performance')) {
      return 'performance';
    }
    
    return 'unknown';
  };

  private sanitizeErrorData = (error: Error, errorInfo: any): ErrorContext => {
    // Enhanced sensitive information filtering
    const sensitivePatterns = /password|token|key|secret|auth|email|phone|address|ssn|credit/gi;
    
    const sanitizedStack = error.stack?.replace(sensitivePatterns, '[REDACTED]');
    const sanitizedMessage = error.message.replace(sensitivePatterns, '[REDACTED]');
    
    // Truncate very long stack traces to prevent log bloat
    const truncatedStack = sanitizedStack?.length > 2000 
      ? sanitizedStack.substring(0, 2000) + '...[TRUNCATED]'
      : sanitizedStack;
    
    return {
      error_id: this.state.errorId || `error_${Date.now()}`,
      error_message: sanitizedMessage,
      error_stack: truncatedStack,
      error_name: error.name,
      error_category: this.categorizeError(error),
      component_stack: errorInfo.componentStack?.substring(0, 1000), // Limit component stack size
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      app_version: config.app.version,
    };
  };

  private reportError = (error: Error, errorInfo: any) => {
    try {
      const errorContext = this.sanitizeErrorData(error, errorInfo);
      
      crashlyticsService.recordError(error, `ErrorBoundary: ${errorInfo.componentStack}`, 'high');
      trackEvent('app_error_boundary_triggered', errorContext);
    } catch (analyticsError) {
      console.warn('Failed to log error to analytics:', analyticsError);
    }
  };

  private fallbackErrorLogging = (error: Error, errorInfo: any) => {
    // Store error for later reporting when services are ready
    const errorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Fallback error logging:', errorData);
    // Could store in AsyncStorage for later reporting when services initialize
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning" size={64} color={Colors.warning} />
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your habits are safe!
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={20} color={Colors.white} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.5,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.accent1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 25,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  errorDetails: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.gray.light,
    borderRadius: 8,
    width: '100%',
  },
  errorTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'monospace',
    color: Colors.gray.dark,
  },
});

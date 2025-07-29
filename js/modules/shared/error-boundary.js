/**
 * Error Boundary Module - Enhanced App Stability & Error Management
 * Comprehensive error handling, logging, and recovery system
 */

import { notificationManager } from '../services/notifications.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, STORAGE_KEYS } from './constants.js';

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  STORAGE: 'storage',
  DOM: 'dom',
  VALIDATION: 'validation',
  AUTH: 'auth',
  RUNTIME: 'runtime',
  ASYNC: 'async'
};

// Configuration constants
const ERROR_CONFIG = {
  MAX_ERROR_LOG_SIZE: 50,
  ERROR_LOG_KEY: 'nugt_error_log',
  ERROR_STATS_KEY: 'nugt_error_stats',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  NOTIFICATION_COOLDOWN: 5000 // 5 seconds between similar error notifications
};
class ModuleErrorBoundary {
  static notificationCooldowns = new Map();
  static errorStats = new Map();
  static retryAttempts = new Map();

  static wrap(moduleFunction, options = {}) {
    const {
      fallback = null,
      moduleName = 'Unknown',
      severity = ERROR_SEVERITY.MEDIUM,
      category = ERROR_CATEGORIES.RUNTIME,
      retryable = false,
      maxRetries = ERROR_CONFIG.MAX_RETRY_ATTEMPTS,
      retryDelay = ERROR_CONFIG.RETRY_DELAY
    } = options;

    return async (...args) => {
      const operationId = `${moduleName}_${Date.now()}`;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await moduleFunction(...args);
          
          // Clear retry attempts on success
          if (attempt > 0) {
            this.retryAttempts.delete(operationId);
            console.log(`${moduleName} succeeded after ${attempt} retries`);
          }
          
          return result;
        } catch (error) {
          const isLastAttempt = attempt === maxRetries;
          const shouldRetry = retryable && !isLastAttempt && this._shouldRetryError(error);
          
          if (shouldRetry) {
            console.warn(`${moduleName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
            await this._delay(retryDelay * (attempt + 1)); // Exponential backoff
            continue;
          }
          
          // Log error and handle failure
          this._handleError(error, moduleName, severity, category, args, attempt);
          
          // Return fallback if provided
          return fallback ? (typeof fallback === 'function' ? fallback(...args) : fallback) : null;
        }
      }
    };
  }

  static logError(error, moduleName, severity = ERROR_SEVERITY.MEDIUM, category = ERROR_CATEGORIES.RUNTIME, args = [], retryAttempt = 0) {
    const errorInfo = {
      id: this._generateErrorId(),
      module: moduleName,
      message: error.message,
      stack: error.stack,
      severity,
      category,
      timestamp: new Date().toISOString(),
      retryAttempt,
      args: this._sanitizeArgs(args),
      context: this._getErrorContext(),
      fingerprint: this._generateErrorFingerprint(error, moduleName)
    };

    // Update error statistics
    this._updateErrorStats(errorInfo);

    // Store error in localStorage
    this._storeError(errorInfo);

    // Log to console with appropriate level
    this._logToConsole(errorInfo);

    return errorInfo;
  }

  // Enhanced event handler wrapper
  static wrapEventHandler(handler, options = {}) {
    const {
      elementName = 'element',
      preventDefault = false,
      stopPropagation = false,
      showNotification = true
    } = options;

    return (event) => {
      try {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        
        return handler(event);
      } catch (error) {
        this._handleError(
          error,
          `EventHandler-${elementName}`,
          ERROR_SEVERITY.LOW,
          ERROR_CATEGORIES.DOM,
          [event.type]
        );
        
        if (showNotification) {
          this._showThrottledNotification('warning', ERROR_MESSAGES.GENERIC_ERROR);
        }
        
        return false;
      }
    };
  }

  // Enhanced async operation wrapper
  static async safeAsync(asyncFunction, options = {}) {
    const {
      fallback = null,
      context = 'async operation',
      timeout = 10000,
      retryable = false,
      maxRetries = ERROR_CONFIG.MAX_RETRY_ATTEMPTS
    } = options;

    return this.wrap(asyncFunction, {
      fallback,
      moduleName: context,
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.ASYNC,
      retryable,
      maxRetries
    })();
  }

  // Safe DOM operation wrapper
  static safeDOMOperation(operation, options = {}) {
    const {
      fallback = null,
      elementName = 'unknown',
      showNotification = false
    } = options;

    try {
      return operation();
    } catch (error) {
      this._handleError(
        error,
        `DOM-${elementName}`,
        ERROR_SEVERITY.LOW,
        ERROR_CATEGORIES.DOM,
        []
      );
      
      if (showNotification) {
        this._showThrottledNotification('warning', 'Interface error occurred');
      }
      
      return fallback;
    }
  }

  // Enhanced error log retrieval
  static getErrorLog(options = {}) {
    const {
      limit = null,
      severity = null,
      category = null,
      since = null
    } = options;

    try {
      let errors = JSON.parse(localStorage.getItem(ERROR_CONFIG.ERROR_LOG_KEY) || '[]');
      
      // Apply filters
      if (severity) {
        errors = errors.filter(error => error.severity === severity);
      }
      
      if (category) {
        errors = errors.filter(error => error.category === category);
      }
      
      if (since) {
        const sinceDate = new Date(since);
        errors = errors.filter(error => new Date(error.timestamp) >= sinceDate);
      }
      
      // Apply limit
      if (limit) {
        errors = errors.slice(-limit);
      }
      
      return errors;
    } catch (error) {
      console.warn('Could not retrieve error log:', error);
      return [];
    }
  }

  // Get error statistics
  static getErrorStats() {
    try {
      return JSON.parse(localStorage.getItem(ERROR_CONFIG.ERROR_STATS_KEY) || '{}');
    } catch (error) {
      console.warn('Could not retrieve error stats:', error);
      return {};
    }
  }

  // Clear error log and stats
  static clearErrorLog() {
    try {
      localStorage.removeItem(ERROR_CONFIG.ERROR_LOG_KEY);
      localStorage.removeItem(ERROR_CONFIG.ERROR_STATS_KEY);
      this.errorStats.clear();
      this.notificationCooldowns.clear();
      this.retryAttempts.clear();
      console.log('Error log and stats cleared');
      return true;
    } catch (error) {
      console.warn('Could not clear error log:', error);
      return false;
    }
  }

  // Export error log for debugging
  static exportErrorLog() {
    try {
      const errors = this.getErrorLog();
      const stats = this.getErrorStats();
      const exportData = {
        errors,
        stats,
        exportedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
      return true;
    } catch (error) {
      console.error('Could not export error log:', error);
      return false;
    }
  }

  // Check application health
  static getHealthStatus() {
    const errors = this.getErrorLog({ since: new Date(Date.now() - 3600000) }); // Last hour
    const criticalErrors = errors.filter(e => e.severity === ERROR_SEVERITY.CRITICAL);
    const highErrors = errors.filter(e => e.severity === ERROR_SEVERITY.HIGH);
    
    let status = 'healthy';
    let message = 'Application is running normally';
    
    if (criticalErrors.length > 0) {
      status = 'critical';
      message = `${criticalErrors.length} critical errors in the last hour`;
    } else if (highErrors.length > 3) {
      status = 'degraded';
      message = `${highErrors.length} high-severity errors in the last hour`;
    } else if (errors.length > 10) {
      status = 'warning';
      message = `${errors.length} errors in the last hour`;
    }
    
    return {
      status,
      message,
      errorCount: errors.length,
      criticalCount: criticalErrors.length,
      highCount: highErrors.length,
      lastError: errors.length > 0 ? errors[errors.length - 1] : null
    };
  }

  // Private helper methods
  static _handleError(error, moduleName, severity, category, args, retryAttempt = 0) {
    const errorInfo = this.logError(error, moduleName, severity, category, args, retryAttempt);
    
    // Show user notification based on severity
    this._showErrorNotification(errorInfo);
    
    return errorInfo;
  }

  static _showErrorNotification(errorInfo) {
    const { severity, module, fingerprint } = errorInfo;
    
    // Check notification cooldown
    if (this._isNotificationCooledDown(fingerprint)) {
      return;
    }
    
    let message;
    let type;
    
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        message = ERROR_MESSAGES.GENERIC_ERROR;
        type = 'danger';
        break;
      case ERROR_SEVERITY.HIGH:
        message = `${module} encountered an error. Please try again.`;
        type = 'danger';
        break;
      case ERROR_SEVERITY.MEDIUM:
        message = ERROR_MESSAGES.GENERIC_ERROR;
        type = 'warning';
        break;
      case ERROR_SEVERITY.LOW:
        // Don't show notifications for low severity errors
        return;
      default:
        message = ERROR_MESSAGES.GENERIC_ERROR;
        type = 'warning';
    }
    
    this._showThrottledNotification(type, message);
    this._setCooldown(fingerprint);
  }

  static _showThrottledNotification(type, message) {
    const key = `${type}_${message}`;
    if (this._isNotificationCooledDown(key)) {
      return;
    }
    
    notificationManager[type](message);
    this._setCooldown(key);
  }

  static _isNotificationCooledDown(key) {
    const lastShown = this.notificationCooldowns.get(key);
    return lastShown && (Date.now() - lastShown) < ERROR_CONFIG.NOTIFICATION_COOLDOWN;
  }

  static _setCooldown(key) {
    this.notificationCooldowns.set(key, Date.now());
  }

  static _shouldRetryError(error) {
    // Don't retry validation errors, auth errors, or DOM errors
    const nonRetryablePatterns = [
      'validation',
      'authentication',
      'unauthorized',
      'forbidden',
      'not found',
      'dom exception'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return !nonRetryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  static _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static _generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static _generateErrorFingerprint(error, moduleName) {
    const message = error.message || 'unknown';
    const stack = error.stack ? error.stack.split('\n')[0] : 'no-stack';
    return btoa(`${moduleName}:${message}:${stack}`).substr(0, 16);
  }

  static _sanitizeArgs(args) {
    try {
      const sanitized = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return JSON.stringify(arg).substring(0, 200);
        }
        return String(arg).substring(0, 100);
      });
      return sanitized.join(', ');
    } catch {
      return 'args-serialization-failed';
    }
  }

  static _getErrorContext() {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null
    };
  }

  static _updateErrorStats(errorInfo) {
    const { module, severity, category, fingerprint } = errorInfo;
    
    // Update in-memory stats
    const moduleKey = `module_${module}`;
    const severityKey = `severity_${severity}`;
    const categoryKey = `category_${category}`;
    
    this.errorStats.set(moduleKey, (this.errorStats.get(moduleKey) || 0) + 1);
    this.errorStats.set(severityKey, (this.errorStats.get(severityKey) || 0) + 1);
    this.errorStats.set(categoryKey, (this.errorStats.get(categoryKey) || 0) + 1);
    
    // Update persistent stats
    try {
      const stats = JSON.parse(localStorage.getItem(ERROR_CONFIG.ERROR_STATS_KEY) || '{}');
      stats[moduleKey] = (stats[moduleKey] || 0) + 1;
      stats[severityKey] = (stats[severityKey] || 0) + 1;
      stats[categoryKey] = (stats[categoryKey] || 0) + 1;
      stats.total = (stats.total || 0) + 1;
      stats.lastUpdated = Date.now();
      
      localStorage.setItem(ERROR_CONFIG.ERROR_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.warn('Could not update error stats:', error);
    }
  }

  static _storeError(errorInfo) {
    try {
      const errors = JSON.parse(localStorage.getItem(ERROR_CONFIG.ERROR_LOG_KEY) || '[]');
      errors.push(errorInfo);
      
      // Keep only the most recent errors
      if (errors.length > ERROR_CONFIG.MAX_ERROR_LOG_SIZE) {
        errors.splice(0, errors.length - ERROR_CONFIG.MAX_ERROR_LOG_SIZE);
      }
      
      localStorage.setItem(ERROR_CONFIG.ERROR_LOG_KEY, JSON.stringify(errors));
    } catch (storageError) {
      console.warn('Could not store error log:', storageError);
    }
  }

  static _logToConsole(errorInfo) {
    const { severity, module, message, stack } = errorInfo;
    
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        console.error(`🔴 CRITICAL [${module}]:`, message, stack);
        break;
      case ERROR_SEVERITY.HIGH:
        console.error(`🟠 HIGH [${module}]:`, message);
        break;
      case ERROR_SEVERITY.MEDIUM:
        console.warn(`🟡 MEDIUM [${module}]:`, message);
        break;
      case ERROR_SEVERITY.LOW:
        console.info(`🔵 LOW [${module}]:`, message);
        break;
      default:
        console.log(`⚪ UNKNOWN [${module}]:`, message);
    }
  }
}

// Enhanced global error handler
window.addEventListener('error', (event) => {
  const error = event.error || new Error(event.message);
  
  // Skip runtime.lastError messages as they're often harmless extension-related warnings
  if (event.message && event.message.includes('runtime.lastError')) {
    console.debug('Suppressed runtime.lastError:', event.message);
    return;
  }
  
  ModuleErrorBoundary._handleError(
    error,
    'GlobalError',
    ERROR_SEVERITY.HIGH,
    ERROR_CATEGORIES.RUNTIME,
    [`${event.filename}:${event.lineno}:${event.colno}`]
  );
});

// Enhanced unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  
  // Skip Chrome extension runtime errors
  if (error.message && error.message.includes('runtime.lastError')) {
    console.debug('Suppressed runtime.lastError promise rejection:', error.message);
    event.preventDefault();
    return;
  }
  
  ModuleErrorBoundary._handleError(
    error,
    'UnhandledPromiseRejection',
    ERROR_SEVERITY.HIGH,
    ERROR_CATEGORIES.ASYNC,
    []
  );
  
  // Prevent the default browser behavior for better UX
  event.preventDefault();
});

// Specific handler for Chrome extension runtime errors
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Suppress runtime.lastError by checking it periodically
  const originalLastError = chrome.runtime.lastError;
  Object.defineProperty(chrome.runtime, 'lastError', {
    get: function() {
      const error = originalLastError;
      if (error) {
        console.debug('Chrome runtime error suppressed:', error.message);
      }
      return null; // Always return null to prevent the error from propagating
    },
    configurable: true
  });
}

// Performance monitoring for memory leaks with throttling
if (performance.memory) {
  let lastMemoryWarning = 0;
  const MEMORY_WARNING_COOLDOWN = 60000; // 1 minute between warnings
  
  setInterval(() => {
    const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
    
    if (memoryUsage > 0.95) {
      const now = Date.now();
      if (now - lastMemoryWarning > MEMORY_WARNING_COOLDOWN) {
        console.warn('🚨 Critical memory usage detected:', {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          percentage: (memoryUsage * 100).toFixed(1) + '%'
        });
        
        // Trigger garbage collection if available
        if (window.gc) {
          window.gc();
          console.log('🗑️ Garbage collection triggered');
        }
        
        // Trigger storage cleanup
        if (window.storageQuotaManager) {
          window.storageQuotaManager.performRoutineCleanup();
        }
        
        lastMemoryWarning = now;
      }
    }
  }, 60000); // Check every minute instead of 30 seconds
}

// Export enhanced error boundary and utilities
export { 
  ModuleErrorBoundary,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  ERROR_CONFIG
};
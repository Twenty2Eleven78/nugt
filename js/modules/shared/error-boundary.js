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
  MAX_ERROR_LOG_SIZE: 20, // Reduced from 50 to save memory
  ERROR_LOG_KEY: 'nugt_error_log',
  ERROR_STATS_KEY: 'nugt_error_stats',
  MAX_RETRY_ATTEMPTS: 2, // Reduced from 3
  RETRY_DELAY: 1000,
  NOTIFICATION_COOLDOWN: 10000 // Increased to 10 seconds to reduce spam
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

  // Simplified async operation wrapper (only used method)
  static async safeAsync(asyncFunction, options = {}) {
    const {
      fallback = null,
      context = 'async operation',
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

  // Clear error log and stats (simplified)
  static clearErrorLog() {
    try {
      localStorage.removeItem(ERROR_CONFIG.ERROR_LOG_KEY);
      localStorage.removeItem(ERROR_CONFIG.ERROR_STATS_KEY);
      this.errorStats.clear();
      this.notificationCooldowns.clear();
      this.retryAttempts.clear();
      console.log('Error log cleared');
      return true;
    } catch (error) {
      console.warn('Could not clear error log:', error);
      return false;
    }
  }

  // Cleanup memory periodically
  static performMemoryCleanup() {
    try {
      // Clear old cooldowns
      const now = Date.now();
      for (const [key, timestamp] of this.notificationCooldowns.entries()) {
        if (now - timestamp > ERROR_CONFIG.NOTIFICATION_COOLDOWN * 2) {
          this.notificationCooldowns.delete(key);
        }
      }

      // Clear old retry attempts
      this.retryAttempts.clear();

      // Limit error stats size
      if (this.errorStats.size > 100) {
        const entries = Array.from(this.errorStats.entries());
        this.errorStats.clear();
        // Keep only the most recent 50 entries
        entries.slice(-50).forEach(([key, value]) => {
          this.errorStats.set(key, value);
        });
      }

      console.log('Memory cleanup completed');
    } catch (error) {
      console.warn('Memory cleanup failed:', error);
    }
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

    // Ensure the notification method exists
    if (notificationManager && typeof notificationManager[type] === 'function') {
      notificationManager[type](message);
    } else {
      console.error(`NotificationManager method '${type}' not found`);
      // Fallback to error method
      if (notificationManager && typeof notificationManager.error === 'function') {
        notificationManager.error(message);
      }
    }
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
      // Simplified sanitization to reduce memory usage
      if (args.length === 0) return '';
      if (args.length === 1) return String(args[0]).substring(0, 50);
      return `${args.length} args`;
    } catch {
      return 'args-error';
    }
  }

  static _getErrorContext() {
    // Simplified context to reduce memory usage
    return {
      url: window.location.pathname, // Only pathname, not full URL
      timestamp: Date.now()
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
    get: function () {
      const error = originalLastError;
      if (error) {
        console.debug('Chrome runtime error suppressed:', error.message);
      }
      return null; // Always return null to prevent the error from propagating
    },
    configurable: true
  });
}

// Lightweight memory monitoring (only when critically needed)
if (performance.memory) {
  let memoryCheckInterval;
  let lastMemoryWarning = 0;
  const MEMORY_WARNING_COOLDOWN = 300000; // 5 minutes between warnings
  const MEMORY_CHECK_INTERVAL = 120000; // Check every 2 minutes

  // Start memory monitoring only when needed
  const startMemoryMonitoring = () => {
    if (memoryCheckInterval) return; // Already running

    memoryCheckInterval = setInterval(() => {
      try {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;

        if (memoryUsage > 0.95) {
          const now = Date.now();
          if (now - lastMemoryWarning > MEMORY_WARNING_COOLDOWN) {
            console.warn('🚨 Critical memory usage detected:', {
              used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
              total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
              percentage: (memoryUsage * 100).toFixed(1) + '%'
            });

            // Trigger cleanup
            if (window.storageQuotaManager) {
              window.storageQuotaManager.performRoutineCleanup();
            }

            lastMemoryWarning = now;
          }
        } else if (memoryUsage < 0.8) {
          // Stop monitoring if memory usage is back to normal
          stopMemoryMonitoring();
        }
      } catch (error) {
        console.warn('Memory monitoring error:', error);
        stopMemoryMonitoring();
      }
    }, MEMORY_CHECK_INTERVAL);
  };

  const stopMemoryMonitoring = () => {
    if (memoryCheckInterval) {
      clearInterval(memoryCheckInterval);
      memoryCheckInterval = null;
    }
  };

  // Initial check - only start monitoring if memory is already high
  const initialMemoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
  if (initialMemoryUsage > 0.85) {
    startMemoryMonitoring();
  }

  // Make functions available globally for manual control
  window.startMemoryMonitoring = startMemoryMonitoring;
  window.stopMemoryMonitoring = stopMemoryMonitoring;

  // Automatic memory cleanup every 5 minutes
  setInterval(() => {
    ModuleErrorBoundary.performMemoryCleanup();
  }, 300000); // 5 minutes
}

// Export enhanced error boundary and utilities
export {
  ModuleErrorBoundary,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  ERROR_CONFIG
};
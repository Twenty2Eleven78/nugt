/**
 * Error Boundary Module - App Stability
 * @version 1.0
 */

import { notificationManager } from '../services/notifications.js';

// Module Error Boundary Class
class ModuleErrorBoundary {
  static wrap(moduleFunction, fallback = null, moduleName = 'Unknown') {
    return async (...args) => {
      try {
        return await moduleFunction(...args);
      } catch (error) {
        console.error(`Module error in ${moduleName}:`, error);
        
        // Log error details for debugging
        this.logError(error, moduleName, args);
        
        // Show user-friendly notification
        notificationManager.error(`${moduleName} encountered an error. Please try again.`);
        
        // Return fallback if provided
        return fallback ? fallback(...args) : null;
      }
    };
  }

  static logError(error, moduleName, args) {
    const errorInfo = {
      module: moduleName,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      args: args ? JSON.stringify(args).substring(0, 200) : 'none',
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store error in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('nugt_error_log') || '[]');
      errors.push(errorInfo);
      
      // Keep only last 10 errors to prevent storage bloat
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      localStorage.setItem('nugt_error_log', JSON.stringify(errors));
    } catch (storageError) {
      console.warn('Could not store error log:', storageError);
    }

    console.error('Error details:', errorInfo);
  }

  // Wrap DOM event handlers
  static wrapEventHandler(handler, elementName = 'element') {
    return (event) => {
      try {
        return handler(event);
      } catch (error) {
        console.error(`Event handler error on ${elementName}:`, error);
        this.logError(error, `EventHandler-${elementName}`, [event.type]);
        notificationManager.warning('An error occurred. Please try again.');
        return false;
      }
    };
  }

  // Wrap async operations
  static async safeAsync(asyncFunction, fallback = null, context = 'async operation') {
    try {
      return await asyncFunction();
    } catch (error) {
      console.error(`Safe async error in ${context}:`, error);
      this.logError(error, context, []);
      return fallback;
    }
  }

  // Get error log for debugging
  static getErrorLog() {
    try {
      return JSON.parse(localStorage.getItem('nugt_error_log') || '[]');
    } catch (error) {
      console.warn('Could not retrieve error log:', error);
      return [];
    }
  }

  // Clear error log
  static clearErrorLog() {
    try {
      localStorage.removeItem('nugt_error_log');
      console.log('Error log cleared');
    } catch (error) {
      console.warn('Could not clear error log:', error);
    }
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  const errorInfo = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  ModuleErrorBoundary.logError(event.error || new Error(event.message), 'GlobalError', []);
  console.error('Global error caught:', errorInfo);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const errorInfo = {
    reason: event.reason,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  ModuleErrorBoundary.logError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    'UnhandledPromiseRejection',
    []
  );
  
  console.error('Unhandled promise rejection:', errorInfo);
  
  // Prevent the default browser behavior
  event.preventDefault();
});

export { ModuleErrorBoundary };
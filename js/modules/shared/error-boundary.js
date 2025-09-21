/**
 * Simple Error Boundary
 * Basic error handling for application modules
 */

export class ModuleErrorBoundary {
  static wrap(fn, fallback = () => {}, context = 'Unknown') {
    return function wrappedFunction(...args) {
      try {
        const result = fn.apply(this, args);
        
        // Handle promises
        if (result && typeof result.catch === 'function') {
          return result.catch(error => {
            console.error(`Error in ${context}:`, error);
            return fallback.apply(this, args);
          });
        }
        
        return result;
      } catch (error) {
        console.error(`Error in ${context}:`, error);
        return fallback.apply(this, args);
      }
    };
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('runtime.lastError')) {
    return; // Ignore extension errors
  }
  console.error('Global error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('runtime.lastError')) {
    event.preventDefault();
    return; // Ignore extension errors
  }
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
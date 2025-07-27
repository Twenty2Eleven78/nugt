/**
 * NUFC GameTime App - Main Entry Point
 * @version 3.6
 * @author Mark Van-Kerro
 * @date Last Updated: 2025-01-26
 * 
 * Enhanced modular architecture with attendance tracking, advanced events, and modern UI
 */

import { initializeApp } from './modules/app.js';
import { adminModal } from './modules/ui/admin-modal.js';
import { authService } from './modules/services/auth.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();

  const adminModalButton = document.getElementById('admin-modal-button');
  if (adminModalButton) {
    authService.onAuthStateChange(user => {
      if (authService.isUserAuthenticated() && authService.isAdmin()) {
        adminModalButton.classList.remove('d-none');
        adminModalButton.addEventListener('click', () => {
          adminModal.show();
        });
      } else {
        adminModalButton.classList.add('d-none');
      }
    });
  }
});

// Handle page visibility changes for timer accuracy
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible, update displays and resume timer if needed
    if (window.timerControllerInstance) {
      window.timerControllerInstance.handlePageVisibilityChange();
    }
  }
});

// Handle page refresh/reload events
window.addEventListener('beforeunload', (event) => {
  // Save current timer state before page unloads - must be synchronous
  try {
    // Access the already loaded timer controller from the global scope
    if (window.timerControllerInstance) {
      window.timerControllerInstance.saveCurrentState();
    }
  } catch (error) {
    console.error('Error saving timer state before unload:', error);
  }
});

// Handle page focus events (additional safety net)
window.addEventListener('focus', () => {
  // Ensure timer is properly resumed when window regains focus
  if (window.timerControllerInstance) {
    window.timerControllerInstance.handlePageFocus();
  }
});

// Add pagehide event as additional safety net (more reliable than beforeunload on mobile)
window.addEventListener('pagehide', (event) => {
  if (window.timerControllerInstance) {
    window.timerControllerInstance.saveCurrentState();
  }
});

// Add unload event as final fallback
window.addEventListener('unload', (event) => {
  if (window.timerControllerInstance) {
    window.timerControllerInstance.saveCurrentState();
  }
});

// Service Worker registration is handled by PWA updater in app.js
// This ensures proper update management and avoids conflicts

// Preload authentication modules for faster startup
import('./modules/services/auth.js').then(module => {
  console.log('Auth service preloaded');
});

import('./modules/ui/auth-ui.js').then(module => {
  console.log('Auth UI preloaded');
  // Create auth modal early
  setTimeout(() => {
    if (module.authUI && typeof module.authUI.init === 'function') {
      module.authUI.init();
    }
  }, 1000);
});
/**
 * NUFC GameTime App - Main Entry Point
 * @version 3.5.1
 * @author Mark Van-Kerro
 * @date Last Updated: 2023-06-15
 * 
 * Modular architecture for better maintainability and performance
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
    // Page became visible, update displays
    import('./modules/game/timer.js').then(({ timerController }) => {
      timerController.updateDisplay();
    });
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
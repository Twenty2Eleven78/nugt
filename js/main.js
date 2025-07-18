/**
 * NUFC GameTime App - Main Entry Point
 * @version 3.5.1
 * @author Mark Van-Kerro
 * @date Last Updated: 2023-06-15
 * 
 * Modular architecture for better maintainability and performance
 */

import { initializeApp } from './modules/app.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
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
import('./modules/services/auth.js');
import('./modules/ui/auth-ui.js');
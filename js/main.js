/**
 * NUFC GameTime App - Main Entry Point
 * @version 3.3
 * @author Mark Van-Kerro
 * @date Last Updated: 2025-02-27
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
    import('./modules/timer.js').then(({ updateStopwatchDisplay }) => {
      updateStopwatchDisplay();
    });
  }
});

// Service Worker registration (if supported)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js', { scope: './' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
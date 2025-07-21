/**
 * Debug utilities for NUFC GameTime App
 * @version 1.0
 */

import { authUI } from './modules/ui/auth-ui.js';

// Function to fix modal overlay issues
function fixModalOverlays() {
  console.log('Fixing modal overlays...');
  
  // Remove all backdrops
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => backdrop.remove());
  
  // Clean up body
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  // Reset all modals
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = '';
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');
  });
  
  console.log('Modal overlays fixed');
}

// Expose debug functions to global scope
window.debugAuth = {
  // Re-export methods from authUI
  showAuthModal: () => authUI.showAuthModal(),
  createAuthModal: () => authUI._createAuthModal(),
  hideAuthModal: () => authUI.hideModal(),
  // Add overlay fix utility
  fixModalOverlays
};
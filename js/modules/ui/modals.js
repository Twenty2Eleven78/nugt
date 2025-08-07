/**
 * Modal Management
 * @version 4.0
 */

import { CustomModal } from '../shared/custom-modal.js';

// Modal utilities
export function showModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = CustomModal.getOrCreateInstance(modalElement);
    modal.show();
    return modal;
  } else {
    console.warn(`Modal with ID '${modalId}' not found`);
  }
  return null;
}

export function hideModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    try {
      let modal = CustomModal.getInstance(modalElement);
      if (!modal) {
        // If no instance exists, create one and then hide it
        modal = CustomModal.getOrCreateInstance(modalElement);
      }
      modal.hide();
    } catch (error) {
      // Fallback if modal system fails
      console.warn('Modal hide failed, using fallback:', error);
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      
      // Remove backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      // Clean up body
      document.body.classList.remove('modal-open');
    }
    
    // Enhanced cleanup to prevent overlay issues
    setTimeout(() => {
      // Remove focus from any elements inside the modal before hiding
      const focusedElement = modalElement.querySelector(':focus');
      if (focusedElement) {
        focusedElement.blur();
      }
      
      // Remove all modal backdrops (in case multiple exist)
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      // Ensure body classes are cleaned up
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Reset modal element state
      modalElement.style.display = '';
      modalElement.classList.remove('show');
      modalElement.setAttribute('aria-hidden', 'true');
      modalElement.removeAttribute('aria-modal');
      modalElement.removeAttribute('role');
    }, 300);
  } else {
    console.warn(`Modal with ID '${modalId}' not found`);
  }
}

export function getModalInstance(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    return CustomModal.getInstance(modalElement);
  }
  return null;
}

// Modal event handlers
export function bindModalEvents() {
  // Release notes modal is now handled by releaseNotesManager
  
  // Add cleanup event listeners to all modals
  const allModals = document.querySelectorAll('.modal');
  allModals.forEach(modal => {
    // Clean up when modal is hidden
    modal.addEventListener('modal.hidden', () => {
      cleanupModalOverlays();
    });

    // Handle focus management before hiding
    modal.addEventListener('modal.hide', () => {
      // Remove focus from any elements inside the modal before hiding
      const focusedElement = modal.querySelector(':focus');
      if (focusedElement) {
        focusedElement.blur();
      }
    });

    // Prevent multiple backdrop issues
    modal.addEventListener('modal.show', () => {
      // Remove any existing backdrops before showing new modal
      const existingBackdrops = document.querySelectorAll('.modal-backdrop');
      if (existingBackdrops.length > 0) {
        existingBackdrops.forEach(backdrop => backdrop.remove());
      }
    });
  });
}

// Enhanced cleanup function for modal overlays
export function cleanupModalOverlays() {
  // Remove all modal backdrops
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => backdrop.remove());
  
  // Check if any modals are still open
  const openModals = document.querySelectorAll('.modal.show');
  
  // Only clean up body styles if no modals are open
  if (openModals.length === 0) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

// Force close all modals (emergency cleanup)
export function closeAllModals() {
  const allModals = document.querySelectorAll('.modal');
  allModals.forEach(modalElement => {
    const modal = CustomModal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  });
  
  // Force cleanup after a delay
  setTimeout(() => {
    cleanupModalOverlays();
  }, 350);
}




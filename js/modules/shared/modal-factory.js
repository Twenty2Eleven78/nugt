/**
 * Modal Factory
 * Reusable modal creation utility and management system
 */

import { CustomModal } from './custom-modal.js';

/**
 * Create a standardized modal HTML structure
 * @param {string} id - Modal ID
 * @param {string} title - Modal title
 * @param {string} bodyContent - Modal body HTML content
 * @param {Object} options - Configuration options
 * @returns {string} Modal HTML string
 */
export function createModal(id, title, bodyContent, options = {}) {
  const {
    size = '', // modal-lg, modal-xl, modal-sm, etc.
    backdrop = 'static',
    keyboard = true,
    headerClass = '',
    bodyClass = '',
    footerContent = '',
    closeButton = true,
    fade = true
  } = options;

  const modalClass = `modal${fade ? ' fade' : ''}`;
  const dialogClass = `modal-dialog${size ? ` ${size}` : ''}`;
  const backdropAttr = backdrop ? ` data-backdrop="${backdrop}"` : '';
  const keyboardAttr = keyboard ? '' : ' data-keyboard="false"';
  
  const closeButtonHtml = closeButton ? 
    '<button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-times" style="font-size: 14px;"></i></button>' : '';
  
  const footerHtml = footerContent ? 
    `<div class="modal-footer">${footerContent}</div>` : '';

  return `
    <div class="${modalClass}" id="${id}" tabindex="-1" aria-labelledby="${id}Label" aria-hidden="true"${backdropAttr}${keyboardAttr}>
      <div class="${dialogClass}">
        <div class="modal-content">
          <div class="modal-header${headerClass ? ` ${headerClass}` : ''}">
            <h5 class="modal-title" id="${id}Label">${title}</h5>
            ${closeButtonHtml}
          </div>
          <div class="modal-body${bodyClass ? ` ${bodyClass}` : ''}">${bodyContent}</div>
          ${footerHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create and append modal to DOM
 * @param {string} id - Modal ID
 * @param {string} title - Modal title
 * @param {string} bodyContent - Modal body HTML content
 * @param {Object} options - Configuration options
 * @returns {HTMLElement} The created modal element
 */
export function createAndAppendModal(id, title, bodyContent, options = {}) {
  // Remove existing modal if it exists
  const existingModal = document.getElementById(id);
  if (existingModal) {
    existingModal.remove();
  }

  const modalHTML = createModal(id, title, bodyContent, options);
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  return document.getElementById(id);
}

/**
 * Common modal configurations
 */
export const MODAL_CONFIGS = {
  SMALL: { size: 'modal-sm' },
  LARGE: { size: 'modal-lg' },
  EXTRA_LARGE: { size: 'modal-xl' },
  FULLSCREEN: { size: 'modal-fullscreen' },
  SCROLLABLE: { size: 'modal-dialog-scrollable' },
  CENTERED: { size: 'modal-dialog-centered' },
  NO_BACKDROP: { backdrop: false },
  NO_KEYBOARD: { keyboard: false },
  NO_FADE: { fade: false }
};

/**
 * Modal Management Utilities
 */

// Show modal by ID
export function showModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = CustomModal.getOrCreateInstance(modalElement);
    modal.show();
    return modal;
  }
  console.warn(`Modal with ID '${modalId}' not found`);
  return null;
}

// Hide modal by ID
export function hideModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (!modalElement) {
    console.warn(`Modal with ID '${modalId}' not found`);
    return;
  }

  try {
    let modal = CustomModal.getInstance(modalElement);
    if (!modal) {
      modal = CustomModal.getOrCreateInstance(modalElement);
    }
    modal.hide();
  } catch (error) {
    console.warn('Modal hide failed, using fallback:', error);
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
  }

  setTimeout(() => {
    const focusedElement = modalElement.querySelector(':focus');
    if (focusedElement) focusedElement.blur();
    
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    modalElement.style.display = '';
    modalElement.classList.remove('show');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    modalElement.removeAttribute('role');
  }, 300);
}

// Get modal instance
export function getModalInstance(modalId) {
  const modalElement = document.getElementById(modalId);
  return modalElement ? CustomModal.getInstance(modalElement) : null;
}

// Cleanup modal overlays
export function cleanupModalOverlays() {
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
  
  const openModals = document.querySelectorAll('.modal.show');
  if (openModals.length === 0) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

// Close all modals
export function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modalElement => {
    const modal = CustomModal.getInstance(modalElement);
    if (modal) modal.hide();
  });
  
  setTimeout(() => cleanupModalOverlays(), 350);
}

// Bind modal events
export function bindModalEvents() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('modal.hidden', () => cleanupModalOverlays());
    modal.addEventListener('modal.hide', () => {
      const focusedElement = modal.querySelector(':focus');
      if (focusedElement) focusedElement.blur();
    });
    modal.addEventListener('modal.show', () => {
      document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
    });
  });
}
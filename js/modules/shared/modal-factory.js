/**
 * Modal Factory
 * Reusable modal creation utility to reduce code duplication
 */

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
    '<button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>' : '';
  
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
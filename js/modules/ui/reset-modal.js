/**
 * Reset Confirmation Modal
 * Handles app reset confirmation
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';

class ResetModal {
  constructor() {
    this.modal = null;
    this.onConfirmCallback = null;
  }

  /**
   * Initialize reset modal
   */
  init() {
    this.createModal();
    this.setupEventListeners();
    // Reset modal initialized
  }

  /**
   * Create reset modal
   */
  createModal() {
    const bodyContent = `
      <div class="text-center">
        <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
        <p class="text-muted mb-0">
          This will clear all match data, scores, events, and return the app to its initial state.
          <strong>This action cannot be undone.</strong>
        </p>
      </div>
    `;

    const footerContent = `
      <button type="button" class="btn btn-secondary" data-dismiss="modal">
        <i class="fas fa-times me-2"></i>Cancel
      </button>
      <button type="button" class="btn btn-danger" id="confirmResetBtn">
        <i class="fas fa-arrows-rotate me-2"></i>Reset App
      </button>
    `;

    // Create modal using factory
    createAndAppendModal(
      'resetConfirmModal',
      '<i class="fas fa-exclamation-triangle me-2"></i>Confirm Reset',
      bodyContent,
      {
        ...MODAL_CONFIGS.CENTERED,
        backdrop: 'static',
        headerClass: 'bg-danger text-white',
        footerContent: footerContent
      }
    );
    
    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('resetConfirmModal');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Confirm reset button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'confirmResetBtn') {
        if (this.onConfirmCallback) {
          this.onConfirmCallback();
        }
        this.hide();
      }
    });
  }

  /**
   * Show reset modal
   * @param {Function} onConfirm - Callback function when reset is confirmed
   */
  show(onConfirm) {
    this.onConfirmCallback = onConfirm;
    if (this.modal) {
      this.modal.show();
    }
  }

  /**
   * Hide reset modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }
}

// Create and export instance
const resetModal = new ResetModal();
export default resetModal;
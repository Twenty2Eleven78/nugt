/**
 * Reset Confirmation Modal
 * Handles app reset confirmation
 */

import { CustomModal } from '../shared/custom-modal.js';

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
    console.log('Reset modal initialized');
  }

  /**
   * Create reset modal
   */
  createModal() {
    const modalHTML = `
      <div class="modal fade" id="resetConfirmModal" data-backdrop="static" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <i class="fas fa-exclamation-triangle me-2"></i>Confirm Reset
              </h5>
              <button type="button" class="btn-close btn-close-white" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="text-center">
                <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                <h6 class="mb-3">Are you sure you want to reset the app?</h6>
                <p class="text-muted mb-0">
                  This will clear all match data, scores, events, and return the app to its initial state.
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">
                <i class="fas fa-times me-2"></i>Cancel
              </button>
              <button type="button" class="btn btn-danger" id="confirmResetBtn">
                <i class="fas fa-arrows-rotate me-2"></i>Reset App
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('resetConfirmModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
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
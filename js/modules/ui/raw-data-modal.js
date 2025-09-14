/**
 * Raw Data Modal UI Component
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';

class RawDataModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the raw data modal
   */
  init() {
    if (this.isInitialized) return;
    
    this._createModal();
    this._bindEventListeners();
    this.isInitialized = true;
  }

  /**
   * Show the raw data modal
   * @param {Object} data The data to display
   */
  show(data) {
    if (!this.modal) return;

    const preElement = document.getElementById('rawDataContent');
    if (preElement) {
      preElement.textContent = JSON.stringify(data, null, 2);
    }

    // Show modal using custom modal system
    this.modal.show();
  }

  /**
   * Hide the raw data modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Create the raw data modal
   * @private
   */
  _createModal() {
    const bodyContent = `<pre id="rawDataContent" class="raw-data-content"></pre>`;
    const footerContent = `<button type="button" class="btn btn-secondary" id="closeRawDataBtn">Close</button>`;

    createAndAppendModal(
      'rawDataModal',
      '<i class="fas fa-code me-2"></i>Raw Match Data',
      bodyContent,
      {
        ...MODAL_CONFIGS.LARGE,
        footerContent: footerContent
      }
    );

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('rawDataModal');
  }

  /**
   * Bind event listeners for the modal
   * @private
   */
  _bindEventListeners() {
    // Handle close button click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'closeRawDataBtn') {
        this.hide();
      }
    });
  }
}

// Create and export singleton instance
export const rawDataModal = new RawDataModal();

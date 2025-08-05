/**
 * Raw Data Modal UI Component
 */

import { CustomModal } from '../shared/custom-modal.js';

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
    // Remove existing modal if it exists
    const existingModal = document.getElementById('rawDataModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
      <div class="modal fade" id="rawDataModal" tabindex="-1" aria-labelledby="rawDataModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="rawDataModalLabel">Raw Match Data</h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <pre id="rawDataContent"></pre>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="closeRawDataBtn">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

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

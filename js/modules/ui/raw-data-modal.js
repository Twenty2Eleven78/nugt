/**
 * Raw Data Modal UI Component
 */

class RawDataModal {
  constructor() {
    this.modalInitialized = false;
  }

  /**
   * Initialize the raw data modal
   */
  init() {
    if (!this.modalInitialized) {
      this._createModal();
      this.modalInitialized = true;
    }
  }

  /**
   * Show the raw data modal
   * @param {Object} data The data to display
   */
  show(data) {
    const modal = document.getElementById('rawDataModal');
    if (!modal) return;

    const preElement = document.getElementById('rawDataContent');
    preElement.textContent = JSON.stringify(data, null, 2);

    // Show modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
  }

  /**
   * Create the raw data modal
   * @private
   */
  _createModal() {
    // Check if modal already exists
    if (document.getElementById('rawDataModal')) {
      return;
    }

    const modalHtml = `
      <div class="modal fade" id="rawDataModal" tabindex="-1" aria-labelledby="rawDataModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="rawDataModalLabel">Raw Match Data</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <pre id="rawDataContent"></pre>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create modal container and append to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
  }
}

// Create and export singleton instance
export const rawDataModal = new RawDataModal();

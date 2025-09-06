/**
 * Match Save Modal UI Component
 */

import { CustomModal } from '../shared/custom-modal.js';

class MatchSaveModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
    this.onSave = null;
  }

  /**
   * Initialize the match save modal
   */
  init() {
    if (this.isInitialized) return;
    
    this._createModal();
    this._bindEventListeners();
    this.isInitialized = true;
  }

  /**
   * Show the match save modal
   * @param {Object} matchInfo Default values for the form
   * @param {Function} onSave Callback function when save is confirmed
   */
  show(matchInfo, onSave) {
    this.onSave = onSave;
    
    if (!this.modal) return;

    // Set default values
    const titleInput = document.getElementById('matchTitleInput');
    const notesInput = document.getElementById('matchNotesInput');

    if (titleInput) {
      titleInput.value = matchInfo.defaultTitle || '';
    }
    if (notesInput) {
      notesInput.value = matchInfo.defaultNotes || '';
    }

    // Show modal using custom modal system
    this.modal.show();
  }

  /**
   * Create the match save modal
   * @private
   */
  _createModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('matchSaveModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
      <div class="modal fade" id="matchSaveModal" tabindex="-1" aria-labelledby="matchSaveModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="matchSaveModalLabel">Save Match to Cloud</h5>
                <button type="button" class="btn btn-danger btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
            </div>
            <div class="modal-body">
              <form id="matchSaveForm">
                <div class="mb-3">
                  <label for="matchTitleInput" class="form-label">Match Title</label>
                  <input type="text" class="form-control" id="matchTitleInput" required>
                </div>
                <div class="mb-3">
                  <label for="matchNotesInput" class="form-label">Notes (optional)</label>
                  <textarea class="form-control" id="matchNotesInput" rows="3"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelMatchSaveBtn">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirmMatchSaveBtn">Save Match</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('matchSaveModal');
  }

  /**
   * Hide the match save modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Bind event listeners for the modal
   * @private
   */
  _bindEventListeners() {
    // Handle save button click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'confirmMatchSaveBtn') {
        const titleInput = document.getElementById('matchTitleInput');
        const notesInput = document.getElementById('matchNotesInput');

        if (!titleInput?.value) {
          return;
        }

        if (this.onSave) {
          this.onSave({
            title: titleInput.value,
            notes: notesInput?.value || ''
          });
        }

        // Hide modal
        this.hide();
      }
      
      // Handle cancel button click
      if (e.target.id === 'cancelMatchSaveBtn') {
        this.hide();
      }
    });
  }
}

// Create and export singleton instance
export const matchSaveModal = new MatchSaveModal();

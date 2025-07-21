/**
 * Match Save Modal UI Component
 */

import { domCache } from '../shared/dom.js';
import { hideModal } from './modals.js';

class MatchSaveModal {
  constructor() {
    this.modalInitialized = false;
    this.onSave = null;
  }

  /**
   * Initialize the match save modal
   */
  init() {
    if (!this.modalInitialized) {
      this._createModal();
      this._bindEventListeners();
      this.modalInitialized = true;
    }
  }

  /**
   * Show the match save modal
   * @param {Object} matchInfo Default values for the form
   * @param {Function} onSave Callback function when save is confirmed
   */
  show(matchInfo, onSave) {
    this.onSave = onSave;
    
    const modal = document.getElementById('matchSaveModal');
    if (!modal) return;

    // Set default values
    const titleInput = document.getElementById('matchTitleInput');
    const notesInput = document.getElementById('matchNotesInput');

    if (titleInput) {
      titleInput.value = matchInfo.defaultTitle || '';
    }
    if (notesInput) {
      notesInput.value = matchInfo.defaultNotes || '';
    }

    // Show modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
  }

  /**
   * Create the match save modal
   * @private
   */
  _createModal() {
    // Check if modal already exists
    if (document.getElementById('matchSaveModal')) {
      return;
    }

    const modalHtml = `
      <div class="modal fade" id="matchSaveModal" tabindex="-1" aria-labelledby="matchSaveModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="matchSaveModalLabel">Save Match to Cloud</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirmMatchSaveBtn">Save Match</button>
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

  /**
   * Bind event listeners for the modal
   * @private
   */
  _bindEventListeners() {
    document.getElementById('confirmMatchSaveBtn')?.addEventListener('click', () => {
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
      hideModal('matchSaveModal');
    });
  }
}

// Create and export singleton instance
export const matchSaveModal = new MatchSaveModal();

/**
 * Roster Modal
 * Handles roster management modal UI
 */

import { CustomModal } from '../shared/custom-modal.js';
import { rosterManager } from '../match/roster.js';

class RosterModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  /**
   * Initialize roster modal
   */
  init() {
    if (this.isInitialized) return;
    
    this.createModal();
    this._bindEvents();
    this.isInitialized = true;
    console.log('Roster modal initialized');
  }

  /**
   * Create roster modal
   */
  createModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('rosterModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div class="modal fade" id="rosterModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title modal-title-enhanced">
                <i class="fas fa-users me-2"></i>Team Roster Management
              </h4>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <h5>Add New Player</h5>
              <div class="mb-3">
                <div class="input-group">
                  <input type="text" id="newPlayerName" class="form-control" placeholder="Name">&nbsp;
                  <input type="number" id="newPlayerShirtNumber" class="form-control" placeholder="Shirt #" min="0" max="99">&nbsp;
                  <button class="btn btn-danger" id="addPlayerBtn" type="button">
                    <i class="fas fa-plus me-2"></i>Add Player
                  </button>
                </div>
              </div>

              <hr>

              <h5>Bulk Add Players</h5>
              <div class="mb-3">
                <label for="bulkPlayerNames" class="form-label">Paste names (comma or new-line separated):</label>
                <textarea id="bulkPlayerNames" class="form-control mb-2" rows="3" placeholder="e.g. Player One, Player Two&#x0a;Player Three"></textarea>
                <button id="addPlayersBulkBtn" class="btn btn-danger w-100" type="button">
                  <i class="fas fa-list-ul me-2"></i>Add Players from List
                </button>
              </div>

              <hr>

              <h5>Current Roster</h5>
              <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-striped table-sm table-hover roster-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Shirt #</th>
                      <th class="text-end roster-actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="rosterList"></tbody>
                </table>
              </div>

              <hr class="my-3">
              <button id="clearRosterBtn" class="btn btn-danger w-100">
                <i class="fas fa-trash-alt me-2"></i>Clear All Players
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('rosterModal');
  }

  /**
   * Show roster modal
   */
  show() {
    if (this.modal) {
      // Update roster list when showing modal
      if (rosterManager && rosterManager.updateRosterList) {
        rosterManager.updateRosterList();
      }
      this.modal.show();
    }
  }

  /**
   * Hide roster modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    // Listen for modal show event to update roster list
    setTimeout(() => {
      const rosterModal = document.getElementById('rosterModal');
      if (rosterModal) {
        rosterModal.addEventListener('modal.show', () => {
          if (rosterManager && rosterManager.updateRosterList) {
            rosterManager.updateRosterList();
          }
          // Re-bind roster events after modal is shown
          if (rosterManager && rosterManager.rebindEvents) {
            rosterManager.rebindEvents();
          }
        });
      }
    }, 100); // Small delay to ensure modal is created
  }


}

// Create and export instance
const rosterModal = new RosterModal();
export default rosterModal;
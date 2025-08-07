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
   * Create roster modal and edit player modal
   */
  createModal() {
    // Remove existing modals if they exist
    const existingRosterModal = document.getElementById('rosterModal');
    if (existingRosterModal) {
      existingRosterModal.remove();
    }
    const existingEditModal = document.getElementById('editPlayerModal');
    if (existingEditModal) {
      existingEditModal.remove();
    }

    const rosterModalHTML = `
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

    const editPlayerModalHTML = `
      <div class="modal fade" id="editPlayerModal" tabindex="-1" aria-labelledby="editPlayerModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editPlayerModalLabel"><i class="fas fa-user-edit me-2"></i>Edit Player</h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="editPlayerForm">
                <input type="hidden" id="editPlayerOldName" name="editPlayerOldName">
                <div class="mb-3">
                  <label for="editPlayerName" class="form-label">Player Name</label>
                  <input type="text" class="form-control" id="editPlayerName" name="editPlayerName" required>
                </div>
                <div class="mb-3">
                  <label for="editPlayerShirtNumber" class="form-label">Shirt Number (0-99, blank for none)</label>
                  <input type="number" class="form-control" id="editPlayerShirtNumber" name="editPlayerShirtNumber" min="0" max="99">
                </div>
                <div class="d-flex justify-content-end gap-2 mt-3">
                  <button type="submit" class="btn btn-danger">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add both modals to DOM
    document.body.insertAdjacentHTML('beforeend', rosterModalHTML);
    document.body.insertAdjacentHTML('beforeend', editPlayerModalHTML);

    // Initialize custom modals
    this.modal = CustomModal.getOrCreateInstance('rosterModal');
    this.editModal = CustomModal.getOrCreateInstance('editPlayerModal');
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
   * Show edit player modal
   */
  showEditPlayerModal(playerName) {
    if (!this.editModal) return;

    const playerToEdit = rosterManager.getPlayerByName(playerName);
    if (!playerToEdit) return;

    // Populate form fields
    const oldNameInput = document.getElementById('editPlayerOldName');
    const nameInput = document.getElementById('editPlayerName');
    const shirtNumberInput = document.getElementById('editPlayerShirtNumber');

    if (oldNameInput) oldNameInput.value = playerToEdit.name;
    if (nameInput) nameInput.value = playerToEdit.name;
    if (shirtNumberInput) {
      shirtNumberInput.value = playerToEdit.shirtNumber !== null ? playerToEdit.shirtNumber : '';
    }

    this.editModal.show();
  }

  /**
   * Hide edit player modal
   */
  hideEditPlayerModal() {
    if (this.editModal) {
      this.editModal.hide();
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

    // Handle edit player form submission
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'editPlayerForm') {
        e.preventDefault();

        const oldName = document.getElementById('editPlayerOldName')?.value;
        const newName = document.getElementById('editPlayerName')?.value.trim();
        const newShirtNumber = document.getElementById('editPlayerShirtNumber')?.value;

        if (rosterManager && rosterManager.editPlayer) {
          if (rosterManager.editPlayer(oldName, newName, newShirtNumber)) {
            this.hideEditPlayerModal();
          }
        }
      }
    });

    // Handle edit player button clicks via event delegation
    document.addEventListener('click', (e) => {
      if (e.target.closest('.edit-player')) {
        const button = e.target.closest('.edit-player');
        const playerName = button.dataset.playerName;
        if (playerName) {
          this.showEditPlayerModal(playerName);
        }
      }
    });
  }


}

// Create and export instance
const rosterModal = new RosterModal();

// Export methods for external access
export const showEditPlayerModal = (playerName) => {
  rosterModal.showEditPlayerModal(playerName);
};

export default rosterModal;
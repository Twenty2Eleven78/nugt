/**
 * Roster Modal
 * Handles roster management modal UI
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';
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
    // Roster modal initialized
  }

  /**
   * Create roster modal and edit player modal
   */
  createModal() {
    // Create main roster modal using factory
    const rosterBodyContent = `
      <!-- Add New Player Section -->
      <div class="roster-section mb-4">
        <div class="section-header">
          <h6><i class="fas fa-user-plus me-2"></i>Add New Player</h6>
          <small class="text-muted">Add individual players to your roster</small>
        </div>
        <div class="add-player-form">
          <div class="row g-2">
            <div class="col-md-5">
              <input type="text" id="newPlayerName" class="form-control" placeholder="Player Name" required>
            </div>
            <div class="col-md-3">
              <input type="number" id="newPlayerShirtNumber" class="form-control" placeholder="Shirt #" min="0" max="99">
            </div>
            <div class="col-md-4">
              <button class="btn btn-primary w-100" id="addPlayerBtn" type="button">
                <i class="fas fa-plus me-1"></i>Add Player
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Add Section -->
      <div class="roster-section mb-4">
        <div class="section-header">
          <h6><i class="fas fa-list-ul me-2"></i>Bulk Add Players</h6>
          <small class="text-muted">Add multiple players at once</small>
        </div>
        <div class="bulk-add-form">
          <textarea id="bulkPlayerNames" class="form-control mb-2" rows="3" placeholder="Enter player names separated by commas or new lines:\ne.g. John Smith, Jane Doe\nMike Johnson"></textarea>
          <button id="addPlayersBulkBtn" class="btn btn-primary w-100" type="button">
            <i class="fas fa-users me-1"></i>Add All Players
          </button>
        </div>
      </div>

      <!-- Current Roster Section -->
      <div class="roster-section">
        <div class="section-header">
          <h6><i class="fas fa-users me-2"></i>Current Roster</h6>
          <small class="text-muted">Manage your team players</small>
        </div>
      <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
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

        <div class="roster-actions mt-3">
          <button id="clearRosterBtn" class="btn btn-outline-danger w-100">
            <i class="fas fa-trash-alt me-1"></i>Clear All Players
          </button>
        </div>
      </div>
    `;

    createAndAppendModal(
      'rosterModal',
      '<i class="fas fa-users me-2"></i>Team Roster Management',
      rosterBodyContent
    );

    // Create edit player modal using factory
    const editBodyContent = `
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
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    createAndAppendModal(
      'editPlayerModal',
      '<i class="fas fa-user-edit me-2"></i>Edit Player',
      editBodyContent,
      MODAL_CONFIGS.CENTERED
    );

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
/**
 * Goal Modal
 * Handles goal recording modal
 */

import { CustomModal } from '../shared/custom-modal.js';

class GoalModal {
  constructor() {
    this.modal = null;
  }

  /**
   * Initialize goal modal
   */
  init() {
    this.createModal();
    console.log('Goal modal initialized');
  }

  /**
   * Create goal modal
   */
  createModal() {
    const modalHTML = `
      <div class="modal fade" id="goalModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Goal Details:</h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-12">
                  <div class="input-group mb-3">
                    <form id="goalForm" class="w-100">
                      <div class="mb-3">
                        <label for="goalScorer" class="form-label">Goal Scorer:</label>
                        <select id="goalScorer" class="form-select" required>
                          <option value="" selected>Select goal scorer</option>
                          <option value="Own Goal">Own Goal</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label for="goalAssist" class="form-label">Goal Assist:</label>
                        <select id="goalAssist" class="form-select" required>
                          <option value="" selected>Select goal assist</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </div>
                      <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-success btn-custom" id="goalButton">Goal</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('goalModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('goalModal');

    // Add form submission handler
    this.setupFormHandler();
  }

  /**
   * Show goal modal
   */
  show() {
    if (this.modal) {
      // Update roster data before showing
      this.updateRosterData();
      this.modal.show();
    }
  }

  /**
   * Update roster data in goal modal
   */
  updateRosterData() {
    // Get roster from RosterManager if available
    if (window.RosterManager && window.RosterManager.getRoster) {
      const roster = window.RosterManager.getRoster();
      this.updateGoalScorerOptions(roster);
      this.updateGoalAssistOptions(roster);
    }
  }

  /**
   * Setup form submission handler
   */
  setupFormHandler() {
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
      goalForm.addEventListener('submit', (event) => {
        // Call the goal manager's addGoal method
        if (window.goalManager && window.goalManager.addGoal) {
          window.goalManager.addGoal(event);
        }
      });
    }
  }

  /**
   * Hide goal modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Update goal scorer options
   * @param {Array} players - Array of player names
   */
  updateGoalScorerOptions(players) {
    const goalScorerSelect = document.getElementById('goalScorer');
    if (goalScorerSelect && players) {
      // Clear existing options except default and "Own Goal"
      goalScorerSelect.innerHTML = `
        <option value="" selected>Select goal scorer</option>
        <option value="Own Goal">Own Goal</option>
      `;

      // Add player options
      players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.name;
        option.textContent = player.shirtNumber ?
          `${player.name} (#${player.shirtNumber})` :
          player.name;
        goalScorerSelect.appendChild(option);
      });
    }
  }

  /**
   * Update goal assist options
   * @param {Array} players - Array of player names
   */
  updateGoalAssistOptions(players) {
    const goalAssistSelect = document.getElementById('goalAssist');
    if (goalAssistSelect && players) {
      // Clear existing options except default and "N/A"
      goalAssistSelect.innerHTML = `
        <option value="" selected>Select goal assist</option>
        <option value="N/A">N/A</option>
      `;

      // Add player options
      players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.name;
        option.textContent = player.shirtNumber ?
          `${player.name} (#${player.shirtNumber})` :
          player.name;
        goalAssistSelect.appendChild(option);
      });
    }
  }
}

// Create and export instance
const goalModal = new GoalModal();
export default goalModal;
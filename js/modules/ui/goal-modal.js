/**
 * Goal Modal
 * Handles goal recording modal
 */

import { CustomModal } from '../shared/custom-modal.js';
import { rosterManager } from '../match/roster.js';

class GoalModal {
  constructor() {
    this.modal = null;
    this.formHandlerSetup = false;
  }

  /**
   * Initialize goal modal
   */
  init() {
    this.createModal();
  }

  /**
   * Create goal modal
   */
  createModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('goalModal');
    if (existingModal) {
      existingModal.remove();
    }

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
                        <label for="goalScorer" class="form-label">Goal Scorer: <span class="text-danger">*</span></label>
                        <select id="goalScorer" class="form-select" required>
                          <option value="">Select goal scorer</option>
                          <option value="Own Goal">Own Goal</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label for="goalAssist" class="form-label">Goal Assist:</label>
                        <select id="goalAssist" class="form-select">
                          <option value="">Select goal assist</option>
                          <option value="N/A" selected>N/A</option>
                        </select>
                      </div>
                      <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary w-100" id="goalSubmitButton">
                          <i class="fa-solid fa-futbol me-2"></i>Record Goal
                        </button>
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
      this.modal.show();
      // Update roster data after showing to ensure DOM is ready
      setTimeout(() => {
        this.updateRosterData();
      }, 100);
    }
  }

  /**
   * Update roster data in goal modal
   */
  updateRosterData() {
    // Get roster from rosterManager if available
    if (rosterManager && rosterManager.getRoster) {
      const roster = rosterManager.getRoster();
      this.updateGoalScorerOptions(roster);
      this.updateGoalAssistOptions(roster);
    }
  }

  /**
   * Setup form submission handler
   */
  setupFormHandler() {
    const goalForm = document.getElementById('goalForm');
    if (!goalForm || this.formHandlerSetup) return;

    // Remove any existing event listeners by cloning the form
    const newForm = goalForm.cloneNode(true);
    goalForm.parentNode.replaceChild(newForm, goalForm);

    // Add single event listener to the new form
    const finalForm = document.getElementById('goalForm');
    if (finalForm) {
      finalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          // Import the goal manager dynamically to ensure it's available
          const { goalManager } = await import('../match/goals.js');
          
          if (goalManager && goalManager.addGoal) {
            goalManager.addGoal(event);
          } else {
            console.error('Goal manager not available');
            throw new Error('Goal manager not available');
          }
        } catch (error) {
          console.error('Error handling goal submission:', error);
          // Import notification manager to show error
          const { notificationManager } = await import('../services/notifications.js');
          notificationManager.error('Failed to record goal. Please try again.');
        }
      });
    }

    this.formHandlerSetup = true;
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
        <option value="">Select goal scorer</option>
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
        <option value="">Select goal assist</option>
        <option value="N/A" selected>N/A</option>
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

      // Default to "N/A" for assist (most common case)
      goalAssistSelect.value = "N/A";
    }
  }
}

// Create and export instance
const goalModal = new GoalModal();
export default goalModal;
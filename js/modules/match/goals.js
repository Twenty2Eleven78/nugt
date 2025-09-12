/**
 * Goal Management
 * @version 4.0
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { getCurrentSeconds, formatMatchTime } from '../shared/utils.js';
import { notificationManager } from '../services/notifications.js';
import { showModal, hideModal } from '../ui/modals.js';
import { updateMatchLog, combinedEventsManager } from './combined-events.js';
import { attendanceManager } from '../services/attendance.js';

// Goal management class
class GoalManager {
  // Show goal modal and capture timestamp
  showGoalModal() {
    stateManager.setPendingGoalTimestamp(getCurrentSeconds());
    
    // Try to use the goal modal instance first
    if (window.goalModal && typeof window.goalModal.show === 'function') {
      window.goalModal.show();
    } else {
      // Fallback to importing the goal modal dynamically
      import('../ui/goal-modal.js').then(({ default: goalModal }) => {
        if (goalModal && typeof goalModal.show === 'function') {
          goalModal.show();
          // Make it available globally for next time
          window.goalModal = goalModal;
        } else {
          // Final fallback to basic modal system
          showModal('goalModal');
        }
      }).catch(error => {
        console.error('Error loading goal modal:', error);
        showModal('goalModal');
      });
    }
  }

  // Helper method to create goal data
  _createGoalData(currentSeconds, team, teamName, scorerName, assistName = null) {
    const goalScorer = window.RosterManager?.getPlayerByName(scorerName);
    const goalAssister = assistName ? window.RosterManager?.getPlayerByName(assistName) : null;

    return {
      timestamp: formatMatchTime(currentSeconds),
      goalScorerName: scorerName,
      goalScorerShirtNumber: goalScorer?.shirtNumber || null,
      goalAssistName: assistName || teamName,
      goalAssistShirtNumber: goalAssister?.shirtNumber || null,
      rawTime: currentSeconds,
      team,
      teamName,
      disallowed: false
    };
  }

  // Helper method to process goal after adding
  _processGoalAddition(goalData, team, scorerName, isOpposition = false) {
    console.log(`Adding ${isOpposition ? 'opposition ' : ''}goal data:`, goalData);
    stateManager.addGoal(goalData);
    console.log('Goals after adding:', gameState.goals);

    this._updateScoreboard(team === 1 ? 'first' : 'second');
    updateMatchLog();

    // Show appropriate notification
    const notificationType = isOpposition ? 'error' : 'success';
    notificationManager[notificationType](`Goal scored by ${scorerName}!`);

    // Save and cleanup
    storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());
    combinedEventsManager.onEventsUpdated();
    this._resetGoalForm();
  }

  // Add team goal
  addGoal(event) {
    event.preventDefault();

    const goalScorerElement = document.getElementById('goalScorer');
    const goalAssistElement = document.getElementById('goalAssist');

    console.log('Goal form submission:', {
      goalScorerElement,
      goalScorerValue: goalScorerElement?.value,
      goalAssistElement,
      goalAssistValue: goalAssistElement?.value
    });

    const goalScorerName = goalScorerElement?.value;
    const goalAssistName = goalAssistElement?.value;
    const currentSeconds = gameState.pendingGoalTimestamp || getCurrentSeconds();
    const team1Name = domCache.get('Team1NameElement')?.textContent;

    if (!goalScorerName || goalScorerName.trim() === '') {
      console.log('Goal scorer validation failed:', goalScorerName);
      notificationManager.warning('Please select a goal scorer from the dropdown');
      return;
    }

    const goalData = this._createGoalData(currentSeconds, 1, team1Name, goalScorerName, goalAssistName);

    // Reset pending timestamp
    stateManager.setPendingGoalTimestamp(null);

    this._processGoalAddition(goalData, 1, goalScorerName, false);
    hideModal('goalModal');
  }

  // Add opposition goal
  addOppositionGoal() {
    const currentSeconds = getCurrentSeconds();
    const team2Name = domCache.get('Team2NameElement')?.textContent;

    const goalData = this._createGoalData(currentSeconds, 2, team2Name, team2Name);
    this._processGoalAddition(goalData, 2, team2Name, true);
  }



  // Update scoreboard
  _updateScoreboard(team) {
    const scoreElement = domCache.get(team === 'first' ? 'firstScoreElement' : 'secondScoreElement');
    if (!scoreElement) return;

    const newScore = parseInt(scoreElement.textContent) + 1;
    scoreElement.textContent = newScore;

    // Save score
    const storageKey = team === 'first' ? 'nugt_firstScore' : 'nugt_secondScore';
    storage.save(storageKey, newScore);
  }

  // Recalculate scores based on allowed goals
  _recalculateScores() {
    const team2Name = domCache.get('Team2NameElement')?.textContent;
    const { teamGoals, oppositionGoals } = this._getGoalCounts(team2Name);

    // Update UI
    const firstScoreElement = domCache.get('firstScoreElement');
    const secondScoreElement = domCache.get('secondScoreElement');

    if (firstScoreElement) firstScoreElement.textContent = teamGoals;
    if (secondScoreElement) secondScoreElement.textContent = oppositionGoals;

    // Save scores
    storage.save('nugt_firstScore', teamGoals);
    storage.save('nugt_secondScore', oppositionGoals);
    storageHelpers.saveMatchData(gameState);
  }

  // Reset goal form
  _resetGoalForm() {
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
      goalForm.reset();
    }
  }

  // Helper method to get team classification for goals
  _getGoalCounts(team2Name) {
    const allowedGoals = gameState.goals.filter(goal => !goal.disallowed);
    const teamGoals = allowedGoals.filter(goal => goal.goalScorerName !== team2Name);
    const oppositionGoals = allowedGoals.filter(goal => goal.goalScorerName === team2Name);

    return {
      teamGoals: teamGoals.length,
      oppositionGoals: oppositionGoals.length,
      allowedGoals
    };
  }

  // Get goal statistics
  getGoalStats() {
    const team2Name = domCache.get('Team2NameElement')?.textContent;
    const { teamGoals, oppositionGoals, allowedGoals } = this._getGoalCounts(team2Name);

    return {
      total: allowedGoals.length,
      team: teamGoals,
      opposition: oppositionGoals,
      disallowed: gameState.goals.filter(goal => goal.disallowed).length
    };
  }
}

// Create and export singleton instance
export const goalManager = new GoalManager();

// Standalone function for global access (HTML onclick handlers)
// Store pending goal disallow info
let pendingGoalDisallow = null;

export function toggleGoalDisallowed(index) {
  const goal = gameState.goals[index];
  if (!goal) return;

  if (goal.disallowed) {
    // Re-allow the goal
    stateManager.updateGoal(index, { disallowed: false, disallowedReason: null });
    updateGoalStatus(index);
  } else {
    // Show modal to get disallow reason
    pendingGoalDisallow = index;
    showGoalDisallowModal(goal);
  }
}

// Function to update goal status after changes
function updateGoalStatus(index) {
  // Recalculate and update scores using the manager instance
  goalManager._recalculateScores();
  updateMatchLog();

  // Save updated goals data
  storageHelpers.saveMatchData(gameState);

  // Update events display
  combinedEventsManager.onEventsUpdated();

  const goal_updated = gameState.goals[index];
  if (goal_updated.disallowed) {
    notificationManager.warning('Goal disallowed');
  } else {
    notificationManager.success('Goal allowed');
  }
}

// Function to show goal disallow modal
function showGoalDisallowModal(goal) {
  // Create modal if it doesn't exist
  if (!document.getElementById('goalDisallowModal')) {
    createGoalDisallowModal();
  }
  
  // Update modal content
  const modalBody = document.getElementById('goalDisallowModalBody');
  const reasonInput = document.getElementById('goalDisallowReason');
  
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="mb-3">
        <div class="alert alert-info">
          <strong>Goal:</strong> ${goal.goalScorerName || 'Unknown'}
          ${goal.goalAssistName ? `<br><strong>Assist:</strong> ${goal.goalAssistName}` : ''}
          <br><strong>Time:</strong> ${goal.timestamp || 'Unknown'}'
        </div>
      </div>
      <div class="mb-3">
        <label for="goalDisallowReason" class="form-label">Reason for disallowing goal:</label>
        <textarea class="form-control" id="goalDisallowReason" rows="3" placeholder="Enter reason (e.g., offside, foul, etc.)" required></textarea>
      </div>
      <p class="text-muted small mb-0">This goal will be marked as disallowed and excluded from the score.</p>
    `;
  }
  
  // Clear and focus the reason input
  if (reasonInput) {
    reasonInput.value = '';
    setTimeout(() => reasonInput.focus(), 100);
  }
  
  // Show modal
  const modal = document.getElementById('goalDisallowModal');
  if (modal) {
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
  }
}

// Function to create goal disallow modal
function createGoalDisallowModal() {
  const modalHTML = `
    <div class="modal fade" id="goalDisallowModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title">
              <i class="fas fa-ban me-2"></i>Disallow Goal
            </h5>
            <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-times" style="font-size: 14px;"></i>
            </button>
          </div>
          <div class="modal-body" id="goalDisallowModalBody">
            <!-- Content will be populated dynamically -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelGoalDisallowBtn">
              <i class="fas fa-times me-1"></i>Cancel
            </button>
            <button type="button" class="btn btn-warning" id="confirmGoalDisallowBtn">
              <i class="fas fa-ban me-1"></i>Disallow Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  const modal = document.getElementById('goalDisallowModal');
  const cancelBtn = document.getElementById('cancelGoalDisallowBtn');
  const confirmBtn = document.getElementById('confirmGoalDisallowBtn');
  const closeBtn = modal.querySelector('[data-dismiss="modal"]');
  const reasonInput = document.getElementById('goalDisallowReason');
  
  // Cancel button
  cancelBtn?.addEventListener('click', () => {
    hideGoalDisallowModal();
    pendingGoalDisallow = null;
  });
  
  // Close button
  closeBtn?.addEventListener('click', () => {
    hideGoalDisallowModal();
    pendingGoalDisallow = null;
  });
  
  // Confirm button
  confirmBtn?.addEventListener('click', () => {
    const reason = document.getElementById('goalDisallowReason')?.value.trim();
    if (reason) {
      hideGoalDisallowModal();
      performGoalDisallow(reason);
    } else {
      // Show validation error
      const reasonInput = document.getElementById('goalDisallowReason');
      reasonInput?.classList.add('is-invalid');
      reasonInput?.focus();
    }
  });
  
  // Click outside to close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideGoalDisallowModal();
      pendingGoalDisallow = null;
    }
  });
  
  // Enter key to confirm
  modal?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'goalDisallowReason') {
      e.preventDefault();
      confirmBtn?.click();
    }
  });
  
  // Remove validation error on input
  modal?.addEventListener('input', (e) => {
    if (e.target.id === 'goalDisallowReason') {
      e.target.classList.remove('is-invalid');
    }
  });
}

// Function to perform goal disallow
function performGoalDisallow(reason) {
  if (pendingGoalDisallow === null) return;
  
  stateManager.updateGoal(pendingGoalDisallow, { 
    disallowed: true, 
    disallowedReason: reason 
  });
  
  updateGoalStatus(pendingGoalDisallow);
  pendingGoalDisallow = null;
}

// Function to hide goal disallow modal
function hideGoalDisallowModal() {
  const modal = document.getElementById('goalDisallowModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

// Export convenience methods
export const {
  showGoalModal,
  addGoal,
  addOppositionGoal
} = goalManager;
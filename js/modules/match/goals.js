/**
 * Goal Management
 * @version 3.3
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { getCurrentSeconds, formatMatchTime } from '../shared/utils.js';
import { notificationManager } from '../services/notifications.js';
import { showModal, hideModal } from '../ui/modals.js';
import { updateMatchLog } from './events.js';
import { attendanceManager } from '../services/attendance.js';
import { enhancedEventsManager } from '../ui/enhanced-events.js';

// Goal management class
class GoalManager {
  // Show goal modal and capture timestamp
  showGoalModal() {
    stateManager.setPendingGoalTimestamp(getCurrentSeconds());
    // Use the goal modal's show method which updates roster data
    if (window.goalModal) {
      window.goalModal.show();
    } else {
      showModal('goalModal');
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
    enhancedEventsManager.onEventsUpdated();
    this._resetGoalForm();
  }

  // Add team goal
  addGoal(event) {
    event.preventDefault();

    const goalScorerName = document.getElementById('goalScorer')?.value;
    const goalAssistName = document.getElementById('goalAssist')?.value;
    const currentSeconds = gameState.pendingGoalTimestamp || getCurrentSeconds();
    const team1Name = domCache.get('Team1NameElement')?.textContent;

    if (!goalScorerName) {
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
export function toggleGoalDisallowed(index) {
  const goal = gameState.goals[index];
  if (!goal) return;

  if (goal.disallowed) {
    stateManager.updateGoal(index, { disallowed: false, disallowedReason: null });
  } else {
    const reason = prompt('Reason for disallowing goal:');
    if (reason) {
      stateManager.updateGoal(index, { disallowed: true, disallowedReason: reason });
    } else {
      return; // User cancelled
    }
  }

  // Recalculate and update scores using the manager instance
  goalManager._recalculateScores();
  updateMatchLog();

  // Save updated goals data
  storageHelpers.saveMatchData(gameState);

  // Update enhanced events manager
  enhancedEventsManager.onEventsUpdated();

  const goal_updated = gameState.goals[index];
  if (goal_updated.disallowed) {
    notificationManager.warning('Goal disallowed');
  } else {
    notificationManager.success('Goal allowed');
  }
}

// Export convenience methods
export const {
  showGoalModal,
  addGoal,
  addOppositionGoal
} = goalManager;
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

// Goal management class
class GoalManager {
  // Show goal modal and capture timestamp
  showGoalModal() {
    stateManager.setPendingGoalTimestamp(getCurrentSeconds());
    showModal('goalModal');
  }

  // Add team goal
  addGoal(event) {
    event.preventDefault();

    const goalScorerName = domCache.get('goalScorer')?.value;
    const goalAssistName = domCache.get('goalAssist')?.value;
    const currentSeconds = gameState.pendingGoalTimestamp || getCurrentSeconds();
    const team1Name = domCache.get('Team1NameElement')?.textContent;

    if (!goalScorerName) {
      notificationManager.warning('Please select a goal scorer');
      return;
    }

    // Get player details from roster if available
    const goalScorer = window.RosterManager?.getPlayerByName(goalScorerName);
    const goalAssister = window.RosterManager?.getPlayerByName(goalAssistName);

    const goalData = {
      timestamp: formatMatchTime(currentSeconds),
      goalScorerName,
      goalScorerShirtNumber: goalScorer?.shirtNumber || null,
      goalAssistName,
      goalAssistShirtNumber: goalAssister?.shirtNumber || null,
      rawTime: currentSeconds,
      team: 1,
      teamName: team1Name,
      disallowed: false
    };

    // Reset pending timestamp
    stateManager.setPendingGoalTimestamp(null);

    // Update state and UI
    console.log('Adding goal data:', goalData);
    stateManager.addGoal(goalData);
    console.log('Goals after adding:', gameState.goals);
    this._updateScoreboard('first');
    updateMatchLog();

    notificationManager.success(`Goal scored by ${goalScorerName}!`);

    // Save and cleanup
    storageHelpers.saveMatchData(gameState);
    
    this._resetGoalForm();
    hideModal('goalModal');
  }

  // Add opposition goal
  addOppositionGoal() {
    const currentSeconds = getCurrentSeconds();
    const team2Name = domCache.get('Team2NameElement')?.textContent;

    const goalData = {
      timestamp: formatMatchTime(currentSeconds),
      goalScorerName: team2Name,
      goalAssistName: team2Name,
      rawTime: currentSeconds,
      team: 2,
      teamName: team2Name,
      disallowed: false
    };

    // Update state and UI
    console.log('Adding opposition goal data:', goalData);
    stateManager.addGoal(goalData);
    console.log('Goals after adding opposition goal:', gameState.goals);
    this._updateScoreboard('second');
    updateMatchLog();

    notificationManager.error(`Goal scored by ${team2Name}!`);

    // Save data
    storageHelpers.saveMatchData(gameState);
    
    this._resetGoalForm();
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

    const teamGoals = gameState.goals.filter(goal =>
      !goal.disallowed && goal.goalScorerName !== team2Name
    ).length;

    const oppositionGoals = gameState.goals.filter(goal =>
      !goal.disallowed && goal.goalScorerName === team2Name
    ).length;

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
    const goalForm = domCache.get('goalForm');
    if (goalForm) {
      goalForm.reset();
    }
  }

  // Get goal statistics
  getGoalStats() {
    const allowedGoals = gameState.goals.filter(goal => !goal.disallowed);
    const team2Name = domCache.get('Team2NameElement')?.textContent;

    const teamGoals = allowedGoals.filter(goal => goal.goalScorerName !== team2Name);
    const oppositionGoals = allowedGoals.filter(goal => goal.goalScorerName === team2Name);

    return {
      total: allowedGoals.length,
      team: teamGoals.length,
      opposition: oppositionGoals.length,
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
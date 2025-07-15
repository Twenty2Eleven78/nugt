/**
 * Goal Management
 * @version 3.3
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { getCurrentSeconds, formatMatchTime } from '../shared/utils.js';
import { showNotification } from '../services/notifications.js';
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
      showNotification('Please select a goal scorer', 'warning');
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
    stateManager.addGoal(goalData);
    this._updateScoreboard('first');
    updateMatchLog();
    
    showNotification(`Goal scored by ${goalScorerName}!`, 'success');
    
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
    stateManager.addGoal(goalData);
    this._updateScoreboard('second');
    updateMatchLog();
    
    showNotification(`Goal scored by ${team2Name}!`, 'danger');
    
    // Save data
    storageHelpers.saveMatchData(gameState);
    this._resetGoalForm();
  }

  // Toggle goal disallowed status
  toggleGoalDisallowed(index) {
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
    
    // Recalculate and update scores
    this._recalculateScores();
    updateMatchLog();
    
    const goal_updated = gameState.goals[index];
    showNotification(
      goal_updated.disallowed ? 'Goal disallowed' : 'Goal allowed', 
      goal_updated.disallowed ? 'warning' : 'success'
    );
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

// Export convenience methods
export const {
  showGoalModal,
  addGoal,
  addOppositionGoal,
  toggleGoalDisallowed
} = goalManager;
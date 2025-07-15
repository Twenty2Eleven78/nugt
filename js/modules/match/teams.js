/**
 * Team Management
 * @version 3.3
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { STORAGE_KEYS, GAME_CONFIG } from '../shared/constants.js';
import { showNotification } from '../services/notifications.js';
import { updateMatchLog } from './events.js';

// Team management class
class TeamManager {
  // Update team names
  updateTeamName(team, teamName) {
    if (!teamName || !teamName.trim()) {
      showNotification('Team name cannot be empty', 'warning');
      return;
    }

    const trimmedName = teamName.trim();

    if (team === 'first') {
      this._updateTeam1(trimmedName);
    } else if (team === 'second') {
      this._updateTeam2(trimmedName);
    }

    // Update match log to reflect new team names
    updateMatchLog();
    showNotification(`Team name updated to ${trimmedName}`, 'success');
  }

  // Update team 1
  _updateTeam1(teamName) {
    // Add to history if not already present
    stateManager.addTeamToHistory(1, teamName);

    // Update UI elements
    const team1NameElement = domCache.get('Team1NameElement');
    const goalButton = domCache.get('goalButton');
    const team1Input = domCache.get('team1Input');

    if (team1NameElement) {
      team1NameElement.textContent = teamName;
    }

    if (goalButton && goalButton.lastChild) {
      goalButton.lastChild.nodeValue = ' ' + teamName;
    }

    if (team1Input) {
      team1Input.placeholder = teamName;
    }

    // Save to storage
    storage.save(STORAGE_KEYS.TEAM1_NAME, teamName);
    storage.save(STORAGE_KEYS.TEAM1_HISTORY, gameState.team1History);
  }

  // Update team 2
  _updateTeam2(teamName) {
    // Add to history if not already present
    stateManager.addTeamToHistory(2, teamName);

    // Update UI elements
    const team2NameElement = domCache.get('Team2NameElement');
    const opgoalButton = domCache.get('opgoalButton');
    const team2Input = domCache.get('team2Input');

    if (team2NameElement) {
      team2NameElement.textContent = teamName;
    }

    if (opgoalButton && opgoalButton.lastChild) {
      opgoalButton.lastChild.nodeValue = ' ' + teamName;
    }

    if (team2Input) {
      team2Input.placeholder = teamName;
    }

    // Save to storage
    storage.save(STORAGE_KEYS.TEAM2_NAME, teamName);
    storage.save(STORAGE_KEYS.TEAM2_HISTORY, gameState.team2History);
  }

  // Initialize teams from storage
  initializeTeams() {
    // Load team names from storage
    const team1Name = storage.load(STORAGE_KEYS.TEAM1_NAME, GAME_CONFIG.DEFAULT_TEAM1_NAME);
    const team2Name = storage.load(STORAGE_KEYS.TEAM2_NAME, GAME_CONFIG.DEFAULT_TEAM2_NAME);

    // Load team history
    gameState.team1History = storage.load(STORAGE_KEYS.TEAM1_HISTORY, [GAME_CONFIG.DEFAULT_TEAM1_NAME]);
    gameState.team2History = storage.load(STORAGE_KEYS.TEAM2_HISTORY, [GAME_CONFIG.DEFAULT_TEAM2_NAME]);

    // Update UI without notifications
    this._updateTeam1UI(team1Name);
    this._updateTeam2UI(team2Name);
  }

  // Update team 1 UI without saving (for initialization)
  _updateTeam1UI(teamName) {
    const team1NameElement = domCache.get('Team1NameElement');
    const goalButton = domCache.get('goalButton');
    const team1Input = domCache.get('team1Input');

    if (team1NameElement) {
      team1NameElement.textContent = teamName;
    }

    if (goalButton && goalButton.lastChild) {
      goalButton.lastChild.nodeValue = ' ' + teamName;
    }

    if (team1Input) {
      team1Input.placeholder = teamName;
    }
  }

  // Update team 2 UI without saving (for initialization)
  _updateTeam2UI(teamName) {
    const team2NameElement = domCache.get('Team2NameElement');
    const opgoalButton = domCache.get('opgoalButton');
    const team2Input = domCache.get('team2Input');

    if (team2NameElement) {
      team2NameElement.textContent = teamName;
    }

    if (opgoalButton && opgoalButton.lastChild) {
      opgoalButton.lastChild.nodeValue = ' ' + teamName;
    }

    if (team2Input) {
      team2Input.placeholder = teamName;
    }
  }

  // Get current team names
  getCurrentTeamNames() {
    return {
      team1: domCache.get('Team1NameElement')?.textContent || GAME_CONFIG.DEFAULT_TEAM1_NAME,
      team2: domCache.get('Team2NameElement')?.textContent || GAME_CONFIG.DEFAULT_TEAM2_NAME
    };
  }

  // Get team history
  getTeamHistory() {
    return {
      team1History: [...gameState.team1History],
      team2History: [...gameState.team2History]
    };
  }

  // Reset teams to defaults
  resetTeams() {
    stateManager.resetTeams();
    this._updateTeam1UI(GAME_CONFIG.DEFAULT_TEAM1_NAME);
    this._updateTeam2UI(GAME_CONFIG.DEFAULT_TEAM2_NAME);

    // Save to storage
    storage.save(STORAGE_KEYS.TEAM1_NAME, GAME_CONFIG.DEFAULT_TEAM1_NAME);
    storage.save(STORAGE_KEYS.TEAM2_NAME, GAME_CONFIG.DEFAULT_TEAM2_NAME);
    storage.save(STORAGE_KEYS.TEAM1_HISTORY, gameState.team1History);
    storage.save(STORAGE_KEYS.TEAM2_HISTORY, gameState.team2History);
  }
}

// Create and export singleton instance
export const teamManager = new TeamManager();

// Export convenience methods
export const {
  updateTeamName,
  initializeTeams,
  getCurrentTeamNames,
  getTeamHistory,
  resetTeams
} = teamManager;
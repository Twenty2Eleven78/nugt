/**
 * Team Management
 * @version 3.3
 */

import { gameState, stateManager } from '../data/state.js';
import { storage } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { STORAGE_KEYS, GAME_CONFIG } from '../shared/constants.js';
import { notificationManager } from '../services/notifications.js';
import { updateMatchLog } from './events.js';

// Team management class
class TeamManager {
  // Update team names
  updateTeamName(team, teamName) {
    if (!teamName || !teamName.trim()) {
      notificationManager.warning('Team name cannot be empty');
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
    notificationManager.success(`Team name updated to ${trimmedName}`);
  }

  // Helper method to get team-specific DOM elements and storage keys
  _getTeamConfig(teamNumber) {
    if (teamNumber === 1) {
      return {
        nameElement: domCache.get('Team1NameElement'),
        goalButton: domCache.get('goalButton'),
        inputElement: () => document.getElementById('team1Name'), // Dynamic lookup
        nameKey: STORAGE_KEYS.TEAM1_NAME,
        historyKey: STORAGE_KEYS.TEAM1_HISTORY,
        history: gameState.team1History
      };
    } else {
      return {
        nameElement: domCache.get('Team2NameElement'),
        goalButton: domCache.get('opgoalButton'),
        inputElement: () => document.getElementById('team2Name'), // Dynamic lookup
        nameKey: STORAGE_KEYS.TEAM2_NAME,
        historyKey: STORAGE_KEYS.TEAM2_HISTORY,
        history: gameState.team2History
      };
    }
  }

  // Helper method to update team UI elements
  _updateTeamUI(teamName, config, saveToStorage = false) {
    if (config.nameElement) {
      config.nameElement.textContent = teamName;
    }

    if (config.goalButton && config.goalButton.lastChild) {
      config.goalButton.lastChild.nodeValue = ' ' + teamName;
    }

    const inputElement = config.inputElement();
    if (inputElement) {
      inputElement.placeholder = teamName;
    }

    if (saveToStorage) {
      storage.save(config.nameKey, teamName);
      storage.save(config.historyKey, config.history);
    }
  }

  // Update team 1
  _updateTeam1(teamName) {
    stateManager.addTeamToHistory(1, teamName);
    const config = this._getTeamConfig(1);
    this._updateTeamUI(teamName, config, true);
  }

  // Update team 2
  _updateTeam2(teamName) {
    stateManager.addTeamToHistory(2, teamName);
    const config = this._getTeamConfig(2);
    this._updateTeamUI(teamName, config, true);
  }

  // Initialize teams from storage
  initializeTeams() {
    // Load team names from storage
    const team1Name = storage.load(STORAGE_KEYS.TEAM1_NAME, GAME_CONFIG.DEFAULT_TEAM1_NAME);
    const team2Name = storage.load(STORAGE_KEYS.TEAM2_NAME, GAME_CONFIG.DEFAULT_TEAM2_NAME);

    // Load team history
    gameState.team1History = storage.load(STORAGE_KEYS.TEAM1_HISTORY, [GAME_CONFIG.DEFAULT_TEAM1_NAME]);
    gameState.team2History = storage.load(STORAGE_KEYS.TEAM2_HISTORY, [GAME_CONFIG.DEFAULT_TEAM2_NAME]);

    // Update UI without saving to storage
    const team1Config = this._getTeamConfig(1);
    const team2Config = this._getTeamConfig(2);
    this._updateTeamUI(team1Name, team1Config, false);
    this._updateTeamUI(team2Name, team2Config, false);
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

    // Update UI and save to storage
    const team1Config = this._getTeamConfig(1);
    const team2Config = this._getTeamConfig(2);
    this._updateTeamUI(GAME_CONFIG.DEFAULT_TEAM1_NAME, team1Config, true);
    this._updateTeamUI(GAME_CONFIG.DEFAULT_TEAM2_NAME, team2Config, true);
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
/**
 * Match Loader Service
 * @version 1.0
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { STORAGE_KEYS } from '../shared/constants.js';
import { notificationManager } from './notifications.js';
import { rosterManager } from '../match/roster.js';
import { teamManager } from '../match/teams.js';
import { updateMatchLog } from '../match/events.js';
import { timerController } from '../game/timer.js';

class MatchLoaderService {
  /**
   * Load a saved match into the app
   * @param {Object} matchData - The match data to load
   * @returns {boolean} - Success status
   */
  loadMatch(matchData) {
    try {
      if (!matchData) {
        throw new Error('No match data provided');
      }
      
      // Confirm with user
      if (!confirm('Loading this match will replace your current match data. Continue?')) {
        return false;
      }
      
      // Stop timer if running
      if (gameState.isRunning) {
        timerController.stopTimer();
      }
      
      // Load teams
      this._loadTeams(matchData);
      
      // Load game state
      this._loadGameState(matchData);
      
      // Load goals and events
      this._loadGoalsAndEvents(matchData);
      
      // Load roster if available
      this._loadRoster(matchData);
      
      // Update UI
      this._updateUI();
      
      notificationManager.success('Match loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading match:', error);
      notificationManager.danger('Failed to load match: ' + error.message);
      return false;
    }
  }
  
  /**
   * Load teams from match data
   * @param {Object} matchData - The match data
   * @private
   */
  _loadTeams(matchData) {
    const teams = matchData.teams || {};
    const team1 = teams.team1 || {};
    const team2 = teams.team2 || {};
    
    // Update team names
    if (team1.name) {
      teamManager.updateTeamName('first', team1.name);
    }
    
    if (team2.name) {
      teamManager.updateTeamName('second', team2.name);
    }
    
    // Update scores
    storage.saveImmediate(STORAGE_KEYS.FIRST_SCORE, team1.score || 0);
    storage.saveImmediate(STORAGE_KEYS.SECOND_SCORE, team2.score || 0);
    
    // Update UI elements
    const firstScoreElement = document.getElementById('first-score');
    const secondScoreElement = document.getElementById('second-score');
    
    if (firstScoreElement) {
      firstScoreElement.textContent = team1.score || 0;
    }
    
    if (secondScoreElement) {
      secondScoreElement.textContent = team2.score || 0;
    }
  }
  
  /**
   * Load game state from match data
   * @param {Object} matchData - The match data
   * @private
   */
  _loadGameState(matchData) {
    const gameStateData = matchData.gameState || {};
    
    // Update game state
    stateManager.setTimerState(
      gameStateData.seconds || 0,
      false, // Always start paused
      null
    );
    
    stateManager.setGameTime(gameStateData.gameTime || 4200); // Default to 70 minutes
    stateManager.setHalfState(gameStateData.isSecondHalf || false);
    
    // Update game time select
    const gameTimeSelect = document.getElementById('gameTimeSelect');
    if (gameTimeSelect && gameStateData.gameTime) {
      gameTimeSelect.value = gameStateData.gameTime;
    }
  }
  
  /**
   * Load goals and events from match data
   * @param {Object} matchData - The match data
   * @private
   */
  _loadGoalsAndEvents(matchData) {
    // Load goals
    gameState.goals = Array.isArray(matchData.goals) ? [...matchData.goals] : [];
    storage.saveImmediate(STORAGE_KEYS.GOALS, gameState.goals);
    
    // Load match events
    gameState.matchEvents = Array.isArray(matchData.events) ? [...matchData.events] : [];
    storage.saveImmediate(STORAGE_KEYS.MATCH_EVENTS, gameState.matchEvents);
  }
  
  /**
   * Load roster from match data
   * @param {Object} matchData - The match data
   * @private
   */
  _loadRoster(matchData) {
    if (Array.isArray(matchData.roster) && matchData.roster.length > 0) {
      // Clear existing roster
      rosterManager.clearRoster();
      
      // Add players from saved roster
      matchData.roster.forEach(player => {
        rosterManager.addPlayer(player.name, player.shirtNumber);
      });
      
      // Update selects
      rosterManager.updateSelects();
    }
  }
  
  /**
   * Update UI elements
   * @private
   */
  _updateUI() {
    // Update timer display
    timerController.updateDisplay();
    
    // Update match log
    updateMatchLog();
    
    // Update roster list if needed
    if (typeof rosterManager.updateRosterList === 'function') {
      rosterManager.updateRosterList();
    }
  }
}

// Create and export singleton instance
export const matchLoader = new MatchLoaderService();
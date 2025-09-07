/**
 * Application State Management
 * @version 4.0
 */

import { getConfig } from './config.js';

// Centralized application state
export const gameState = {
  // Timer state
  seconds: 0,
  isRunning: false,
  startTimestamp: null,
  gameTime: 4200, // Default value, will be updated from config
  isSecondHalf: false,

  // Match data
  goals: [],
  matchEvents: [],
  pendingGoalTimestamp: null,

  // Team data
  team1History: ['Netherton'], // Default value, will be updated from config
  team2History: ['Opposition'], // Default value, will be updated from config

  // UI state
  editingEventIndex: null,
  editingEventType: null
};

export function initializeGameState() {
    const config = getConfig();
    gameState.gameTime = config.game.default_game_time;
    gameState.team1History = [config.game.default_team1_name];
    gameState.team2History = [config.game.default_team2_name];
}

// State mutation methods with validation
export const stateManager = {
  // Helper functions for validation
  _isValidIndex(index, array) {
    return index >= 0 && index < array.length;
  },

  _isValidData(data) {
    return data && typeof data === 'object';
  },

  // Timer state mutations
  setTimerState(seconds, isRunning, startTimestamp = null) {
    gameState.seconds = Math.max(0, seconds);
    gameState.isRunning = Boolean(isRunning);
    gameState.startTimestamp = startTimestamp;
  },

  setGameTime(gameTime) {
    gameState.gameTime = Math.max(0, gameTime);
  },

  setHalfState(isSecondHalf) {
    gameState.isSecondHalf = Boolean(isSecondHalf);
  },

  // Match data mutations
  addGoal(goalData) {
    if (this._isValidData(goalData)) {
      gameState.goals.push({ ...goalData });
    }
  },

  removeGoal(index) {
    if (this._isValidIndex(index, gameState.goals)) {
      gameState.goals.splice(index, 1);
    }
  },

  updateGoal(index, updates) {
    if (this._isValidIndex(index, gameState.goals)) {
      Object.assign(gameState.goals[index], updates);
    }
  },

  addMatchEvent(eventData) {
    if (this._isValidData(eventData)) {
      gameState.matchEvents.push({ ...eventData });
    }
  },

  removeMatchEvent(index) {
    if (this._isValidIndex(index, gameState.matchEvents)) {
      gameState.matchEvents.splice(index, 1);
    }
  },

  updateMatchEvent(index, updates) {
    if (this._isValidIndex(index, gameState.matchEvents)) {
      Object.assign(gameState.matchEvents[index], updates);
    }
  },

  // Team data mutations
  addTeamToHistory(team, teamName) {
    if (team === 1 && !gameState.team1History.includes(teamName)) {
      gameState.team1History.push(teamName);
    } else if (team === 2 && !gameState.team2History.includes(teamName)) {
      gameState.team2History.push(teamName);
    }
  },

  // UI state mutations
  setEditingEvent(index, type) {
    gameState.editingEventIndex = index;
    gameState.editingEventType = type;
  },

  clearEditingEvent() {
    gameState.editingEventIndex = null;
    gameState.editingEventType = null;
  },

  setPendingGoalTimestamp(timestamp) {
    gameState.pendingGoalTimestamp = timestamp;
  },

  // Reset methods
  resetTimer() {
    gameState.seconds = 0;
    gameState.isRunning = false;
    gameState.startTimestamp = null;
    gameState.isSecondHalf = false;
  },

  resetMatch() {
    gameState.goals = [];
    gameState.matchEvents = [];
    gameState.pendingGoalTimestamp = null;
  },

  resetTeams() {
    const config = getConfig();
    gameState.team1History = [config.game.default_team1_name];
    gameState.team2History = [config.game.default_team2_name];
  },

  resetAll() {
    const config = getConfig();
    this.resetTimer();
    this.resetMatch();
    this.resetTeams();
    gameState.gameTime = config.game.default_game_time;
    this.clearEditingEvent();
  }
};
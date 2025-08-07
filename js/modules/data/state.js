/**
 * Application State Management
 * @version 4.0
 */

import { GAME_CONFIG } from '../shared/constants.js';

// Centralized application state
export const gameState = {
  // Timer state
  seconds: 0,
  isRunning: false,
  startTimestamp: null,
  gameTime: GAME_CONFIG.DEFAULT_GAME_TIME,
  isSecondHalf: false,

  // Match data
  goals: [],
  matchEvents: [],
  pendingGoalTimestamp: null,

  // Team data
  team1History: [GAME_CONFIG.DEFAULT_TEAM1_NAME],
  team2History: [GAME_CONFIG.DEFAULT_TEAM2_NAME],

  // UI state
  editingEventIndex: null,
  editingEventType: null
};

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
    gameState.team1History = [GAME_CONFIG.DEFAULT_TEAM1_NAME];
    gameState.team2History = [GAME_CONFIG.DEFAULT_TEAM2_NAME];
  },

  resetAll() {
    this.resetTimer();
    this.resetMatch();
    this.resetTeams();
    gameState.gameTime = GAME_CONFIG.DEFAULT_GAME_TIME;
    this.clearEditingEvent();
  }
};
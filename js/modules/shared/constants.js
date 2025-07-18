/**
 * Shared Constants
 * @version 3.5
 */

// Storage Keys Constants
export const STORAGE_KEYS = {
  START_TIMESTAMP: 'nugt_startTimestamp',
  IS_RUNNING: 'nugt_isRunning',
  GOALS: 'nugt_goals',
  ELAPSED_TIME: 'nugt_elapsedTime',
  FIRST_SCORE: 'nugt_firstScore',    
  SECOND_SCORE: 'nugt_secondScore',
  TEAM1_NAME: 'nugt_team1name',    
  TEAM2_NAME: 'nugt_team2name',
  MATCH_EVENTS: 'nugt_matchEvents',
  GAME_TIME: 'nugt_gameTime',
  IS_SECOND_HALF: 'nugt_isSecondHalf',
  TEAM1_HISTORY: 'nugt_team1history',
  TEAM2_HISTORY: 'nugt_team2history',     
};

// Game Configuration
export const GAME_CONFIG = {
  DEFAULT_GAME_TIME: 4200, // 70 minutes in seconds
  TIMER_UPDATE_INTERVAL: 100, // milliseconds
  STORAGE_DEBOUNCE_DELAY: 100, // milliseconds
  DEFAULT_TEAM1_NAME: 'Netherton',
  DEFAULT_TEAM2_NAME: 'Opposition Team'
};

// Event Types
export const EVENT_TYPES = {
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  SIN_BIN: 'Sin Bin',
  FOUL: 'Foul',
  PENALTY: 'Penalty',
  INCIDENT: 'Incident',
  HALF_TIME: 'Half Time',
  FULL_TIME: 'Full Time'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info'
};

// Authentication Constants
export const AUTH_CONFIG = {
  SESSION_TIMEOUT: 86400000, // 24 hours in milliseconds
  AUTH_REQUIRED: false, // Whether authentication is required to use the app
  USAGE_TRACKING: true // Whether to track usage statistics
};
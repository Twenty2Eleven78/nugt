/**
 * Shared Constants
 * Centralized configuration and constants for the NUFC GameTime application
 */

// Application Configuration
export const APP_CONFIG = {
  NAME: 'NUFC GameTime',
  VERSION: '4.0',
  AUTHOR: 'NUFC GameTime Team',
  DESCRIPTION: 'Football match tracking and statistics application'
};

// Storage Keys - Local Storage identifiers
export const STORAGE_KEYS = {
  // Timer and Game State
  START_TIMESTAMP: 'nugt_startTimestamp',
  IS_RUNNING: 'nugt_isRunning',
  ELAPSED_TIME: 'nugt_elapsedTime',
  GAME_TIME: 'nugt_gameTime',
  IS_SECOND_HALF: 'nugt_isSecondHalf',

  // Scoring and Goals
  GOALS: 'nugt_goals',
  FIRST_SCORE: 'nugt_firstScore',
  SECOND_SCORE: 'nugt_secondScore',

  // Team Information
  TEAM1_NAME: 'nugt_team1name',
  TEAM2_NAME: 'nugt_team2name',
  TEAM1_HISTORY: 'nugt_team1history',
  TEAM2_HISTORY: 'nugt_team2history',

  // Match Data
  MATCH_EVENTS: 'nugt_matchEvents',
  MATCH_ATTENDANCE: 'nugt_matchAttendance',

  // Player Management
  ROSTER: 'nugt_roster',
  PLAYER_STATS: 'nugt_playerStats'
};

// Game Configuration
export const GAME_CONFIG = {
  // Time Settings (in seconds)
  DEFAULT_GAME_TIME: 4200, // 70 minutes
  HALF_TIME_DURATION: 2100, // 35 minutes
  FULL_TIME_DURATION: 4200, // 70 minutes
  EXTRA_TIME_DURATION: 1800, // 30 minutes

  // Timer Settings (in milliseconds)
  TIMER_UPDATE_INTERVAL: 100,
  STORAGE_DEBOUNCE_DELAY: 100,
  AUTO_SAVE_INTERVAL: 5000, // 5 seconds

  // Team Defaults
  DEFAULT_TEAM1_NAME: 'Netherton',
  DEFAULT_TEAM2_NAME: 'Opposition',

  // Match Settings
  MAX_PLAYERS_PER_TEAM: 22,
  MIN_PLAYERS_PER_TEAM: 7,
  MAX_SUBSTITUTIONS: 5,

  // UI Settings
  NOTIFICATION_DURATION: 3000, // 3 seconds
  MODAL_ANIMATION_DURATION: 300, // 0.3 seconds
  DEBOUNCE_DELAY: 300 // 0.3 seconds
};

// Match Event Types
export const EVENT_TYPES = {
  // Disciplinary Events
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  SIN_BIN: 'Sin Bin',

  // Match Events
  FOUL: 'Foul',
  PENALTY: 'Penalty',
  FREE_KICK: 'Free Kick',
  CORNER: 'Corner',
  THROW_IN: 'Throw In',
  OFFSIDE: 'Offside',

  // Game Flow Events
  GAME_STARTED: 'Game Started',
  HALF_TIME: 'Half Time',
  FULL_TIME: 'Full Time',
  EXTRA_TIME: 'Extra Time',
  PENALTY_SHOOTOUT: 'Penalty Shootout',

  // General Events
  INCIDENT: 'Incident',
  INJURY: 'Injury',
  SUBSTITUTION: 'Substitution'
};

// Event Categories for filtering and organization
export const EVENT_CATEGORIES = {
  DISCIPLINARY: 'disciplinary',
  MATCH_FLOW: 'match_flow',
  GAME_EVENTS: 'game_events',
  ADMINISTRATIVE: 'administrative'
};

// Event Icons mapping
export const EVENT_ICONS = {
  [EVENT_TYPES.YELLOW_CARD]: 'fas fa-square text-warning',
  [EVENT_TYPES.RED_CARD]: 'fas fa-square text-danger',
  [EVENT_TYPES.SIN_BIN]: 'fas fa-clock text-info',
  [EVENT_TYPES.FOUL]: 'fas fa-hand-paper text-warning',
  [EVENT_TYPES.PENALTY]: 'fas fa-futbol text-danger',
  [EVENT_TYPES.FREE_KICK]: 'fas fa-running text-primary',
  [EVENT_TYPES.CORNER]: 'fas fa-flag text-info',
  [EVENT_TYPES.GAME_STARTED]: 'fas fa-play text-success',
  [EVENT_TYPES.HALF_TIME]: 'fas fa-pause text-secondary',
  [EVENT_TYPES.FULL_TIME]: 'fas fa-stop text-dark',
  [EVENT_TYPES.INCIDENT]: 'fas fa-exclamation-triangle text-warning',
  [EVENT_TYPES.INJURY]: 'fas fa-plus text-danger',
  [EVENT_TYPES.SUBSTITUTION]: 'fas fa-exchange-alt text-success'
};

// Notification Types and Configuration
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info'
};

export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 3000, // 3 seconds
  PERSISTENT_DURATION: 0, // No auto-hide
  MAX_NOTIFICATIONS: 5,
  ANIMATION_DURATION: 300 // 0.3 seconds
};

// Authentication Configuration
export const AUTH_CONFIG = {
  SESSION_TIMEOUT: 86400000, // 24 hours in milliseconds
  TOKEN_REFRESH_INTERVAL: 3600000, // 1 hour in milliseconds
  AUTH_REQUIRED: false,
  USAGE_TRACKING: true,
};

// API Configuration
export const API_CONFIG = {
  REQUEST_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_DURATION: 30000, // 30 seconds
  BASE_URL: '/.netlify/functions'
};

// UI Constants
export const UI_CONFIG = {
  // Breakpoints (Bootstrap-based)
  BREAKPOINTS: {
    XS: 0,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400
  },

  // Animation Durations
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },

  // Z-Index Layers
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070
  }
};

// Match Result Types
export const MATCH_RESULTS = {
  WIN: 'WIN',
  LOSS: 'LOSS',
  DRAW: 'DRAW',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED'
};

// Player Positions
export const PLAYER_POSITIONS = {
  GOALKEEPER: 'GK',
  DEFENDER: 'DEF',
  MIDFIELDER: 'MID',
  FORWARD: 'FWD',
  SUBSTITUTE: 'SUB'
};

// Sharing Platforms
export const SHARE_PLATFORMS = {
  WHATSAPP: 'whatsapp',
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  WEB_API: 'web-api',
  CLIPBOARD: 'clipboard'
};

// Export Formats
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  TXT: 'txt',
  PDF: 'pdf'
};

// Validation Rules
export const VALIDATION = {
  TEAM_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  PLAYER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },
  EVENT_DESCRIPTION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  AUTH_ERROR: 'Authentication failed. Please sign in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  STORAGE_ERROR: 'Failed to save data. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_SAVED: 'Data saved successfully!',
  DATA_LOADED: 'Data loaded successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  MATCH_SHARED: 'Match report shared successfully!',
  PLAYER_ADDED: 'Player added successfully!',
  SETTINGS_UPDATED: 'Settings updated successfully!'
};
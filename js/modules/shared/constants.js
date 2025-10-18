/**
 * Shared Constants
 * Centralized configuration and constants for the NUFC GameTime application
 * Note: Many values are now loaded from config.json via the config manager
 */

import { config } from './config.js';

// Application Configuration - now loaded from config.json with fallbacks
export const APP_CONFIG = {
  get NAME() { 
    try {
      return config.get('app.name', 'NUFC GameTime');
    } catch (error) {
      return 'NUFC GameTime';
    }
  },
  get VERSION() { 
    try {
      return config.get('app.version', '4.0');
    } catch (error) {
      return '4.0';
    }
  },
  get AUTHOR() { 
    try {
      return config.get('app.author', 'NUFC GameTime Team');
    } catch (error) {
      return 'NUFC GameTime Team';
    }
  },
  get DESCRIPTION() { 
    try {
      return config.get('app.description', 'Football match tracking and statistics application');
    } catch (error) {
      return 'Football match tracking and statistics application';
    }
  }
};

// Cache Configuration
export const CACHE_CONFIG = {
  NAME: 'nugt-cache-v328',
  VERSION: 'v328'
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
  MATCH_LINEUP: 'nugt_matchLineup',

  // Player Management
  ROSTER: 'nugt_roster',
  PLAYER_STATS: 'nugt_playerStats'
};

// Game Configuration - now loaded from config.json with fallbacks
export const GAME_CONFIG = {
  // Time Settings (in seconds)
  get DEFAULT_GAME_TIME() { 
    try {
      return config.get('match.defaultGameTime', 4200);
    } catch (error) {
      return 4200;
    }
  },
  get HALF_TIME_DURATION() { 
    try {
      return Math.floor(config.get('match.defaultGameTime', 4200) / 2);
    } catch (error) {
      return 2100;
    }
  },
  get FULL_TIME_DURATION() { 
    try {
      return config.get('match.defaultGameTime', 4200);
    } catch (error) {
      return 4200;
    }
  },

  // Timer Settings (in milliseconds)
  get TIMER_UPDATE_INTERVAL() { 
    try {
      return config.get('match.timerUpdateInterval', 100);
    } catch (error) {
      return 100;
    }
  },
  STORAGE_DEBOUNCE_DELAY: 100,
  get AUTO_SAVE_INTERVAL() { 
    try {
      return config.get('match.autoSaveInterval', 5000);
    } catch (error) {
      return 5000;
    }
  },

  // Team Defaults - now configurable
  get DEFAULT_TEAM1_NAME() { 
    try {
      return config.get('team.defaultTeam1Name', 'Netherton');
    } catch (error) {
      return 'Netherton';
    }
  },
  get DEFAULT_TEAM2_NAME() { 
    try {
      return config.get('team.defaultTeam2Name', 'Opposition');
    } catch (error) {
      return 'Opposition';
    }
  },

  // UI Settings
  get DEBOUNCE_DELAY() { 
    try {
      return config.get('ui.debounceDelay', 300);
    } catch (error) {
      return 300;
    }
  }
};

// Match Event Types - now configurable via event-config.js
// These are kept for backward compatibility
export const EVENT_TYPES = {
  // Disciplinary Events
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  SIN_BIN: 'Sin Bin',

  // Match Events
  FOUL: 'Foul',
  PENALTY: 'Penalty',
  OFFSIDE: 'Offside',

  // Game Flow Events
  GAME_STARTED: 'Game Started',
  HALF_TIME: 'Half Time',
  FULL_TIME: 'Full Time',

  // General Events
  INCIDENT: 'Incident',
  INJURY: 'Injury',
  SUBSTITUTION: 'Substitution'
};

// Event Icons mapping - now configurable via event-config.js
// These are kept for backward compatibility
export const EVENT_ICONS = {
  [EVENT_TYPES.YELLOW_CARD]: 'fas fa-square text-warning',
  [EVENT_TYPES.RED_CARD]: 'fas fa-square text-danger',
  [EVENT_TYPES.SIN_BIN]: 'fas fa-clock text-info',
  [EVENT_TYPES.FOUL]: 'fas fa-hand-paper text-warning',
  [EVENT_TYPES.OFFSIDE]: 'fas fa-flag text-warning',
  [EVENT_TYPES.PENALTY]: 'fas fa-futbol text-danger',
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
  get DEFAULT_DURATION() { 
    try {
      return config.get('ui.notifications.defaultDuration', 2000);
    } catch (error) {
      return 2000;
    }
  },
  PERSISTENT_DURATION: 0, // No auto-hide
  get MAX_NOTIFICATIONS() { 
    try {
      return config.get('ui.notifications.maxNotifications', 5);
    } catch (error) {
      return 5;
    }
  },
  ANIMATION_DURATION: 300 // 0.3 seconds
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
  DRAW: 'DRAW'
};

// Sharing Platforms - now configurable via sharing-config.js
// These are kept for backward compatibility
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
/**
 * Shared Constants
 * Centralized configuration and constants for the GameTime application
 * Now supports dynamic configuration loading from team-config.json
 */

import { configService } from '../services/config.js';

// Static fallback values (used when configuration is not available)
const FALLBACK_VALUES = {
  APP_NAME: 'GameTime',
  VERSION: '4.0',
  AUTHOR: 'GameTime Team',
  DESCRIPTION: 'Football match tracking and statistics application',
  CACHE_NAME: 'gametime-cache-v318',
  CACHE_VERSION: 'v318',
  STORAGE_PREFIX: 'gt_',
  CACHE_PREFIX: 'gt-cache-',
  DEFAULT_TEAM1_NAME: 'Home Team',
  DEFAULT_TEAM2_NAME: 'Away Team',
  DEFAULT_GAME_TIME: 4200 // 70 minutes
};

/**
 * Get application configuration with fallback to defaults
 */
function getAppConfig() {
  if (!configService.isConfigLoaded()) {
    return {
      NAME: FALLBACK_VALUES.APP_NAME,
      VERSION: FALLBACK_VALUES.VERSION,
      AUTHOR: FALLBACK_VALUES.AUTHOR,
      DESCRIPTION: FALLBACK_VALUES.DESCRIPTION
    };
  }

  const teamConfig = configService.getTeamConfig();
  const pwaConfig = configService.getPWAConfig();
  
  return {
    NAME: pwaConfig?.appName || teamConfig?.name + ' GameTime' || FALLBACK_VALUES.APP_NAME,
    VERSION: FALLBACK_VALUES.VERSION,
    AUTHOR: FALLBACK_VALUES.AUTHOR,
    DESCRIPTION: pwaConfig?.description || FALLBACK_VALUES.DESCRIPTION
  };
}

/**
 * Get cache configuration with configurable prefixes
 */
function getCacheConfig() {
  if (!configService.isConfigLoaded()) {
    return {
      NAME: FALLBACK_VALUES.CACHE_NAME,
      VERSION: FALLBACK_VALUES.CACHE_VERSION
    };
  }

  const storageConfig = configService.getStorageConfig();
  const cachePrefix = storageConfig?.cachePrefix || FALLBACK_VALUES.CACHE_PREFIX;
  
  return {
    NAME: cachePrefix + 'v318',
    VERSION: 'v318'
  };
}

/**
 * Get storage keys with configurable prefixes
 */
function getStorageKeys() {
  const prefix = configService.isConfigLoaded() 
    ? configService.getStorageConfig()?.keyPrefix || FALLBACK_VALUES.STORAGE_PREFIX
    : FALLBACK_VALUES.STORAGE_PREFIX;

  return {
    // Timer and Game State
    START_TIMESTAMP: prefix + 'startTimestamp',
    IS_RUNNING: prefix + 'isRunning',
    ELAPSED_TIME: prefix + 'elapsedTime',
    GAME_TIME: prefix + 'gameTime',
    IS_SECOND_HALF: prefix + 'isSecondHalf',

    // Scoring and Goals
    GOALS: prefix + 'goals',
    FIRST_SCORE: prefix + 'firstScore',
    SECOND_SCORE: prefix + 'secondScore',

    // Team Information
    TEAM1_NAME: prefix + 'team1name',
    TEAM2_NAME: prefix + 'team2name',
    TEAM1_HISTORY: prefix + 'team1history',
    TEAM2_HISTORY: prefix + 'team2history',

    // Match Data
    MATCH_EVENTS: prefix + 'matchEvents',
    MATCH_ATTENDANCE: prefix + 'matchAttendance',

    // Player Management
    ROSTER: prefix + 'roster',
    PLAYER_STATS: prefix + 'playerStats'
  };
}

/**
 * Get game configuration with configurable values
 */
function getGameConfig() {
  if (!configService.isConfigLoaded()) {
    return {
      // Time Settings (in seconds)
      DEFAULT_GAME_TIME: FALLBACK_VALUES.DEFAULT_GAME_TIME,
      HALF_TIME_DURATION: Math.floor(FALLBACK_VALUES.DEFAULT_GAME_TIME / 2),
      FULL_TIME_DURATION: FALLBACK_VALUES.DEFAULT_GAME_TIME,

      // Timer Settings (in milliseconds)
      TIMER_UPDATE_INTERVAL: 100,
      STORAGE_DEBOUNCE_DELAY: 100,
      AUTO_SAVE_INTERVAL: 5000, // 5 seconds

      // Team Defaults
      DEFAULT_TEAM1_NAME: FALLBACK_VALUES.DEFAULT_TEAM1_NAME,
      DEFAULT_TEAM2_NAME: FALLBACK_VALUES.DEFAULT_TEAM2_NAME,

      // UI Settings
      DEBOUNCE_DELAY: 300 // 0.3 seconds
    };
  }

  const teamConfig = configService.getTeamConfig();
  const defaultsConfig = configService.getDefaultsConfig();
  const matchDuration = defaultsConfig?.matchDuration || FALLBACK_VALUES.DEFAULT_GAME_TIME;

  return {
    // Time Settings (in seconds)
    DEFAULT_GAME_TIME: matchDuration,
    HALF_TIME_DURATION: Math.floor(matchDuration / 2),
    FULL_TIME_DURATION: matchDuration,

    // Timer Settings (in milliseconds)
    TIMER_UPDATE_INTERVAL: 100,
    STORAGE_DEBOUNCE_DELAY: 100,
    AUTO_SAVE_INTERVAL: 5000, // 5 seconds

    // Team Defaults
    DEFAULT_TEAM1_NAME: teamConfig?.name || FALLBACK_VALUES.DEFAULT_TEAM1_NAME,
    DEFAULT_TEAM2_NAME: teamConfig?.defaultOpponentName || FALLBACK_VALUES.DEFAULT_TEAM2_NAME,

    // UI Settings
    DEBOUNCE_DELAY: 300 // 0.3 seconds
  };
}

// Export dynamic configuration getters
export const APP_CONFIG = getAppConfig();
export const CACHE_CONFIG = getCacheConfig();
export const STORAGE_KEYS = getStorageKeys();
export const GAME_CONFIG = getGameConfig();

// Export functions for dynamic access (when config changes)
export { getAppConfig, getCacheConfig, getStorageKeys, getGameConfig };

// Update configurations when config changes
configService.onConfigChange(() => {
  // Note: Since these are exported as constants, modules that import them
  // will need to re-import or use the getter functions for updates
  console.log('Configuration changed - constants updated');
});

// Match Event Types
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

// Event Icons mapping
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
  DEFAULT_DURATION: 2000, // 3 seconds
  PERSISTENT_DURATION: 0, // No auto-hide
  MAX_NOTIFICATIONS: 5,
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
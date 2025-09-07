/**
 * Data Persistence and Storage Management
 * @version 4.0
 */

import { getConfig } from './config.js';
import { STORAGE_KEYS } from '../shared/constants.js';
import { debounce } from '../shared/utils.js';

// Enhanced storage manager with better error handling and performance
class StorageManager {
  constructor() {
    this._saveQueue = new Map();
    this._debouncedFlush = debounce(() => this._flushSaves(), () => getConfig().game.storage_debounce_delay);
  }

  // Save data with debouncing
  save(key, data) {
    try {
      this._saveQueue.set(key, data);
      this._debouncedFlush();
    } catch (error) {
      console.error(`Error queuing save for key ${key}:`, error);
    }
  }

  // Immediate save without debouncing
  saveImmediate(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage for key ${key}:`, error);
      this._handleStorageError(error);
    }
  }

  // Flush all queued saves
  _flushSaves() {
    try {
      for (const [key, data] of this._saveQueue) {
        localStorage.setItem(key, JSON.stringify(data));
      }
      this._saveQueue.clear();
    } catch (error) {
      console.error('Error flushing saves to localStorage:', error);
      this._handleStorageError(error);
    }
  }

  // Load data with fallback
  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error loading from localStorage for key ${key}:`, error);
      return defaultValue;
    }
  }

  // Remove specific key
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing key ${key} from localStorage:`, error);
    }
  }

  // Clear all app data (except authentication data)
  clear() {
    try {
      // Get all keys to preserve (auth keys)
      const authKeys = [
        'nugt_user_id',
        'nugt_email',
        'nugt_display_name',
        'nugt_credential_id',
        'nugt_is_authenticated',
        'nugt_auth_timestamp',
        'nugt_usage_stats'
      ];

      // Store auth data temporarily
      const authData = {};
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          authData[key] = value;
        }
      });

      // Clear all app data
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      // Restore auth data
      Object.entries(authData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      this._saveQueue.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Check storage availability and quota
  checkStorageHealth() {
    try {
      const testKey = 'nugt_storage_test';
      const testData = 'test';
      localStorage.setItem(testKey, testData);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      return retrieved === testData;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }

  // Handle storage errors
  _handleStorageError(error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Consider clearing old data.');
      // Could implement automatic cleanup here
    } else if (error.name === 'SecurityError') {
      console.warn('LocalStorage access denied. Running in private mode?');
    }
  }


}

// Create and export singleton instance
export const storage = new StorageManager();

// Convenience methods for common operations
export const storageHelpers = {
  // Helper to save timer state data
  _saveTimerState(gameState, saveMethod) {
    saveMethod(STORAGE_KEYS.ELAPSED_TIME, gameState.seconds);
    saveMethod(STORAGE_KEYS.IS_RUNNING, gameState.isRunning);
    saveMethod(STORAGE_KEYS.START_TIMESTAMP, gameState.startTimestamp);
    saveMethod(STORAGE_KEYS.GAME_TIME, gameState.gameTime);
    saveMethod(STORAGE_KEYS.IS_SECOND_HALF, gameState.isSecondHalf);
  },

  // Save game state
  saveGameState(gameState) {
    this._saveTimerState(gameState, (key, data) => storage.save(key, data));
  },

  // Save game state immediately (for critical saves like before page unload)
  saveGameStateImmediate(gameState) {
    this._saveTimerState(gameState, (key, data) => storage.saveImmediate(key, data));
  },

  // Save match data with optional attendance
  saveMatchData(gameState, attendanceData = null) {
    storage.save(STORAGE_KEYS.GOALS, gameState.goals);
    storage.save(STORAGE_KEYS.MATCH_EVENTS, gameState.matchEvents);

    // Save attendance data if provided
    if (attendanceData) {
      storage.save(STORAGE_KEYS.MATCH_ATTENDANCE, attendanceData);
    }
  },

  // Alias for backward compatibility
  saveCompleteMatchData(gameState, attendanceData = null) {
    return this.saveMatchData(gameState, attendanceData);
  },





  // Load complete game state
  loadGameState() {
    const config = getConfig();
    return {
      seconds: storage.load(STORAGE_KEYS.ELAPSED_TIME, 0),
      isRunning: storage.load(STORAGE_KEYS.IS_RUNNING, false),
      startTimestamp: storage.load(STORAGE_KEYS.START_TIMESTAMP, null),
      gameTime: storage.load(STORAGE_KEYS.GAME_TIME, config.game.default_game_time),
      isSecondHalf: storage.load(STORAGE_KEYS.IS_SECOND_HALF, false),
      goals: storage.load(STORAGE_KEYS.GOALS, []),
      matchEvents: storage.load(STORAGE_KEYS.MATCH_EVENTS, []),
      team1History: storage.load(STORAGE_KEYS.TEAM1_HISTORY, [config.game.default_team1_name]),
      team2History: storage.load(STORAGE_KEYS.TEAM2_HISTORY, [config.game.default_team2_name]),
      attendance: storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, [])
    };
  }
};
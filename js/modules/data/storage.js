/**
 * Data Persistence and Storage Management
 * @version 3.3
 */

import { STORAGE_KEYS, GAME_CONFIG } from '../shared/constants.js';
import { debounce } from '../shared/utils.js';

// Enhanced storage manager with better error handling and performance
class StorageManager {
  constructor() {
    this._saveQueue = new Map();
    this._debouncedFlush = debounce(() => this._flushSaves(), GAME_CONFIG.STORAGE_DEBOUNCE_DELAY);
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

  // Clear all app data
  clear() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
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

  // Get storage usage info
  getStorageInfo() {
    try {
      let totalSize = 0;
      const keys = Object.values(STORAGE_KEYS);
      
      for (const key of keys) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
      
      return {
        totalKeys: keys.length,
        totalSize: totalSize,
        formattedSize: `${(totalSize / 1024).toFixed(2)} KB`
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const storage = new StorageManager();

// Convenience methods for common operations
export const storageHelpers = {
  // Save game state
  saveGameState(gameState) {
    storage.save(STORAGE_KEYS.ELAPSED_TIME, gameState.seconds);
    storage.save(STORAGE_KEYS.IS_RUNNING, gameState.isRunning);
    storage.save(STORAGE_KEYS.START_TIMESTAMP, gameState.startTimestamp);
    storage.save(STORAGE_KEYS.GAME_TIME, gameState.gameTime);
    storage.save(STORAGE_KEYS.IS_SECOND_HALF, gameState.isSecondHalf);
  },

  // Save match data
  saveMatchData(gameState) {
    storage.save(STORAGE_KEYS.GOALS, gameState.goals);
    storage.save(STORAGE_KEYS.MATCH_EVENTS, gameState.matchEvents);
  },

  // Save team data
  saveTeamData(gameState, team1Name, team2Name, team1Score, team2Score) {
    storage.save(STORAGE_KEYS.TEAM1_NAME, team1Name);
    storage.save(STORAGE_KEYS.TEAM2_NAME, team2Name);
    storage.save(STORAGE_KEYS.TEAM1_HISTORY, gameState.team1History);
    storage.save(STORAGE_KEYS.TEAM2_HISTORY, gameState.team2History);
    storage.save(STORAGE_KEYS.FIRST_SCORE, team1Score);
    storage.save(STORAGE_KEYS.SECOND_SCORE, team2Score);
  },

  // Load complete game state
  loadGameState() {
    return {
      seconds: storage.load(STORAGE_KEYS.ELAPSED_TIME, 0),
      isRunning: storage.load(STORAGE_KEYS.IS_RUNNING, false),
      startTimestamp: storage.load(STORAGE_KEYS.START_TIMESTAMP, null),
      gameTime: storage.load(STORAGE_KEYS.GAME_TIME, GAME_CONFIG.DEFAULT_GAME_TIME),
      isSecondHalf: storage.load(STORAGE_KEYS.IS_SECOND_HALF, false),
      goals: storage.load(STORAGE_KEYS.GOALS, []),
      matchEvents: storage.load(STORAGE_KEYS.MATCH_EVENTS, []),
      team1History: storage.load(STORAGE_KEYS.TEAM1_HISTORY, [GAME_CONFIG.DEFAULT_TEAM1_NAME]),
      team2History: storage.load(STORAGE_KEYS.TEAM2_HISTORY, [GAME_CONFIG.DEFAULT_TEAM2_NAME])
    };
  }
};
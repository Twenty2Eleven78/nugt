/**
 * Game Statistics Tracking Service
 * @version 1.0
 */

import { storage } from '../data/storage.js';
import { authService } from './auth.js';
import { apiService } from './api.js';
import { STORAGE_KEYS } from '../shared/constants.js';

class StatsTracker {
  constructor() {
    this.gameStats = {};
    this.playerStats = {};
    this.teamStats = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the stats tracker
   */
  init() {
    if (this.isInitialized) return;

    // Load existing stats
    this.gameStats = storage.load(STORAGE_KEYS.GAME_STATS, {});
    this.playerStats = storage.load(STORAGE_KEYS.PLAYER_STATS, {});
    this.teamStats = storage.load(STORAGE_KEYS.TEAM_STATS, {});

    this.isInitialized = true;
    console.log('Stats tracker initialized with:', {
      gameStats: this.gameStats,
      playerStats: this.playerStats,
      teamStats: this.teamStats
    });
  }

  /**
   * Track a game event
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  trackEvent(eventType, eventData = {}) {
    if (!this.isInitialized) this.init();
    
    // Only track stats if user is authenticated
    if (!authService.isUserAuthenticated()) {
      console.log('Not tracking stats: User not authenticated');
      return;
    }

    const userId = authService.getCurrentUser()?.id;
    if (!userId) {
      console.log('Not tracking stats: No user ID available');
      return;
    }

    const timestamp = Date.now();
    const gameId = this._getCurrentGameId();

    // Initialize user stats if needed
    if (!this.gameStats[userId]) {
      this.gameStats[userId] = {};
    }

    // Initialize game stats if needed
    if (!this.gameStats[userId][gameId]) {
      this.gameStats[userId][gameId] = {
        startTime: timestamp,
        events: [],
        summary: {
          goals: 0,
          oppositionGoals: 0,
          yellowCards: 0,
          redCards: 0
        }
      };
    }

    // Add event to game stats
    this.gameStats[userId][gameId].events.push({
      type: eventType,
      timestamp,
      data: eventData
    });

    // Initialize player stats if needed
    if (!this.playerStats[userId]) {
      this.playerStats[userId] = {};
      console.log(`Created player stats object for user: ${userId}`);
    }

    // Update summary stats
    const summary = this.gameStats[userId][gameId].summary;
    switch (eventType) {
      case 'goal':
        summary.goals++;
        if (eventData.player && eventData.player !== 'Own Goal') {
          this._updatePlayerStat(userId, eventData.player, 'goals');
          // Track assist if available
          if (eventData.assist && eventData.assist !== 'N/A') {
            this._updatePlayerStat(userId, eventData.assist, 'assists');
          }
        }
        break;
      case 'opposition_goal':
        summary.oppositionGoals++;
        break;
      case 'yellow_card':
        summary.yellowCards++;
        if (eventData.player) {
          this._updatePlayerStat(userId, eventData.player, 'yellowCards');
        }
        break;
      case 'red_card':
        summary.redCards++;
        if (eventData.player) {
          this._updatePlayerStat(userId, eventData.player, 'redCards');
        }
        break;
    }

    // Save stats
    this._saveStats();

    // Track in auth service
    authService.trackUsage('game_event', { eventType });
    
    // Send to API (async, don't wait for response)
    this._syncWithServer(eventType, eventData);
    
    console.log(`Event tracked: ${eventType}`, eventData);
  }

  /**
   * Get game statistics for the current user
   * @returns {Object|null} - Game statistics or null if not authenticated
   */
  getGameStats() {
    if (!authService.isUserAuthenticated()) {
      return null;
    }

    const userId = authService.getCurrentUser()?.id;
    if (!userId || !this.gameStats[userId]) {
      return null;
    }

    return this.gameStats[userId];
  }

  /**
   * Get player statistics for the current user
   * @returns {Object|null} - Player statistics or null if not authenticated
   */
  getPlayerStats() {
    if (!authService.isUserAuthenticated()) {
      console.log('getPlayerStats: User not authenticated');
      return null;
    }

    const userId = authService.getCurrentUser()?.id;
    console.log('getPlayerStats: userId =', userId);
    console.log('getPlayerStats: playerStats =', this.playerStats);
    
    if (!userId) {
      console.log('getPlayerStats: No userId available');
      return null;
    }
    
    // Initialize player stats if needed
    if (!this.playerStats[userId]) {
      console.log('getPlayerStats: Creating empty player stats for user');
      this.playerStats[userId] = {};
      this._saveStats();
    }

    return this.playerStats[userId];
  }

  /**
   * Get team statistics for the current user
   * @returns {Object|null} - Team statistics or null if not authenticated
   */
  getTeamStats() {
    if (!authService.isUserAuthenticated()) {
      return null;
    }

    const userId = authService.getCurrentUser()?.id;
    if (!userId || !this.teamStats[userId]) {
      return null;
    }

    return this.teamStats[userId];
  }

  /**
   * Update player statistics
   * @param {string} userId - User ID
   * @param {string} playerName - Player name
   * @param {string} statType - Type of statistic
   * @private
   */
  _updatePlayerStat(userId, playerName, statType) {
    if (!playerName || playerName === 'N/A' || playerName === 'Own Goal') {
      console.log('No valid player name provided for stat update');
      return;
    }

    console.log(`Updating ${statType} for player: ${playerName}`);

    // Initialize player stats if needed
    if (!this.playerStats[userId]) {
      this.playerStats[userId] = {};
      console.log(`Created player stats object for user: ${userId}`);
    }

    if (!this.playerStats[userId][playerName]) {
      this.playerStats[userId][playerName] = {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        appearances: 0
      };
      console.log(`Created stats for new player: ${playerName}`);
    }

    // Update stat
    this.playerStats[userId][playerName][statType]++;
    console.log(`Updated ${statType} for ${playerName}: ${this.playerStats[userId][playerName][statType]}`);
    
    // Save stats immediately after update
    this._saveStats();
    
    // Log current player stats for debugging
    console.log('Current player stats:', JSON.stringify(this.playerStats));
  }

  /**
   * Get current game ID (simple implementation)
   * @returns {string} - Game ID
   * @private
   */
  _getCurrentGameId() {
    // For now, just use the current date as the game ID
    const now = new Date();
    return `game_${now.toISOString().split('T')[0]}`;
  }

  /**
   * Save statistics to storage
   * @private
   */
  _saveStats() {
    storage.save(STORAGE_KEYS.GAME_STATS, this.gameStats);
    storage.save(STORAGE_KEYS.PLAYER_STATS, this.playerStats);
    storage.save(STORAGE_KEYS.TEAM_STATS, this.teamStats);
    console.log('Stats saved to storage');
  }
  
  /**
   * Sync statistics with server
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   * @private
   */
  _syncWithServer(eventType, eventData) {
    // Only sync if user is authenticated
    if (!authService.isUserAuthenticated()) {
      return;
    }
    
    const userId = authService.getCurrentUser()?.id;
    if (!userId) return;
    
    // Prepare data for API
    const syncData = {
      userId,
      eventType,
      eventData,
      timestamp: Date.now(),
      gameId: this._getCurrentGameId()
    };
    
    // Send to API (don't wait for response)
    apiService.sendGameStats(syncData)
      .then(response => {
        console.log('Stats synced with server:', response);
      })
      .catch(error => {
        console.error('Error syncing stats with server:', error);
      });
  }
  /**
   * Rebuild player statistics from existing game data
   * This can be used to fix player stats that weren't properly tracked
   */
  rebuildPlayerStats() {
    if (!authService.isUserAuthenticated()) {
      console.warn('Cannot rebuild player stats: User not authenticated');
      return false;
    }

    const userId = authService.getCurrentUser()?.id;
    if (!userId) return false;

    console.log('Rebuilding player stats from game data...');
    
    // Reset player stats for this user
    this.playerStats[userId] = {};
    
    // Go through all game events and rebuild player stats
    if (this.gameStats[userId]) {
      Object.values(this.gameStats[userId]).forEach(game => {
        if (game.events && Array.isArray(game.events)) {
          game.events.forEach(event => {
            if (event.type === 'goal' && event.data) {
              // Track goal
              if (event.data.player && event.data.player !== 'Own Goal') {
                this._updatePlayerStat(userId, event.data.player, 'goals');
              }
              
              // Track assist
              if (event.data.assist && event.data.assist !== 'N/A') {
                this._updatePlayerStat(userId, event.data.assist, 'assists');
              }
            } else if (event.type === 'yellow_card' && event.data && event.data.player) {
              this._updatePlayerStat(userId, event.data.player, 'yellowCards');
            } else if (event.type === 'red_card' && event.data && event.data.player) {
              this._updatePlayerStat(userId, event.data.player, 'redCards');
            }
          });
        }
      });
    }
    
    // Save stats
    this._saveStats();
    console.log('Player stats rebuilt successfully');
    return true;
  }
  
  /**
   * Add test data for debugging purposes
   * This should only be used during development
   */
  addTestData() {
    if (!authService.isUserAuthenticated()) {
      console.warn('Cannot add test data: User not authenticated');
      return;
    }

    const userId = authService.getCurrentUser()?.id;
    if (!userId) return;

    const gameId = this._getCurrentGameId();
    
    // Initialize user stats if needed
    if (!this.gameStats[userId]) {
      this.gameStats[userId] = {};
    }

    // Initialize game stats if needed
    if (!this.gameStats[userId][gameId]) {
      this.gameStats[userId][gameId] = {
        startTime: Date.now(),
        events: [],
        summary: {
          goals: 0,
          oppositionGoals: 0,
          yellowCards: 0,
          redCards: 0
        }
      };
    }

    // Add test player stats
    const testPlayers = [
      { name: 'John Smith', goals: 3, assists: 1, yellowCards: 0, redCards: 0 },
      { name: 'Mike Johnson', goals: 1, assists: 2, yellowCards: 1, redCards: 0 },
      { name: 'David Williams', goals: 2, assists: 0, yellowCards: 0, redCards: 0 },
      { name: 'James Brown', goals: 0, assists: 3, yellowCards: 1, redCards: 0 }
    ];

    // Initialize player stats if needed
    if (!this.playerStats[userId]) {
      this.playerStats[userId] = {};
    }

    // Add test players
    testPlayers.forEach(player => {
      this.playerStats[userId][player.name] = {
        goals: player.goals,
        assists: player.assists,
        yellowCards: player.yellowCards,
        redCards: player.redCards,
        appearances: 1
      };

      // Update game summary
      this.gameStats[userId][gameId].summary.goals += player.goals;
      this.gameStats[userId][gameId].summary.yellowCards += player.yellowCards;
      this.gameStats[userId][gameId].summary.redCards += player.redCards;
    });

    // Add opposition goals
    this.gameStats[userId][gameId].summary.oppositionGoals = 2;

    // Save stats
    this._saveStats();
    console.log('Test data added successfully');
  }
}

// Create and export singleton instance
export const statsTracker = new StatsTracker();
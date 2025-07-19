/**
 * Match Storage Service
 * @version 1.0
 */

import { authService } from './auth.js';
import { notificationManager } from './notifications.js';

class MatchStorageService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the Match Storage service
   */
  async init() {
    if (this.initialized) return true;
    
    try {
      console.log('Match Storage service initialized');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Match Storage service:', error);
      return false;
    }
  }

  /**
   * Save match details to Netlify Blob Storage
   * @param {Object} matchData - Match data to save
   * @returns {Promise<Object>} - Result of the save operation
   */
  async saveMatchDetails(matchData, retryCount = 0) {
    if (!this.initialized) {
      await this.init();
    }
    
    if (!authService.isUserAuthenticated()) {
      notificationManager.warning('You must be logged in to save match details');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const user = authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error('User information not available');
      }
      
      // Validate match data before saving
      if (!matchData.title || !matchData.teams || !matchData.gameState) {
        throw new Error('Invalid match data structure');
      }
      
      // Add metadata to the match data
      const dataToSave = {
        ...matchData,
        savedBy: user.id,
        userEmail: user.email,
        savedAt: new Date().toISOString(),
        version: '3.5.2', // Add version tracking
        schema: 'v1' // Add schema version for future migrations
      };
      
      // Generate a unique ID for the match
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Try to save to Netlify Blob Store via serverless function
      const response = await fetch('/.netlify/functions/save-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId,
          matchData: dataToSave,
          userId: user.id,
          userEmail: user.email
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error: ' + response.status);
      }

      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 413) {
          notificationManager.error('Match data too large. Try removing unnecessary data.');
          return { success: false, error: 'Data size limit exceeded' };
        }
        
        // Retry on server errors if not exceeded retry limit
        if (response.status >= 500 && retryCount < 3) {
          notificationManager.info('Save failed. Retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.saveMatchDetails(matchData, retryCount + 1);
        }
        
        throw new Error(`Server error: ${response.status}`);
      }
      
      notificationManager.success('Match details saved successfully');

      // Track usage
      authService.trackUsage('match_saved', { matchId });
      
      // Save a local backup
      try {
        const backupKey = `match_backup_${matchId}`;
        localStorage.setItem(backupKey, JSON.stringify(dataToSave));
      } catch (e) {
        console.warn('Failed to save local backup:', e);
      }

      return { success: true, matchId, ...result };
    } catch (error) {
      console.error('Error saving match details:', error);
      
      if (retryCount < 3 && (
        error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.message.includes('Server error')
      )) {
        notificationManager.info('Save failed. Retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.saveMatchDetails(matchData, retryCount + 1);
      }
      
      notificationManager.error('Failed to save match details: ' + error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get list of saved matches for the current user
   * @returns {Promise<Array>} - List of saved matches
   */
  async getSavedMatches() {
    if (!this.initialized) {
      await this.init();
    }
    
    if (!authService.isUserAuthenticated()) {
      notificationManager.warning('You must be logged in to view saved matches');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const user = authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error('User information not available');
      }
      
      // Try to get saved matches from Netlify serverless function
      const response = await fetch(`/.netlify/functions/get-matches?userId=${encodeURIComponent(user.id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Server returned error: ' + response.status);
      }

      const result = await response.json();
      return { success: true, matches: result.matches };
    } catch (error) {
      console.error('Error getting saved matches:', error);
      notificationManager.error('Failed to retrieve saved matches: ' + error.message);
      return { success: false, error: error.message };
    }
  }

}

// Create and export singleton instance
export const blobStorageService = new MatchStorageService();
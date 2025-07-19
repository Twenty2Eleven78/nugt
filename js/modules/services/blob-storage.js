/**
 * Netlify Blob Storage Service
 * @version 1.0
 */

import { authService } from './auth.js';
import { notificationManager } from './notifications.js';

class BlobStorageService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the Blob Storage service
   */
  async init() {
    if (this.initialized) return true;
    
    try {
      console.log('Blob Storage service initialized');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Blob Storage service:', error);
      return false;
    }
  }

  /**
   * Save match details to Netlify Blob Storage
   * @param {Object} matchData - Match data to save
   * @returns {Promise<Object>} - Result of the save operation
   */
  async saveMatchDetails(matchData) {
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
      
      // Add metadata to the match data
      const dataToSave = {
        ...matchData,
        savedBy: user.id,
        userEmail: user.email,
        savedAt: new Date().toISOString()
      };
      
      // Generate a unique ID for the match
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Save to Netlify Blob Store via serverless function
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save match details');
      }
      
      const result = await response.json();
      notificationManager.success('Match details saved successfully');
      
      // Track usage
      authService.trackUsage('match_saved', { matchId });
      
      return { success: true, matchId, ...result };
    } catch (error) {
      console.error('Error saving match details:', error);
      notificationManager.danger('Failed to save match details: ' + error.message);
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
      
      // Get saved matches from Netlify Blob Store via serverless function
      const response = await fetch(`/.netlify/functions/get-matches?userId=${encodeURIComponent(user.id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to retrieve saved matches');
      }
      
      const result = await response.json();
      return { success: true, matches: result.matches };
    } catch (error) {
      console.error('Error getting saved matches:', error);
      notificationManager.danger('Failed to retrieve saved matches: ' + error.message);
      return { success: false, error: error.message };
    }
  }

}

// Create and export singleton instance
export const blobStorageService = new BlobStorageService();
/**
 * Netlify Blob Storage Service
 * @version 1.0
 */

import { authService } from '../services/auth.js';
import { notificationManager } from './notifications.js';

// Create BlobStorageService class
const BlobStorageService = (function() {
  function BlobStorageService() {
    this.initialized = false;
    this.netlifyIdentity = null;
    this._initializationPromise = null;
  }
  constructor() {
    this.initialized = false;
    this.netlifyIdentity = null;
    this._initializationPromise = null;
  }

  /**
   * Initialize the Blob Storage service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async init() {
    // If already initialized, return cached result
    if (this.initialized) return true;

    // If initialization is in progress, wait for it
    if (this._initializationPromise) {
      return this._initializationPromise;
    }

    this._initializationPromise = (async () => {
      try {
        // Check if Netlify Identity is available
        if (window.netlifyIdentity) {
          this.netlifyIdentity = window.netlifyIdentity;
          console.log('Netlify Blob Storage service initialized');
          this.initialized = true;
          return true;
        } else {
          console.warn('Netlify Identity not found, blob storage will not be available');
          return false;
        }
      } catch (error) {
        console.error('Failed to initialize Netlify Blob Storage service:', error);
        return false;
      } finally {
        this._initializationPromise = null;
      }
    })();

    return this._initializationPromise;
  }

  /**
   * Save match details to Netlify Blob Storage
   * @param {Object} matchData - Match data to save
   * @returns {Promise<Object>} - Result of the save operation
   */
  async saveMatchDetails(matchData) {
    try {
      if (!this.initialized) {
        await this.init();
        if (!this.initialized) {
          throw new Error('Failed to initialize Blob Storage service');
        }
      }
      
      if (!authService.isUserAuthenticated()) {
        notificationManager.warning('You must be logged in to save match details');
        return { success: false, error: 'Not authenticated' };
      }
      
      if (!matchData || typeof matchData !== 'object') {
        throw new Error('Invalid match data format');
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
      
      // Get Netlify Identity token
      const token = await this._getAuthToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      
      // Save to Netlify Blob Store
      const response = await fetch('/.netlify/functions/save-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId,
          matchData: dataToSave
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
      
      // Get Netlify Identity token
      const token = await this._getAuthToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      
      // Get saved matches from Netlify Blob Store
      const response = await fetch('/.netlify/functions/get-matches', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
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
  
  /**
   * Get authentication token from Netlify Identity
   * @returns {Promise<string>} - Authentication token
   * @private
   */
  async _getAuthToken() {
    if (!this.netlifyIdentity) {
      return null;
    }
    
    return new Promise((resolve) => {
      this.netlifyIdentity.refresh(jwt => {
        resolve(jwt);
      });
    });
  }
}

// Create and export singleton instance
export const blobStorageService = new BlobStorageService();
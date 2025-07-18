/**
 * Netlify Blob Storage Service
 * @version 1.0
 */

import { gameState } from '../data/state.js';
import { notificationManager } from './notifications.js';
import { getStore } from '@netlify/blobs';

class BlobStorageService {
  constructor() {
    // Initialization, if needed
  }

  /**
   * Saves the current match data to Netlify Blob storage.
   */
  async saveMatchToCloud() {
    notificationManager.info('Saving match data to the cloud...');

    try {
      const matchData = {
        gameState: gameState,
        // Add any other data you want to save
      };

      const store = getStore('match-data');
      const key = `match-${Date.now()}.json`;

      await store.setJSON(key, matchData);

      notificationManager.success('Match data saved to the cloud successfully!');
    } catch (error) {
      console.error('Error saving match data to cloud:', error);
      notificationManager.error('Failed to save match data. Please try again.');
    }
  }
}

export const blobStorageService = new BlobStorageService();

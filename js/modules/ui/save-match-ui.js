/**
 * Save Match UI Module
 * @version 1.0
 */

import { authService } from '../services/auth.js';
import { blobStorageService } from '../services/blob-storage.js';
import { gameState } from '../data/state.js';
import { storage } from '../data/storage.js';
import { STORAGE_KEYS } from '../shared/constants.js';
import { notificationManager } from '../services/notifications.js';
import { rosterManager } from '../match/roster.js';
import { hideModal } from './modals.js';

class SaveMatchUI {
  constructor() {
    this.initialized = false;
    this.saveMatchBtn = null;
    this.saveMatchForm = null;
    this.saveMatchAuthRequired = null;
    this.saveMatchStatus = null;
    this.matchTitleInput = null;
    this.matchNotesInput = null;
    this.includeRosterCheckbox = null;
  }

  /**
   * Initialize the Save Match UI
   */
  init() {
    if (this.initialized) return;

    // Cache DOM elements
    this.saveMatchBtn = document.getElementById('saveMatchBtn');
    this.saveMatchForm = document.getElementById('saveMatchForm');
    this.saveMatchAuthRequired = document.getElementById('saveMatchAuthRequired');
    this.saveMatchStatus = document.getElementById('saveMatchStatus');
    this.matchTitleInput = document.getElementById('matchTitle');
    this.matchNotesInput = document.getElementById('matchNotes');
    this.includeRosterCheckbox = document.getElementById('includeRoster');
    
    // Bind event listeners
    if (this.saveMatchBtn) {
      this.saveMatchBtn.addEventListener('click', () => this.handleSaveMatch());
    }
    
    // Initialize Netlify blob storage service
    blobStorageService.init();
    
    this.initialized = true;
  }

  /**
   * Show the save match modal
   */
  showSaveMatchModal() {
    // Check if user is authenticated
    const isAuthenticated = authService.isUserAuthenticated();
    
    if (this.saveMatchForm) {
      this.saveMatchForm.classList.toggle('d-none', !isAuthenticated);
    }
    
    if (this.saveMatchAuthRequired) {
      this.saveMatchAuthRequired.classList.toggle('d-none', isAuthenticated);
    }
    
    if (this.saveMatchBtn) {
      this.saveMatchBtn.disabled = !isAuthenticated;
    }
    
    // Pre-populate match title with team names
    if (this.matchTitleInput && isAuthenticated) {
      const team1Name = storage.load(STORAGE_KEYS.TEAM1_NAME, 'Netherton');
      const team2Name = storage.load(STORAGE_KEYS.TEAM2_NAME, 'Opposition Team');
      const team1Score = storage.load(STORAGE_KEYS.FIRST_SCORE, 0);
      const team2Score = storage.load(STORAGE_KEYS.SECOND_SCORE, 0);
      
      this.matchTitleInput.value = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
    }
    
    // Show the modal
    const saveMatchModal = new bootstrap.Modal(document.getElementById('saveMatchModal'));
    saveMatchModal.show();
  }

  /**
   * Handle save match button click
   */
  async handleSaveMatch() {
    if (!authService.isUserAuthenticated()) {
      notificationManager.warning('You must be logged in to save match details');
      return;
    }
    
    try {
      // Show loading state
      this.saveMatchBtn.disabled = true;
      this.saveMatchBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
      
      if (this.saveMatchStatus) {
        this.saveMatchStatus.innerHTML = '<div class="alert alert-info">Saving match details...</div>';
      }
      
      // Get match data
      const matchData = this.collectMatchData();
      
      // Save to Netlify blob storage
      const result = await blobStorageService.saveMatchDetails(matchData);
      
      if (result.success) {
        if (this.saveMatchStatus) {
          this.saveMatchStatus.innerHTML = '<div class="alert alert-success">Match saved successfully!</div>';
        }
        
        // Close modal after a delay
        setTimeout(() => {
          hideModal('saveMatchModal');
          notificationManager.success('Match details saved to cloud storage');
        }, 1500);
      } else {
        if (this.saveMatchStatus) {
          this.saveMatchStatus.innerHTML = `<div class="alert alert-danger">Error: ${result.error || 'Failed to save match'}</div>`;
        }
      }
    } catch (error) {
      console.error('Error saving match:', error);
      
      if (this.saveMatchStatus) {
        this.saveMatchStatus.innerHTML = `<div class="alert alert-danger">Error: ${error.message || 'Unknown error'}</div>`;
      }
    } finally {
      // Reset button state
      if (this.saveMatchBtn) {
        this.saveMatchBtn.disabled = false;
        this.saveMatchBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Match';
      }
    }
  }

  /**
   * Collect all match data to be saved
   * @returns {Object} Match data
   */
  collectMatchData() {
    // Get basic match info
    const matchTitle = this.matchTitleInput ? this.matchTitleInput.value.trim() : '';
    const matchNotes = this.matchNotesInput ? this.matchNotesInput.value.trim() : '';
    const includeRoster = this.includeRosterCheckbox ? this.includeRosterCheckbox.checked : true;
    
    // Get team info
    const team1Name = storage.load(STORAGE_KEYS.TEAM1_NAME, 'Netherton');
    const team2Name = storage.load(STORAGE_KEYS.TEAM2_NAME, 'Opposition Team');
    const team1Score = storage.load(STORAGE_KEYS.FIRST_SCORE, 0);
    const team2Score = storage.load(STORAGE_KEYS.SECOND_SCORE, 0);
    
    // Get match data
    const matchData = {
      title: matchTitle || `${team1Name} vs ${team2Name}`,
      notes: matchNotes,
      timestamp: Date.now(),
      gameState: {
        seconds: gameState.seconds,
        isSecondHalf: gameState.isSecondHalf,
        gameTime: gameState.gameTime
      },
      teams: {
        team1: {
          name: team1Name,
          score: team1Score
        },
        team2: {
          name: team2Name,
          score: team2Score
        }
      },
      goals: gameState.goals,
      events: gameState.matchEvents,
      appVersion: '3.5.2'
    };
    
    // Add roster if requested
    if (includeRoster) {
      matchData.roster = rosterManager.getRoster();
    }
    
    return matchData;
  }
}

// Create and export singleton instance
export const saveMatchUI = new SaveMatchUI();
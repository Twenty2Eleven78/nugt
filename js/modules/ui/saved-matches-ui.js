/**
 * Saved Matches UI Module
 * @version 1.0
 */

import { authService } from '../services/auth.js';
import { blobStorageService } from '../services/blob-storage.js';
import { notificationManager } from '../services/notifications.js';
import { formatTime } from '../shared/utils.js';

class SavedMatchesUI {
  constructor() {
    this.initialized = false;
    this.refreshBtn = null;
    this.savedMatchesList = null;
    this.savedMatchesAuthRequired = null;
    this.savedMatchesLoading = null;
    this.savedMatchesError = null;
    this.savedMatchesErrorText = null;
    this.noSavedMatches = null;
    this.savedMatchesContent = null;
  }

  /**
   * Initialize the Saved Matches UI
   */
  init() {
    if (this.initialized) return;

    // Cache DOM elements
    this.refreshBtn = document.getElementById('refreshSavedMatchesBtn');
    this.savedMatchesList = document.getElementById('savedMatchesList');
    this.savedMatchesAuthRequired = document.getElementById('savedMatchesAuthRequired');
    this.savedMatchesLoading = document.getElementById('savedMatchesLoading');
    this.savedMatchesError = document.getElementById('savedMatchesError');
    this.savedMatchesErrorText = document.getElementById('savedMatchesErrorText');
    this.noSavedMatches = document.getElementById('noSavedMatches');
    this.savedMatchesContent = document.getElementById('savedMatchesContent');
    
    // Bind event listeners
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => this.loadSavedMatches());
    }
    
    // Add event listener for modal show
    const savedMatchesModal = document.getElementById('savedMatchesModal');
    if (savedMatchesModal) {
      savedMatchesModal.addEventListener('show.bs.modal', () => this.onModalShow());
    }
    
    this.initialized = true;
  }

  /**
   * Handle modal show event
   */
  onModalShow() {
    // Check if user is authenticated
    const isAuthenticated = authService.isUserAuthenticated();
    
    if (this.savedMatchesList) {
      this.savedMatchesList.classList.toggle('d-none', !isAuthenticated);
    }
    
    if (this.savedMatchesAuthRequired) {
      this.savedMatchesAuthRequired.classList.toggle('d-none', isAuthenticated);
    }
    
    if (this.refreshBtn) {
      this.refreshBtn.disabled = !isAuthenticated;
    }
    
    if (isAuthenticated) {
      this.loadSavedMatches();
    }
  }

  /**
   * Load saved matches
   */
  async loadSavedMatches() {
    if (!authService.isUserAuthenticated()) {
      return;
    }
    
    // Show loading state
    this._showLoadingState();
    
    try {
      // Get saved matches
      const result = await blobStorageService.getSavedMatches();
      
      if (result.success) {
        this._renderSavedMatches(result.matches, result.local);
      } else {
        this._showErrorState(result.error || 'Failed to load saved matches');
      }
    } catch (error) {
      console.error('Error loading saved matches:', error);
      this._showErrorState(error.message || 'Unknown error');
    }
  }

  /**
   * Render saved matches
   * @param {Array} matches - List of saved matches
   * @param {boolean} isLocal - Whether the matches are from local storage
   */
  _renderSavedMatches(matches, isLocal) {
    // Hide loading and error states
    this._hideAllStates();
    
    // Check if there are any matches
    if (!matches || matches.length === 0) {
      if (this.noSavedMatches) {
        this.noSavedMatches.classList.remove('d-none');
      }
      return;
    }
    
    // Show matches content
    if (this.savedMatchesContent) {
      this.savedMatchesContent.classList.remove('d-none');
    }
    
    // Get the list element
    const listElement = document.getElementById('savedMatchesListItems');
    if (!listElement) return;
    
    // Clear existing content
    listElement.innerHTML = '';
    
    // Sort matches by timestamp (newest first)
    const sortedMatches = [...matches].sort((a, b) => {
      const timestampA = a.data.timestamp || a.data.savedAt || 0;
      const timestampB = b.data.timestamp || b.data.savedAt || 0;
      return timestampB - timestampA;
    });
    
    // Add matches to the list
    sortedMatches.forEach(match => {
      const matchData = match.data;
      const matchDate = new Date(matchData.timestamp || matchData.savedAt || 0);
      const team1 = matchData.teams?.team1 || {};
      const team2 = matchData.teams?.team2 || {};
      
      const matchElement = document.createElement('div');
      matchElement.className = 'list-group-item list-group-item-action';
      
      const matchTitle = matchData.title || `${team1.name || 'Team 1'} vs ${team2.name || 'Team 2'}`;
      const matchScore = `${team1.score || 0} - ${team2.score || 0}`;
      const matchTime = formatTime(matchData.gameState?.seconds || 0);
      
      matchElement.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${matchTitle}</h5>
          <small>${matchDate.toLocaleDateString()}</small>
        </div>
        <p class="mb-1">Score: ${matchScore} | Time: ${matchTime}</p>
        <small>
          ${isLocal ? '<span class="badge bg-warning text-dark">Saved Locally</span>' : '<span class="badge bg-success">Saved to Cloud</span>'}
          <button class="btn btn-sm btn-primary float-end load-match-btn" data-match-id="${match.id}">
            <i class="fas fa-download me-1"></i>Load Match
          </button>
        </small>
      `;
      
      // Add click event for the load button
      const loadBtn = matchElement.querySelector('.load-match-btn');
      if (loadBtn) {
        loadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._loadMatch(match.id, matchData);
        });
      }
      
      listElement.appendChild(matchElement);
    });
  }

  /**
   * Load a saved match
   * @param {string} matchId - Match ID
   * @param {Object} matchData - Match data
   */
  _loadMatch(matchId, matchData) {
    // This would be implemented to load the match data into the app
    console.log('Loading match:', matchId, matchData);
    notificationManager.info('Match loading functionality will be implemented in a future update');
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('savedMatchesModal'));
    if (modal) {
      modal.hide();
    }
  }

  /**
   * Show loading state
   */
  _showLoadingState() {
    this._hideAllStates();
    if (this.savedMatchesLoading) {
      this.savedMatchesLoading.classList.remove('d-none');
    }
  }

  /**
   * Show error state
   * @param {string} error - Error message
   */
  _showErrorState(error) {
    this._hideAllStates();
    if (this.savedMatchesError) {
      this.savedMatchesError.classList.remove('d-none');
    }
    if (this.savedMatchesErrorText) {
      this.savedMatchesErrorText.textContent = error || 'Unknown error';
    }
  }

  /**
   * Hide all states
   */
  _hideAllStates() {
    if (this.savedMatchesLoading) {
      this.savedMatchesLoading.classList.add('d-none');
    }
    if (this.savedMatchesError) {
      this.savedMatchesError.classList.add('d-none');
    }
    if (this.noSavedMatches) {
      this.noSavedMatches.classList.add('d-none');
    }
    if (this.savedMatchesContent) {
      this.savedMatchesContent.classList.add('d-none');
    }
  }
}

// Create and export singleton instance
export const savedMatchesUI = new SavedMatchesUI();
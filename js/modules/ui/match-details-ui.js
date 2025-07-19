/**
 * Match Details UI Module
 * @version 1.0
 */

import { formatTime } from '../shared/utils.js';
import { matchLoader } from '../services/match-loader.js';
import { hideModal } from './modals.js';

class MatchDetailsUI {
  constructor() {
    this.initialized = false;
    this.modal = null;
    this.modalTitle = null;
    this.modalBody = null;
    this.loadMatchBtn = null;
    this.currentMatchData = null;
  }

  /**
   * Initialize the Match Details UI
   */
  init() {
    if (this.initialized) return;

    // Create the modal if it doesn't exist
    this._createModal();
    
    this.initialized = true;
  }

  /**
   * Show match details
   * @param {string} matchId - Match ID
   * @param {Object} matchData - Match data
   */
  showMatchDetails(matchId, matchData) {
    if (!this.initialized) {
      this.init();
    }
    
    this.currentMatchData = matchData;
    
    // Set modal title
    if (this.modalTitle) {
      const title = matchData.title || 'Match Details';
      this.modalTitle.textContent = title;
    }
    
    // Set modal body
    if (this.modalBody) {
      this.modalBody.innerHTML = this._generateMatchDetailsHTML(matchData);
    }
    
    // Show the modal
    if (this.modal) {
      this.modal.show();
    }
  }

  /**
   * Load the current match
   */
  loadCurrentMatch() {
    if (!this.currentMatchData) return;
    
    // Load the match
    const success = matchLoader.loadMatch(this.currentMatchData);
    
    if (success) {
      // Hide the modal
      if (this.modal) {
        this.modal.hide();
      }
      
      // Also hide the saved matches modal
      hideModal('savedMatchesModal');
    }
  }

  /**
   * Create the match details modal
   * @private
   */
  _createModal() {
    // Check if modal already exists
    let modalElement = document.getElementById('matchDetailsModal');
    
    if (!modalElement) {
      // Create modal element
      modalElement = document.createElement('div');
      modalElement.className = 'modal fade';
      modalElement.id = 'matchDetailsModal';
      modalElement.tabIndex = '-1';
      modalElement.setAttribute('aria-labelledby', 'matchDetailsModalLabel');
      modalElement.setAttribute('aria-hidden', 'true');
      
      // Set modal HTML
      modalElement.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="matchDetailsModalLabel">Match Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="matchDetailsModalBody">
              <!-- Match details will be inserted here -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" id="loadMatchBtn">
                <i class="fas fa-download me-2"></i>Load Match
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to document
      document.body.appendChild(modalElement);
    }
    
    // Cache elements
    this.modalElement = modalElement;
    this.modalTitle = modalElement.querySelector('.modal-title');
    this.modalBody = modalElement.querySelector('.modal-body');
    this.loadMatchBtn = modalElement.querySelector('#loadMatchBtn');
    
    // Initialize Bootstrap modal
    this.modal = new bootstrap.Modal(modalElement);
    
    // Add event listener for load button
    if (this.loadMatchBtn) {
      this.loadMatchBtn.addEventListener('click', () => this.loadCurrentMatch());
    }
  }

  /**
   * Generate HTML for match details
   * @param {Object} matchData - Match data
   * @returns {string} - HTML string
   * @private
   */
  _generateMatchDetailsHTML(matchData) {
    const teams = matchData.teams || {};
    const team1 = teams.team1 || {};
    const team2 = teams.team2 || {};
    const gameState = matchData.gameState || {};
    const goals = Array.isArray(matchData.goals) ? matchData.goals : [];
    const events = Array.isArray(matchData.events) ? matchData.events : [];
    const roster = Array.isArray(matchData.roster) ? matchData.roster : [];
    
    const matchDate = new Date(matchData.timestamp || matchData.savedAt || Date.now());
    const formattedDate = matchDate.toLocaleDateString() + ' ' + matchDate.toLocaleTimeString();
    
    let html = `
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">Match Summary</h5>
          <div class="row text-center">
            <div class="col-5">
              <h2>${team1.name || 'Team 1'}</h2>
              <h1>${team1.score || 0}</h1>
            </div>
            <div class="col-2">
              <h2>vs</h2>
            </div>
            <div class="col-5">
              <h2>${team2.name || 'Team 2'}</h2>
              <h1>${team2.score || 0}</h1>
            </div>
          </div>
          <div class="text-center mt-2">
            <p>Game Time: ${formatTime(gameState.seconds || 0)}</p>
            <p>Saved: ${formattedDate}</p>
          </div>
        </div>
      </div>
    `;
    
    // Add goals section if there are goals
    if (goals.length > 0) {
      html += `
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Goals</h5>
            <ul class="list-group">
      `;
      
      goals.forEach(goal => {
        const scorer = goal.scorer || 'Unknown';
        const assist = goal.assist || 'N/A';
        const time = formatTime(goal.time || 0);
        const team = goal.team === 'opposition' ? team2.name : team1.name;
        
        html += `
          <li class="list-group-item">
            ${time} - ${scorer} (${team})
            ${assist !== 'N/A' ? `<small class="text-muted">Assist: ${assist}</small>` : ''}
          </li>
        `;
      });
      
      html += `
            </ul>
          </div>
        </div>
      `;
    }
    
    // Add events section if there are events
    if (events.length > 0) {
      html += `
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Match Events</h5>
            <ul class="list-group">
      `;
      
      events.forEach(event => {
        const type = event.type || 'Event';
        const time = formatTime(event.time || 0);
        const notes = event.notes || '';
        
        html += `
          <li class="list-group-item">
            ${time} - ${type}
            ${notes ? `<small class="text-muted d-block">${notes}</small>` : ''}
          </li>
        `;
      });
      
      html += `
            </ul>
          </div>
        </div>
      `;
    }
    
    // Add roster section if there is a roster
    if (roster.length > 0) {
      html += `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Team Roster</h5>
            <div class="row">
      `;
      
      roster.forEach(player => {
        html += `
          <div class="col-6 col-md-4 mb-2">
            ${player.name}
            ${player.shirtNumber ? `<span class="badge bg-secondary">#${player.shirtNumber}</span>` : ''}
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
    }
    
    return html;
  }
}

// Create and export singleton instance
export const matchDetailsUI = new MatchDetailsUI();
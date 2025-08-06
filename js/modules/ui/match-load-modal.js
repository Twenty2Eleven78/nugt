/**
 * Match Load Modal UI Component
 */

import { CustomModal } from '../shared/custom-modal.js';
import { matchSummaryModal } from './match-summary-modal.js';
import { rawDataModal } from './raw-data-modal.js';

class MatchLoadModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
    this.onLoad = null;
  }

  /**
   * Initialize the match load modal
   */
  init() {
    if (this.isInitialized) return;
    
    this._createModal();
    this._bindEventListeners();
    this.isInitialized = true;
  }

  /**
   * Show the match load modal
   * @param {Array} matches An array of match data objects
   * @param {Function} onLoad Callback function when a match is selected
   */
  show(matches, onLoad) {
    this.onLoad = onLoad;
    this.allMatches = matches || [];

    if (!this.modal) return;

    this._renderMatches(this.allMatches);

    // Show modal using custom modal system
    this.modal.show();
  }

  /**
   * Render matches as cards
   * @private
   */
  _renderMatches(matches) {
    const matchListElement = document.getElementById('matchLoadList');
    const matchCountElement = document.getElementById('matchCount');
    
    if (!matchListElement) return;

    matchListElement.innerHTML = '';
    
    // Update match count
    if (matchCountElement) {
      const totalMatches = this.allMatches ? this.allMatches.length : 0;
      const displayedMatches = matches ? matches.length : 0;
      
      if (totalMatches === displayedMatches) {
        matchCountElement.textContent = `${totalMatches} match${totalMatches !== 1 ? 'es' : ''} found`;
      } else {
        matchCountElement.textContent = `Showing ${displayedMatches} of ${totalMatches} matches`;
      }
    }

    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        const matchDate = new Date(match.savedAt);
        const formattedDate = matchDate.toLocaleDateString();
        const formattedTime = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Create team vs team display
        const teamsDisplay = match.team1Name && match.team2Name 
          ? `${match.team1Name} vs ${match.team2Name}`
          : 'Match Details';
        
        // Create score display if available
        const scoreDisplay = (match.score1 !== undefined && match.score2 !== undefined)
          ? `<div class="text-center mb-2">
               <span class="badge bg-primary fs-6">${match.score1} - ${match.score2}</span>
             </div>`
          : '';

        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-6';
        
        cardCol.innerHTML = `
          <div class="card h-100 border-0 shadow-sm match-card" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="card-title mb-0 text-primary fw-bold">${this._escapeHtml(match.title)}</h6>
                <small class="text-muted text-nowrap ms-2">${formattedDate}</small>
              </div>
              
              <div class="text-muted small mb-2">
                <i class="fas fa-futbol me-1"></i>${teamsDisplay}
              </div>
              
              ${scoreDisplay}
              
              <div class="text-muted small mb-3">
                <i class="fas fa-clock me-1"></i>${formattedTime}
                ${match.notes ? `<div class="mt-1"><i class="fas fa-sticky-note me-1"></i>${this._escapeHtml(match.notes.substring(0, 50))}${match.notes.length > 50 ? '...' : ''}</div>` : ''}
              </div>
              
              <div class="d-flex gap-2">
                <button class="btn btn-primary btn-sm flex-fill view-btn" data-match-index="${index}">
                  <i class="fas fa-eye me-1"></i>View Details
                </button>
                <button class="btn btn-outline-secondary btn-sm raw-data-btn" data-match-index="${index}" title="View Raw Data">
                  <i class="fas fa-code"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        
        // Add hover effects
        const card = cardCol.querySelector('.match-card');
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = '';
        });
        
        // Add click handlers
        cardCol.querySelector('.view-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          matchSummaryModal.show(match);
        });
        
        cardCol.querySelector('.raw-data-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          rawDataModal.show(match);
        });
        
        // Make entire card clickable to view details
        card.addEventListener('click', () => {
          matchSummaryModal.show(match);
        });
        
        matchListElement.appendChild(cardCol);
      });
    } else {
      matchListElement.innerHTML = `
        <div class="col-12">
          <div class="text-center text-muted py-5">
            <i class="fas fa-cloud fa-3x mb-3 opacity-50"></i>
            <h5>No saved matches found</h5>
            <p>You haven't saved any matches to the cloud yet.</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  /**
   * Hide the match load modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Create the match load modal
   * @private
   */
  _createModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('matchLoadModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
      <div class="modal fade" id="matchLoadModal" tabindex="-1" aria-labelledby="matchLoadModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-gradient text-white" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <div class="d-flex align-items-center">
                <div class="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                  <i class="fas fa-cloud-download-alt fa-lg"></i>
                </div>
                <div>
                  <h5 class="modal-title mb-0" id="matchLoadModalLabel">Load Match from Cloud</h5>
                  <small class="opacity-75">Select a match to load</small>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
              <div class="p-3 bg-light border-bottom">
                <div class="input-group mb-2">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="fas fa-search text-muted"></i>
                  </span>
                  <input type="text" class="form-control border-start-0" id="matchSearchInput" 
                         placeholder="Search matches by title, teams, or date...">
                </div>
                <div id="matchCount" class="small text-muted"></div>
              </div>
              <div class="p-3" style="max-height: 60vh; overflow-y: auto;">
                <div id="matchLoadList" class="row g-3">
                  <!-- Match cards will be populated here -->
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-secondary" id="cancelMatchLoadBtn">
                <i class="fas fa-times me-2"></i>Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('matchLoadModal');
  }

  /**
   * Bind event listeners for the modal
   * @private
   */
  _bindEventListeners() {
    // Handle cancel button click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'cancelMatchLoadBtn') {
        this.hide();
      }
    });

    // Handle search input
    document.addEventListener('input', (e) => {
      if (e.target.id === 'matchSearchInput') {
        this._filterMatches(e.target.value);
      }
    });
  }

  /**
   * Filter matches based on search term
   * @private
   */
  _filterMatches(searchTerm) {
    if (!this.allMatches) return;

    const filteredMatches = searchTerm.trim() 
      ? this.allMatches.filter(match => {
          const title = (match.title || '').toLowerCase();
          const notes = (match.notes || '').toLowerCase();
          const team1 = (match.team1Name || '').toLowerCase();
          const team2 = (match.team2Name || '').toLowerCase();
          const date = new Date(match.savedAt).toLocaleDateString().toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          
          return title.includes(searchLower) || 
                 notes.includes(searchLower) || 
                 team1.includes(searchLower) || 
                 team2.includes(searchLower) || 
                 date.includes(searchLower);
        })
      : this.allMatches;

    this._renderMatches(filteredMatches);
  }
}

// Create and export singleton instance
export const matchLoadModal = new MatchLoadModal();

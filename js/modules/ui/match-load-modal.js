/**
 * Match Load Modal UI Component
 */

import { CustomModal } from '../shared/custom-modal.js';
import { matchSummaryModal } from './match-summary-modal.js';
import { rawDataModal } from './raw-data-modal.js';
import { userMatchesApi } from '../services/user-matches-api.js';
import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';

class MatchLoadModal {
  constructor() {
    this.modal = null;
    this.deleteModal = null;
    this.isInitialized = false;
    this.onLoad = null;
    this.currentDeleteMatch = null;
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
   * Render matches as simple list items
   * @private
   */
  _renderMatches(matches) {
    const matchListElement = document.getElementById('matchLoadList');
    if (!matchListElement) return;

    matchListElement.innerHTML = '';

    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        const matchDate = new Date(match.savedAt);
        const formattedDate = matchDate.toLocaleDateString();
        const formattedTime = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Create team vs team display
        const teamsDisplay = match.team1Name && match.team2Name
          ? `${match.team1Name} vs ${match.team2Name}`
          : '';

        // Create score display if available
        const scoreDisplay = (match.score1 !== undefined && match.score2 !== undefined)
          ? ` (${match.score1}-${match.score2})`
          : '';

        const listItem = document.createElement('div');
        listItem.className = 'card shadow-sm mb-3';
        listItem.style.borderRadius = '12px';
        listItem.style.border = '1px solid #e0e0e0';
        listItem.style.transition = 'all 0.2s ease';
        listItem.style.cursor = 'pointer';

        listItem.innerHTML = `
          <div class="card-body" style="padding: 1.25rem;">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1 me-3">
                <div class="d-flex align-items-center mb-1">
                  <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" 
                       style="width: 28px; height: 28px;">
                    <i class="fas fa-user text-primary" style="font-size: 0.7rem;"></i>
                  </div>
                  <div class="min-width-0">
                    <div class="fw-bold text-truncate" style="font-size: 0.9rem;">${this._escapeHtml(match.title)}</div>
                    <div class="text-muted text-truncate" style="font-size: 0.75rem;">Personal Match</div>
                  </div>
                </div>
                ${teamsDisplay ? `<div class="text-primary mb-1" style="font-size: 0.8rem;"><i class="fas fa-futbol me-1"></i>${this._escapeHtml(teamsDisplay)}${scoreDisplay}</div>` : ''}
                <div class="text-muted" style="font-size: 0.75rem;">
                  <i class="fas fa-calendar me-1"></i>${formattedDate} ${formattedTime}
                </div>
                ${match.notes ? `<div class="text-muted mt-1" style="font-size: 0.75rem;"><i class="fas fa-sticky-note me-1"></i>${this._escapeHtml(match.notes.substring(0, 50))}${match.notes.length > 50 ? '...' : ''}</div>` : ''}
              </div>
              <div class="d-flex flex-column gap-1 flex-shrink-0" style="padding: 0.25rem;">
                <!-- View and Raw Data on same line -->
                <div class="d-flex gap-1">
                  <button class="btn btn-primary btn-sm view-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="View Match">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm raw-data-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="View Raw Data">
                    <i class="fas fa-code"></i>
                  </button>
                </div>
                <!-- Delete on next line -->
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-danger btn-sm delete-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="Delete Match">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Add hover effects
        listItem.addEventListener('mouseenter', () => {
          listItem.style.transform = 'translateY(-2px)';
          listItem.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          listItem.style.borderColor = '#c0c0c0';
        });

        listItem.addEventListener('mouseleave', () => {
          listItem.style.transform = 'translateY(0)';
          listItem.style.boxShadow = '';
          listItem.style.borderColor = '#e0e0e0';
        });

        // Add click handlers
        listItem.querySelector('.view-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          matchSummaryModal.show(match);
        });

        listItem.querySelector('.raw-data-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          rawDataModal.show(match);
        });

        listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this._handleDeleteMatch(match, index);
        });

        // Add hover effects
        listItem.addEventListener('mouseenter', () => {
          listItem.style.transform = 'translateY(-2px)';
          listItem.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          listItem.style.borderColor = '#c0c0c0';
        });

        listItem.addEventListener('mouseleave', () => {
          listItem.style.transform = 'translateY(0)';
          listItem.style.boxShadow = '';
          listItem.style.borderColor = '#e0e0e0';
        });

        // Make entire card clickable to view match
        listItem.addEventListener('click', () => {
          matchSummaryModal.show(match);
        });

        matchListElement.appendChild(listItem);
      });
    } else {
      matchListElement.innerHTML = `
        <div class="card shadow-sm" style="border-radius: 12px; border: 1px solid #e0e0e0;">
          <div class="card-body text-center text-muted" style="padding: 2rem;">
            <i class="fas fa-cloud fa-3x mb-3 opacity-50"></i>
            <h6>No saved matches found</h6>
            <small>Try adjusting your search or save some matches first</small>
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
            <div class="modal-header">
              <h5 class="modal-title" id="matchLoadModalLabel">Load Match from Cloud</h5>
                <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <input type="text" class="form-control" id="matchSearchInput" 
                       placeholder="Search matches...">
              </div>
              <div style="max-height: 400px; overflow-y: auto;">
                <div id="matchLoadList">
                  <!-- Match list will be populated here -->
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelMatchLoadBtn">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal fade" id="matchLoadDeleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <i class="fas fa-trash"></i> Confirm Deletion
              </h5>
                <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete this match?</p>
              <div class="alert alert-warning">
                <strong>Warning:</strong> This action cannot be undone.
              </div>
              <div id="matchLoadDeleteDetails">
                <!-- Match details will be shown here -->
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelMatchLoadDeleteBtn">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmMatchLoadDeleteBtn">
                <i class="fas fa-trash"></i> Delete Match
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize custom modals
    this.modal = CustomModal.getOrCreateInstance('matchLoadModal');
    this.deleteModal = CustomModal.getOrCreateInstance('matchLoadDeleteModal');
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
      
      // Handle delete confirmation buttons
      if (e.target.id === 'cancelMatchLoadDeleteBtn') {
        this.deleteModal.hide();
        this.currentDeleteMatch = null;
      }
      
      if (e.target.id === 'confirmMatchLoadDeleteBtn') {
        this._handleDeleteConfirm();
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

  /**
   * Handle delete match with confirmation
   * @private
   */
  _handleDeleteMatch(match, matchIndex) {
    this.currentDeleteMatch = { data: match, index: matchIndex };

    // Populate match details in the confirmation modal
    const detailsDiv = document.getElementById('matchLoadDeleteDetails');
    if (detailsDiv) {
      const matchTitle = match.title || 'Untitled Match';
      const matchDate = new Date(match.savedAt);
      const formattedDate = matchDate.toLocaleDateString();
      const formattedTime = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create team vs team display
      const teamsDisplay = match.team1Name && match.team2Name
        ? `${match.team1Name} vs ${match.team2Name}`
        : '';

      detailsDiv.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">${this._escapeHtml(matchTitle)}</h6>
            ${teamsDisplay ? `<p class="card-text mb-1"><strong>Teams:</strong> ${this._escapeHtml(teamsDisplay)}</p>` : ''}
            <p class="card-text mb-0"><strong>Saved:</strong> ${formattedDate} at ${formattedTime}</p>
          </div>
        </div>
      `;
    }

    // Show the delete confirmation modal
    this.deleteModal.show();
  }

  /**
   * Handle delete confirmation
   * @private
   */
  async _handleDeleteConfirm() {
    if (!this.currentDeleteMatch) return;

    const confirmBtn = document.getElementById('confirmMatchLoadDeleteBtn');
    const originalText = confirmBtn.innerHTML;

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        notificationManager.error('Authentication required to delete matches');
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

      // Call API to delete the match
      await userMatchesApi.deleteMatchData(currentUser.id, this.currentDeleteMatch.index);

      // Remove from local array
      this.allMatches.splice(this.currentDeleteMatch.index, 1);

      // Re-render the matches
      this._renderMatches(this.allMatches);

      // Hide the delete modal
      this.deleteModal.hide();

      const matchTitle = this.currentDeleteMatch.data.title || 'Untitled Match';
      notificationManager.success(`Match "${matchTitle}" deleted successfully`);

      this.currentDeleteMatch = null;
    } catch (error) {
      console.error('Error deleting match:', error);
      notificationManager.error('Failed to delete match: ' + (error.message || 'Unknown error'));
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
    }
  }
}

// Create and export singleton instance
export const matchLoadModal = new MatchLoadModal();

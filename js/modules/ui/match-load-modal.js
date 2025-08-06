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
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1 me-3">
                <h6 class="card-title mb-2 fw-bold">${this._escapeHtml(match.title)}</h6>
                ${teamsDisplay ? `<div class="text-primary small mb-1"><i class="fas fa-futbol me-1"></i>${this._escapeHtml(teamsDisplay)}${scoreDisplay}</div>` : ''}
                <div class="text-muted small mb-1">
                  <i class="fas fa-calendar me-1"></i>${formattedDate} at ${formattedTime}
                </div>
                ${match.notes ? `<div class="text-muted small"><i class="fas fa-sticky-note me-1"></i>${this._escapeHtml(match.notes.substring(0, 60))}${match.notes.length > 60 ? '...' : ''}</div>` : ''}
              </div>
              <div class="d-flex gap-1 flex-shrink-0">
                <button class="btn btn-primary btn-sm view-btn" data-match-index="${index}" style="min-width: 60px;">
                  View
                </button>
                <button class="btn btn-outline-secondary btn-sm raw-data-btn" data-match-index="${index}" title="View Raw Data" style="width: 36px;">
                  <i class="fas fa-code"></i>
                </button>
              </div>
            </div>
          </div>
        `;

        // Add click handlers
        listItem.querySelector('.view-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          matchSummaryModal.show(match);
        });

        listItem.querySelector('.raw-data-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          rawDataModal.show(match);
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
          <div class="card-body text-center text-muted p-5">
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
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
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

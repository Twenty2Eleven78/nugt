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

    if (!this.modal) return;

    const matchListElement = document.getElementById('matchLoadList');
    if (!matchListElement) return;

    matchListElement.innerHTML = '';

    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
          <div>
            <strong>${match.title}</strong>
            <small class="d-block text-muted">${new Date(match.savedAt).toLocaleString()}</small>
            <p class="mb-0 mt-2">${match.notes || ''}</p>
          </div>
          <div>
            <button class="btn btn-primary btn-sm view-btn">View</button>
            <button class="btn btn-secondary btn-sm raw-data-btn">Raw Data</button>
          </div>
        `;
        listItem.querySelector('.view-btn').addEventListener('click', () => {
          matchSummaryModal.show(match);
        });
        listItem.querySelector('.raw-data-btn').addEventListener('click', () => {
          rawDataModal.show(match);
        });
        matchListElement.appendChild(listItem);
      });
    } else {
      matchListElement.innerHTML = '<p>No saved matches found.</p>';
    }

    // Show modal using custom modal system
    this.modal.show();
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
              <ul class="list-group" id="matchLoadList">
                <!-- Match list will be populated here -->
              </ul>
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
  }
}

// Create and export singleton instance
export const matchLoadModal = new MatchLoadModal();

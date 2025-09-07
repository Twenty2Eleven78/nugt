/**
 * Release Notes Manager
 * @version 2.0
 *
 * Displays release notes from a Markdown file in a clean, modern modal.
 * Uses the 'marked' library for robust Markdown parsing.
 */

import { CustomModal } from '../shared/custom-modal.js';

// Release Notes Manager
class ReleaseNotesManager {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  // Initialize release notes functionality
  init() {
    if (this.isInitialized) return;
    
    this.createModal();
    this._bindEvents();
    this.isInitialized = true;
  }

  // Create release notes modal
  createModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('releasenotesmodal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div class="modal fade" id="releasenotesmodal" tabindex="-1" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Release Notes</h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div id="readme-content" class="modal-body"></div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('releasenotesmodal');
  }

  // Show release notes modal
  show() {
    if (this.modal) {
      this.modal.show();
    }
  }

  // Hide release notes modal
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  // Load and parse release notes
  async loadReleaseNotes() {
    const readmeContainer = document.getElementById('readme-content');
    if (!readmeContainer) return;

    try {
      // Show loading state
      readmeContainer.innerHTML = this._createLoadingHTML();

      // Fetch README content
      const response = await fetch('README.md');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();

      // Parse and render markdown if 'marked' is available
      if (window.marked) {
        readmeContainer.innerHTML = `<div class="release-notes-content">${window.marked.parse(text)}</div>`;
      } else {
        throw new Error("'marked' library not loaded.");
      }

    } catch (error) {
      console.error('Error loading release notes:', error);
      readmeContainer.innerHTML = this._createErrorHTML();
    }
  }

  // Create loading HTML
  _createLoadingHTML() {
    return `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted">Loading release notes...</p>
      </div>
    `;
  }

  // Create error HTML
  _createErrorHTML() {
    return `
      <div class="alert alert-danger d-flex align-items-center" role="alert">
        <i class="fas fa-exclamation-triangle me-3"></i>
        <div>
          <strong>Error loading release notes</strong>
          <p class="mb-0 mt-1">Could not load the release notes. Please check the console for details and try again later.</p>
        </div>
      </div>
    `;
  }

  // Bind events
  _bindEvents() {
    // Listen for modal show event on the created modal
    const releaseNotesModal = document.getElementById('releasenotesmodal');
    if (releaseNotesModal) {
      releaseNotesModal.addEventListener('shown.bs.modal', () => {
        this.loadReleaseNotes();
      });
    }
  }
}

// Create and export singleton instance
export const releaseNotesManager = new ReleaseNotesManager();

// Export convenience methods
export const {
  show,
  hide,
  loadReleaseNotes
} = releaseNotesManager;
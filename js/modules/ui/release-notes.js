/**
 * Simplified Release Notes Manager
 * @version 2.0
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';
import { CACHE_CONFIG } from '../shared/constants.js';

class ReleaseNotesManager {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.createModal();
    this.isInitialized = true;
  }

  createModal() {
    const bodyContent = `<div id="readme" class="readme-content"></div>`;
    createAndAppendModal(
      'releasenotesmodal',
      '<i class="fas fa-clipboard-list me-2"></i>Release Notes',
      bodyContent,
      MODAL_CONFIGS.LARGE
    );
    this.modal = CustomModal.getOrCreateInstance('releasenotesmodal');
  }

  show() {
    if (this.modal) {
      this.modal.show();
      this.loadReleaseNotes();
    }
  }

  hide() {
    if (this.modal) this.modal.hide();
  }

  async loadReleaseNotes() {
    const container = document.getElementById('readme');
    if (!container) return;

    try {
      container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary mb-3"></div><p class="text-muted">Loading...</p></div>';

      const response = await fetch('README.md');
      const text = await response.text();

      if (!text || text.trim().length === 0) {
        container.innerHTML = '<div class="alert alert-warning">README.md is empty or not found</div>';
        return;
      }

      // Add cache version to the first row
      const cacheInfo = `Cache Version: ${CACHE_CONFIG.VERSION} (${CACHE_CONFIG.NAME})\n\n`;
      const fullText = cacheInfo + text;

      const parsed = this._parseMarkdown(fullText);
      container.innerHTML = parsed;
    } catch (error) {
      console.error('Error loading README:', error);
      container.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error: ${error.message}</div>`;
    }
  }

  _parseMarkdown(markdown) {
    // Simple conversion - just escape HTML and preserve line breaks
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r?\n/g, '<br>');
    
    return `<div class="release-notes-content" style="white-space: pre-wrap; font-family: monospace;">${html}</div>`;
  }
}

// Create and export singleton instance
export const releaseNotesManager = new ReleaseNotesManager();
export default releaseNotesManager;
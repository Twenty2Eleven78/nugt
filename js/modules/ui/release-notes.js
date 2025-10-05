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
    // Enhanced markdown parsing with proper formatting
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Parse headers
    html = html.replace(/^# (.+)$/gm, '<h1 class="release-notes-h1">$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="release-notes-h2">$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="release-notes-h3">$1</h3>');

    // Parse horizontal rules
    html = html.replace(/^---+$/gm, '<hr class="release-notes-hr">');

    // Parse bold text
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="fw-bold text-primary">$1</strong>');

    // Parse emoji and version headers (special formatting)
    html = html.replace(/^(🚀|📋|📊|⚽|🎨|🔧|💾|🌟|📱|⏱️|👥|🎯) (.+)$/gm, '<div class="version-header"><span class="version-emoji">$1</span> <span class="version-title">$2</span></div>');

    // Parse bullet points
    html = html.replace(/^- (.+)$/gm, '<li class="release-item">$1</li>');

    // Wrap consecutive list items in ul tags
    html = html.replace(/(<li class="release-item">.*?<\/li>)(\n|$)/gs, (match, items) => {
      const listItems = items.split('</li>').filter(item => item.trim()).map(item => item + '</li>').join('');
      return `<ul class="release-list">${listItems}</ul>\n`;
    });

    // Parse version blocks (special formatting for version sections)
    html = html.replace(/^Version (\d+\.\d+(?:\.\d+)?)(.*?)$/gm, '<div class="version-block"><h3 class="version-number">Version $1</h3><span class="version-description">$2</span></div>');

    // Parse release dates
    html = html.replace(/\*\*Released: (.+?)\*\*/g, '<span class="release-date"><i class="fas fa-calendar-alt me-1"></i>Released: $1</span>');

    // Convert line breaks to proper HTML
    //html = html.replace(/\n\n/g, '</p><p class="release-paragraph">');
    //html = html.replace(/\n/g, '<br>');

    // Wrap in paragraphs
    html = `<p class="release-paragraph">${html}</p>`;

    // Clean up empty paragraphs
    html = html.replace(/<p class="release-paragraph"><\/p>/g, '');
    html = html.replace(/<p class="release-paragraph"><br><\/p>/g, '');

    return `<div class="release-notes-content">${html}</div>`;
  }
}

// Create and export singleton instance
export const releaseNotesManager = new ReleaseNotesManager();
export default releaseNotesManager;
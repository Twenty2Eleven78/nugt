/**
 * Enhanced Release Notes Manager
 * @version 1.0
 * 
 * Provides enhanced markdown parsing and display for release notes
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
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Release Notes</h5>
                <button type="button" class="btn btn-danger btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
            </div>
            <div id="readme" class="modal-body readme-content"></div>
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
    const readmeContainer = document.getElementById('readme');
    if (!readmeContainer) return;

    try {
      // Show loading state
      readmeContainer.innerHTML = this._createLoadingHTML();

      // Fetch README content
      const response = await fetch('README.md');
      const text = await response.text();

      // Parse and render markdown
      const parsedHTML = this._parseMarkdown(text);
      readmeContainer.innerHTML = parsedHTML;

      // Add interactive features
      this._addInteractiveFeatures();

    } catch (error) {
      console.error('Error loading release notes:', error);
      readmeContainer.innerHTML = this._createErrorHTML();
    }
  }

  // Create loading HTML
  _createLoadingHTML() {
    return `
      <div class="text-center py-4">
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
      <div class="alert alert-danger" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error loading release notes</strong>
        <p class="mb-0 mt-2">Unable to load the release notes. Please try again later.</p>
      </div>
    `;
  }

  // Parse markdown to HTML
  _parseMarkdown(markdown) {
    let html = markdown;

    // Parse headers
    html = html.replace(/^# (.*$)/gm, '<h1 class="release-notes-h1">$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="release-notes-h2">$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3 class="release-notes-h3">$1</h3>');

    // Parse bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Parse italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Parse code blocks
    html = html.replace(/`(.*?)`/g, '<code class="release-notes-code">$1</code>');

    // Parse unordered lists
    html = html.replace(/^- (.*$)/gm, '<li class="release-notes-li">$1</li>');
    
    // Wrap consecutive list items in ul tags
    html = html.replace(/(<li class="release-notes-li">.*<\/li>\s*)+/gs, (match) => {
      return `<ul class="release-notes-ul">${match}</ul>`;
    });

    // Parse horizontal rules
    html = html.replace(/^---$/gm, '<hr class="release-notes-hr">');

    // Parse line breaks
    html = html.replace(/\n\n/g, '</p><p class="release-notes-p">');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraphs
    html = `<div class="release-notes-content"><p class="release-notes-p">${html}</p></div>`;

    // Clean up empty paragraphs
    html = html.replace(/<p class="release-notes-p"><\/p>/g, '');
    html = html.replace(/<p class="release-notes-p"><br><\/p>/g, '');

    // Add version badges
    html = this._addVersionBadges(html);

    // Add feature icons
    html = this._addFeatureIcons(html);

    return html;
  }

  // Add version badges to version headers
  _addVersionBadges(html) {
    // Add current version badge
    html = html.replace(
      /<h2 class="release-notes-h2">🚀 Version 4\.0 - Enhanced UI & Admin Features<\/h2>/,
      '<h2 class="release-notes-h2"><span class="badge bg-success me-2">CURRENT</span>🚀 Version 4.0 - Enhanced UI & Admin Features</h2>'
    );

    // Add version badges for other versions
    html = html.replace(
      /Version (\d+\.\d+(?:\.\d+)?)/g,
      '<span class="badge bg-primary me-2">v$1</span>Version $1'
    );

    return html;
  }

  // Add feature icons to feature lists
  _addFeatureIcons(html) {
    const iconMap = {
      'Enhanced Events': 'fas fa-chart-bar',
      'Advanced Filtering': 'fas fa-filter',
      'Event Statistics': 'fas fa-chart-pie',
      'CSV Export': 'fas fa-download',
      'Player Attendance': 'fas fa-user-check',
      'Modern Options': 'fas fa-th-large',
      'Consistent Notifications': 'fas fa-bell',
      'Statistics Cards': 'fas fa-id-card',
      'Search & Filter': 'fas fa-search',
      'Enhanced Timeline': 'fas fa-timeline',
      'Quick Actions': 'fas fa-bolt',
      'Responsive Design': 'fas fa-mobile-alt',
      'PWA Updates': 'fas fa-sync',
      'Modular Architecture': 'fas fa-cubes',
      'Performance': 'fas fa-tachometer-alt',
      'Data Integration': 'fas fa-database',
      'Passkey Authentication': 'fas fa-key',
      'Cloud Data Storage': 'fas fa-cloud',
      'User Management': 'fas fa-users-cog',
      'JavaScript Refactor': 'fas fa-code',
      'Timer System': 'fas fa-stopwatch',
      'Goal Tracking': 'fas fa-futbol',
      'Event Logging': 'fas fa-list-alt',
      'Team Management': 'fas fa-users'
    };

    Object.entries(iconMap).forEach(([feature, icon]) => {
      const regex = new RegExp(`<strong>${feature}</strong>`, 'g');
      html = html.replace(regex, `<i class="${icon} me-2 text-primary"></i><strong>${feature}</strong>`);
    });

    return html;
  }

  // Add interactive features to the rendered content
  _addInteractiveFeatures() {
    // Add smooth scrolling to version links
    this._addVersionNavigation();
    
    // Add copy to clipboard for version info
    this._addCopyFeatures();
    
    // Add expand/collapse for version sections
    this._addExpandCollapse();
  }

  // Add version navigation
  _addVersionNavigation() {
    const versionHeaders = document.querySelectorAll('.release-notes-h2, .release-notes-h3');
    
    versionHeaders.forEach((header, index) => {
      header.id = `version-${index}`;
      header.style.cursor = 'pointer';
      header.title = 'Click to copy link to this version';
      
      header.addEventListener('click', () => {
        const url = `${window.location.origin}${window.location.pathname}#${header.id}`;
        navigator.clipboard.writeText(url).then(() => {
          this._showTooltip(header, 'Link copied!');
        });
      });
    });
  }

  // Add copy features
  _addCopyFeatures() {
    const codeElements = document.querySelectorAll('.release-notes-code');
    
    codeElements.forEach(code => {
      code.style.cursor = 'pointer';
      code.title = 'Click to copy';
      
      code.addEventListener('click', () => {
        navigator.clipboard.writeText(code.textContent).then(() => {
          this._showTooltip(code, 'Copied!');
        });
      });
    });
  }

  // Add expand/collapse functionality
  _addExpandCollapse() {
    const versionSections = document.querySelectorAll('.release-notes-h3');
    
    versionSections.forEach(header => {
      // Skip the main current version
      if (header.textContent.includes('Version 4.0')) return;
      
      const toggleIcon = document.createElement('i');
      toggleIcon.className = 'fas fa-chevron-down ms-2 text-muted';
      toggleIcon.style.fontSize = '0.8rem';
      header.appendChild(toggleIcon);
      
      header.style.cursor = 'pointer';
      
      // Find the content until the next header
      let nextElement = header.nextElementSibling;
      const contentElements = [];
      
      while (nextElement && !nextElement.classList.contains('release-notes-h3') && !nextElement.classList.contains('release-notes-hr')) {
        contentElements.push(nextElement);
        nextElement = nextElement.nextElementSibling;
      }
      
      // Add click handler
      header.addEventListener('click', () => {
        const isCollapsed = contentElements[0]?.style.display === 'none';
        
        contentElements.forEach(element => {
          element.style.display = isCollapsed ? 'block' : 'none';
        });
        
        toggleIcon.className = isCollapsed ? 
          'fas fa-chevron-down ms-2 text-muted' : 
          'fas fa-chevron-up ms-2 text-muted';
      });
    });
  }

  // Show tooltip
  _showTooltip(element, message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'release-notes-tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      pointer-events: none;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 30) + 'px';
    
    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  }

  // Bind events
  _bindEvents() {
    // Listen for modal show event on the created modal
    setTimeout(() => {
      const releaseNotesModal = document.getElementById('releasenotesmodal');
      if (releaseNotesModal) {
        releaseNotesModal.addEventListener('modal.show', () => {
          this.loadReleaseNotes();
        });
      }
    }, 100); // Small delay to ensure modal is created
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
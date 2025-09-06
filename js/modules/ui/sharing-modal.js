/**
 * Sharing Modal
 * Handles match report sharing modal UI
 */

import { CustomModal } from '../shared/custom-modal.js';
import { sharingService } from '../services/sharing.js';
import { notificationManager } from '../services/notifications.js';

class SharingModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  /**
   * Initialize sharing modal
   */
  init() {
    if (this.isInitialized) return;
    
    this.createModal();
    this._bindEvents();
    this.isInitialized = true;
  }

  /**
   * Create sharing modal
   */
  createModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('sharingModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div class="modal fade" id="sharingModal" tabindex="-1" aria-labelledby="sharingModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="sharingModalLabel">
                <i class="fas fa-share-alt me-2"></i>Share Match Report
              </h5>
                <button type="button" class="btn btn-danger btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
            </div>
            <div class="modal-body">
              <div class="row g-3 mb-4">
                <div class="col-12">
                  <h6 class="text-muted mb-3">Share on Social Media</h6>
                </div>
                <div class="col-4">
                  <button class="btn btn-success w-100 share-platform-btn" data-platform="whatsapp">
                    <i class="fab fa-whatsapp fa-lg mb-1"></i>
                    <small class="d-block">WhatsApp</small>
                  </button>
                </div>
                <div class="col-4">
                  <button class="btn btn-info w-100 share-platform-btn" data-platform="twitter">
                    <i class="fab fa-twitter fa-lg mb-1"></i>
                    <small class="d-block">Twitter</small>
                  </button>
                </div>
                <div class="col-4">
                  <button class="btn btn-primary w-100 share-platform-btn" data-platform="facebook">
                    <i class="fab fa-facebook fa-lg mb-1"></i>
                    <small class="d-block">Facebook</small>
                  </button>
                </div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-12">
                  <h6 class="text-muted mb-3">Other Options</h6>
                </div>
                <div class="col-6">
                  <button class="btn btn-outline-secondary w-100 share-platform-btn" data-platform="web-api">
                    <i class="fas fa-share fa-lg mb-1"></i>
                    <small class="d-block">Native Share</small>
                  </button>
                </div>
                <div class="col-6">
                  <button class="btn btn-outline-secondary w-100 share-platform-btn" data-platform="clipboard">
                    <i class="fas fa-clipboard fa-lg mb-1"></i>
                    <small class="d-block">Copy Text</small>
                  </button>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-12">
                  <h6 class="text-muted mb-3">Export Data</h6>
                </div>
                <div class="col-4">
                  <button class="btn btn-outline-primary w-100 export-btn" data-format="json">
                    <i class="fas fa-file-code fa-lg mb-1"></i>
                    <small class="d-block">JSON</small>
                  </button>
                </div>
                <div class="col-4">
                  <button class="btn btn-outline-success w-100 export-btn" data-format="csv">
                    <i class="fas fa-file-csv fa-lg mb-1"></i>
                    <small class="d-block">CSV</small>
                  </button>
                </div>
                <div class="col-4">
                  <button class="btn btn-outline-secondary w-100 export-btn" data-format="txt">
                    <i class="fas fa-file-alt fa-lg mb-1"></i>
                    <small class="d-block">Text</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('sharingModal');
  }

  /**
   * Show sharing modal
   */
  show() {
    if (this.modal) {
      this.modal.show();
    }
  }

  /**
   * Hide sharing modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    // Handle sharing platform buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.share-platform-btn')) {
        const button = e.target.closest('.share-platform-btn');
        const platform = button.dataset.platform;
        this._handleSharingPlatform(platform);
      }

      // Handle export buttons
      if (e.target.closest('.export-btn')) {
        const button = e.target.closest('.export-btn');
        const format = button.dataset.format;
        this._handleExport(format);
      }
    });
  }

  /**
   * Handle sharing to different platforms
   */
  async _handleSharingPlatform(platform) {
    try {
      // Show loading state
      notificationManager.info('Preparing to share...');

      switch (platform) {
        case 'whatsapp':
          sharingService.shareViaWhatsApp();
          break;
        case 'twitter':
          sharingService.shareViaTwitter();
          break;
        case 'facebook':
          sharingService.shareViaFacebook();
          break;
        case 'web-api':
          await sharingService.shareViaWebAPI();
          break;
        case 'clipboard':
          await sharingService.copyToClipboard();
          notificationManager.success('Match report copied to clipboard!');
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Close the modal after successful sharing
      this.hide();

    } catch (error) {
      console.error('Sharing failed:', error);
      notificationManager.error(error.message || 'Failed to share match report');
    }
  }

  /**
   * Handle data export
   */
  _handleExport(format) {
    try {
      // Show loading state
      notificationManager.info('Preparing export...');

      switch (format) {
        case 'json':
          sharingService.exportAsJSON();
          break;
        case 'csv':
          sharingService.exportAsCSV();
          break;
        case 'txt':
          sharingService.exportAsText();
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      notificationManager.success(`Match data exported as ${format.toUpperCase()}!`);

      // Close the modal after successful export
      this.hide();

    } catch (error) {
      console.error('Export failed:', error);
      notificationManager.error(error.message || 'Failed to export match data');
    }
  }
}

// Create and export instance
const sharingModal = new SharingModal();
export default sharingModal;
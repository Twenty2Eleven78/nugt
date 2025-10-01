/**
 * Configuration Modal
 * Provides UI for editing team configuration settings
 * @version 1.0
 */

import { createAndAppendModal, showModal, hideModal, MODAL_CONFIGS } from '../shared/modal-factory.js';
import { configService } from '../services/config.js';
import { brandingService } from '../services/branding.js';

class ConfigurationModal {
  constructor() {
    this.modalId = 'configurationModal';
    this.currentConfig = null;
    this.originalConfig = null;
    this.validationErrors = {};
    this.previewMode = false;
    this.activeTab = 'team';
    
    this.init();
  }

  init() {
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    const modalContent = this.generateModalContent();
    
    const modalOptions = {
      ...MODAL_CONFIGS.EXTRA_LARGE,
      backdrop: 'static',
      keyboard: false,
      footerContent: this.generateFooterContent()
    };

    createAndAppendModal(
      this.modalId,
      '<i class="fas fa-cog me-2"></i>Team Configuration',
      modalContent,
      modalOptions
    );
  }

  generateModalContent() {
    return `
      <div class="config-modal-container">
        <!-- Tab Navigation -->
        <ul class="nav nav-pills nav-fill mb-4" role="tablist">
          <li class="nav-item">
            <a class="nav-link active" data-toggle="pill" href="#config-team-tab" data-tab="team">
              <i class="fas fa-users me-2"></i>Team
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-toggle="pill" href="#config-branding-tab" data-tab="branding">
              <i class="fas fa-palette me-2"></i>Branding
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-toggle="pill" href="#config-integrations-tab" data-tab="integrations">
              <i class="fas fa-plug me-2"></i>Integrations
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-toggle="pill" href="#config-defaults-tab" data-tab="defaults">
              <i class="fas fa-sliders-h me-2"></i>Defaults
            </a>
          </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Team Tab -->
          <div class="tab-pane fade show active" id="config-team-tab">
            ${this.generateTeamTabContent()}
          </div>

          <!-- Branding Tab -->
          <div class="tab-pane fade" id="config-branding-tab">
            ${this.generateBrandingTabContent()}
          </div>

          <!-- Integrations Tab -->
          <div class="tab-pane fade" id="config-integrations-tab">
            ${this.generateIntegrationsTabContent()}
          </div>

          <!-- Defaults Tab -->
          <div class="tab-pane fade" id="config-defaults-tab">
            ${this.generateDefaultsTabContent()}
          </div>
        </div>

        <!-- Validation Errors Display -->
        <div id="config-validation-errors" class="alert alert-danger mt-3" style="display: none;">
          <h6><i class="fas fa-exclamation-triangle me-2"></i>Configuration Errors</h6>
          <ul id="config-error-list"></ul>
        </div>

        <!-- Preview Notice -->
        <div id="config-preview-notice" class="alert alert-info mt-3" style="display: none;">
          <i class="fas fa-eye me-2"></i>Preview mode is active. Changes are temporary until saved.
        </div>
      </div>
    `;
  }

  generateTeamTabContent() {
    return `
      <div class="row g-3">
        <div class="col-12">
          <h6 class="text-muted mb-3">
            <i class="fas fa-info-circle me-2"></i>Team Information
          </h6>
        </div>
        
        <div class="col-md-6">
          <label for="config-team-name" class="form-label">Team Name *</label>
          <input type="text" class="form-control" id="config-team-name" 
                 placeholder="e.g., Netherton United" maxlength="50">
          <div class="form-text">Full team name displayed throughout the app</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-team-short-name" class="form-label">Short Name</label>
          <input type="text" class="form-control" id="config-team-short-name" 
                 placeholder="e.g., NUFC" maxlength="10">
          <div class="form-text">Abbreviated team name for compact displays</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-team-abbreviation" class="form-label">Abbreviation</label>
          <input type="text" class="form-control" id="config-team-abbreviation" 
                 placeholder="e.g., NUGT" maxlength="6">
          <div class="form-text">Used for storage keys and internal references</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-default-opponent" class="form-label">Default Opponent Name</label>
          <input type="text" class="form-control" id="config-default-opponent" 
                 placeholder="e.g., Opposition Team" maxlength="50">
          <div class="form-text">Default name for opposing teams</div>
        </div>
      </div>
    `;
  }

  generateBrandingTabContent() {
    return `
      <div class="row g-3">
        <div class="col-12">
          <h6 class="text-muted mb-3">
            <i class="fas fa-palette me-2"></i>Visual Branding
          </h6>
        </div>
        
        <div class="col-md-6">
          <label for="config-primary-color" class="form-label">Primary Color *</label>
          <div class="input-group">
            <input type="color" class="form-control form-control-color" id="config-primary-color">
            <input type="text" class="form-control" id="config-primary-color-text" 
                   placeholder="#dc3545" pattern="^#[0-9A-Fa-f]{6}$">
          </div>
          <div class="form-text">Main theme color for buttons and highlights</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-secondary-color" class="form-label">Secondary Color</label>
          <div class="input-group">
            <input type="color" class="form-control form-control-color" id="config-secondary-color">
            <input type="text" class="form-control" id="config-secondary-color-text" 
                   placeholder="#ffffff" pattern="^#[0-9A-Fa-f]{6}$">
          </div>
          <div class="form-text">Secondary color for backgrounds and text</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-logo-url" class="form-label">Logo URL</label>
          <input type="url" class="form-control" id="config-logo-url" 
                 placeholder="./nugtlogo.png">
          <div class="form-text">Path or URL to team logo image</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-favicon-url" class="form-label">Favicon URL</label>
          <input type="url" class="form-control" id="config-favicon-url" 
                 placeholder="./favicon.ico">
          <div class="form-text">Path or URL to favicon image</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-app-icon-url" class="form-label">App Icon URL</label>
          <input type="url" class="form-control" id="config-app-icon-url" 
                 placeholder="./nugt512.png">
          <div class="form-text">Path or URL to PWA app icon (512x512px recommended)</div>
        </div>
        
        <div class="col-md-6">
          <div class="d-flex align-items-center h-100">
            <button type="button" class="btn btn-outline-primary" id="config-preview-branding">
              <i class="fas fa-eye me-2"></i>Preview Changes
            </button>
          </div>
        </div>
        
        <!-- Branding Preview -->
        <div class="col-12">
          <div class="card mt-3" id="config-branding-preview" style="display: none;">
            <div class="card-header">
              <h6 class="mb-0"><i class="fas fa-eye me-2"></i>Branding Preview</h6>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center gap-3">
                <img id="config-preview-logo" src="" alt="Logo Preview" style="max-height: 40px; display: none;">
                <div>
                  <div class="fw-bold" id="config-preview-team-name">Team Name</div>
                  <div class="text-muted small" id="config-preview-colors">
                    Primary: <span id="config-preview-primary"></span> | 
                    Secondary: <span id="config-preview-secondary"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateIntegrationsTabContent() {
    return `
      <div class="row g-3">
        <div class="col-12">
          <h6 class="text-muted mb-3">
            <i class="fas fa-plug me-2"></i>External Integrations
          </h6>
        </div>
        
        <!-- League Table Integration -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">League Table Integration</h6>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="config-league-enabled">
                  <label class="form-check-label" for="config-league-enabled">Enabled</label>
                </div>
              </div>
            </div>
            <div class="card-body" id="config-league-settings">
              <div class="row g-3">
                <div class="col-12">
                  <label for="config-league-url" class="form-label">League Table URL</label>
                  <input type="url" class="form-control" id="config-league-url" 
                         placeholder="https://example-league-url.com">
                  <div class="form-text">URL to your team's league table page</div>
                </div>
                <div class="col-12">
                  <label for="config-cors-proxies" class="form-label">CORS Proxies</label>
                  <textarea class="form-control" id="config-cors-proxies" rows="3" 
                            placeholder="https://corsproxy.io/?&#10;https://cors-anywhere.herokuapp.com/"></textarea>
                  <div class="form-text">One proxy URL per line (used to bypass CORS restrictions)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Statistics Integration -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Statistics Integration</h6>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="config-stats-enabled">
                  <label class="form-check-label" for="config-stats-enabled">Enabled</label>
                </div>
              </div>
            </div>
            <div class="card-body" id="config-stats-settings">
              <div class="row g-3">
                <div class="col-12">
                  <label for="config-stats-endpoint" class="form-label">API Endpoint</label>
                  <input type="url" class="form-control" id="config-stats-endpoint" 
                         placeholder="https://api.example.com/stats">
                  <div class="form-text">API endpoint for statistics data (optional)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateDefaultsTabContent() {
    return `
      <div class="row g-3">
        <div class="col-12">
          <h6 class="text-muted mb-3">
            <i class="fas fa-sliders-h me-2"></i>Default Settings
          </h6>
        </div>
        
        <div class="col-md-6">
          <label for="config-match-duration" class="form-label">Default Match Duration</label>
          <select class="form-select" id="config-match-duration">
            <option value="2400">40 minutes (7v7)</option>
            <option value="3000">50 minutes (7v7)</option>
            <option value="3600">60 minutes (U11/12 9v9)</option>
            <option value="4200">70 minutes (U13/14 11v11)</option>
            <option value="4800">80 minutes (U15/16 11v11)</option>
            <option value="5400">90 minutes (11v11)</option>
          </select>
          <div class="form-text">Default match duration in seconds</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-default-theme" class="form-label">Default Theme</label>
          <select class="form-select" id="config-default-theme">
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
            <option value="yellow">Yellow</option>
            <option value="cyan">Cyan</option>
            <option value="pink">Pink</option>
          </select>
          <div class="form-text">Default color theme for new users</div>
        </div>
        
        <div class="col-md-6">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="config-default-dark-mode">
            <label class="form-check-label" for="config-default-dark-mode">
              <i class="fas fa-moon me-2"></i>Default Dark Mode
            </label>
          </div>
          <div class="form-text">Enable dark mode by default for new users</div>
        </div>
        
        <div class="col-12">
          <h6 class="text-muted mb-3 mt-4">
            <i class="fas fa-database me-2"></i>Storage Settings
          </h6>
        </div>
        
        <div class="col-md-6">
          <label for="config-key-prefix" class="form-label">Storage Key Prefix</label>
          <input type="text" class="form-control" id="config-key-prefix" 
                 placeholder="nugt_" pattern="^[a-zA-Z0-9_-]+$">
          <div class="form-text">Prefix for localStorage keys (letters, numbers, _ and - only)</div>
        </div>
        
        <div class="col-md-6">
          <label for="config-cache-prefix" class="form-label">Cache Prefix</label>
          <input type="text" class="form-control" id="config-cache-prefix" 
                 placeholder="nugt-cache-" pattern="^[a-zA-Z0-9_-]+$">
          <div class="form-text">Prefix for cache storage keys</div>
        </div>
      </div>
    `;
  }

  generateFooterContent() {
    return `
      <button type="button" class="btn btn-outline-secondary" id="config-reset-btn">
        <i class="fas fa-undo me-2"></i>Reset to Defaults
      </button>
      <button type="button" class="btn btn-outline-info" id="config-export-btn">
        <i class="fas fa-download me-2"></i>Export
      </button>
      <button type="button" class="btn btn-outline-warning" id="config-import-btn">
        <i class="fas fa-upload me-2"></i>Import
      </button>
      <button type="button" class="btn btn-secondary" data-dismiss="modal">
        <i class="fas fa-times me-2"></i>Cancel
      </button>
      <button type="button" class="btn btn-primary" id="config-save-btn">
        <i class="fas fa-save me-2"></i>Save Configuration
      </button>
    `;
  }  bindEvents
() {
    // Wait for modal to be created
    setTimeout(() => {
      const modal = document.getElementById(this.modalId);
      if (!modal) return;

      // Tab navigation
      modal.addEventListener('click', (e) => {
        const tabLink = e.target.closest('[data-toggle="pill"]');
        if (tabLink) {
          this.activeTab = tabLink.dataset.tab;
          this.validateCurrentTab();
        }
      });

      // Form input changes
      modal.addEventListener('input', (e) => {
        if (e.target.matches('input, select, textarea')) {
          this.handleInputChange(e.target);
        }
      });

      // Color picker synchronization
      modal.addEventListener('input', (e) => {
        if (e.target.id === 'config-primary-color') {
          document.getElementById('config-primary-color-text').value = e.target.value;
        } else if (e.target.id === 'config-primary-color-text') {
          document.getElementById('config-primary-color').value = e.target.value;
        } else if (e.target.id === 'config-secondary-color') {
          document.getElementById('config-secondary-color-text').value = e.target.value;
        } else if (e.target.id === 'config-secondary-color-text') {
          document.getElementById('config-secondary-color').value = e.target.value;
        }
      });

      // Integration toggles
      modal.addEventListener('change', (e) => {
        if (e.target.id === 'config-league-enabled') {
          this.toggleIntegrationSettings('league', e.target.checked);
        } else if (e.target.id === 'config-stats-enabled') {
          this.toggleIntegrationSettings('stats', e.target.checked);
        }
      });

      // Button events
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'config-preview-branding') {
          this.previewBranding();
        } else if (e.target.id === 'config-save-btn') {
          this.saveConfiguration();
        } else if (e.target.id === 'config-reset-btn') {
          this.resetToDefaults();
        } else if (e.target.id === 'config-export-btn') {
          this.exportConfiguration();
        } else if (e.target.id === 'config-import-btn') {
          this.importConfiguration();
        }
      });

      // Modal events (Bootstrap 5 events)
      modal.addEventListener('show.bs.modal', () => {
        console.log('Modal show event triggered');
        this.loadCurrentConfiguration().catch(error => {
          console.error('Failed to load configuration:', error);
        });
      });
      
      modal.addEventListener('shown.bs.modal', () => {
        console.log('Modal shown event triggered - DOM should be ready');
        // Ensure form is populated after modal is fully shown
        setTimeout(() => {
          this.loadCurrentConfiguration().catch(error => {
            console.error('Failed to load configuration:', error);
          });
        }, 50);
      });

      modal.addEventListener('hide.bs.modal', () => {
        this.cleanup();
      });
    }, 100);
  }

  show() {
    showModal(this.modalId);
    // Wait for modal to be fully rendered before loading configuration
    setTimeout(() => {
      this.loadCurrentConfiguration().catch(error => {
        console.error('Failed to load configuration:', error);
      });
    }, 300);
  }

  hide() {
    hideModal(this.modalId);
  }

  async loadCurrentConfiguration() {
    try {
      // Ensure configuration is loaded
      if (!configService.isConfigLoaded()) {
        console.log('Configuration not loaded yet, waiting...');
        await configService.loadConfig();
      }
      
      this.currentConfig = JSON.parse(JSON.stringify(configService.getConfig()));
      this.originalConfig = JSON.parse(JSON.stringify(this.currentConfig));
      this.populateForm();
      
      console.log('Configuration loaded into modal:', this.currentConfig);
    } catch (error) {
      console.error('Error loading configuration into modal:', error);
      // Use default config as fallback
      this.currentConfig = JSON.parse(JSON.stringify(configService.getConfig()));
      this.originalConfig = JSON.parse(JSON.stringify(this.currentConfig));
      this.populateForm();
    }
  }

  populateForm() {
    if (!this.currentConfig) {
      console.warn('No configuration available to populate form');
      return;
    }

    console.log('Populating form with config:', this.currentConfig);

    // Check if modal DOM is ready
    const modal = document.getElementById(this.modalId);
    if (!modal) {
      console.warn('Modal DOM not ready, retrying...');
      setTimeout(() => this.populateForm(), 100);
      return;
    }

    // Team section
    this.setInputValue('config-team-name', this.currentConfig.team?.name);
    this.setInputValue('config-team-short-name', this.currentConfig.team?.shortName);
    this.setInputValue('config-team-abbreviation', this.currentConfig.team?.abbreviation);
    this.setInputValue('config-default-opponent', this.currentConfig.team?.defaultOpponentName);

    // Branding section
    this.setInputValue('config-primary-color', this.currentConfig.branding?.primaryColor);
    this.setInputValue('config-primary-color-text', this.currentConfig.branding?.primaryColor);
    this.setInputValue('config-secondary-color', this.currentConfig.branding?.secondaryColor);
    this.setInputValue('config-secondary-color-text', this.currentConfig.branding?.secondaryColor);
    this.setInputValue('config-logo-url', this.currentConfig.branding?.logoUrl);
    this.setInputValue('config-favicon-url', this.currentConfig.branding?.faviconUrl);
    this.setInputValue('config-app-icon-url', this.currentConfig.branding?.appIconUrl);

    // Integrations section
    const leagueConfig = this.currentConfig.integrations?.leagueTable;
    if (leagueConfig) {
      this.setCheckboxValue('config-league-enabled', leagueConfig.enabled);
      this.setInputValue('config-league-url', leagueConfig.defaultUrl);
      this.setInputValue('config-cors-proxies', leagueConfig.corsProxies?.join('\n'));
      this.toggleIntegrationSettings('league', leagueConfig.enabled);
    }

    const statsConfig = this.currentConfig.integrations?.statistics;
    if (statsConfig) {
      this.setCheckboxValue('config-stats-enabled', statsConfig.enabled);
      this.setInputValue('config-stats-endpoint', statsConfig.apiEndpoint);
      this.toggleIntegrationSettings('stats', statsConfig.enabled);
    }

    // Defaults section
    this.setInputValue('config-match-duration', this.currentConfig.defaults?.matchDuration);
    this.setInputValue('config-default-theme', this.currentConfig.defaults?.theme);
    this.setCheckboxValue('config-default-dark-mode', this.currentConfig.defaults?.darkMode);

    // Storage section
    this.setInputValue('config-key-prefix', this.currentConfig.storage?.keyPrefix);
    this.setInputValue('config-cache-prefix', this.currentConfig.storage?.cachePrefix);
  }

  setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
      console.log(`Setting ${id} to:`, value);
      element.value = value;
      // Trigger input event to ensure any listeners are notified
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (!element) {
      console.warn(`Element with id '${id}' not found`);
    } else {
      console.log(`Skipping ${id} - value is undefined or null:`, value);
    }
  }

  setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
      console.log(`Setting checkbox ${id} to:`, value);
      element.checked = Boolean(value);
      // Trigger change event to ensure any listeners are notified
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (!element) {
      console.warn(`Checkbox element with id '${id}' not found`);
    } else {
      console.log(`Skipping checkbox ${id} - value is undefined or null:`, value);
    }
  }

  // Debug method to manually refresh form data
  refreshForm() {
    console.log('Manually refreshing form...');
    this.loadCurrentConfiguration().catch(error => {
      console.error('Failed to refresh configuration:', error);
    });
  }

  handleInputChange(input) {
    // Update current config with new value
    this.updateConfigFromInput(input);
    
    // Validate the specific field
    this.validateField(input);
    
    // Update validation display
    this.updateValidationDisplay();
  }

  updateConfigFromInput(input) {
    const value = input.type === 'checkbox' ? input.checked : input.value;
    
    switch (input.id) {
      // Team fields
      case 'config-team-name':
        this.currentConfig.team.name = value;
        break;
      case 'config-team-short-name':
        this.currentConfig.team.shortName = value;
        break;
      case 'config-team-abbreviation':
        this.currentConfig.team.abbreviation = value;
        break;
      case 'config-default-opponent':
        this.currentConfig.team.defaultOpponentName = value;
        break;
      
      // Branding fields
      case 'config-primary-color':
      case 'config-primary-color-text':
        this.currentConfig.branding.primaryColor = value;
        break;
      case 'config-secondary-color':
      case 'config-secondary-color-text':
        this.currentConfig.branding.secondaryColor = value;
        break;
      case 'config-logo-url':
        this.currentConfig.branding.logoUrl = value;
        break;
      case 'config-favicon-url':
        this.currentConfig.branding.faviconUrl = value;
        break;
      case 'config-app-icon-url':
        this.currentConfig.branding.appIconUrl = value;
        break;
      
      // Integration fields
      case 'config-league-enabled':
        this.currentConfig.integrations.leagueTable.enabled = value;
        break;
      case 'config-league-url':
        this.currentConfig.integrations.leagueTable.defaultUrl = value;
        break;
      case 'config-cors-proxies':
        this.currentConfig.integrations.leagueTable.corsProxies = 
          value.split('\n').filter(line => line.trim()).map(line => line.trim());
        break;
      case 'config-stats-enabled':
        this.currentConfig.integrations.statistics.enabled = value;
        break;
      case 'config-stats-endpoint':
        this.currentConfig.integrations.statistics.apiEndpoint = value || null;
        break;
      
      // Defaults fields
      case 'config-match-duration':
        this.currentConfig.defaults.matchDuration = parseInt(value);
        break;
      case 'config-default-theme':
        this.currentConfig.defaults.theme = value;
        break;
      case 'config-default-dark-mode':
        this.currentConfig.defaults.darkMode = value;
        break;
      
      // Storage fields
      case 'config-key-prefix':
        this.currentConfig.storage.keyPrefix = value;
        break;
      case 'config-cache-prefix':
        this.currentConfig.storage.cachePrefix = value;
        break;
    }
  }

  validateField(input) {
    const fieldId = input.id;
    const value = input.type === 'checkbox' ? input.checked : input.value;
    
    // Clear previous error for this field
    delete this.validationErrors[fieldId];
    
    // Validate based on field type
    switch (fieldId) {
      case 'config-team-name':
        if (!value || value.trim().length === 0) {
          this.validationErrors[fieldId] = 'Team name is required';
        } else if (value.length > 50) {
          this.validationErrors[fieldId] = 'Team name must be 50 characters or less';
        }
        break;
        
      case 'config-primary-color':
      case 'config-primary-color-text':
        if (!this.isValidColor(value)) {
          this.validationErrors[fieldId] = 'Primary color must be a valid hex color (e.g., #dc3545)';
        }
        break;
        
      case 'config-secondary-color':
      case 'config-secondary-color-text':
        if (value && !this.isValidColor(value)) {
          this.validationErrors[fieldId] = 'Secondary color must be a valid hex color (e.g., #ffffff)';
        }
        break;
        
      case 'config-logo-url':
      case 'config-favicon-url':
      case 'config-app-icon-url':
        if (value && !this.isValidUrl(value)) {
          this.validationErrors[fieldId] = 'Must be a valid URL or file path';
        }
        break;
        
      case 'config-league-url':
        if (value && !this.isValidUrl(value)) {
          this.validationErrors[fieldId] = 'League table URL must be a valid URL';
        }
        break;
        
      case 'config-stats-endpoint':
        if (value && !this.isValidUrl(value)) {
          this.validationErrors[fieldId] = 'Statistics endpoint must be a valid URL';
        }
        break;
        
      case 'config-key-prefix':
      case 'config-cache-prefix':
        if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
          this.validationErrors[fieldId] = 'Prefix can only contain letters, numbers, underscores, and hyphens';
        }
        break;
    }
    
    // Update field visual state
    this.updateFieldValidationState(input, !this.validationErrors[fieldId]);
  }

  updateFieldValidationState(input, isValid) {
    input.classList.toggle('is-invalid', !isValid);
    input.classList.toggle('is-valid', isValid && input.value);
  }

  validateCurrentTab() {
    // Validate all fields in the current tab
    const tabPane = document.getElementById(`config-${this.activeTab}-tab`);
    if (tabPane) {
      const inputs = tabPane.querySelectorAll('input, select, textarea');
      inputs.forEach(input => this.validateField(input));
      this.updateValidationDisplay();
    }
  }

  updateValidationDisplay() {
    const errorContainer = document.getElementById('config-validation-errors');
    const errorList = document.getElementById('config-error-list');
    
    if (Object.keys(this.validationErrors).length === 0) {
      errorContainer.style.display = 'none';
      return;
    }
    
    errorList.innerHTML = '';
    Object.values(this.validationErrors).forEach(error => {
      const li = document.createElement('li');
      li.textContent = error;
      errorList.appendChild(li);
    });
    
    errorContainer.style.display = 'block';
  }

  toggleIntegrationSettings(type, enabled) {
    const settingsContainer = document.getElementById(`config-${type}-settings`);
    if (settingsContainer) {
      settingsContainer.style.opacity = enabled ? '1' : '0.5';
      const inputs = settingsContainer.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.disabled = !enabled;
      });
    }
  }

  previewBranding() {
    const previewContainer = document.getElementById('config-branding-preview');
    const previewLogo = document.getElementById('config-preview-logo');
    const previewTeamName = document.getElementById('config-preview-team-name');
    const previewPrimary = document.getElementById('config-preview-primary');
    const previewSecondary = document.getElementById('config-preview-secondary');
    
    // Update preview content
    const teamName = document.getElementById('config-team-name').value || 'Team Name';
    const logoUrl = document.getElementById('config-logo-url').value;
    const primaryColor = document.getElementById('config-primary-color').value;
    const secondaryColor = document.getElementById('config-secondary-color').value;
    
    previewTeamName.textContent = teamName;
    previewPrimary.textContent = primaryColor;
    previewSecondary.textContent = secondaryColor;
    
    if (logoUrl) {
      previewLogo.src = logoUrl;
      previewLogo.style.display = 'block';
      previewLogo.onerror = () => {
        previewLogo.style.display = 'none';
      };
    } else {
      previewLogo.style.display = 'none';
    }
    
    // Apply temporary styling
    previewContainer.style.display = 'block';
    previewContainer.style.borderColor = primaryColor;
    previewTeamName.style.color = primaryColor;
    
    // Show preview notice
    const previewNotice = document.getElementById('config-preview-notice');
    previewNotice.style.display = 'block';
    this.previewMode = true;
  }

  isValidColor(color) {
    if (!color || typeof color !== 'string') return false;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Allow relative paths
    if (url.startsWith('./') || url.startsWith('../') || url.startsWith('/')) {
      return true;
    }
    
    // Validate full URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  cleanup() {
    this.previewMode = false;
    this.validationErrors = {};
    
    // Hide preview elements
    const previewContainer = document.getElementById('config-branding-preview');
    const previewNotice = document.getElementById('config-preview-notice');
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewNotice) previewNotice.style.display = 'none';
  }
  async saveConfiguration() {
    // Validate entire configuration
    this.validateAllFields();
    
    if (Object.keys(this.validationErrors).length > 0) {
      this.updateValidationDisplay();
      return;
    }
    
    try {
      // Update configuration service
      const validationResult = configService.updateConfig(this.currentConfig);
      
      if (!validationResult.isValid) {
        // Show validation errors from service
        this.validationErrors = {};
        validationResult.errors.forEach((error, index) => {
          this.validationErrors[`service_error_${index}`] = error;
        });
        this.updateValidationDisplay();
        return;
      }
      
      // Apply branding changes immediately
      if (brandingService && typeof brandingService.applyBranding === 'function') {
        await brandingService.applyBranding();
      }
      
      // Save configuration to file if possible (for persistence)
      await this.saveConfigurationToFile();
      
      // Show success message
      this.showSuccessMessage('Configuration saved successfully!');
      
      // Close modal after short delay
      setTimeout(() => {
        this.hide();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      this.showErrorMessage('Failed to save configuration. Please try again.');
    }
  }

  async saveConfigurationToFile() {
    try {
      // Create a clean configuration object without internal properties
      const configToSave = JSON.parse(JSON.stringify(this.currentConfig));
      
      // Create downloadable file
      const configJson = JSON.stringify(configToSave, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'team-config.json';
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log('Configuration file downloaded successfully');
      
    } catch (error) {
      console.warn('Could not save configuration to file:', error);
      // This is not a critical error, so we don't throw
    }
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This will lose any custom configuration.')) {
      // Get default configuration
      const defaultConfig = configService._getDefaultConfig();
      this.currentConfig = JSON.parse(JSON.stringify(defaultConfig));
      
      // Repopulate form
      this.populateForm();
      
      // Clear validation errors
      this.validationErrors = {};
      this.updateValidationDisplay();
      
      // Show notice
      this.showSuccessMessage('Configuration reset to defaults');
    }
  }

  exportConfiguration() {
    try {
      // Create configuration export
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        teamName: this.currentConfig.team?.name || 'Unknown Team',
        configuration: this.currentConfig
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-config-${this.sanitizeFilename(exportData.teamName)}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showSuccessMessage('Configuration exported successfully!');
      
    } catch (error) {
      console.error('Error exporting configuration:', error);
      this.showErrorMessage('Failed to export configuration. Please try again.');
    }
  }

  importConfiguration() {
    // Show import options modal
    this.showImportOptionsModal();
  }

  showImportOptionsModal() {
    const importModal = document.createElement('div');
    importModal.className = 'modal fade';
    importModal.id = 'configImportModal';
    importModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-upload me-2"></i>Import Configuration
            </h5>
            <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="mb-4">
              <h6>Import from File</h6>
              <p class="text-muted">Upload a previously exported configuration file</p>
              <button type="button" class="btn btn-outline-primary" id="import-file-btn">
                <i class="fas fa-file-upload me-2"></i>Choose File
              </button>
            </div>
            
            <div class="mb-4">
              <h6>Use Template</h6>
              <p class="text-muted">Start with a pre-configured template for common team types</p>
              <div class="row g-2">
                <div class="col-6">
                  <button type="button" class="btn btn-outline-success w-100" data-template="youth">
                    <i class="fas fa-child me-2"></i>Youth Team
                  </button>
                </div>
                <div class="col-6">
                  <button type="button" class="btn btn-outline-info w-100" data-template="adult">
                    <i class="fas fa-users me-2"></i>Adult Team
                  </button>
                </div>
                <div class="col-6">
                  <button type="button" class="btn btn-outline-warning w-100" data-template="sunday">
                    <i class="fas fa-futbol me-2"></i>Sunday League
                  </button>
                </div>
                <div class="col-6">
                  <button type="button" class="btn btn-outline-danger w-100" data-template="academy">
                    <i class="fas fa-graduation-cap me-2"></i>Academy
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(importModal);

    // Bind events
    importModal.addEventListener('click', (e) => {
      if (e.target.id === 'import-file-btn') {
        this.importFromFile();
      } else if (e.target.closest('[data-template]')) {
        const template = e.target.closest('[data-template]').dataset.template;
        this.loadTemplate(template);
        // Close import modal
        importModal.remove();
      } else if (e.target.closest('[data-dismiss="modal"]')) {
        importModal.remove();
      }
    });

    // Show modal
    importModal.classList.add('show');
    importModal.style.display = 'block';
    document.body.classList.add('modal-open');
  }

  importFromFile() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate import data structure
        if (!this.validateImportData(importData)) {
          this.showErrorMessage('Invalid configuration file format. Please check the file and try again.');
          return;
        }
        
        // Confirm import
        const teamName = importData.configuration?.team?.name || 'Unknown Team';
        const confirmMessage = `Import configuration for "${teamName}"?\n\nThis will replace your current settings.`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
        
        // Apply imported configuration
        this.currentConfig = JSON.parse(JSON.stringify(importData.configuration));
        this.populateForm();
        
        // Clear validation errors and validate
        this.validationErrors = {};
        this.validateAllFields();
        this.updateValidationDisplay();
        
        this.showSuccessMessage(`Configuration imported for ${teamName}`);
        
        // Close import modal
        const importModal = document.getElementById('configImportModal');
        if (importModal) {
          importModal.remove();
        }
        
      } catch (error) {
        console.error('Error importing configuration:', error);
        this.showErrorMessage('Failed to import configuration. Please check the file format.');
      }
    };
    
    input.click();
  }

  loadTemplate(templateType) {
    const templates = this.getConfigurationTemplates();
    const template = templates[templateType];
    
    if (!template) {
      this.showErrorMessage('Template not found');
      return;
    }
    
    // Confirm template load
    const confirmMessage = `Load ${template.name} template?\n\nThis will replace your current settings.`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // Apply template configuration
    this.currentConfig = JSON.parse(JSON.stringify(template.configuration));
    this.populateForm();
    
    // Clear validation errors
    this.validationErrors = {};
    this.updateValidationDisplay();
    
    this.showSuccessMessage(`${template.name} template loaded successfully`);
  }

  getConfigurationTemplates() {
    return {
      youth: {
        name: 'Youth Team',
        description: 'Configuration for youth football teams (U7-U16)',
        configuration: {
          team: {
            name: "Youth United FC",
            shortName: "YUFC",
            abbreviation: "YUFC",
            defaultOpponentName: "Opposition Youth"
          },
          branding: {
            primaryColor: "#28a745",
            secondaryColor: "#ffffff",
            logoUrl: "./youth-logo.png",
            faviconUrl: "./favicon.ico",
            appIconUrl: "./youth-icon.png"
          },
          pwa: {
            appName: "Youth United GameTime",
            shortName: "YUFC",
            description: "Youth football match tracker with enhanced event management",
            themeColor: "#28a745",
            backgroundColor: "#ffffff"
          },
          integrations: {
            leagueTable: {
              enabled: true,
              defaultUrl: "",
              corsProxies: [
                "https://corsproxy.io/?",
                "https://cors-anywhere.herokuapp.com/"
              ]
            },
            statistics: {
              enabled: false,
              apiEndpoint: null
            }
          },
          defaults: {
            matchDuration: 3600, // 60 minutes for youth
            theme: "green",
            darkMode: false
          },
          storage: {
            keyPrefix: "yufc_",
            cachePrefix: "yufc-cache-"
          }
        }
      },
      adult: {
        name: 'Adult Team',
        description: 'Configuration for adult football teams',
        configuration: {
          team: {
            name: "Adult FC",
            shortName: "AFC",
            abbreviation: "AFC",
            defaultOpponentName: "Opposition Team"
          },
          branding: {
            primaryColor: "#007bff",
            secondaryColor: "#ffffff",
            logoUrl: "./adult-logo.png",
            faviconUrl: "./favicon.ico",
            appIconUrl: "./adult-icon.png"
          },
          pwa: {
            appName: "Adult FC GameTime",
            shortName: "AFC",
            description: "Adult football match tracker with statistics and event management",
            themeColor: "#007bff",
            backgroundColor: "#ffffff"
          },
          integrations: {
            leagueTable: {
              enabled: true,
              defaultUrl: "",
              corsProxies: [
                "https://corsproxy.io/?",
                "https://cors-anywhere.herokuapp.com/"
              ]
            },
            statistics: {
              enabled: true,
              apiEndpoint: null
            }
          },
          defaults: {
            matchDuration: 5400, // 90 minutes for adult
            theme: "blue",
            darkMode: false
          },
          storage: {
            keyPrefix: "afc_",
            cachePrefix: "afc-cache-"
          }
        }
      },
      sunday: {
        name: 'Sunday League',
        description: 'Configuration for Sunday league teams',
        configuration: {
          team: {
            name: "Sunday League FC",
            shortName: "SLFC",
            abbreviation: "SLFC",
            defaultOpponentName: "Opposition"
          },
          branding: {
            primaryColor: "#ffc107",
            secondaryColor: "#212529",
            logoUrl: "./sunday-logo.png",
            faviconUrl: "./favicon.ico",
            appIconUrl: "./sunday-icon.png"
          },
          pwa: {
            appName: "Sunday League GameTime",
            shortName: "SLFC",
            description: "Sunday league match tracker with social features",
            themeColor: "#ffc107",
            backgroundColor: "#ffffff"
          },
          integrations: {
            leagueTable: {
              enabled: true,
              defaultUrl: "",
              corsProxies: [
                "https://corsproxy.io/?",
                "https://cors-anywhere.herokuapp.com/"
              ]
            },
            statistics: {
              enabled: true,
              apiEndpoint: null
            }
          },
          defaults: {
            matchDuration: 5400, // 90 minutes
            theme: "yellow",
            darkMode: false
          },
          storage: {
            keyPrefix: "slfc_",
            cachePrefix: "slfc-cache-"
          }
        }
      },
      academy: {
        name: 'Football Academy',
        description: 'Configuration for football academies and training centers',
        configuration: {
          team: {
            name: "Football Academy",
            shortName: "FA",
            abbreviation: "FA",
            defaultOpponentName: "Visiting Academy"
          },
          branding: {
            primaryColor: "#6f42c1",
            secondaryColor: "#ffffff",
            logoUrl: "./academy-logo.png",
            faviconUrl: "./favicon.ico",
            appIconUrl: "./academy-icon.png"
          },
          pwa: {
            appName: "Academy GameTime",
            shortName: "FA",
            description: "Football academy match and training tracker",
            themeColor: "#6f42c1",
            backgroundColor: "#ffffff"
          },
          integrations: {
            leagueTable: {
              enabled: false,
              defaultUrl: "",
              corsProxies: []
            },
            statistics: {
              enabled: true,
              apiEndpoint: null
            }
          },
          defaults: {
            matchDuration: 4200, // 70 minutes
            theme: "purple",
            darkMode: false
          },
          storage: {
            keyPrefix: "fa_",
            cachePrefix: "fa-cache-"
          }
        }
      }
    };
  }

  validateImportData(data) {
    // Check basic structure
    if (!data || typeof data !== 'object') return false;
    if (!data.configuration || typeof data.configuration !== 'object') return false;
    
    // Check required sections
    const requiredSections = ['team', 'branding', 'pwa', 'integrations', 'defaults', 'storage'];
    return requiredSections.every(section => 
      data.configuration[section] && typeof data.configuration[section] === 'object'
    );
  }

  validateAllFields() {
    this.validationErrors = {};
    
    // Get all form inputs
    const modal = document.getElementById(this.modalId);
    const inputs = modal.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      this.validateField(input);
    });
  }

  sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  showSuccessMessage(message) {
    // Create or update success alert
    let alert = document.getElementById('config-success-alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.id = 'config-success-alert';
      alert.className = 'alert alert-success';
      alert.innerHTML = `<i class="fas fa-check-circle me-2"></i><span></span>`;
      
      const container = document.querySelector(`#${this.modalId} .modal-body`);
      container.insertBefore(alert, container.firstChild);
    }
    
    alert.querySelector('span').textContent = message;
    alert.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      alert.style.display = 'none';
    }, 3000);
  }

  showErrorMessage(message) {
    // Create or update error alert
    let alert = document.getElementById('config-error-alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.id = 'config-error-alert';
      alert.className = 'alert alert-danger';
      alert.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i><span></span>`;
      
      const container = document.querySelector(`#${this.modalId} .modal-body`);
      container.insertBefore(alert, container.firstChild);
    }
    
    alert.querySelector('span').textContent = message;
    alert.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      alert.style.display = 'none';
    }, 5000);
  }
}

// Create and export singleton instance
export const configurationModal = new ConfigurationModal();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.configurationModal = configurationModal;
}
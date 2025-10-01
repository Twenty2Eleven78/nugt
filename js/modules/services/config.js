/**
 * Configuration Service
 * Handles loading, validation, and management of team configuration
 * @version 1.0
 */

class ConfigService {
  constructor() {
    this.config = null;
    this.defaultConfig = null;
    this.configChangeCallbacks = [];
    this.isLoaded = false;
    this.loadPromise = null;
  }

  /**
   * Load configuration from file with fallback to defaults
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<Object>} Loaded configuration
   */
  async loadConfig(configPath = './team-config.json') {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadConfigInternal(configPath);
    return this.loadPromise;
  }

  async _loadConfigInternal(configPath) {
    try {
      // Load default configuration first
      this.defaultConfig = this._getDefaultConfig();
      
      // Try to load custom configuration
      let response;
      try {
        response = await fetch(configPath);
      } catch (fetchError) {
        // Network error or file access issue
        const message = `Unable to access configuration file at ${configPath}. This might be due to network issues or file permissions. Using default configuration.`;
        console.warn('Fetch error:', fetchError);
        this._showUserFriendlyMessage('error', 'Configuration Access Error', message);
        this.config = { ...this.defaultConfig };
        this.isLoaded = true;
        return this.config;
      }
      
      if (!response.ok) {
        let message;
        if (response.status === 404) {
          message = `Configuration file not found at ${configPath}. Using default Netherton United configuration. To customize for your team, create a team-config.json file.`;
        } else if (response.status === 403) {
          message = `Access denied to configuration file at ${configPath}. Check file permissions. Using default configuration.`;
        } else {
          message = `Failed to load configuration file (HTTP ${response.status}). Using default configuration.`;
        }
        console.warn(message);
        this._showUserFriendlyMessage('info', 'Configuration Notice', message);
        this.config = { ...this.defaultConfig };
        this.isLoaded = true;
        return this.config;
      }

      let customConfig;
      try {
        customConfig = await response.json();
      } catch (jsonError) {
        const message = `Configuration file contains invalid JSON. Please check the file format. Using default configuration.`;
        console.error('JSON parsing error:', jsonError);
        this._showUserFriendlyMessage('error', 'Configuration Error', message);
        this.config = { ...this.defaultConfig };
        this.isLoaded = true;
        return this.config;
      }
      
      // Validate the loaded configuration
      const validationResult = this.validateConfig(customConfig);
      
      if (!validationResult.isValid) {
        const errorMessage = `Configuration validation failed:\n${validationResult.errors.join('\n')}`;
        console.error('Configuration validation failed:', validationResult.errors);
        this._showUserFriendlyMessage('error', 'Configuration Validation Error', 
          `Your team configuration has errors and default settings will be used instead. Please check:\n${validationResult.errors.slice(0, 3).join('\n')}${validationResult.errors.length > 3 ? '\n...and more' : ''}`);
        this.config = { ...this.defaultConfig };
      } else {
        // Merge custom config with defaults to ensure all required fields exist
        this.config = this._mergeWithDefaults(customConfig, this.defaultConfig);
        console.log('Team configuration loaded successfully');
      }
      
      this.isLoaded = true;
      this._notifyConfigChange();
      return this.config;
      
    } catch (error) {
      const message = `Unexpected error loading configuration: ${error.message}. Using default configuration.`;
      console.error('Error loading configuration:', error);
      this._showUserFriendlyMessage('error', 'Configuration Load Error', message);
      
      this.defaultConfig = this._getDefaultConfig();
      this.config = { ...this.defaultConfig };
      this.isLoaded = true;
      return this.config;
    }
  }

  /**
   * Get team-specific configuration
   * @returns {Object} Team configuration
   */
  getTeamConfig() {
    this._ensureConfigLoaded();
    return this.config?.team || this.defaultConfig.team;
  }

  /**
   * Get branding configuration
   * @returns {Object} Branding configuration
   */
  getBrandingConfig() {
    this._ensureConfigLoaded();
    return this.config?.branding || this.defaultConfig.branding;
  }

  /**
   * Get PWA configuration
   * @returns {Object} PWA configuration
   */
  getPWAConfig() {
    this._ensureConfigLoaded();
    return this.config?.pwa || this.defaultConfig.pwa;
  }

  /**
   * Get integration-specific configuration
   * @param {string} type - Integration type (e.g., 'leagueTable', 'statistics')
   * @returns {Object} Integration configuration
   */
  getIntegrationConfig(type) {
    this._ensureConfigLoaded();
    const integrations = this.config?.integrations || this.defaultConfig.integrations;
    return integrations[type] || null;
  }

  /**
   * Get defaults configuration
   * @returns {Object} Defaults configuration
   */
  getDefaultsConfig() {
    this._ensureConfigLoaded();
    return this.config?.defaults || this.defaultConfig.defaults;
  }

  /**
   * Get storage configuration
   * @returns {Object} Storage configuration
   */
  getStorageConfig() {
    this._ensureConfigLoaded();
    return this.config?.storage || this.defaultConfig.storage;
  }

  /**
   * Get complete configuration
   * @returns {Object} Complete configuration
   */
  getConfig() {
    this._ensureConfigLoaded();
    return this.config || this.defaultConfig;
  }

  /**
   * Validate configuration structure and values
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateConfig(config) {
    const errors = [];
    
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be a valid object');
      return { isValid: false, errors };
    }

    // Validate team section
    if (config.team) {
      if (typeof config.team !== 'object') {
        errors.push('team section must be an object');
      } else {
        if (config.team.name && typeof config.team.name !== 'string') {
          errors.push('team.name must be a string');
        }
        if (config.team.shortName && typeof config.team.shortName !== 'string') {
          errors.push('team.shortName must be a string');
        }
        if (config.team.abbreviation && typeof config.team.abbreviation !== 'string') {
          errors.push('team.abbreviation must be a string');
        }
        if (config.team.defaultOpponentName && typeof config.team.defaultOpponentName !== 'string') {
          errors.push('team.defaultOpponentName must be a string');
        }
      }
    }

    // Validate branding section
    if (config.branding) {
      if (typeof config.branding !== 'object') {
        errors.push('branding section must be an object');
      } else {
        const colorFields = ['primaryColor', 'secondaryColor', 'themeColor', 'backgroundColor'];
        colorFields.forEach(field => {
          if (config.branding[field] && !this._isValidColor(config.branding[field])) {
            errors.push(`branding.${field} must be a valid color (hex, rgb, or named color)`);
          }
        });
        
        const urlFields = ['logoUrl', 'faviconUrl', 'appIconUrl'];
        urlFields.forEach(field => {
          if (config.branding[field] && typeof config.branding[field] !== 'string') {
            errors.push(`branding.${field} must be a string`);
          }
        });
      }
    }

    // Validate PWA section
    if (config.pwa) {
      if (typeof config.pwa !== 'object') {
        errors.push('pwa section must be an object');
      } else {
        const stringFields = ['appName', 'shortName', 'description'];
        stringFields.forEach(field => {
          if (config.pwa[field] && typeof config.pwa[field] !== 'string') {
            errors.push(`pwa.${field} must be a string`);
          }
        });
      }
    }

    // Validate integrations section
    if (config.integrations) {
      if (typeof config.integrations !== 'object') {
        errors.push('integrations section must be an object');
      } else {
        Object.keys(config.integrations).forEach(key => {
          const integration = config.integrations[key];
          if (typeof integration !== 'object') {
            errors.push(`integrations.${key} must be an object`);
          } else {
            if (integration.enabled !== undefined && typeof integration.enabled !== 'boolean') {
              errors.push(`integrations.${key}.enabled must be a boolean`);
            }
            if (integration.corsProxies && !Array.isArray(integration.corsProxies)) {
              errors.push(`integrations.${key}.corsProxies must be an array`);
            }
          }
        });
      }
    }

    // Validate defaults section
    if (config.defaults) {
      if (typeof config.defaults !== 'object') {
        errors.push('defaults section must be an object');
      } else {
        if (config.defaults.matchDuration && typeof config.defaults.matchDuration !== 'number') {
          errors.push('defaults.matchDuration must be a number');
        }
        if (config.defaults.darkMode !== undefined && typeof config.defaults.darkMode !== 'boolean') {
          errors.push('defaults.darkMode must be a boolean');
        }
      }
    }

    // Validate storage section
    if (config.storage) {
      if (typeof config.storage !== 'object') {
        errors.push('storage section must be an object');
      } else {
        if (config.storage.keyPrefix && typeof config.storage.keyPrefix !== 'string') {
          errors.push('storage.keyPrefix must be a string');
        }
        if (config.storage.cachePrefix && typeof config.storage.cachePrefix !== 'string') {
          errors.push('storage.cachePrefix must be a string');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Register callback for configuration changes
   * @param {Function} callback - Callback function to execute on config change
   */
  onConfigChange(callback) {
    if (typeof callback === 'function') {
      this.configChangeCallbacks.push(callback);
    }
  }

  /**
   * Remove configuration change callback
   * @param {Function} callback - Callback function to remove
   */
  offConfigChange(callback) {
    const index = this.configChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.configChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Update configuration and notify listeners
   * @param {Object} newConfig - New configuration object
   * @returns {Object} Validation result
   */
  updateConfig(newConfig) {
    const validationResult = this.validateConfig(newConfig);
    
    if (validationResult.isValid) {
      this.config = this._mergeWithDefaults(newConfig, this.defaultConfig);
      this._notifyConfigChange();
    }
    
    return validationResult;
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults() {
    this.config = { ...this.defaultConfig };
    this._notifyConfigChange();
  }

  /**
   * Check if configuration is loaded
   * @returns {boolean} True if configuration is loaded
   */
  isConfigLoaded() {
    return this.isLoaded;
  }

  // Private methods

  _ensureConfigLoaded() {
    if (!this.isLoaded) {
      console.warn('Configuration not loaded yet, using defaults');
      if (!this.defaultConfig) {
        this.defaultConfig = this._getDefaultConfig();
      }
    }
  }

  _showUserFriendlyMessage(type, title, message) {
    // Try to show user-friendly messages through various methods
    
    // Method 1: Try to use existing notification service if available
    if (window.notificationService && typeof window.notificationService.show === 'function') {
      window.notificationService.show(message, type);
      return;
    }
    
    // Method 2: Try to create a simple modal or alert
    if (type === 'error') {
      // For errors, we want to make sure the user sees them
      setTimeout(() => {
        if (confirm(`${title}\n\n${message}\n\nClick OK to continue with default settings.`)) {
          // User acknowledged the error
        }
      }, 1000); // Delay to ensure DOM is ready
    } else {
      // For info messages, just log to console (less intrusive)
      console.info(`${title}: ${message}`);
    }
  }

  /**
   * Get configuration loading status and any errors
   * @returns {Object} Status object with loading state and errors
   */
  getLoadingStatus() {
    return {
      isLoaded: this.isLoaded,
      hasErrors: this.config === this.defaultConfig && this.isLoaded,
      usingDefaults: this.config === this.defaultConfig
    };
  }

  /**
   * Retry loading configuration
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<Object>} Loaded configuration
   */
  async retryLoadConfig(configPath = './team-config.json') {
    this.isLoaded = false;
    this.loadPromise = null;
    return this.loadConfig(configPath);
  }

  /**
   * Reload configuration without page refresh
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<Object>} Reloaded configuration
   */
  async reloadConfig(configPath = './team-config.json') {
    console.log('Reloading configuration...');
    
    // Store old configuration for comparison
    const oldConfig = this.config ? { ...this.config } : null;
    
    // Reset state and reload
    this.isLoaded = false;
    this.loadPromise = null;
    
    try {
      const newConfig = await this.loadConfig(configPath);
      
      // Check if configuration actually changed
      if (oldConfig && this._configsAreEqual(oldConfig, newConfig)) {
        console.log('Configuration unchanged after reload');
        return newConfig;
      }
      
      console.log('Configuration reloaded successfully with changes');
      return newConfig;
      
    } catch (error) {
      console.error('Error reloading configuration:', error);
      throw error;
    }
  }

  /**
   * Check if configuration is healthy (loaded without errors)
   * @returns {boolean} True if configuration is loaded and valid
   */
  isConfigHealthy() {
    return this.isLoaded && this.config !== this.defaultConfig;
  }

  /**
   * Get configuration diagnostics for troubleshooting
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    return {
      isLoaded: this.isLoaded,
      isHealthy: this.isConfigHealthy(),
      usingDefaults: this.config === this.defaultConfig,
      configSections: this.config ? Object.keys(this.config) : [],
      hasValidTeamName: this.config?.team?.name && this.config.team.name !== this.defaultConfig.team.name,
      hasCustomBranding: this.config?.branding?.primaryColor !== this.defaultConfig.branding.primaryColor,
      enabledIntegrations: this.config?.integrations ? 
        Object.keys(this.config.integrations).filter(key => this.config.integrations[key]?.enabled) : []
    };
  }

  _notifyConfigChange() {
    this.configChangeCallbacks.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Error in config change callback:', error);
      }
    });
  }

  _mergeWithDefaults(customConfig, defaultConfig) {
    const merged = {};
    
    // Start with defaults
    Object.keys(defaultConfig).forEach(key => {
      if (typeof defaultConfig[key] === 'object' && !Array.isArray(defaultConfig[key])) {
        merged[key] = { ...defaultConfig[key] };
      } else {
        merged[key] = defaultConfig[key];
      }
    });
    
    // Override with custom values
    Object.keys(customConfig).forEach(key => {
      if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key]) && 
          typeof defaultConfig[key] === 'object' && !Array.isArray(defaultConfig[key])) {
        merged[key] = { ...defaultConfig[key], ...customConfig[key] };
      } else {
        merged[key] = customConfig[key];
      }
    });
    
    return merged;
  }

  _isValidColor(color) {
    if (typeof color !== 'string') return false;
    
    // Check hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) return true;
    
    // Check rgb/rgba colors
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color)) return true;
    if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color)) return true;
    
    // Check named colors (basic set)
    const namedColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey'];
    if (namedColors.includes(color.toLowerCase())) return true;
    
    return false;
  }

  _configsAreEqual(config1, config2) {
    try {
      return JSON.stringify(config1) === JSON.stringify(config2);
    } catch (error) {
      console.warn('Error comparing configurations:', error);
      return false;
    }
  }

  _getDefaultConfig() {
    return {
      team: {
        name: "Netherton United",
        shortName: "NUFC",
        abbreviation: "NUGT",
        defaultOpponentName: "Opposition Team"
      },
      branding: {
        primaryColor: "#dc3545",
        secondaryColor: "#ffffff",
        logoUrl: "./nugtlogo.png",
        faviconUrl: "./favicon.ico",
        appIconUrl: "./nugt512.png"
      },
      pwa: {
        appName: "Netherton United Game Time App",
        shortName: "NUGT",
        description: "Advanced football match tracker with attendance, statistics, and enhanced event management",
        themeColor: "#dc3545",
        backgroundColor: "#ffffff"
      },
      integrations: {
        leagueTable: {
          enabled: true,
          defaultUrl: "https://example-league-url.com",
          corsProxies: [
            "https://corsproxy.io/?",
            "https://cors-anywhere.herokuapp.com/",
            "https://api.allorigins.win/get?url="
          ]
        },
        statistics: {
          enabled: true,
          apiEndpoint: null
        }
      },
      defaults: {
        matchDuration: 4200,
        theme: "red",
        darkMode: false
      },
      storage: {
        keyPrefix: "nugt_",
        cachePrefix: "nugt-cache-"
      }
    };
  }
}

// Create and export singleton instance
export const configService = new ConfigService();
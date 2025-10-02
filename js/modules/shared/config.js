/**
 * Configuration Manager
 * Centralized configuration loading and management for team-specific deployments
 */

class ConfigManager {
  constructor() {
    this.config = null;
    this.loaded = false;
  }

  /**
   * Load configuration from config.json
   * @returns {Promise<Object>} Configuration object
   */
  async load() {
    if (this.loaded && this.config) {
      return this.config;
    }

    try {
      const response = await fetch('./config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      
      this.config = await response.json();
      this.loaded = true;
      
      console.log('Configuration loaded successfully:', this.config.app.name);
      return this.config;
    } catch (error) {
      console.error('Failed to load configuration, using defaults:', error);
      
      // Fallback to default configuration
      this.config = this.getDefaultConfig();
      this.loaded = true;
      return this.config;
    }
  }

  /**
   * Get configuration value by path (e.g., 'app.name' or 'team.defaultTeam1Name')
   * @param {string} path - Dot-separated path to config value
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = null) {
    if (!this.config) {
      console.warn('Configuration not loaded yet. Call load() first.');
      return defaultValue;
    }

    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value by path
   * @param {string} path - Dot-separated path to config value
   * @param {*} value - Value to set
   */
  set(path, value) {
    if (!this.config) {
      console.warn('Configuration not loaded yet. Call load() first.');
      return;
    }

    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;

    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
  }

  /**
   * Get the entire configuration object
   * @returns {Object} Full configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} Whether feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get default configuration (fallback)
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      app: {
        name: 'NUFC GameTime',
        shortName: 'NUGT',
        version: '4.0',
        description: 'Football match tracking and statistics application',
        author: 'NUFC GameTime Team'
      },
      team: {
        defaultTeam1Name: 'Netherton',
        defaultTeam2Name: 'Opposition',
        clubName: 'Netherton United',
        clubColors: {
          primary: '#dc3545',
          secondary: '#ffffff'
        }
      },
      match: {
        defaultGameTime: 4200,
        gameDurations: {
          '7v7_40min': 2400,
          '7v7_50min': 3000,
          '9v9_60min': 3600,
          '11v11_70min': 4200,
          '11v11_80min': 4800,
          '11v11_90min': 5400
        },
        timerUpdateInterval: 100,
        autoSaveInterval: 5000
      },
      ui: {
        theme: {
          defaultTheme: 'red',
          availableThemes: ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'cyan', 'pink']
        },
        notifications: {
          defaultDuration: 2000,
          maxNotifications: 5
        },
        debounceDelay: 300
      },
      features: {
        authentication: true,
        cloudStorage: true,
        attendance: true,
        statistics: true,
        sharing: true,
        pwa: true
      }
    };
  }

  /**
   * Export current configuration as JSON string
   * @returns {string} JSON configuration
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Validate configuration structure
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];
    
    if (!this.config) {
      errors.push('Configuration not loaded');
      return { isValid: false, errors };
    }

    // Required sections
    const requiredSections = ['app', 'team', 'match', 'ui', 'features'];
    for (const section of requiredSections) {
      if (!this.config[section]) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Required app fields
    if (this.config.app) {
      const requiredAppFields = ['name', 'version'];
      for (const field of requiredAppFields) {
        if (!this.config.app[field]) {
          errors.push(`Missing required app field: ${field}`);
        }
      }
    }

    // Required team fields
    if (this.config.team) {
      const requiredTeamFields = ['defaultTeam1Name', 'defaultTeam2Name'];
      for (const field of requiredTeamFields) {
        if (!this.config.team[field]) {
          errors.push(`Missing required team field: ${field}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
export const config = new ConfigManager();

// Export for direct access to class if needed
export { ConfigManager };
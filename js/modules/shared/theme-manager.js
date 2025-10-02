/**
 * Theme Manager Module
 * Handles theme switching and persistence
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'red';
    this.isDarkMode = false;
    this.themeSelect = null;
    this.themePreview = null;
    this.darkModeToggle = null;

    this.themes = {
      red: {
        name: 'Red (Default)',
        primary: '#dc3545',
        primaryLight: '#e74c3c',
        primaryDark: '#c82333'
      },
      blue: {
        name: 'Blue',
        primary: '#007bff',
        primaryLight: '#0d6efd',
        primaryDark: '#0056b3'
      },
      green: {
        name: 'Green',
        primary: '#28a745',
        primaryLight: '#20c997',
        primaryDark: '#1e7e34'
      },
      purple: {
        name: 'Purple',
        primary: '#6f42c1',
        primaryLight: '#8a63d2',
        primaryDark: '#59359a'
      },
      orange: {
        name: 'Orange',
        primary: '#fd7e14',
        primaryLight: '#ff8c42',
        primaryDark: '#e8590c'
      },
      yellow: {
        name: 'Yellow',
        primary: '#ffc107',
        primaryLight: '#ffca2c',
        primaryDark: '#e0a800'
      },
      cyan: {
        name: 'Cyan',
        primary: '#17a2b8',
        primaryLight: '#20c9d9',
        primaryDark: '#138496'
      },
      pink: {
        name: 'Pink',
        primary: '#e83e8c',
        primaryLight: '#f065a8',
        primaryDark: '#d63384'
      }
    };
  }

  /**
   * Initialize theme manager
   */
  async init() {
    try {
      this.themeSelect = document.getElementById('themeSelect');
      this.themePreview = document.getElementById('themePreview');
      this.darkModeToggle = document.getElementById('darkModeToggle');

      if (!this.themeSelect || !this.themePreview || !this.darkModeToggle) {
        console.warn('Theme manager: Required elements not found');
        return;
      }

      // Load saved theme and dark mode preference
      await this.loadSavedSettings();

      // Set up event listeners
      this.setupEventListeners();

      // Update preview
      this.updateThemePreview();

      console.log('Theme manager initialized successfully');
    } catch (error) {
      console.error('Error initializing theme manager:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        this.changeTheme(e.target.value);
      });
    }

    if (this.darkModeToggle) {
      this.darkModeToggle.addEventListener('change', (e) => {
        this.toggleDarkMode(e.target.checked);
      });
    }
  }

  /**
   * Load saved theme and dark mode from localStorage
   */
  async loadSavedSettings() {
    try {
      // Load color theme - check config first, then localStorage
      const savedTheme = localStorage.getItem('app-theme');
      let defaultTheme = 'red';
      
      // Try to get default theme from config
      try {
        const { config } = await import('./config.js');
        if (config.loaded) {
          defaultTheme = config.get('ui.theme.defaultTheme', 'red');
        }
      } catch (error) {
        console.warn('Could not load theme from config, using default');
      }
      
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
      } else {
        this.currentTheme = defaultTheme;
      }
      
      if (this.themeSelect) {
        this.themeSelect.value = this.currentTheme;
      }

      // Load dark mode preference
      const savedDarkMode = localStorage.getItem('app-dark-mode');
      this.isDarkMode = savedDarkMode === 'true';
      if (this.darkModeToggle) {
        this.darkModeToggle.checked = this.isDarkMode;
      }

      // Apply the combined theme
      this.applyCurrentTheme();
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  }

  /**
   * Change color theme
   * @param {string} themeName - Theme name to apply
   */
  changeTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error('Invalid theme name:', themeName);
      return;
    }

    try {
      this.currentTheme = themeName;
      this.applyCurrentTheme();
      this.saveSettings();
      this.updateThemePreview();

      // Dispatch theme change event
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: {
          theme: themeName,
          darkMode: this.isDarkMode,
          themeData: this.themes[themeName]
        }
      }));

      console.log('Color theme changed to:', themeName);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  }

  /**
   * Toggle dark mode
   * @param {boolean} enabled - Whether dark mode should be enabled
   */
  toggleDarkMode(enabled) {
    try {
      this.isDarkMode = enabled;
      this.applyCurrentTheme();
      this.saveSettings();

      // Dispatch dark mode change event
      window.dispatchEvent(new CustomEvent('darkModeChanged', {
        detail: {
          darkMode: enabled,
          theme: this.currentTheme,
          themeData: this.themes[this.currentTheme]
        }
      }));

      console.log('Dark mode', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  }

  /**
   * Apply current theme and dark mode to document
   */
  applyCurrentTheme() {
    const body = document.body;

    // Remove existing theme classes
    Object.keys(this.themes).forEach(theme => {
      body.classList.remove(`theme-${theme}`);
    });
    body.classList.remove('theme-dark');

    // Add color theme class
    body.classList.add(`theme-${this.currentTheme}`);

    // Add dark mode class if enabled
    if (this.isDarkMode) {
      body.classList.add('theme-dark');
    }

    // Set data attributes
    body.setAttribute('data-theme', this.currentTheme);
    body.setAttribute('data-dark-mode', this.isDarkMode.toString());

    // Apply theme-specific styles
    this.applyThemeSpecificStyles();
  }

  /**
   * Apply theme-specific styles
   */
  applyThemeSpecificStyles() {
    // Apply dark mode specific adjustments
    if (this.isDarkMode) {
      // Dark theme specific shadows
      document.documentElement.style.setProperty('--box-shadow', '0 2px 8px rgba(255,255,255,0.05)');
      document.documentElement.style.setProperty('--box-shadow-hover', '0 4px 12px rgba(255,255,255,0.1)');
      document.documentElement.style.setProperty('--box-shadow-card', '0 2px 8px rgba(255,255,255,0.05)');
      document.documentElement.style.setProperty('--box-shadow-modal', '0 8px 32px rgba(255,255,255,0.1)');
    } else {
      // Light theme shadows
      document.documentElement.style.setProperty('--box-shadow', '0 2px 8px rgba(0,0,0,0.08)');
      document.documentElement.style.setProperty('--box-shadow-hover', '0 4px 12px rgba(0,0,0,0.15)');
      document.documentElement.style.setProperty('--box-shadow-card', '0 2px 8px rgba(0,0,0,0.08)');
      document.documentElement.style.setProperty('--box-shadow-modal', '0 8px 32px rgba(0,0,0,0.15)');
    }
  }

  /**
   * Save theme and dark mode settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('app-theme', this.currentTheme);
      localStorage.setItem('app-dark-mode', this.isDarkMode.toString());
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Update theme preview
   */
  updateThemePreview() {
    if (!this.themePreview) return;

    const theme = this.themes[this.currentTheme];
    if (theme) {
      this.themePreview.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`;
    }
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get dark mode status
   * @returns {boolean} Whether dark mode is enabled
   */
  isDarkModeEnabled() {
    return this.isDarkMode;
  }

  /**
   * Get theme data
   * @param {string} themeName - Theme name
   * @returns {object} Theme data
   */
  getThemeData(themeName) {
    return this.themes[themeName] || null;
  }

  /**
   * Get all available themes
   * @returns {object} All themes
   */
  getAllThemes() {
    return this.themes;
  }

  /**
   * Get current theme settings
   * @returns {object} Current theme and dark mode settings
   */
  getCurrentSettings() {
    return {
      theme: this.currentTheme,
      darkMode: this.isDarkMode,
      themeData: this.themes[this.currentTheme]
    };
  }


}

// Create and export theme manager instance
const themeManager = new ThemeManager();

export default themeManager;
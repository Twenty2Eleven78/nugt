/**
 * Theme Manager Module
 * Handles theme switching and persistence
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'red';
    this.themeSelect = null;
    this.themePreview = null;
    
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
      dark: {
        name: 'Dark Mode',
        primary: '#dc3545',
        primaryLight: '#e74c3c',
        primaryDark: '#c82333'
      }
    };
  }

  /**
   * Initialize theme manager
   */
  init() {
    try {
      this.themeSelect = document.getElementById('themeSelect');
      this.themePreview = document.getElementById('themePreview');
      
      if (!this.themeSelect || !this.themePreview) {
        console.warn('Theme manager: Required elements not found');
        return;
      }

      // Load saved theme
      this.loadSavedTheme();
      
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
  }

  /**
   * Load saved theme from localStorage
   */
  loadSavedTheme() {
    try {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
        this.applyTheme(savedTheme);
        
        if (this.themeSelect) {
          this.themeSelect.value = savedTheme;
        }
      }
    } catch (error) {
      console.error('Error loading saved theme:', error);
    }
  }

  /**
   * Change theme
   * @param {string} themeName - Theme name to apply
   */
  changeTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error('Invalid theme name:', themeName);
      return;
    }

    try {
      this.currentTheme = themeName;
      this.applyTheme(themeName);
      this.saveTheme(themeName);
      this.updateThemePreview();
      
      // Dispatch theme change event
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: themeName, themeData: this.themes[themeName] }
      }));
      
      console.log('Theme changed to:', themeName);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  }

  /**
   * Apply theme to document
   * @param {string} themeName - Theme name to apply
   */
  applyTheme(themeName) {
    const body = document.body;
    
    // Remove existing theme classes
    Object.keys(this.themes).forEach(theme => {
      body.classList.remove(`theme-${theme}`);
    });
    
    // Add new theme class and data attribute
    body.classList.add(`theme-${themeName}`);
    body.setAttribute('data-theme', themeName);
    
    // Apply theme-specific styles if needed
    this.applyThemeSpecificStyles(themeName);
  }

  /**
   * Apply theme-specific styles
   * @param {string} themeName - Theme name
   */
  applyThemeSpecificStyles(themeName) {
    // Add any theme-specific logic here
    if (themeName === 'dark') {
      // Dark theme specific adjustments
      document.documentElement.style.setProperty('--box-shadow', '0 2px 8px rgba(255,255,255,0.05)');
      document.documentElement.style.setProperty('--box-shadow-hover', '0 4px 12px rgba(255,255,255,0.1)');
    } else {
      // Light theme shadows
      document.documentElement.style.setProperty('--box-shadow', '0 2px 8px rgba(0,0,0,0.08)');
      document.documentElement.style.setProperty('--box-shadow-hover', '0 4px 12px rgba(0,0,0,0.15)');
    }
  }

  /**
   * Save theme to localStorage
   * @param {string} themeName - Theme name to save
   */
  saveTheme(themeName) {
    try {
      localStorage.setItem('app-theme', themeName);
    } catch (error) {
      console.error('Error saving theme:', error);
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
}

// Create and export theme manager instance
const themeManager = new ThemeManager();

export default themeManager;
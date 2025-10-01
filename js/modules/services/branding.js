/**
 * Branding Service
 * Handles dynamic application of team branding including colors, logos, and visual elements
 * @version 1.0
 */

import { configService } from './config.js';

class BrandingService {
  constructor() {
    this.isInitialized = false;
    this.originalFavicon = null;
    this.originalLogo = null;
    this.cssCustomProperties = new Map();
    
    // Bind methods to preserve context
    this.handleConfigChange = this.handleConfigChange.bind(this);
  }

  /**
   * Initialize the branding service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Store original values for fallback
      this.storeOriginalAssets();
      
      // Wait for config to be loaded
      if (!configService.isConfigLoaded()) {
        await configService.loadConfig();
      }
      
      // Apply initial branding
      await this.applyBranding();
      
      // Listen for configuration changes
      configService.onConfigChange(this.handleConfigChange);
      
      this.isInitialized = true;
      console.log('Branding service initialized successfully');
      
    } catch (error) {
      console.error('Error initializing branding service:', error);
      // Continue with defaults if branding fails
    }
  }

  /**
   * Apply complete branding based on current configuration
   * @returns {Promise<void>}
   */
  async applyBranding() {
    try {
      const brandingConfig = configService.getBrandingConfig();
      
      if (!brandingConfig) {
        console.warn('No branding configuration available, using defaults');
        return;
      }

      // Apply theme colors
      this.applyThemeColors(brandingConfig);
      
      // Update logos
      await this.updateLogo(brandingConfig.logoUrl);
      
      // Update favicon
      await this.updateFavicon(brandingConfig.faviconUrl);
      
      console.log('Branding applied successfully');
      
    } catch (error) {
      console.error('Error applying branding:', error);
      this.revertToDefaults();
    }
  }

  /**
   * Apply theme colors using CSS custom properties
   * @param {Object} brandingConfig - Branding configuration object
   */
  applyThemeColors(brandingConfig) {
    try {
      const root = document.documentElement;
      
      // Define color mappings
      const colorMappings = {
        '--primary-color': brandingConfig.primaryColor,
        '--secondary-color': brandingConfig.secondaryColor,
        '--theme-color': brandingConfig.primaryColor, // Use primary as theme
        '--brand-primary': brandingConfig.primaryColor,
        '--brand-secondary': brandingConfig.secondaryColor
      };

      // Apply colors and store for potential revert
      Object.entries(colorMappings).forEach(([property, value]) => {
        if (value) {
          // Store original value if not already stored
          if (!this.cssCustomProperties.has(property)) {
            const originalValue = getComputedStyle(root).getPropertyValue(property);
            this.cssCustomProperties.set(property, originalValue);
          }
          
          root.style.setProperty(property, value);
        }
      });

      // Update theme-color meta tag for PWA
      this.updateThemeColorMeta(brandingConfig.primaryColor);
      
      console.log('Theme colors applied:', colorMappings);
      
    } catch (error) {
      console.error('Error applying theme colors:', error);
    }
  }

  /**
   * Update logo elements in the UI
   * @param {string} logoUrl - URL to the logo image
   * @returns {Promise<void>}
   */
  async updateLogo(logoUrl) {
    if (!logoUrl) {
      console.warn('No logo URL provided');
      return;
    }

    try {
      // Validate image before applying
      const isValid = await this.validateImageUrl(logoUrl);
      if (!isValid) {
        console.warn('Logo URL is not accessible, using fallback');
        return;
      }

      // Find and update logo elements
      const logoElements = document.querySelectorAll('img[src*="logo"], img[alt*="logo"], img[alt*="NUGT"]');
      
      logoElements.forEach(img => {
        // Store original src if not already stored
        if (!this.originalLogo && img.src) {
          this.originalLogo = img.src;
        }
        
        img.src = logoUrl;
        
        // Update alt text to be more generic
        if (img.alt && img.alt.includes('NUGT')) {
          const teamConfig = configService.getTeamConfig();
          img.alt = `${teamConfig?.name || 'Team'} logo`;
        }
      });

      console.log('Logo updated successfully:', logoUrl);
      
    } catch (error) {
      console.error('Error updating logo:', error);
    }
  }

  /**
   * Update favicon dynamically
   * @param {string} faviconUrl - URL to the favicon
   * @returns {Promise<void>}
   */
  async updateFavicon(faviconUrl) {
    if (!faviconUrl) {
      console.warn('No favicon URL provided');
      return;
    }

    try {
      // Validate image before applying
      const isValid = await this.validateImageUrl(faviconUrl);
      if (!isValid) {
        console.warn('Favicon URL is not accessible, using fallback');
        return;
      }

      // Find existing favicon links
      const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
      
      faviconLinks.forEach(link => {
        // Store original href if not already stored
        if (!this.originalFavicon && link.href) {
          this.originalFavicon = link.href;
        }
        
        link.href = faviconUrl;
      });

      console.log('Favicon updated successfully:', faviconUrl);
      
    } catch (error) {
      console.error('Error updating favicon:', error);
    }
  }

  /**
   * Update theme-color meta tag
   * @param {string} themeColor - Theme color value
   */
  updateThemeColorMeta(themeColor) {
    if (!themeColor) return;

    try {
      let themeColorMeta = document.querySelector('meta[name="theme-color"]');
      
      if (!themeColorMeta) {
        // Create theme-color meta tag if it doesn't exist
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
      }
      
      themeColorMeta.content = themeColor;
      
      // Also update msapplication-TileColor if it exists
      const tileColorMeta = document.querySelector('meta[name="msapplication-TileColor"]');
      if (tileColorMeta) {
        tileColorMeta.content = themeColor;
      }
      
    } catch (error) {
      console.error('Error updating theme color meta:', error);
    }
  }

  /**
   * Validate if an image URL is accessible
   * @param {string} imageUrl - URL to validate
   * @returns {Promise<boolean>} True if image is accessible
   */
  async validateImageUrl(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      // Set a timeout to avoid hanging
      setTimeout(() => resolve(false), 5000);
      
      img.src = imageUrl;
    });
  }

  /**
   * Handle configuration changes
   * @param {Object} newConfig - New configuration object
   */
  async handleConfigChange(newConfig) {
    try {
      console.log('Branding service: Configuration changed, reapplying branding');
      await this.applyBranding();
    } catch (error) {
      console.error('Error handling configuration change in branding service:', error);
    }
  }

  /**
   * Store original asset URLs for fallback
   */
  storeOriginalAssets() {
    try {
      // Store original favicon
      const faviconLink = document.querySelector('link[rel*="icon"]');
      if (faviconLink && !this.originalFavicon) {
        this.originalFavicon = faviconLink.href;
      }

      // Store original logo
      const logoImg = document.querySelector('img[src*="logo"], img[alt*="logo"]');
      if (logoImg && !this.originalLogo) {
        this.originalLogo = logoImg.src;
      }
      
    } catch (error) {
      console.error('Error storing original assets:', error);
    }
  }

  /**
   * Revert to default/original branding
   */
  revertToDefaults() {
    try {
      const root = document.documentElement;
      
      // Revert CSS custom properties
      this.cssCustomProperties.forEach((originalValue, property) => {
        if (originalValue) {
          root.style.setProperty(property, originalValue);
        } else {
          root.style.removeProperty(property);
        }
      });

      // Revert favicon
      if (this.originalFavicon) {
        const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
        faviconLinks.forEach(link => {
          link.href = this.originalFavicon;
        });
      }

      // Revert logo
      if (this.originalLogo) {
        const logoElements = document.querySelectorAll('img[src*="logo"], img[alt*="logo"]');
        logoElements.forEach(img => {
          img.src = this.originalLogo;
        });
      }

      console.log('Reverted to default branding');
      
    } catch (error) {
      console.error('Error reverting to defaults:', error);
    }
  }

  /**
   * Get current branding status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasOriginalFavicon: !!this.originalFavicon,
      hasOriginalLogo: !!this.originalLogo,
      appliedProperties: Array.from(this.cssCustomProperties.keys())
    };
  }

  /**
   * Cleanup method for service shutdown
   */
  cleanup() {
    try {
      // Remove config change listener
      configService.offConfigChange(this.handleConfigChange);
      
      // Revert to defaults
      this.revertToDefaults();
      
      // Clear stored data
      this.cssCustomProperties.clear();
      this.originalFavicon = null;
      this.originalLogo = null;
      this.isInitialized = false;
      
      console.log('Branding service cleaned up');
      
    } catch (error) {
      console.error('Error during branding service cleanup:', error);
    }
  }
}

// Create and export singleton instance
export const brandingService = new BrandingService();
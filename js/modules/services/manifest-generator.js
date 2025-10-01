/**
 * PWA Manifest Generator Service
 * Generates dynamic PWA manifest based on team configuration
 * @version 1.0
 */

import { configService } from './config.js';

class ManifestGeneratorService {
  constructor() {
    this.isInitialized = false;
    this.originalManifestUrl = null;
    this.dynamicManifestBlob = null;
    this.dynamicManifestUrl = null;
    
    // Bind methods to preserve context
    this.handleConfigChange = this.handleConfigChange.bind(this);
  }

  /**
   * Initialize the manifest generator service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Store original manifest URL
      this.storeOriginalManifest();
      
      // Wait for config to be loaded
      if (!configService.isConfigLoaded()) {
        await configService.loadConfig();
      }
      
      // Generate and apply dynamic manifest
      await this.generateAndApplyManifest();
      
      // Listen for configuration changes
      configService.onConfigChange(this.handleConfigChange);
      
      this.isInitialized = true;
      console.log('Manifest generator service initialized successfully');
      
    } catch (error) {
      console.error('Error initializing manifest generator service:', error);
    }
  }

  /**
   * Generate PWA manifest from configuration
   * @returns {Object} Generated manifest object
   */
  generateManifest() {
    try {
      const teamConfig = configService.getTeamConfig();
      const brandingConfig = configService.getBrandingConfig();
      const pwaConfig = configService.getPWAConfig();
      
      if (!teamConfig || !brandingConfig || !pwaConfig) {
        console.warn('Incomplete configuration for manifest generation, using defaults');
        return this.getDefaultManifest();
      }

      // Generate icons array
      const icons = this.generateIcons(brandingConfig);
      
      // Generate shortcuts with team-specific information
      const shortcuts = this.generateShortcuts(teamConfig, brandingConfig);

      // Create manifest object
      const manifest = {
        name: pwaConfig.appName || `${teamConfig.name} Game Time App`,
        short_name: pwaConfig.shortName || teamConfig.abbreviation || teamConfig.shortName,
        start_url: "./",
        scope: "./",
        theme_color: pwaConfig.themeColor || brandingConfig.primaryColor,
        background_color: pwaConfig.backgroundColor || brandingConfig.secondaryColor,
        display: "standalone",
        description: pwaConfig.description || `Advanced football match tracker for ${teamConfig.name}`,
        icons: icons,
        id: teamConfig.abbreviation || teamConfig.shortName || "TEAM",
        lang: "en",
        orientation: "portrait-primary",
        categories: [
          "sports",
          "utilities"
        ],
        display_override: [
          "window-controls-overlay",
          "standalone"
        ],
        launch_handler: {
          client_mode: [
            "focus-existing",
            "auto"
          ]
        },
        handle_links: "preferred",
        prefer_related_applications: false,
        edge_side_panel: {
          preferred_width: 400
        },
        screenshots: [],
        shortcuts: shortcuts
      };

      return manifest;
      
    } catch (error) {
      console.error('Error generating manifest:', error);
      return this.getDefaultManifest();
    }
  }

  /**
   * Generate icons array for the manifest
   * @param {Object} brandingConfig - Branding configuration
   * @returns {Array} Icons array
   */
  generateIcons(brandingConfig) {
    const icons = [];
    
    // Add favicon if available
    if (brandingConfig.faviconUrl) {
      icons.push({
        src: brandingConfig.faviconUrl,
        sizes: "16x16 32x32",
        type: "image/x-icon"
      });
    }

    // Add app icon in multiple sizes if available
    if (brandingConfig.appIconUrl) {
      // Standard icon
      icons.push({
        src: brandingConfig.appIconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      });

      // Large icon
      icons.push({
        src: brandingConfig.appIconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      });

      // Maskable icon
      icons.push({
        src: brandingConfig.appIconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      });
    }

    // Fallback to default icons if no custom icons provided
    if (icons.length === 0) {
      icons.push(
        {
          src: "./favicon.ico",
          sizes: "16x16 32x32",
          type: "image/x-icon"
        },
        {
          src: "./nugt512.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "./nugt512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        }
      );
    }

    return icons;
  }

  /**
   * Generate shortcuts for the manifest
   * @param {Object} teamConfig - Team configuration
   * @param {Object} brandingConfig - Branding configuration
   * @returns {Array} Shortcuts array
   */
  generateShortcuts(teamConfig, brandingConfig) {
    const iconUrl = brandingConfig.appIconUrl || "./nugt512.png";
    
    return [
      {
        name: "New Match",
        short_name: "New Match",
        description: `Start a new ${teamConfig.name} match`,
        url: "./?action=new-match",
        icons: [
          {
            src: iconUrl,
            sizes: "192x192"
          }
        ]
      }
    ];
  }

  /**
   * Generate and apply the dynamic manifest
   * @returns {Promise<void>}
   */
  async generateAndApplyManifest() {
    try {
      // Generate manifest
      const manifest = this.generateManifest();
      
      // Create blob and URL for the manifest
      const manifestJson = JSON.stringify(manifest, null, 2);
      
      // Clean up previous dynamic manifest
      if (this.dynamicManifestUrl) {
        URL.revokeObjectURL(this.dynamicManifestUrl);
      }
      
      this.dynamicManifestBlob = new Blob([manifestJson], { type: 'application/json' });
      this.dynamicManifestUrl = URL.createObjectURL(this.dynamicManifestBlob);
      
      // Update manifest link in document
      this.updateManifestLink(this.dynamicManifestUrl);
      
      console.log('Dynamic manifest generated and applied successfully');
      
    } catch (error) {
      console.error('Error generating and applying manifest:', error);
      this.revertToOriginalManifest();
    }
  }

  /**
   * Update the manifest link in the document head
   * @param {string} manifestUrl - URL to the manifest
   */
  updateManifestLink(manifestUrl) {
    try {
      let manifestLink = document.querySelector('link[rel="manifest"]');
      
      if (!manifestLink) {
        // Create manifest link if it doesn't exist
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      
      manifestLink.href = manifestUrl;
      
    } catch (error) {
      console.error('Error updating manifest link:', error);
    }
  }

  /**
   * Handle configuration changes
   * @param {Object} newConfig - New configuration object
   */
  async handleConfigChange(newConfig) {
    try {
      console.log('Manifest generator: Configuration changed, regenerating manifest');
      await this.generateAndApplyManifest();
    } catch (error) {
      console.error('Error handling configuration change in manifest generator:', error);
    }
  }

  /**
   * Store the original manifest URL
   */
  storeOriginalManifest() {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink && !this.originalManifestUrl) {
        this.originalManifestUrl = manifestLink.href;
      }
    } catch (error) {
      console.error('Error storing original manifest:', error);
    }
  }

  /**
   * Revert to the original manifest
   */
  revertToOriginalManifest() {
    try {
      if (this.originalManifestUrl) {
        this.updateManifestLink(this.originalManifestUrl);
        console.log('Reverted to original manifest');
      }
    } catch (error) {
      console.error('Error reverting to original manifest:', error);
    }
  }

  /**
   * Get default manifest structure
   * @returns {Object} Default manifest
   */
  getDefaultManifest() {
    return {
      name: "Team Game Time App",
      short_name: "GameTime",
      start_url: "./",
      scope: "./",
      theme_color: "#dc3545",
      background_color: "#ffffff",
      display: "standalone",
      description: "Advanced football match tracker with attendance, statistics, and enhanced event management",
      icons: [
        {
          src: "./favicon.ico",
          sizes: "16x16 32x32",
          type: "image/x-icon"
        },
        {
          src: "./nugt512.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "./nugt512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        }
      ],
      id: "TEAM",
      lang: "en",
      orientation: "portrait-primary",
      categories: ["sports", "utilities"],
      display_override: ["window-controls-overlay", "standalone"],
      launch_handler: {
        client_mode: ["focus-existing", "auto"]
      },
      handle_links: "preferred",
      prefer_related_applications: false,
      edge_side_panel: {
        preferred_width: 400
      },
      screenshots: [],
      shortcuts: [
        {
          name: "New Match",
          short_name: "New Match",
          description: "Start a new football match",
          url: "./?action=new-match",
          icons: [
            {
              src: "./nugt512.png",
              sizes: "192x192"
            }
          ]
        }
      ]
    };
  }

  /**
   * Get the current generated manifest
   * @returns {Object|null} Current manifest object or null if not generated
   */
  getCurrentManifest() {
    try {
      return this.generateManifest();
    } catch (error) {
      console.error('Error getting current manifest:', error);
      return null;
    }
  }

  /**
   * Get manifest generator status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasOriginalManifest: !!this.originalManifestUrl,
      hasDynamicManifest: !!this.dynamicManifestUrl,
      dynamicManifestUrl: this.dynamicManifestUrl
    };
  }

  /**
   * Cleanup method for service shutdown
   */
  cleanup() {
    try {
      // Remove config change listener
      configService.offConfigChange(this.handleConfigChange);
      
      // Revert to original manifest
      this.revertToOriginalManifest();
      
      // Clean up blob URL
      if (this.dynamicManifestUrl) {
        URL.revokeObjectURL(this.dynamicManifestUrl);
      }
      
      // Clear stored data
      this.originalManifestUrl = null;
      this.dynamicManifestBlob = null;
      this.dynamicManifestUrl = null;
      this.isInitialized = false;
      
      console.log('Manifest generator service cleaned up');
      
    } catch (error) {
      console.error('Error during manifest generator cleanup:', error);
    }
  }
}

// Create and export singleton instance
export const manifestGeneratorService = new ManifestGeneratorService();
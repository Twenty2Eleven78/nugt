/**
 * Branding Integration Service
 * Coordinates all branding-related services for unified initialization and management
 * @version 1.0
 */

import { brandingService } from './branding.js';
import { teamNameUpdaterService } from './team-name-updater.js';
import { manifestGeneratorService } from './manifest-generator.js';
import { configService } from './config.js';

class BrandingIntegrationService {
  constructor() {
    this.isInitialized = false;
    this.services = [
      { name: 'branding', service: brandingService },
      { name: 'teamNameUpdater', service: teamNameUpdaterService },
      { name: 'manifestGenerator', service: manifestGeneratorService }
    ];
  }

  /**
   * Initialize all branding services
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing branding integration service...');
      
      // Ensure config service is loaded first
      if (!configService.isConfigLoaded()) {
        await configService.loadConfig();
      }

      // Initialize all branding services in parallel
      const initPromises = this.services.map(async ({ name, service }) => {
        try {
          await service.initialize();
          console.log(`${name} service initialized successfully`);
        } catch (error) {
          console.error(`Error initializing ${name} service:`, error);
          // Continue with other services even if one fails
        }
      });

      await Promise.all(initPromises);
      
      this.isInitialized = true;
      console.log('Branding integration service initialized successfully');
      
    } catch (error) {
      console.error('Error initializing branding integration service:', error);
      // Mark as initialized even if there were errors to prevent retry loops
      this.isInitialized = true;
    }
  }

  /**
   * Get the initialization status of all services
   * @returns {Object} Status of all branding services
   */
  getStatus() {
    const status = {
      isInitialized: this.isInitialized,
      services: {}
    };

    this.services.forEach(({ name, service }) => {
      try {
        status.services[name] = service.getStatus ? service.getStatus() : { available: true };
      } catch (error) {
        status.services[name] = { error: error.message };
      }
    });

    return status;
  }

  /**
   * Cleanup all branding services
   */
  cleanup() {
    try {
      console.log('Cleaning up branding integration service...');
      
      this.services.forEach(({ name, service }) => {
        try {
          if (service.cleanup) {
            service.cleanup();
            console.log(`${name} service cleaned up`);
          }
        } catch (error) {
          console.error(`Error cleaning up ${name} service:`, error);
        }
      });

      this.isInitialized = false;
      console.log('Branding integration service cleaned up successfully');
      
    } catch (error) {
      console.error('Error during branding integration cleanup:', error);
    }
  }

  /**
   * Check if all services are healthy
   * @returns {boolean} True if all services are working properly
   */
  isHealthy() {
    try {
      return this.services.every(({ service }) => {
        if (service.getStatus) {
          const status = service.getStatus();
          return status.isInitialized !== false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error checking branding service health:', error);
      return false;
    }
  }

  /**
   * Force refresh all branding services
   * @returns {Promise<void>}
   */
  async refresh() {
    try {
      console.log('Refreshing all branding services...');
      
      // Trigger config reload
      await configService.retryLoadConfig();
      
      // Services will automatically update via config change listeners
      console.log('Branding services refreshed successfully');
      
    } catch (error) {
      console.error('Error refreshing branding services:', error);
    }
  }
}

// Create and export singleton instance
export const brandingIntegrationService = new BrandingIntegrationService();
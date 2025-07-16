/**
 * PWA Update Manager
 * @version 3.3
 * 
 * Handles automatic updates for the PWA including:
 * - Service worker registration and updates
 * - User notifications for available updates
 * - Seamless update installation
 */

import { notificationManager } from './notifications.js';

// PWA Update Manager
class PWAUpdater {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.refreshing = false;
    this.updateCheckInterval = null;
  }

  // Initialize PWA updater
  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: './'
      });

      console.log('Service Worker registered:', this.registration);

      // Set up event listeners
      this.setupEventListeners();

      // Check for updates periodically
      this.startUpdateChecker();

      // Check for updates immediately
      this.checkForUpdates();

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Set up service worker event listeners
  setupEventListeners() {
    // Listen for service worker updates
    this.registration.addEventListener('updatefound', () => {
      console.log('New service worker found');
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('New content available');
            this.updateAvailable = true;
            this.showUpdateNotification();
          } else {
            // First time installation
            console.log('Content cached for offline use');
            notificationManager.success('App ready for offline use!');
          }
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('Service worker updated to:', event.data.version);
        if (!this.refreshing) {
          this.refreshing = true;
          notificationManager.success('App updated successfully!');
          // Optional: Reload the page to apply updates
          // window.location.reload();
        }
      }
    });

    // Listen for controller changes (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return;
      console.log('New service worker activated');
      this.refreshing = true;
      notificationManager.info('App updated! Refreshing...');
      window.location.reload();
    });
  }

  // Check for updates manually
  async checkForUpdates() {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      console.log('Update check completed');
      return true;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }

  // Start periodic update checking
  startUpdateChecker(intervalMinutes = 30) {
    // Clear existing interval
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Check for updates every X minutes
    this.updateCheckInterval = setInterval(() => {
      console.log('Checking for app updates...');
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop periodic update checking
  stopUpdateChecker() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  // Show update notification to user
  showUpdateNotification() {
    // Show persistent notification with action buttons
    const notification = notificationManager.persistent(
      'App Update Available! A new version is ready to install.',
      'info'
    );
    
    // Add update action buttons
    if (notification) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'mt-2 d-flex gap-2';
      buttonContainer.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="pwaUpdater.installUpdate(); this.closest('.notification').remove();">
          <i class="fa-solid fa-download me-1"></i>Update Now
        </button>
        <button class="btn btn-outline-secondary btn-sm" onclick="this.closest('.notification').remove();">
          Later
        </button>
      `;
      notification.appendChild(buttonContainer);
      
      // Auto-hide after 15 seconds if not interacted with
      setTimeout(() => {
        if (notification.parentNode) {
          notificationManager.remove(notification);
        }
      }, 15000);
    }
  }

  // Install available update
  async installUpdate() {
    if (!this.updateAvailable) {
      notificationManager.info('No update available');
      return;
    }

    try {
      // Tell the service worker to skip waiting
      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        notificationManager.info('Installing update...');
      }

      // Remove update notification
      const updateNotification = document.querySelector('.update-notification');
      if (updateNotification) {
        updateNotification.remove();
      }

    } catch (error) {
      console.error('Failed to install update:', error);
      notificationManager.error('Failed to install update');
    }
  }

  // Force refresh to apply updates
  forceRefresh() {
    this.refreshing = true;
    window.location.reload();
  }

  // Get app version from service worker
  getAppVersion() {
    return this.registration?.active?.scriptURL?.includes('v') ? 
      this.registration.active.scriptURL.match(/v(\d+)/)?.[1] : 'unknown';
  }

  // Check if app is running as PWA
  isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Get installation status
  getInstallationStatus() {
    return {
      isPWA: this.isPWA(),
      hasServiceWorker: !!this.registration,
      updateAvailable: this.updateAvailable,
      version: this.getAppVersion()
    };
  }

  // Manual update trigger for debugging
  async triggerUpdate() {
    console.log('Manually triggering update check...');
    const result = await this.checkForUpdates();
    if (result) {
      notificationManager.success('Update check completed');
    } else {
      notificationManager.error('Update check failed');
    }
  }
}

// Create and export singleton instance
export const pwaUpdater = new PWAUpdater();

// Make available globally for HTML onclick handlers
window.pwaUpdater = pwaUpdater;

// Export convenience methods
export const {
  init,
  checkForUpdates,
  installUpdate,
  forceRefresh,
  getInstallationStatus,
  triggerUpdate
} = pwaUpdater;
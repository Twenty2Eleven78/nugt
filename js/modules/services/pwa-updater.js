/**
 * PWA Update Manager
 * Handles service worker registration, updates, and user notifications
 */

import { notificationManager } from './notifications.js';

const UPDATE_CHECK_INTERVAL = 30; // minutes
const UPDATE_NOTIFICATION_TIMEOUT = 15000; // 15 seconds
const SERVICE_WORKER_PATH = '/sw.js';
const SERVICE_WORKER_SCOPE = './';
class PWAUpdater {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.refreshing = false;
    this.updateCheckInterval = null;
    this.currentNotification = null;
  }

  async init() {
    if (!this._isServiceWorkerSupported()) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
        scope: SERVICE_WORKER_SCOPE
      });

      console.log('Service Worker registered:', this.registration);

      this._setupEventListeners();
      this._startUpdateChecker();
      this.checkForUpdates();

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  _setupEventListeners() {
    this.registration.addEventListener('updatefound', () => {
      console.log('New service worker found');
      const newWorker = this.registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            console.log('New content available');
            this.updateAvailable = true;
            this._showUpdateNotification();
          } else {
            console.log('Content cached for offline use');
            notificationManager.success('App ready for offline use!');
          }
        }
      });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('Service worker updated to:', event.data.version);
        if (!this.refreshing) {
          this.refreshing = true;
          notificationManager.success('App updated successfully!');
        }
      }
    });

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

  _startUpdateChecker(intervalMinutes = UPDATE_CHECK_INTERVAL) {
    this._clearUpdateInterval();

    this.updateCheckInterval = setInterval(() => {
      console.log('Checking for app updates...');
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  stopUpdateChecker() {
    this._clearUpdateInterval();
  }

  _showUpdateNotification() {
    this._clearCurrentNotification();

    this.currentNotification = notificationManager.persistent(
      'App Update Available! A new version is ready to install.',
      'info'
    );

    if (this.currentNotification) {
      const buttonContainer = this._createUpdateButtons();
      this.currentNotification.appendChild(buttonContainer);

      setTimeout(() => {
        if (this.currentNotification?.parentNode) {
          notificationManager.remove(this.currentNotification);
          this.currentNotification = null;
        }
      }, UPDATE_NOTIFICATION_TIMEOUT);
    }
  }

  async installUpdate() {
    if (!this.updateAvailable) {
      notificationManager.info('No update available');
      return;
    }

    try {
      if (this.registration.waiting) {
        // Use MessageChannel for proper two-way communication
        const messageChannel = new MessageChannel();
        
        // Set up response handler
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('Service worker acknowledged SKIP_WAITING');
          }
        };
        
        // Send message with response port
        this.registration.waiting.postMessage(
          { type: 'SKIP_WAITING' },
          [messageChannel.port2]
        );
        
        notificationManager.info('Installing update...');
      }

      this._clearCurrentNotification();
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

  async triggerUpdate() {
    console.log('Manually triggering update check...');
    const result = await this.checkForUpdates();
    if (result) {
      notificationManager.success('Update check completed');
    } else {
      notificationManager.error('Update check failed');
    }
  }

  _isServiceWorkerSupported() {
    return 'serviceWorker' in navigator;
  }

  _clearUpdateInterval() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  _clearCurrentNotification() {
    if (this.currentNotification) {
      notificationManager.remove(this.currentNotification);
      this.currentNotification = null;
    }
  }

  _createUpdateButtons() {
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
    return buttonContainer;
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
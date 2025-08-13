/**
 * Notification Service
 */

import { NOTIFICATION_TYPES } from '../shared/constants.js';

const DEFAULT_DURATION = 3000;
const ANIMATION_DURATION = 300;
const MAX_NOTIFICATIONS = 5;
class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = new Set();
    this.timeouts = new Map();
    this._initializeContainer();
  }

  _initializeContainer() {
    this.container = document.getElementById('notification-container');
    if (!this.container) {
      console.warn('Notification container not found');
    }
  }

  _getActiveContainer() {
    // Check if auth modal is open and use its notification container
    const authModal = document.getElementById('authModal');
    const authNotificationContainer = document.getElementById('auth-notification-container');
    
    if (authModal && authNotificationContainer && 
        (authModal.classList.contains('show') || authModal.style.display === 'block')) {
      authNotificationContainer.style.display = 'block';
      return authNotificationContainer;
    }
    
    return this.container;
  }

  show(message, type = NOTIFICATION_TYPES.INFO, duration = DEFAULT_DURATION) {
    if (!this._validateInput(message, type)) return null;
    
    const activeContainer = this._getActiveContainer();
    if (!activeContainer) {
      console.warn('Cannot show notification: no container available');
      return null;
    }

    this._enforceMaxNotifications();

    const notification = this._createNotification(message, type);
    this._addNotification(notification, activeContainer);

    if (duration > 0) {
      this._scheduleRemoval(notification, duration);
    }

    return notification;
  }

  _createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add click to dismiss functionality
    notification.addEventListener('click', () => this.remove(notification));

    return notification;
  }

  remove(notification) {
    if (!notification || !this.notifications.has(notification)) return;

    // Clear any pending timeout
    this._clearTimeout(notification);

    notification.classList.remove('show');

    setTimeout(() => {
      // Check both containers for the notification
      const authContainer = document.getElementById('auth-notification-container');
      if (this.container && this.container.contains(notification)) {
        this.container.removeChild(notification);
      } else if (authContainer && authContainer.contains(notification)) {
        authContainer.removeChild(notification);
      }
      this.notifications.delete(notification);
    }, ANIMATION_DURATION);
  }

  clearAll() {
    this.notifications.forEach(notification => this.remove(notification));
  }

  success(message, duration = DEFAULT_DURATION) {
    return this.show(message, NOTIFICATION_TYPES.SUCCESS, duration);
  }

  warning(message, duration = DEFAULT_DURATION) {
    return this.show(message, NOTIFICATION_TYPES.WARNING, duration);
  }

  error(message, duration = DEFAULT_DURATION) {
    return this.show(message, NOTIFICATION_TYPES.DANGER, duration);
  }

  info(message, duration = DEFAULT_DURATION) {
    return this.show(message, NOTIFICATION_TYPES.INFO, duration);
  }

  persistent(message, type = NOTIFICATION_TYPES.INFO) {
    return this.show(message, type, 0);
  }

  _validateInput(message, type) {
    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.warn('Invalid notification message');
      return false;
    }
    if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
      console.warn('Invalid notification type');
      return false;
    }
    return true;
  }

  _enforceMaxNotifications() {
    if (this.notifications.size >= MAX_NOTIFICATIONS) {
      const oldestNotification = this.notifications.values().next().value;
      this.remove(oldestNotification);
    }
  }

  _addNotification(notification, container = null) {
    const targetContainer = container || this.container;
    targetContainer.appendChild(notification);
    this.notifications.add(notification);

    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
  }

  _scheduleRemoval(notification, duration) {
    const timeoutId = setTimeout(() => {
      this.remove(notification);
    }, duration);

    this.timeouts.set(notification, timeoutId);
  }

  _clearTimeout(notification) {
    const timeoutId = this.timeouts.get(notification);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(notification);
    }
  }
}

// Create and export singleton instance
export const notificationManager = new NotificationManager();

// Export convenience function for backward compatibility
export function showNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
  return notificationManager.show(message, type, duration);
}
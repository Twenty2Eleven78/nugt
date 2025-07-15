/**
 * Notification Service
 * @version 3.3
 */

import { NOTIFICATION_TYPES } from '../shared/constants.js';

// Notification manager class
class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = new Set();
    this._initializeContainer();
  }

  // Initialize notification container
  _initializeContainer() {
    this.container = document.getElementById('notification-container');
    if (!this.container) {
      console.warn('Notification container not found');
    }
  }

  // Show notification
  show(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
    if (!this.container) {
      console.warn('Cannot show notification: container not available');
      return null;
    }

    const notification = this._createNotification(message, type);
    this.container.appendChild(notification);
    this.notifications.add(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }
    
    return notification;
  }

  // Create notification element
  _createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add close button for persistent notifications
    if (type === NOTIFICATION_TYPES.DANGER || type === NOTIFICATION_TYPES.WARNING) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn-close btn-close-white ms-2';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.onclick = () => this.remove(notification);
      notification.appendChild(closeBtn);
      notification.style.display = 'flex';
      notification.style.alignItems = 'center';
      notification.style.justifyContent = 'space-between';
    }
    
    return notification;
  }

  // Remove notification
  remove(notification) {
    if (!notification || !this.notifications.has(notification)) {
      return;
    }
    
    notification.classList.remove('show');
    
    setTimeout(() => {
      if (this.container && this.container.contains(notification)) {
        this.container.removeChild(notification);
      }
      this.notifications.delete(notification);
    }, 300);
  }

  // Clear all notifications
  clearAll() {
    this.notifications.forEach(notification => {
      this.remove(notification);
    });
  }

  // Show success notification
  success(message, duration = 3000) {
    return this.show(message, NOTIFICATION_TYPES.SUCCESS, duration);
  }

  // Show warning notification
  warning(message, duration = 5000) {
    return this.show(message, NOTIFICATION_TYPES.WARNING, duration);
  }

  // Show error notification
  error(message, duration = 7000) {
    return this.show(message, NOTIFICATION_TYPES.DANGER, duration);
  }

  // Show info notification
  info(message, duration = 3000) {
    return this.show(message, NOTIFICATION_TYPES.INFO, duration);
  }

  // Show persistent notification (no auto-remove)
  persistent(message, type = NOTIFICATION_TYPES.INFO) {
    return this.show(message, type, 0);
  }
}

// Create and export singleton instance
export const notificationManager = new NotificationManager();

// Export convenience function for backward compatibility
export function showNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
  return notificationManager.show(message, type, duration);
}
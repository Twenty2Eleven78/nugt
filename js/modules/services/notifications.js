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
    // Create global floating notification container
    this.container = document.createElement('div');
    this.container.id = 'global-notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 2147483647;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      max-width: 420px;
      width: auto;
    `;
    
    // Append to body to ensure it's always on top
    document.body.appendChild(this.container);
  }

  _getActiveContainer() {
    // Always use the global floating container
    return this.container;
  }

  show(message, type = NOTIFICATION_TYPES.INFO, duration = DEFAULT_DURATION) {
    if (!this._validateInput(message, type)) return null;
    
    if (!this.container) {
      console.warn('Global notification container not available');
      return null;
    }

    this._enforceMaxNotifications();

    const notification = this._createNotification(message, type);
    this._addNotification(notification);

    if (duration > 0) {
      this._scheduleRemoval(notification, duration);
    }

    return notification;
  }

  _createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.textContent = message;
    
    // Enhanced styling for global floating notifications
    notification.style.cssText = `
      pointer-events: auto;
      cursor: pointer;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 500;
      font-size: 14px;
      line-height: 1.4;
      max-width: 400px;
      word-wrap: break-word;
      transform: translateX(-100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 2147483647;
    `;
    
    // Set colors based on type
    this._applyNotificationStyles(notification, type);

    // Add click to dismiss functionality
    notification.addEventListener('click', () => this.remove(notification));

    return notification;
  }

  remove(notification) {
    if (!notification || !this.notifications.has(notification)) return;

    // Clear any pending timeout
    this._clearTimeout(notification);

    // Animate out
    notification.style.transform = 'translateX(-100%)';
    notification.style.opacity = '0';

    setTimeout(() => {
      if (this.container && this.container.contains(notification)) {
        this.container.removeChild(notification);
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

  _addNotification(notification) {
    this.container.appendChild(notification);
    this.notifications.add(notification);

    // Ensure initial state is set
    notification.style.transform = 'translateX(-100%)';
    notification.style.opacity = '0';

    // Animate in with double requestAnimationFrame for proper timing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
      });
    });
  }

  _applyNotificationStyles(notification, type) {
    const styles = {
      success: {
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        color: 'white',
        borderLeft: '4px solid #20c997'
      },
      warning: {
        background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
        color: '#000',
        borderLeft: '4px solid #fd7e14'
      },
      danger: {
        background: 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)',
        color: 'white',
        borderLeft: '4px solid #e74c3c'
      },
      info: {
        background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
        color: 'white',
        borderLeft: '4px solid #495057'
      }
    };
    
    const style = styles[type] || styles.info;
    Object.assign(notification.style, style);
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
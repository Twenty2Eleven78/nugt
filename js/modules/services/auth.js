/**
 * Authentication Service with WebAuthn/Passkey Support
 */

import { storage } from '../data/storage.js';
import { notificationManager } from './notifications.js';
import { configService } from './config.js';

// Dynamic storage keys based on configuration
function getAuthStorageKeys() {
  const storageConfig = configService.getStorageConfig();
  const prefix = storageConfig?.keyPrefix || 'nugt_';
  
  return {
    USER_ID: `${prefix}user_id`,
    EMAIL: `${prefix}email`,
    DISPLAY_NAME: `${prefix}display_name`,
    CREDENTIAL_ID: `${prefix}credential_id`,
    IS_AUTHENTICATED: `${prefix}is_authenticated`,
    AUTH_TIMESTAMP: `${prefix}auth_timestamp`,
    USAGE_STATS: `${prefix}usage_stats`
  };
}

const credentialStore = new Map();
const TOKEN_CACHE_DURATION = 3600000; // 1 hour
const LOGOUT_DEBOUNCE_TIME = 500;
const MAX_ACTIONS_HISTORY = 100;

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authTimestamp = null;
    this.authStateListeners = new Set();
    this.authToken = null;
    this.lastLogoutTime = 0;
  }

  async getAuthToken() {
    if (!this.isAuthenticated || !this.currentUser) return null;

    // Return cached token if still valid
    if (this.authToken && this.authTimestamp &&
      (Date.now() - this.authTimestamp) < TOKEN_CACHE_DURATION) {
      return this.authToken;
    }

    // Generate new token
    const tokenData = `${this.currentUser.id}:${this.currentUser.email}:${Date.now()}`;
    this.authToken = btoa(tokenData);
    this.authTimestamp = Date.now();
    return this.authToken;
  }

  // Get API endpoint from configuration
  getApiEndpoint(endpoint = 'user-matches') {
    const integrationConfig = configService.getIntegrationConfig('statistics');
    const baseEndpoint = integrationConfig?.apiEndpoint || '/.netlify/functions';
    
    // Ensure proper URL formatting
    if (baseEndpoint.endsWith('/')) {
      return `${baseEndpoint}${endpoint}`;
    } else {
      return `${baseEndpoint}/${endpoint}`;
    }
  }

  onAuthStateChange(callback) {
    this.authStateListeners.delete(callback);
    this.authStateListeners.add(callback);
    callback(this.isAuthenticated);
  }

  notifyAuthStateChange() {
    Promise.resolve().then(() => {
      this.authStateListeners.forEach(callback => callback(this.isAuthenticated));
    });
  }

  async init() {
    this.webAuthnSupported = !!window.PublicKeyCredential;
    if (!this.webAuthnSupported) {
      console.warn('WebAuthn not supported, using fallback authentication');
    }

    const userData = this._loadUserData();
    if (!userData.isAuthenticated || !userData.userId || !userData.email) {
      return false;
    }

    // Check if we need to migrate to consistent user ID
    const expectedUserId = this._generateUserId(userData.email);
    if (userData.userId !== expectedUserId) {
      console.log('Migrating user ID from', userData.userId, 'to', expectedUserId);
      // Update stored user ID to be consistent across devices
      const keys = getAuthStorageKeys();
      storage.saveImmediate(keys.USER_ID, expectedUserId);
      userData.userId = expectedUserId;
    }

    this._setAuthenticatedState(userData);
    this._updateAdminUI();
    this.trackUsage('app_open');
    return true;
  }

  /**
   * Register a new passkey
   * @param {string} email - User's email address
   * @returns {Promise<boolean>} - Success status
   */
  async register(email) {
    try {
      if (!this._validateEmail(email)) {
        notificationManager.warning('Please enter a valid email address');
        return false;
      }

      const displayName = email.split('@')[0];
      const userId = this._generateUserId(email);

      await this._attemptWebAuthnRegistration(userId, email, displayName);
      this._saveUserData(userId, email, displayName);
      this._setAuthenticatedState({ userId, email, displayName, authTimestamp: Date.now() });
      this._initializeUsageStats(userId);

      notificationManager.success('Registration successful! Welcome to NUFC GameTime!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      notificationManager.error('Registration failed: ' + (error.message || 'Unknown error'));
      return false;
    }
  }

  async authenticate() {
    try {
      const email = document.getElementById('usernameInput')?.value?.trim();
      if (!email) {
        throw new Error('Please enter your email address');
      }
      
      if (!this._validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const userData = this._loadUserData();
      const storedEmail = userData.email;

      // If the email doesn't match stored one, or no stored credentials, register new user
      if (!storedEmail || email.toLowerCase() !== storedEmail.toLowerCase()) {
        return await this.register(email);
      }

      // Otherwise, attempt authentication with existing credentials
      await this._attemptWebAuthnAuthentication(userData.credentialId);

      const authTimestamp = Date.now();
      const keys = getAuthStorageKeys();
      storage.saveImmediate(keys.IS_AUTHENTICATED, true);
      storage.saveImmediate(keys.AUTH_TIMESTAMP, authTimestamp);

      this._setAuthenticatedState({ ...userData, authTimestamp });
      this.trackUsage('login');

      notificationManager.success('Welcome back!');
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      notificationManager.error('Authentication failed: ' + (error.message || 'Unknown error'));
      return false;
    }
  }

  /**
   * Log out the current user
   */
  logout() {
    const now = Date.now();
    if (now - this.lastLogoutTime < LOGOUT_DEBOUNCE_TIME) return;
    this.lastLogoutTime = now;

    this.isAuthenticated = false;
    this.currentUser = null;
    this.authTimestamp = null;
    this.authToken = null;

    const keys = getAuthStorageKeys();
    storage.saveImmediate(keys.IS_AUTHENTICATED, false);

    Promise.resolve().then(() => {
      this.authStateListeners.forEach(callback => callback(this.isAuthenticated));
      notificationManager.info('Signed out. Please come back soon!');
    });
  }

  /**
   * Track user activity and usage statistics
   * @param {string} action - The action being tracked
   * @param {Object} data - Additional data to track
   */
  trackUsage(action, data = {}) {
    if (!this.isAuthenticated || !this.currentUser) return;

    try {
      const userId = this.currentUser.id;
      const timestamp = Date.now();
      const keys = getAuthStorageKeys();
      const usageStats = storage.load(keys.USAGE_STATS, {});

      if (!usageStats[userId]) {
        usageStats[userId] = {
          firstSeen: timestamp,
          lastSeen: timestamp,
          sessions: 0,
          actions: []
        };
      }

      usageStats[userId].lastSeen = timestamp;

      if (action === 'app_open' || action === 'login') {
        usageStats[userId].sessions++;
      }

      usageStats[userId].actions.unshift({ action, timestamp, ...data });

      if (usageStats[userId].actions.length > MAX_ACTIONS_HISTORY) {
        usageStats[userId].actions = usageStats[userId].actions.slice(0, MAX_ACTIONS_HISTORY);
      }

      storage.save(keys.USAGE_STATS, usageStats);
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  /**
   * Get usage statistics for the current user
   * @returns {Object|null} - Usage statistics or null if not authenticated
   */
  getUserStats() {
    if (!this.isAuthenticated || !this.currentUser) {
      return null;
    }

    const userId = this.currentUser.id;
    const keys = getAuthStorageKeys();
    const usageStats = storage.load(keys.USAGE_STATS, {});

    return usageStats[userId] || null;
  }

  /**
   * Check if the user is authenticated
   * @returns {boolean} - Authentication status
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Get the current user
   * @returns {Object|null} - User object or null if not authenticated
   */
  getCurrentUser() {
    return this.currentUser;
  }

  async isAdmin() {
    if (!this.currentUser || !this.currentUser.email) {
      return false;
    }

    // Check admin status via backend API call
    // This keeps admin emails secure on the server side
    try {
      const token = await this.getAuthToken();
      const apiUrl = this.getApiEndpoint('user-matches') + '?checkAdmin=true';
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const isAdminUser = result.isAdmin || false;
        // Only log admin status changes or errors, not every check
        if (isAdminUser) {
          console.log('Admin access granted for:', this.currentUser?.email);
        }
        return isAdminUser;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    return false;
  }

  /**
   * Initialize usage statistics for a new user
   * @param {string} userId - User ID
   * @private
   */
  _initializeUsageStats(userId) {
    const timestamp = Date.now();
    const keys = getAuthStorageKeys();
    const usageStats = storage.load(keys.USAGE_STATS, {});

    usageStats[userId] = {
      firstSeen: timestamp,
      lastSeen: timestamp,
      sessions: 1,
      actions: [{
        action: 'register',
        timestamp
      }]
    };

    storage.save(keys.USAGE_STATS, usageStats);
  }

  _validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && email.trim() !== '' && emailRegex.test(email);
  }

  _loadUserData() {
    const keys = getAuthStorageKeys();
    return {
      isAuthenticated: storage.load(keys.IS_AUTHENTICATED, false),
      userId: storage.load(keys.USER_ID, null),
      email: storage.load(keys.EMAIL, null),
      displayName: storage.load(keys.DISPLAY_NAME, null),
      credentialId: storage.load(keys.CREDENTIAL_ID, null),
      authTimestamp: storage.load(keys.AUTH_TIMESTAMP, null)
    };
  }

  _saveUserData(userId, email, displayName) {
    const keys = getAuthStorageKeys();
    storage.saveImmediate(keys.USER_ID, userId);
    storage.saveImmediate(keys.EMAIL, email);
    storage.saveImmediate(keys.DISPLAY_NAME, displayName);
    storage.saveImmediate(keys.IS_AUTHENTICATED, true);
    storage.saveImmediate(keys.AUTH_TIMESTAMP, Date.now());
  }

  _setAuthenticatedState(userData) {
    this.isAuthenticated = true;
    this.currentUser = {
      id: userData.userId,
      email: userData.email,
      name: userData.displayName || userData.email.split('@')[0]
    };
    this.authTimestamp = userData.authTimestamp;
    this.notifyAuthStateChange();
  }

  _updateAdminUI() {
    // This method is no longer needed as admin UI is handled by auth state listeners
    // Admin button visibility is now managed in main.js through onAuthStateChange
  }

  async _attemptWebAuthnRegistration(userId, email, displayName) {
    if (!this.webAuthnSupported) return;

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: this._generateChallenge(),
          rp: {
            name: 'NUFC GameTime',
            id: window.location.hostname || 'localhost'
          },
          user: {
            id: Uint8Array.from(userId, c => c.charCodeAt(0)),
            name: email,
            displayName: displayName
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        }
      });

      if (credential) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        credentialStore.set(userId, { credentialId, email, displayName });
        const keys = getAuthStorageKeys();
        storage.saveImmediate(keys.CREDENTIAL_ID, credentialId);
      }
    } catch (error) {
      console.error('WebAuthn registration failed, using fallback:', error);
    }
  }

  async _attemptWebAuthnAuthentication(storedCredentialId) {
    if (!this.webAuthnSupported || !storedCredentialId) return;

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: this._generateChallenge(),
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname || 'localhost'
        }
      });

      if (credential) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        if (credentialId !== storedCredentialId) {
          throw new Error('Invalid credential');
        }
      }
    } catch (error) {
      console.error('WebAuthn authentication failed, using fallback:', error);
    }
  }

  _generateUserId(email) {
    // Generate consistent user ID based on email to ensure cross-device sync
    if (email) {
      // Create a consistent hash-like ID from email
      const emailPart = email.split('@')[0];
      const domain = email.split('@')[1];
      return `user_${emailPart}_${domain.replace(/\./g, '_')}`;
    }
    // Fallback to random ID if no email provided
    return 'user_' + Math.random().toString(36).substring(2, 15);
  }

  _generateChallenge() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array;
  }
}

// Create and export singleton instance
export const authService = new AuthService();
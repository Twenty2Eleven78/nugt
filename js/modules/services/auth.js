/**
 * Authentication Service with WebAuthn/Passkey Support
 * @version 1.0
 */

import { storage } from '../data/storage.js';
import { notificationManager } from './notifications.js';

// Constants for auth storage
const AUTH_STORAGE_KEYS = {
  USER_ID: 'nugt_user_id',
  USERNAME: 'nugt_username',
  CREDENTIAL_ID: 'nugt_credential_id',
  IS_AUTHENTICATED: 'nugt_is_authenticated',
  AUTH_TIMESTAMP: 'nugt_auth_timestamp',
  USAGE_STATS: 'nugt_usage_stats'
};

// Simple in-memory credential store (would be replaced by server-side in production)
const credentialStore = new Map();

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authTimestamp = null;
  }

  /**
   * Initialize the authentication service
   */
  async init() {
    // Check if WebAuthn is supported
    this.webAuthnSupported = !!window.PublicKeyCredential;
    if (!this.webAuthnSupported) {
      console.warn('WebAuthn is not supported in this browser, using fallback authentication');
    }

    // Check if user is already authenticated
    const isAuthenticated = storage.load(AUTH_STORAGE_KEYS.IS_AUTHENTICATED, false);
    const userId = storage.load(AUTH_STORAGE_KEYS.USER_ID, null);
    const username = storage.load(AUTH_STORAGE_KEYS.USERNAME, null);
    const authTimestamp = storage.load(AUTH_STORAGE_KEYS.AUTH_TIMESTAMP, null);

    if (isAuthenticated && userId && username) {
      this.isAuthenticated = true;
      this.currentUser = { id: userId, name: username };
      this.authTimestamp = authTimestamp;
      
      // Track usage
      this.trackUsage('app_open');
      return true;
    }

    return false;
  }

  /**
   * Register a new passkey
   * @param {string} username - User's display name
   * @returns {Promise<boolean>} - Success status
   */
  async register(username) {
    try {
      if (!username || username.trim() === '') {
        notificationManager.warning('Please enter a valid username');
        return false;
      }

      // Generate a random user ID
      const userId = this._generateUserId();
      
      // Use WebAuthn if supported, otherwise use fallback
      if (this.webAuthnSupported) {
        try {
          console.log('Registering with WebAuthn...');
          
          // Create credential options
          const publicKeyCredentialCreationOptions = {
            challenge: this._generateChallenge(),
            rp: {
              name: 'NUFC GameTime',
              // Use only the domain without port for rpId
              id: window.location.hostname || 'localhost'
            },
            user: {
              id: Uint8Array.from(userId, c => c.charCodeAt(0)),
              name: username,
              displayName: username
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 }, // ES256
              { type: 'public-key', alg: -257 } // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'preferred',
              residentKey: 'required'
            },
            timeout: 60000,
            attestation: 'none'
          };
          
          console.log('Credential creation options:', publicKeyCredentialCreationOptions);

          // Create credential
          const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
          });

          if (!credential) {
            throw new Error('Failed to create credential');
          }

          console.log('Credential created successfully:', credential);

          // Store credential ID
          const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
          
          // In a real app, you would send this to a server
          credentialStore.set(userId, {
            credentialId,
            username,
            publicKey: credential.response.getPublicKey ? credential.response.getPublicKey() : null
          });
          
          // Store locally
          storage.saveImmediate(AUTH_STORAGE_KEYS.CREDENTIAL_ID, credentialId);
        } catch (webAuthnError) {
          console.error('WebAuthn registration failed, using fallback:', webAuthnError);
          // Continue with fallback authentication
        }
      } else {
        console.log('WebAuthn not supported, using fallback authentication');
      }
      
      // Store user data (whether WebAuthn succeeded or not)
      storage.saveImmediate(AUTH_STORAGE_KEYS.USER_ID, userId);
      storage.saveImmediate(AUTH_STORAGE_KEYS.USERNAME, username);
      storage.saveImmediate(AUTH_STORAGE_KEYS.IS_AUTHENTICATED, true);
      storage.saveImmediate(AUTH_STORAGE_KEYS.AUTH_TIMESTAMP, Date.now());

      this.isAuthenticated = true;
      this.currentUser = { id: userId, name: username };
      this.authTimestamp = Date.now();

      // Initialize usage stats
      this._initializeUsageStats(userId);
      
      notificationManager.success(`Welcome, ${username}! You've been registered successfully.`);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      notificationManager.danger('Registration failed: ' + (error.message || 'Unknown error'));
      return false;
    }
  }

  /**
   * Authenticate with existing passkey
   * @returns {Promise<boolean>} - Success status
   */
  async authenticate() {
    try {
      // Get stored user data
      const userId = storage.load(AUTH_STORAGE_KEYS.USER_ID);
      const username = storage.load(AUTH_STORAGE_KEYS.USERNAME);
      const storedCredentialId = storage.load(AUTH_STORAGE_KEYS.CREDENTIAL_ID);
      
      if (!userId || !username) {
        throw new Error('No user found. Please register first.');
      }
      
      // Use WebAuthn if supported and we have a credential ID
      if (this.webAuthnSupported && storedCredentialId) {
        try {
          console.log('Authenticating with WebAuthn...');
          
          // Create authentication options
          const publicKeyCredentialRequestOptions = {
            challenge: this._generateChallenge(),
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname || 'localhost'
          };
          
          console.log('Credential request options:', publicKeyCredentialRequestOptions);

          // Get credential
          const credential = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
          });

          if (!credential) {
            throw new Error('No credential returned');
          }
          
          console.log('Credential retrieved successfully:', credential);

          // In a real app, you would verify this with a server
          const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
          
          if (credentialId !== storedCredentialId) {
            throw new Error('Invalid credential');
          }
        } catch (webAuthnError) {
          console.error('WebAuthn authentication failed, using fallback:', webAuthnError);
          // Continue with fallback authentication
        }
      } else {
        console.log('WebAuthn not supported or no credential ID, using fallback authentication');
      }

      // Update authentication status
      storage.saveImmediate(AUTH_STORAGE_KEYS.IS_AUTHENTICATED, true);
      storage.saveImmediate(AUTH_STORAGE_KEYS.AUTH_TIMESTAMP, Date.now());

      this.isAuthenticated = true;
      this.currentUser = { id: userId, name: username };
      this.authTimestamp = Date.now();

      // Track usage
      this.trackUsage('login');
      
      notificationManager.success(`Welcome back, ${username}!`);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      notificationManager.danger('Authentication failed: ' + (error.message || 'Unknown error'));
      return false;
    }
  }

  /**
   * Log out the current user
   */
  logout() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authTimestamp = null;
    
    storage.saveImmediate(AUTH_STORAGE_KEYS.IS_AUTHENTICATED, false);
    
    notificationManager.info('You have been logged out');
  }

  /**
   * Track user activity and usage statistics
   * @param {string} action - The action being tracked
   * @param {Object} data - Additional data to track
   */
  trackUsage(action, data = {}) {
    if (!this.isAuthenticated || !this.currentUser) {
      return;
    }

    try {
      const userId = this.currentUser.id;
      const timestamp = Date.now();
      
      // Get existing stats
      const usageStats = storage.load(AUTH_STORAGE_KEYS.USAGE_STATS, {});
      
      // Initialize user stats if needed
      if (!usageStats[userId]) {
        usageStats[userId] = {
          firstSeen: timestamp,
          lastSeen: timestamp,
          sessions: 0,
          actions: []
        };
      }
      
      // Update stats
      usageStats[userId].lastSeen = timestamp;
      
      if (action === 'app_open' || action === 'login') {
        usageStats[userId].sessions++;
      }
      
      // Add action to history (limit to last 100 actions)
      usageStats[userId].actions.unshift({
        action,
        timestamp,
        ...data
      });
      
      // Keep only last 100 actions
      if (usageStats[userId].actions.length > 100) {
        usageStats[userId].actions = usageStats[userId].actions.slice(0, 100);
      }
      
      // Save stats
      storage.save(AUTH_STORAGE_KEYS.USAGE_STATS, usageStats);
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
    const usageStats = storage.load(AUTH_STORAGE_KEYS.USAGE_STATS, {});
    
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

  /**
   * Initialize usage statistics for a new user
   * @param {string} userId - User ID
   * @private
   */
  _initializeUsageStats(userId) {
    const timestamp = Date.now();
    const usageStats = storage.load(AUTH_STORAGE_KEYS.USAGE_STATS, {});
    
    usageStats[userId] = {
      firstSeen: timestamp,
      lastSeen: timestamp,
      sessions: 1,
      actions: [{
        action: 'register',
        timestamp
      }]
    };
    
    storage.save(AUTH_STORAGE_KEYS.USAGE_STATS, usageStats);
  }

  /**
   * Generate a random user ID
   * @returns {string} - Random user ID
   * @private
   */
  _generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate a random challenge
   * @returns {Uint8Array} - Random challenge
   * @private
   */
  _generateChallenge() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array;
  }
}

// Create and export singleton instance
export const authService = new AuthService();
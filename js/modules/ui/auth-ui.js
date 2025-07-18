/**
 * Authentication UI Components
 * @version 1.0
 */

import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';
import { hideModal } from './modals.js';

class AuthUI {
  constructor() {
    this.authModalInitialized = false;
  }

  /**
   * Initialize the authentication UI
   */
  async init() {
    console.log('Initializing authentication UI');
    
    // Create auth modal if it doesn't exist
    if (!document.getElementById('authModal')) {
      this._createAuthModal();
    }

    // Bind event listeners
    this._bindEventListeners();

    // Check if user is already authenticated
    const isAuthenticated = await authService.init();
    console.log('User authenticated:', isAuthenticated);
    
    if (isAuthenticated) {
      this._updateAuthState(true);
      return true;
    } else {
      // Show auth modal on first load, with a slight delay to ensure DOM is ready
      setTimeout(() => {
        this.showAuthModal();
      }, 500);
      return false;
    }
  }

  /**
   * Show the authentication modal
   */
  showAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        const authMessage = document.getElementById('authMessage');
        if (authMessage) {
          authMessage.innerHTML = `
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Note:</strong> Your browser doesn't support passkeys. A simplified authentication will be used instead.
            </div>
            <p>Welcome to NUFC GameTime! Please sign in to track your usage and save game statistics.</p>
          `;
        }
      }
      
      try {
        // Make sure Bootstrap is available
        if (typeof bootstrap !== 'undefined') {
          const bsModal = new bootstrap.Modal(authModal);
          bsModal.show();
        } else {
          // Fallback if Bootstrap is not loaded yet
          console.warn('Bootstrap not loaded, using fallback modal display');
          authModal.classList.add('show');
          authModal.style.display = 'block';
          document.body.classList.add('modal-open');
          
          // Create backdrop
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          document.body.appendChild(backdrop);
        }
      } catch (error) {
        console.error('Error showing modal:', error);
      }
    }
  }

  /**
   * Create the authentication modal
   * @private
   */
  _createAuthModal() {
    const modalHtml = `
      <div class="modal fade" id="authModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="authModalLabel">NUFC GameTime Authentication</h5>
            </div>
            <div class="modal-body">
              <div class="auth-container">
                <div id="authMessage" class="mb-3">
                  <p>Welcome to NUFC GameTime! Please sign in to track your usage and save game statistics.</p>
                  <p class="small text-muted">Having trouble? <a href="docs/troubleshooting.md" target="_blank">View troubleshooting guide</a></p>
                </div>
                
                <div id="registerForm" class="mb-3">
                  <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="usernameInput" placeholder="Username">
                    <label for="usernameInput">Your Name</label>
                  </div>
                  <button type="button" id="registerButton" class="btn btn-primary w-100 mb-2">
                    <i class="fas fa-user-plus me-2"></i>Register with Passkey
                  </button>
                  <small class="text-muted">First time? Create a passkey to securely access the app.</small>
                </div>
                
                <div class="text-center my-3">
                  <span>OR</span>
                </div>
                
                <div id="loginForm">
                  <button type="button" id="loginButton" class="btn btn-success w-100 mb-2">
                    <i class="fas fa-key me-2"></i>Sign in with Passkey
                  </button>
                  <small class="text-muted">Already registered? Use your passkey to sign in.</small>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <div id="skipAuthContainer" class="w-100 text-center">
                <button type="button" id="skipAuthButton" class="btn btn-link">Continue without signing in</button>
                <small class="d-block text-muted">Your data won't be saved between sessions</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);

    this.authModalInitialized = true;
    
    // Bind event listeners to the modal buttons
    setTimeout(() => this._bindModalButtons(), 100);
  }

  /**
   * Create the user profile button in the header
   * @private
   */
  _createProfileButton() {
    // Check if profile button already exists
    if (document.getElementById('userProfileButton')) {
      return;
    }

    // Find the header row
    const headerRow = document.querySelector('.row.mb-3 .col-12');
    if (!headerRow) {
      return;
    }

    // Create profile button container
    const profileContainer = document.createElement('div');
    profileContainer.className = 'user-profile-container';
    profileContainer.style.position = 'absolute';
    profileContainer.style.right = '15px';
    profileContainer.style.top = '0';

    // Create profile button
    const profileButton = document.createElement('button');
    profileButton.id = 'userProfileButton';
    profileButton.className = 'btn btn-sm btn-outline-secondary';
    profileButton.innerHTML = '<i class="fas fa-user me-1"></i><span id="profileUsername">Guest</span>';
    profileButton.setAttribute('data-bs-toggle', 'dropdown');
    profileButton.setAttribute('aria-expanded', 'false');
    
    // Create dropdown menu
    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'dropdown-menu dropdown-menu-end';
    dropdownMenu.setAttribute('aria-labelledby', 'userProfileButton');
    
    // Add dropdown items
    dropdownMenu.innerHTML = `
      <li><span class="dropdown-item-text" id="userStatsText">Sessions: 0</span></li>
      <li><hr class="dropdown-divider"></li>
      <li><button class="dropdown-item" id="showStatsButton"><i class="fas fa-chart-bar me-2"></i>View Statistics</button></li>
      <li><hr class="dropdown-divider"></li>
      <li><button class="dropdown-item" id="logoutButton">Sign Out</button></li>
    `;
    
    // Append elements
    profileContainer.appendChild(profileButton);
    profileContainer.appendChild(dropdownMenu);
    
    // Make header position relative for absolute positioning of profile button
    headerRow.style.position = 'relative';
    headerRow.appendChild(profileContainer);
  }

  /**
   * Bind event listeners for authentication UI
   * @private
   */
  _bindEventListeners() {
    // Bind modal buttons immediately instead of waiting for DOMContentLoaded
    this._bindModalButtons();
    
    // Add global event listeners for dynamically created elements
    document.body.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'logoutButton') {
        authService.logout();
        this._updateAuthState(false);
        this.showAuthModal();
      } else if (e.target && (e.target.id === 'showStatsButton' || e.target.closest('#showStatsButton'))) {
        // Import and show stats dashboard
        import('../ui/stats-dashboard.js').then(module => {
          module.statsDashboard.show();
        });
      }
    });
  }
  
  /**
   * Bind event listeners to modal buttons
   * @private
   */
  _bindModalButtons() {
    // Register button
    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
      registerButton.onclick = async () => {
        const username = document.getElementById('usernameInput').value.trim();
        if (!username) {
          notificationManager.warning('Please enter your name');
          return;
        }
        
        try {
          console.log('Attempting to register with username:', username);
          const success = await authService.register(username);
          console.log('Registration result:', success);
          if (success) {
            hideModal('authModal');
            this._updateAuthState(true);
          }
        } catch (error) {
          console.error('Registration error:', error);
          notificationManager.danger('Registration failed: ' + error.message);
        }
      };
    } else {
      console.warn('Register button not found');
    }

    // Login button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.onclick = async () => {
        try {
          console.log('Attempting to authenticate');
          const success = await authService.authenticate();
          console.log('Authentication result:', success);
          if (success) {
            hideModal('authModal');
            this._updateAuthState(true);
          }
        } catch (error) {
          console.error('Authentication error:', error);
          notificationManager.danger('Authentication failed: ' + error.message);
        }
      };
    } else {
      console.warn('Login button not found');
    }

    // Skip auth button
    const skipAuthButton = document.getElementById('skipAuthButton');
    if (skipAuthButton) {
      skipAuthButton.onclick = () => {
        hideModal('authModal');
        this._updateAuthState(false);
      };
    } else {
      console.warn('Skip auth button not found');
    }
  }

  /**
   * Update the UI based on authentication state
   * @param {boolean} isAuthenticated - Whether the user is authenticated
   * @private
   */
  _updateAuthState(isAuthenticated) {
    // Create profile button if it doesn't exist
    this._createProfileButton();
    
    const profileButton = document.getElementById('userProfileButton');
    const profileUsername = document.getElementById('profileUsername');
    const userStatsText = document.getElementById('userStatsText');
    
    if (isAuthenticated) {
      const user = authService.getCurrentUser();
      const stats = authService.getUserStats();
      
      if (profileButton) {
        profileButton.classList.remove('btn-outline-secondary');
        profileButton.classList.add('btn-outline-primary');
      }
      
      if (profileUsername && user) {
        profileUsername.textContent = user.name;
      }
      
      if (userStatsText && stats) {
        userStatsText.textContent = `Sessions: ${stats.sessions}`;
      }
    } else {
      if (profileButton) {
        profileButton.classList.remove('btn-outline-primary');
        profileButton.classList.add('btn-outline-secondary');
      }
      
      if (profileUsername) {
        profileUsername.textContent = 'Guest';
      }
      
      if (userStatsText) {
        userStatsText.textContent = 'Not signed in';
      }
    }
  }
}

// Create and export singleton instance
export const authUI = new AuthUI();
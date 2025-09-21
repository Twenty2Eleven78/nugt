/**
 * Authentication UI Components
 * @version 1.0
 */

import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';
import { hideModal } from './modals.js';
import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';

class AuthUI {
  constructor() {
    this.authModalInitialized = false;
  }

  /**
   * Initialize the authentication UI
   */
  async init() {
    // Create auth modal if it doesn't exist
    if (!document.getElementById('authModal')) {
      this._createAuthModal();
    }

    // Bind event listeners
    this._bindEventListeners();

    // Check if already initialized by team access
    const isAuthenticated = authService.isUserAuthenticated();
    if (!isAuthenticated) {
      // Initialize auth service only if not already authenticated
      await authService.init();

    }

    // Set up auth state change listener
    authService.onAuthStateChange(isAuthenticated => {
      this._updateAuthState(isAuthenticated);
    });

    // Update UI based on current auth state
    this._updateAuthState(isAuthenticated);
    return isAuthenticated;

    // Not authenticated - still create profile button for guest user
    this._updateAuthState(false);
    
    // Show the auth modal
    requestAnimationFrame(() => {
      this.showAuthModal();
    });
    return false;
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
            <p>Welcome to NUFC GameTime! Please sign in to track your usage.</p>
          `;
        }
      }

      try {
        // Use custom modal system
        const modal = CustomModal.getOrCreateInstance(authModal);
        modal.show();
      } catch (error) {
        console.error('Error showing modal:', error);
        // Fallback modal display
        authModal.classList.add('show');
        authModal.style.display = 'block';
        document.body.classList.add('modal-open');

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
    }
  }

  /**
   * Create the authentication modal
   * @private
   */
  _createAuthModal() {
    const bodyContent = `
      <div class="auth-container">
        <div id="authMessage" class="mb-3">
          <p>Welcome to NUFC GameTime! Please sign in to track your usage.</p>
        </div>
        
        <div id="registerForm" class="mb-3">
          <div class="form-floating mb-3">
            <input type="email" class="form-control" id="usernameInput" placeholder="name@example.com">
            <label for="usernameInput">Email Address</label>
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
    `;

    const footerContent = `
      <div id="skipAuthContainer" class="w-100 text-center">
        <button type="button" id="skipAuthButton" class="btn btn-link">Continue without signing in</button>
        <small class="d-block text-muted">Your data won't be saved between sessions</small>
      </div>
    `;

    createAndAppendModal(
      'authModal',
      '<i class="fas fa-shield-alt me-2"></i>NUFC GameTime Authentication',
      bodyContent,
      {
        ...MODAL_CONFIGS.CENTERED,
        footerContent: footerContent
      }
    );

    this.authModalInitialized = true;

    // Bind event listeners to the modal buttons
    setTimeout(() => this._bindModalButtons(), 100);
  }

  /**
   * Create the user profile button in the header
   * @private
   */
  _createProfileButton() {
    // Find the header profile container with retry logic
    const headerProfileContainer = document.getElementById('header-profile-container');
    if (!headerProfileContainer) {
      // Retry after a short delay in case DOM isn't ready
      setTimeout(() => {
        this._createProfileButton();
      }, 100);
      return;
    }

    // Remove existing profile container if it exists
    const existingContainer = document.querySelector('.user-profile-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create profile button container
    const profileContainer = document.createElement('div');
    profileContainer.className = 'user-profile-container d-flex align-items-center gap-2';

    // Create "Start New Match" button
    const newMatchButton = document.createElement('button');
    newMatchButton.id = 'headerNewMatchBtn';
    newMatchButton.className = 'btn btn-sm btn-primary';
    newMatchButton.innerHTML = '<i class="fas fa-plus me-1"></i>New Match';
    newMatchButton.title = 'Start New Match';

    // Create profile button
    const profileButton = document.createElement('button');
    profileButton.id = 'userProfileButton';
    profileButton.className = 'btn btn-sm btn-outline-secondary dropdown-toggle';
    profileButton.innerHTML = '<i class="fas fa-user me-1"></i><span id="profileUsername">Guest</span>';
    profileButton.setAttribute('aria-expanded', 'false');

    // Create dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu dropdown-menu-end';
    dropdownMenu.id = 'userProfileDropdown';
    dropdownMenu.setAttribute('aria-labelledby', 'userProfileButton');

    // Add dropdown items
    dropdownMenu.innerHTML = `
      <button class="dropdown-item" id="logoutButton">
        <i class="fas fa-sign-out-alt me-2"></i>Sign Out
      </button>
    `;

    // Append elements
    profileContainer.appendChild(newMatchButton);
    profileContainer.appendChild(profileButton);
    profileContainer.appendChild(dropdownMenu);

    // Add to the header profile container
    headerProfileContainer.appendChild(profileContainer);

    // Set up new match button functionality
    newMatchButton.addEventListener('click', () => {
      // Import and show new match modal
      import('./new-match-modal.js').then(({ newMatchModal }) => {
        newMatchModal.show();
      }).catch(error => {
        console.error('Error loading new match modal:', error);
      });
    });

    // Set up dropdown functionality
    this._setupDropdown(profileButton, dropdownMenu);
  }

  /**
   * Set up dropdown functionality
   * @param {HTMLElement} button - The dropdown button
   * @param {HTMLElement} menu - The dropdown menu
   * @private
   */
  _setupDropdown(button, menu) {
    // Remove existing click listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    button = newButton;

    // Toggle dropdown on button click
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = menu.classList.contains('show');

      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
        if (dropdown !== menu) {
          dropdown.classList.remove('show');
          const btn = document.querySelector(`[aria-controls="${dropdown.id}"]`);
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle this dropdown
      menu.classList.toggle('show');
      button.setAttribute('aria-expanded', !isOpen);
    });

    // Close dropdown when clicking outside
    const closeDropdown = (e) => {
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
      }
    };

    document.removeEventListener('click', closeDropdown);
    document.addEventListener('click', closeDropdown);

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('show')) {
        menu.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
    });
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
        // Close the dropdown
        const dropdown = document.getElementById('userProfileDropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
        const button = document.getElementById('userProfileButton');
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }

        // Trigger logout
        authService.logout();
      }

      if (e.target && e.target.id === 'loginButton' && e.target.classList.contains('dropdown-item')) {
        // Close the dropdown
        const dropdown = document.getElementById('userProfileDropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
        const button = document.getElementById('userProfileButton');
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }

        // Show auth modal
        this.showAuthModal();
      }

      if (e.target && e.target.id === 'newGameButton') {
        // Close the dropdown
        const dropdown = document.getElementById('userProfileDropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
        const button = document.getElementById('userProfileButton');
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }

        // Show new game modal
        this._handleNewGame();
      }

      if (e.target && e.target.id === 'saveToCloudButton') {
        // Close the dropdown
        const dropdown = document.getElementById('userProfileDropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
        const button = document.getElementById('userProfileButton');
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }

        // Trigger save to cloud functionality
        this._handleSaveToCloud();
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
        const email = document.getElementById('usernameInput').value.trim();

        try {
          const success = await authService.register(email);
          if (success) {
            // Clear the email input on success
            const emailInput = document.getElementById('usernameInput');
            if (emailInput) {
              emailInput.value = '';
            }
            hideModal('authModal');
            this._updateAuthState(true);
          }
        } catch (error) {
          // Let the auth service handle the error notification
          // It has more context about the specific failure reason
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
          const success = await authService.authenticate();
          if (success) {
            hideModal('authModal');
            this._updateAuthState(true);
          }
        } catch (error) {
          // Let the auth service handle the error notification
          // It has more context about the specific error
        }
      };
    }

    // Skip auth button
    const skipAuthButton = document.getElementById('skipAuthButton');
    if (skipAuthButton) {
      skipAuthButton.onclick = () => {
        hideModal('authModal');
        this._updateAuthState(false);
      };
    }
  }

  /**
   * Update the UI based on authentication state
   * @param {boolean} isAuthenticated - Whether the user is authenticated
   * @private
   */
  _updateAuthState(isAuthenticated) {
    // Always recreate the profile button to ensure clean state
    this._createProfileButton();

    const profileButton = document.getElementById('userProfileButton');
    const profileUsername = document.getElementById('profileUsername');
    const dropdownMenu = document.getElementById('userProfileDropdown');

    // Close dropdown if it's open
    if (dropdownMenu && dropdownMenu.classList.contains('show')) {
      dropdownMenu.classList.remove('show');
    }

    if (isAuthenticated) {
      const user = authService.getCurrentUser();

      if (profileButton) {
        profileButton.classList.remove('btn-outline-secondary');
        profileButton.classList.add('btn-outline-primary');
      }

      if (profileUsername && user) {
        profileUsername.textContent = user.name;
      }

      // Show options for authenticated users
      if (dropdownMenu) {
        dropdownMenu.innerHTML = `
          <button class="dropdown-item" id="newGameButton">
            <i class="fas fa-plus-circle me-2"></i>New Match
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="saveToCloudButton">
            <i class="fas fa-cloud-upload-alt me-2"></i>Save to Cloud
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="logoutButton">
            <i class="fas fa-sign-out-alt me-2"></i>Sign Out
          </button>
        `;
      }
    } else {
      if (profileButton) {
        profileButton.classList.remove('btn-outline-primary');
        profileButton.classList.add('btn-outline-secondary');
      }

      if (profileUsername) {
        profileUsername.textContent = 'Guest';
      }

      // Show Sign In option for guest users
      if (dropdownMenu) {
        dropdownMenu.innerHTML = `
          <button class="dropdown-item" id="newGameButton">
            <i class="fas fa-plus-circle me-2"></i>New Match
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="loginButton">
            <i class="fas fa-sign-in-alt me-2"></i>Sign In
          </button>
        `;
      }
    }
  }

  /**
   * Handle new game functionality
   * @private
   */
  _handleNewGame() {
    // Import and show the new match modal
    import('./new-match-modal.js').then(({ showNewMatchModal }) => {
      showNewMatchModal();
    }).catch(error => {
      console.error('Error loading new match modal:', error);
      notificationManager.error('Failed to open new game dialog');
    });
  }

  /**
   * Handle save to cloud functionality
   * @private
   */
  _handleSaveToCloud() {
    // Import required modules
    Promise.all([
      import('./match-save-modal.js'),
      import('../data/state.js'),
      import('../shared/dom.js'),
      import('../services/user-matches-api.js'),
      import('../services/attendance.js')
    ]).then(([
      { matchSaveModal },
      { gameState },
      { domCache },
      { userMatchesApi },
      { attendanceManager }
    ]) => {
      // Initialize the modal if not already done
      matchSaveModal.init();

      // Prepare match info for the modal
      const team1Name = domCache.get('Team1NameElement')?.textContent || 'Team 1';
      const team2Name = domCache.get('Team2NameElement')?.textContent || 'Team 2';
      const score1 = domCache.get('firstScoreElement')?.textContent || '0';
      const score2 = domCache.get('secondScoreElement')?.textContent || '0';
      const currentDate = new Date().toLocaleDateString('en-GB');
      const defaultTitle = `${team1Name}(${score1}):${team2Name}(${score2}) - ${currentDate}`;

      const matchInfo = {
        defaultTitle,
        defaultNotes: ''
      };

      // Define the save callback
      const onSave = async ({ title, notes }) => {
        try {
          // Gather match data
          const matchData = {
            title,
            notes,
            matchTitle: gameState.matchTitle || null, // Include the match title as separate field
            goals: gameState.goals,
            matchEvents: gameState.matchEvents,
            team1History: gameState.team1History,
            team2History: gameState.team2History,
            gameTime: gameState.gameTime,
            team1Name,
            team2Name,
            score1,
            score2,
            attendance: attendanceManager.getMatchAttendance(),
            savedAt: Date.now()
          };

          await userMatchesApi.saveMatchData(matchData);
          notificationManager.success('Match saved to cloud!');
        } catch (error) {
          console.error('Error saving match data:', error);
          notificationManager.error('Failed to save match data.');
        }
      };

      // Show the save modal with proper parameters
      matchSaveModal.show(matchInfo, onSave);
    }).catch(error => {
      console.error('Error loading match save modal:', error);
      notificationManager.error('Failed to open save dialog');
    });
  }

  /**
   * Fix modal overlay issues (useful for debugging)
   */
  fixModalOverlays() {
    // Remove all backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    // Clean up body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Reset all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = '';
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      modal.removeAttribute('aria-modal');
      modal.removeAttribute('role');
    });
  }
}

// Create and export singleton instance
export const authUI = new AuthUI();
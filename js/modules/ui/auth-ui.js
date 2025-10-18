/**
 * Authentication UI Components
 * @version 1.0
 */

import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';
import { hideModal } from './modals.js';
import { createAndAppendModal } from '../shared/modal-factory.js';

class AuthUI {
  constructor() {
    this.authModalInitialized = false;
  }

  /**
   * Initialize the authentication UI
   */
  async init() {
    // Ensure body doesn't have authenticated class initially
    document.body.classList.remove('authenticated');
    
    // Create auth modal if it doesn't exist
    if (!document.getElementById('authModal')) {
      this._createAuthModal();
    }

    // Bind event listeners
    this._bindEventListeners();

    // Initialize auth service and check authentication status
    const isAuthenticated = await authService.init();

    // Set up auth state change listener
    authService.onAuthStateChange(isAuthenticated => {
      this._updateAuthState(isAuthenticated);
    });

    // Update UI based on initial auth state
    if (isAuthenticated) {
      this._updateAuthState(true);
      return true;
    }

    // Not authenticated - update auth state and show modal
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
              <strong>Note:</strong> Your browser doesn't support passkeys.
              A simplified authentication will be used instead.
            </div>
            <h3 class="h2 mb-2">Welcome to GameTime</h3>
            <p class="lead text-muted">Please sign in to continue</p>
          `;
        }
      }

      // Show the modal
      authModal.classList.add('show');
      authModal.style.display = 'block';
      document.body.classList.add('modal-open');
    }
  }

  /**
   * Create the authentication modal
   * @private
   */
  _createAuthModal() {
    const bodyContent = `
      <div class="auth-container welcome-screen">
        <div id="authMessage" class="text-center mb-4">
          <h3 class="h2 mb-2">Welcome to GameTime</h3>
          <p class="lead text-muted">Your Match Tracking Assistant</p>
        </div>
        <div id="authForm" class="mb-4">
          <div class="form-floating mb-3">
            <input type="email" class="form-control form-control-lg" id="usernameInput" placeholder="name@example.com">
            <label for="usernameInput">Email Address</label>
          </div>
          <button type="button" id="loginButton" class="btn btn-primary btn-lg w-100 mb-3">
            <i class="fas fa-shield-alt me-2"></i>Continue with Passkey
          </button>
          <small class="text-muted d-block">We'll create a new account if you're new, or sign you in if you're returning</small>
        </div>
        <div class="welcome-features">
          <div class="feature-list text-muted">
            <div class="feature-item mb-2">
              <i class="fas fa-check-circle me-2 text-success"></i>Track matches in real-time
            </div>
            <div class="feature-item mb-2">
              <i class="fas fa-check-circle me-2 text-success"></i>Save and sync your data
            </div>
            <div class="feature-item">
              <i class="fas fa-check-circle me-2 text-success"></i>Access anywhere, anytime
            </div>
          </div>
        </div>
      </div>
    `;

    createAndAppendModal(
      'authModal',
      '<i class="fas fa-shield-alt"></i><span>GameTime App</span>',
      bodyContent,
      {
        size: 'modal-sm',
        backdrop: 'static',
        keyboard: false,
        closeButton: false,
        headerClass: 'border-0',
        bodyClass: 'px-4 pb-4',
        fade: true,
        centered: true,
        fullscreen: true
      }
    );

    this.authModalInitialized = true;

    // Bind event listeners to the modal buttons
    setTimeout(() => {
      this._bindModalButtons();
      this._bindInputValidation();
    }, 100);
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

    // Find the header profile container with retry logic
    const headerProfileContainer = document.getElementById('header-profile-container');
    if (!headerProfileContainer) {
      // Retry after a short delay in case DOM isn't ready
      setTimeout(() => {
        this._createProfileButton();
      }, 100);
      return;
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
    // Toggle dropdown on button click
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = menu.classList.contains('show');

      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
        dropdown.classList.remove('show');
      });

      // Toggle this dropdown
      if (!isOpen) {
        menu.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
      } else {
        menu.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
      }
    });

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

        // Clear the email input
        const emailInput = document.getElementById('usernameInput');
        if (emailInput) {
          emailInput.value = '';
          emailInput.classList.remove('is-valid', 'is-invalid');
        }

        // Trigger logout
        authService.logout();
        
        // Show the auth modal
        requestAnimationFrame(() => {
          this.showAuthModal();
        });
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
   * Bind input validation
   * @private
   */
  _bindInputValidation() {
    const emailInput = document.getElementById('usernameInput');
    const loginButton = document.getElementById('loginButton');
    
    if (emailInput && loginButton) {
      emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        const isValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        
        loginButton.disabled = !isValid;
        
        // Update input validation state
        if (email) {
          if (isValid) {
            emailInput.classList.remove('is-invalid');
            emailInput.classList.add('is-valid');
          } else {
            emailInput.classList.remove('is-valid');
            emailInput.classList.add('is-invalid');
          }
        } else {
          emailInput.classList.remove('is-valid', 'is-invalid');
        }
      });

      // Initial validation
      emailInput.dispatchEvent(new Event('input'));
    }
  }

  /**
   * Bind event listeners to modal buttons
   * @private
   */
  _bindModalButtons() {
    // Combined auth button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.onclick = async () => {
        const button = loginButton;
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-circle-notch fa-spin me-2"></i>Processing...';

        try {
          const success = await authService.authenticate();
          if (success) {
            // Clear the email input on success
            const emailInput = document.getElementById('usernameInput');
            if (emailInput) {
              emailInput.value = '';
            }
            
            // Hide modal
            const authModal = document.getElementById('authModal');
            if (authModal) {
              authModal.classList.remove('show');
              authModal.style.display = 'none';
              document.body.classList.remove('modal-open');
              
              // Remove backdrop
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) {
                backdrop.remove();
              }
            }
            
            this._updateAuthState(true);
          }
        } catch (error) {
          // Error handling is done by auth service
        } finally {
          button.disabled = false;
          button.innerHTML = originalText;
        }
      };
    }
  }

  /**
   * Update the UI based on authentication state
   * @param {boolean} isAuthenticated - Whether the user is authenticated
   * @private
   */
  _updateAuthState(isAuthenticated) {
    // Update body class for authentication state
    document.body.classList.toggle('authenticated', isAuthenticated);
    
    // Create profile button if it doesn't exist
    this._createProfileButton();

    const profileButton = document.getElementById('userProfileButton');
    const profileUsername = document.getElementById('profileUsername');
    const dropdownMenu = document.getElementById('userProfileDropdown');

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

      // Reset the login button to initial state if it exists
      const loginButton = document.getElementById('loginButton');
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-shield-alt me-2"></i>Continue with Passkey';
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
          // Gather match data with lineup
          const savedAttendance = attendanceManager.getMatchAttendance();
          
          // Import storage to get lineup data
          const { storage } = await import('../data/storage.js');
          const { STORAGE_KEYS } = await import('../shared/constants.js');
          const savedLineup = storage.load(STORAGE_KEYS.MATCH_LINEUP, null);
          
          // Generate lineup from attendance data if no saved lineup exists
          let matchLineup = savedLineup || gameState.matchLineup;
          if (!matchLineup && savedAttendance.length > 0) {
            // First try to use players with specific roles
            let startingXI = savedAttendance
              .filter(player => player.attending && player.lineupRole === 'starter')
              .map(player => player.playerName);
            let substitutes = savedAttendance
              .filter(player => player.attending && player.lineupRole === 'substitute')
              .map(player => player.playerName);

            // If no players have specific roles, create a basic lineup from attending players
            if (startingXI.length === 0 && substitutes.length === 0) {
              const attendingPlayers = savedAttendance
                .filter(player => player.attending)
                .map(player => player.playerName);
              
              if (attendingPlayers.length > 0) {
                // Take first 11 as starters, rest as substitutes
                startingXI = attendingPlayers.slice(0, 11);
                substitutes = attendingPlayers.slice(11);
              }
            }

            if (startingXI.length > 0 || substitutes.length > 0) {
              matchLineup = {
                startingXI,
                substitutes,
                createdAt: Date.now(),
                source: 'profile_dropdown_save'
              };
            }
          }
          
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
            attendance: savedAttendance,
            matchLineup: matchLineup,
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
/**
 * Debug utilities for NUFC GameTime App
 * @version 1.0
 */

// Function to manually show the auth modal
function showAuthModal() {
  console.log('Attempting to show auth modal manually...');
  
  // Try to find the auth modal
  const authModal = document.getElementById('authModal');
  if (authModal) {
    console.log('Auth modal found, showing...');
    try {
      if (typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(authModal);
        bsModal.show();
      } else {
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
  } else {
    console.log('Auth modal not found, creating...');
    
    // Try to import auth-ui module
    import('./modules/ui/auth-ui.js')
      .then(module => {
        if (module.authUI && typeof module.authUI.init === 'function') {
          module.authUI.init().then(() => {
            console.log('Auth UI initialized');
            setTimeout(() => {
              const newAuthModal = document.getElementById('authModal');
              if (newAuthModal) {
                console.log('Auth modal created, showing...');
                try {
                  if (typeof bootstrap !== 'undefined') {
                    const bsModal = new bootstrap.Modal(newAuthModal);
                    bsModal.show();
                  } else {
                    newAuthModal.classList.add('show');
                    newAuthModal.style.display = 'block';
                    document.body.classList.add('modal-open');
                    
                    // Create backdrop
                    const backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    document.body.appendChild(backdrop);
                  }
                } catch (error) {
                  console.error('Error showing modal:', error);
                }
              } else {
                console.error('Auth modal still not found after initialization');
              }
            }, 100);
          });
        } else {
          console.error('Auth UI module found but init method not available');
        }
      })
      .catch(error => {
        console.error('Error importing auth-ui module:', error);
      });
  }
}

// Function to manually create the auth modal
function createAuthModal() {
  console.log('Manually creating auth modal...');
  
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
  
  console.log('Auth modal created manually');
  
  // Add event listeners
  const registerButton = document.getElementById('registerButton');
  if (registerButton) {
    registerButton.addEventListener('click', async () => {
      const email = document.getElementById('usernameInput').value.trim();
      if (!email) {
        alert('Please enter your email address');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Try to import auth service
      import('./modules/services/auth.js')
        .then(async module => {
          if (module.authService && typeof module.authService.register === 'function') {
            try {
              const success = await module.authService.register(email);
              if (success) {
                hideAuthModal();
                alert('Registration successful!');
              }
            } catch (error) {
              console.error('Registration error:', error);
              alert('Registration failed: ' + error.message);
            }
          } else {
            console.error('Auth service module found but register method not available');
            alert('Registration failed: Auth service not available');
          }
        })
        .catch(error => {
          console.error('Error importing auth service module:', error);
          alert('Registration failed: Could not load auth service');
        });
    });
  }
  
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', async () => {
      // Try to import auth service
      import('./modules/services/auth.js')
        .then(async module => {
          if (module.authService && typeof module.authService.authenticate === 'function') {
            try {
              const success = await module.authService.authenticate();
              if (success) {
                hideAuthModal();
                alert('Authentication successful!');
              }
            } catch (error) {
              console.error('Authentication error:', error);
              alert('Authentication failed: ' + error.message);
            }
          } else {
            console.error('Auth service module found but authenticate method not available');
            alert('Authentication failed: Auth service not available');
          }
        })
        .catch(error => {
          console.error('Error importing auth service module:', error);
          alert('Authentication failed: Could not load auth service');
        });
    });
  }
  
  const skipAuthButton = document.getElementById('skipAuthButton');
  if (skipAuthButton) {
    skipAuthButton.addEventListener('click', () => {
      hideAuthModal();
    });
  }
}

// Function to hide the auth modal
function hideAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    try {
      if (typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(authModal);
        if (bsModal) {
          bsModal.hide();
        } else {
          authModal.classList.remove('show');
          authModal.style.display = 'none';
          document.body.classList.remove('modal-open');
          
          // Remove backdrop
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());
        }
      } else {
        authModal.classList.remove('show');
        authModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
      }
    } catch (error) {
      console.error('Error hiding modal:', error);
    }
  }
}

// Function to fix modal overlay issues
function fixModalOverlays() {
  console.log('Fixing modal overlays...');
  
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
  
  console.log('Modal overlays fixed');
}

// Expose debug functions to global scope
window.debugAuth = {
  showAuthModal,
  createAuthModal,
  hideAuthModal,
  fixModalOverlays
};
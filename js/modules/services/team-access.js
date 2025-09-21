/**
 * Team Access Control Service
 * Manages team/club-based data segmentation and user access
 */

import { authService } from './auth.js';
import { storage } from '../data/storage.js';
import { notificationManager } from './notifications.js';

const TEAM_STORAGE_KEYS = {
  CURRENT_TEAM: 'nugt_current_team',
  USER_TEAMS: 'nugt_user_teams',
  TEAM_INVITES: 'nugt_team_invites'
};

class TeamAccessService {
  constructor() {
    this.currentTeam = null;
    this.userTeams = [];
  }

  // Initialize team access for authenticated user
  async init() {
    // Initialize auth UI first
    const { authUI } = await import('../ui/auth-ui.js');
    await authUI.init();
    
    if (!authService.isUserAuthenticated()) {
      console.log('Team access: User not authenticated');
      return false;
    }

    this.userTeams = storage.load(TEAM_STORAGE_KEYS.USER_TEAMS, []);
    const savedTeamId = storage.load(TEAM_STORAGE_KEYS.CURRENT_TEAM, null);
    
    console.log('Team access init:', { userTeams: this.userTeams, savedTeamId });
    
    if (savedTeamId && this.userTeams.find(t => t.id === savedTeamId)) {
      this.currentTeam = this.userTeams.find(t => t.id === savedTeamId);
      console.log('Team access: Current team set to', this.currentTeam);
    } else {
      console.log('Team access: No current team found');
    }

    return true;
  }

  // Create new team/club (admin only)
  async createTeam(teamName, teamCode = null) {
    if (!authService.isUserAuthenticated()) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const isAdmin = await authService.isAdmin();
    if (!isAdmin) {
      throw new Error('Only administrators can create teams');
    }

    const user = authService.getCurrentUser();
    const teamId = this._generateTeamId();
    const accessCode = teamCode || this._generateAccessCode();

    const team = {
      id: teamId,
      name: teamName,
      code: accessCode,
      owner: user.id,
      members: [{ userId: user.id, email: user.email, role: 'owner', joinedAt: Date.now() }],
      createdAt: Date.now()
    };

    // Save team to cloud
    await this._saveTeamToCloud(team);
    
    // Add to user's teams
    this.userTeams.push(team);
    this._saveUserTeams();
    
    // Set as current team
    this.setCurrentTeam(teamId);
    
    notificationManager.success(`Team "${teamName}" created with code: ${accessCode}`);
    return team;
  }

  // Join team using access code
  async joinTeam(accessCode) {
    if (!authService.isUserAuthenticated()) {
      throw new Error('Authentication required');
    }

    const user = authService.getCurrentUser();
    
    // Check if already in team
    if (this.userTeams.find(t => t.code === accessCode)) {
      throw new Error('Already a member of this team');
    }

    // Find team by code (via API)
    const team = await this._findTeamByCode(accessCode);
    if (!team) {
      throw new Error('Invalid team code');
    }

    // Add user to team
    const member = {
      userId: user.id,
      email: user.email,
      role: 'member',
      joinedAt: Date.now()
    };

    team.members.push(member);
    await this._saveTeamToCloud(team);

    // Add to user's teams
    this.userTeams.push(team);
    this._saveUserTeams();

    // Ensure UI is updated
    const { authUI } = await import('../ui/auth-ui.js');
    await authUI._updateAuthState(true);

    notificationManager.success(`Joined team "${team.name}"`);
    return team;
  }

  // Set current active team
  setCurrentTeam(teamId) {
    const team = this.userTeams.find(t => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    this.currentTeam = team;
    storage.save(TEAM_STORAGE_KEYS.CURRENT_TEAM, teamId);
    
    // Clear any cached data from previous team
    this._clearTeamCache();
    
    return team;
  }

  // Hide app interface
  hideAppInterface() {
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      mainContainer.style.display = 'none';
    }
  }

  // Show combined auth and team selection screen
  async showAuthScreen() {
    this._clearScreens();
    
    // Initialize auth UI first
    const { authUI } = await import('../ui/auth-ui.js');
    await authUI.init();
    const authScreen = document.createElement('div');
    authScreen.id = 'authScreen';
    authScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      z-index: 10000;
    `;
    
    authScreen.innerHTML = `
      <div class="text-center p-4" style="max-width: 500px;">
        <img src="./nugt512.png" alt="NUGT" style="width: 100px; height: 100px; margin-bottom: 1.5rem; border-radius: 15px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
        <h1 class="mb-3">GameTime App</h1>
        <p class="mb-4">Football match tracking and statistics</p>
        
        <div id="authSection">
          <h4 class="mb-3">Sign In</h4>
          <form id="authForm" class="mb-4">
            <div class="mb-3">
              <input type="email" class="form-control form-control-lg" id="authEmail" placeholder="Enter your email" required>
            </div>
            <button type="submit" class="btn btn-primary btn-lg w-100">
              <i class="fas fa-sign-in-alt me-2"></i>Sign In / Register
            </button>
          </form>
        </div>
        
        <div id="teamSection" style="display: none;">
          <h4 class="mb-3">Enter Team Code</h4>
          <form id="teamForm">
            <div class="mb-3">
              <input type="text" class="form-control form-control-lg text-center" id="teamCodeInput" placeholder="Team Code" required style="letter-spacing: 2px; text-transform: uppercase;">
            </div>
            <button type="submit" class="btn btn-primary btn-lg w-100">
              <i class="fas fa-unlock me-2"></i>Access Team
            </button>
          </form>
          <small class="text-muted mt-2 d-block">Contact your team administrator for the access code</small>
        </div>
      </div>
    `;
    
    document.body.appendChild(authScreen);
    this._bindAuthEvents();
  }

  // Bind authentication and team events
  _bindAuthEvents() {
    // Auth form submission
    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      if (email) {
        try {
          const { authService } = await import('./auth.js');
          
          // Directly set auth state without WebAuthn modal
          const userId = `user_${email.split('@')[0]}_${email.split('@')[1].replace(/\./g, '_')}`;
          const userData = {
            userId,
            email,
            displayName: email.split('@')[0],
            authTimestamp: Date.now()
          };
          
          // Set authentication state
          authService.isAuthenticated = true;
          authService.currentUser = {
            id: userId,
            email: email,
            name: email.split('@')[0]
          };
          authService.authTimestamp = Date.now();
          
          // Save auth state first
          storage.saveImmediate('nugt_is_authenticated', true);
          storage.saveImmediate('nugt_auth_timestamp', Date.now());
          
          // Force a clean UI update
          const { authUI } = await import('../ui/auth-ui.js');
          await authUI._updateAuthState(true);
          
          // Notify auth state change
          authService.notifyAuthStateChange();
          
          // Save to storage
          const { storage } = await import('../data/storage.js');
          storage.saveImmediate('nugt_user_id', userId);
          storage.saveImmediate('nugt_email', email);
          storage.saveImmediate('nugt_display_name', email.split('@')[0]);
          storage.saveImmediate('nugt_is_authenticated', true);
          storage.saveImmediate('nugt_auth_timestamp', Date.now());
          
          // Check if user is admin
          const isAdmin = await authService.isAdmin();
          console.log('Admin check result:', isAdmin);
          
          if (isAdmin) {
            console.log('Admin detected - showing app interface');
            this._clearScreens();
            this.showAppInterface();
          } else {
            console.log('Regular user - showing team section');
            this._showTeamSection();
          }
        } catch (error) {
          notificationManager.error(error.message);
        }
      }
    });
    
    // Team form submission
    document.getElementById('teamForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('teamCodeInput').value.trim().toUpperCase();
      if (code) {
        try {
          await this.joinTeam(code);
          this.showAppInterface();
        } catch (error) {
          notificationManager.error(error.message);
        }
      }
    });
  }

  // Show team section after successful auth
  _showTeamSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('teamSection').style.display = 'block';
  }

  // Show team code entry screen (now uses combined screen)
  showTeamCodeScreen() {
    this.showAuthScreen();
  }

  // Clear all screens
  _clearScreens() {
    ['authScreen', 'teamScreen', 'welcomeScreen'].forEach(id => {
      const screen = document.getElementById(id);
      if (screen) screen.remove();
    });
  }

  // Inline auth fallback
  _showInlineAuth() {
    const authModal = document.createElement('div');
    authModal.id = 'inlineAuthModal';
    authModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
    `;
    
    authModal.innerHTML = `
      <div class="bg-white p-4 rounded" style="max-width: 400px; width: 90%;">
        <h3 class="mb-3">Sign In</h3>
        <form id="inlineAuthForm">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" id="authEmail" required>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary flex-fill">Register/Sign In</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('inlineAuthModal').remove()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(authModal);
    
    // Handle form submission
    document.getElementById('inlineAuthForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      if (email) {
        try {
          // Import authService dynamically
          const { authService } = await import('./auth.js');
          await authService.register(email);
          authModal.remove();
          window.location.reload();
        } catch (error) {
          notificationManager.error(error.message);
        }
      }
    });
  }

  // Show app interface and hide welcome screen
  showAppInterface() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
      welcomeScreen.remove();
    }
    
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      mainContainer.style.display = '';
    }
  }

  // Get current team
  getCurrentTeam() {
    return this.currentTeam;
  }

  // Get user's teams
  getUserTeams() {
    return this.userTeams;
  }

  // Get team-scoped storage key
  getTeamStorageKey(baseKey) {
    if (!this.currentTeam) {
      throw new Error('No team selected');
    }
    return `${baseKey}_team_${this.currentTeam.id}`;
  }

  // Check if user has permission for action
  hasPermission(action) {
    if (!this.currentTeam) return false;
    
    const user = authService.getCurrentUser();
    const member = this.currentTeam.members.find(m => m.userId === user.id);
    
    if (!member) return false;
    
    // Owner can do everything
    if (member.role === 'owner') return true;
    
    // Define permissions by role
    const permissions = {
      member: ['read', 'create_match', 'edit_own_match'],
      admin: ['read', 'create_match', 'edit_match', 'manage_members'],
      owner: ['all']
    };
    
    return permissions[member.role]?.includes(action) || false;
  }

  // Leave team
  async leaveTeam(teamId) {
    const team = this.userTeams.find(t => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const user = authService.getCurrentUser();
    const member = team.members.find(m => m.userId === user.id);
    
    if (member.role === 'owner') {
      throw new Error('Owner cannot leave team. Transfer ownership first.');
    }

    // Remove from team members
    team.members = team.members.filter(m => m.userId !== user.id);
    await this._saveTeamToCloud(team);

    // Remove from user's teams
    this.userTeams = this.userTeams.filter(t => t.id !== teamId);
    this._saveUserTeams();

    // Switch to another team if this was current
    if (this.currentTeam?.id === teamId) {
      this.currentTeam = this.userTeams[0] || null;
      storage.save(TEAM_STORAGE_KEYS.CURRENT_TEAM, this.currentTeam?.id || null);
    }

    notificationManager.success(`Left team "${team.name}"`);
  }

  // Private methods
  _generateTeamId() {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateAccessCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  _saveUserTeams() {
    storage.save(TEAM_STORAGE_KEYS.USER_TEAMS, this.userTeams);
  }

  _clearTeamCache() {
    // Clear any team-specific cached data
    const keysToRemove = [];
    for (let key in localStorage) {
      if (key.includes('_team_') && !key.includes(this.currentTeam?.id)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async _saveTeamToCloud(team) {
    // Save team data to cloud storage
    const token = await authService.getAuthToken();
    const response = await fetch('/.netlify/functions/teams', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(team)
    });

    if (!response.ok) {
      throw new Error('Failed to save team data');
    }
  }

  async _findTeamByCode(code) {
    const token = await authService.getAuthToken();
    const response = await fetch(`/.netlify/functions/teams?code=${code}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.team;
    }
    return null;
  }
}

export const teamAccessService = new TeamAccessService();
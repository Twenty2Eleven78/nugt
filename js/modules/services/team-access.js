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
    if (!authService.isUserAuthenticated()) {
      return false;
    }

    this.userTeams = storage.load(TEAM_STORAGE_KEYS.USER_TEAMS, []);
    const savedTeamId = storage.load(TEAM_STORAGE_KEYS.CURRENT_TEAM, null);
    
    if (savedTeamId && this.userTeams.find(t => t.id === savedTeamId)) {
      this.currentTeam = this.userTeams.find(t => t.id === savedTeamId);
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

  // Show welcome screen and hide app interface
  showWelcomeScreen() {
    // Hide main app interface
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      mainContainer.style.display = 'none';
    }

    // Create welcome screen
    const welcomeScreen = document.createElement('div');
    welcomeScreen.id = 'welcomeScreen';
    welcomeScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
      z-index: 10000;
    `;
    
    welcomeScreen.innerHTML = `
      <div class="text-center p-4">
        <img src="./nugt512.png" alt="NUGT" style="width: 120px; height: 120px; margin-bottom: 2rem; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
        <h1 class="mb-3">Welcome to NUFC GameTime</h1>
        <p class="mb-4 fs-5">Professional football match tracking and statistics</p>
        <div class="mb-4">
          <button class="btn btn-light btn-lg" onclick="teamSelectorModal.show()">
            <i class="fas fa-users me-2"></i>Select Team to Continue
          </button>
        </div>
        <small class="opacity-75">You need to join or create a team to access the application</small>
      </div>
    `;
    
    document.body.appendChild(welcomeScreen);
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
/**
 * Team Selector Modal
 * UI for team selection, creation, and joining
 */

import { teamAccessService } from '../services/team-access.js';
import { notificationManager } from '../services/notifications.js';
import { CustomModal } from '../shared/custom-modal.js';
import { authService } from '../services/auth.js';

class TeamSelectorModal {
  constructor() {
    this.modal = null;
  }

  init() {
    this._createModal();
  }

  async show() {
    if (!this.modal) {
      this._createModal();
    }
    await this._updateContent();
    this.modal.show();
  }

  _createModal() {
    const hasTeam = teamAccessService.getCurrentTeam();
    const modalHTML = `
      <div class="modal fade" id="teamSelectorModal" tabindex="-1" data-backdrop="${hasTeam ? 'true' : 'static'}" data-keyboard="${hasTeam}">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Select Team</h5>
              ${hasTeam ? '<button type="button" class="btn-close" data-dismiss="modal"></button>' : ''}
            </div>
            <div class="modal-body" id="teamSelectorContent">
              <!-- Content populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = CustomModal.getOrCreateInstance(document.getElementById('teamSelectorModal'));
    this._bindEvents();
  }

  async _updateContent() {
    const content = document.getElementById('teamSelectorContent');
    const teams = teamAccessService.getUserTeams();
    const currentTeam = teamAccessService.getCurrentTeam();
    const isAdmin = await authService.isAdmin();

    content.innerHTML = `
      ${teams.length > 0 ? `
        <div class="mb-3">
          <h6>Your Teams</h6>
          ${teams.map(team => `
            <div class="d-flex align-items-center justify-content-between p-2 border rounded mb-2 ${currentTeam?.id === team.id ? 'bg-primary text-white' : ''}">
              <div>
                <strong>${team.name}</strong>
                <small class="d-block">Code: ${team.code}</small>
              </div>
              ${currentTeam?.id !== team.id ? `
                <button class="btn btn-sm btn-outline-primary" onclick="teamSelectorModal.selectTeam('${team.id}')">
                  Select
                </button>
              ` : '<span class="badge bg-light text-dark">Current</span>'}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="row">
        ${isAdmin ? `
          <div class="col-md-6">
            <h6>Create Team <span class="badge bg-warning text-dark">Admin</span></h6>
            <form id="createTeamForm">
              <div class="mb-2">
                <input type="text" class="form-control" id="teamName" placeholder="Team Name" required>
              </div>
              <button type="submit" class="btn btn-success btn-sm w-100">Create Team</button>
            </form>
          </div>
        ` : ''}
        
        <div class="${isAdmin ? 'col-md-6' : 'col-12'}">
          <h6>Join Team</h6>
          <form id="joinTeamForm">
            <div class="mb-2">
              <input type="text" class="form-control" id="teamCode" placeholder="Team Code" required>
            </div>
            <button type="submit" class="btn btn-primary btn-sm w-100">Join Team</button>
          </form>
        </div>
      </div>
      
      ${!isAdmin ? `
        <div class="alert alert-info mt-3">
          <small><i class="fas fa-info-circle me-1"></i>Contact an administrator to create new teams</small>
        </div>
      ` : ''}
    `;
  }

  _bindEvents() {
    const modal = document.getElementById('teamSelectorModal');
    
    modal.addEventListener('submit', async (e) => {
      if (e.target.id === 'createTeamForm') {
        e.preventDefault();
        const teamName = document.getElementById('teamName').value.trim();
        if (teamName) {
          try {
            const team = await teamAccessService.createTeam(teamName);
            teamAccessService.showAppInterface();
            this._updateContent();
            notificationManager.success(`Team created! Share code: ${team.code}`);
          } catch (error) {
            notificationManager.error(error.message);
          }
        }
      }
      
      if (e.target.id === 'joinTeamForm') {
        e.preventDefault();
        const teamCode = document.getElementById('teamCode').value.trim();
        if (teamCode) {
          try {
            await teamAccessService.joinTeam(teamCode);
            teamAccessService.showAppInterface();
            this._updateContent();
          } catch (error) {
            notificationManager.error(error.message);
          }
        }
      }
    });
  }

  selectTeam(teamId) {
    try {
      teamAccessService.setCurrentTeam(teamId);
      teamAccessService.showAppInterface();
      this.modal.hide();
      notificationManager.success('Team selected');
      // Refresh page to load team data
      window.location.reload();
    } catch (error) {
      notificationManager.error(error.message);
    }
  }
}

export const teamSelectorModal = new TeamSelectorModal();
window.teamSelectorModal = teamSelectorModal;
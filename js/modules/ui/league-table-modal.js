/**
 * League Table Modal
 * UI component for displaying FA Full-Time league tables
 * @version 4.0
 */

import { faFullTimeService } from '../services/fa-fulltime.js';
import { notificationManager } from '../services/notifications.js';
import { domCache } from '../shared/dom.js';
import { CustomModal } from '../shared/custom-modal.js';

class LeagueTableModal {
  constructor() {
    this.isInitialized = false;
    this.currentTable = null;
  }

  init() {
    if (this.isInitialized) return;
    this.createModal();
    this.bindEvents();
    this.isInitialized = true;
  }

  createModal() {
    const modalHTML = `
      <div class="modal fade" id="leagueTableModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fas fa-table me-2"></i>League Table
              </h5>
              <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-times" style="font-size: 14px;"></i>
              </button>
            </div>
            <div class="modal-body" style="min-height: 70vh;">
              <input type="hidden" id="faUrlInput">
              <div id="leagueTableContent">
                <div class="text-center text-muted py-4">
                  <i class="fas fa-table fa-3x mb-3"></i>
                  <p>Loading league table...</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="predictLeagueBtn" style="display: none;">
                <i class="fas fa-calculator me-1"></i>Predict Maximum Points
              </button>
              <button type="button" class="btn btn-info" id="actualLeagueBtn" style="display: none;">
                <i class="fas fa-undo me-1"></i>Back to Actual
              </button>
              <button type="button" class="btn btn-primary" id="saveLeagueBtn" style="display: none;">
                <i class="fas fa-save me-1"></i>Save Table
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  bindEvents() {
    const saveBtn = document.getElementById('saveLeagueBtn');
    saveBtn?.addEventListener('click', () => this.saveLeagueTable());

    const predictBtn = document.getElementById('predictLeagueBtn');
    predictBtn?.addEventListener('click', () => this.predictAndShowMaxPoints());

    const actualBtn = document.getElementById('actualLeagueBtn');
    actualBtn?.addEventListener('click', () => this.showActualTable());
  }

  predictAndShowMaxPoints() {
    if (!this.currentTable || !this.currentTable.data || !this.currentTable.data.teams) {
      notificationManager.warning('No league table data to predict from.');
      return;
    }

    const teams = this.currentTable.data.teams;
    const totalGames = (teams.length - 1) * 2;

    const predictedTeams = teams.map(team => {
      const remainingGames = totalGames - team.played;
      const maxPoints = team.points + (remainingGames * 3);
      return {
        ...team,
        predictedPoints: maxPoints,
        remainingGames: remainingGames,
      };
    });

    predictedTeams.sort((a, b) => b.predictedPoints - a.predictedPoints);

    this.renderPredictedTable(predictedTeams);

    document.getElementById('predictLeagueBtn').style.display = 'none';
    document.getElementById('actualLeagueBtn').style.display = 'inline-block';
  }

  showActualTable() {
    const teamName = domCache.get('Team1NameElement')?.textContent || 'Netherton';
    const content = document.getElementById('leagueTableContent');
    content.innerHTML = faFullTimeService.renderLeagueTable(this.currentTable.data, teamName);

    document.getElementById('predictLeagueBtn').style.display = 'inline-block';
    document.getElementById('actualLeagueBtn').style.display = 'none';
  }

  renderPredictedTable(predictedTeams) {
    const content = document.getElementById('leagueTableContent');
    const highlightName = (domCache.get('Team1NameElement')?.textContent || 'Netherton').toLowerCase();

    const tableHTML = `
      <div class="table-responsive" style="overflow-y: auto;">
        <table class="table table-sm table-hover" style="font-size: 0.8rem;">
          <thead class="table-light sticky-top">
            <tr>
              <th style="width: 30px; padding: 0.25rem;">Pos</th>
              <th style="padding: 0.25rem;">Team</th>
              <th style="padding: 0.25rem;" class="text-center">Current Pts</th>
              <th style="padding: 0.25rem;" class="text-center">Max Pts</th>
            </tr>
          </thead>
          <tbody>
            ${predictedTeams.map((team, index) => {
              const isHighlighted = highlightName && team.team.toLowerCase().includes(highlightName);
              const rowClass = isHighlighted ? 'table-info fw-bold' : '';

              return `
                <tr class="${rowClass}">
                  <td class="text-center" style="padding: 0.25rem;">${index + 1}</td>
                  <td style="padding: 0.25rem;">
                    <div style="font-weight: 600; font-size: 0.85rem;">${this.escapeHtml(team.team)}</div>
                    <div style="font-size: 0.7rem; color: #6c757d;">${team.remainingGames} games remaining</div>
                  </td>
                  <td class="text-center" style="padding: 0.25rem;">${team.points}</td>
                  <td class="text-center fw-bold" style="padding: 0.25rem; color: var(--theme-primary);">${team.predictedPoints}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <small class="text-muted">
          <i class="fas fa-calculator me-1"></i>
          Predicted table based on teams winning all remaining games.
        </small>
      </div>
    `;

    content.innerHTML = tableHTML;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async fetchLeagueTable() {
    const urlInput = document.getElementById('faUrlInput');
    const content = document.getElementById('leagueTableContent');
    const fetchBtn = document.getElementById('fetchLeagueBtn');
    const saveBtn = document.getElementById('saveLeagueBtn');

    const url = urlInput?.value?.trim();
    if (!url) {
      notificationManager.warning('Please enter a FA Full-Time URL');
      return;
    }

    // Show loading state
    fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Fetching...';
    fetchBtn.disabled = true;
    content.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="text-muted">Fetching league table from FA Full-Time...</p>
      </div>
    `;

    try {
      const leagueTable = await faFullTimeService.getLeagueTable(url);
      
      // Get team name for highlighting
      const teamName = domCache.get('Team1NameElement')?.textContent || 'Netherton';
      
      content.innerHTML = faFullTimeService.renderLeagueTable(leagueTable, teamName);
      this.currentTable = { url, data: leagueTable };
      
      saveBtn.style.display = 'none'; // Keep save button hidden for now
      document.getElementById('predictLeagueBtn').style.display = 'inline-block';
      notificationManager.success('League table loaded successfully');
      
    } catch (error) {
      content.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Error:</strong> ${error.message}
        </div>
        <div class="text-center text-muted py-3">
          <i class="fas fa-info-circle me-2"></i>
          Make sure the URL is a valid FA Full-Time league table page
        </div>
      `;
      notificationManager.error('Failed to load league table');
    } finally {
      fetchBtn.innerHTML = '<i class="fas fa-download me-1"></i>Fetch';
      fetchBtn.disabled = false;
    }
  }

  saveLeagueTable() {
    if (!this.currentTable) return;

    try {
      localStorage.setItem('saved-league-table', JSON.stringify(this.currentTable));
      notificationManager.success('League table saved');
    } catch (error) {
      notificationManager.error('Failed to save league table');
    }
  }

  loadSavedTable() {
    try {
      const saved = localStorage.getItem('saved-league-table');
      if (saved) {
        const { url, data } = JSON.parse(saved);
        const urlInput = document.getElementById('faUrlInput');
        const content = document.getElementById('leagueTableContent');
        const saveBtn = document.getElementById('saveLeagueBtn');

        if (urlInput) urlInput.value = url;
        
        const teamName = domCache.get('Team1NameElement')?.textContent || 'Netherton';
        content.innerHTML = faFullTimeService.renderLeagueTable(data, teamName);
        
        this.currentTable = { url, data };
        saveBtn.style.display = 'inline-block';
      }
    } catch (error) {
      console.error('Failed to load saved table:', error);
    }
  }

  show() {
    const modal = CustomModal.getOrCreateInstance('leagueTableModal');
    modal.show();
    
    // Auto-fetch with hardcoded URL
    this.autoFetchLeagueTable();
  }

  async autoFetchLeagueTable() {
    const hardcodedUrl = 'https://fulltime.thefa.com/table.html?league=2373903&selectedSeason=83710004&selectedFixtureGroupAgeGroup=9&previousSelectedFixtureGroupAgeGroup=9&selectedDivision=497213589&selectedCompetition=0&selectedFixtureGroupKey=1_458390244%20#tab-2';
    
    const urlInput = document.getElementById('faUrlInput');
    const content = document.getElementById('leagueTableContent');
    const saveBtn = document.getElementById('saveLeagueBtn');

    if (urlInput) urlInput.value = hardcodedUrl;
    
    content.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="text-muted">Loading league table...</p>
      </div>
    `;
    
    try {
      const leagueTable = await faFullTimeService.getLeagueTable(hardcodedUrl);
      const teamName = domCache.get('Team1NameElement')?.textContent || 'Netherton';
      
      content.innerHTML = faFullTimeService.renderLeagueTable(leagueTable, teamName);
      this.currentTable = { url: hardcodedUrl, data: leagueTable };
      
      saveBtn.style.display = 'none'; // Keep save button hidden for now
      document.getElementById('predictLeagueBtn').style.display = 'inline-block';
      notificationManager.success('League table loaded');
      
    } catch (error) {
      content.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Error:</strong> ${error.message}
        </div>
      `;
      notificationManager.error('Failed to load league table');
    }
  }

  hide() {
    const modal = CustomModal.getInstance('leagueTableModal');
    if (modal) {
      modal.hide();
    }
  }
}

export const leagueTableModal = new LeagueTableModal();
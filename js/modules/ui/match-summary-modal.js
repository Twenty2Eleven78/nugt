
import { CustomModal } from '../shared/custom-modal.js';

// Match Summary Modal UI Component
class MatchSummaryModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the match summary modal
   */
  init() {
    if (this.isInitialized) return;
    
    this._createModal();
    this._bindEventListeners();
    this.isInitialized = true;
  }

  /**
   * Show the match summary modal
   * @param {Object} matchData The data for the match to display
   */
  show(matchData) {
    if (!this.modal) return;

    this._populateModal(matchData);

    // Show modal using custom modal system
    this.modal.show();
  }

  /**
   * Hide the match summary modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Populate the modal with match data
   * @private
   */
  _populateModal(matchData) {
    // Check if this is an admin view
    const isAdminView = matchData._adminInfo?.isAdminView || false;

    // Update title with admin badge if needed
    const titleElement = document.getElementById('summaryModalTitle');
    const titleText = matchData.title || 'Match Summary';
    const adminBadge = isAdminView ? '<span class="badge bg-warning ms-2 text-dark">Admin View</span>' : '';
    titleElement.innerHTML = `${this._escapeHtml(titleText)}${adminBadge}`;

    // Populate score
    document.getElementById('summaryScore').innerHTML = `
      <span class="team-name">${this._escapeHtml(matchData.team1Name || 'Team 1')}</span>
      <span class="score">${matchData.score1 || 0} - ${matchData.score2 || 0}</span>
      <span class="team-name">${this._escapeHtml(matchData.team2Name || 'Team 2')}</span>
    `;

    // Populate game time
    document.getElementById('summaryGameTime').textContent = this._formatTime(matchData.gameTime);

    // Populate notes with admin info if available
    let notesText = matchData.notes || 'No notes for this match.';
    if (isAdminView && matchData._adminInfo) {
      notesText += `\n\nAdmin Information:\nUser: ${matchData._adminInfo.userEmail || 'Unknown'}\nSaved: ${matchData._adminInfo.savedAt}`;
    }
    document.getElementById('summaryNotes').textContent = notesText;

    // Populate timeline
    const timelineElement = document.getElementById('summaryTimeline');
    timelineElement.innerHTML = '';

    const allEvents = [
      ...(matchData.matchEvents || []),
      ...(matchData.goals || []).map(g => ({ ...g, type: 'Goal' }))
    ].sort((a, b) => a.rawTime - b.rawTime);

    if (allEvents.length > 0) {
      allEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'timeline-item';
        let body = `${event.type}${event.notes ? ` - ${event.notes}` : ''}`;
        if (event.type === 'Goal') {
          body = `Goal for ${event.teamName}: ${event.goalScorerName} (${event.timestamp})${event.goalAssistName ? `, assisted by ${event.goalAssistName}` : ''}`;
        }
        eventElement.innerHTML = `
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <p class="timeline-time">${this._escapeHtml(event.timestamp || 'Unknown time')}</p>
            <p class="timeline-body">${this._escapeHtml(body)}</p>
          </div>
        `;
        timelineElement.appendChild(eventElement);
      });
    } else {
      timelineElement.innerHTML = '<p>No events recorded for this match.</p>';
    }

    // Populate goals
    const goalsElement = document.getElementById('summaryGoals');
    goalsElement.innerHTML = '';

    if (matchData.goals && matchData.goals.length > 0) {
      const team1Goals = matchData.goals.filter(goal => goal.team === 1);
      const team2Goals = matchData.goals.filter(goal => goal.team === 2);

      const goalsByTeam = matchData.goals.reduce((acc, goal) => {
        const teamName = goal.team === 1 ? matchData.team1Name : matchData.team2Name;
        if (!acc[teamName]) {
          acc[teamName] = {};
        }
        acc[teamName][goal.goalScorerName] = (acc[teamName][goal.goalScorerName] || 0) + 1;
        return acc;
      }, {});

      Object.entries(goalsByTeam).forEach(([teamName, scorers]) => {
        const teamTitle = document.createElement('h6');
        teamTitle.className = 'team-goal-header';
        teamTitle.textContent = teamName;
        goalsElement.appendChild(teamTitle);

        Object.entries(scorers).forEach(([scorer, count]) => {
          const goalElement = document.createElement('div');
          goalElement.className = 'goal-item';
          goalElement.innerHTML = `<p>${scorer}: <span class="goal-count">${count}</span></p>`;
          goalsElement.appendChild(goalElement);
        });
      });
    } else {
      goalsElement.innerHTML = '<p>No goals recorded for this match.</p>';
    }

    // Add admin section if this is an admin view
    this._handleAdminSection(matchData, isAdminView);
  }
  /**
   * Handle admin section display
   * @private
   */
  _handleAdminSection(matchData, isAdminView) {
    // Remove existing admin section
    const existingAdminSection = document.getElementById('adminInfoSection');
    if (existingAdminSection) {
      existingAdminSection.remove();
    }

    if (isAdminView && matchData._adminInfo) {
      const modalBody = document.querySelector('#matchSummaryModal .modal-body');
      if (modalBody) {
        const adminSection = document.createElement('div');
        adminSection.id = 'adminInfoSection';
        adminSection.className = 'mt-4 pt-3 border-top';
        adminSection.innerHTML = `
          <h5 class="text-warning mb-3">
            <i class="fas fa-cog"></i> Admin Information
          </h5>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="card bg-light">
                <div class="card-body py-2">
                  <h6 class="card-title small mb-1 text-primary">User Details</h6>
                  <p class="card-text mb-1 small">
                    <strong>Email:</strong> ${this._escapeHtml(matchData._adminInfo.userEmail || 'N/A')}
                  </p>
                  <p class="card-text mb-0 small">
                    <strong>User ID:</strong> <code class="small">${this._escapeHtml(matchData._adminInfo.userId || 'N/A')}</code>
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card bg-light">
                <div class="card-body py-2">
                  <h6 class="card-title small mb-1 text-info">Storage Details</h6>
                  <p class="card-text mb-1 small">
                    <strong>Saved:</strong> ${this._escapeHtml(matchData._adminInfo.savedAt || 'N/A')}
                  </p>
                  <p class="card-text mb-0 small">
                    <strong>Index:</strong> ${matchData._adminInfo.matchIndex !== undefined ? matchData._adminInfo.matchIndex : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <button class="btn btn-outline-secondary btn-sm" id="viewRawDataBtn">
              <i class="fas fa-code"></i> View Raw Data
            </button>
            <button class="btn btn-outline-primary btn-sm ms-2" id="copyMatchInfoBtn">
              <i class="fas fa-copy"></i> Copy Match Info
            </button>
          </div>
        `;
        
        modalBody.appendChild(adminSection);

        // Add event listeners for admin buttons
        const viewRawDataBtn = document.getElementById('viewRawDataBtn');
        if (viewRawDataBtn) {
          viewRawDataBtn.addEventListener('click', () => this._showRawMatchData(matchData));
        }

        const copyMatchInfoBtn = document.getElementById('copyMatchInfoBtn');
        if (copyMatchInfoBtn) {
          copyMatchInfoBtn.addEventListener('click', () => this._copyMatchInfo(matchData));
        }
      }
    }
  }

  /**
   * Show raw match data in a modal
   * @private
   */
  _showRawMatchData(matchData) {
    const rawDataHtml = `
      <div class="modal fade" id="rawDataModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title">
                <i class="fas fa-code"></i> Raw Match Data
              </h5>
              <button type="button" class="btn-close btn-close-white" id="closeRawDataModalBtn" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
              <div class="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                <span class="text-muted">JSON Data Structure</span>
                <button class="btn btn-outline-secondary btn-sm" id="copyRawDataBtn">
                  <i class="fas fa-copy"></i> Copy All JSON
                </button>
              </div>
              <pre class="p-3 mb-0" style="max-height: 70vh; overflow-y: auto; background-color: #f8f9fa;"><code>${this._escapeHtml(JSON.stringify(matchData, null, 2))}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('rawDataModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', rawDataHtml);

    // Initialize and show modal using custom modal system
    const rawModal = CustomModal.getOrCreateInstance('rawDataModal');
    rawModal.show();

    // Add close button functionality
    const closeRawDataModalBtn = document.getElementById('closeRawDataModalBtn');
    if (closeRawDataModalBtn) {
      closeRawDataModalBtn.addEventListener('click', () => {
        rawModal.hide();
        // Clean up modal when hidden
        setTimeout(() => {
          const modalElement = document.getElementById('rawDataModal');
          if (modalElement) {
            modalElement.remove();
          }
        }, 300);
      });
    }

    // Add copy functionality
    const copyRawDataBtn = document.getElementById('copyRawDataBtn');
    if (copyRawDataBtn) {
      copyRawDataBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(matchData, null, 2))
          .then(() => {
            copyRawDataBtn.innerHTML = '<i class="fas fa-check text-success"></i> Copied!';
            setTimeout(() => {
              copyRawDataBtn.innerHTML = '<i class="fas fa-copy"></i> Copy All JSON';
            }, 2000);
          })
          .catch(err => {
            console.error('Could not copy data:', err);
            copyRawDataBtn.innerHTML = '<i class="fas fa-times text-danger"></i> Failed';
            setTimeout(() => {
              copyRawDataBtn.innerHTML = '<i class="fas fa-copy"></i> Copy All JSON';
            }, 2000);
          });
      });
    }
  }

  /**
   * Copy match information to clipboard
   * @private
   */
  _copyMatchInfo(matchData) {
    const adminInfo = matchData._adminInfo || {};
    const matchInfo = [
      `Match: ${matchData.title || 'Untitled'}`,
      `Teams: ${matchData.team1Name || 'Team 1'} vs ${matchData.team2Name || 'Team 2'}`,
      `Score: ${matchData.score1 || 0} - ${matchData.score2 || 0}`,
      `User: ${adminInfo.userEmail || 'N/A'}`,
      `User ID: ${adminInfo.userId || 'N/A'}`,
      `Saved: ${adminInfo.savedAt || 'N/A'}`,
      `Index: ${adminInfo.matchIndex !== undefined ? adminInfo.matchIndex : 'N/A'}`
    ].join('\n');
    
    navigator.clipboard.writeText(matchInfo)
      .then(() => {
        const copyBtn = document.getElementById('copyMatchInfoBtn');
        if (copyBtn) {
          copyBtn.innerHTML = '<i class="fas fa-check text-success"></i> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Match Info';
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Could not copy match info:', err);
      });
  }
  /**
   * Create the match summary modal
   * @private
   */
  _createModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('matchSummaryModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
      <div class="modal fade" id="matchSummaryModal" tabindex="-1" aria-labelledby="matchSummaryModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="summaryModalTitle">Match Summary</h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="text-center mb-4">
                <h2 id="summaryScore" class="summary-score-line"></h2>
                <p>Game Time: <span id="summaryGameTime"></span></p>
              </div>
              <div class="mb-4">
                <h5>Notes</h5>
                <p id="summaryNotes"></p>
              </div>
              <div class="mb-4">
                <h5>Goals</h5>
                <div id="summaryGoals"></div>
              </div>
              <div>
                <h5>Timeline</h5>
                <div id="summaryTimeline" class="timeline"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="closeSummaryModalBtn">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('matchSummaryModal');
  }

  /**
   * Bind event listeners for the modal
   * @private
   */
  _bindEventListeners() {
    // Handle close button click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'closeSummaryModalBtn') {
        this.hide();
      }
    });
  }

  /**
   * Format time for display
   * @private
   */
  _formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return 'N/A';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

/**
   * Escape HTML to prevent XSS
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

}

// Create and export singleton instance
export const matchSummaryModal = new MatchSummaryModal();

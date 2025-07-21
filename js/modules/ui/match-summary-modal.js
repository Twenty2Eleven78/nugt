/**
 * Match Summary Modal UI Component
 */

class MatchSummaryModal {
  constructor() {
    this.modalInitialized = false;
  }

  /**
   * Initialize the match summary modal
   */
  init() {
    if (!this.modalInitialized) {
      this._createModal();
      this.modalInitialized = true;
    }
  }

  /**
   * Show the match summary modal
   * @param {Object} matchData The data for the match to display
   */
  show(matchData) {
    const modal = document.getElementById('matchSummaryModal');
    if (!modal) return;

    this._populateModal(matchData);

    // Show modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
  }

  /**
   * Populate the modal with match data
   * @private
   */
  _populateModal(matchData) {
    document.getElementById('summaryModalTitle').textContent = matchData.title;
    document.getElementById('summaryTeam1Name').textContent = matchData.team1Name;
    document.getElementById('summaryTeam2Name').textContent = matchData.team2Name;
    document.getElementById('summaryScore').textContent = `${matchData.score1} - ${matchData.score2}`;
    document.getElementById('summaryGameTime').textContent = this._formatTime(matchData.gameTime);
    document.getElementById('summaryNotes').textContent = matchData.notes || 'No notes for this match.';

    const timelineElement = document.getElementById('summaryTimeline');
    timelineElement.innerHTML = '';

    if (matchData.matchEvents && matchData.matchEvents.length > 0) {
      matchData.matchEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'timeline-item';
        eventElement.innerHTML = `
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <p class="timeline-time">${this._formatTime(event.time)}</p>
            <p class="timeline-body">${event.type}${event.notes ? ` - ${event.notes}` : ''}</p>
          </div>
        `;
        timelineElement.appendChild(eventElement);
      });
    } else {
      timelineElement.innerHTML = '<p>No events recorded for this match.</p>';
    }

    const goalsElement = document.getElementById('summaryGoals');
    goalsElement.innerHTML = '';

    if (matchData.goals && matchData.goals.length > 0) {
      matchData.goals.forEach(goal => {
        if (goal.scorer) {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-item';
            goalElement.innerHTML = `
                <p><strong>${goal.scorer}</strong> (${this._formatTime(goal.time)})${goal.assist ? `, assisted by ${goal.assist}` : ''}</p>
            `;
            goalsElement.appendChild(goalElement);
        }
      });
    } else {
      goalsElement.innerHTML = '<p>No goals recorded for this match.</p>';
    }
  }

  /**
   * Create the match summary modal
   * @private
   */
  _createModal() {
    // Check if modal already exists
    if (document.getElementById('matchSummaryModal')) {
      return;
    }

    const modalHtml = `
      <div class="modal fade" id="matchSummaryModal" tabindex="-1" aria-labelledby="matchSummaryModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="summaryModalTitle">Match Summary</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="text-center mb-4">
                <h2 id="summaryScore"></h2>
                <h4 id="summaryTeam1Name" class="d-inline"></h4> vs <h4 id="summaryTeam2Name" class="d-inline"></h4>
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
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create modal container and append to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
  }

  _formatTime(seconds) {
    if (seconds === undefined || seconds === null) {
        return 'N/A';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Create and export singleton instance
export const matchSummaryModal = new MatchSummaryModal();

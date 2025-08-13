/**
 * New Match Setup Modal
 * Unified workflow for starting a new match with team names, duration, and attendance
 * @version 1.0
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { GAME_CONFIG } from '../shared/constants.js';
import { notificationManager } from '../services/notifications.js';
import { showModal, hideModal } from './modals.js';
import { rosterManager } from '../match/roster.js';
import { timerController } from '../game/timer.js';
import { teamManager } from '../match/teams.js';
import { attendanceManager } from '../services/attendance.js';
import { combinedEventsManager, updateMatchLog } from '../match/combined-events.js';
import { formatTime } from '../shared/utils.js';

class NewMatchModal {
    constructor() {
        this.isInitialized = false;
        this.selectedPlayers = new Set();
        this.isProcessingClick = false; // Prevent double-clicks
    }

    init() {
        if (this.isInitialized) return;

        this.createModal();
        
        // Bind events after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.bindEvents();
        }, 100);
        
        this.isInitialized = true;
    }

    createModal() {
        const modalHTML = `
      <div class="modal fade" id="newMatchModal" tabindex="-1" aria-labelledby="newMatchModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="newMatchModalLabel">
                <i class="fas fa-plus-circle me-2"></i>Start New Match
              </h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="newMatchForm">
                <!-- Step 1: Match Details -->
                <div class="step-section" id="step1">
                  <h6 class="text-primary mb-3">
                    <i class="fas fa-info-circle me-2"></i>Match Details
                  </h6>
                  
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="newMatchTeam1Name" class="form-label">Home Team</label>
                      <input type="text" class="form-control" id="newMatchTeam1Name" value="Netherton" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="newMatchTeam2Name" class="form-label">Away Team</label>
                      <input type="text" class="form-control" id="newMatchTeam2Name" value="Opposition" required>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="matchDuration" class="form-label">Match Duration</label>
                      <select class="form-select" id="matchDuration">
                        <option value="3600">60 minutes (30 min halves)</option>
                        <option value="4200" selected>70 minutes (35 min halves)</option>
                        <option value="5400">90 minutes (45 min halves)</option>
                        <option value="custom">Custom duration...</option>
                      </select>
                    </div>
                    <div class="col-md-6 mb-3" id="customDurationContainer" style="display: none;">
                      <label for="customDuration" class="form-label">Custom Duration (minutes)</label>
                      <input type="number" class="form-control" id="customDuration" 
                             min="10" max="120" step="5" placeholder="e.g. 80">
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="matchTitle" class="form-label">Match Title (Optional)</label>
                    <input type="text" class="form-control" id="matchTitle" 
                           placeholder="e.g. League Cup Final, Friendly vs...">
                  </div>
                </div>

                <!-- Step 2: Player Attendance -->
                <div class="step-section mt-4" id="step2">
                  <h6 class="text-primary mb-3">
                    <i class="fas fa-users me-2"></i>Player Attendance
                  </h6>
                  
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-muted">Select players attending this match:</span>
                    <div>
                      <button type="button" class="btn btn-sm btn-outline-primary" id="selectAllPlayers">
                        Select All
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-secondary ms-2" id="clearAllPlayers">
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div id="playersGrid" class="row g-2">
                    <!-- Players will be populated here -->
                  </div>

                  <div class="mt-3">
                    <small class="text-muted">
                      <i class="fas fa-info-circle me-1"></i>
                      Selected players: <span id="selectedCount">0</span>
                    </small>
                  </div>
                </div>

                <!-- Match Setup Summary -->
                <div class="step-section mt-4" id="setupSummary">
                  <h6 class="text-success mb-3">
                    <i class="fas fa-check-circle me-2"></i>Match Setup Summary
                  </h6>
                  <div class="card bg-light">
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-6">
                          <strong>Teams:</strong> <span id="summaryTeams">-</span><br>
                          <strong>Duration:</strong> <span id="summaryDuration">-</span>
                        </div>
                        <div class="col-md-6">
                          <strong>Players:</strong> <span id="summaryPlayers">-</span><br>
                          <strong>Title:</strong> <span id="summaryTitle">-</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-success" id="startMatchBtn">
                <i class="fas fa-play me-2"></i>Start Match
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Set default values after modal is created - moved to show() method for better timing
    }

    bindEvents() {
        // Custom duration toggle
        const matchDuration = document.getElementById('matchDuration');
        const customContainer = document.getElementById('customDurationContainer');

        matchDuration?.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customContainer.style.display = 'block';
                customContainer.classList.add('show');
            } else {
                customContainer.classList.remove('show');
                setTimeout(() => {
                    customContainer.style.display = 'none';
                }, 300);
            }
            requestAnimationFrame(() => {
                this.updateSummary();
            });
        });

        // Form events will be bound when modal is shown

        // Player selection buttons
        document.getElementById('selectAllPlayers')?.addEventListener('click', () => {
            this.selectAllPlayers();
        });

        document.getElementById('clearAllPlayers')?.addEventListener('click', () => {
            this.clearAllPlayers();
        });

        // Start match button
        document.getElementById('startMatchBtn')?.addEventListener('click', () => {
            this.startNewMatch();
        });

        // Event delegation for player card clicks
        const playersGrid = document.getElementById('playersGrid');
        if (playersGrid) {
            playersGrid.addEventListener('click', (e) => {
                // Prevent double-processing
                if (this.isProcessingClick) {
                    return;
                }
                
                const playerCard = e.target.closest('.player-card');
                if (playerCard) {
                    this.isProcessingClick = true;
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    const playerId = parseInt(playerCard.dataset.playerId);
                    
                    // Toggle selection
                    if (this.selectedPlayers.has(playerId)) {
                        this.selectedPlayers.delete(playerId);
                        playerCard.classList.remove('selected');
                        playerCard.setAttribute('data-selected', 'false');
                    } else {
                        this.selectedPlayers.add(playerId);
                        playerCard.classList.add('selected');
                        playerCard.setAttribute('data-selected', 'true');
                    }
                    
                    this.updateSelectedCount();
                    this.updateSummary();
                    
                    // Reset processing flag after a short delay
                    setTimeout(() => {
                        this.isProcessingClick = false;
                    }, 100);
                }
            });
        }
    }

    bindFormEvents() {
        // Use event delegation on the modal container
        const modal = document.getElementById('newMatchModal');
        if (modal) {
            // Handle input events for real-time updates
            modal.addEventListener('input', (e) => {
                const targetId = e.target.id;
                if (['newMatchTeam1Name', 'newMatchTeam2Name', 'matchTitle', 'customDuration'].includes(targetId)) {
                    // Use setTimeout to ensure DOM is fully updated
                    setTimeout(() => {
                        this.updateSummary();
                    }, 5);
                }
            });

            // Also handle keyup for immediate feedback
            modal.addEventListener('keyup', (e) => {
                const targetId = e.target.id;
                if (['newMatchTeam1Name', 'newMatchTeam2Name', 'matchTitle', 'customDuration'].includes(targetId)) {
                    setTimeout(() => {
                        this.updateSummary();
                    }, 5);
                }
            });

            // Handle paste events
            modal.addEventListener('paste', (e) => {
                const targetId = e.target.id;
                if (['newMatchTeam1Name', 'newMatchTeam2Name', 'matchTitle', 'customDuration'].includes(targetId)) {
                    // Longer delay for paste to process
                    setTimeout(() => {
                        this.updateSummary();
                    }, 20);
                }
            });
        }
    }

    show() {
        this.init();
        // Clear selections when showing modal fresh
        this.selectedPlayers.clear();
        this.populatePlayersList();
        
        showModal('newMatchModal');
        
        // Ensure proper initialization after modal is shown
        setTimeout(() => {
            this.bindFormEvents();
            this.setDefaultValues();
            // Force update summary after everything is ready
            this.updateSummary();
        }, 300);
    }

    setDefaultValues() {
        const team1Input = document.getElementById('newMatchTeam1Name');
        const team2Input = document.getElementById('newMatchTeam2Name');
        
        if (team1Input) {
            team1Input.value = GAME_CONFIG.DEFAULT_TEAM1_NAME;
        }
        if (team2Input) {
            team2Input.value = GAME_CONFIG.DEFAULT_TEAM2_NAME;
        }
    }

    populatePlayersList() {
        const playersGrid = document.getElementById('playersGrid');
        if (!playersGrid) return;

        const roster = rosterManager.getRoster();

        if (roster.length === 0) {
            playersGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No players in roster. You can add players later from the Options tab.
          </div>
        </div>
      `;
            return;
        }

        playersGrid.innerHTML = roster.map((player, index) => {
            // Use array index as unique ID since players don't have id property
            const playerId = index;
            
            return `
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="player-card" data-player-id="${playerId}">
          <div class="d-flex align-items-center flex-grow-1">
            <span class="badge bg-primary me-2">#${player.shirtNumber || '?'}</span>
            <div class="flex-grow-1">
              <div class="fw-medium">${player.name}</div>
              ${player.position ? `<small class="text-muted">${player.position}</small>` : ''}
            </div>
          </div>
          <div class="selection-indicator">
            <i class="fas fa-check"></i>
          </div>
        </div>
      </div>
    `;
        }).join('');

        // Update the selected count after populating
        this.updateSelectedCount();
    }

    selectAllPlayers() {
        document.querySelectorAll('.player-card').forEach(card => {
            const playerId = parseInt(card.dataset.playerId);
            this.selectedPlayers.add(playerId);
            card.classList.add('selected');
        });
        this.updateSelectedCount();
        this.updateSummary();
    }

    clearAllPlayers() {
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedPlayers.clear();
        this.updateSelectedCount();
        this.updateSummary();
    }

    updateSelectedCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = this.selectedPlayers.size;
        }
        
        // Sync UI with actual selected state
        this.syncUIWithSelectedState();
    }

    syncUIWithSelectedState() {
        document.querySelectorAll('.player-card').forEach(card => {
            const playerId = parseInt(card.dataset.playerId);
            const isSelected = this.selectedPlayers.has(playerId);
            
            if (isSelected) {
                card.classList.add('selected');
                card.setAttribute('data-selected', 'true');
            } else {
                card.classList.remove('selected');
                card.setAttribute('data-selected', 'false');
            }
        });
    }

    updateSummary() {
        try {
            // Get current values with fallbacks
            const team1Input = document.getElementById('newMatchTeam1Name');
            const team2Input = document.getElementById('newMatchTeam2Name');
            const matchTitleInput = document.getElementById('matchTitle');
            const durationSelect = document.getElementById('matchDuration');
            
            // Read values directly from DOM elements
            const team1Value = team1Input?.value || '';
            const team2Value = team2Input?.value || '';
            const team1Name = team1Value.trim() || 'Team 1';
            const team2Name = team2Value.trim() || 'Team 2';
            const matchTitle = (matchTitleInput?.value || '').trim() || 'No title';
            const durationValue = durationSelect?.value || '4200';

            // Calculate duration display
            let duration = '';
            if (durationValue === 'custom') {
                const customDurationInput = document.getElementById('customDuration');
                const customValue = customDurationInput?.value;
                if (customValue && !isNaN(customValue) && customValue > 0) {
                    duration = `${customValue} minutes`;
                } else {
                    duration = 'Custom (not set)';
                }
            } else {
                const seconds = parseInt(durationValue) || 4200;
                const minutes = Math.round(seconds / 60);
                duration = `${minutes} minutes`;
            }

            // Update summary elements safely
            const summaryTeams = document.getElementById('summaryTeams');
            const summaryDuration = document.getElementById('summaryDuration');
            const summaryPlayers = document.getElementById('summaryPlayers');
            const summaryTitleElement = document.getElementById('summaryTitle');

            const teamsText = `${team1Name} vs ${team2Name}`;

            if (summaryTeams) {
                summaryTeams.textContent = teamsText;
            }
            if (summaryDuration) {
                summaryDuration.textContent = duration;
            }
            if (summaryPlayers) {
                summaryPlayers.textContent = `${this.selectedPlayers.size} selected`;
            }
            if (summaryTitleElement) {
                summaryTitleElement.textContent = matchTitle;
            }

        } catch (error) {
            console.warn('Error updating summary:', error);
        }
    }

    async startNewMatch() {
        try {
            // Validate form
            const team1Name = document.getElementById('newMatchTeam1Name')?.value.trim();
            const team2Name = document.getElementById('newMatchTeam2Name')?.value.trim();
            const durationSelect = document.getElementById('matchDuration')?.value;

            if (!team1Name || !team2Name) {
                notificationManager.error('Please enter both team names');
                return;
            }

            // Calculate duration
            let durationSeconds;
            if (durationSelect === 'custom') {
                const customDuration = document.getElementById('customDuration')?.value;
                if (!customDuration || customDuration < 10) {
                    notificationManager.error('Please enter a valid custom duration (minimum 10 minutes)');
                    return;
                }
                durationSeconds = parseInt(customDuration) * 60;
            } else {
                durationSeconds = parseInt(durationSelect);
            }

            // Reset current game state
            await this.resetGameState();

            // Set team names
            teamManager.updateTeamName('first', team1Name);
            teamManager.updateTeamName('second', team2Name);

            // Set match duration
            stateManager.setGameTime(durationSeconds);

            // Set match title if provided
            const matchTitle = document.getElementById('matchTitle')?.value.trim();
            if (matchTitle) {
                gameState.matchTitle = matchTitle;
            }

            // Set player attendance (silently to avoid notification spam)
            if (this.selectedPlayers.size > 0) {
                const roster = rosterManager.getRoster();
                
                // First, mark all players as absent (silently)
                attendanceManager.markAllAbsent(true);
                
                // Then mark selected players as attending (silently)
                Array.from(this.selectedPlayers).forEach(index => {
                    const player = roster[index];
                    if (player && player.name && typeof player.name === 'string') {
                        attendanceManager.setPlayerAttendance(player.name, true, true);
                    }
                });
            } else {
                // If no players selected, mark all as attending (silently)
                attendanceManager.markAllAttending(true);
            }

            // Update UI
            this.updateTeamNamesInUI(team1Name, team2Name);
            timerController.updateDisplay();

            // Save state
            storageHelpers.saveCompleteMatchData(gameState, Array.from(this.selectedPlayers));

            // Close modal and show success
            hideModal('newMatchModal');
            notificationManager.success(`New match setup complete: ${team1Name} vs ${team2Name}`);

            // Navigate to game tab
            this.navigateToGameTab();

            // Clear selections for next time
            this.selectedPlayers.clear();

        } catch (error) {
            console.error('Error starting new match:', error);
            notificationManager.error('Failed to start new match. Please try again.');
        }
    }

    async resetGameState() {
        // Stop timer if running and clean up interval
        if (gameState.isRunning) {
            timerController.toggleTimer();
        }
        
        // Clean up timer interval to prevent memory leaks
        timerController.cleanup();

        // Reset all game state (timer, match data, teams)
        stateManager.resetAll();

        // Clear all stored game data from localStorage
        // This ensures no previous match data persists
        storage.clear();

        // Reset UI elements to initial state
        this.resetUIElements();

        // Clear any pending notifications or temporary state
        this.clearTemporaryState();
    }

    resetUIElements() {
        // Reset timer display
        timerController.updateDisplay();
        
        // Reset scoreboard displays
        const firstScoreElement = domCache.get('firstScoreElement');
        const secondScoreElement = domCache.get('secondScoreElement');
        
        if (firstScoreElement) firstScoreElement.textContent = '0';
        if (secondScoreElement) secondScoreElement.textContent = '0';
        
        // Reset team name displays to defaults
        const team1Element = domCache.get('Team1NameElement');
        const team2Element = domCache.get('Team2NameElement');
        
        if (team1Element) team1Element.textContent = 'Team 1';
        if (team2Element) team2Element.textContent = 'Team 2';

        // Reset teams via team manager
        teamManager.resetTeams();

        // Reset start/pause button UI
        const startPauseButton = domCache.get('startPauseButton');
        if (startPauseButton) {
            startPauseButton.className = 'btn btn-danger timer-btn-inline';
            startPauseButton.innerHTML = `Start Game <span id="stopwatch" role="timer" class="timer-badge">${formatTime(0)}</span>`;
        }

        // Clear any event displays or match logs
        this.clearEventDisplays();

        // Update match log display
        updateMatchLog();

        // Update event displays to reflect the clean state
        if (combinedEventsManager.updateMatchLog) {
            combinedEventsManager.updateMatchLog();
        }
        if (combinedEventsManager.updateEventStatistics) {
            combinedEventsManager.updateEventStatistics();
        }
    }

    clearEventDisplays() {
        // Clear match log display
        const logElement = domCache.get('log');
        if (logElement) {
            logElement.innerHTML = '';
        }

        // Clear any event statistics or counters
        const eventStatsElements = document.querySelectorAll('[data-event-stat]');
        eventStatsElements.forEach(element => {
            element.textContent = '0';
        });

        // Clear any goal displays or score counters
        const scoreElements = document.querySelectorAll('[data-score], [data-goals]');
        scoreElements.forEach(element => {
            element.textContent = '0';
        });
    }

    clearTemporaryState() {
        // Clear any editing states
        stateManager.clearEditingEvent();
        
        // Clear pending goal timestamps
        stateManager.setPendingGoalTimestamp(null);
        
        // Clear any temporary selections or UI state
        this.selectedPlayers.clear();
    }

    updateTeamNamesInUI(team1Name, team2Name) {
        // Update team name elements
        const team1Element = domCache.get('Team1NameElement');
        const team2Element = domCache.get('Team2NameElement');

        if (team1Element) team1Element.textContent = team1Name;
        if (team2Element) team2Element.textContent = team2Name;

        // Reset scores
        const firstScoreElement = domCache.get('firstScoreElement');
        const secondScoreElement = domCache.get('secondScoreElement');

        if (firstScoreElement) firstScoreElement.textContent = '0';
        if (secondScoreElement) secondScoreElement.textContent = '0';
    }

    navigateToGameTab() {
        // Find the game tab link and trigger click to navigate
        const gameTabLink = document.querySelector('a[href="#gametab"]');
        if (gameTabLink) {
            gameTabLink.click();
        } else {
            // Fallback: manually activate the game tab
            this.activateGameTabManually();
        }
    }

    activateGameTabManually() {
        // Remove active class from all nav links and tab panes
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });

        // Activate game tab link
        const gameTabLink = document.querySelector('a[href="#gametab"]');
        if (gameTabLink) {
            gameTabLink.classList.add('active');
        }

        // Activate game tab pane
        const gameTabPane = document.getElementById('gametab');
        if (gameTabPane) {
            gameTabPane.classList.add('show', 'active');
        }
    }
}

// Create and export singleton instance
export const newMatchModal = new NewMatchModal();

// Export convenience method
export function showNewMatchModal() {
    newMatchModal.show();
}
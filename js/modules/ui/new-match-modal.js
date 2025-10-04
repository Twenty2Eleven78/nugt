/**
 * New Match Setup Modal
 * Unified workflow for starting a new match with team names, duration, and attendance
 * @version 1.0
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { GAME_CONFIG, STORAGE_KEYS } from '../shared/constants.js';
import { notificationManager } from '../services/notifications.js';
import { showModal, hideModal } from './modals.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';
import { rosterManager } from '../match/roster.js';
import { timerController } from '../match/timer.js';
import { teamManager } from '../match/teams.js';
import { attendanceManager } from '../services/attendance.js';
import { combinedEventsManager, updateMatchLog } from '../match/combined-events.js';
import { formatTime, debounce } from '../shared/utils.js';

class NewMatchModal {
    constructor() {
        this.isInitialized = false;
        this.playerStates = new Map(); // Map of playerId -> state ('attending', 'starting', 'substitute', 'absent')
        this.isProcessingClick = false; // Prevent double-clicks
        this.cachedElements = {}; // Cache frequently accessed DOM elements
        this.debouncedUpdateSummary = debounce(() => this.updateSummary(), 150); // Debounced updates
    }

    init() {
        if (this.isInitialized) return;

        this.createModal();
        this.bindEvents();
        
        this.isInitialized = true;
    }

    createModal() {
        const bodyContent = `
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

            <!-- Step 2: Player Selection & Lineup -->
            <div class="step-section mt-4" id="step2">
              <h6 class="text-primary mb-3">
                <i class="fas fa-users me-2"></i>Player Selection & Lineup
              </h6>
              
              <div class="attendance-header mb-3">
                <div class="attendance-info">
                  <span class="text-muted">Select players and set starting lineup:</span>
                  <small class="text-muted d-block mt-1">
                    <i class="fas fa-info-circle me-1"></i>
                    Attending: <span id="selectedCount">0</span> | 
                    Starting XI: <span id="startingCount">0</span> | 
                    Substitutes: <span id="subsCount">0</span>
                  </small>
                </div>
                <div class="attendance-controls">
                  <button type="button" class="btn btn-sm btn-outline-success" id="selectAllPlayers">
                    <i class="fas fa-check-double me-1"></i>All Attending
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger" id="clearAllPlayers">
                    <i class="fas fa-times me-1"></i>Clear All
                  </button>
                </div>
              </div>

              <div id="playersGrid" class="row g-2">
                <!-- Players will be populated here -->
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
        `;

        const footerContent = `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" id="startMatchBtn">
            <i class="fas fa-play me-2"></i>Start Match
          </button>
        `;

        createAndAppendModal(
          'newMatchModal',
          '<i class="fas fa-plus-circle me-2"></i>Start New Match',
          bodyContent,
          {
            ...MODAL_CONFIGS.LARGE,
            footerContent: footerContent
          }
        );
        
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
                if (e.target.closest('.starter-btn')) {
                    e.stopPropagation();
                    const btn = e.target.closest('.starter-btn');
                    const playerId = parseInt(btn.dataset.playerId);
                    const currentState = this.playerStates.get(playerId) || 'absent';
                    
                    if (currentState === 'attending') {
                        const currentStarters = this.getStarterCount();
                        if (currentStarters >= 11) {
                            this.showModalNotification('Maximum 11 starters allowed', 'warning');
                            return;
                        }
                        this.playerStates.set(playerId, 'starting');
                        btn.classList.remove('btn-outline-success');
                        btn.classList.add('btn-success');
                    } else if (currentState === 'starting') {
                        this.playerStates.set(playerId, 'attending');
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-outline-success');
                    }
                    
                    this.updateCounts();
                    this.updateSummary();
                    return;
                }
                
                const playerCard = e.target.closest('.player-card');
                if (playerCard) {
                    const playerId = parseInt(playerCard.dataset.playerId);
                    const currentState = this.playerStates.get(playerId) || 'absent';
                    const starterBtn = document.querySelector(`[data-player-id="${playerId}"].starter-btn`);
                    
                    if (currentState === 'absent' || currentState === 'attending') {
                        // Toggle attendance
                        const newState = currentState === 'absent' ? 'attending' : 'absent';
                        this.playerStates.set(playerId, newState);
                        
                        if (newState === 'attending') {
                            playerCard.classList.add('selected');
                            starterBtn.disabled = false;
                        } else {
                            playerCard.classList.remove('selected');
                            starterBtn.disabled = true;
                            starterBtn.classList.remove('btn-success');
                            starterBtn.classList.add('btn-outline-success');
                        }
                    } else if (currentState === 'starting') {
                        // If currently starting, set to absent
                        this.playerStates.set(playerId, 'absent');
                        playerCard.classList.remove('selected');
                        starterBtn.disabled = true;
                        starterBtn.classList.remove('btn-success');
                        starterBtn.classList.add('btn-outline-success');
                    }
                    
                    this.updateCounts();
                    this.updateSummary();
                }
            });
        }
    }

    bindPlayerEvents() {
        // Event delegation for player card clicks - called after modal is shown
        const playersGrid = document.getElementById('playersGrid');
        if (playersGrid) {
            // Remove any existing listeners to prevent duplicates
            const newGrid = playersGrid.cloneNode(true);
            playersGrid.parentNode.replaceChild(newGrid, playersGrid);
            
            newGrid.addEventListener('click', (e) => {
                if (e.target.closest('.starter-btn')) {
                    e.stopPropagation();
                    const btn = e.target.closest('.starter-btn');
                    const playerId = parseInt(btn.dataset.playerId);
                    const currentState = this.playerStates.get(playerId) || 'absent';
                    
                    console.log('Starter button clicked:', playerId, currentState); // Debug log
                    
                    if (currentState === 'attending') {
                        const currentStarters = this.getStarterCount();
                        if (currentStarters >= 11) {
                            this.showModalNotification('Maximum 11 starters allowed', 'warning');
                            return;
                        }
                        this.playerStates.set(playerId, 'starting');
                        btn.classList.remove('btn-outline-success');
                        btn.classList.add('btn-success');
                    } else if (currentState === 'starting') {
                        this.playerStates.set(playerId, 'attending');
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-outline-success');
                    }
                    
                    this.updateCounts();
                    this.updateSummary();
                    return;
                }
                
                const playerCard = e.target.closest('.player-card');
                if (playerCard) {
                    const playerId = parseInt(playerCard.dataset.playerId);
                    const currentState = this.playerStates.get(playerId) || 'absent';
                    const starterBtn = document.querySelector(`[data-player-id="${playerId}"].starter-btn`);
                    
                    console.log('Player card clicked:', playerId, currentState); // Debug log
                    
                    if (currentState === 'absent' || currentState === 'attending') {
                        // Toggle attendance
                        const newState = currentState === 'absent' ? 'attending' : 'absent';
                        this.playerStates.set(playerId, newState);
                        
                        if (newState === 'attending') {
                            playerCard.classList.add('selected');
                            starterBtn.disabled = false;
                        } else {
                            playerCard.classList.remove('selected');
                            starterBtn.disabled = true;
                            starterBtn.classList.remove('btn-success');
                            starterBtn.classList.add('btn-outline-success');
                        }
                    } else if (currentState === 'starting') {
                        // If currently starting, set to absent
                        this.playerStates.set(playerId, 'absent');
                        playerCard.classList.remove('selected');
                        starterBtn.disabled = true;
                        starterBtn.classList.remove('btn-success');
                        starterBtn.classList.add('btn-outline-success');
                    }
                    
                    this.updateCounts();
                    this.updateSummary();
                }
            });
        } else {
            console.error('playersGrid not found when binding events'); // Debug log
        }
    }

    bindFormEvents() {
        // Use event delegation on the modal container
        const modal = document.getElementById('newMatchModal');
        if (modal) {
            // Handle input events with debounced updates for better performance
            const updateFields = ['newMatchTeam1Name', 'newMatchTeam2Name', 'matchTitle', 'customDuration'];
            
            modal.addEventListener('input', (e) => {
                if (updateFields.includes(e.target.id)) {
                    this.debouncedUpdateSummary();
                }
            });

            modal.addEventListener('keyup', (e) => {
                if (updateFields.includes(e.target.id)) {
                    this.debouncedUpdateSummary();
                }
            });

            modal.addEventListener('paste', (e) => {
                if (updateFields.includes(e.target.id)) {
                    // Immediate update for paste, then debounced
                    setTimeout(() => this.debouncedUpdateSummary(), 20);
                }
            });
        }
    }

    show() {
        this.init();
        this.populatePlayersList();
        
        showModal('newMatchModal');
        
        // Ensure proper initialization after modal is shown
        setTimeout(() => {
            this.bindFormEvents();
            this.setDefaultValues();
            // Re-bind events after modal is fully shown and players are populated
            this.bindPlayerEvents();
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
      <div class="col-12">
        <div class="d-flex align-items-center gap-2 mb-2">
          <div class="player-card flex-grow-1" data-player-id="${playerId}" style="min-height: 45px; padding: 0.5rem;">
            <div class="d-flex align-items-center">
              <span class="badge bg-primary me-2" style="font-size: 0.7rem;">#${player.shirtNumber || '?'}</span>
              <div class="flex-grow-1">
                <div class="fw-medium" style="font-size: 0.9rem;">${player.name}</div>
                ${player.position ? `<small class="text-muted" style="font-size: 0.75rem;">${player.position}</small>` : ''}
              </div>
              <div class="selection-indicator">
                <i class="fas fa-check"></i>
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-success starter-btn" data-player-id="${playerId}" style="min-width: 60px;" disabled>
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>
    `;
        }).join('');

        // Update the counts after populating
        this.updateCounts();
    }

    getStarterCount() {
        return Array.from(this.playerStates.values()).filter(state => state === 'starting').length;
    }

    showModalNotification(message, type = 'info') {
        // Create notification with higher z-index than modal
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    selectAllPlayers() {
        document.querySelectorAll('.player-card').forEach(card => {
            const playerId = parseInt(card.dataset.playerId);
            this.playerStates.set(playerId, 'attending');
            card.classList.add('selected');
            document.querySelector(`[data-player-id="${playerId}"].starter-btn`).disabled = false;
        });
        this.updateCounts();
        this.updateSummary();
    }

    clearAllPlayers() {
        document.querySelectorAll('.player-card').forEach(card => {
            const playerId = parseInt(card.dataset.playerId);
            this.playerStates.set(playerId, 'absent');
            card.classList.remove('selected');
            const starterBtn = document.querySelector(`[data-player-id="${playerId}"].starter-btn`);
            starterBtn.disabled = true;
            starterBtn.classList.remove('btn-success');
            starterBtn.classList.add('btn-outline-success');
        });
        this.updateCounts();
        this.updateSummary();
    }

    updateCounts() {
        const attending = Array.from(this.playerStates.values()).filter(state => state !== 'absent').length;
        const starting = Array.from(this.playerStates.values()).filter(state => state === 'starting').length;
        const substitutes = Array.from(this.playerStates.values()).filter(state => state === 'attending').length;
        
        const selectedCountElement = document.getElementById('selectedCount');
        const startingCountElement = document.getElementById('startingCount');
        const subsCountElement = document.getElementById('subsCount');
        
        if (selectedCountElement) selectedCountElement.textContent = attending;
        if (startingCountElement) startingCountElement.textContent = starting;
        if (subsCountElement) subsCountElement.textContent = substitutes;
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
                const attending = Array.from(this.playerStates.values()).filter(state => state !== 'absent').length;
                const starting = Array.from(this.playerStates.values()).filter(state => state === 'starting').length;
                summaryPlayers.textContent = `${attending} attending (${starting} starters)`;
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

            // Get match title before reset
            const matchTitle = document.getElementById('matchTitle')?.value.trim();

            // Capture player states BEFORE reset clears them
            const playerStatesCopy = new Map(this.playerStates);

            // Reset current game state
            await this.resetGameState();

            // Set team names
            teamManager.updateTeamName('first', team1Name);
            teamManager.updateTeamName('second', team2Name);

            // Set match duration
            stateManager.setGameTime(durationSeconds);

            // Set match title if provided (after reset)
            if (matchTitle) {
                gameState.matchTitle = matchTitle;
            }
            
            // Set player attendance and lineup after reset
            setTimeout(() => {
                const roster = rosterManager.getRoster();
                
                const attendanceData = roster.map((player, index) => {
                    const state = playerStatesCopy.get(index) || 'absent';
                    const isAttending = state !== 'absent';
                    const isStarter = state === 'starting';
                    const isSubstitute = state === 'attending'; // attending but not starting = substitute
                    
                    return {
                        playerName: player.name,
                        attending: isAttending,
                        lineupRole: isStarter ? 'starter' : isSubstitute ? 'substitute' : null
                    };
                });
                
                // Save attendance with lineup data
                storage.saveImmediate(STORAGE_KEYS.MATCH_ATTENDANCE, attendanceData);
                
                // Save lineup data separately for match reports and cloud sync
                const lineupData = {
                    startingXI: roster.filter((player, index) => playerStatesCopy.get(index) === 'starting').map(p => p.name),
                    substitutes: roster.filter((player, index) => playerStatesCopy.get(index) === 'attending').map(p => p.name),
                    createdAt: Date.now()
                };
                storage.saveImmediate('MATCH_LINEUP', lineupData);
                
                // Add lineup to game state for cloud saving
                gameState.matchLineup = lineupData;
                
                attendanceManager.updateAttendanceList();
            }, 200);

            // Update UI
            this.updateTeamNamesInUI(team1Name, team2Name);
            timerController.updateDisplay();

            // Save state immediately
            storageHelpers.saveGameState(gameState);

            // Close modal and show success
            hideModal('newMatchModal');
            notificationManager.success(`New match setup complete: ${team1Name} vs ${team2Name}`);

            // Navigate to game tab
            this.navigateToGameTab();

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
            startPauseButton.className = 'btn timer-btn-compact touch-target btn-danger';
            startPauseButton.style.touchAction = 'manipulation';
            startPauseButton.innerHTML = `<i class="fa-regular fa-clock me-2"></i><span class="timer-text">Start Game</span><span id="stopwatch" role="timer" class="timer-display" style="min-width: 4ch;">${formatTime(0)}</span>`;
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
        
        // Clear lineup data
        storage.remove('MATCH_LINEUP');
        if (gameState.matchLineup) {
            delete gameState.matchLineup;
        }
        
        // Clear any temporary selections or UI state
        this.playerStates.clear();
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
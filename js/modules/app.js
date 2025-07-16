/**
 * Main Application Module - Initialization and Coordination
 * @version 3.4
 */

// Import restructured modules
import { gameState, stateManager } from './data/state.js';
import { storage, storageHelpers } from './data/storage.js';
import { domCache } from './shared/dom.js';
import { formatTime } from './shared/utils.js';
import { STORAGE_KEYS, EVENT_TYPES } from './shared/constants.js';

// Game modules
import { timerController } from './game/timer.js';

// Match modules
import { goalManager, toggleGoalDisallowed } from './match/goals.js';
import { eventsManager, updateMatchLog, deleteLogEntry } from './match/events.js';
import { teamManager } from './match/teams.js';
import { rosterManager } from './match/roster.js';

// UI modules
import { bindModalEvents, hideModal } from './ui/modals.js';
import { initializeTooltips } from './ui/components.js';

// Services
import { notificationManager } from './services/notifications.js';
import { sharingService } from './services/sharing.js';
import { pwaUpdater } from './services/pwa-updater.js';

// Initialize application
export function initializeApp() {
  console.log('Initializing NUFC GameTime App v3.5 - Modular Architecture');

  // Check storage health
  if (!storage.checkStorageHealth()) {
    notificationManager.warning('Storage may not be working properly. Some features may be limited.');
  }

  // Load saved state
  loadAppState();

  // Initialize components
  teamManager.initializeTeams();
  rosterManager.init();

  // Initialize UI components
  bindEventListeners();
  bindModalEvents();
  initializeTooltips();

  // Resume timer if needed
  timerController.resumeFromState();

  // Initialize PWA updater
  pwaUpdater.init().then(success => {
    if (success) {
      console.log('PWA updater initialized successfully');
    }
  });

  // Update displays
  timerController.updateDisplay();
  updateMatchLog();

  console.log('App initialization complete');
}

// Load application state from storage
function loadAppState() {
  const savedState = storageHelpers.loadGameState();

  // Update game state
  stateManager.setTimerState(savedState.seconds, savedState.isRunning, savedState.startTimestamp);
  stateManager.setGameTime(savedState.gameTime);
  stateManager.setHalfState(savedState.isSecondHalf);

  // Load match data
  gameState.goals = savedState.goals;
  gameState.matchEvents = savedState.matchEvents;
  gameState.team1History = savedState.team1History;
  gameState.team2History = savedState.team2History;

  // Load and display scores
  const firstScore = storage.load(STORAGE_KEYS.FIRST_SCORE, 0);
  const secondScore = storage.load(STORAGE_KEYS.SECOND_SCORE, 0);

  const firstScoreElement = domCache.get('firstScoreElement');
  const secondScoreElement = domCache.get('secondScoreElement');

  if (firstScoreElement) firstScoreElement.textContent = firstScore;
  if (secondScoreElement) secondScoreElement.textContent = secondScore;

  // Set game time select
  const gameTimeSelect = domCache.get('gameTimeSelect');
  if (gameTimeSelect) {
    gameTimeSelect.value = gameState.gameTime;
  }
}

// Bind all event listeners
function bindEventListeners() {
  // Timer controls
  const startPauseButton = domCache.get('startPauseButton');
  if (startPauseButton) {
    startPauseButton.addEventListener('click', () => timerController.toggleTimer());
  }

  const gameTimeSelect = domCache.get('gameTimeSelect');
  if (gameTimeSelect) {
    gameTimeSelect.addEventListener('change', (e) => timerController.handleGameTimeChange(e.target.value));
  }

  // Goal controls
  const goalButton = domCache.get('goalButton');
  if (goalButton) {
    goalButton.addEventListener('click', () => goalManager.showGoalModal());
  }

  const opgoalButton = domCache.get('opgoalButton');
  if (opgoalButton) {
    opgoalButton.addEventListener('click', () => goalManager.addOppositionGoal());
  }

  const goalForm = domCache.get('goalForm');
  if (goalForm) {
    goalForm.addEventListener('submit', (e) => goalManager.addGoal(e));
  }

  // Team management
  const updTeam1Btn = domCache.get('updTeam1Btn');
  if (updTeam1Btn) {
    updTeam1Btn.addEventListener('click', () => {
      const teamInput = domCache.get('team1Input');
      const teamName = teamInput?.value.trim();
      if (teamName) {
        teamManager.updateTeamName('first', teamName);
        teamInput.value = '';
      }
    });
  }

  const updTeam2Btn = domCache.get('updTeam2Btn');
  if (updTeam2Btn) {
    updTeam2Btn.addEventListener('click', () => {
      const teamInput = domCache.get('team2Input');
      const teamName = teamInput?.value.trim();
      if (teamName) {
        teamManager.updateTeamName('second', teamName);
        teamInput.value = '';
      }
    });
  }

  // Match events
  const recordEventButton = document.getElementById('recordEventButton');
  if (recordEventButton) {
    recordEventButton.addEventListener('click', () => eventsManager.showRecordEventModal());
  }

  const halfTimeButton = document.getElementById('HalfTimeButton');
  if (halfTimeButton) {
    halfTimeButton.addEventListener('click', () => eventsManager.addMatchEvent(EVENT_TYPES.HALF_TIME));
  }

  const fullTimeButton = document.getElementById('FullTimeButton');
  if (fullTimeButton) {
    fullTimeButton.addEventListener('click', () => eventsManager.addMatchEvent(EVENT_TYPES.FULL_TIME));
  }

  // Record event form
  const recordEventForm = document.getElementById('recordEventForm');
  if (recordEventForm) {
    recordEventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const eventType = document.getElementById('eventTypeSelect')?.value;
      const notes = document.getElementById('eventNotes')?.value;

      if (eventType) {
        eventsManager.addMatchEvent(eventType, notes);
        recordEventForm.reset();

        hideModal('recordEventModal');
      }
    });
  }

  // Edit event form
  const editEventForm = document.getElementById('editEventForm');
  if (editEventForm) {
    editEventForm.addEventListener('submit', (e) => eventsManager.handleEditEventFormSubmission(e));
  }

  // Share button
  const shareButton = domCache.get('shareButton');
  if (shareButton) {
    shareButton.addEventListener('click', () => sharingService.shareViaWhatsApp());
  }

  // Reset button
  const resetButton = domCache.get('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', resetTracker);
  }
}

// Reset the entire application
function resetTracker() {
  // Clean up timer
  timerController.cleanup();

  // Reset all state
  stateManager.resetAll();

  // Reset UI elements
  timerController.updateDisplay();
  updateMatchLog();

  // Reset button UI
  const startPauseButton = domCache.get('startPauseButton');
  if (startPauseButton) {
    startPauseButton.className = 'btn btn-danger timer-btn-inline';
    startPauseButton.innerHTML = `Start Game <span id="stopwatch" role="timer" class="timer-badge">${formatTime(0)}</span>`;
  }

  // Reset scoreboard
  const firstScoreElement = domCache.get('firstScoreElement');
  const secondScoreElement = domCache.get('secondScoreElement');

  if (firstScoreElement) firstScoreElement.textContent = '0';
  if (secondScoreElement) secondScoreElement.textContent = '0';

  // Reset teams
  teamManager.resetTeams();

  // Clear storage
  storage.clear();

  // Show confirmation and redirect
  notificationManager.success('Game reset successfully');
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Load release notes
function loadReleaseNotes() {
  const readmeContainer = document.getElementById('readme');
  if (readmeContainer) {
    fetch('README.md')
      .then(response => response.text())
      .then(text => {
        readmeContainer.innerHTML = text.replace(/\n/g, '<br>');
      })
      .catch(error => {
        console.error('Error loading release notes:', error);
        readmeContainer.innerHTML = '<p>Error loading release notes.</p>';
      });
  }
}

// Expose modules to global scope for onclick handlers
window.AppModule = {
  initializeApp
};

window.GoalsModule = {
  toggleGoalDisallowed: toggleGoalDisallowed,
  showGoalModal: goalManager.showGoalModal,
  addGoal: goalManager.addGoal,
  addOppositionGoal: goalManager.addOppositionGoal
};

window.EventsModule = {
  deleteLogEntry: deleteLogEntry,
  openEditEventModal: eventsManager.openEditEventModal,
  addMatchEvent: eventsManager.addMatchEvent,
  showRecordEventModal: eventsManager.showRecordEventModal
};

window.TeamsModule = {
  updateTeamName: teamManager.updateTeamName
};

window.RosterModule = {
  init: rosterManager.init,
  getRoster: rosterManager.getRoster,
  getPlayerByName: rosterManager.getPlayerByName,
  addPlayer: rosterManager.addPlayer,
  removePlayer: rosterManager.removePlayer,
  editPlayer: rosterManager.editPlayer,
  clearRoster: rosterManager.clearRoster,
  updateSelects: rosterManager.updateSelects,
  updateRosterList: rosterManager.updateRosterList
};

window.StatisticsModule = {
  shareViaWhatsApp: sharingService.shareViaWhatsApp
};

// Global functions for backward compatibility
window.showGoalModal = goalManager.showGoalModal;
window.addGoal = goalManager.addGoal;
window.opaddGoal = goalManager.addOppositionGoal;
window.toggleGoalDisallowed = toggleGoalDisallowed;
window.deleteLogEntry = deleteLogEntry;
window.openEditEventModal = eventsManager.openEditEventModal;
window.addMatchEvent = eventsManager.addMatchEvent;
window.showRecordEventModal = eventsManager.showRecordEventModal;
window.updatefixtureTeams = teamManager.updateTeamName;
window.handleEditEventFormSubmission = eventsManager.handleEditEventFormSubmission;

// Global RosterManager for backward compatibility
window.RosterManager = rosterManager;
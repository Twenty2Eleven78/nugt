/**
 * Main Application Module - Initialization and Coordination
 * @version 3.5
 */

// Import restructured modules
import { gameState, stateManager } from './data/state.js';
import { storage, storageHelpers } from './data/storage.js';
import { domCache } from './shared/dom.js';
import { formatTime } from './shared/utils.js';
import { STORAGE_KEYS, EVENT_TYPES } from './shared/constants.js';
import themeManager from './shared/theme-manager.js';
import { CustomModal } from './shared/custom-modal.js';

// Import high priority optimizations
import { ModuleErrorBoundary } from './shared/error-boundary.js';
import { storageQuotaManager } from './shared/storage-manager.js';

// Game modules
import { timerController } from './game/timer.js';

// Match modules
import { goalManager, toggleGoalDisallowed } from './match/goals.js';
import { eventsManager, updateMatchLog, deleteLogEntry } from './match/events.js';
import { teamManager } from './match/teams.js';
import { rosterManager } from './match/roster.js';

// UI modules
import { bindModalEvents } from './ui/modals.js';
import { initializeTooltips } from './ui/components.js';
import { enhancedEventsManager } from './ui/enhanced-events.js';
import { releaseNotesManager } from './ui/release-notes.js';
import { authUI } from './ui/auth-ui.js';
import { matchSaveModal } from './ui/match-save-modal.js';
import { matchLoadModal } from './ui/match-load-modal.js';
import { matchSummaryModal } from './ui/match-summary-modal.js';
import { rawDataModal } from './ui/raw-data-modal.js';
import teamModals from './ui/team-modals.js';
import goalModal from './ui/goal-modal.js';
import eventModals from './ui/event-modals.js';
import resetModal from './ui/reset-modal.js';
import rosterModal from './ui/roster-modal.js';
import attendanceModal from './ui/attendance-modal.js';
import sharingModal from './ui/sharing-modal.js';

// Services
import { notificationManager } from './services/notifications.js';
// Sharing service is used by sharing modal
import { pwaUpdater } from './services/pwa-updater.js';
import { attendanceManager } from './services/attendance.js';
import { authService } from './services/auth.js';
import { userMatchesApi } from './services/user-matches-api.js';

// Initialize custom modal system
function initializeCustomModals() {
  // Set up modal triggers
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-toggle="modal"]');
    if (trigger) {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-target');
      if (targetId) {
        // Special handling for dynamically created modals
        if (targetId === '#resetConfirmModal') {
          resetModal.show(() => {
            resetTracker();
          });
        } else if (targetId === '#fixtureModalTeam1') {
          teamModals.showTeam1Modal();
        } else if (targetId === '#fixtureModalTeam2') {
          teamModals.showTeam2Modal();
        } else if (targetId === '#recordEventModal') {
          eventModals.showRecordEventModal();
        } else if (targetId === '#goalModal') {
          goalModal.show();
        } else if (targetId === '#releasenotesmodal') {
          releaseNotesManager.show();
        } else if (targetId === '#rosterModal') {
          rosterModal.show();
        } else if (targetId === '#attendanceModal') {
          attendanceModal.show();
        } else if (targetId === '#sharingModal') {
          sharingModal.show();
        } else {
          // Remove the # prefix from targetId for CustomModal
          const modalId = targetId.startsWith('#') ? targetId.substring(1) : targetId;
          const modal = CustomModal.getOrCreateInstance(modalId);
          modal.show();
        }
      }
    }
  });

  // Initialize all existing modals
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modalElement => {
    CustomModal.getOrCreateInstance(modalElement);
  });

  console.log('Custom modal system initialized');
}

// Initialize high priority optimizations
function initializeOptimizations() {
  // Initialize storage quota manager
  storageQuotaManager.init();

  // Wrap critical functions with error boundaries
  wrapCriticalFunctions();

  // Add touch target classes to interactive elements
  enhanceTouchTargets();

  console.log('High priority optimizations initialized');
}

// Wrap critical functions with error boundaries
function wrapCriticalFunctions() {
  // Wrap timer functions
  const originalToggleTimer = timerController.toggleTimer;
  timerController.toggleTimer = ModuleErrorBoundary.wrap(
    originalToggleTimer.bind(timerController),
    () => console.warn('Timer toggle failed, please try again'),
    'TimerController'
  );

  // Wrap goal manager functions
  const originalShowGoalModal = goalManager.showGoalModal;
  goalManager.showGoalModal = ModuleErrorBoundary.wrap(
    originalShowGoalModal.bind(goalManager),
    () => notificationManager.error('Could not open goal modal'),
    'GoalManager'
  );

  // Wrap events manager functions
  const originalAddMatchEvent = eventsManager.addMatchEvent;
  eventsManager.addMatchEvent = ModuleErrorBoundary.wrap(
    originalAddMatchEvent.bind(eventsManager),
    () => notificationManager.error('Could not add match event'),
    'EventsManager'
  );
}

// Enhance touch targets for better mobile UX
function enhanceTouchTargets() {
  // Add touch-target class to buttons and interactive elements
  const interactiveSelectors = [
    'button',
    '.btn',
    '.nav-link',
    '.team-name-btn',
    '.toggle-attendance-btn',
    '.btn-close'
  ];

  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (!element.classList.contains('touch-target')) {
        element.classList.add('touch-target');
      }
    });
  });

  // Add touch-action: manipulation to prevent double-tap zoom
  const touchElements = document.querySelectorAll('button, .btn, input, select, textarea');
  touchElements.forEach(element => {
    element.style.touchAction = 'manipulation';
  });
}

// Initialize application
export function initializeApp() {
  console.log('Initializing NUFC GameTime App v3.7 - Enhanced with Custom Framework');

  // Initialize custom modal system
  initializeCustomModals();

  // Initialize high priority optimizations
  initializeOptimizations();

  // Check storage health
  if (!storage.checkStorageHealth()) {
    notificationManager.warning('Storage may not be working properly. Some features may be limited.');
  }

  // Initialize authentication
  authUI.init().then(isAuthenticated => {
    if (isAuthenticated) {
      console.log('User authenticated successfully');
      // Track app usage
      authService.trackUsage('app_start');
    } else {
      console.log('User not authenticated');
    }
  });

  // Load saved state
  loadAppState();

  // Initialize components
  teamManager.initializeTeams();
  rosterManager.init();
  attendanceManager.init();

  // Initialize UI components
  bindEventListeners();
  bindModalEvents();
  initializeTooltips();
  enhancedEventsManager.init();
  releaseNotesManager.init();
  matchSaveModal.init();
  matchLoadModal.init();
  matchSummaryModal.init();
  rawDataModal.init();

  // Initialize modal modules
  teamModals.init();
  goalModal.init();
  eventModals.init();
  resetModal.init();
  rosterModal.init();
  attendanceModal.init();
  sharingModal.init();

  // Initialize theme manager
  themeManager.init();

  // Initialize timer with enhanced state recovery
  timerController.initialize();

  // Make timer controller available globally for beforeunload handler
  window.timerControllerInstance = timerController;

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
  // Set up cloud save/load button handlers
  const saveBtn = document.getElementById('saveMatchDataBtn');
  const loadBtn = document.getElementById('loadMatchDataBtn');

  // Save match data to Netlify Blobs - function for both buttons
  const handleSaveMatch = async () => {
    if (!authService.isUserAuthenticated()) {
      notificationManager.warning('Please sign in to save match data to the cloud');
      return;
    }

    // Show save match modal
    const team1Name = domCache.get('Team1NameElement')?.textContent || 'Team 1';
    const team2Name = domCache.get('Team2NameElement')?.textContent || 'Team 2';
    const score1 = domCache.get('firstScoreElement')?.textContent || '0';
    const score2 = domCache.get('secondScoreElement')?.textContent || '0';
    const currentDate = new Date().toLocaleDateString('en-GB');
    const defaultTitle = `${team1Name}(${score1}):${team2Name}(${score2}) - ${currentDate}`;

    matchSaveModal.show({
      defaultTitle,
      defaultNotes: ''
    }, async ({ title, notes }) => {
      try {
        // Gather match data
        const matchData = {
          title,
          notes,
          goals: gameState.goals,
          matchEvents: gameState.matchEvents,
          team1History: gameState.team1History,
          team2History: gameState.team2History,
          gameTime: gameState.gameTime,
          team1Name,
          team2Name,
          score1,
          score2,
          attendance: attendanceManager.getMatchAttendance(),
          savedAt: Date.now()
        };

        await userMatchesApi.saveMatchData(matchData);
        notificationManager.success('Match saved to cloud!');
      } catch (e) {
        console.error('Error saving match data:', e);
        notificationManager.error('Failed to save match data.');
      }
    });
  };

  // Bind save button
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveMatch);
  }

  // Load match data from Netlify Blobs
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      if (!authService.isUserAuthenticated()) {
        notificationManager.warning('Please sign in to load match data from the cloud');
        return;
      }

      try {
        const matches = await userMatchesApi.loadMatchData();
        matchLoadModal.show(matches);
      } catch (error) {
        console.error('Error loading match data:', error);
        notificationManager.error(error.message || 'Failed to load match data.');
      }
    });
  }
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



  // Team management - using event delegation for dynamically created buttons
  document.addEventListener('click', (e) => {
    if (e.target.id === 'updTeam1Btn') {
      const teamInput = document.getElementById('team1Name');
      const teamName = teamInput?.value.trim();
      if (teamName) {
        teamManager.updateTeamName('first', teamName);
        teamInput.value = '';
        // Close the modal
        const modal = CustomModal.getInstance(document.getElementById('fixtureModalTeam1'));
        if (modal) {
          modal.hide();
        }
      }
    }

    if (e.target.id === 'updTeam2Btn') {
      const teamInput = document.getElementById('team2Name');
      const teamName = teamInput?.value.trim();
      if (teamName) {
        teamManager.updateTeamName('second', teamName);
        teamInput.value = '';
        // Close the modal
        const modal = CustomModal.getInstance(document.getElementById('fixtureModalTeam2'));
        if (modal) {
          modal.hide();
        }
      }
    }
  });

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

  // Record event form - using event delegation for dynamically created form
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'recordEventForm') {
      e.preventDefault();
      const eventType = document.getElementById('eventTypeSelect')?.value;
      const notes = document.getElementById('eventNotes')?.value;

      if (eventType) {
        eventsManager.addMatchEvent(eventType, notes);
        e.target.reset();
        eventModals.hideRecordEventModal();
      }
    }
  });

  // Edit event form
  const editEventForm = document.getElementById('editEventForm');
  if (editEventForm) {
    editEventForm.addEventListener('submit', (e) => eventsManager.handleEditEventFormSubmission(e));
  }

  // Share button - open sharing modal
  const shareButton = domCache.get('shareButton');
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      sharingModal.show();
    });
  }

  // Reset button is now handled by the reset modal system
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

  // Track game reset if authenticated
  if (authService.isUserAuthenticated()) {
    authService.trackUsage('game_reset');
  }

  // Clear storage (except auth data)
  storage.clear();

  // Show confirmation and redirect
  notificationManager.success('Game reset successfully');
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
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

// Statistics module removed

window.AuthModule = {
  showAuthModal: () => authUI.showAuthModal(),
  isAuthenticated: () => authService.isUserAuthenticated(),
  getCurrentUser: () => authService.getCurrentUser(),
  logout: () => authService.logout()
};



// Global functions for backward compatibility (only keep essential ones)
window.showGoalModal = goalManager.showGoalModal;
window.deleteLogEntry = deleteLogEntry;
window.openEditEventModal = eventsManager.openEditEventModal;
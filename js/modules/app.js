/**
 * Main Application Module - Initialization and Coordination
 * @version 4.0
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
import { timerController } from './match/timer.js';

// Match modules
import { goalManager, toggleGoalDisallowed } from './match/goals.js';
import { combinedEventsManager as eventsManager, updateMatchLog, deleteLogEntry } from './match/combined-events.js';
import { teamManager } from './match/teams.js';
import { rosterManager } from './match/roster.js';

// UI modules
import { bindModalEvents } from './ui/modals.js';
import { initializeTooltips } from './ui/components.js';
import { releaseNotesManager } from './ui/release-notes.js';
import { authUI } from './ui/auth-ui.js';
import { matchSaveModal } from './ui/match-save-modal.js';
import { matchLoadModal } from './ui/match-load-modal.js';
import { matchSummaryModal } from './ui/match-summary-modal.js';
import { rawDataModal } from './ui/raw-data-modal.js';
import { newMatchModal } from './ui/new-match-modal.js';

import { statisticsTab } from './ui/statistics-tab.js';
import { touchGestures } from './ui/touch-gestures.js';
import { leagueTableModal } from './ui/league-table-modal.js';
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

  // Custom modal system initialized
}

// Initialize high priority optimizations
function initializeOptimizations() {
  // Initialize storage quota manager
  storageQuotaManager.init();

  // Wrap critical functions with error boundaries
  wrapCriticalFunctions();

  // Add touch target classes to interactive elements
  enhanceTouchTargets();

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
export async function initializeApp() {
  try {
    // Load configuration first
    console.log('Loading application configuration...');
    const { config } = await import('./shared/config.js');

    try {
      await config.load();
      console.log('Configuration loaded successfully into app');
    } catch (error) {
      console.warn('⚠ Configuration loading failed, using defaults:', error.message);
    }

    // Validate configuration
    const validation = config.validate();
    if (!validation.isValid) {
      console.warn('Configuration validation warnings:', validation.errors);
    }

    // Initialize manifest and page metadata
    const { initManifest } = await import('./services/manifest-generator.js');
    initManifest();

    // Initialize team branding
    const { initTeamBranding } = await import('./ui/team-branding.js');
    initTeamBranding();

    // Update game state with config values now that config is loaded
    const { gameState } = await import('./data/state.js');
    if (gameState.gameTime === 4200) { // Only update if still using default
      gameState.gameTime = config.get('match.defaultGameTime', 4200);
    }

    console.log(`Initializing ${config.get('app.name', 'NUFC GameTime')} v${config.get('app.version', '4.0')}`);

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

    // Ensure attendance is properly initialized after roster is loaded
    setTimeout(() => {
      if (attendanceManager.getMatchAttendance) {
        attendanceManager.getMatchAttendance(); // This will initialize default attendance if needed
      }
    }, 200);

    // Initialize UI components
    bindEventListeners();
    bindModalEvents();
    initializeTooltips();
    eventsManager.init(); // Combined events manager handles both basic and enhanced functionality
    releaseNotesManager.init();
    matchSaveModal.init();
    matchLoadModal.init();
    matchSummaryModal.init();
    rawDataModal.init();

    statisticsTab.init();
    touchGestures.init();
    leagueTableModal.init();

    // Initialize modal modules
    teamModals.init();
    goalModal.init();
    eventModals.init();
    resetModal.init();
    rosterModal.init();
    attendanceModal.init();
    sharingModal.init();

    // Make modals available globally after initialization
    window.goalModal = goalModal;

    // Initialize theme manager first
    await themeManager.init();

    // Initialize timer with enhanced state recovery
    timerController.initialize();

    // Make timer controller available globally for beforeunload handler
    window.timerControllerInstance = timerController;

    // Make goal manager available globally
    window.goalManager = goalManager;

    // Initialize PWA updater
    pwaUpdater.init().then(success => {
      if (success) {
        // PWA updater initialized successfully
      }
    });

    // Update displays
    timerController.updateDisplay();
    updateMatchLog();

    console.log('App initialization complete');

  } catch (error) {
    console.error('Failed to initialize application:', error);

    // Show error notification if notification service is available
    if (notificationManager) {
      notificationManager.error('Failed to initialize application');
    }
  }
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
    const defaultTitle = `${team1Name}:${team2Name} - ${currentDate}`;

    matchSaveModal.show({
      defaultTitle,
      defaultNotes: ''
    }, async ({ title, notes }) => {
      try {
        // Gather match data with saved attendance and lineup
        const savedAttendance = storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, []);
        const savedLineup = storage.load(STORAGE_KEYS.MATCH_LINEUP, null);

        // Debug: Log what we found in storage
        console.log('🔍 DEBUG: Storage data check:', {
          attendanceCount: savedAttendance.length,
          hasStoredLineup: !!savedLineup,
          hasGameStateLineup: !!gameState.matchLineup,
          storedLineupData: savedLineup,
          gameStateLineupData: gameState.matchLineup
        });

        // Generate lineup from attendance data if no saved lineup exists
        let matchLineup = savedLineup || gameState.matchLineup;
        if (!matchLineup && savedAttendance.length > 0) {
          const startingXI = savedAttendance
            .filter(player => player.attending && player.lineupRole === 'starter')
            .map(player => player.playerName);
          const substitutes = savedAttendance
            .filter(player => player.attending && player.lineupRole === 'substitute')
            .map(player => player.playerName);

          if (startingXI.length > 0 || substitutes.length > 0) {
            matchLineup = {
              startingXI,
              substitutes,
              createdAt: Date.now()
            };
          }
        }

        const matchData = {
          title,
          notes,
          matchTitle: gameState.matchTitle || null, // Include the match title as separate field
          goals: gameState.goals,
          matchEvents: gameState.matchEvents,
          team1History: gameState.team1History,
          team2History: gameState.team2History,
          gameTime: gameState.gameTime,
          team1Name,
          team2Name,
          score1,
          score2,
          attendance: savedAttendance,
          matchLineup: matchLineup,
          savedAt: Date.now()
        };

        // Debug: Log what we're sending to the API
        console.log('🔍 DEBUG: Match data being sent to API:', {
          hasMatchLineup: !!matchData.matchLineup,
          matchLineupKeys: matchData.matchLineup ? Object.keys(matchData.matchLineup) : null,
          startingXICount: matchData.matchLineup?.startingXI?.length || 0,
          substitutesCount: matchData.matchLineup?.substitutes?.length || 0,
          allKeys: Object.keys(matchData),
          fullMatchLineup: matchData.matchLineup
        });

        // Final verification before API call
        if (!matchData.matchLineup) {
          console.warn('⚠️ WARNING: No matchLineup data found! This should not happen.');
          console.warn('Attempting to create lineup from attendance data...');

          if (savedAttendance.length > 0) {
            const emergencyStartingXI = savedAttendance
              .filter(player => player.attending)
              .slice(0, 11)
              .map(player => player.playerName);
            const emergencySubstitutes = savedAttendance
              .filter(player => player.attending)
              .slice(11)
              .map(player => player.playerName);

            if (emergencyStartingXI.length > 0) {
              matchData.matchLineup = {
                startingXI: emergencyStartingXI,
                substitutes: emergencySubstitutes,
                createdAt: Date.now(),
                source: 'emergency_generation'
              };
              console.log('✅ Emergency lineup created:', matchData.matchLineup);
            }
          }
        }

        await userMatchesApi.saveMatchData(matchData);

        // Clear all caches to ensure fresh data
        userMatchesApi.clearCache();

        // Refresh any open admin dashboard
        setTimeout(() => {
          // Check if admin modal is open and refresh it
          const adminModalElement = document.getElementById('admin-modal');
          if (adminModalElement) {
            const adminModalInstance = CustomModal.getInstance(adminModalElement);
            if (adminModalInstance && adminModalInstance.isVisible) {
              // Dynamically import and refresh admin modal if it's open
              import('./ui/admin-modal.js').then(({ adminModal }) => {
                if (adminModal && typeof adminModal.refreshData === 'function') {
                  adminModal.refreshData();
                }
              });
            }
          }
        }, 500);

        notificationManager.success('Match saved to cloud!');
      } catch (e) {
        console.error('Error saving match data:', e);
        notificationManager.error('Failed to save match data.');
      }
    });
  };

  // Bind new match button
  const newMatchBtn = document.getElementById('newMatchBtn');
  if (newMatchBtn) {
    newMatchBtn.addEventListener('click', () => {
      newMatchModal.show();
    });
  }

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
        // Clear cache to ensure fresh data
        userMatchesApi.clearCache();
        const matches = await userMatchesApi.loadMatchData();
        matchLoadModal.show(matches);
      } catch (error) {
        console.error('Error loading match data:', error);
        notificationManager.error(error.message || 'Failed to load match data.');
      }
    });
  }

  // Auth button in options card
  const showAuthButtonCard = document.getElementById('showAuthButtonCard');
  if (showAuthButtonCard) {
    showAuthButtonCard.addEventListener('click', () => {
      authUI.showAuthModal();
    });
  }

  // Save button in options card
  const saveMatchDataBtnCard = document.getElementById('saveMatchDataBtnCard');
  if (saveMatchDataBtnCard) {
    saveMatchDataBtnCard.addEventListener('click', handleSaveMatch);
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

  // Edit event form - now handled in event-modals.js

  // Share button - open sharing modal
  const shareButton = domCache.get('shareButton');
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      sharingModal.show();
    });
  }

  // League table button
  const leagueTableBtn = document.getElementById('leagueTableBtn');
  if (leagueTableBtn) {
    leagueTableBtn.addEventListener('click', () => {
      leagueTableModal.show();
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

  // Explicitly clear match lineup data
  storage.remove(STORAGE_KEYS.MATCH_LINEUP);

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

// Debug utilities (for development/troubleshooting)
window.DebugModule = {
  // Modal debugging
  fixModalOverlays: () => authUI.fixModalOverlays(),
  cleanupModals: () => {
    import('./ui/modals.js').then(({ cleanupModalOverlays }) => {
      cleanupModalOverlays();
    });
  },

  // Auth debugging  
  showAuthModal: () => authUI.showAuthModal(),
  hideAuthModal: () => authUI.hideModal(),

  // Profile debugging
  checkProfileElements: () => {
    const container = document.getElementById('header-profile-container');
    const button = document.getElementById('userProfileButton');
    const dropdown = document.getElementById('userProfileDropdown');

    console.log('Profile debugging:', {
      container: container ? 'EXISTS' : 'MISSING',
      button: button ? 'EXISTS' : 'MISSING',
      dropdown: dropdown ? 'EXISTS' : 'MISSING',
      containerHTML: container ? container.innerHTML : 'N/A'
    });

    return { container, button, dropdown };
  },

  // Force create profile
  forceCreateProfile: () => {
    authUI._updateAuthState(false);
  },

  // Admin debugging (restricted)
  showAdminModal: () => {
    if (authService.isUserAuthenticated() && authService.isAdmin()) {
      import('./ui/admin-modal.js').then(({ adminModal }) => {
        adminModal.show();
      });
    } else {
      console.warn('Access denied: Admin privileges required');
    }
  },

  // State debugging
  getGameState: () => gameState,
  resetApp: () => resetTracker()
};



// Global functions for backward compatibility (only keep essential ones)
window.showGoalModal = goalManager.showGoalModal;
window.deleteLogEntry = deleteLogEntry;
window.openEditEventModal = eventsManager.openEditEventModal;
window.showNewMatchModal = () => newMatchModal.show();
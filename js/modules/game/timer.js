/**
 * Game Timer Management
 * @version 3.3
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { formatTime, getCurrentSeconds } from '../shared/utils.js';
import { GAME_CONFIG } from '../shared/constants.js';
import { notificationManager } from '../services/notifications.js';

// Timer controller class
class TimerController {
  constructor() {
    this.updateInterval = null;
  }

  // Start or pause the timer
  toggleTimer() {
    if (!gameState.isRunning) {
      this._startTimer();
    } else {
      this._pauseTimer();
    }
  }

  // Start the timer
  _startTimer() {
    // Calculate the correct start timestamp based on current elapsed time
    const startTimestamp = Date.now() - (gameState.seconds * 1000);
    stateManager.setTimerState(gameState.seconds, true, startTimestamp);

    this.updateInterval = setInterval(() => {
      this.updateDisplay();
      // Save state every 5 seconds while running to prevent data loss
      const currentTime = getCurrentSeconds();
      if (currentTime % 5 === 0) {
        storageHelpers.saveGameStateImmediate(gameState);
      }
    }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);

    const buttonText = gameState.seconds > 0 ? 'Game Resumed' : 'Game Started';
    this._updateButtonUI('Game in Progress', 'btn-success', formatTime(gameState.seconds));
    notificationManager.success(buttonText + '!');

    // Save immediately when starting/resuming
    storageHelpers.saveGameStateImmediate(gameState);
    console.log('Timer started/resumed - Current time:', formatTime(gameState.seconds), 'Start timestamp:', startTimestamp);
  }

  // Pause the timer
  _pauseTimer() {
    const currentSeconds = getCurrentSeconds();
    stateManager.setTimerState(currentSeconds, false, null);

    this._stopTimer();
    this._updateButtonUI('Resume Game', 'btn-danger', formatTime(currentSeconds));
    notificationManager.error('Game Paused');

    // Save paused state immediately
    storageHelpers.saveGameStateImmediate(gameState);
    console.log('Timer paused at:', formatTime(currentSeconds));
  }

  // Update timer display
  updateDisplay() {
    const currentSeconds = getCurrentSeconds();
    const timeDisplay = domCache.get('startPauseButton')?.querySelector('#stopwatch');

    if (timeDisplay) {
      timeDisplay.textContent = formatTime(currentSeconds);
    }

    stateManager.setTimerState(currentSeconds, gameState.isRunning, gameState.startTimestamp);
    storage.save('nugt_elapsedTime', currentSeconds);
  }

  // Handle game time changes
  handleGameTimeChange(newGameTime) {
    stateManager.setGameTime(parseInt(newGameTime));
    storageHelpers.saveGameState(gameState);

    // If game hasn't started, update display
    if (!gameState.isRunning && gameState.seconds === 0) {
      this.updateDisplay();
    }
  }

  // Helper method to stop timer interval
  _stopTimer() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Handle half time
  handleHalfTime() {
    const halfTimeSeconds = gameState.gameTime / 2;

    this._stopTimer();
    stateManager.setTimerState(halfTimeSeconds, false, null);
    stateManager.setHalfState(true);

    this._updateButtonUI('Half Time Break', 'btn-danger', formatTime(halfTimeSeconds));
    this.updateDisplay();
    notificationManager.info('Half Time - Game Paused');

    storageHelpers.saveGameState(gameState);
  }

  // Handle full time
  handleFullTime() {
    this._stopTimer();
    stateManager.setTimerState(gameState.seconds, false, null);

    this._updateButtonUI('Full Time', 'btn-danger', formatTime(gameState.seconds));
    this.updateDisplay();
    notificationManager.info('Full Time - Game Finished');

    storageHelpers.saveGameState(gameState);
  }

  // Update start/pause button UI
  _updateButtonUI(text, newStatusClass, time) {
    const button = domCache.get('startPauseButton');
    if (!button) return;

    const oldStatusClass = newStatusClass === 'btn-success' ? 'btn-danger' : 'btn-success';
    button.classList.remove(oldStatusClass);

    if (button.classList.contains(newStatusClass)) {
      button.classList.remove(newStatusClass);
    }
    button.classList.add(newStatusClass);

    // Update the button content while preserving the timer display structure
    const timerText = button.querySelector('.timer-text');
    const timerDisplay = button.querySelector('#stopwatch');

    if (timerText) {
      timerText.textContent = text;
    }

    if (timerDisplay) {
      timerDisplay.textContent = time;
    } else {
      // Fallback to full innerHTML update if elements not found
      button.innerHTML = `<i class="fa-regular fa-clock me-2"></i><span class="timer-text">${text}</span> <span id="stopwatch" role="timer" class="timer-display">${time}</span>`;
    }
  }

  // Resume timer from saved state
  resumeFromState() {
    if (gameState.isRunning && gameState.startTimestamp) {
      // Calculate current time to ensure accuracy after page refresh
      const currentSeconds = getCurrentSeconds();
      stateManager.setTimerState(currentSeconds, gameState.isRunning, gameState.startTimestamp);

      this.updateInterval = setInterval(() => {
        this.updateDisplay();
      }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);

      // Update button UI to reflect running state
      this._updateButtonUI('Game in Progress', 'btn-success', formatTime(currentSeconds));
    }
  }

  // Helper method to update UI for paused state
  _updatePausedUI() {
    this.updateDisplay();
    if (gameState.seconds > 0) {
      this._updateButtonUI('Resume Game', 'btn-danger', formatTime(gameState.seconds));
    } else {
      this._updateButtonUI('Start Game', 'btn-danger', formatTime(0));
    }
  }

  // Helper method to resume running timer
  _resumeRunningTimer(currentSeconds, restartInterval = false) {
    stateManager.setTimerState(currentSeconds, gameState.isRunning, gameState.startTimestamp);

    // Handle interval restart
    if (restartInterval || !this.updateInterval) {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      this.updateInterval = setInterval(() => {
        this.updateDisplay();
      }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
    }

    this.updateDisplay();
    this._updateButtonUI('Game in Progress', 'btn-success', formatTime(currentSeconds));
  }

  // Handle page visibility changes
  handlePageVisibilityChange() {
    if (gameState.isRunning && gameState.startTimestamp) {
      const currentSeconds = getCurrentSeconds();
      this._resumeRunningTimer(currentSeconds, false);
    } else {
      this._updatePausedUI();
    }
  }

  // Handle page focus events
  handlePageFocus() {
    if (gameState.isRunning && gameState.startTimestamp) {
      const currentSeconds = getCurrentSeconds();
      this._resumeRunningTimer(currentSeconds, true);
      console.log('Timer resumed after page focus - Current time:', formatTime(currentSeconds));
    } else {
      this._updatePausedUI();
      console.log('Timer focus handled in paused state - Time:', formatTime(gameState.seconds));
    }
  }

  // Save current state (called before page unload)
  saveCurrentState() {
    if (gameState.isRunning && gameState.startTimestamp) {
      const currentSeconds = getCurrentSeconds();
      stateManager.setTimerState(currentSeconds, gameState.isRunning, gameState.startTimestamp);
      // Use immediate save to ensure it completes before page unload
      storageHelpers.saveGameStateImmediate(gameState);
      console.log('Timer state saved immediately before page unload - Time:', formatTime(currentSeconds));
    } else if (gameState.seconds > 0) {
      // Save paused state immediately too
      storageHelpers.saveGameStateImmediate(gameState);
      console.log('Paused timer state saved before page unload - Time:', formatTime(gameState.seconds));
    }
  }

  // Enhanced initialization method
  initialize() {
    // Load saved state and resume if needed
    const savedState = storageHelpers.loadGameState();

    console.log('Timer initialization - Saved state:', {
      isRunning: savedState.isRunning,
      startTimestamp: savedState.startTimestamp,
      seconds: savedState.seconds
    });

    if (savedState.isRunning && savedState.startTimestamp) {
      // Calculate accurate current time based on saved timestamp
      const now = Date.now();
      const elapsedMs = now - savedState.startTimestamp;
      const currentSeconds = Math.floor(elapsedMs / 1000);

      // Ensure we don't go negative
      const actualSeconds = Math.max(0, currentSeconds);

      // Update state with calculated time
      stateManager.setTimerState(actualSeconds, true, savedState.startTimestamp);

      // Start the timer interval
      this.updateInterval = setInterval(() => {
        this.updateDisplay();
        // Save state every 5 seconds while running to prevent data loss
        const currentTime = getCurrentSeconds();
        if (currentTime % 5 === 0) {
          storageHelpers.saveGameStateImmediate(gameState);
        }
      }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);

      // Update UI
      this._updateButtonUI('Game in Progress', 'btn-success', formatTime(actualSeconds));
      this.updateDisplay();

      console.log('Timer initialized and resumed - Current time:', formatTime(actualSeconds));
      console.log('Timer interval started with ID:', this.updateInterval);
    } else if (savedState.seconds > 0) {
      // Timer is paused but has elapsed time
      stateManager.setTimerState(savedState.seconds, false, null);
      this._updateButtonUI('Resume Game', 'btn-danger', formatTime(savedState.seconds));
      this.updateDisplay();
      console.log('Timer initialized in paused state - Time:', formatTime(savedState.seconds));
    } else {
      // Timer is at zero/initial state
      stateManager.setTimerState(0, false, null);
      this._updateButtonUI('Start Game', 'btn-danger', formatTime(0));
      this.updateDisplay();
      console.log('Timer initialized at zero state');
    }
  }

  // Clean up timer
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Create and export singleton instance
export const timerController = new TimerController();

// Export convenience methods
export const {
  toggleTimer,
  handleGameTimeChange,
  handleHalfTime,
  handleFullTime,
  updateDisplay: updateStopwatchDisplay
} = timerController;
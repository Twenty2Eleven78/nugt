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
    stateManager.setTimerState(gameState.seconds, true, Date.now() - (gameState.seconds * 1000));
    
    this.updateInterval = setInterval(() => {
      this.updateDisplay();
    }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
    
    this._updateButtonUI('Game in Progress', 'btn-success', formatTime(gameState.seconds));
    notificationManager.success('Game Started!');
    
    storageHelpers.saveGameState(gameState);
  }

  // Pause the timer
  _pauseTimer() {
    const currentSeconds = getCurrentSeconds();
    stateManager.setTimerState(currentSeconds, false, null);
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this._updateButtonUI('Game is Paused', 'btn-danger', formatTime(currentSeconds));
    notificationManager.error('Game Paused');
    
    storageHelpers.saveGameState(gameState);
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

  // Handle half time
  handleHalfTime() {
    const halfTimeSeconds = gameState.gameTime / 2;
    
    // Stop timer if running
    if (gameState.isRunning) {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }
    
    stateManager.setTimerState(halfTimeSeconds, false, null);
    stateManager.setHalfState(true);
    
    this._updateButtonUI('Half Time Break', 'btn-danger', formatTime(halfTimeSeconds));
    this.updateDisplay();
    notificationManager.info('Half Time - Game Paused');
    
    storageHelpers.saveGameState(gameState);
  }

  // Handle full time
  handleFullTime() {
    // Stop timer if running
    if (gameState.isRunning) {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }
    
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
    button.innerHTML = `${text} <span id="stopwatch" role="timer" class="timer-badge">${time}</span>`;
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

  // Handle page visibility changes
  handlePageVisibilityChange() {
    if (gameState.isRunning && gameState.startTimestamp) {
      // Recalculate time and resume if timer should be running
      const currentSeconds = getCurrentSeconds();
      stateManager.setTimerState(currentSeconds, gameState.isRunning, gameState.startTimestamp);
      
      // Restart interval if it's not running
      if (!this.updateInterval) {
        this.updateInterval = setInterval(() => {
          this.updateDisplay();
        }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
      }
      
      // Update display immediately
      this.updateDisplay();
      this._updateButtonUI('Game in Progress', 'btn-success', formatTime(currentSeconds));
    } else {
      // Just update display for paused state
      this.updateDisplay();
    }
  }

  // Handle page focus events
  handlePageFocus() {
    // Similar to visibility change but with additional safety checks
    if (gameState.isRunning && gameState.startTimestamp) {
      const currentSeconds = getCurrentSeconds();
      
      // Ensure we have the correct state
      stateManager.setTimerState(currentSeconds, gameState.isRunning, gameState.startTimestamp);
      
      // Clear any existing interval and restart
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      
      this.updateInterval = setInterval(() => {
        this.updateDisplay();
      }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
      
      this.updateDisplay();
      this._updateButtonUI('Game in Progress', 'btn-success', formatTime(currentSeconds));
      
      console.log('Timer resumed after page focus - Current time:', formatTime(currentSeconds));
    }
  }

  // Save current state (called before page unload)
  saveCurrentState() {
    if (gameState.isRunning) {
      const currentSeconds = getCurrentSeconds();
      stateManager.setTimerState(currentSeconds, gameState.isRunning, gameState.startTimestamp);
      storageHelpers.saveGameState(gameState);
      console.log('Timer state saved before page unload - Time:', formatTime(currentSeconds));
    }
  }

  // Enhanced initialization method
  initialize() {
    // Load saved state and resume if needed
    const savedState = storageHelpers.loadGameState();
    
    if (savedState.isRunning && savedState.startTimestamp) {
      // Calculate accurate current time based on saved timestamp
      const now = Date.now();
      const elapsedMs = now - savedState.startTimestamp;
      const currentSeconds = Math.floor(elapsedMs / 1000);
      
      // Update state with calculated time
      stateManager.setTimerState(currentSeconds, true, savedState.startTimestamp);
      
      // Start the timer interval
      this.updateInterval = setInterval(() => {
        this.updateDisplay();
      }, GAME_CONFIG.TIMER_UPDATE_INTERVAL);
      
      // Update UI
      this._updateButtonUI('Game in Progress', 'btn-success', formatTime(currentSeconds));
      this.updateDisplay();
      
      console.log('Timer initialized and resumed - Current time:', formatTime(currentSeconds));
    } else {
      // Timer is paused or stopped
      this.updateDisplay();
      if (savedState.seconds > 0) {
        this._updateButtonUI('Game is Paused', 'btn-danger', formatTime(savedState.seconds));
      }
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
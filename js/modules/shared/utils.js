/**
 * Shared Utility Functions
 * @version 3.3
 */

import { gameState } from '../data/state.js';

// Time formatting utility
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return [minutes, secs]
    .map(num => num.toString().padStart(2, '0'))
    .join(':');
}

// Get current elapsed seconds
export function getCurrentSeconds() {
  if (!gameState.isRunning || !gameState.startTimestamp) {
    return gameState.seconds;
  }
  const currentTime = Date.now();
  const elapsedSeconds = Math.floor((currentTime - gameState.startTimestamp) / 1000);
  return elapsedSeconds;
}

// Format match time with extra time calculation
export function formatMatchTime(seconds) {
  const halfTime = gameState.gameTime / 2;
  const isExtraTime = seconds > halfTime && !gameState.isSecondHalf || seconds > gameState.gameTime;
  
  if (!isExtraTime) {
    return Math.ceil(seconds / 60).toString();
  }
  
  // Calculate extra time
  let baseTime, extraMinutes;
  if (!gameState.isSecondHalf) {
    // First half extra time
    baseTime = halfTime / 60;
    extraMinutes = Math.ceil((seconds - halfTime) / 60);
  } else {
    // Second half extra time
    baseTime = gameState.gameTime / 60;
    extraMinutes = Math.ceil((seconds - gameState.gameTime) / 60);
  }
  
  return `${baseTime}+${extraMinutes}`;
}

// Debounce utility
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// DOM element validation
export function validateElement(element, name) {
  if (!element) {
    console.warn(`Element ${name} not found in DOM`);
    return false;
  }
  return true;
}
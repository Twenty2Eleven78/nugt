/**
 * Shared Utility Functions
 * Essential utility functions used throughout the application
 */

import { gameState } from '../data/state.js';
import { GAME_CONFIG } from './constants.js';

// Cache for expensive operations
const utilsCache = new Map();
const CACHE_EXPIRY = 5000; // 5 seconds

// ===== TIME UTILITIES =====

// Enhanced time formatting with validation and caching
export function formatTime(seconds, options = {}) {
  const {
    showHours = false,
    showMilliseconds = false,
    separator = ':',
    padHours = true
  } = options;

  // Validate input
  if (typeof seconds !== 'number' || seconds < 0) {
    console.warn('Invalid seconds value for formatTime:', seconds);
    return '00:00';
  }

  // Check cache for performance
  const cacheKey = `formatTime_${seconds}_${JSON.stringify(options)}`;
  const cached = getCachedValue(cacheKey);
  if (cached) return cached;

  let totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  let result;
  if (showHours || hours > 0) {
    const hourStr = padHours ? hours.toString().padStart(2, '0') : hours.toString();
    result = `${hourStr}${separator}${minutes.toString().padStart(2, '0')}${separator}${secs.toString().padStart(2, '0')}`;
  } else {
    result = `${minutes.toString().padStart(2, '0')}${separator}${secs.toString().padStart(2, '0')}`;
  }

  if (showMilliseconds) {
    const ms = Math.floor((seconds % 1) * 1000);
    result += `.${ms.toString().padStart(3, '0')}`;
  }

  setCachedValue(cacheKey, result);
  return result;
}

// Enhanced current seconds calculation with error handling
export function getCurrentSeconds() {
  try {
    if (!gameState.isRunning || !gameState.startTimestamp) {
      return gameState.seconds || 0;
    }

    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - gameState.startTimestamp) / 1000);

    // Validate result
    if (elapsedSeconds < 0) {
      console.warn('Negative elapsed time detected, resetting to stored seconds');
      return gameState.seconds || 0;
    }

    return elapsedSeconds;
  } catch (error) {
    console.error('Error in getCurrentSeconds:', error);
    return gameState.seconds || 0;
  }
}

// Enhanced match time formatting with better extra time calculation
export function formatMatchTime(seconds, options = {}) {
  const { showExtraTime = true, useMinutes = true } = options;
  
  try {
    if (typeof seconds !== 'number' || seconds < 0) {
      return '0';
    }

    const halfTime = (gameState.gameTime || GAME_CONFIG.DEFAULT_GAME_TIME) / 2;
    const fullTime = gameState.gameTime || GAME_CONFIG.DEFAULT_GAME_TIME;
    
    let displayTime;
    let extraTime = 0;
    
    if (gameState.isSecondHalf) {
      // Second half
      if (seconds <= fullTime) {
        // Calculate second half time and add to actual half-time duration
        // Round up: if any seconds past the minute, go to next minute
        const secondHalfSeconds = seconds - halfTime;
        const secondHalfMinutes = useMinutes ? 
          Math.floor(secondHalfSeconds / 60) + (secondHalfSeconds % 60 > 0 ? 1 : 0) :
          secondHalfSeconds;
        const actualHalfTimeMinutes = useMinutes ?
          Math.floor(halfTime / 60) + (halfTime % 60 > 0 ? 1 : 0) :
          halfTime;
        displayTime = actualHalfTimeMinutes + Math.max(secondHalfMinutes, 0);

      } else {
        const fullTimeMinutes = useMinutes ? 
          Math.floor(fullTime / 60) + (fullTime % 60 > 0 ? 1 : 0) :
          fullTime;
        displayTime = fullTimeMinutes;
        const extraSeconds = seconds - fullTime;
        extraTime = useMinutes ?
          Math.floor(extraSeconds / 60) + (extraSeconds % 60 > 0 ? 1 : 0) :
          extraSeconds;
      }
    } else {
      // First half
      if (seconds <= halfTime) {
        displayTime = useMinutes ? 
          Math.floor(seconds / 60) + (seconds % 60 > 0 ? 1 : 0) :
          seconds;
      } else {
        const halfTimeMinutes = useMinutes ?
          Math.floor(halfTime / 60) + (halfTime % 60 > 0 ? 1 : 0) :
          halfTime;
        displayTime = halfTimeMinutes;
        const extraSeconds = seconds - halfTime;
        extraTime = useMinutes ?
          Math.floor(extraSeconds / 60) + (extraSeconds % 60 > 0 ? 1 : 0) :
          extraSeconds;
      }
    }
    
    if (showExtraTime && extraTime > 0) {
      return `${displayTime}+${extraTime}`;
    }
    
    return displayTime.toString();
  } catch (error) {
    console.error('Error in formatMatchTime:', error);
    return '0';
  }
}

// ===== FUNCTION UTILITIES =====

// Enhanced debounce with immediate option and cancellation
export function debounce(func, wait, options = {}) {
  const { immediate = false, maxWait = null } = options;
  let timeout;
  let maxTimeout;
  let lastCallTime;
  
  const debounced = function executedFunction(...args) {
    const callNow = immediate && !timeout;
    const later = () => {
      timeout = null;
      maxTimeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    clearTimeout(timeout);
    clearTimeout(maxTimeout);
    
    timeout = setTimeout(later, wait);
    
    // Handle maxWait
    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (timeout) {
          clearTimeout(timeout);
          later();
        }
      }, maxWait);
    }
    
    if (callNow) func.apply(this, args);
    lastCallTime = Date.now();
  };
  
  // Add cancel method
  debounced.cancel = () => {
    clearTimeout(timeout);
    clearTimeout(maxTimeout);
    timeout = null;
    maxTimeout = null;
  };
  
  // Add flush method
  debounced.flush = function(...args) {
    if (timeout) {
      clearTimeout(timeout);
      clearTimeout(maxTimeout);
      func.apply(this, args);
      timeout = null;
      maxTimeout = null;
    }
  };
  
  return debounced;
}

// ===== VALIDATION UTILITIES =====

// Enhanced DOM element validation
export function validateElement(element, name, options = {}) {
  const { required = true, logWarning = true } = options;
  
  if (!element) {
    if (logWarning) {
      console.warn(`Element ${name} not found in DOM`);
    }
    return !required;
  }
  
  // Check if element is connected to DOM
  if (!element.isConnected) {
    if (logWarning) {
      console.warn(`Element ${name} is not connected to DOM`);
    }
    return false;
  }
  
  return true;
}

// ===== BROWSER UTILITIES =====

// Copy text to clipboard (used in sharing functionality)
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// ===== CACHE UTILITIES =====

// Get cached value with expiry check
function getCachedValue(key) {
  const cached = utilsCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
    utilsCache.delete(key);
    return null;
  }
  
  return cached.value;
}

// Set cached value with timestamp
function setCachedValue(key, value) {
  utilsCache.set(key, {
    value,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries periodically
  if (utilsCache.size > 100) {
    const now = Date.now();
    for (const [cacheKey, cacheValue] of utilsCache.entries()) {
      if (now - cacheValue.timestamp > CACHE_EXPIRY) {
        utilsCache.delete(cacheKey);
      }
    }
  }
}

// Clear utils cache
export function clearUtilsCache() {
  utilsCache.clear();
}
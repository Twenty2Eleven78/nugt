/**
 * DOM Element Cache and Utilities
 * Enhanced DOM management with caching, validation, and performance optimization
 */

import { UI_CONFIG } from './constants.js';

const CACHE_REFRESH_INTERVAL = 30000; // 30 seconds
const ELEMENT_CHECK_TIMEOUT = 100; // 100ms for element availability checks
class DOMCache {
  constructor() {
    this._cache = new Map();
    this._elementIds = new Map();
    this._observers = new Map();
    this._lastRefresh = 0;
    this._missingElements = new Set();
    this._initializeElements();
    this._setupAutoRefresh();
  }

  _initializeElements() {
    const elementIds = {
      // Timer elements
      stopwatch: 'stopwatch',
      startPauseButton: 'startPauseButton',
      gameTimeSelect: 'gameTimeSelect',

      // Goal elements
      goalButton: 'goalButton',
      opgoalButton: 'opgoalButton',
      // goalScorer, goalAssist, goalForm are now dynamically created by goal-modal.js

      // Score elements
      firstScoreElement: 'first-score',
      secondScoreElement: 'second-score',

      // Team elements
      Team1NameElement: 'first-team-name',
      Team2NameElement: 'second-team-name',
      // team1Input, team2Input, updTeam1Btn, updTeam2Btn are now dynamically created by team-modals.js

      // Event elements
      log: 'log',
      recordEventButton: 'recordEventButton',
      halfTimeButton: 'HalfTimeButton',
      fullTimeButton: 'FullTimeButton',

      // Modal elements are now dynamically created by their respective modal modules
      // goalModal, recordEventModal, editEventModal, rosterModal, attendanceModal, sharingModal are created by JS modules

      // Form elements

      // Navigation elements
      gameTab: 'gametab',
      eventsTab: 'gamelogtab',
      optionsTab: 'optionstab',

      // Other elements
      // resetButton (confirmResetBtn) is now dynamically created by reset-modal.js
      shareButton: 'shareButton'
      // notificationContainer is now dynamically created by notification service
    };

    // Store element IDs for reference
    this._elementIds = new Map(Object.entries(elementIds));

    // Cache all elements with validation
    this._cacheElements();
  }

  _cacheElements() {
    let foundCount = 0;
    let totalCount = 0;

    for (const [key, id] of this._elementIds.entries()) {
      totalCount++;
      const element = document.getElementById(id);

      if (element) {
        this._cache.set(key, element);
        this._missingElements.delete(key);
        foundCount++;
      } else {
        this._cache.set(key, null);
        this._missingElements.add(key);
        console.warn(`Element with ID '${id}' not found`);
      }
    }

    console.log(`DOM Cache: ${foundCount}/${totalCount} elements found`);
    this._lastRefresh = Date.now();
  }

  get(elementName) {
    const element = this._cache.get(elementName);

    // If element is null and was previously missing, try to find it again
    if (!element && this._missingElements.has(elementName)) {
      return this._retryElement(elementName);
    }

    return element;
  }

  // Get element with validation
  getRequired(elementName) {
    const element = this.get(elementName);
    if (!element) {
      throw new Error(`Required element '${elementName}' not found`);
    }
    return element;
  }

  // Get multiple elements at once
  getMultiple(elementNames) {
    const elements = {};
    for (const name of elementNames) {
      elements[name] = this.get(name);
    }
    return elements;
  }

  // Check if element exists and is visible
  isVisible(elementName) {
    const element = this.get(elementName);
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
  }

  // Wait for element to become available
  async waitForElement(elementName, timeout = ELEMENT_CHECK_TIMEOUT) {
    const element = this.get(elementName);
    if (element) return element;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const el = this._retryElement(elementName);
        if (el) {
          clearInterval(checkInterval);
          resolve(el);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Element '${elementName}' not found within ${timeout}ms`));
        }
      }, 50);
    });
  }

  // Refresh cache for dynamic elements
  refresh(elementName, id) {
    if (id) {
      this._elementIds.set(elementName, id);
    }

    const elementId = this._elementIds.get(elementName);
    if (!elementId) {
      console.warn(`No ID registered for element '${elementName}'`);
      return null;
    }

    const element = document.getElementById(elementId);
    this._cache.set(elementName, element);

    if (element) {
      this._missingElements.delete(elementName);
    } else {
      this._missingElements.add(elementName);
    }

    return element;
  }

  // Refresh all cached elements
  refreshAll() {
    console.log('Refreshing DOM cache...');
    this._cacheElements();
  }

  // Add new element to cache
  add(elementName, id) {
    this._elementIds.set(elementName, id);
    return this.refresh(elementName);
  }

  // Remove element from cache
  remove(elementName) {
    this._cache.delete(elementName);
    this._elementIds.delete(elementName);
    this._missingElements.delete(elementName);
  }

  // Get all cached elements as object
  getAll() {
    const elements = {};
    for (const [key, value] of this._cache.entries()) {
      elements[key] = value;
    }
    return elements;
  }

  // Get cache statistics
  getStats() {
    const total = this._elementIds.size;
    const cached = Array.from(this._cache.values()).filter(el => el !== null).length;
    const missing = this._missingElements.size;

    return {
      total,
      cached,
      missing,
      cacheHitRate: total > 0 ? (cached / total * 100).toFixed(1) + '%' : '0%',
      lastRefresh: new Date(this._lastRefresh).toLocaleTimeString()
    };
  }

  // Clear cache
  clear() {
    this._cache.clear();
    this._missingElements.clear();
    this._observers.forEach(observer => observer.disconnect());
    this._observers.clear();
  }

  // Private helper methods
  _retryElement(elementName) {
    const id = this._elementIds.get(elementName);
    if (!id) return null;

    const element = document.getElementById(id);
    if (element) {
      this._cache.set(elementName, element);
      this._missingElements.delete(elementName);
    }

    return element;
  }

  _setupAutoRefresh() {
    // Auto-refresh cache periodically
    setInterval(() => {
      if (this._missingElements.size > 0) {
        console.log(`Auto-refreshing cache for ${this._missingElements.size} missing elements`);
        this.refreshAll();
      }
    }, CACHE_REFRESH_INTERVAL);
  }

  // Observe element changes
  observe(elementName, callback, options = { childList: true, subtree: true }) {
    const element = this.get(elementName);
    if (!element) {
      console.warn(`Cannot observe element '${elementName}' - not found`);
      return null;
    }

    const observer = new MutationObserver(callback);
    observer.observe(element, options);
    this._observers.set(elementName, observer);

    return observer;
  }

  // Stop observing element
  unobserve(elementName) {
    const observer = this._observers.get(elementName);
    if (observer) {
      observer.disconnect();
      this._observers.delete(elementName);
    }
  }
}

// DOM Utility Functions
export const DOMUtils = {
  // Check if element is in viewport
  isInViewport(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Smooth scroll to element
  scrollToElement(element, options = {}) {
    if (!element) return;

    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
  },

  // Add CSS classes with animation support
  addClass(element, className, duration = UI_CONFIG.ANIMATIONS.NORMAL) {
    if (!element) return;

    element.classList.add(className);

    if (duration > 0) {
      element.style.transition = `all ${duration}ms ease`;
      setTimeout(() => {
        element.style.transition = '';
      }, duration);
    }
  },

  // Remove CSS classes with animation support
  removeClass(element, className, duration = UI_CONFIG.ANIMATIONS.NORMAL) {
    if (!element) return;

    if (duration > 0) {
      element.style.transition = `all ${duration}ms ease`;
      setTimeout(() => {
        element.classList.remove(className);
        element.style.transition = '';
      }, duration);
    } else {
      element.classList.remove(className);
    }
  },

  // Toggle CSS classes
  toggleClass(element, className) {
    if (!element) return false;
    return element.classList.toggle(className);
  },

  // Set element text with HTML encoding
  setTextSafe(element, text) {
    if (!element) return;
    element.textContent = text;
  },

  // Set element HTML with sanitization warning
  setHTMLUnsafe(element, html) {
    if (!element) return;
    console.warn('Setting innerHTML - ensure content is sanitized');
    element.innerHTML = html;
  },

  // Show/hide elements with animation
  show(element, display = 'block', duration = UI_CONFIG.ANIMATIONS.NORMAL) {
    if (!element) return;

    element.style.display = display;
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;

    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });

    setTimeout(() => {
      element.style.transition = '';
    }, duration);
  },

  hide(element, duration = UI_CONFIG.ANIMATIONS.NORMAL) {
    if (!element) return;

    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';

    setTimeout(() => {
      element.style.display = 'none';
      element.style.transition = '';
      element.style.opacity = '';
    }, duration);
  },

  // Create element with attributes
  createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  },

  // Debounced event listener
  addDebouncedListener(element, event, callback, delay = 300) {
    if (!element) return null;

    let timeoutId;
    const debouncedCallback = (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    };

    element.addEventListener(event, debouncedCallback);

    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener(event, debouncedCallback);
    };
  },

  // Get responsive breakpoint
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    const breakpoints = UI_CONFIG.BREAKPOINTS;

    if (width >= breakpoints.XXL) return 'xxl';
    if (width >= breakpoints.XL) return 'xl';
    if (width >= breakpoints.LG) return 'lg';
    if (width >= breakpoints.MD) return 'md';
    if (width >= breakpoints.SM) return 'sm';
    return 'xs';
  }
};

// Create and export singleton instance
export const domCache = new DOMCache();

// Convenience getter for backward compatibility
export const elements = domCache.getAll();

// Export class for advanced usage
export { DOMCache };
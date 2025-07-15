/**
 * DOM Element Cache and Utilities
 * @version 3.3
 */

// Cached DOM elements for performance
class DOMCache {
  constructor() {
    this._cache = new Map();
    this._initializeElements();
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
      goalScorer: 'goalScorer',
      goalAssist: 'goalAssist',
      goalForm: 'goalForm',
      
      // Score elements
      firstScoreElement: 'first-score',
      secondScoreElement: 'second-score',
      
      // Team elements
      Team1NameElement: 'first-team-name',
      Team2NameElement: 'second-team-name',
      team1Input: 'team1Name',
      team2Input: 'team2Name',
      updTeam1Btn: 'updTeam1Btn',
      updTeam2Btn: 'updTeam2Btn',
      
      // Event elements
      log: 'log',
      recordEventButton: 'recordEventButton',
      halfTimeButton: 'HalfTimeButton',
      fullTimeButton: 'FullTimeButton',
      
      // Modal elements
      goalModal: 'goalModal',
      recordEventModal: 'recordEventModal',
      editEventModal: 'editEventModal',
      
      // Other elements
      resetButton: 'confirmResetBtn',
      shareButton: 'shareButton'
    };

    // Cache all elements
    for (const [key, id] of Object.entries(elementIds)) {
      const element = document.getElementById(id);
      this._cache.set(key, element);
      
      if (!element) {
        console.warn(`Element with ID '${id}' not found`);
      }
    }
  }

  get(elementName) {
    return this._cache.get(elementName);
  }

  // Refresh cache for dynamic elements
  refresh(elementName, id) {
    const element = document.getElementById(id);
    this._cache.set(elementName, element);
    return element;
  }

  // Get all cached elements as object
  getAll() {
    const elements = {};
    for (const [key, value] of this._cache.entries()) {
      elements[key] = value;
    }
    return elements;
  }
}

// Create and export singleton instance
export const domCache = new DOMCache();

// Convenience getter for backward compatibility
export const elements = domCache.getAll();
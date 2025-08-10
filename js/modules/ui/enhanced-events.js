/**
 * Enhanced Events Manager
 * @version 1.0
 * 
 * Extends the events tab with statistics, search, and filter functionality
 */

import { gameState } from '../data/state.js';
import { getEventIcon } from './components.js';

// Enhanced Events Manager
class EnhancedEventsManager {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize enhanced events functionality
  init() {
    if (this.isInitialized) return;

    this._bindEvents();
    this.updateEventStatistics();
    this.isInitialized = true;
  }

  // Update event statistics cards
  updateEventStatistics() {
    const stats = this._calculateEventStatistics();

    // Update statistics cards
    const goalsCount = document.getElementById('goals-count');
    const cardsCount = document.getElementById('cards-count');
    const foulsCount = document.getElementById('fouls-count');
    const totalEventsCount = document.getElementById('total-events-count');

    if (goalsCount) goalsCount.textContent = stats.goals;
    if (cardsCount) cardsCount.textContent = stats.cards;
    if (foulsCount) foulsCount.textContent = stats.fouls;
    if (totalEventsCount) totalEventsCount.textContent = stats.total;
  }

  // Calculate event statistics
  _calculateEventStatistics() {
    const allEvents = [
      ...gameState.goals.map(goal => ({ ...goal, type: 'goal' })),
      ...gameState.matchEvents
    ];

    const stats = {
      goals: gameState.goals.filter(goal => !goal.disallowed).length,
      cards: 0,
      fouls: 0,
      penalties: 0,
      incidents: 0,
      total: allEvents.length
    };

    // Count different event types
    gameState.matchEvents.forEach(event => {
      const eventType = event.type.toLowerCase();

      if (eventType.includes('card')) {
        stats.cards++;
      } else if (eventType.includes('foul')) {
        stats.fouls++;
      } else if (eventType.includes('penalty')) {
        stats.penalties++;
      } else if (eventType.includes('incident')) {
        stats.incidents++;
      }
    });

    return stats;
  }

  // Apply filters to timeline items (simplified - no search)
  applyFilters() {
    // No filtering functionality - just show all items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
      item.classList.remove('filtered-out', 'search-highlight');
    });
  }



  // Update empty state message (simplified)
  _updateEmptyState() {
    // No longer needed since we removed filtering
  }

  // Clear all filters (simplified)
  clearFilters() {
    // No longer needed since we removed filtering
  }



  // Bind event listeners (simplified)
  _bindEvents() {
    // No event listeners needed since we removed search and export functionality
  }

  // Method to be called when events are updated
  onEventsUpdated() {
    this.updateEventStatistics();

    // Small delay to ensure DOM is updated
    setTimeout(() => {
      this.applyFilters();
    }, 100);
  }
}

// Create and export singleton instance
export const enhancedEventsManager = new EnhancedEventsManager();

// Export convenience methods
export const {
  updateEventStatistics,
  applyFilters,
  onEventsUpdated
} = enhancedEventsManager;
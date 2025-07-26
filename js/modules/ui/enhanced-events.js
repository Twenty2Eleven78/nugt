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
    this.searchTerm = '';
    this.filterType = 'all';
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

  // Apply search and filter to timeline items
  applyFilters() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
      const shouldShow = this._shouldShowItem(item);
      
      if (shouldShow) {
        item.classList.remove('filtered-out');
        
        // Apply search highlighting
        if (this.searchTerm && this._itemMatchesSearch(item)) {
          item.classList.add('search-highlight');
        } else {
          item.classList.remove('search-highlight');
        }
      } else {
        item.classList.add('filtered-out');
        item.classList.remove('search-highlight');
      }
    });

    // Update empty state
    this._updateEmptyState();
  }

  // Check if item should be shown based on filters
  _shouldShowItem(item) {
    // Check filter type
    if (!this._itemMatchesFilter(item)) {
      return false;
    }

    // Check search term
    if (this.searchTerm && !this._itemMatchesSearch(item)) {
      return false;
    }

    return true;
  }

  // Check if item matches current filter
  _itemMatchesFilter(item) {
    if (this.filterType === 'all') return true;

    const itemContent = item.textContent.toLowerCase();
    
    switch (this.filterType) {
      case 'goals':
        return itemContent.includes('goal') && !itemContent.includes('disallowed');
      case 'cards':
        return itemContent.includes('card');
      case 'fouls':
        return itemContent.includes('foul');
      case 'penalties':
        return itemContent.includes('penalty');
      case 'incidents':
        return itemContent.includes('incident');
      default:
        return true;
    }
  }

  // Check if item matches search term
  _itemMatchesSearch(item) {
    if (!this.searchTerm) return true;
    
    const itemContent = item.textContent.toLowerCase();
    return itemContent.includes(this.searchTerm.toLowerCase());
  }

  // Update empty state message
  _updateEmptyState() {
    const visibleItems = document.querySelectorAll('.timeline-item:not(.filtered-out)');
    const logElement = document.getElementById('log');
    
    if (!logElement) return;

    // Remove existing empty state message
    const existingEmptyState = logElement.querySelector('.filter-empty-state');
    if (existingEmptyState) {
      existingEmptyState.remove();
    }

    // Show empty state if no visible items
    if (visibleItems.length === 0 && (this.searchTerm || this.filterType !== 'all')) {
      const emptyStateMessage = document.createElement('div');
      emptyStateMessage.className = 'filter-empty-state empty-timeline-message';
      emptyStateMessage.innerHTML = `
        <div class="text-center p-4">
          <i class="fas fa-search fa-3x text-muted mb-3"></i>
          <h5>No events found</h5>
          <p class="text-muted">
            ${this.searchTerm ? `No events match "${this.searchTerm}"` : `No ${this.filterType} events found`}
          </p>
          <button class="btn btn-outline-primary btn-sm" id="clear-filters-empty">
            <i class="fas fa-times me-1"></i>Clear Filters
          </button>
        </div>
      `;
      
      logElement.appendChild(emptyStateMessage);
      
      // Bind clear filters button
      const clearBtn = emptyStateMessage.querySelector('#clear-filters-empty');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearFilters());
      }
    }
  }

  // Clear all filters
  clearFilters() {
    this.searchTerm = '';
    this.filterType = 'all';
    
    // Reset UI controls
    const searchInput = document.getElementById('event-search');
    const filterSelect = document.getElementById('event-filter');
    
    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = 'all';
    
    // Apply filters (which will show all items)
    this.applyFilters();
  }

  // Export events data
  exportEvents() {
    const allEvents = [
      ...gameState.goals.map(goal => ({
        time: goal.timestamp,
        type: 'Goal',
        player: goal.goalScorerName,
        assist: goal.goalAssistName,
        disallowed: goal.disallowed || false
      })),
      ...gameState.matchEvents.map(event => ({
        time: event.timestamp,
        type: event.type,
        notes: event.notes || ''
      }))
    ].sort((a, b) => parseInt(a.time) - parseInt(b.time));

    // Create CSV content
    const csvContent = [
      'Time,Type,Player,Assist,Notes,Disallowed',
      ...allEvents.map(event => 
        `${event.time},"${event.type}","${event.player || ''}","${event.assist || ''}","${event.notes || ''}",${event.disallowed || false}`
      )
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `match-events-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Bind event listeners
  _bindEvents() {
    // Search input
    const searchInput = document.getElementById('event-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.applyFilters();
      });
    }

    // Filter select
    const filterSelect = document.getElementById('event-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.filterType = e.target.value;
        this.applyFilters();
      });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Export events button
    const exportBtn = document.getElementById('export-events');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportEvents();
      });
    }
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
  clearFilters,
  exportEvents,
  onEventsUpdated
} = enhancedEventsManager;
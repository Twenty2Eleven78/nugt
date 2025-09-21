/**
 * Combined Events Management
 * Merges events.js functionality
 * @version 4.0
 */

import { gameState, stateManager } from '../data/state.js';
import { storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { getCurrentSeconds, formatMatchTime } from '../shared/utils.js';
import { EVENT_TYPES } from '../shared/constants.js';
import { notificationManager } from '../services/notifications.js';
import { showModal, hideModal } from '../ui/modals.js';
import { getEventIcon, getEventCardClass } from '../ui/components.js';
import { timerController } from './timer.js';
import { attendanceManager } from '../services/attendance.js';
import { momentumTracker } from './momentum.js';

// Combined Events Manager Class
class CombinedEventsManager {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize both basic and enhanced events functionality
  init() {
    if (this.isInitialized) return;
    
    this._bindEvents();
    this.updateEventStatistics();
    
    // Initialize momentum tracker
    momentumTracker.init();
    
    this.isInitialized = true;
  }

  // === BASIC EVENTS FUNCTIONALITY ===

  // Add match event
  addMatchEvent(eventType, notes = '') {
    const currentSeconds = getCurrentSeconds();
    const team1Name = domCache.get('Team1NameElement')?.textContent;
    const team2Name = domCache.get('Team2NameElement')?.textContent;

    const eventData = {
      timestamp: formatMatchTime(currentSeconds),
      type: eventType,
      notes: notes,
      rawTime: currentSeconds
    };

    // Determine team association
    if (eventType.includes(team1Name)) {
      eventData.team = 1;
      eventData.teamName = team1Name;
    } else if (eventType.includes(team2Name)) {
      eventData.team = 2;
      eventData.teamName = team2Name;
    }

    // Handle special events
    if (eventType === EVENT_TYPES.HALF_TIME) {
      this._handleHalfTimeEvent(eventData, team1Name, team2Name);
      timerController.handleHalfTime();
    } else if (eventType === EVENT_TYPES.FULL_TIME) {
      this._handleFullTimeEvent(eventData, team1Name, team2Name);
      timerController.handleFullTime();
    }

    // Add event to state
    stateManager.addMatchEvent(eventData);

    // Update displays
    this.updateMatchLog();
    this.updateEventStatistics(); // Enhanced functionality
    
    // Update momentum
    momentumTracker.onEventUpdate();

    // Save data
    storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

    // Show notification with appropriate type (skip for system events as timer already shows notification)
    if (eventType !== EVENT_TYPES.GAME_STARTED && 
        eventType !== EVENT_TYPES.HALF_TIME && 
        eventType !== EVENT_TYPES.FULL_TIME) {
      const notificationType = this._getNotificationType(eventType);
      if (notificationType === 'warning') {
        notificationManager.warning(`${eventType} recorded at ${eventData.timestamp}`);
      } else {
        notificationManager.success(`${eventType} recorded at ${eventData.timestamp}`);
      }
    }
  }

  // Show record event modal
  showRecordEventModal() {
    showModal('recordEventModal');
  }

  // Handle half time event
  _handleHalfTimeEvent(eventData, team1Name, team2Name) {
    this._addScoreData(eventData, team1Name, team2Name);
    eventData.notes = `Half Time - ${team1Name} vs ${team2Name}`;
    eventData.isSystemEvent = true;
  }

  // Handle full time event
  _handleFullTimeEvent(eventData, team1Name, team2Name) {
    this._addScoreData(eventData, team1Name, team2Name);
    eventData.notes = `Full Time - ${team1Name} vs ${team2Name}`;
    eventData.isSystemEvent = true;
  }

  // Helper method to add score data to events
  _addScoreData(eventData, team1Name, team2Name) {
    const team1Score = domCache.get('firstScoreElement')?.textContent;
    const team2Score = domCache.get('secondScoreElement')?.textContent;

    eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
    eventData.team1Name = team1Name;
    eventData.team2Name = team2Name;
  }

  // Get notification type for event
  _getNotificationType(eventType) {
    const warningEvents = [
      EVENT_TYPES.INCIDENT, EVENT_TYPES.PENALTY, EVENT_TYPES.YELLOW_CARD,
      EVENT_TYPES.RED_CARD, EVENT_TYPES.SIN_BIN, EVENT_TYPES.FOUL, EVENT_TYPES.OFFSIDE
    ];
    return warningEvents.includes(eventType) ? 'warning' : 'info';
  }

  // Open edit event modal
  openEditEventModal(index, type = 'matchEvent') {
    stateManager.setEditingEvent(index, type);

    const event = type === 'goal' ? gameState.goals[index] : gameState.matchEvents[index];
    if (!event) return;

    const currentMinutes = Math.floor(event.rawTime / 60);

    // Update modal title and show/hide fields based on type
    const modalTitle = document.getElementById('editEventModalLabel');
    const editEventTypeContainer = document.getElementById('editEventTypeContainer');
    const editEventNotesContainer = document.getElementById('editEventNotesContainer');
    
    if (type === 'goal') {
      if (modalTitle) modalTitle.textContent = 'Edit Goal Time';
      if (editEventTypeContainer) editEventTypeContainer.style.display = 'none';
      if (editEventNotesContainer) editEventNotesContainer.style.display = 'none';
    } else {
      if (modalTitle) modalTitle.textContent = 'Edit Event';
      if (editEventTypeContainer) editEventTypeContainer.style.display = 'block';
      if (editEventNotesContainer) editEventNotesContainer.style.display = 'block';
      
      // Populate event-specific fields
      const editEventType = document.getElementById('editEventType');
      const editEventNotes = document.getElementById('editEventNotes');
      
      if (editEventType) editEventType.value = event.type || '';
      if (editEventNotes) editEventNotes.value = event.notes || '';
    }

    // Set common fields
    const editEventIndex = document.getElementById('editEventIndex');
    const editTimeInput = document.getElementById('editEventTime');
    
    if (editEventIndex) editEventIndex.value = index;
    if (editTimeInput) {
      // Use the actual event time, not the calculated minutes
      // This prevents the 35:00 bug when editing events after half-time
      editTimeInput.value = currentMinutes;
    }

    showModal('editEventModal');
  }

  // Handle edit event form submission
  handleEditEventFormSubmission(e) {
    e.preventDefault();

    try {
      const newMinutes = parseInt(document.getElementById('editEventTime')?.value, 10);
      if (isNaN(newMinutes) || newMinutes < 0) {
        notificationManager.error('Please enter a valid time in minutes');
        return;
      }

      // Convert minutes directly to seconds without half-time adjustment
      const newRawTime = newMinutes * 60;
      const newTimestamp = formatMatchTime(newRawTime);

      // Handle different event types
      if (gameState.editingEventType === 'goal') {
        stateManager.updateGoal(gameState.editingEventIndex, {
          rawTime: newRawTime,
          timestamp: newTimestamp
        });
      } else if (gameState.editingEventType === 'matchEvent') {
        const eventIndexElement = document.getElementById('editEventIndex');
        const eventTypeElement = document.getElementById('editEventType');
        const eventNotesElement = document.getElementById('editEventNotes');
        
        if (!eventIndexElement) {
          notificationManager.error('Error: Event index not found');
          return;
        }
        
        const eventIndex = parseInt(eventIndexElement.value, 10);
        if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= gameState.matchEvents.length) {
          notificationManager.error('Error: Invalid event index');
          return;
        }
        
        const newType = eventTypeElement?.value || gameState.matchEvents[eventIndex].type;
        const newNotes = eventNotesElement?.value || '';

        const updatedEvent = {
          ...gameState.matchEvents[eventIndex],
          type: newType,
          notes: newNotes,
          rawTime: newRawTime,
          timestamp: newTimestamp
        };

        stateManager.updateMatchEvent(eventIndex, updatedEvent);
      }

      // Update displays
      this.updateMatchLog();
      this.updateEventStatistics();
      
      // Update momentum
      momentumTracker.onEventUpdate();

      // Save data
      storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

      // Clean up and close modal
      stateManager.clearEditingEvent();
      hideModal('editEventModal');
      notificationManager.success('Event updated successfully');
      
    } catch (error) {
      console.error('Error updating event:', error);
      notificationManager.error('Error updating event. Please try again.');
    }
  }

  // Update match log display
  updateMatchLog() {
    const logElement = domCache.get('log');
    if (!logElement) return;

    const currentTeam1Name = domCache.get('Team1NameElement')?.textContent;
    const currentTeam2Name = domCache.get('Team2NameElement')?.textContent;

    // Combine and sort all events
    const allEvents = [
      ...gameState.goals.map((event, index) => ({
        ...event,
        originalIndex: index,
        updatetype: 'goal'
      })),
      ...gameState.matchEvents.map((event, index) => ({
        ...event,
        originalIndex: index,
        updatetype: 'matchEvent'
      }))
    ].sort((a, b) => a.rawTime - b.rawTime);

    // Handle empty state
    if (allEvents.length === 0) {
      logElement.innerHTML = `
        <div class="empty-timeline-message">
          <div class="text-center p-4">
            <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
            <h5>No events recorded yet</h5>
            <p class="text-muted">
              Match events and goals will appear here as they happen.
            </p>
          </div>
        </div>
      `;
      return;
    }

    // Build timeline
    const fragment = document.createDocumentFragment();
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline';

    allEvents.forEach((event, index) => {
      const timelineItem = this._createTimelineItem(event, index, currentTeam1Name, currentTeam2Name);
      timelineContainer.appendChild(timelineItem);
    });

    fragment.appendChild(timelineContainer);
    logElement.innerHTML = '';
    logElement.appendChild(fragment);
  }

  // === ENHANCED EVENTS FUNCTIONALITY ===

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

  // Bind enhanced events functionality
  _bindEvents() {
    // This method can be extended for additional event bindings
    // Combined events manager initialized
  }

  // Called when events are updated (for external integrations)
  onEventsUpdated() {
    this.updateEventStatistics();
    this.updateMatchLog();
  }

  // Recalculate scores (helper method)
  _recalculateScores() {
    const team2Name = domCache.get('Team2NameElement')?.textContent;

    const teamGoals = gameState.goals.filter(goal =>
      !goal.disallowed && goal.goalScorerName !== team2Name
    ).length;

    const oppositionGoals = gameState.goals.filter(goal =>
      !goal.disallowed && goal.goalScorerName === team2Name
    ).length;

    // Update UI elements
    const firstScoreElement = domCache.get('firstScoreElement');
    const secondScoreElement = domCache.get('secondScoreElement');

    if (firstScoreElement) firstScoreElement.textContent = teamGoals;
    if (secondScoreElement) secondScoreElement.textContent = oppositionGoals;

    // Update storage using storageHelpers
    storageHelpers.saveMatchData(gameState);
  }

  // === HELPER METHODS ===

  // Create timeline item
  _createTimelineItem(event, index, currentTeam1Name, currentTeam2Name) {
    const timelineItemClass = index % 2 === 0 ? 'timeline-item-left' : 'timeline-item-right';
    const item = document.createElement('div');
    item.className = `timeline-item ${timelineItemClass}`;

    if (event.updatetype === 'matchEvent') {
      item.innerHTML = this._createMatchEventHTML(event, currentTeam1Name, currentTeam2Name);
    } else {
      item.innerHTML = this._createGoalEventHTML(event, currentTeam1Name, currentTeam2Name);
    }

    return item;
  }

  // Create action buttons HTML
  _createActionButtons(event, type) {
    const editButton = `
      <button class="btn btn-sm btn-outline-primary" 
        onclick="window.EventsModule.openEditEventModal(${event.originalIndex}, '${event.updatetype}')">
        <i class="fas fa-edit"></i>
      </button>`;

    const deleteButton = `
      <button class="btn btn-sm btn-outline-danger" 
        onclick="window.EventsModule.deleteLogEntry(${event.originalIndex}, '${type}')" 
        aria-label="Delete ${type}">
        <i class="fas fa-trash"></i>
      </button>`;

    if (type === 'goal') {
      const toggleButton = `
        <button class="btn btn-sm btn-outline-warning me-2" 
           onclick="window.GoalsModule.toggleGoalDisallowed(${event.originalIndex})" 
           title="${event.disallowed ? 'Allow goal' : 'Disallow goal'}">
          <i class="fas fa-${event.disallowed ? 'check' : 'ban'}"></i>
        </button>`;

      const goalEditButton = `
        <button class="btn btn-sm btn-outline-primary me-2" 
          onclick="window.EventsModule.openEditEventModal(${event.originalIndex}, '${event.updatetype}')">
          <i class="fas fa-edit"></i>
        </button>`;

      return `${toggleButton}${goalEditButton}${deleteButton}`;
    }

    return `${editButton}${deleteButton}`;
  }

  // Update team names in text
  _updateTeamNames(text, oldTeam1Name, oldTeam2Name, newTeam1Name, newTeam2Name) {
    if (!text) return text;
    return text.replace(oldTeam1Name, newTeam1Name).replace(oldTeam2Name, newTeam2Name);
  }

  // Create match event HTML
  _createMatchEventHTML(event, currentTeam1Name, currentTeam2Name) {
    const cardClass = getEventCardClass(event.type);
    const icon = getEventIcon(event.type);

    let eventText = event.type;
    let scoreInfo = event.score ? ` (${event.score})` : '';

    // Update team names if needed
    if (event.teamName) {
      eventText = event.team === 1
        ? event.type.replace(event.teamName, currentTeam1Name)
        : event.type.replace(event.teamName, currentTeam2Name);
    }

    if (event.score && event.team1Name && event.team2Name) {
      scoreInfo = ` (${this._updateTeamNames(event.score, event.team1Name, event.team2Name, currentTeam1Name, currentTeam2Name)})`;
    }

    return `
      <div class="timeline-marker"></div>
      <div class="timeline-content ${cardClass}">
        <div class="timeline-time">${event.timestamp}' - ${icon} <strong>${eventText}</strong>${scoreInfo}</div>
        <div class="timeline-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="event-info d-flex align-items-center">
              <p class="mb-0">${event.notes || ''}</p>
            </div>
            <div class="event-actions">
              ${this._createActionButtons(event, 'event')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Create goal details HTML
  _createGoalDetails(event, isOppositionGoal) {
    if (isOppositionGoal) return '';

    const scorerInfo = `${event.goalScorerName} ${event.goalScorerShirtNumber ? `(#${event.goalScorerShirtNumber})` : ''}`;
    const assistInfo = `${event.goalAssistName} ${event.goalAssistShirtNumber ? `(#${event.goalAssistShirtNumber})` : ''}`;

    return `<br><small><strong>Scored By: </strong>${scorerInfo}<br> <Strong>Assisted By:</strong> ${assistInfo}</small>`;
  }

  // Create goal event HTML
  _createGoalEventHTML(event, currentTeam1Name, currentTeam2Name) {
    const goalTeam = event.team || (event.goalScorerName === currentTeam2Name ? 2 : 1);
    const isOppositionGoal = goalTeam === 2;
    const displayTeamName = isOppositionGoal ? currentTeam2Name : currentTeam1Name;

    // Determine styling classes
    const cardClass = isOppositionGoal ? 'border-danger border-2' : 'border-success border-2';
    const markerClass = isOppositionGoal ? 'marker-danger' : 'marker-success';
    const disallowedClass = event.disallowed ? 'border-warning border-2' : cardClass;
    const disallowedMarker = event.disallowed ? 'marker-warning' : markerClass;

    // Create content elements
    const goalIcon = `<i class="fa-regular fa-futbol"></i>`;
    const goalTitle = isOppositionGoal
      ? `<span class="text-danger">${goalIcon} Goal: ${displayTeamName}</span>`
      : `<span class="text-success">${goalIcon} Goal: ${displayTeamName}</span>`;

    const disallowedText = event.disallowed
      ? `<br><small class="text-warning"><strong>DISALLOWED:</strong> ${event.disallowedReason}</small>`
      : '';

    const goalDetails = this._createGoalDetails(event, isOppositionGoal);

    return `
      <div class="timeline-marker ${disallowedMarker}"></div>
      <div class="timeline-content ${disallowedClass}">
        <div class="timeline-time">${event.timestamp}' - <strong>${goalTitle}</strong></div>
        <div class="timeline-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="event-info">
              ${goalDetails}${disallowedText}
            </div>
            <div class="event-actions">
              ${this._createActionButtons(event, 'goal')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Create and export singleton instance
export const combinedEventsManager = new CombinedEventsManager();

// Export convenience methods for backward compatibility
export const {
  addMatchEvent,
  showRecordEventModal,
  openEditEventModal,
  handleEditEventFormSubmission,
  updateEventStatistics,
  onEventsUpdated
} = combinedEventsManager;

// Alias for backward compatibility
export const eventsManager = combinedEventsManager;

// Update match log function for global access
export function updateMatchLog() {
  combinedEventsManager.updateMatchLog();
}

// Store pending deletion info
let pendingDeletion = null;

// Delete log entry function for global access
export function deleteLogEntry(index, type) {
  // Store deletion info for confirmation
  pendingDeletion = { index, type };
  
  const itemType = type === 'goal' ? 'goal' : 'event';
  const itemName = type === 'goal' ? 
    (gameState.goals[index]?.goalScorerName || 'Unknown') : 
    (gameState.matchEvents[index]?.type || 'Unknown');
  
  // Show confirmation modal
  showEventDeleteModal(itemType, itemName);
}

// Function to actually perform the deletion
function performEventDeletion() {
  if (!pendingDeletion) return;
  
  const { index, type } = pendingDeletion;
  const itemType = type === 'goal' ? 'goal' : 'event';

  if (type === 'goal') {
    if (index < 0 || index >= gameState.goals.length) return;
    stateManager.removeGoal(index);
    // Recalculate scores after goal deletion
    combinedEventsManager._recalculateScores();
  } else if (type === 'event') {
    if (index < 0 || index >= gameState.matchEvents.length) return;
    stateManager.removeMatchEvent(index);
  }

  combinedEventsManager.updateMatchLog();
  combinedEventsManager.updateEventStatistics();
  
  // Update momentum
  momentumTracker.onEventUpdate();
  
  storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());
  notificationManager.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted`);
  
  // Clear pending deletion
  pendingDeletion = null;
}

// Function to show event delete confirmation modal
function showEventDeleteModal(itemType, itemName) {
  // Create modal if it doesn't exist
  if (!document.getElementById('eventDeleteModal')) {
    createEventDeleteModal();
  }
  
  // Update modal content
  const modalTitle = document.getElementById('eventDeleteModalTitle');
  const modalBody = document.getElementById('eventDeleteModalBody');
  
  if (modalTitle) {
    modalTitle.innerHTML = `<i class="fas fa-exclamation-triangle text-warning me-2"></i>Confirm Deletion`;
  }
  
  if (modalBody) {
    modalBody.innerHTML = `
      <p class="mb-3">Are you sure you want to delete this ${itemType}?</p>
      <div class="alert alert-warning">
        <strong>${itemType.charAt(0).toUpperCase() + itemType.slice(1)}:</strong> ${itemName}
      </div>
      <p class="text-muted small mb-0">This action cannot be undone.</p>
    `;
  }
  
  // Show modal
  const modal = document.getElementById('eventDeleteModal');
  if (modal) {
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
  }
}

// Function to create event delete confirmation modal
function createEventDeleteModal() {
  const modalHTML = `
    <div class="modal fade" id="eventDeleteModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title" id="eventDeleteModalTitle">
              <i class="fas fa-exclamation-triangle me-2"></i>Confirm Deletion
            </h5>
            <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-times" style="font-size: 14px;"></i>
            </button>
          </div>
          <div class="modal-body" id="eventDeleteModalBody">
            <!-- Content will be populated dynamically -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelEventDeleteBtn">
              <i class="fas fa-times me-1"></i>Cancel
            </button>
            <button type="button" class="btn btn-danger" id="confirmEventDeleteBtn">
              <i class="fas fa-trash me-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  const modal = document.getElementById('eventDeleteModal');
  const cancelBtn = document.getElementById('cancelEventDeleteBtn');
  const confirmBtn = document.getElementById('confirmEventDeleteBtn');
  const closeBtn = modal.querySelector('[data-dismiss="modal"]');
  
  // Cancel button
  cancelBtn?.addEventListener('click', () => {
    hideEventDeleteModal();
    pendingDeletion = null;
  });
  
  // Close button
  closeBtn?.addEventListener('click', () => {
    hideEventDeleteModal();
    pendingDeletion = null;
  });
  
  // Confirm button
  confirmBtn?.addEventListener('click', () => {
    hideEventDeleteModal();
    performEventDeletion();
  });
  
  // Click outside to close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideEventDeleteModal();
      pendingDeletion = null;
    }
  });
}

// Function to hide event delete modal
function hideEventDeleteModal() {
  const modal = document.getElementById('eventDeleteModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}
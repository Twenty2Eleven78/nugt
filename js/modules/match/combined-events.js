/**
 * Combined Events Management
 * Merges events.js and enhanced-events.js functionality
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
import { timerController } from '../game/timer.js';
import { attendanceManager } from '../services/attendance.js';

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
      EVENT_TYPES.RED_CARD, EVENT_TYPES.SIN_BIN, EVENT_TYPES.FOUL
    ];
    return warningEvents.includes(eventType) ? 'warning' : 'info';
  }

  // Open edit event modal
  openEditEventModal(index, type = 'matchEvent') {
    stateManager.setEditingEvent(index, type);

    const event = type === 'goal' ? gameState.goals[index] : gameState.matchEvents[index];
    if (!event) return;

    const currentMinutes = Math.floor(event.rawTime / 60);

    // Populate edit form based on type
    if (type === 'matchEvent') {
      const editEventType = document.getElementById('editEventType');
      const editEventNotes = document.getElementById('editEventNotes');
      const editEventIndex = document.getElementById('editEventIndex');

      if (editEventType) editEventType.value = event.type;
      if (editEventNotes) editEventNotes.value = event.notes || '';
      if (editEventIndex) editEventIndex.value = index;
    }

    const editTimeInput = document.getElementById('editEventTime');
    if (editTimeInput) {
      editTimeInput.value = currentMinutes;
    }

    showModal('editEventModal');
  }

  // Handle edit event form submission
  handleEditEventFormSubmission(e) {
    e.preventDefault();

    const newMinutes = parseInt(document.getElementById('editEventTime')?.value, 10);
    if (isNaN(newMinutes)) return;

    const newRawTime = newMinutes * 60;
    const newTimestamp = formatMatchTime(newRawTime);

    // Handle different event types
    if (gameState.editingEventType === 'goal') {
      stateManager.updateGoal(gameState.editingEventIndex, {
        rawTime: newRawTime,
        timestamp: newTimestamp
      });
    } else if (gameState.editingEventType === 'matchEvent') {
      const eventIndex = parseInt(document.getElementById('editEventIndex')?.value);
      const newType = document.getElementById('editEventType')?.value;
      const newNotes = document.getElementById('editEventNotes')?.value;

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

    // Save data
    storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

    // Clean up and close modal
    stateManager.clearEditingEvent();
    hideModal('editEventModal');
    notificationManager.success('Event updated successfully');
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
      cards: allEvents.filter(event => 
        event.type && (event.type.toLowerCase().includes('card') || 
                      event.type.toLowerCase().includes('yellow') || 
                      event.type.toLowerCase().includes('red'))
      ).length,
      fouls: allEvents.filter(event => 
        event.type && event.type.toLowerCase().includes('foul')
      ).length,
      total: allEvents.length
    };

    return stats;
  }

  // Bind enhanced events functionality
  _bindEvents() {
    // This method can be extended for additional event bindings
    console.log('Combined events manager initialized');
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

      return `${toggleButton}${editButton.replace('">', ' me-2">')}${deleteButton}`;
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
export const enhancedEventsManager = combinedEventsManager;

// Update match log function for global access
export function updateMatchLog() {
  combinedEventsManager.updateMatchLog();
}

// Delete log entry function for global access
export function deleteLogEntry(index, type) {
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
  
  storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());
  notificationManager.error('Entry deleted');
}
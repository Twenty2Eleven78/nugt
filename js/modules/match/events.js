/**
 * Match Events Management
 * @version 3.3
 */

import { gameState, stateManager } from '../data/state.js';
import { storage, storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { getCurrentSeconds, formatMatchTime } from '../shared/utils.js';
import { EVENT_TYPES } from '../shared/constants.js';
import { notificationManager } from '../services/notifications.js';
import { showModal, hideModal } from '../ui/modals.js';
import { getEventIcon, getEventCardClass } from '../ui/components.js';
import { timerController } from '../game/timer.js';
import { attendanceManager } from '../services/attendance.js';
import { enhancedEventsManager } from '../ui/enhanced-events.js';

// Match events management class
class EventsManager {
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

    // Add event and update UI
    console.log('Adding match event:', eventData);
    stateManager.addMatchEvent(eventData);
    console.log('Match events after adding:', gameState.matchEvents);
    updateMatchLog();

    // Show notification
    const notificationType = this._getNotificationType(eventType);
    if (notificationType === 'warning') {
      notificationManager.warning(`${eventType} recorded`);
    } else {
      notificationManager.info(`${eventType} recorded`);
    }

    // Save data
    storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());
  }

  // Helper method to add score data to events
  _addScoreData(eventData, team1Name, team2Name) {
    const team1Score = domCache.get('firstScoreElement')?.textContent;
    const team2Score = domCache.get('secondScoreElement')?.textContent;

    eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
    eventData.team1Name = team1Name;
    eventData.team2Name = team2Name;
  }

  // Handle half time event
  _handleHalfTimeEvent(eventData, team1Name, team2Name) {
    this._addScoreData(eventData, team1Name, team2Name);
  }

  // Handle full time event
  _handleFullTimeEvent(eventData, team1Name, team2Name) {
    this._addScoreData(eventData, team1Name, team2Name);
  }

  // Get notification type for event
  _getNotificationType(eventType) {
    const warningEvents = [
      EVENT_TYPES.INCIDENT, EVENT_TYPES.PENALTY, EVENT_TYPES.YELLOW_CARD,
      EVENT_TYPES.RED_CARD, EVENT_TYPES.SIN_BIN, EVENT_TYPES.FOUL
    ];
    return warningEvents.includes(eventType) ? 'warning' : 'info';
  }

  // Show record event modal
  showRecordEventModal() {
    showModal('recordEventModal');
  }



  // Open edit event modal
  openEditEventModal(index, type) {
    stateManager.setEditingEvent(index, type);

    const event = type === 'goal' ? gameState.goals[index] : gameState.matchEvents[index];
    const currentMinutes = Math.floor(event.rawTime / 60);

    const editTimeInput = document.getElementById('editEventTime');
    if (editTimeInput) {
      editTimeInput.value = currentMinutes;
    }

    showModal('editEventModal');
  }

  // Handle edit event form submission
  handleEditEventFormSubmission(event) {
    event.preventDefault();

    const newMinutes = parseInt(document.getElementById('editEventTime')?.value, 10);
    if (isNaN(newMinutes)) return;

    const newRawTime = newMinutes * 60;
    const newTimestamp = formatMatchTime(newRawTime);

    // Update the event
    if (gameState.editingEventType === 'goal') {
      stateManager.updateGoal(gameState.editingEventIndex, {
        rawTime: newRawTime,
        timestamp: newTimestamp
      });
    } else if (gameState.editingEventType === 'matchEvent') {
      stateManager.updateMatchEvent(gameState.editingEventIndex, {
        rawTime: newRawTime,
        timestamp: newTimestamp
      });
    }

    // Update UI and save
    updateMatchLog();
    storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

    // Clean up and close modal
    stateManager.clearEditingEvent();
    hideModal('editEventModal');
    notificationManager.success('Event time updated successfully!');
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

    // Update storage
    storage.save('nugt_firstScore', teamGoals);
    storage.save('nugt_secondScore', oppositionGoals);
  }
}

// Update match log display
export function updateMatchLog() {
  console.log('updateMatchLog called');
  const logElement = domCache.get('log');
  if (!logElement) {
    console.warn('Log element not found');
    return;
  }

  const currentTeam1Name = domCache.get('Team1NameElement')?.textContent;
  const currentTeam2Name = domCache.get('Team2NameElement')?.textContent;

  console.log('Current team names:', currentTeam1Name, currentTeam2Name);
  console.log('Goals data:', gameState.goals);
  console.log('Match events data:', gameState.matchEvents);

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

  console.log('All events combined:', allEvents);

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
    const timelineItem = _createTimelineItem(event, index, currentTeam1Name, currentTeam2Name);
    timelineContainer.appendChild(timelineItem);
  });

  fragment.appendChild(timelineContainer);
  logElement.innerHTML = '';
  logElement.appendChild(fragment);

  // Update enhanced events manager
  enhancedEventsManager.onEventsUpdated();
}

// Create timeline item (helper method)
function _createTimelineItem(event, index, currentTeam1Name, currentTeam2Name) {
  const timelineItemClass = index % 2 === 0 ? 'timeline-item-left' : 'timeline-item-right';
  const item = document.createElement('div');
  item.className = `timeline-item ${timelineItemClass}`;

  if (event.updatetype === 'matchEvent') {
    item.innerHTML = _createMatchEventHTML(event, currentTeam1Name, currentTeam2Name);
  } else {
    item.innerHTML = _createGoalEventHTML(event, currentTeam1Name, currentTeam2Name);
  }

  return item;
}

// Helper function to create action buttons HTML
function _createActionButtons(event, type) {
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

// Helper function to update team names in text
function _updateTeamNames(text, oldTeam1Name, oldTeam2Name, newTeam1Name, newTeam2Name) {
  if (!text) return text;
  return text.replace(oldTeam1Name, newTeam1Name).replace(oldTeam2Name, newTeam2Name);
}

// Create match event HTML
function _createMatchEventHTML(event, currentTeam1Name, currentTeam2Name) {
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
    scoreInfo = ` (${_updateTeamNames(event.score, event.team1Name, event.team2Name, currentTeam1Name, currentTeam2Name)})`;
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
            ${_createActionButtons(event, 'event')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper function to create goal details HTML
function _createGoalDetails(event, isOppositionGoal) {
  if (isOppositionGoal) return '';

  const scorerInfo = `${event.goalScorerName} ${event.goalScorerShirtNumber ? `(#${event.goalScorerShirtNumber})` : ''}`;
  const assistInfo = `${event.goalAssistName} ${event.goalAssistShirtNumber ? `(#${event.goalAssistShirtNumber})` : ''}`;

  return `<br><small><strong>Scored By: </strong>${scorerInfo}<br> <Strong>Assisted By:</strong> ${assistInfo}</small>`;
}

// Create goal event HTML
function _createGoalEventHTML(event, currentTeam1Name, currentTeam2Name) {
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

  const goalDetails = _createGoalDetails(event, isOppositionGoal);

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
            ${_createActionButtons(event, 'goal')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Create and export singleton instance
export const eventsManager = new EventsManager();

// Standalone function for global access (HTML onclick handlers)
export function deleteLogEntry(index, type) {
  if (type === 'goal') {
    stateManager.removeGoal(index);
    // Recalculate scores after goal deletion using the manager instance
    eventsManager._recalculateScores();
  } else if (type === 'event') {
    stateManager.removeMatchEvent(index);
  }

  updateMatchLog();
  notificationManager.error('Entry deleted');
  storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());
}

// Export convenience methods
export const {
  addMatchEvent,
  showRecordEventModal,
  openEditEventModal,
  handleEditEventFormSubmission
} = eventsManager;
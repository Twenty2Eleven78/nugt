/**
 * Match Events Management
 * @version 3.3
 */

import { gameState, stateManager } from '../data/state.js';
import { storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { getCurrentSeconds, formatMatchTime } from '../shared/utils.js';
import { EVENT_TYPES } from '../shared/constants.js';
import { showNotification } from '../services/notifications.js';
import { showModal, hideModal } from '../ui/modals.js';
import { getEventIcon, getEventCardClass } from '../ui/components.js';
import { timerController } from '../game/timer.js';

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
    stateManager.addMatchEvent(eventData);
    updateMatchLog();
    
    // Show notification
    const notificationType = this._getNotificationType(eventType);
    showNotification(`${eventType} recorded`, notificationType);
    
    // Save data
    storageHelpers.saveMatchData(gameState);
  }

  // Handle half time event
  _handleHalfTimeEvent(eventData, team1Name, team2Name) {
    const team1Score = domCache.get('firstScoreElement')?.textContent;
    const team2Score = domCache.get('secondScoreElement')?.textContent;
    
    eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
    eventData.team1Name = team1Name;
    eventData.team2Name = team2Name;
  }

  // Handle full time event
  _handleFullTimeEvent(eventData, team1Name, team2Name) {
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

  // Show record event modal
  showRecordEventModal() {
    showModal('recordEventModal');
  }

  // Delete log entry
  deleteLogEntry(index, type) {
    if (type === 'goal') {
      stateManager.removeGoal(index);
      this._recalculateScores();
    } else if (type === 'event') {
      stateManager.removeMatchEvent(index);
    }
    
    updateMatchLog();
    showNotification('Entry deleted', 'danger');
    storageHelpers.saveMatchData(gameState);
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
    storageHelpers.saveMatchData(gameState);
    
    // Clean up and close modal
    stateManager.clearEditingEvent();
    hideModal('editEventModal');
    showNotification('Event time updated successfully!', 'success');
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
  }
}

// Update match log display
export function updateMatchLog() {
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

// Create match event HTML
function _createMatchEventHTML(event, currentTeam1Name, currentTeam2Name) {
  const cardClass = getEventCardClass(event.type);
  const icon = getEventIcon(event.type);
  
  let eventText = event.type;
  let scoreInfo = event.score ? ` (${event.score})` : '';

  // Update team names if needed
  if (event.teamName) {
    if (event.team === 1) {
      eventText = event.type.replace(event.teamName, currentTeam1Name);
    } else if (event.team === 2) {
      eventText = event.type.replace(event.teamName, currentTeam2Name);
    }
  }
  
  if (event.score && event.team1Name && event.team2Name) {
    scoreInfo = ` (${event.score.replace(event.team1Name, currentTeam1Name).replace(event.team2Name, currentTeam2Name)})`;
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
            <button class="btn btn-sm btn-outline-primary" 
              onclick="window.EventsModule.openEditEventModal(${event.originalIndex}, '${event.updatetype}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" 
              onclick="window.EventsModule.deleteLogEntry(${event.originalIndex}, 'event')" 
              aria-label="Delete event">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Create goal event HTML
function _createGoalEventHTML(event, currentTeam1Name, currentTeam2Name) {
  const goalTeam = event.team || (event.goalScorerName === currentTeam2Name ? 2 : 1);
  const isOppositionGoal = goalTeam === 2;
  const displayTeamName = isOppositionGoal ? currentTeam2Name : currentTeam1Name;
  const cardClass = isOppositionGoal ? 'border-danger border-2' : 'border-success border-2';
  const markerClass = isOppositionGoal ? 'marker-danger' : 'marker-success';
  const disallowedClass = event.disallowed ? 'border-warning border-2' : cardClass;
  const disallowedMarker = event.disallowed ? 'marker-warning' : markerClass;
  const disallowedText = event.disallowed ? `<br><small class="text-warning"><strong>DISALLOWED:</strong> ${event.disallowedReason}</small>` : '';
  
  return `
    <div class="timeline-marker ${disallowedMarker}"></div>
    <div class="timeline-content ${disallowedClass}">
      <div class="timeline-time">${event.timestamp}' - <strong>
              ${isOppositionGoal
                ? `<span class="text-danger"><i class="fa-regular fa-futbol"></i> Goal: ${displayTeamName}</span>`
                : `<span class="text-success"><i class="fa-regular fa-futbol"></i> Goal: ${displayTeamName}</span>`
              }
            </strong></div>
      <div class="timeline-body">
        <div class="d-flex justify-content-between align-items-start">
          <div class="event-info">
            ${isOppositionGoal ? '' : `<br><small><strong>Scored By: </strong>${event.goalScorerName} ${event.goalScorerShirtNumber ? `(#${event.goalScorerShirtNumber})` : ''}<br> <Strong>Assisted By:</strong> ${event.goalAssistName} ${event.goalAssistShirtNumber ? `(#${event.goalAssistShirtNumber})` : ''}</small>`}
            ${disallowedText}
          </div>
          <div class="event-actions">
            <button class="btn btn-sm btn-outline-warning me-2" 
               onclick="window.GoalsModule.toggleGoalDisallowed(${event.originalIndex})" 
               title="${event.disallowed ? 'Allow goal' : 'Disallow goal'}">
              <i class="fas fa-${event.disallowed ? 'check' : 'ban'}"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary me-2" 
               onclick="window.EventsModule.openEditEventModal(${event.originalIndex}, '${event.updatetype}')"
               title="Edit goal">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger"
              onclick="window.EventsModule.deleteLogEntry(${event.originalIndex}, 'goal')"
              aria-label="Delete goal"
              title="Delete goal">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Create and export singleton instance
export const eventsManager = new EventsManager();

// Export convenience methods
export const {
  addMatchEvent,
  showRecordEventModal,
  deleteLogEntry,
  openEditEventModal,
  handleEditEventFormSubmission
} = eventsManager;
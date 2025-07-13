/**
 * Netherton United Game Time App (NUGT)
 * 
 * @description A web application for tracking football match events, goals, and statistics
 * @version 3.3
 * @author Mark Van-Kerro
 * @date Last Updated: 2025-02-27
 * 
 * This script handles all the functionality for the game time application including:
 * - Match timer management
 * - Goal tracking and statistics
 * - Match event logging
 * - Team management
 * - Data persistence using localStorage
 * - WhatsApp sharing functionality
 */

// State management
const STATE = {
  seconds: 0,
  isRunning: false,
  intervalId: null,
  data: [],
  startTimestamp: null,
  matchEvents: [],
  gameTime: 4200, // Default 70 minutes in seconds
  isSecondHalf: false,
  team1History: ['Netherton'], // Initialize with default name
  team2History: ['Opposition'], // Initialize with default name
  pendingGoalTimestamp: null,
};
 
// DOM Elements
const elements = {
  stopwatch: document.getElementById('stopwatch'),
  startPauseButton: document.getElementById('startPauseButton'),
  goalButton: document.getElementById('goalButton'),
  opgoalButton: document.getElementById('opgoalButton'),
  goalScorer: document.getElementById('goalScorer'),
  goalAssist: document.getElementById('goalAssist'),
  resetButton: document.getElementById('confirmResetBtn'),
  shareButton: document.getElementById('shareButton'),
  log: document.getElementById('log'),
  goalForm: document.getElementById('goalForm'),
  firstScoreElement: document.getElementById('first-score'),
  secondScoreElement: document.getElementById('second-score'),
  Team1NameElement: document.getElementById('first-team-name'),
  Team2NameElement: document.getElementById('second-team-name'),
  team1Input: document.getElementById('team1Name'),
  team2Input: document.getElementById('team2Name'),
  updTeam1Btn: document.getElementById('updTeam1Btn'),
  updTeam2Btn: document.getElementById('updTeam2Btn'),
  gameTimeSelect: document.getElementById('gameTimeSelect')
};

let editingEventIndex = null;
let editingEventType = null;

// Constants
const STORAGE_KEYS = {
  START_TIMESTAMP: 'nugt_startTimestamp',
  IS_RUNNING: 'nugt_isRunning',
  GOALS: 'nugt_goals',
  ELAPSED_TIME: 'nugt_elapsedTime',
  FIRST_SCORE: 'nugt_firstScore',    
  SECOND_SCORE: 'nugt_secondScore',
  TEAM1_NAME: 'nugt_team1name',    
  TEAM2_NAME: 'nugt_team2name',
  MATCH_EVENTS: 'nugt_matchEvents',
  GAME_TIME: 'nugt_gameTime',
  IS_SECOND_HALF: 'nugt_isSecondHalf',
  TEAM1_HISTORY: 'nugt_team1history',
  TEAM2_HISTORY: 'nugt_team2history',     
};

// Local Storage utilities
const Storage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  },
  
  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error loading from localStorage:`, error);
      return defaultValue;
    }
  },
  
  clear() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};

// Time formatting utility
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return [ minutes, secs]
    .map(num => num.toString().padStart(2, '0'))
    .join(':');
}

// Helper function to update the Start/Pause button UI
function updateStartPauseButtonUI(text, newStatusClass, time) {
  const oldStatusClass = newStatusClass === 'btn-success' ? 'btn-danger' : 'btn-success';
  elements.startPauseButton.classList.remove(oldStatusClass);
  // Ensure the newStatusClass is not accidentally removed if it's the same as oldStatusClass (e.g. btn-danger to btn-danger)
  if (elements.startPauseButton.classList.contains(newStatusClass)) {
    elements.startPauseButton.classList.remove(newStatusClass);
  }
  elements.startPauseButton.classList.add(newStatusClass);
  elements.startPauseButton.innerHTML = `${text} <span id="stopwatch" role="timer" class="timer-badge">${time}</span>`;
}

// Get current Seconds
function getCurrentSeconds() {
  if (!STATE.isRunning || !STATE.startTimestamp) return STATE.seconds;
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - STATE.startTimestamp) / 1000);
  return elapsedSeconds;
}

//update stopwatch display
function updateStopwatchDisplay() {

  const currentSeconds = getCurrentSeconds();
  const existingTimeDisplay = startPauseButton.querySelector('#stopwatch');
    if (existingTimeDisplay) {
      existingTimeDisplay.textContent = formatTime(currentSeconds);
    }
  STATE.seconds = currentSeconds;
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, currentSeconds);
}

// Stopwatch controls
function startStopwatch() {
  if (!STATE.isRunning) {
    // Starting the timer
    STATE.isRunning = true;
    if (!STATE.startTimestamp) {
      STATE.startTimestamp = Date.now() - (STATE.seconds * 1000);
    }
    STATE.intervalId = setInterval(updateStopwatchDisplay, 100);
    updateStartPauseButtonUI('Game in Progress', 'btn-success', formatTime(STATE.seconds));
    showNotification('Game Started!', 'success');
  } else {
    // Pausing the timer
    // Note: STATE.seconds will be updated by getCurrentSeconds() later in this block
    updateStartPauseButtonUI('Game is Paused', 'btn-danger', formatTime(getCurrentSeconds()));
    clearInterval(STATE.intervalId);
    STATE.isRunning = false;
    STATE.seconds = getCurrentSeconds();
    STATE.startTimestamp = null;
    showNotification('Game Paused', 'danger');
  }
  // save state
  Storage.save(STORAGE_KEYS.IS_RUNNING, STATE.isRunning);
  Storage.save(STORAGE_KEYS.START_TIMESTAMP, STATE.startTimestamp);
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, STATE.seconds);
}

// Add game time change handler
function handleGameTimeChange(event) {
  const newGameTime = parseInt(event.target.value);
  STATE.gameTime = newGameTime;
  Storage.save(STORAGE_KEYS.GAME_TIME, newGameTime);
  
  // If game hasn't started, reset stopwatch display
  if (!STATE.isRunning && STATE.seconds === 0) {
    updateStopwatchDisplay();
  }
}

// Add new function to handle half time transition
function handleHalfTime() {
  const halfTimeSeconds = STATE.gameTime / 2;
  
  // Stop the timer if it's running
  if (STATE.isRunning) {
    clearInterval(STATE.intervalId);
    STATE.isRunning = false;
  }
  updateStartPauseButtonUI('Half Time Break', 'btn-danger', formatTime(halfTimeSeconds));
    
  // Update state
  STATE.isRunning = false;
  STATE.isSecondHalf = true;
  STATE.seconds = halfTimeSeconds;
  STATE.startTimestamp = null;
  
  // Save state
  Storage.save(STORAGE_KEYS.IS_RUNNING, false);
  Storage.save(STORAGE_KEYS.IS_SECOND_HALF, true);
  Storage.save(STORAGE_KEYS.START_TIMESTAMP, null);
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, STATE.seconds);
  
  // Update display
  updateStopwatchDisplay();
  showNotification('Half Time - Game Paused', 'info');
}

// Add new function to handle half time transition
function handleFullTime() {
    
  // Stop the timer if it's running
  if (STATE.isRunning) {
    clearInterval(STATE.intervalId);
    STATE.isRunning = false;
    
  }
  updateStartPauseButtonUI('Full Time', 'btn-danger', formatTime(STATE.seconds));
  STATE.startTimestamp = null;
 
  // Save state
  Storage.save(STORAGE_KEYS.IS_RUNNING, false);
  Storage.save(STORAGE_KEYS.START_TIMESTAMP, null);
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, STATE.seconds);
  
  // Update display
  updateStopwatchDisplay();
  showNotification('Full Time - Game Finished', 'info');
}

// Add helper function to format match time
function formatMatchTime(seconds) {
  const halfTime = STATE.gameTime / 2;
  const isExtraTime = seconds > halfTime && !STATE.isSecondHalf || seconds > STATE.gameTime;
  
  if (!isExtraTime) {
    return Math.ceil(seconds / 60).toString();
  }
  
  // Calculate extra time
  let baseTime, extraMinutes;
  if (!STATE.isSecondHalf) {
    // First half extra time
    baseTime = halfTime/60;
    extraMinutes = Math.ceil((seconds - halfTime) / 60);
  } else {
    // Second half extra time
    baseTime = STATE.gameTime/60;
    extraMinutes = Math.ceil((seconds - STATE.gameTime) / 60);
  }
  
  return `${baseTime}+${extraMinutes}`;
}

// Add event handlers
function addMatchEvent(eventType, notes = '') {
  const currentSeconds = getCurrentSeconds();
  const team1Name = elements.Team1NameElement.textContent;
  const team2Name = elements.Team2NameElement.textContent;

  const eventData = {
    timestamp: formatMatchTime(currentSeconds), // Use new format
    type: eventType,
    notes: notes,
    rawTime: currentSeconds
  };

 // Determine if this event is related to a specific team
 if (eventType.includes(team1Name)) {
  eventData.team = 1;
  eventData.teamName = team1Name;
 } else if (eventType.includes(team2Name)) {
  eventData.team = 2;
  eventData.teamName = team2Name;
 }

  if (eventType === 'Half Time') {
    const team1Score = elements.firstScoreElement.textContent;
    const team2Score = elements.secondScoreElement.textContent;
    eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
    eventData.team1Name = team1Name;
    eventData.team2Name = team2Name;

    // Handle half time transition
    handleHalfTime();
  }

  if (eventType === 'Full Time') {
    const team1Score = elements.firstScoreElement.textContent;
    const team2Score = elements.secondScoreElement.textContent;
    eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
    eventData.team1Name = team1Name;
    eventData.team2Name = team2Name;
    // Handle half time transition
    handleFullTime()
  }

  if (eventType === 'Incident' || eventType === 'Penalty' || eventType === 'Yellow Card' || eventType === 'Red Card' || eventType === 'Sin Bin' || eventType === 'Foul') {
    showNotification(`${eventType} recorded`, 'warning');
  } else {
    showNotification(`${eventType} recorded`, 'info');
  }

  STATE.matchEvents.push(eventData);
  updateLog();
  Storage.save(STORAGE_KEYS.MATCH_EVENTS, STATE.matchEvents);
}

function showRecordEventModal() {
  const recordEventModal = new bootstrap.Modal(document.getElementById('recordEventModal'));
  recordEventModal.show();
}

function showGoalModal() {
  // Capture the timestamp when the goal button is first clicked
  STATE.pendingGoalTimestamp = getCurrentSeconds();
  
  // Show the modal
  const goalModal = new bootstrap.Modal(document.getElementById('goalModal'));
  goalModal.show();
}

// Add Team Goal
function addGoal(event) {
  event.preventDefault();
  
  const goalScorerName = elements.goalScorer.value;
  const goalAssistName = elements.goalAssist.value;
  const currentSeconds = STATE.pendingGoalTimestamp || getCurrentSeconds(); // Use stored timestamp
  const team1Name = elements.Team1NameElement.textContent;
  
  const goalScorer = RosterManager.getPlayerByName(goalScorerName);
  const goalAssister = RosterManager.getPlayerByName(goalAssistName);

  const goalData = {
    timestamp: formatMatchTime(currentSeconds), // Use new format
    goalScorerName,
    goalScorerShirtNumber: goalScorer ? goalScorer.shirtNumber : null,
    goalAssistName,
    goalAssistShirtNumber: goalAssister ? goalAssister.shirtNumber : null,
    rawTime: currentSeconds,
    team: 1, // Indicate this is a team 1 goal
    teamName: team1Name // Store the current team name
  };
  
  // Reset the pending timestamp
  STATE.pendingGoalTimestamp = null;

  //update log
  STATE.data.push(goalData);
  updateLog();
  
  // update scoreboard
   updateScoreBoard('first');
   showNotification(`Goal scored by ${goalScorerName}!`, 'success');
  //Save to storage
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
    
  // Reset form
  elements.goalForm.reset();

  // Close the modal
  const goalModalElement = document.getElementById('goalModal');
  const goalModalInstance = bootstrap.Modal.getInstance(goalModalElement);
  if (goalModalInstance) {
      goalModalInstance.hide();
  }
}

// Add Opposition Goal
function opaddGoal() {
  const currentSeconds = getCurrentSeconds();
  const team2Name = elements.Team2NameElement.textContent;
  const opgoalData = {
    timestamp: formatMatchTime(currentSeconds), // Use new format
    goalScorerName: team2Name,
    goalAssistName: team2Name,
    rawTime: currentSeconds,
    team: 2, // Indicate this is a team 2 goal
    teamName: team2Name // Store the current team name
  };
  
  //update log
  STATE.data.push(opgoalData);
  updateLog();

// update scoreboard
updateScoreBoard('second');
showNotification(`Goal scored by ${team2Name}!`, 'danger');
  //save to storage
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
  
    // Reset form
  elements.goalForm.reset();
}

// Update Match Event Log
function updateLog() {

  // Get current team names
  const currentTeam1Name = elements.Team1NameElement.textContent;
  const currentTeam2Name = elements.Team2NameElement.textContent;

  // Create a single array with all events at once
  const allEvents = [
    ...STATE.data.map((event, index) => ({
      ...event,
      originalIndex: index,
      updatetype: 'goal'
    })),
    ...STATE.matchEvents.map((event, index) => ({
      ...event,
      originalIndex: index,
      updatetype: 'matchEvent'
    }))
  ].sort((a, b) => a.rawTime - b.rawTime);
  

  // Check if there are any events
  if (allEvents.length === 0) {
    elements.log.innerHTML = `
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

  // Use DocumentFragment for better performance when building DOM
  const fragment = document.createDocumentFragment();
  const timelineContainer = document.createElement('div');
  timelineContainer.className = 'timeline';

  allEvents.forEach((event, index) => {
    const timelineItemClass = index % 2 === 0 ? 'timeline-item-left' : 'timeline-item-right';
    const item = document.createElement('div');
    item.className = `timeline-item ${timelineItemClass}`;
    
    if (event.updatetype === 'matchEvent') {
      // Match event
      const cardClass = getEventCardClass(event.type);
      const icon = getEventIcon(event.type);
      
      // Use the stored team names if available, otherwise use current names
      let eventText = event.type;
      let scoreInfo = event.score ? ` (${event.score})` : '';

      // If the event has team-specific information, use the stored team names
      if (event.teamName) {
        // Replace any occurrences of old team names with current ones
        if (event.team === 1) {
          eventText = event.type.replace(event.teamName, currentTeam1Name);
        } else if (event.team === 2) {
          eventText = event.type.replace(event.teamName, currentTeam2Name);
        }
      }
      
      // If the event has score information, update team names in the score
      if (event.score && event.team1Name && event.team2Name) {
        scoreInfo = ` (${event.score.replace(event.team1Name, currentTeam1Name).replace(event.team2Name, currentTeam2Name)})`;
      }
      
      item.innerHTML = `
        <div class="timeline-marker"></div>
        <div class="timeline-content ${cardClass}">
          <div class="timeline-time">${event.timestamp}' - <strong>${eventText}</strong>${scoreInfo}</div>
          <div class="timeline-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="event-info d-flex align-items-center">
                <span class="event-icon me-2">${icon}</span>
                <p class="mb-0">${event.notes || ''}</p>
              </div>
              <div class="event-actions">
                <button class="btn btn-sm btn-outline-primary" 
                  onclick="openEditEventModal(${event.originalIndex}, '${event.updatetype}')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                  onclick="deleteLogEntry(${event.originalIndex}, 'event')" 
                  aria-label="Delete event">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Goal event
      const goalTeam = event.team || (event.goalScorerName === currentTeam2Name ? 2 : 1);
      const isOppositionGoal = goalTeam === 2;
      const displayTeamName = isOppositionGoal ? currentTeam2Name : currentTeam1Name;
      const cardClass = isOppositionGoal ? 'border-danger border-2' : 'border-success border-2';
      const markerClass = isOppositionGoal ? 'marker-danger' : 'marker-success';
      const disallowedClass = event.disallowed ? 'border-warning border-2' : cardClass;
      const disallowedMarker = event.disallowed ? 'marker-warning' : markerClass;
      const disallowedText = event.disallowed ? `<br><small class="text-warning"><strong>DISALLOWED:</strong> ${event.disallowedReason}</small>` : '';
      
      item.innerHTML = `
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
                   onclick="toggleGoalDisallowed(${event.originalIndex})" 
                   title="${event.disallowed ? 'Allow goal' : 'Disallow goal'}">
                  <i class="fas fa-${event.disallowed ? 'check' : 'ban'}"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary me-2" 
                   onclick="openEditEventModal(${event.originalIndex}, '${event.updatetype}')"
                   title="Edit goal">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger"
                  onclick="deleteLogEntry(${event.originalIndex}, 'goal')"
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
    
    timelineContainer.appendChild(item);
  });
  
  fragment.appendChild(timelineContainer);
  elements.log.innerHTML = '';
  elements.log.appendChild(fragment);
}

// Toggle goal disallowed status
function toggleGoalDisallowed(index) {
  const goal = STATE.data[index];
  if (goal.disallowed) {
    goal.disallowed = false;
    goal.disallowedReason = null;
  } else {
    const reason = prompt('Reason for disallowing goal:');
    if (reason) {
      goal.disallowed = true;
      goal.disallowedReason = reason;
    } else {
      return; // User cancelled
    }
  }
  
  // Recalculate scores
  const team2Name = elements.Team2NameElement.textContent;
  const teamGoals = STATE.data.filter(goal => !goal.disallowed && goal.goalScorerName !== team2Name).length;
  const oppositionGoals = STATE.data.filter(goal => !goal.disallowed && goal.goalScorerName === team2Name).length;
  
  elements.firstScoreElement.textContent = teamGoals;
  elements.secondScoreElement.textContent = oppositionGoals;
  
  Storage.save(STORAGE_KEYS.FIRST_SCORE, teamGoals);
  Storage.save(STORAGE_KEYS.SECOND_SCORE, oppositionGoals);
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
  
  updateLog();
  showNotification(goal.disallowed ? 'Goal disallowed' : 'Goal allowed', goal.disallowed ? 'warning' : 'success');
}

//Delete Log Entry
function deleteLogEntry(index, type) {
  if (type === 'goal') {
    STATE.data.splice(index, 1);
    Storage.save(STORAGE_KEYS.GOALS, STATE.data);
    
    // Recalculate score
    const team2Name = elements.Team2NameElement.textContent;
    const teamGoals = STATE.data.filter(goal => !goal.disallowed && goal.goalScorerName !== team2Name).length;
    const oppositionGoals = STATE.data.filter(goal => !goal.disallowed && goal.goalScorerName === team2Name).length;
    
    elements.firstScoreElement.textContent = teamGoals;
    elements.secondScoreElement.textContent = oppositionGoals;
    
    Storage.save(STORAGE_KEYS.FIRST_SCORE, teamGoals);
    Storage.save(STORAGE_KEYS.SECOND_SCORE, oppositionGoals);
  } else if (type === 'event') {
    STATE.matchEvents.splice(index, 1);
    Storage.save(STORAGE_KEYS.MATCH_EVENTS, STATE.matchEvents);
  }
  
  updateLog();
  showNotification('Entry deleted', 'danger');
}

// Open the Edit Event Modal
function openEditEventModal(index, type) {
  editingEventIndex = index;
  editingEventType = type;

  // Get the current event time
  const event = type === 'goal' ? STATE.data[index] : STATE.matchEvents[index];
  const currentMinutes = Math.floor(event.rawTime / 60);

  // Set the current time in the modal input
  document.getElementById('editEventTime').value = currentMinutes;

  // Show the modal
  const editEventModal = new bootstrap.Modal(document.getElementById('editEventModal'));
  editEventModal.show();
}

function handleEditEventFormSubmission(event) {
  event.preventDefault();

  // Get the new time from the input
  const newMinutes = parseInt(document.getElementById('editEventTime').value, 10);
  const newRawTime = newMinutes * 60;

  // Update the event time
  if (editingEventType === 'goal') {
    STATE.data[editingEventIndex].rawTime = newRawTime;
    STATE.data[editingEventIndex].timestamp = formatMatchTime(newRawTime);
  } else if (editingEventType === 'matchEvent') {
    STATE.matchEvents[editingEventIndex].rawTime = newRawTime;
    STATE.matchEvents[editingEventIndex].timestamp = formatMatchTime(newRawTime);
  }

  // Save the updated state to localStorage
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
  Storage.save(STORAGE_KEYS.MATCH_EVENTS, STATE.matchEvents);

  // Re-render the log
  updateLog();

  // Hide the modal
  const editEventModal = bootstrap.Modal.getInstance(document.getElementById('editEventModal'));
  editEventModal.hide();

  // Show a notification
  showNotification('Event time updated successfully!', 'success');
}

//Update Score Board Scores
function updateScoreBoard(scorecard) {
  if (scorecard === 'first') {
    const newScore = parseInt(elements.firstScoreElement.textContent) + 1;
    elements.firstScoreElement.textContent = newScore;
    Storage.save(STORAGE_KEYS.FIRST_SCORE, newScore);
  }
  if (scorecard === 'second') {
    const newScore = parseInt(elements.secondScoreElement.textContent) + 1;
    elements.secondScoreElement.textContent = newScore;
    Storage.save(STORAGE_KEYS.SECOND_SCORE, newScore);
  }
 }

//Update team names
function updatefixtureTeams(team,teamName) {
  if (team === 'first') {
    if (!STATE.team1History.includes(teamName)) {
      STATE.team1History.push(teamName);
      Storage.save(STORAGE_KEYS.TEAM1_HISTORY, STATE.team1History);
    }
    elements.Team1NameElement.textContent = teamName;
    elements.goalButton.lastChild.nodeValue = ' ' + teamName;
    Storage.save(STORAGE_KEYS.TEAM1_NAME, teamName);
    // Update input placeholder
    const team1Input = document.getElementById('team1Name');
    if (team1Input) team1Input.placeholder = teamName;
  }
  if (team === 'second') {
    if (!STATE.team2History.includes(teamName)) {
      STATE.team2History.push(teamName);
      Storage.save(STORAGE_KEYS.TEAM2_HISTORY, STATE.team2History);
    }
    elements.Team2NameElement.textContent = teamName;
    elements.opgoalButton.lastChild.nodeValue = ' ' + teamName;
    Storage.save(STORAGE_KEYS.TEAM2_NAME, teamName);
    // Update input placeholder
    const team2Input = document.getElementById('team2Name');
    if (team2Input) team2Input.placeholder = teamName;
  }

  // Update the timeline to reflect the new team names
  updateLog();

  showNotification(`Team name updated to ${teamName}`, 'success');
}

// Reset the tracker
function resetTracker() {
  // Reset state
  clearInterval(STATE.intervalId);
  STATE.seconds = 0;
  STATE.isRunning = false;
  STATE.data = [];
  STATE.startTimestamp = null;
  STATE.matchEvents = [];
  STATE.isSecondHalf = false;
  
  // Reset UI
  updateStopwatchDisplay(); // Ensures STATE.seconds (0) is saved
  updateLog();
  updateStartPauseButtonUI('Start Game', 'btn-danger', formatTime(0));

  // Reset scoreboard
  elements.firstScoreElement.textContent = '0';
  elements.secondScoreElement.textContent = '0';

   // Reset team history
   STATE.team1History = ['Netherton'];
   STATE.team2History = ['Opposition'];
   Storage.save(STORAGE_KEYS.TEAM1_HISTORY, STATE.team1History);
   Storage.save(STORAGE_KEYS.TEAM2_HISTORY, STATE.team2History);


  // Clear storage
  Storage.save(STORAGE_KEYS.IS_SECOND_HALF, false);
  Storage.clear();
  //redirect to main tab
  window.location.href = "index.html";
}

// Whatsapp Log Formatter
function formatLogForWhatsApp() {
  const gameTime = formatTime(STATE.seconds);
  const team1Name = elements.Team1NameElement.textContent;
  const team2Name = elements.Team2NameElement.textContent;
  const stats = generateStats();

  let gameResult = ' '
  if (stats.teamGoals == stats.oppositionGoals) {
    gameResult = 'DRAW'}
    else if (stats.teamGoals > stats.oppositionGoals) {
      gameResult = 'WIN'}
      else {gameResult = 'LOSS'}  

  const header = `⚽ Match Summary: ${team1Name} vs ${team2Name}\n ⌚ Game Time: ${gameTime}\n 🔢 Result: ${gameResult} (${stats.teamGoals} - ${stats.oppositionGoals}) \n\n`;

  const allEvents = [...STATE.data, ...STATE.matchEvents]
    .sort((a, b) => a.rawTime - b.rawTime)
    .map(event => {
      if (event.type) {
        // Match event
        const icon = getEventIcon(event.type);
        return `${icon} ${event.timestamp} - ${event.type}${event.score ? ` (${event.score})` : ''}`;
      } else {
        // Goal event (existing logic)
        const isOppositionGoal = event.goalScorerName === team2Name;
        const disallowedText = event.disallowed ? ` (DISALLOWED: ${event.disallowedReason})` : '';
        return isOppositionGoal 
          ? `🥅 ${event.timestamp}' - ${team2Name} Goal${disallowedText}`
          : `🥅 ${event.timestamp}' - Goal: ${event.goalScorerName}, Assist: ${event.goalAssistName}${disallowedText}`;
      }
    })
    .join('\n');
    
  //const stats = generateStats();
  return encodeURIComponent(`${header}${allEvents}\n\n${stats.statsstring}`);
}

// Whatsapp statistics summary 
function generateStats() {
  const stats = new Map();
  const goalScorers = new Map();
  const assists = new Map();
  let oppositionGoals = 0;
  let teamGoals = 0;

// Add a check if STATE.data is empty
if (STATE.data && STATE.data.length > 0) {
  STATE.data.forEach(({ goalScorerName, goalAssistName, disallowed }) => {
    // Skip disallowed goals
    if (disallowed) return;
    
    // Check if the goal scorer matches any historical team 2 name
    if (STATE.team2History.includes(goalScorerName)) {
      oppositionGoals++;
    } else if (STATE.team1History.includes(goalScorerName) || goalScorerName) {
      // Exclude 'N/A' and empty entries
      if (goalScorerName && goalScorerName.trim() !== '' && goalScorerName !== 'N/A') {
        // Count goals for team 1 (includes goals by individual players)
        teamGoals++;
        goalScorers.set(goalScorerName, (goalScorers.get(goalScorerName) || 0) + 1);
      }

      // Handle assists, excluding 'N/A' and empty entries
      if (goalAssistName && goalAssistName.trim() !== '' && goalAssistName !== 'N/A') {
        assists.set(goalAssistName, (assists.get(goalAssistName) || 0) + 1);
      }
    }
  });
}

  // Get current team names for the report
  const team1Name = elements.Team1NameElement.textContent;
  const team2Name = elements.Team2NameElement.textContent;

  
  // Sort goal scorers and assists by number of goals/assists in descending order
  const sortedScorers = Array.from(goalScorers.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, goals]) => `${name}: ${goals}`);
  
  const sortedAssists = Array.from(assists.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, assistCount]) => `${name}: ${assistCount}`);

  // Prepare stats string with full lists
  const scorersString = sortedScorers.length > 0 
    ? sortedScorers.join('\n')
    : 'None';
  
  const assistsString = sortedAssists.length > 0
    ? sortedAssists.join('\n')
    : 'None';
  
    return {
      statsstring: `📊 Stats:\nTeam Goals: ${teamGoals}\nOpposition Goals: ${oppositionGoals}\n\n🥅 Team Goal Scorers:\n${scorersString}\n\n🤝 Team Assists:\n${assistsString}`,
      teamGoals: teamGoals,
      oppositionGoals: oppositionGoals
    };
}

// Share to WhatsApp function
function shareToWhatsApp() {
  if (STATE.data.length === 0) {
        showNotification('No goals to share yet!', 'info');
    return;
  }
  const formattedLog = formatLogForWhatsApp();
  const whatsappURL = `https://wa.me/?text=${formattedLog}`;
  window.open(whatsappURL, '_blank');
}

// include README.MD as release notes
function fetchReadme() {
  fetch('README.md')
      .then(response => response.text())
      .then(text => {
          // Simple markdown to HTML conversion for basic elements
          const html = text
          document.getElementById('readme').innerHTML = html;
      })
      .catch(error => {
          console.error('Error loading README:', error);
          document.getElementById('readme').innerHTML = 'Error loading README file.';
      });
}

// Event Helper functions
function getEventCardClass(eventType) {
  switch(eventType) {
    case 'Half Time':
    case 'Full Time':
      return 'border-secondary border-2';
    case 'Incident':
    case 'Penalty':
    case 'Yellow Card':
    case 'Red Card':
    case 'Sin Bin':
    case 'Foul':
      return 'border-warning border-2';
    default:
      return 'border-secondary border-2';
  }
}

// Add CSS classes for disallowed goals
function addDisallowedStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .marker-warning { background-color: #ffc107 !important; }
  `;
  document.head.appendChild(style);
}

function getEventIcon(eventType) {
  switch(eventType) {
    case 'Half Time':
      return '⏸️';
    case 'Full Time':
      return '🏁';
    case 'Foul':
      return '⚠️';
    case 'Penalty':
      return '🥅';
    case 'Yellow Card':
      return '<div style="width: 1rem; height: 1.25rem; background-color: yellow; border: 1px solid black;"></div>';
    case 'Red Card':
      return '<div style="width: 1rem; height: 1.25rem; background-color: red; border: 1px solid black;"></div>';
    case 'Sin Bin':
      return '⏳';
    default:
      return '📝';
  }
}

// notification helper
function showNotification(message, type = 'success') {
  const container = document.getElementById('notification-container');
  
  // Remove any existing notifications
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // Trigger slide down animation
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });
  
  // Start fade out
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-100%)';
  }, 2000);
  
  // Remove the element after animation
  setTimeout(() => {
    if (container.contains(notification)) {
      container.removeChild(notification);
    }
  }, 2300);
}

// Handle URL parameters for notifications
function handleRedirectParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const feedbackStatus = urlParams.get('feedback');
  
  if (feedbackStatus === 'success') {
      showNotification('Thank you for your feedback! Your form has been sent.', 'success');
      
      // Close the modal if it's still open
      const feedbackModal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
      if (feedbackModal) {
          feedbackModal.hide();
      }
      
      // Reset the form
      const feedbackForm = document.getElementById('feedbackForm');
      if (feedbackForm) {
          feedbackForm.reset();
      }
  }
  
  // Clean up URL after showing notification
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Initialize application
function initializeApp() {
	
  // Initialize roster
  RosterManager.init();
  addDisallowedStyles();
  let resetModal;
	
  // Load saved data
  STATE.isRunning = Storage.load(STORAGE_KEYS.IS_RUNNING, false);
  STATE.startTimestamp = Storage.load(STORAGE_KEYS.START_TIMESTAMP, null);
  STATE.seconds = Storage.load(STORAGE_KEYS.ELAPSED_TIME, 0);
  STATE.data = Storage.load(STORAGE_KEYS.GOALS, []);
  STATE.matchEvents = Storage.load(STORAGE_KEYS.MATCH_EVENTS, []);

  // Load saved scores
  const firstScore = Storage.load(STORAGE_KEYS.FIRST_SCORE, 0);
  const secondScore = Storage.load(STORAGE_KEYS.SECOND_SCORE, 0);
  elements.firstScoreElement.textContent = firstScore;
  elements.secondScoreElement.textContent = secondScore;

  // Load saved team names
  const team1Name = Storage.load(STORAGE_KEYS.TEAM1_NAME, 'Netherton');
  const team2Name = Storage.load(STORAGE_KEYS.TEAM2_NAME, 'Opposition');
  STATE.team1History = Storage.load(STORAGE_KEYS.TEAM1_HISTORY, ['Netherton']);
  STATE.team2History = Storage.load(STORAGE_KEYS.TEAM2_HISTORY, ['Opposition']);
  elements.Team1NameElement.textContent = team1Name;
  elements.Team2NameElement.textContent = team2Name;

  elements.goalButton.lastChild.nodeValue =  ' ' + team1Name;
  elements.opgoalButton.lastChild.nodeValue =  ' ' + team2Name;

    // Load saved game time
    const defaultGameTime = elements.gameTimeSelect.querySelector('option[selected]')?.value || elements.gameTimeSelect.value;
    STATE.gameTime = Storage.load(STORAGE_KEYS.GAME_TIME, parseInt(defaultGameTime));
    STATE.isSecondHalf = Storage.load(STORAGE_KEYS.IS_SECOND_HALF, false);
    elements.gameTimeSelect.value = STATE.gameTime;

  // Update input placeholders
  const team1Input = document.getElementById('team1Name');
  const team2Input = document.getElementById('team2Name');
  if (team1Input) team1Input.placeholder = team1Name;
  if (team2Input) team2Input.placeholder = team2Name;
  
  // If timer was running, calculate elapsed time and let startStopwatch handle UI
  if (STATE.isRunning && STATE.startTimestamp) {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - STATE.startTimestamp) / 1000);
      STATE.seconds = elapsedSeconds;
      // startStopwatch will call updateStartPauseButtonUI with 'Game in Progress'
      startStopwatch();
  } else {
      // Timer is not running. STATE.seconds has its loaded value.
      if (STATE.seconds > 0) { // Game was paused
          updateStartPauseButtonUI('Game is Paused', 'btn-danger', formatTime(STATE.seconds));
      } else { // Game was not started or was reset
          updateStartPauseButtonUI('Start Game', 'btn-danger', formatTime(0));
      }
  }

  // updateStopwatchDisplay will ensure the time in the span is accurate and state is saved.
  updateStopwatchDisplay();
  updateLog();
  fetchReadme();

}

// Event Listeners
elements.startPauseButton.addEventListener('click', startStopwatch);
elements.goalForm.addEventListener('submit', addGoal);
elements.opgoalButton.addEventListener('click', opaddGoal);
elements.resetButton.addEventListener('click', resetTracker);
elements.shareButton.addEventListener('click', shareToWhatsApp);
document.addEventListener('DOMContentLoaded', initializeApp);
document.getElementById('HalfTimeButton').addEventListener('click', () => addMatchEvent('Half Time'));
document.getElementById('FullTimeButton').addEventListener('click', () => addMatchEvent('Full Time'));
document.getElementById('recordEventForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const eventType = document.getElementById('eventTypeSelect').value;
  const eventNotes = document.getElementById('eventNotes').value;
  addMatchEvent(eventType, eventNotes);
  const recordEventModal = bootstrap.Modal.getInstance(document.getElementById('recordEventModal'));
  recordEventModal.hide();
  document.getElementById('recordEventForm').reset();
});
elements.gameTimeSelect.addEventListener('change', handleGameTimeChange);
document.getElementById('editEventForm').addEventListener('submit', handleEditEventFormSubmission);

  // Update Team 1 button click handler
  elements.updTeam1Btn.addEventListener('click', () => {
    const newTeamName = elements.team1Input.value.trim();
    if (newTeamName) {
      updatefixtureTeams('first', newTeamName);
      elements.team1Input.value = '';
      // Close the modal using Bootstrap's modal instance
      const modal = bootstrap.Modal.getInstance(document.getElementById('fixtureModalTeam1'));
      modal.hide();
    }
  });

  // Update Team 2 button click handler
  elements.updTeam2Btn.addEventListener('click', () => {
    const newTeamName = elements.team2Input.value.trim();
    if (newTeamName) {
      updatefixtureTeams('second', newTeamName);
      elements.team2Input.value = '';
      // Close the modal using Bootstrap's modal instance
      const modal = bootstrap.Modal.getInstance(document.getElementById('fixtureModalTeam2'));
      modal.hide();
    }
  });


// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && STATE.isRunning) {
    updateStopwatchDisplay();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Check for redirect parameters
  handleRedirectParams();
  
  // Set up the _next URL dynamically
  const feedbackForm = document.querySelector('#feedbackModal form');
  if (feedbackForm) {
      const nextInput = feedbackForm.querySelector('input[name="_next"]');
      if (nextInput) {
          // Get the current URL and add the success parameter
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('feedback', 'success');
          nextInput.value = currentUrl.toString();
      }
  }
});
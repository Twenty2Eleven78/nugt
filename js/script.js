/**
 * Netherton United Game Time App (NUGT)
 * 
 * @description A web application for tracking football match events, goals, and statistics
 * @version 3.2.0
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
  gameTime: 3600, // Default 60 minutes in seconds
  isSecondHalf: false,
  team1History: ['Netherton'], // Initialize with default name
  team2History: ['Opposition'], // Initialize with default name
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
  
  //Change running style
  startPauseButton.classList.remove('btn-danger');
  startPauseButton.classList.add('btn-success');
  startPauseButton.textContent = 'Game in Progress';
  // Add text back
  const currentSeconds = getCurrentSeconds();
  const timeSpan = document.createElement('span');
  timeSpan.id = 'stopwatch';
  timeSpan.className = 'timer-badge';
  timeSpan.textContent = formatTime(currentSeconds);
  startPauseButton.appendChild(timeSpan);
  showNotification('Game Started!', 'success');
  } else {
    //Change running style
    startPauseButton.classList.remove('btn-sucess');
    startPauseButton.classList.add('btn-danger');
    startPauseButton.textContent = 'Game is Paused';
    const currentSeconds = getCurrentSeconds();
    const timeSpan = document.createElement('span');
    timeSpan.id = 'stopwatch';
    timeSpan.className = 'timer-badge';
    timeSpan.textContent = formatTime(currentSeconds);
    startPauseButton.appendChild(timeSpan);
    // Pausing the timer
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
    // Update UI
    startPauseButton.classList.remove('btn-success');
    startPauseButton.classList.add('btn-danger');
    startPauseButton.textContent = 'Half Time Break';
    const timeSpan = document.createElement('span');
    timeSpan.id = 'stopwatch';
    timeSpan.className = 'timer-badge';
    timeSpan.textContent = formatTime(halfTimeSeconds);
    startPauseButton.appendChild(timeSpan);
    clearInterval(STATE.intervalId);
    
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
    // Update UI
    startPauseButton.classList.remove('btn-success');
    startPauseButton.classList.add('btn-danger');
    startPauseButton.textContent = 'Full Time';
    const timeSpan = document.createElement('span');
    timeSpan.id = 'stopwatch';
    timeSpan.className = 'timer-badge';
    startPauseButton.appendChild(timeSpan);
    clearInterval(STATE.intervalId);
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
function addMatchEvent(eventType) {
  const currentSeconds = getCurrentSeconds();
  const team1Name = elements.Team1NameElement.textContent;
  const team2Name = elements.Team2NameElement.textContent;

  const eventData = {
    timestamp: formatMatchTime(currentSeconds), // Use new format
    type: eventType,
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

  if (eventType === 'Incident' || eventType === 'Penalty') {
  showNotification(`${eventType} recorded`, 'warning');
  }
  else {
  showNotification(`${eventType} recorded`, 'info');
  }

  STATE.matchEvents.push(eventData);
  updateLog();
  Storage.save(STORAGE_KEYS.MATCH_EVENTS, STATE.matchEvents);
}

// Add Team Goal
function addGoal(event) {
  event.preventDefault();
  
  const goalScorerName = elements.goalScorer.value;
  const goalAssistName = elements.goalAssist.value;
  const currentSeconds = getCurrentSeconds();
  const team1Name = elements.Team1NameElement.textContent;
  
  const goalData = {
    timestamp: formatMatchTime(currentSeconds), // Use new format
    goalScorerName,
    goalAssistName,
    rawTime: currentSeconds,
    team: 1, // Indicate this is a team 1 goal
    teamName: team1Name // Store the current team name
  };
  
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

// Goal Modal Auto close
function closeGoalModal() {
  document.getElementById('goalModalClose').click();
  return false;
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
          <div class="timeline-time">${event.timestamp}'</div>
          <div class="timeline-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>${icon} <strong>${eventText}</strong>${scoreInfo}</div>
              <button class="btn btn-sm btn-outline-danger" 
                onclick="deleteLogEntry(${event.originalIndex}, 'event')" 
                aria-label="Delete event">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Goal event
      // Use the stored team information if available
      const goalTeam = event.team || (event.goalScorerName === currentTeam2Name ? 2 : 1);
      const isOppositionGoal = goalTeam === 2;
      
      // Get the correct team name to display
      const displayTeamName = isOppositionGoal ? currentTeam2Name : currentTeam1Name;
      
      const cardClass = isOppositionGoal ? 'border-danger border-2' : 'border-success border-2';
      const markerClass = isOppositionGoal ? 'marker-danger' : 'marker-success';
      
      item.innerHTML = `
        <div class="timeline-marker ${markerClass}"></div>
        <div class="timeline-content ${cardClass}">
          <div class="timeline-time">${event.timestamp}'</div>
          <div class="timeline-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>${isOppositionGoal ? `<font color="red"><i class="fa-regular fa-futbol"></i> Goal: ${displayTeamName}</font>` : `<font color="green"><i class="fa-regular fa-futbol"></i> Goal: ${displayTeamName}</font>`}</strong>
                ${isOppositionGoal ? '' : `<br><small><strong>Scored By: </strong>${event.goalScorerName}, <strong>Assisted By:</strong> ${event.goalAssistName}</small>`}
              </div>
              <button class="btn btn-sm btn-outline-danger" 
                onclick="deleteLogEntry(${event.originalIndex}, 'goal')" 
                aria-label="Delete goal">
                <i class="fas fa-trash"></i>
              </button>
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

//Delete Log Entry
function deleteLogEntry(index, type) {
  if (type === 'goal') {
    STATE.data.splice(index, 1);
    Storage.save(STORAGE_KEYS.GOALS, STATE.data);
    
    // Recalculate score
    const team2Name = elements.Team2NameElement.textContent;
    const teamGoals = STATE.data.filter(goal => goal.goalScorerName !== team2Name).length;
    const oppositionGoals = STATE.data.filter(goal => goal.goalScorerName === team2Name).length;
    
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
    elements.goalButton.innerHTML  ="GOAL " + teamName;
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
    elements.opgoalButton.innerHTML ="GOAL " + teamName;
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
  updateStopwatchDisplay();
  updateLog();
  startPauseButton.classList.remove('btn-sucess');
  startPauseButton.classList.add('btn-danger');
  startPauseButton.textContent = 'Start Game';
  const timeSpan = document.createElement('span');
  timeSpan.id = 'stopwatch';
  timeSpan.className = 'timer-badge';
  timeSpan.textContent = "00:00";
  startPauseButton.appendChild(timeSpan);

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
        return isOppositionGoal 
          ? `🥅 ${event.timestamp}' - ${team2Name} Goal`
          : `🥅 ${event.timestamp}' - Goal: ${event.goalScorerName}, Assist: ${event.goalAssistName}`;
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
    STATE.data.forEach(({ goalScorerName, goalAssistName }) => {
      // Check if the goal scorer matches any historical team 2 name
      if (STATE.team2History.includes(goalScorerName)) {
        oppositionGoals++;
      } else if (STATE.team1History.includes(goalScorerName) || goalScorerName) {
        // Count goals for team 1 (includes goals by individual players)
        teamGoals++;
        goalScorers.set(goalScorerName, (goalScorers.get(goalScorerName) || 0) + 1);
        if (goalAssistName) {
          assists.set(goalAssistName, (assists.get(goalAssistName) || 0) + 1);
        }
      }
    });
  }

    // Get current team names for the report
    const team1Name = elements.Team1NameElement.textContent;
    const team2Name = elements.Team2NameElement.textContent;

  
  const topScorers = goalScorers.size > 0 
    ? Array.from(goalScorers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, goals]) => `${name}: ${goals}`)
        .join(', ')
    : 'None';
  
  const topAssists = assists.size > 0
    ? Array.from(assists.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, assists]) => `${name}: ${assists}`)
        .join(', ')
    : 'None';
  
  return {
    statsstring: `📊 Stats:\nTeam Goals: ${teamGoals}\nOpposition Goals: ${oppositionGoals}\n Team Top Scorers: ${topScorers}\n Team Top Assists: ${topAssists}`,
    teamGoals: teamGoals,
    oppositionGoals: oppositionGoals
  };
}

// Share to WhatsApp function
function shareToWhatsApp() {
  if (STATE.data.length === 0) {
    M.toast({html: 'No goals to share yet!'});
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
      return 'border-warning border-2';
    default:
      return 'border-secondary border-2';
  }
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
      return '⚠️';
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
  const icon = elements.opgoalButton.querySelector('i')

 

  elements.goalButton.innerHTML =  "GOAL " + team1Name;
  elements.opgoalButton.innerHTML =  "GOAL " + team2Name;

    // Load saved game time
    STATE.gameTime = Storage.load(STORAGE_KEYS.GAME_TIME, 3600);
    STATE.isSecondHalf = Storage.load(STORAGE_KEYS.IS_SECOND_HALF, false);
    elements.gameTimeSelect.value = STATE.gameTime;

  // Update input placeholders
  const team1Input = document.getElementById('team1Name');
  const team2Input = document.getElementById('team2Name');
  if (team1Input) team1Input.placeholder = team1Name;
  if (team2Input) team2Input.placeholder = team2Name;
  
  // If timer was running, calculate elapsed time and restart
  if (STATE.isRunning && STATE.startTimestamp) {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - STATE.startTimestamp) / 1000);
    STATE.seconds = elapsedSeconds;
    startStopwatch();
  }
 
  // Update UI with saved data
  updateStopwatchDisplay();
  updateLog();

}

// Event Listeners
elements.startPauseButton.addEventListener('click', startStopwatch);
elements.goalForm.addEventListener('submit', addGoal);
elements.opgoalButton.addEventListener('click', opaddGoal);
elements.resetButton.addEventListener('click', resetTracker);
elements.shareButton.addEventListener('click', shareToWhatsApp);
document.addEventListener('DOMContentLoaded', initializeApp);
document.addEventListener('DOMContentLoaded', fetchReadme);
document.getElementById('HalfTimeButton').addEventListener('click', () => addMatchEvent('Half Time'));
document.getElementById('FullTimeButton').addEventListener('click', () => addMatchEvent('Full Time'));
document.getElementById('IncidentButton').addEventListener('click', () => addMatchEvent('Incident'));
document.getElementById('PenaltyButton').addEventListener('click', () => addMatchEvent('Penalty'));
elements.gameTimeSelect.addEventListener('change', handleGameTimeChange);

  // Update Team 1 button click handler
  elements.updTeam1Btn.addEventListener('click', () => {
    const newTeamName = elements.team1Input.value.trim();
    if (newTeamName) {
      updatefixtureTeams('first', newTeamName);
      elements.team1Input.value = '';
    }
  });

  // Update Team 2 button click handler
  elements.updTeam2Btn.addEventListener('click', () => {
    const newTeamName = elements.team2Input.value.trim();
    if (newTeamName) {
      updatefixtureTeams('second', newTeamName);
      elements.team2Input.value = '';
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
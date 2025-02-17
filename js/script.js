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
  IS_SECOND_HALF: 'nugt_isSecondHalf'     
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
  const eventData = {
    timestamp: formatMatchTime(currentSeconds), // Use new format
    type: eventType,
    rawTime: currentSeconds
  };

  if (eventType === 'Half Time') {
    const team1Score = elements.firstScoreElement.textContent;
    const team2Score = elements.secondScoreElement.textContent;
    const team1Name = elements.Team1NameElement.textContent;
    const team2Name = elements.Team2NameElement.textContent;
    eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;

    // Handle half time transition
    handleHalfTime();
  }

  if (eventType === 'Full Time') {
    const team1Score = elements.firstScoreElement.textContent;
    const team2Score = elements.secondScoreElement.textContent;
    const team1Name = elements.Team1NameElement.textContent;
    const team2Name = elements.Team2NameElement.textContent;
    eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
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
  
  const goalData = {
    timestamp: formatMatchTime(currentSeconds), // Use new format
    goalScorerName,
    goalAssistName,
    rawTime: currentSeconds
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
    rawTime: currentSeconds
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

function closeGoalModal() {
  document.getElementById('goalModalClose').click();
  return false;
}

// Update Goal Log
function updateLog() {

  // Create separate arrays for each type with their original indices
  const goalEntries = STATE.data.map((event, index) => ({
    ...event,
    originalIndex: index,
    updatetype: 'goal'
  }));
  
  const eventEntries = STATE.matchEvents.map((event, index) => ({
    ...event,
    originalIndex: index,
    updatetype: 'matchEvent'
  }));


  const allEvents = [...goalEntries, ...eventEntries]
    .sort((a, b) => a.rawTime - b.rawTime)
    .map(event => {
      if (event.updatetype === 'matchEvent') {
        // Match event
        const cardClass = getEventCardClass(event.type);
        const icon = getEventIcon(event.type);
        const scoreInfo = event.score ? ` (${event.score})` : '';
        return `<div class="card mb-2 ${cardClass}">
          <div class="card-body p-2 d-flex justify-content-between align-items-center">
            <div>
              <span>${event.timestamp}'</span> - ${icon} <strong>${event.type}</strong>${scoreInfo}
            </div>
            <button class="btn btn-sm btn-outline-danger" 
              onclick="deleteLogEntry(${event.originalIndex}, 'event')" 
              aria-label="Delete event">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
      } else {
        // Goal event (existing logic)
        const team2Name = elements.Team2NameElement.textContent;
        const isOppositionGoal = event.goalScorerName === team2Name || event.goalScorerName === 'Opposition Team';
        const cardClass = isOppositionGoal ? 'border-danger border-2' : 'border-success border-2';
        
        return `<div class="card mb-2 ${cardClass}">
          <div class="card-body p-2 d-flex justify-content-between align-items-center">
            <div>
              <span>${event.timestamp}'</span> - 
              <strong>${isOppositionGoal ? `<font color="red"> ${team2Name} Goal</font>` : 'Goal:'}</strong>
              ${isOppositionGoal ? '' : ` ${event.goalScorerName}, <strong>Assist:</strong> ${event.goalAssistName}`}
            </div>
            <button class="btn btn-sm btn-outline-danger" 
              onclick="deleteLogEntry(${event.originalIndex}, 'goal')" 
              aria-label="Delete goal">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
      }
    })
    .join('');
    
  elements.log.innerHTML = allEvents;
}

//
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

//Update Score Board Teams
function updatefixtureTeams(team,teamName) {
  if (team === 'first') {
    elements.Team1NameElement.textContent = teamName;
    const icon = elements.opgoalButton.querySelector('i');
    elements.goalButton.innerHTML  = icon.outerHTML + "Goal " + teamName;
    Storage.save(STORAGE_KEYS.TEAM1_NAME, teamName);
    // Update input placeholder
    const team1Input = document.getElementById('team1Name');
    if (team1Input) team1Input.placeholder = teamName;
  }
  if (team === 'second') {
    elements.Team2NameElement.textContent = teamName;
    const icon = elements.opgoalButton.querySelector('i');
    elements.opgoalButton.innerHTML = icon.outerHTML + "Goal " + teamName;
    Storage.save(STORAGE_KEYS.TEAM2_NAME, teamName);
    // Update input placeholder
    const team2Input = document.getElementById('team2Name');
    if (team2Input) team2Input.placeholder = teamName;
  }
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
  let teamGoals = stats.teamGoals;
  let oppositionGoals = stats.oppositionGoals;

  let gameResult = ' '
  if (stats.teamGoals == stats.oppositionGoals) {
    gameResult = 'DRAW'}
    else if (stats.teamGoals > stats.oppositionGoals) {
      gameResult = 'WIN'}
      else {gameResult = 'LOSS'}  

      console.log(gameResult)
      console.log(stats.teamGoals)
      console.log(stats.oppositionGoals)

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
  // Count goals
  const goalScorers = new Map();
  const assists = new Map();
  let oppositionGoals = 0;  // Initialize opposition goals counter
  let teamGoals = 0;       // Initialize team goals counter
  
// Add a check if STATE.data is empty
if (STATE.data && STATE.data.length > 0) {
  STATE.data.forEach(({ goalScorerName, goalAssistName }) => {
    if (goalScorerName === "Opposition Team") {
      oppositionGoals++;
    } else if (goalScorerName) { // Check if goalScorerName exists
      teamGoals++;
      goalScorers.set(goalScorerName, (goalScorers.get(goalScorerName) || 0) + 1);
      if (goalAssistName) {
        assists.set(goalAssistName, (assists.get(goalAssistName) || 0) + 1);
      }
    }
  });
}
  // Calculate total team goals directly from the counter
  const totalTeamGoals = teamGoals;
  
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
        statsstring:  `📊 Stats:\nTeam Goals: ${totalTeamGoals}\nOpposition Goals: ${oppositionGoals}\nTop Scorers: ${topScorers}\nTop Assists: ${topAssists}`,
        teamGoals: totalTeamGoals,
        oppositionGoals: oppositionGoals
  }
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
      showNotification('Thank you for your feedback! We really appriciate your input.', 'success');
      
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
  const team2Name = Storage.load(STORAGE_KEYS.TEAM2_NAME, 'Opposition Team');
  elements.Team1NameElement.textContent = team1Name;
  elements.Team2NameElement.textContent = team2Name;
  const icon = elements.opgoalButton.querySelector('i')

  elements.goalButton.innerHTML = icon.outerHTML + "Goal " + team1Name;
  elements.opgoalButton.innerHTML = icon.outerHTML + "Goal " + team2Name;

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

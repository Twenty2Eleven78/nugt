// State management
const STATE = {
  seconds: 0,
  isRunning: false,
  intervalId: null,
  data: [],
  startTimestamp: null
};
 
// DOM Elements
const elements = {
  stopwatch: document.getElementById('stopwatch'),
  startPauseButton: document.getElementById('startPauseButton'),
  goalButton: document.getElementById('goalButton'),
  opgoalButton: document.getElementById('opgoalButton'),
  goalScorer: document.getElementById('goalScorer'),
  goalAssist: document.getElementById('goalAssist'),
  resetButton: document.getElementById('resetButton'),
  shareButton: document.getElementById('shareButton'),
  log: document.getElementById('log'),
  goalForm: document.getElementById('goalForm')
};

// Constants
const STORAGE_KEYS = {
  START_TIMESTAMP: 'goalTracker_startTimestamp',
  IS_RUNNING: 'goalTracker_isRunning',
  GOALS: 'goalTracker_goals',
  ELAPSED_TIME: 'goalTracker_elapsedTime'
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
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs]
    .map(num => num.toString().padStart(2, '0'))
    .join(':');
}

function getCurrentSeconds() {
  if (!STATE.isRunning || !STATE.startTimestamp) return STATE.seconds;
  
  const currentTime = Date.now();
  const elapsedSeconds = Math.floor((currentTime - STATE.startTimestamp) / 1000);
  return elapsedSeconds;
}

// Stopwatch controls
function updateStopwatchDisplay() {
  const currentSeconds = getCurrentSeconds();
  elements.stopwatch.textContent = formatTime(currentSeconds);
  STATE.seconds = currentSeconds;
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, currentSeconds);
}

function startStopwatch() {
  if (!STATE.isRunning) {
    // Starting the timer
    STATE.isRunning = true;
    if (!STATE.startTimestamp) {
      STATE.startTimestamp = Date.now() - (STATE.seconds * 1000);
    }
    STATE.intervalId = setInterval(updateStopwatchDisplay, 100);
  } else {
    // Pausing the timer
    clearInterval(STATE.intervalId);
    STATE.isRunning = false;
    STATE.seconds = getCurrentSeconds();
    STATE.startTimestamp = null;
  }
  
  // Update UI and save state
  elements.startPauseButton.textContent = STATE.isRunning ? "Pause" : "Start";
  Storage.save(STORAGE_KEYS.IS_RUNNING, STATE.isRunning);
  Storage.save(STORAGE_KEYS.START_TIMESTAMP, STATE.startTimestamp);
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, STATE.seconds);
}

// Goal tracking
function addGoal(event) {
  event.preventDefault();
  
  const goalScorerName = elements.goalScorer.value;
  const goalAssistName = elements.goalAssist.value;
  
  if (!goalScorerName || !goalAssistName) {
    M.toast({html: 'Please select both scorer and assistant'});
    return;
  }
  
  const currentSeconds = getCurrentSeconds();
  const goalData = {
    timestamp: formatTime(currentSeconds),
    goalScorerName,
    goalAssistName,
    rawTime: currentSeconds
  };
  
  STATE.data.push(goalData);
  updateLog();
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
  
  // Reset form and update Materialize select
  elements.goalForm.reset();
  M.FormSelect.init(elements.goalScorer);
  M.FormSelect.init(elements.goalAssist);
}

function opaddGoal() {
  const currentSeconds = getCurrentSeconds();
  const opgoalData = {
    timestamp: formatTime(currentSeconds),
    goalScorerName: "Opposition Team",
    goalAssistName: "Opposition Team",
    rawTime: currentSeconds
  };
  
  STATE.data.push(opgoalData);
  updateLog();
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
  
    // Reset form and update Materialize select
  elements.goalForm.reset();
  M.FormSelect.init(elements.goalScorer);
  M.FormSelect.init(elements.goalAssist);
}

function updateLog() {
  elements.log.innerHTML = STATE.data
    .sort((a, b) => a.rawTime - b.rawTime)
    .map(({ timestamp, goalScorerName, goalAssistName }) => {
      const isOppositionGoal = goalScorerName === "Opposition Team";
      const cardClass = isOppositionGoal ? 'red lighten-4' : ''; // Add red background for opposition goals
      
      return `<div class="card-panel ${cardClass}">
        <span class="blue-text text-darken-2">${timestamp}</span>: 
        <strong>${isOppositionGoal ? 'Opposition Goal' : 'Goal'}</strong>
        ${isOppositionGoal ? '' : `: ${goalScorerName}, <strong>Assist:</strong> ${goalAssistName}`}
       </div>`;
    })
    .join('');
}

function resetTracker() {
  if (!confirm('Are you sure you want to reset the stopwatch and log data?')) {
    return;
  }
  
  // Reset state
  clearInterval(STATE.intervalId);
  STATE.seconds = 0;
  STATE.isRunning = false;
  STATE.data = [];
  STATE.startTimestamp = null;
  
  // Reset UI
  updateStopwatchDisplay();
  updateLog();
  elements.startPauseButton.textContent = "Start";
  
  // Clear storage
  Storage.clear();
}

function formatLogForWhatsApp() {
  const gameTime = formatTime(STATE.seconds);
  const header = `⚽ Match Summary (Time: ${gameTime})\n\n`;
  
  const goals = STATE.data
    .sort((a, b) => a.rawTime - b.rawTime)
    .map(({ timestamp, goalScorerName, goalAssistName }) => {
      const isOppositionGoal = goalScorerName === "Opposition Team";
      return isOppositionGoal 
        ? `❌ ${timestamp} - Opposition Goal`
        : `🥅 ${timestamp} - Goal: ${goalScorerName}, Assist: ${goalAssistName}`;
    })
    .join('\n');
    
  const stats = generateStats();
  return encodeURIComponent(`${header}${goals}\n\n${stats}`);
}

// Generate statistics summary
function generateStats() {
  const stats = new Map();
  // Count goals
  const goalScorers = new Map();
  const assists = new Map();
  let oppositionGoals = 0;  // Initialize opposition goals counter
  let teamGoals = 0;       // Initialize team goals counter
  
  STATE.data.forEach(({ goalScorerName, goalAssistName }) => {
   if (goalScorerName === "Opposition Team") {
      oppositionGoals++;
    } else {
		teamGoals++;
      goalScorers.set(goalScorerName, (goalScorers.get(goalScorerName) || 0) + 1);
      if (goalAssistName) {
        assists.set(goalAssistName, (assists.get(goalAssistName) || 0) + 1);
      }
    }
  });
  
  const topScorers = Array.from(goalScorers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, goals]) => `${name}: ${goals}`)
    .join(', ');
    
  const topAssists = Array.from(assists.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, assists]) => `${name}: ${assists}`)
    .join(', ');
  
  return `📊 Stats:\nTeam Goals: ${goalScorers.size > 0 ? Array.from(goalScorers.values()).reduce((a, b) => a + b) : 0}\nOpposition Goals: ${oppositionGoals}\nTop Scorers: ${topScorers}\nTop Assists: ${topAssists}`;
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

// Initialize application
function initializeApp() {
	
	  // Initialize Materialize Modal and Form Select
  M.Modal.init(document.getElementById('rosterModal'));
  M.FormSelect.init(document.querySelectorAll('select'));
  
    // Initialize roster
  RosterManager.init();
	
  // Load saved data
  STATE.isRunning = Storage.load(STORAGE_KEYS.IS_RUNNING, false);
  STATE.startTimestamp = Storage.load(STORAGE_KEYS.START_TIMESTAMP, null);
  STATE.seconds = Storage.load(STORAGE_KEYS.ELAPSED_TIME, 0);
  STATE.data = Storage.load(STORAGE_KEYS.GOALS, []);
  
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
  elements.startPauseButton.textContent = STATE.isRunning ? "Pause" : "Start";
  
  // Initialize Materialize components
  M.FormSelect.init(document.querySelectorAll('select'));
}

// Event Listeners
elements.startPauseButton.addEventListener('click', startStopwatch);
elements.goalForm.addEventListener('submit', addGoal);
elements.opgoalButton.addEventListener('click', opaddGoal);
elements.resetButton.addEventListener('click', resetTracker);
elements.shareButton.addEventListener('click', shareToWhatsApp);
document.addEventListener('DOMContentLoaded', initializeApp);


// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && STATE.isRunning) {
    updateStopwatchDisplay();
  }
});

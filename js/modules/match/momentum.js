/**
 * Match Momentum Tracker
 * Calculates and displays real-time match momentum based on events
 * @version 4.0
 */

import { gameState } from '../data/state.js';
import { domCache } from '../shared/dom.js';

class MomentumTracker {
  constructor() {
    this.momentumData = {
      team1: 0,
      team2: 0,
      lastUpdate: 0
    };
    
    // Event weights for momentum calculation
    this.eventWeights = {
      'goal': 3,
      'Yellow Card': -2,
      'Red Card': -3,
      'Sin Bin': -2,
      'Foul': -1,
      'Penalty': 2,
      'Offside': -0.5
    };
    
    this.windowSize = 300; // 5 minutes in seconds
  }

  // Calculate momentum based on recent events
  calculateMomentum() {
    const currentTime = this.getCurrentMatchTime();
    const windowStart = Math.max(0, currentTime - this.windowSize);
    const team2Name = domCache.get('Team2NameElement')?.textContent || 'Opposition';
    
    // Reset momentum
    this.momentumData.team1 = 0;
    this.momentumData.team2 = 0;
    
    // Process goals
    gameState.goals.forEach(goal => {
      if (goal.disallowed || goal.rawTime < windowStart || goal.rawTime > currentTime) return;
      
      const weight = this.eventWeights.goal;
      // Check if goal scorer is opposition team
      if (goal.goalScorerName === team2Name || goal.team === 2) {
        this.momentumData.team2 += weight;
      } else {
        this.momentumData.team1 += weight;
      }
    });
    
    // Process match events
    gameState.matchEvents.forEach(event => {
      if (event.rawTime < windowStart || event.rawTime > currentTime) return;
      if (event.isSystemEvent) return; // Skip system events like half-time
      
      const weight = this.getEventWeight(event.type);
      if (weight === 0) return;
      
      // Extract team from event type text
      const eventTeam = this.getEventTeam(event.type, team2Name);
      if (eventTeam === 1) {
        this.momentumData.team1 += weight;
      } else if (eventTeam === 2) {
        this.momentumData.team2 += weight;
      }
    });
    
    this.momentumData.lastUpdate = currentTime;
    this.updateMomentumDisplay();
  }

  // Get event weight for momentum calculation
  getEventWeight(eventType) {
    for (const [key, weight] of Object.entries(this.eventWeights)) {
      if (eventType.includes(key)) {
        return weight;
      }
    }
    return 0;
  }

  // Get team from event type text
  getEventTeam(eventType, team2Name) {
    if (eventType.includes(team2Name)) {
      return 2; // Opposition team
    }
    return 1; // Home team (default)
  }

  // Get current match time in seconds
  getCurrentMatchTime() {
    const stopwatchElement = document.getElementById('stopwatch');
    if (!stopwatchElement) return 0;
    
    const timeText = stopwatchElement.textContent;
    const [minutes, seconds] = timeText.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
  }

  // Update momentum display
  updateMomentumDisplay() {
    const momentumContainer = document.getElementById('momentum-indicator');
    if (!momentumContainer) return;
    
    const team1Name = domCache.get('Team1NameElement')?.textContent || 'Team 1';
    const team2Name = domCache.get('Team2NameElement')?.textContent || 'Team 2';
    
    const total = Math.abs(this.momentumData.team1) + Math.abs(this.momentumData.team2);
    
    if (total === 0) {
      momentumContainer.innerHTML = `
        <div class="momentum-bar-container">
          <div class="momentum-label">${team1Name}</div>
          <div class="momentum-bar">
            <div class="momentum-fill neutral" style="width: 100%"></div>
          </div>
          <div class="momentum-label">${team2Name}</div>
        </div>
        <div class="momentum-status">Match Balanced</div>
      `;
      return;
    }
    
    // Calculate momentum percentages
    const netMomentum = this.momentumData.team1 - this.momentumData.team2;
    let team1Percentage = 50;
    
    if (total > 0) {
      team1Percentage = Math.max(10, Math.min(90, 50 + (netMomentum / total) * 40));
    }
    
    let dominantTeam = 'neutral';
    let statusText = 'Match Balanced';
    
    if (team1Percentage > 60) {
      dominantTeam = 'team1';
      statusText = `${team1Name} Momentum`;
    } else if (team1Percentage < 40) {
      dominantTeam = 'team2';
      statusText = `${team2Name} Momentum`;
    }
    
    momentumContainer.innerHTML = `
      <div class="momentum-bar-container">
        <div class="momentum-label">${team1Name}</div>
        <div class="momentum-bar">
          <div class="momentum-fill ${dominantTeam}" style="width: ${team1Percentage}%"></div>
        </div>
        <div class="momentum-label">${team2Name}</div>
      </div>
      <div class="momentum-status">${statusText}</div>
    `;
  }

  // Initialize momentum tracking
  init() {
    this.createMomentumIndicator();
    this.calculateMomentum();
    
    // Update momentum every 30 seconds during active match
    setInterval(() => {
      if (this.isMatchActive()) {
        this.calculateMomentum();
      }
    }, 30000);
  }

  // Check if match is currently active
  isMatchActive() {
    const startButton = document.getElementById('startPauseButton');
    return startButton && startButton.textContent.includes('Pause');
  }

  // Create momentum indicator HTML
  createMomentumIndicator() {
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer) return;
    
    const momentumHTML = `
      <div class="momentum-card">
        <h6 class="momentum-title">
          <i class="fas fa-chart-line me-2"></i>Match Momentum
        </h6>
        <div id="momentum-indicator">
          <!-- Momentum content will be populated here -->
        </div>
      </div>
    `;
    
    // Insert after scoreboard
    const scoreboard = gameContainer.querySelector('.scoreboard-card');
    if (scoreboard) {
      scoreboard.insertAdjacentHTML('afterend', momentumHTML);
    }
  }

  // Update momentum when events change
  onEventUpdate() {
    this.calculateMomentum();
  }
}

// Create and export singleton instance
export const momentumTracker = new MomentumTracker();
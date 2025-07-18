/**
 * Statistics Dashboard UI
 * @version 1.0
 */

import { authService } from '../services/auth.js';
import { statsTracker } from '../services/stats-tracker.js';
import { showModal, hideModal, closeStatsDashboard } from './modals.js';

class StatsDashboard {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the stats dashboard
   */
  init() {
    if (this.initialized) return;
    
    // Create stats modal if it doesn't exist
    if (!document.getElementById('statsDashboardModal')) {
      this._createStatsModal();
    }
    
    this.initialized = true;
  }

  /**
   * Show the stats dashboard
   */
  show() {
    // Only show stats for authenticated users
    if (!authService.isUserAuthenticated()) {
      alert('Please sign in to view your statistics');
      return;
    }
    
    this._updateStatsDisplay();
    showModal('statsDashboardModal');
  }
  
  /**
   * Close the stats dashboard modal
   * @private
   */
  _closeModal() {
    // Use the special function for closing the stats dashboard
    closeStatsDashboard();
  }

  /**
   * Create the stats modal
   * @private
   */
  _createStatsModal() {
    const modalHtml = `
      <div class="modal fade" id="statsDashboardModal" tabindex="-1" aria-labelledby="statsDashboardModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="statsDashboardModalLabel">Game Statistics</h5>
              <button type="button" class="btn-close" id="closeStatsButton" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="stats-container">
                <div class="row mb-4">
                  <div class="col-12">
                    <div class="alert alert-info">
                      <i class="fas fa-info-circle me-2"></i>
                      Statistics are only saved when you're signed in with your passkey.
                    </div>
                  </div>
                </div>
                
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="stats-heading">Summary</h6>
                    <div class="card">
                      <div class="card-body">
                        <div id="summaryStats" class="row g-3">
                          <div class="col-6 col-md-3">
                            <div class="stat-card text-center p-2 border rounded">
                              <div class="stat-icon text-success mb-2">
                                <i class="fas fa-futbol fa-2x"></i>
                              </div>
                              <div class="stat-value" id="totalGoalsValue">0</div>
                              <div class="stat-label">Goals Scored</div>
                            </div>
                          </div>
                          <div class="col-6 col-md-3">
                            <div class="stat-card text-center p-2 border rounded">
                              <div class="stat-icon text-danger mb-2">
                                <i class="fas fa-futbol fa-2x"></i>
                              </div>
                              <div class="stat-value" id="totalOppGoalsValue">0</div>
                              <div class="stat-label">Goals Conceded</div>
                            </div>
                          </div>
                          <div class="col-6 col-md-3">
                            <div class="stat-card text-center p-2 border rounded">
                              <div class="stat-icon text-warning mb-2">
                                <i class="fas fa-square fa-2x"></i>
                              </div>
                              <div class="stat-value" id="totalYellowsValue">0</div>
                              <div class="stat-label">Yellow Cards</div>
                            </div>
                          </div>
                          <div class="col-6 col-md-3">
                            <div class="stat-card text-center p-2 border rounded">
                              <div class="stat-icon text-danger mb-2">
                                <i class="fas fa-square fa-2x"></i>
                              </div>
                              <div class="stat-value" id="totalRedsValue">0</div>
                              <div class="stat-label">Red Cards</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="row mb-4">
                  <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="stats-heading mb-0">Player Statistics</h6>
                      <div>
                        <button id="addTestDataButton" class="btn btn-sm btn-outline-success me-2">
                          <i class="fas fa-plus me-1"></i> Add Test Data
                        </button>
                        <button id="rebuildStatsButton" class="btn btn-sm btn-outline-primary">
                          <i class="fas fa-sync-alt me-1"></i> Rebuild Player Stats
                        </button>
                      </div>
                    </div>
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <thead>
                          <tr>
                            <th>Player</th>
                            <th class="text-center">Goals</th>
                            <th class="text-center">Assists</th>
                            <th class="text-center">Yellow Cards</th>
                            <th class="text-center">Red Cards</th>
                          </tr>
                        </thead>
                        <tbody id="playerStatsTable">
                          <tr>
                            <td colspan="5" class="text-center">No player statistics available</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-12">
                    <h6 class="stats-heading">Recent Games</h6>
                    <div id="recentGames" class="list-group">
                      <div class="list-group-item text-center">No recent games</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
    
    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Add event listeners for buttons
    const closeStatsButton = document.getElementById('closeStatsButton');
    if (closeStatsButton) {
      closeStatsButton.addEventListener('click', () => {
        this._closeModal();
      });
    }
    
    const rebuildStatsButton = document.getElementById('rebuildStatsButton');
    if (rebuildStatsButton) {
      rebuildStatsButton.addEventListener('click', () => {
        // Import statsTracker to rebuild player stats
        import('../services/stats-tracker.js').then(module => {
          const success = module.statsTracker.rebuildPlayerStats();
          if (success) {
            this._updateStatsDisplay();
            alert('Player statistics have been rebuilt successfully!');
          } else {
            alert('Failed to rebuild player statistics. Please try again.');
          }
        });
      });
    }
    
    const addTestDataButton = document.getElementById('addTestDataButton');
    if (addTestDataButton) {
      addTestDataButton.addEventListener('click', () => {
        // Use statsTracker's addTestData method
        import('../services/stats-tracker.js').then(module => {
          const success = module.statsTracker.addTestData();
          if (success) {
            this._updateStatsDisplay();
            alert('Test player data added successfully!');
          } else {
            alert('Failed to add test data. Please try again.');
          }
        });
      });
    }
  }

  
  /**
   * Update the stats display with current data
   * @private
   */
  _updateStatsDisplay() {
    const gameStats = statsTracker.getGameStats();
    const playerStats = statsTracker.getPlayerStats();
    
    if (!gameStats || !playerStats) {
      return;
    }
    
    // Calculate summary stats
    let totalGoals = 0;
    let totalOppGoals = 0;
    let totalYellows = 0;
    let totalReds = 0;
    
    // Process game stats
    const gameEntries = Object.entries(gameStats);
    const recentGames = [];
    
    gameEntries.forEach(([gameId, game]) => {
      if (game.summary) {
        totalGoals += game.summary.goals || 0;
        totalOppGoals += game.summary.oppositionGoals || 0;
        totalYellows += game.summary.yellowCards || 0;
        totalReds += game.summary.redCards || 0;
      }
      
      // Add to recent games
      const gameDate = gameId.replace('game_', '');
      recentGames.push({
        id: gameId,
        date: gameDate,
        goals: game.summary?.goals || 0,
        oppositionGoals: game.summary?.oppositionGoals || 0,
        events: game.events?.length || 0
      });
    });
    
    // Update summary stats
    document.getElementById('totalGoalsValue').textContent = totalGoals;
    document.getElementById('totalOppGoalsValue').textContent = totalOppGoals;
    document.getElementById('totalYellowsValue').textContent = totalYellows;
    document.getElementById('totalRedsValue').textContent = totalReds;
    
    // Update player stats table
    const playerStatsTable = document.getElementById('playerStatsTable');
    if (playerStatsTable) {
      // Get current user ID
      const userId = authService.getCurrentUser()?.id;
      if (!userId) {
        playerStatsTable.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">No player statistics available</td>
          </tr>
        `;
        return;
      }
      
      // Get player stats for current user
      // Initialize if it doesn't exist
      if (!playerStats[userId]) {
        playerStats[userId] = {};
      }
      
      const userPlayerStats = playerStats[userId];
      const playerEntries = Object.entries(userPlayerStats);
      
      if (playerEntries.length === 0) {
        playerStatsTable.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">No player statistics available</td>
          </tr>
        `;
      } else {
        playerStatsTable.innerHTML = '';
        
        // Sort players by goals (highest first)
        playerEntries.sort((a, b) => b[1].goals - a[1].goals);
        
        playerEntries.forEach(([playerName, stats]) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${playerName}</td>
            <td class="text-center">${stats.goals || 0}</td>
            <td class="text-center">${stats.assists || 0}</td>
            <td class="text-center">${stats.yellowCards || 0}</td>
            <td class="text-center">${stats.redCards || 0}</td>
          `;
          playerStatsTable.appendChild(row);
        });
      }
    }
    
    // Update recent games
    const recentGamesElement = document.getElementById('recentGames');
    if (recentGamesElement) {
      if (recentGames.length === 0) {
        recentGamesElement.innerHTML = `
          <div class="list-group-item text-center">No recent games</div>
        `;
      } else {
        recentGamesElement.innerHTML = '';
        
        // Sort games by date (most recent first)
        recentGames.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Show up to 5 most recent games
        recentGames.slice(0, 5).forEach(game => {
          const gameItem = document.createElement('div');
          gameItem.className = 'list-group-item';
          gameItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>${game.date}</strong>
                <div class="small text-muted">${game.events} events recorded</div>
              </div>
              <div>
                <span class="badge bg-success rounded-pill">${game.goals}</span>
                <span class="badge bg-secondary rounded-pill">:</span>
                <span class="badge bg-danger rounded-pill">${game.oppositionGoals}</span>
              </div>
            </div>
          `;
          recentGamesElement.appendChild(gameItem);
        });
      }
    }
  }
}

// Create and export singleton instance
export const statsDashboard = new StatsDashboard();
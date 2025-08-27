/**
 * Statistics Modal UI Component
 * Shows overall game statistics and per-player stats from cloud matches
 */

import { CustomModal } from '../shared/custom-modal.js';
import { userMatchesApi } from '../services/user-matches-api.js';
import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';
import { rosterManager } from '../match/roster.js';

class StatisticsModal {
    constructor() {
        this.modal = null;
        this.isInitialized = false;
        this.matchData = [];
        this.currentView = 'overview'; // 'overview', 'players', 'teams'
    }

    /**
     * Initialize the statistics modal
     */
    init() {
        if (this.isInitialized) return;

        this._createModal();
        this._bindEventListeners();
        this.isInitialized = true;
    }

    /**
     * Show the statistics modal
     */
    async show() {
        if (!this.modal) return;

        if (!authService.isUserAuthenticated()) {
            notificationManager.warning('Please sign in to view statistics');
            return;
        }

        // Show modal first, then load data
        this.modal.show();
        await this._loadAndAnalyzeData();
    }

    /**
     * Hide the statistics modal
     */
    hide() {
        if (this.modal) {
            this.modal.hide();
        }
    }

    /**
     * Load match data and analyze statistics
     * @private
     */
    async _loadAndAnalyzeData(forceRefresh = false) {
        const loadingElement = document.getElementById('statisticsContent');
        if (loadingElement) {
            loadingElement.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <div class="text-muted">Analyzing your match data...</div>
        </div>
      `;
        }

        try {
            // Clear cache if refresh is requested
            if (forceRefresh) {
                userMatchesApi.clearCache();
            }

            this.matchData = await userMatchesApi.loadMatchData() || [];

            // Debug: Log match data structure
            console.log('Statistics: Loaded match data:', this.matchData.length, 'matches');
            if (this.matchData.length > 0) {
                console.log('Sample match structure:', JSON.stringify(this.matchData[0], null, 2));

                // Log all matches to see their structure
                this.matchData.forEach((match, index) => {
                    console.log(`Match ${index + 1} (${match.title || 'Untitled'}):`, {
                        goals: match.goals,
                        matchEvents: match.matchEvents,
                        attendance: match.attendance,
                        keys: Object.keys(match)
                    });
                });
            }

            if (this.matchData.length === 0) {
                this._showNoDataMessage();
                return;
            }

            this._renderCurrentView();
        } catch (error) {
            console.error('Error loading statistics:', error);
            this._showErrorMessage(error.message);
        }
    }

    /**
     * Render the current view based on selected tab
     * @private
     */
    _renderCurrentView() {
        switch (this.currentView) {
            case 'overview':
                this._renderOverviewStats();
                break;
            case 'players':
                this._renderPlayerStats();
                break;
            case 'teams':
                this._renderTeamStats();
                break;
        }
    }

    /**
     * Render overview statistics
     * @private
     */
    _renderOverviewStats() {
        const stats = this._calculateOverviewStats();
        const content = document.getElementById('statisticsContent');

        if (!content) return;

        content.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-futbol text-primary fa-2x mb-2"></i>
              <h4 class="card-title text-primary">${stats.totalMatches}</h4>
              <p class="card-text small text-muted">Total Matches</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-trophy text-warning fa-2x mb-2"></i>
              <h4 class="card-title text-warning">${stats.wins}</h4>
              <p class="card-text small text-muted">Wins</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-handshake text-info fa-2x mb-2"></i>
              <h4 class="card-title text-info">${stats.draws}</h4>
              <p class="card-text small text-muted">Draws</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-times text-danger fa-2x mb-2"></i>
              <h4 class="card-title text-danger">${stats.losses}</h4>
              <p class="card-text small text-muted">Losses</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Goal Statistics</h6>
            </div>
            <div class="card-body">
              <div class="row text-center">
                <div class="col-4">
                  <div class="text-success">
                    <h5>${stats.goalsFor}</h5>
                    <small>Goals For</small>
                  </div>
                </div>
                <div class="col-4">
                  <div class="text-danger">
                    <h5>${stats.goalsAgainst}</h5>
                    <small>Goals Against</small>
                  </div>
                </div>
                <div class="col-4">
                  <div class="text-primary">
                    <h5>${stats.goalDifference > 0 ? '+' : ''}${stats.goalDifference}</h5>
                    <small>Goal Difference</small>
                  </div>
                </div>
              </div>
              <hr>
              <div class="row text-center">
                <div class="col-6">
                  <div class="text-muted">
                    <strong>${stats.avgGoalsFor}</strong>
                    <small class="d-block">Avg Goals/Match</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-muted">
                    <strong>${stats.avgGoalsAgainst}</strong>
                    <small class="d-block">Avg Conceded/Match</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="fas fa-percentage me-2"></i>Win Rate</h6>
            </div>
            <div class="card-body">
              <div class="text-center mb-3">
                <div class="display-6 text-primary">${stats.winPercentage}%</div>
                <small class="text-muted">Overall Win Rate</small>
              </div>
              <div class="progress mb-2" style="height: 20px;">
                <div class="progress-bar bg-success" style="width: ${stats.winPercentage}%"></div>
                <div class="progress-bar bg-info" style="width: ${stats.drawPercentage}%"></div>
                <div class="progress-bar bg-danger" style="width: ${stats.lossPercentage}%"></div>
              </div>
              <div class="d-flex justify-content-between small text-muted">
                <span>Win: ${stats.winPercentage}%</span>
                <span>Draw: ${stats.drawPercentage}%</span>
                <span>Loss: ${stats.lossPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${stats.recentForm.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0"><i class="fas fa-history me-2"></i>Recent Form (Last 5 Matches)</h6>
        </div>
        <div class="card-body">
          <div class="d-flex gap-2 justify-content-center">
            ${stats.recentForm.map(result => `
              <span class="badge ${this._getResultBadgeClass(result)} fs-6">${result}</span>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}
    `;
    }

    /**
     * Render player statistics
     * @private
     */
    _renderPlayerStats() {
        const playerStats = this._calculatePlayerStats();
        const content = document.getElementById('statisticsContent');

        if (!content) return;

        // Separate roster and non-roster players
        const rosterPlayers = playerStats.filter(p => p.isRosterPlayer);
        const nonRosterPlayers = playerStats.filter(p => !p.isRosterPlayer);
        const totalRosterSize = rosterManager.getRoster().length;

        if (playerStats.length === 0) {
            content.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Player Data Available</h5>
                    <p class="text-muted">Player statistics will appear here when you have matches with goal scorer data.</p>
                    <p class="text-muted small">Make sure your saved matches include goal information with player names.</p>
                    <div class="alert alert-info mt-3 text-start">
                        <h6>Debug Information:</h6>
                        <p><strong>Matches loaded:</strong> ${this.matchData.length}</p>
                        <p><strong>Roster size:</strong> ${rosterManager.getRoster().length}</p>
                        ${this.matchData.length > 0 ? `
                            <p><strong>Sample match keys:</strong> ${Object.keys(this.matchData[0]).join(', ')}</p>
                            <p><strong>Check console for detailed match data structure</strong></p>
                            <p><strong>Open browser console to see detailed analysis</strong></p>
                        ` : ''}
                    </div>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <!-- Summary Cards -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-3">
                            <i class="fas fa-users text-primary fa-2x mb-2"></i>
                            <h5 class="card-title text-primary mb-1">${totalRosterSize}</h5>
                            <p class="card-text small text-muted mb-0">Roster Size</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-3">
                            <i class="fas fa-running text-success fa-2x mb-2"></i>
                            <h5 class="card-title text-success mb-1">${rosterPlayers.filter(p => p.appearances > 0).length}</h5>
                            <p class="card-text small text-muted mb-0">Active Players</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-3">
                            <i class="fas fa-futbol text-warning fa-2x mb-2"></i>
                            <h5 class="card-title text-warning mb-1">${playerStats.filter(p => p.goals > 0).length}</h5>
                            <p class="card-text small text-muted mb-0">Goal Scorers</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-3">
                            <i class="fas fa-hands-helping text-info fa-2x mb-2"></i>
                            <h5 class="card-title text-info mb-1">${playerStats.filter(p => p.assists > 0).length}</h5>
                            <p class="card-text small text-muted mb-0">Assist Providers</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Player Statistics Table -->
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-table me-2"></i>Player Statistics</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-sm">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 40px;">#</th>
                                    <th>Player</th>
                                    <th class="text-center" style="width: 80px;">Shirt</th>
                                    <th class="text-center" style="width: 80px;">Apps</th>
                                    <th class="text-center" style="width: 80px;">Goals</th>
                                    <th class="text-center" style="width: 80px;">Assists</th>
                                    <th class="text-center" style="width: 80px;">G+A</th>
                                    <th class="text-center" style="width: 100px;">Goals/Game</th>
                                    <th class="text-center" style="width: 100px;">Assists/Game</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this._renderPlayerRows(rosterPlayers, 'roster')}
                                ${nonRosterPlayers.length > 0 ? `
                                    <tr class="table-secondary">
                                        <td colspan="9" class="text-center fw-bold py-2">
                                            <i class="fas fa-user-plus me-1"></i>Non-Roster Players
                                        </td>
                                    </tr>
                                    ${this._renderPlayerRows(nonRosterPlayers, 'non-roster')}
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                    
                    ${playerStats.length > 10 ? `
                        <div class="mt-3 text-center">
                            <small class="text-muted">
                                Showing ${playerStats.length} players • 
                                ${rosterPlayers.length} roster players • 
                                ${nonRosterPlayers.length} non-roster players
                            </small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render player table rows
     * @private
     */
    _renderPlayerRows(players, type) {
        return players.map((player, index) => {
            const rowClass = type === 'roster' ? '' : 'table-warning';
            const position = type === 'roster' ? index + 1 : '•';

            return `
                <tr class="${rowClass}">
                    <td class="text-center">
                        <span class="badge ${type === 'roster' ? 'bg-primary' : 'bg-warning'}">${position}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <strong>${this._escapeHtml(player.name)}</strong>
                            ${!player.isRosterPlayer ? '<i class="fas fa-user-plus text-warning ms-1" title="Non-roster player"></i>' : ''}
                        </div>
                    </td>
                    <td class="text-center">
                        ${player.shirtNumber !== null ? `<span class="badge bg-secondary">${player.shirtNumber}</span>` : '<span class="text-muted">-</span>'}
                    </td>
                    <td class="text-center">
                        <span class="badge ${player.appearances > 0 ? 'bg-info' : 'bg-light text-dark'}">${player.appearances}</span>
                    </td>
                    <td class="text-center">
                        <span class="badge ${player.goals > 0 ? 'bg-success' : 'bg-light text-dark'}">${player.goals}</span>
                    </td>
                    <td class="text-center">
                        <span class="badge ${player.assists > 0 ? 'bg-primary' : 'bg-light text-dark'}">${player.assists}</span>
                    </td>
                    <td class="text-center">
                        <span class="badge ${player.totalContributions > 0 ? 'bg-warning text-dark' : 'bg-light text-dark'}">${player.totalContributions}</span>
                    </td>
                    <td class="text-center text-muted small">${player.goalsPerMatch}</td>
                    <td class="text-center text-muted small">${player.assistsPerMatch}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render team statistics
     * @private
     */
    _renderTeamStats() {
        const teamStats = this._calculateTeamStats();
        const content = document.getElementById('statisticsContent');

        if (!content) return;

        content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0"><i class="fas fa-shield-alt me-2"></i>Team Performance</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th class="text-center">Played</th>
                  <th class="text-center">Won</th>
                  <th class="text-center">Drawn</th>
                  <th class="text-center">Lost</th>
                  <th class="text-center">Win %</th>
                </tr>
              </thead>
              <tbody>
                ${teamStats.map(team => `
                  <tr>
                    <td><strong>${this._escapeHtml(team.name)}</strong></td>
                    <td class="text-center">${team.played}</td>
                    <td class="text-center"><span class="text-success">${team.won}</span></td>
                    <td class="text-center"><span class="text-info">${team.drawn}</span></td>
                    <td class="text-center"><span class="text-danger">${team.lost}</span></td>
                    <td class="text-center">
                      <span class="badge ${team.winRate >= 50 ? 'bg-success' : team.winRate >= 25 ? 'bg-warning' : 'bg-danger'}">
                        ${team.winRate}%
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Calculate overview statistics
     * @private
     */
    _calculateOverviewStats() {
        const stats = {
            totalMatches: this.matchData.length,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            recentForm: []
        };

        // Get recent matches (last 5)
        const recentMatches = this.matchData.slice(-5);

        this.matchData.forEach(match => {
            const score1 = parseInt(match.score1) || 0;
            const score2 = parseInt(match.score2) || 0;

            stats.goalsFor += score1;
            stats.goalsAgainst += score2;

            if (score1 > score2) {
                stats.wins++;
            } else if (score1 === score2) {
                stats.draws++;
            } else {
                stats.losses++;
            }
        });

        // Calculate recent form
        recentMatches.forEach(match => {
            const score1 = parseInt(match.score1) || 0;
            const score2 = parseInt(match.score2) || 0;

            if (score1 > score2) {
                stats.recentForm.push('W');
            } else if (score1 === score2) {
                stats.recentForm.push('D');
            } else {
                stats.recentForm.push('L');
            }
        });

        // Calculate percentages and averages
        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
        stats.winPercentage = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;
        stats.drawPercentage = stats.totalMatches > 0 ? Math.round((stats.draws / stats.totalMatches) * 100) : 0;
        stats.lossPercentage = stats.totalMatches > 0 ? Math.round((stats.losses / stats.totalMatches) * 100) : 0;
        stats.avgGoalsFor = stats.totalMatches > 0 ? (stats.goalsFor / stats.totalMatches).toFixed(1) : '0.0';
        stats.avgGoalsAgainst = stats.totalMatches > 0 ? (stats.goalsAgainst / stats.totalMatches).toFixed(1) : '0.0';

        return stats;
    }

    /**
     * Calculate player statistics from goals data and roster
     * @private
     */
    _calculatePlayerStats() {
        // Get all rostered players
        const roster = rosterManager.getRoster();
        const playerStatsMap = new Map();

        // Initialize all roster players with zero stats
        roster.forEach(player => {
            const playerKey = player.name.toLowerCase().trim();
            playerStatsMap.set(playerKey, {
                name: player.name,
                shirtNumber: player.shirtNumber,
                goals: 0,
                assists: 0,
                appearances: 0,
                matchesWithGoals: new Set(),
                matchesWithAssists: new Set(),
                matchesPlayed: new Set()
            });
            console.log(`Initialized roster player: "${player.name}" with key: "${playerKey}"`);
        });

        let totalGoalsFound = 0;
        let totalAssistsFound = 0;

        // Analyze each match
        this.matchData.forEach((match, matchIndex) => {
            console.log(`Analyzing match ${matchIndex + 1}:`, match.title || `Match ${matchIndex + 1}`);

            // Track players who appeared in this match (from attendance if available)
            if (match.attendance && Array.isArray(match.attendance)) {
                console.log(`  Processing attendance for match ${matchIndex + 1}:`, match.attendance);
                match.attendance.forEach((attendee, attendeeIndex) => {
                    console.log(`    Attendee ${attendeeIndex + 1}:`, attendee);
                    
                    if (attendee.name && attendee.present) {
                        const playerKey = attendee.name.toLowerCase().trim();
                        console.log(`    Player present: "${attendee.name}" (key: "${playerKey}")`);

                        if (playerStatsMap.has(playerKey)) {
                            playerStatsMap.get(playerKey).matchesPlayed.add(matchIndex);
                            console.log(`      Updated existing player: ${attendee.name}`);
                        } else {
                            // Add non-roster player who attended
                            playerStatsMap.set(playerKey, {
                                name: attendee.name.trim(),
                                shirtNumber: null,
                                goals: 0,
                                assists: 0,
                                appearances: 0, // Will be calculated later
                                matchesWithGoals: new Set(),
                                matchesWithAssists: new Set(),
                                matchesPlayed: new Set([matchIndex])
                            });
                            console.log(`      Added new player from attendance: ${attendee.name}`);
                        }
                    } else {
                        console.log(`    Player not present or invalid: name="${attendee.name}", present=${attendee.present}`);
                    }
                });
            } else {
                console.log(`  No attendance data found for match ${matchIndex + 1}`);
            }

            // Analyze goals from different possible sources
            let goals = [];

            // Check match.goals first
            if (match.goals && Array.isArray(match.goals) && match.goals.length > 0) {
                goals = match.goals;
                console.log(`  Found ${goals.length} goals in match.goals:`, goals);
            }
            // Check match.matchEvents for goal events
            else if (match.matchEvents && Array.isArray(match.matchEvents)) {
                goals = match.matchEvents.filter(event => {
                    const isGoalEvent = event.type === 'goal' ||
                        event.eventType === 'goal' ||
                        event.event === 'goal' ||
                        (event.scorer && event.scorer.trim()) ||
                        (event.player && event.player.trim());
                    return isGoalEvent;
                });
                console.log(`  Found ${goals.length} goal events in match.matchEvents:`, goals);
            }
            // Check if goals might be stored differently
            else {
                console.log(`  No goals found. Match structure:`, {
                    hasGoals: !!match.goals,
                    goalsType: typeof match.goals,
                    goalsLength: Array.isArray(match.goals) ? match.goals.length : 'not array',
                    hasMatchEvents: !!match.matchEvents,
                    matchEventsType: typeof match.matchEvents,
                    matchEventsLength: Array.isArray(match.matchEvents) ? match.matchEvents.length : 'not array',
                    allKeys: Object.keys(match)
                });
            }

            // Process each goal
            goals.forEach((goal, goalIndex) => {
                totalGoalsFound++;
                console.log(`    Goal ${goalIndex + 1}:`, goal);

                // Try different possible scorer field names
                const scorer = goal.scorer || goal.player || goal.playerName || goal.name || goal.goalScorer || goal.goalScorerName;
                const assist = goal.assist || goal.assistedBy || goal.assistBy || goal.assistPlayer || goal.goalAssist || goal.goalAssistName;

                if (scorer && scorer.trim() && scorer !== 'Own Goal') {
                    const scorerKey = scorer.trim().toLowerCase();

                    // Check if scorer is in roster
                    if (playerStatsMap.has(scorerKey)) {
                        const player = playerStatsMap.get(scorerKey);
                        player.goals++;
                        player.matchesWithGoals.add(matchIndex);
                        player.matchesPlayed.add(matchIndex);
                        console.log(`      Credited goal to: ${scorer}`);
                    } else {
                        // Add non-roster player
                        playerStatsMap.set(scorerKey, {
                            name: scorer.trim(),
                            shirtNumber: null,
                            goals: 1,
                            assists: 0,
                            appearances: 0, // Will be calculated from matchesPlayed
                            matchesWithGoals: new Set([matchIndex]),
                            matchesWithAssists: new Set(),
                            matchesPlayed: new Set([matchIndex])
                        });
                        console.log(`      Added new player from goal: ${scorer}`);
                    }
                }

                if (assist && assist.trim() && assist !== 'N/A') {
                    totalAssistsFound++;
                    const assistKey = assist.trim().toLowerCase();

                    if (playerStatsMap.has(assistKey)) {
                        const player = playerStatsMap.get(assistKey);
                        player.assists++;
                        player.matchesWithAssists.add(matchIndex);
                        player.matchesPlayed.add(matchIndex);
                        console.log(`      Credited assist to: ${assist}`);
                    } else {
                        // Add non-roster player for assist
                        if (!playerStatsMap.has(assistKey)) {
                            playerStatsMap.set(assistKey, {
                                name: assist.trim(),
                                shirtNumber: null,
                                goals: 0,
                                assists: 1,
                                appearances: 0, // Will be calculated from matchesPlayed
                                matchesWithGoals: new Set(),
                                matchesWithAssists: new Set([matchIndex]),
                                matchesPlayed: new Set([matchIndex])
                            });
                        } else {
                            playerStatsMap.get(assistKey).assists++;
                            playerStatsMap.get(assistKey).matchesWithAssists.add(matchIndex);
                        }
                        console.log(`      Added new player from assist: ${assist}`);
                    }
                }
            });
        });

        console.log(`Statistics Summary:`);
        console.log(`  Total matches analyzed: ${this.matchData.length}`);
        console.log(`  Total goals found: ${totalGoalsFound}`);
        console.log(`  Total assists found: ${totalAssistsFound}`);
        console.log(`  Total players (roster + non-roster): ${playerStatsMap.size}`);
        console.log(`  Players with goals:`, Array.from(playerStatsMap.values()).filter(p => p.goals > 0).map(p => `${p.name}: ${p.goals}`));
        console.log(`  Players with assists:`, Array.from(playerStatsMap.values()).filter(p => p.assists > 0).map(p => `${p.name}: ${p.assists}`));
        console.log(`  Players with appearances:`, Array.from(playerStatsMap.values()).filter(p => p.matchesPlayed.size > 0).map(p => `${p.name}: ${p.matchesPlayed.size} matches`));

        // Convert to array and calculate additional stats
        const playerStats = Array.from(playerStatsMap.values()).map(player => {
            const appearances = player.matchesPlayed.size; // Appearances = number of matches attended
            return {
                name: player.name,
                shirtNumber: player.shirtNumber,
                goals: player.goals,
                assists: player.assists,
                appearances: appearances,
                goalsPerMatch: appearances > 0 ? (player.goals / appearances).toFixed(2) : '0.00',
                assistsPerMatch: appearances > 0 ? (player.assists / appearances).toFixed(2) : '0.00',
                totalContributions: player.goals + player.assists,
                isRosterPlayer: player.shirtNumber !== null || roster.some(r => r.name.toLowerCase() === player.name.toLowerCase())
            };
        });

        // Sort by total contributions (goals + assists), then by goals
        return playerStats.sort((a, b) => {
            if (b.totalContributions !== a.totalContributions) {
                return b.totalContributions - a.totalContributions;
            }
            return b.goals - a.goals;
        });
    }

    /**
     * Calculate team statistics
     * @private
     */
    _calculateTeamStats() {
        const teamMap = new Map();

        this.matchData.forEach(match => {
            const opponent = match.team2Name || 'Unknown Opponent';

            if (!teamMap.has(opponent)) {
                teamMap.set(opponent, { played: 0, won: 0, drawn: 0, lost: 0 });
            }

            const team = teamMap.get(opponent);
            team.played++;

            const score1 = parseInt(match.score1) || 0;
            const score2 = parseInt(match.score2) || 0;

            if (score1 > score2) {
                team.won++;
            } else if (score1 === score2) {
                team.drawn++;
            } else {
                team.lost++;
            }
        });

        // Convert to array and calculate win rate
        const teamStats = Array.from(teamMap.entries()).map(([name, data]) => ({
            name,
            ...data,
            winRate: data.played > 0 ? Math.round((data.won / data.played) * 100) : 0
        }));

        // Sort by games played (descending)
        return teamStats.sort((a, b) => b.played - a.played);
    }

    /**
     * Get CSS class for result badge
     * @private
     */
    _getResultBadgeClass(result) {
        switch (result) {
            case 'W': return 'bg-success';
            case 'D': return 'bg-info';
            case 'L': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    /**
     * Show no data message
     * @private
     */
    _showNoDataMessage() {
        const content = document.getElementById('statisticsContent');
        if (content) {
            content.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No Match Data Available</h5>
          <p class="text-muted">Save some matches to the cloud to see your statistics here.</p>
        </div>
      `;
        }
    }

    /**
     * Show error message
     * @private
     */
    _showErrorMessage(message) {
        const content = document.getElementById('statisticsContent');
        if (content) {
            content.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
          <h5 class="text-warning">Error Loading Statistics</h5>
          <p class="text-muted">${this._escapeHtml(message)}</p>
        </div>
      `;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    /**
     * Debug method to expose match data
     */
    getMatchDataForDebugging() {
        console.log('Current match data:', this.matchData);
        window.debugMatchData = this.matchData;
        return this.matchData;
    }

    /**
     * Create the statistics modal
     * @private
     */
    _createModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('statisticsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
      <div class="modal fade" id="statisticsModal" tabindex="-1" aria-labelledby="statisticsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="statisticsModalLabel">
                <i class="fas fa-chart-bar me-2"></i>Match Statistics
              </h5>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <!-- Navigation Tabs -->
              <ul class="nav nav-tabs mb-3" id="statisticsTabs">
                <li class="nav-item">
                  <button class="nav-link active" id="overviewTab" data-view="overview">
                    <i class="fas fa-chart-pie me-1"></i>Overview
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" id="playersTab" data-view="players">
                    <i class="fas fa-users me-1"></i>Players
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" id="teamsTab" data-view="teams">
                    <i class="fas fa-shield-alt me-1"></i>Teams
                  </button>
                </li>
              </ul>

              <!-- Content Area -->
              <div id="statisticsContent">
                <!-- Content will be populated here -->
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-primary" id="refreshStatisticsBtn">
                <i class="fas fa-sync-alt me-1"></i>Refresh Data
              </button>
              <button type="button" class="btn btn-secondary" id="closeStatisticsBtn">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Initialize custom modal
        this.modal = CustomModal.getOrCreateInstance('statisticsModal');
    }

    /**
     * Bind event listeners for the modal
     * @private
     */
    _bindEventListeners() {
        // Handle close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeStatisticsBtn') {
                this.hide();
            }

            // Handle refresh button
            if (e.target.id === 'refreshStatisticsBtn') {
                this._handleRefresh();
            }
        });

        // Handle tab navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('#statisticsTabs .nav-link')) {
                const button = e.target.closest('.nav-link');
                const view = button.getAttribute('data-view');

                if (view && view !== this.currentView) {
                    // Update active tab
                    document.querySelectorAll('#statisticsTabs .nav-link').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    button.classList.add('active');

                    // Update current view and render
                    this.currentView = view;
                    this._renderCurrentView();
                }
            }
        });
    }

    /**
     * Handle refresh button click
     * @private
     */
    async _handleRefresh() {
        const refreshBtn = document.getElementById('refreshStatisticsBtn');
        const originalText = refreshBtn.innerHTML;

        try {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Refreshing...';

            await this._loadAndAnalyzeData(true); // Force refresh
            notificationManager.success('Statistics refreshed successfully');
        } catch (error) {
            notificationManager.error('Failed to refresh statistics');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalText;
        }
    }
}

// Create and export singleton instance
export const statisticsModal = new StatisticsModal();

// Expose for debugging
window.statisticsModal = statisticsModal;
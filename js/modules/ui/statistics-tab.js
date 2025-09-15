/**
 * Statistics Tab UI Component
 * Displays statistics directly in the tab instead of modal
 */

import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';

class StatisticsTab {
    constructor() {
        this.currentView = 'overview';
        this.statistics = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this._bindEventListeners();
        this.isInitialized = true;
    }

    async show() {
        await this._loadGeneratedStatistics();
        await this._renderContent();
    }

    async _loadGeneratedStatistics() {
        try {
            const stored = localStorage.getItem('generatedStatistics');
            this.statistics = stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.statistics = null;
        }
    }

    async _renderContent() {
        const container = document.getElementById('statisticsContent');
        if (!container) return;

        if (!this.statistics) {
            container.innerHTML = await this._renderNoDataMessage();
            return;
        }

        container.innerHTML = `
            <div class="d-flex justify-content-center mb-3">
                <div class="btn-group w-100" role="group" style="max-width: 400px;">
                    <button type="button" class="btn btn-outline-primary active flex-fill" data-view="overview" style="font-size: 0.75rem;">
                        <i class="fas fa-tachometer-alt d-none d-sm-inline me-sm-1"></i>
                        <span>Over</span>
                    </button>
                    <button type="button" class="btn btn-outline-primary flex-fill" data-view="players" style="font-size: 0.75rem;">
                        <i class="fas fa-users d-none d-sm-inline me-sm-1"></i>
                        <span>Play</span>
                    </button>
                    <button type="button" class="btn btn-outline-primary flex-fill" data-view="teams" style="font-size: 0.75rem;">
                        <i class="fas fa-shield-alt d-none d-sm-inline me-sm-1"></i>
                        <span>Team</span>
                    </button>
                    <button type="button" class="btn btn-outline-primary flex-fill" data-view="matches" style="font-size: 0.75rem;">
                        <i class="fas fa-calendar-alt d-none d-sm-inline me-sm-1"></i>
                        <span>Match</span>
                    </button>
                </div>
            </div>
            <div id="stats-view-content">
                ${this._renderOverviewStats()}
            </div>
        `;

        this._bindTabEvents();
    }

    _bindEventListeners() {
        // Listen for tab activation
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link[href="#statstab"]');
            if (navLink) {
                setTimeout(() => this.show(), 100);
            }
        });
    }

    _bindTabEvents() {
        const container = document.getElementById('statisticsContent');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-group .btn');
            if (button) {
                e.preventDefault();
                e.stopPropagation();

                const view = button.getAttribute('data-view');
                if (view && view !== this.currentView) {
                    // Update active button
                    const buttons = container.querySelectorAll('.btn-group .btn');
                    buttons.forEach(btn => {
                        btn.classList.remove('active', 'btn-primary');
                        btn.classList.add('btn-outline-primary');
                    });
                    
                    button.classList.add('active', 'btn-primary');
                    button.classList.remove('btn-outline-primary');

                    this.currentView = view;
                    this._renderCurrentView();
                }
            }
        });
    }

    _renderCurrentView() {
        const content = document.getElementById('stats-view-content');
        if (!content) return;

        let html = '';
        switch (this.currentView) {
            case 'overview':
                html = this._renderOverviewStats();
                break;
            case 'players':
                html = this._renderPlayerStats();
                break;
            case 'teams':
                html = this._renderTeamStats();
                break;
            case 'matches':
                html = this._renderPerMatchStats();
                break;
        }

        content.innerHTML = html;
    }

    _renderOverviewStats() {
        if (!this.statistics) return this._renderNoDataMessage();

        const stats = this.statistics;
        return `
            <div class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-futbol text-primary mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-primary mb-0">${stats.totalMatches}</h5>
                            <p class="card-text small text-muted mb-0">Matches</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-bullseye text-success mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-success mb-0">${stats.totalGoals}</h5>
                            <p class="card-text small text-muted mb-0">Goals</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-hands-helping text-info mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-info mb-0">${stats.totalAssists}</h5>
                            <p class="card-text small text-muted mb-0">Assists</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-users text-warning mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-warning mb-0">${stats.playerStats.length}</h5>
                            <p class="card-text small text-muted mb-0">Players</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-trophy me-2"></i>Top Goal Scorers</h6>
                        </div>
                        <div class="card-body">
                            ${this._renderTopScorers(stats.playerStats)}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-handshake me-2"></i>Top Assist Providers</h6>
                        </div>
                        <div class="card-body">
                            ${this._renderTopAssists(stats.playerStats)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderPlayerStats() {
        if (!this.statistics) return this._renderNoDataMessage();
        
        const playerStats = this.statistics.playerStats;
        if (!playerStats || !Array.isArray(playerStats)) {
            return '<p class="text-muted">No player statistics available</p>';
        }

        const rosterPlayers = playerStats.filter(p => p.isRosterPlayer);
        const nonRosterPlayers = playerStats.filter(p => !p.isRosterPlayer);

        return `
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-3">
                            <i class="fas fa-users text-primary fa-2x mb-2"></i>
                            <h5 class="card-title text-primary mb-1">${rosterPlayers.length}</h5>
                            <p class="card-text small text-muted mb-0">Roster Players</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-3">
                            <i class="fas fa-running text-success fa-2x mb-2"></i>
                            <h5 class="card-title text-success mb-1">${playerStats.filter(p => p.appearances > 0).length}</h5>
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

            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-table me-2"></i>Player Statistics</h6>
                </div>
                <div class="card-body p-1 p-sm-3">
                    <div class="table-responsive">
                        <table class="table table-hover table-sm">
                            <thead class="table-light">
                                <tr>
                                    <th class="small">Player</th>
                                    <th class="text-center small d-none d-md-table-cell" style="width: 60px;">Shirt</th>
                                    <th class="text-center small" style="width: 50px;">Apps</th>
                                    <th class="text-center small" style="width: 50px;">G</th>
                                    <th class="text-center small" style="width: 50px;">A</th>
                                    <th class="text-center small" style="width: 50px;">G+A</th>
                                    <th class="text-center small d-none d-lg-table-cell" style="width: 80px;">G/Game</th>
                                    <th class="text-center small d-none d-lg-table-cell" style="width: 80px;">A/Game</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this._renderPlayerRows(rosterPlayers, 'roster')}
                                ${nonRosterPlayers.length > 0 ? `
                                    <tr class="table-secondary">
                                        <td colspan="8" class="text-center fw-bold py-2 small">
                                            <i class="fas fa-user-plus me-1"></i>Non-Roster Players
                                        </td>
                                    </tr>
                                    ${this._renderPlayerRows(nonRosterPlayers, 'non-roster')}
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    _renderTeamStats() {
        if (!this.statistics) return this._renderNoDataMessage();
        
        const stats = this.statistics;
        const teamStats = stats.teamStats || {};
        const matchStats = stats.matchStats || [];
        const opponents = [...new Set(matchStats.map(match => match.opposition))].filter(opp => opp && opp !== 'Unknown');

        return `
            <div class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-futbol text-primary mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-primary mb-0">${teamStats.totalMatches || stats.totalMatches}</h5>
                            <p class="card-text small text-muted mb-0">Matches</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-trophy text-success mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-success mb-0">${teamStats.wins || 0}</h5>
                            <p class="card-text small text-muted mb-0">Wins</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-handshake text-warning mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-warning mb-0">${teamStats.draws || 0}</h5>
                            <p class="card-text small text-muted mb-0">Draws</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-times text-danger mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-danger mb-0">${teamStats.losses || 0}</h5>
                            <p class="card-text small text-muted mb-0">Losses</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-bullseye me-2"></i>Goals Summary</h6>
                        </div>
                        <div class="card-body p-2 p-sm-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-success fw-bold">${teamStats.goalsFor || stats.totalGoals} For</span>
                                <span class="text-muted">vs</span>
                                <span class="text-danger fw-bold">${teamStats.goalsAgainst || 0} Against</span>
                            </div>
                            <div class="text-center">
                                <span class="badge ${(teamStats.goalsFor || stats.totalGoals) - (teamStats.goalsAgainst || 0) >= 0 ? 'bg-success' : 'bg-danger'} fs-6">
                                    ${(teamStats.goalsFor || stats.totalGoals) - (teamStats.goalsAgainst || 0) >= 0 ? '+' : ''}${(teamStats.goalsFor || stats.totalGoals) - (teamStats.goalsAgainst || 0)} Goal Difference
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-percentage me-2"></i>Win Rate</h6>
                        </div>
                        <div class="card-body text-center p-2 p-sm-3">
                            <h3 class="text-primary mb-1">${teamStats.winPercentage || '0'}%</h3>
                            <p class="text-muted mb-0 small">
                                ${teamStats.wins || 0} wins out of ${teamStats.totalMatches || stats.totalMatches} matches
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            ${opponents.length > 0 ? `
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-users me-2"></i>Teams Played Against (${opponents.length})</h6>
                    </div>
                    <div class="card-body p-2">
                        <div class="d-flex flex-wrap gap-1">
                            ${opponents.map(opponent => `
                                <span class="badge bg-secondary text-wrap">${this._escapeHtml(opponent)}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Averages Per Match</h6>
                </div>
                <div class="card-body p-2">
                    <div class="row text-center g-2">
                        <div class="col-6 col-sm-3">
                            <div class="p-2">
                                <h6 class="text-success mb-0">${teamStats.avgGoalsFor || '0.0'}</h6>
                                <small class="text-muted">Goals Scored</small>
                            </div>
                        </div>
                        <div class="col-6 col-sm-3">
                            <div class="p-2">
                                <h6 class="text-danger mb-0">${teamStats.avgGoalsAgainst || '0.0'}</h6>
                                <small class="text-muted">Goals Conceded</small>
                            </div>
                        </div>
                        <div class="col-6 col-sm-3">
                            <div class="p-2">
                                <h6 class="text-info mb-0">${teamStats.avgAttendance || '0.0'}</h6>
                                <small class="text-muted">Attendance</small>
                            </div>
                        </div>
                        <div class="col-6 col-sm-3">
                            <div class="p-2">
                                <h6 class="text-warning mb-0">${teamStats.avgAssists || '0.0'}</h6>
                                <small class="text-muted">Assists</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderPerMatchStats() {
        if (!this.statistics) return this._renderNoDataMessage();
        
        const stats = this.statistics;
        const matchStats = stats.matchStats || [];

        if (!matchStats || matchStats.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-calendar-alt fa-4x text-muted mb-4"></i>
                    <h4 class="text-muted mb-3">No Match Data Available</h4>
                    <p class="text-muted">Individual match statistics are not available in the current data.</p>
                </div>
            `;
        }

        return `
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2">
                            <i class="fas fa-futbol text-primary fa-2x mb-2"></i>
                            <h4 class="card-title text-primary mb-0">${matchStats.length}</h4>
                            <p class="card-text small text-muted mb-0">Matches</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2">
                            <i class="fas fa-bullseye text-success fa-2x mb-2"></i>
                            <h4 class="card-title text-success mb-0">${stats.totalGoals}</h4>
                            <p class="card-text small text-muted mb-0">Goals</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2">
                            <i class="fas fa-users text-info fa-2x mb-2"></i>
                            <h4 class="card-title text-info mb-0">${Math.round(matchStats.reduce((sum, m) => sum + (m.attendance || 0), 0) / matchStats.length) || 0}</h4>
                            <p class="card-text small text-muted mb-0">Avg Att.</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2">
                            <i class="fas fa-chart-line text-warning fa-2x mb-2"></i>
                            <h4 class="card-title text-warning mb-0">${(stats.totalGoals / matchStats.length).toFixed(1)}</h4>
                            <p class="card-text small text-muted mb-0">G/Match</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-list me-2"></i>Match by Match Statistics</h6>
                </div>
                <div class="card-body p-1 p-sm-2">
                    <div class="d-sm-none">
                        ${this._renderMatchCards(matchStats)}
                    </div>
                    
                    <div class="d-none d-sm-block">
                        <div class="table-responsive">
                            <table class="table table-hover table-sm mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th style="width: 90px;" class="small">Date</th>
                                        <th class="small">Opposition</th>
                                        <th class="text-center small" style="width: 70px;">Result</th>
                                        <th class="text-center small" style="width: 50px;">G</th>
                                        <th class="text-center small" style="width: 50px;">A</th>
                                        <th class="text-center small" style="width: 60px;">Att.</th>
                                        <th class="small" style="width: 120px;">Top Scorer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this._renderMatchRows(matchStats)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderTopScorers(playerStats) {
        if (!playerStats || !Array.isArray(playerStats)) {
            return '<p class="text-muted">No player data available</p>';
        }

        const topScorers = playerStats
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 5);

        if (topScorers.length === 0) {
            return '<p class="text-muted">No goals recorded</p>';
        }

        return topScorers.map((player, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span class="text-muted me-2">${index + 1}.</span>
                    <strong>${this._escapeHtml(player.name)}</strong>
                </div>
                <span class="text-muted">${player.goals} goals</span>
            </div>
        `).join('');
    }

    _renderTopAssists(playerStats) {
        if (!playerStats || !Array.isArray(playerStats)) {
            return '<p class="text-muted">No player data available</p>';
        }

        const topAssists = playerStats
            .filter(p => p.assists > 0)
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 5);

        if (topAssists.length === 0) {
            return '<p class="text-muted">No assists recorded</p>';
        }

        return topAssists.map((player, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span class="text-muted me-2">${index + 1}.</span>
                    <strong>${this._escapeHtml(player.name)}</strong>
                </div>
                <span class="text-muted">${player.assists} assists</span>
            </div>
        `).join('');
    }

    async _renderNoDataMessage() {
        const isAdmin = await authService.isAdmin();
        return `
            <div class="text-center py-5">
                <i class="fas fa-chart-bar fa-4x text-muted mb-4"></i>
                <h4 class="text-muted mb-3">No Statistics Available</h4>
                <p class="text-muted mb-4">
                    Statistics need to be generated by an administrator from approved matches.
                </p>
                ${isAdmin ? `
                    <div class="alert alert-info">
                        <h6>Admin Instructions:</h6>
                        <p class="mb-2">1. Go to Admin Dashboard</p>
                        <p class="mb-2">2. Approve matches for statistics</p>
                        <p class="mb-0">3. Click "Generate Stats" to create statistics</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    _renderPlayerRows(players, type) {
        return players.map((player, index) => {
            const rowClass = type === 'roster' ? '' : 'table-warning';
            return `
                <tr class="${rowClass}">
                    <td class="py-2">
                        <div class="d-flex align-items-center">
                            <div>
                                <div class="fw-bold small">${this._escapeHtml(player.name)}</div>
                                <div class="d-md-none text-muted" style="font-size: 0.75rem;">
                                    ${player.shirtNumber !== null ? `#${player.shirtNumber}` : ''}
                                    ${!player.isRosterPlayer ? '<i class="fas fa-user-plus text-warning ms-1" title="Non-roster"></i>' : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="text-center py-2 d-none d-md-table-cell">
                        ${player.shirtNumber !== null ? player.shirtNumber : '<span class="text-muted">-</span>'}
                    </td>
                    <td class="text-center py-2">${player.appearances}</td>
                    <td class="text-center py-2">${player.goals}</td>
                    <td class="text-center py-2">${player.assists}</td>
                    <td class="text-center py-2 fw-bold">${player.totalContributions}</td>
                    <td class="text-center text-muted small py-2 d-none d-lg-table-cell">${player.goalsPerMatch}</td>
                    <td class="text-center text-muted small py-2 d-none d-lg-table-cell">${player.assistsPerMatch}</td>
                </tr>
            `;
        }).join('');
    }

    _renderMatchCards(matchStats) {
        return matchStats.map((match, index) => {
            const date = match.date || match.matchDate || 'Unknown';
            const opposition = match.opposition || match.opponent || 'Unknown';
            const ourGoals = match.ourGoals || match.goalsFor || 0;
            const theirGoals = match.theirGoals || match.goalsAgainst || 0;
            const attendance = match.attendance || 0;
            const topScorer = match.topScorer || 'None';

            let resultBadge = 'secondary';
            let resultText = `${ourGoals}-${theirGoals}`;

            if (ourGoals > theirGoals) {
                resultText = `W ${ourGoals}-${theirGoals}`;
                resultBadge = 'success';
            } else if (ourGoals < theirGoals) {
                resultText = `L ${ourGoals}-${theirGoals}`;
                resultBadge = 'danger';
            } else if (ourGoals === theirGoals && ourGoals > 0) {
                resultText = `D ${ourGoals}-${theirGoals}`;
                resultBadge = 'warning';
            }

            return `
                <div class="card mb-2 border-start border-3 border-${resultBadge}">
                    <div class="card-body p-2">
                        <div class="row align-items-center">
                            <div class="col-8">
                                <div class="d-flex justify-content-between align-items-start mb-1">
                                    <h6 class="mb-0 fw-bold">${this._escapeHtml(opposition)}</h6>
                                    <span class="badge bg-${resultBadge} ms-2">${resultText}</span>
                                </div>
                                <small class="text-muted">${this._formatDate(date)}</small>
                            </div>
                            <div class="col-4 text-end">
                                <div class="small">
                                    <div><i class="fas fa-bullseye text-success me-1"></i>${ourGoals}</div>
                                    <div><i class="fas fa-hands-helping text-info me-1"></i>${match.assists || 0}</div>
                                    <div><i class="fas fa-users text-warning me-1"></i>${attendance}</div>
                                </div>
                            </div>
                        </div>
                        ${topScorer !== 'None' ? `
                            <div class="mt-1">
                                <small class="text-muted">
                                    <i class="fas fa-trophy me-1"></i>${this._escapeHtml(topScorer)}
                                </small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    _renderMatchRows(matchStats) {
        return matchStats.map((match, index) => {
            const date = match.date || match.matchDate || 'Unknown';
            const opposition = match.opposition || match.opponent || 'Unknown';
            const ourGoals = match.ourGoals || match.goalsFor || 0;
            const theirGoals = match.theirGoals || match.goalsAgainst || 0;
            const attendance = match.attendance || 0;
            const topScorer = match.topScorer || 'None';

            let resultClass = 'text-muted';
            let resultText = `${ourGoals}-${theirGoals}`;

            if (ourGoals > theirGoals) {
                resultClass = 'text-success fw-bold';
                resultText = `W ${ourGoals}-${theirGoals}`;
            } else if (ourGoals < theirGoals) {
                resultClass = 'text-danger fw-bold';
                resultText = `L ${ourGoals}-${theirGoals}`;
            } else if (ourGoals === theirGoals && ourGoals > 0) {
                resultClass = 'text-warning fw-bold';
                resultText = `D ${ourGoals}-${theirGoals}`;
            }

            return `
                <tr>
                    <td class="text-muted small py-2">${this._formatDate(date)}</td>
                    <td class="py-2">
                        <span class="fw-bold small">${this._escapeHtml(opposition)}</span>
                    </td>
                    <td class="text-center ${resultClass} py-2 small">${resultText}</td>
                    <td class="text-center py-2">${ourGoals}</td>
                    <td class="text-center py-2">${match.assists || 0}</td>
                    <td class="text-center py-2">${attendance}</td>
                    <td class="text-muted small py-2">${this._escapeHtml(topScorer)}</td>
                </tr>
            `;
        }).join('');
    }

    _formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        } catch (error) {
            return dateStr;
        }
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export const statisticsTab = new StatisticsTab();
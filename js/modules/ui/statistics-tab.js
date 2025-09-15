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
            <!-- Enhanced Navigation -->
            <div class="stats-nav-container mb-3">
                <div class="stats-nav-pills">
                    <button type="button" class="stats-nav-pill active" data-view="overview">
                        <i class="fas fa-chart-pie"></i>
                        <span>Overview</span>
                    </button>
                    <button type="button" class="stats-nav-pill" data-view="players">
                        <i class="fas fa-users"></i>
                        <span>Players</span>
                    </button>
                    <button type="button" class="stats-nav-pill" data-view="teams">
                        <i class="fas fa-shield-alt"></i>
                        <span>Team</span>
                    </button>
                    <button type="button" class="stats-nav-pill" data-view="matches">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Matches</span>
                    </button>
                </div>
            </div>
            
            <!-- Content Area -->
            <div id="stats-view-content" class="stats-content">
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
            const button = e.target.closest('.stats-nav-pill');
            if (button) {
                e.preventDefault();
                e.stopPropagation();

                const view = button.getAttribute('data-view');
                if (view && view !== this.currentView) {
                    // Update active button with smooth transition
                    const buttons = container.querySelectorAll('.stats-nav-pill');
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Add loading state
                    const content = document.getElementById('stats-view-content');
                    if (content) {
                        content.style.opacity = '0.5';
                        setTimeout(() => {
                            this.currentView = view;
                            this._renderCurrentView();
                            content.style.opacity = '1';
                        }, 150);
                    }
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
        const avgGoalsPerMatch = stats.totalMatches > 0 ? (stats.totalGoals / stats.totalMatches).toFixed(1) : '0.0';
        const avgAssistsPerMatch = stats.totalMatches > 0 ? (stats.totalAssists / stats.totalMatches).toFixed(1) : '0.0';
        
        return `
            <!-- Mobile-Optimized Summary Cards -->
            <div class="row g-2 mb-3">
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-primary">
                        <div class="stats-icon">
                            <i class="fas fa-futbol"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.totalMatches}</div>
                            <div class="stats-label">Matches</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-success">
                        <div class="stats-icon">
                            <i class="fas fa-bullseye"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.totalGoals}</div>
                            <div class="stats-label">Goals</div>
                            <div class="stats-sub">${avgGoalsPerMatch}/match</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-info">
                        <div class="stats-icon">
                            <i class="fas fa-hands-helping"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.totalAssists}</div>
                            <div class="stats-label">Assists</div>
                            <div class="stats-sub">${avgAssistsPerMatch}/match</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-warning">
                        <div class="stats-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.playerStats.length}</div>
                            <div class="stats-label">Players</div>
                            <div class="stats-sub">${stats.playerStats.filter(p => p.goals > 0).length} scorers</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Performers Section -->
            <div class="row g-2">
                <div class="col-12 col-md-6">
                    <div class="stats-section">
                        <div class="stats-section-header">
                            <i class="fas fa-trophy text-warning me-2"></i>
                            <span>Top Goal Scorers</span>
                        </div>
                        <div class="stats-section-body">
                            ${this._renderTopScorers(stats.playerStats)}
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="stats-section">
                        <div class="stats-section-header">
                            <i class="fas fa-handshake text-info me-2"></i>
                            <span>Top Assist Providers</span>
                        </div>
                        <div class="stats-section-body">
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
            return '<div class="stats-empty"><i class="fas fa-info-circle me-2"></i>No player data available</div>';
        }

        const topScorers = playerStats
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 5);

        if (topScorers.length === 0) {
            return '<div class="stats-empty"><i class="fas fa-futbol me-2"></i>No goals recorded yet</div>';
        }

        return topScorers.map((player, index) => {
            const position = index + 1;
            const positionClass = position === 1 ? 'position-gold' : position === 2 ? 'position-silver' : position === 3 ? 'position-bronze' : 'position-other';
            
            return `
                <div class="stats-player-item">
                    <div class="player-position ${positionClass}">${position}</div>
                    <div class="player-info">
                        <div class="player-name">${this._escapeHtml(player.name)}</div>
                        <div class="player-details">${player.appearances} apps • ${player.goalsPerMatch} goals/game</div>
                    </div>
                    <div class="player-stat">
                        <div class="stat-value">${player.goals}</div>
                        <div class="stat-label">goals</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    _renderTopAssists(playerStats) {
        if (!playerStats || !Array.isArray(playerStats)) {
            return '<div class="stats-empty"><i class="fas fa-info-circle me-2"></i>No player data available</div>';
        }

        const topAssists = playerStats
            .filter(p => p.assists > 0)
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 5);

        if (topAssists.length === 0) {
            return '<div class="stats-empty"><i class="fas fa-hands-helping me-2"></i>No assists recorded yet</div>';
        }

        return topAssists.map((player, index) => {
            const position = index + 1;
            const positionClass = position === 1 ? 'position-gold' : position === 2 ? 'position-silver' : position === 3 ? 'position-bronze' : 'position-other';
            
            return `
                <div class="stats-player-item">
                    <div class="player-position ${positionClass}">${position}</div>
                    <div class="player-info">
                        <div class="player-name">${this._escapeHtml(player.name)}</div>
                        <div class="player-details">${player.appearances} apps • ${player.assistsPerMatch} assists/game</div>
                    </div>
                    <div class="player-stat">
                        <div class="stat-value">${player.assists}</div>
                        <div class="stat-label">assists</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async _renderNoDataMessage() {
        const isAdmin = await authService.isAdmin();
        return `
            <div class="stats-empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="empty-state-content">
                    <h4>No Statistics Available</h4>
                    <p>Statistics need to be generated by an administrator from approved matches.</p>
                    ${isAdmin ? `
                        <div class="admin-instructions">
                            <div class="instruction-header">
                                <i class="fas fa-user-shield me-2"></i>
                                Admin Instructions
                            </div>
                            <div class="instruction-steps">
                                <div class="instruction-step">
                                    <span class="step-number">1</span>
                                    <span>Go to Admin Dashboard</span>
                                </div>
                                <div class="instruction-step">
                                    <span class="step-number">2</span>
                                    <span>Approve matches for statistics</span>
                                </div>
                                <div class="instruction-step">
                                    <span class="step-number">3</span>
                                    <span>Click "Generate Stats" to create statistics</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="user-message">
                            <i class="fas fa-info-circle me-2"></i>
                            Contact your administrator to generate team statistics
                        </div>
                    `}
                </div>
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
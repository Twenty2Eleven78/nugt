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
            console.log('📊 Statistics Tab: Loading statistics...');
            
            // Try to load from cloud first
            const cloudStats = await this._loadFromCloud();
            if (cloudStats) {
                console.log('☁️ Statistics Tab: Loaded from cloud:', cloudStats);
                // Extract statistics from the cloud response
                if (Array.isArray(cloudStats)) {
                    const statsEntry = cloudStats.find(item => item.title === 'Team Statistics' && item.statistics);
                    if (statsEntry) {
                        console.log('📊 Statistics Tab: Found statistics entry:', statsEntry.statistics);
                        this.statistics = statsEntry.statistics;
                        return;
                    }
                }
                this.statistics = cloudStats;
                return;
            }
            
            // Fallback to localStorage
            const stored = localStorage.getItem('generatedStatistics');
            this.statistics = stored ? JSON.parse(stored) : null;
            
            if (this.statistics) {
                console.log('💾 Statistics Tab: Loaded from localStorage:', this.statistics);
            } else {
                console.log('❌ Statistics Tab: No statistics found in cloud or localStorage');
            }
        } catch (error) {
            console.error('❌ Statistics Tab: Error loading statistics:', error);
            this.statistics = null;
        }
    }

    async _loadFromCloud() {
        try {
            console.log('☁️ Statistics Tab: Attempting to load from cloud...');
            const { userMatchesApi } = await import('../services/user-matches-api.js');
            const result = await userMatchesApi.loadStatistics();
            console.log('☁️ Statistics Tab: Cloud API response:', result);
            return result;
        } catch (error) {
            console.warn('❌ Statistics Tab: Failed to load statistics from cloud:', error);
            return null;
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
                            <div class="stats-number">${stats.playerStats?.length || 0}</div>
                            <div class="stats-label">Players</div>
                            <div class="stats-sub">${stats.playerStats?.filter(p => p.goals > 0).length || 0} scorers</div>
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
                            ${this._renderTopScorers(stats.playerStats || [])}
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
                            ${this._renderTopAssists(stats.playerStats || [])}
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
            return '<div class="stats-empty"><i class="fas fa-info-circle me-2"></i>No player statistics available</div>';
        }

        const rosterPlayers = playerStats.filter(p => p.isRosterPlayer);
        const nonRosterPlayers = playerStats.filter(p => !p.isRosterPlayer);
        const totalGoals = playerStats.reduce((sum, p) => sum + p.goals, 0);
        const totalAssists = playerStats.reduce((sum, p) => sum + p.assists, 0);
        const avgGoalsPerPlayer = playerStats.length > 0 ? (totalGoals / playerStats.length).toFixed(1) : '0.0';
        const avgAssistsPerPlayer = playerStats.length > 0 ? (totalAssists / playerStats.length).toFixed(1) : '0.0';

        return `
            <div class="row g-2 mb-3">
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-primary">
                        <div class="stats-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${rosterPlayers.length}</div>
                            <div class="stats-label">Roster</div>
                            <div class="stats-sub">${playerStats.filter(p => p.appearances > 0).length} active</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-success">
                        <div class="stats-icon">
                            <i class="fas fa-futbol"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${playerStats.filter(p => p.goals > 0).length}</div>
                            <div class="stats-label">Scorers</div>
                            <div class="stats-sub">${avgGoalsPerPlayer} avg/player</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-info">
                        <div class="stats-icon">
                            <i class="fas fa-hands-helping"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${playerStats.filter(p => p.assists > 0).length}</div>
                            <div class="stats-label">Assisters</div>
                            <div class="stats-sub">${avgAssistsPerPlayer} avg/player</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-warning">
                        <div class="stats-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${nonRosterPlayers.length}</div>
                            <div class="stats-label">Guests</div>
                            <div class="stats-sub">${playerStats.filter(p => !p.isRosterPlayer && p.totalContributions > 0).length} contributed</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-2">
                <div class="col-12">
                    <div class="stats-section">
                        <div class="stats-section-header">
                            <i class="fas fa-trophy text-warning me-2"></i>
                            <span>Player Performance Rankings (${playerStats.length})</span>
                        </div>
                        <div class="stats-section-body" style="max-height: 400px; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                            ${this._renderPlayerRankings(playerStats)}
                        </div>
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
        const goalDifference = (teamStats.goalsFor || stats.totalGoals) - (teamStats.goalsAgainst || 0);

        return `
            <div class="row g-2 mb-3">
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-primary">
                        <div class="stats-icon">
                            <i class="fas fa-futbol"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${teamStats.totalMatches || stats.totalMatches}</div>
                            <div class="stats-label">Matches</div>
                            <div class="stats-sub">${teamStats.winPercentage || '0'}% win rate</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-success">
                        <div class="stats-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${teamStats.wins || 0}</div>
                            <div class="stats-label">Wins</div>
                            <div class="stats-sub">${teamStats.avgGoalsFor || '0.0'} goals/game</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-warning">
                        <div class="stats-icon">
                            <i class="fas fa-handshake"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${teamStats.draws || 0}</div>
                            <div class="stats-label">Draws</div>
                            <div class="stats-sub">${teamStats.losses || 0} losses</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card ${goalDifference >= 0 ? 'stats-card-success' : 'stats-card-info'}">
                        <div class="stats-icon">
                            <i class="fas fa-bullseye"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${goalDifference >= 0 ? '+' : ''}${goalDifference}</div>
                            <div class="stats-label">Goal Diff</div>
                            <div class="stats-sub">${teamStats.goalsFor || stats.totalGoals} for, ${teamStats.goalsAgainst || 0} against</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-2">
                ${opponents.length > 0 ? `
                    <div class="col-12 col-md-6">
                        <div class="stats-section">
                            <div class="stats-section-header">
                                <i class="fas fa-users text-info me-2"></i>
                                <span>Opposition Teams (${opponents.length})</span>
                            </div>
                            <div class="stats-section-body">
                                <div class="d-flex flex-wrap gap-1">
                                    ${opponents.map(opponent => `
                                        <span class="badge bg-secondary text-wrap">${this._escapeHtml(opponent)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                <div class="col-12 ${opponents.length > 0 ? 'col-md-6' : ''}">
                    <div class="stats-section">
                        <div class="stats-section-header">
                            <i class="fas fa-chart-line text-primary me-2"></i>
                            <span>Performance Averages</span>
                        </div>
                        <div class="stats-section-body">
                            <div class="row g-2 text-center">
                                <div class="col-6">
                                    <div class="p-2">
                                        <div class="stat-value text-success">${teamStats.avgGoalsFor || '0.0'}</div>
                                        <div class="stat-label">Goals Scored</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="p-2">
                                        <div class="stat-value text-danger">${teamStats.avgGoalsAgainst || '0.0'}</div>
                                        <div class="stat-label">Goals Conceded</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="p-2">
                                        <div class="stat-value text-info">${teamStats.avgAttendance || '0.0'}</div>
                                        <div class="stat-label">Attendance</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="p-2">
                                        <div class="stat-value text-warning">${teamStats.avgAssists || '0.0'}</div>
                                        <div class="stat-label">Assists</div>
                                    </div>
                                </div>
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
                <div class="stats-empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="empty-state-content">
                        <h4>No Match Data Available</h4>
                        <p>Individual match statistics are not available in the current data.</p>
                    </div>
                </div>
            `;
        }

        const avgAttendance = Math.round(matchStats.reduce((sum, m) => sum + (m.attendance || 0), 0) / matchStats.length) || 0;
        const wins = matchStats.filter(m => m.ourGoals > m.theirGoals).length;
        const draws = matchStats.filter(m => m.ourGoals === m.theirGoals).length;
        const losses = matchStats.filter(m => m.ourGoals < m.theirGoals).length;

        return `
            <div class="row g-2 mb-3">
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-primary">
                        <div class="stats-icon">
                            <i class="fas fa-futbol"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${matchStats.length}</div>
                            <div class="stats-label">Matches</div>
                            <div class="stats-sub">${wins}W ${draws}D ${losses}L</div>
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
                            <div class="stats-sub">${(stats.totalGoals / matchStats.length).toFixed(1)}/match</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-info">
                        <div class="stats-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${avgAttendance}</div>
                            <div class="stats-label">Avg Attendance</div>
                            <div class="stats-sub">${matchStats.reduce((sum, m) => sum + (m.attendance || 0), 0)} total</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stats-card stats-card-warning">
                        <div class="stats-icon">
                            <i class="fas fa-hands-helping"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.totalAssists}</div>
                            <div class="stats-label">Assists</div>
                            <div class="stats-sub">${(stats.totalAssists / matchStats.length).toFixed(1)}/match</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-2">
                <div class="col-12">
                    <div class="stats-section">
                        <div class="stats-section-header">
                            <i class="fas fa-list text-primary me-2"></i>
                            <span>Match Results (${matchStats.length})</span>
                        </div>
                        <div class="stats-section-body" style="max-height: 400px; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                            <div class="d-sm-none">
                                ${this._renderMatchCards(matchStats)}
                            </div>
                            
                            <div class="d-none d-sm-block">
                                <div class="table-responsive">
                                    <table class="table table-hover table-sm mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th style="width: 70px;" class="small">Date</th>
                                                <th class="small">Opposition</th>
                                                <th class="text-center small" style="width: 60px;">Result</th>
                                                <th class="text-center small" style="width: 35px;">G</th>
                                                <th class="text-center small" style="width: 40px;">Att</th>
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
                    <h4>Statistics Not Available</h4>
                    <p>Team statistics have not been generated yet.</p>
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
                            Please contact your administrator to generate team statistics
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    _renderPlayerRankings(playerStats) {
        if (!playerStats || !Array.isArray(playerStats)) {
            return '<div class="stats-empty"><i class="fas fa-info-circle me-2"></i>No player data available</div>';
        }

        const sortedPlayers = playerStats
            .sort((a, b) => {
                if (b.totalContributions !== a.totalContributions) {
                    return b.totalContributions - a.totalContributions;
                }
                if (b.goals !== a.goals) {
                    return b.goals - a.goals;
                }
                if (b.assists !== a.assists) {
                    return b.assists - a.assists;
                }
                return b.appearances - a.appearances;
            });

        if (sortedPlayers.length === 0) {
            return '<div class="stats-empty"><i class="fas fa-users me-2"></i>No player contributions recorded yet</div>';
        }

        return sortedPlayers.map((player, index) => {
            const position = index + 1;
            const positionClass = position === 1 ? 'position-gold' : position === 2 ? 'position-silver' : position === 3 ? 'position-bronze' : 'position-other';
            
            return `
                <div class="stats-player-item">
                    <div class="player-position ${positionClass}">${position}</div>
                    <div class="player-info">
                        <div class="player-name">${this._escapeHtml(player.name)}</div>
                        <div class="player-details">
                            ${player.appearances} apps • ${player.starts || 0} starts • ${player.substitute || 0} subs
                            ${!player.isRosterPlayer ? ' • Guest' : ''}
                            ${player.shirtNumber !== null ? ` • #${player.shirtNumber}` : ''}
                        </div>
                    </div>
                    <div class="player-stat">
                        <div class="stat-value">${player.totalContributions}</div>
                        <div class="stat-label">G+A</div>
                    </div>
                    <div class="player-stat">
                        <div class="stat-value">${player.goals}</div>
                        <div class="stat-label">Goals</div>
                    </div>
                    <div class="player-stat">
                        <div class="stat-value">${player.assists}</div>
                        <div class="stat-label">Assists</div>
                    </div>
                </div>
            `;
        }).join('');
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
            const opposition = (match.team2Name && match.team2Name !== 'undefined' && match.team2Name !== 'Opposition Team' && match.team2Name !== 'Unknown') 
                ? match.team2Name 
                : (match.opposition && match.opposition !== 'undefined' && match.opposition !== 'Unknown') 
                    ? match.opposition 
                    : (match.opponent && match.opponent !== 'undefined' && match.opponent !== 'Unknown') 
                        ? match.opponent 
                        : 'Opposition Team';
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
            const opposition = (match.team2Name && match.team2Name !== 'undefined' && match.team2Name !== 'Opposition Team' && match.team2Name !== 'Unknown') 
                ? match.team2Name 
                : (match.opposition && match.opposition !== 'undefined' && match.opposition !== 'Unknown') 
                    ? match.opposition 
                    : (match.opponent && match.opponent !== 'undefined' && match.opponent !== 'Unknown') 
                        ? match.opponent 
                        : 'Opposition Team';
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
                    <td class="text-center py-2">${attendance}</td>
                    <td class="text-muted small py-2">${this._escapeHtml(topScorer !== 'None' && !topScorer.toLowerCase().includes('n/a') ? topScorer : '-')}</td>
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
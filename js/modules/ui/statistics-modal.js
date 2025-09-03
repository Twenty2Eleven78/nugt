/**
 * Statistics Modal UI Component
 * Shows admin-generated statistics in a modal format
 */

import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';
import { CustomModal } from '../shared/custom-modal.js';

class StatisticsModal {
    constructor() {
        this.isInitialized = false;
        this.currentView = 'overview'; // 'overview', 'players', 'teams'
        this.statistics = null;
        this.modalInstance = null;
    }

    /**
     * Initialize the statistics modal
     */
    init() {
        if (this.isInitialized) return;

        this._createModal();
        this.isInitialized = true;
    }

    /**
     * Show the statistics modal
     */
    async show() {
        if (!this.isInitialized) {
            this.init();
        }

        // Load generated statistics
        await this._loadGeneratedStatistics();

        // Update modal content
        await this._updateModalContent();

        // Show the modal
        this.modalInstance.show();
    }

    /**
     * Hide the statistics modal
     */
    hide() {
        if (this.modalInstance) {
            this.modalInstance.hide();
        }
    }

    /**
     * Load generated statistics from storage
     * @private
     */
    async _loadGeneratedStatistics() {
        try {
            const stored = localStorage.getItem('generatedStatistics');
            if (stored) {
                this.statistics = JSON.parse(stored);
            } else {
                this.statistics = null;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.statistics = null;
        }
    }

    /**
     * Create the statistics modal
     * @private
     */
    _createModal() {
        const modalHtml = `
            <div class="modal fade" id="statistics-modal" tabindex="-1" aria-labelledby="statistics-modal-label" aria-hidden="true">
                <div class="modal-dialog modal-fullscreen-sm-down modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="statistics-modal-label">
                                <i class="fas fa-chart-bar text-primary me-2"></i>
                                Team Statistics
                            </h5>
                            <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
                        </div>
                        
                        <div class="modal-body">
                            <!-- Statistics Info -->
                            <div id="statistics-info" class="mb-3">
                                <!-- Will be populated dynamically -->
                            </div>
                            
                            <!-- Navigation Tabs -->
                            <div class="d-flex justify-content-center mb-3">
                                <ul class="nav nav-tabs flex-nowrap" id="statsNavTabs" style="overflow-x: auto;">
                                    <li class="nav-item me-1">
                                        <button class="nav-link active px-3 py-2 text-center" data-view="overview">
                                            <i class="fas fa-tachometer-alt d-block d-sm-inline me-sm-1"></i>
                                            <span class="d-block d-sm-inline small">Overview</span>
                                        </button>
                                    </li>
                                    <li class="nav-item me-1">
                                        <button class="nav-link px-3 py-2 text-center" data-view="players">
                                            <i class="fas fa-users d-block d-sm-inline me-sm-1"></i>
                                            <span class="d-block d-sm-inline small">Players</span>
                                        </button>
                                    </li>
                                    <li class="nav-item me-1">
                                        <button class="nav-link px-3 py-2 text-center" data-view="teams">
                                            <i class="fas fa-shield-alt d-block d-sm-inline me-sm-1"></i>
                                            <span class="d-block d-sm-inline small">Teams</span>
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button class="nav-link px-3 py-2 text-center" data-view="matches">
                                            <i class="fas fa-calendar-alt d-block d-sm-inline me-sm-1"></i>
                                            <span class="d-block d-sm-inline small">Matches</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <!-- Content Area -->
                            <div id="statistics-content">
                                <!-- Will be populated dynamically -->
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <div id="refresh-btn-container">
                                <!-- Refresh button will be added here if user is admin -->
                            </div>
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalElement = document.getElementById('statistics-modal');
        this.modalInstance = CustomModal.getOrCreateInstance(modalElement);

        this._bindEventListeners();
    }

    /**
     * Update modal content with current statistics
     * @private
     */
    async _updateModalContent() {
        // Update statistics info
        const infoContainer = document.getElementById('statistics-info');
        if (infoContainer) {
            infoContainer.innerHTML = await this._renderStatisticsInfo();
        }

        // Update refresh button for admins
        const refreshContainer = document.getElementById('refresh-btn-container');
        if (refreshContainer) {
            const isAdmin = await authService.isAdmin();
            if (isAdmin) {
                refreshContainer.innerHTML = `
                    <button type="button" class="btn btn-outline-primary me-2" id="refreshStatsBtn">
                        <i class="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                `;

                // Bind refresh button
                const refreshBtn = document.getElementById('refreshStatsBtn');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', async () => {
                        await this._loadGeneratedStatistics();
                        await this._updateModalContent();
                        this._renderCurrentView();
                        notificationManager.info('Statistics refreshed');
                    });
                }
            }
        }

        // Render initial content
        this._renderCurrentView();
    }

    /**
     * Render statistics info header
     * @private
     */
    async _renderStatisticsInfo() {
        if (!this.statistics) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No statistics available. Statistics need to be generated by an administrator from approved matches.
                </div>
            `;
        }

        const generatedDate = new Date(this.statistics.generatedAt).toLocaleString();
        return `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                Statistics from <strong>${this.statistics.totalMatches}</strong> approved matches
            </div>
        `;
    }

    /**
     * Render initial content based on available statistics
     * @private
     */
    async _renderInitialContent() {
        if (!this.statistics) {
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

        // Show overview by default
        return this._renderOverviewStats();
    }

    /**
     * Render overview statistics
     * @private
     */
    _renderOverviewStats() {
        if (!this.statistics) return this._renderNoDataMessage();

        const stats = this.statistics;

        return `
            <!-- Summary Cards -->
            <div class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-futbol text-primary mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-primary mb-0">${stats.totalMatches}</h5>
                            <p class="card-text small text-muted mb-0">
                                <span class="d-none d-sm-inline">Approved </span>Matches
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-bullseye text-success mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-success mb-0">${stats.totalGoals}</h5>
                            <p class="card-text small text-muted mb-0">
                                <span class="d-none d-sm-inline">Total </span>Goals
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-hands-helping text-info mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-info mb-0">${stats.totalAssists}</h5>
                            <p class="card-text small text-muted mb-0">
                                <span class="d-none d-sm-inline">Total </span>Assists
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body py-2 py-md-3">
                            <i class="fas fa-users text-warning mb-1 d-none d-sm-block"></i>
                            <h5 class="card-title text-warning mb-0">${stats.playerStats.length}</h5>
                            <p class="card-text small text-muted mb-0">
                                <span class="d-none d-sm-inline">Total </span>Players
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Performers -->
            <div class="row g-3 mb-4">
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

    /**
     * Render player statistics
     * @private
     */
    _renderPlayerStats() {
        if (!this.statistics) return this._renderNoDataMessage();

        const playerStats = this.statistics.playerStats;

        if (!playerStats || !Array.isArray(playerStats)) {
            return '<p class="text-muted">No player statistics available</p>';
        }

        const rosterPlayers = playerStats.filter(p => p.isRosterPlayer);
        const nonRosterPlayers = playerStats.filter(p => !p.isRosterPlayer);

        return `
            <!-- Summary Cards -->
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

            <!-- Player Statistics Table -->
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

    /**
     * Render player table rows
     * @private
     */
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

    /**
     * Render top scorers list
     * @private
     */
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

    /**
     * Render top assists list
     * @private
     */
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

    /**
     * Render teams statistics
     * @private
     */
    _renderTeamStats() {
        if (!this.statistics) return this._renderNoDataMessage();

        const stats = this.statistics;
        const teamStats = stats.teamStats || {};

        return `
            <!-- Team Summary Cards -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-futbol text-primary fa-2x mb-2"></i>
                            <h4 class="card-title text-primary">${teamStats.totalMatches || stats.totalMatches}</h4>
                            <p class="card-text small text-muted">Matches Played</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-trophy text-success fa-2x mb-2"></i>
                            <h4 class="card-title text-success">${teamStats.wins || 0}</h4>
                            <p class="card-text small text-muted">Wins</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-handshake text-warning fa-2x mb-2"></i>
                            <h4 class="card-title text-warning">${teamStats.draws || 0}</h4>
                            <p class="card-text small text-muted">Draws</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-times text-danger fa-2x mb-2"></i>
                            <h4 class="card-title text-danger">${teamStats.losses || 0}</h4>
                            <p class="card-text small text-muted">Losses</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Team Performance -->
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-bullseye me-2"></i>Goals</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6">
                                    <h4 class="text-success">${teamStats.goalsFor || stats.totalGoals}</h4>
                                    <small class="text-muted">Goals For</small>
                                </div>
                                <div class="col-6">
                                    <h4 class="text-danger">${teamStats.goalsAgainst || 0}</h4>
                                    <small class="text-muted">Goals Against</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <h5 class="mb-0">${(teamStats.goalsFor || stats.totalGoals) - (teamStats.goalsAgainst || 0)}</h5>
                                <small class="text-muted">Goal Difference</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-percentage me-2"></i>Win Rate</h6>
                        </div>
                        <div class="card-body text-center">
                            <h2 class="text-primary mb-2">${teamStats.winPercentage || '0'}%</h2>
                            <p class="text-muted mb-0">
                                ${teamStats.wins || 0} wins out of ${teamStats.totalMatches || stats.totalMatches} matches
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Average Statistics -->
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Averages Per Match</h6>
                </div>
                <div class="card-body">
                    <div class="row text-center">
                        <div class="col-3">
                            <h5 class="text-success">${teamStats.avgGoalsFor || '0.0'}</h5>
                            <small class="text-muted">Goals Scored</small>
                        </div>
                        <div class="col-3">
                            <h5 class="text-danger">${teamStats.avgGoalsAgainst || '0.0'}</h5>
                            <small class="text-muted">Goals Conceded</small>
                        </div>
                        <div class="col-3">
                            <h5 class="text-info">${teamStats.avgAttendance || '0.0'}</h5>
                            <small class="text-muted">Attendance</small>
                        </div>
                        <div class="col-3">
                            <h5 class="text-warning">${teamStats.avgAssists || '0.0'}</h5>
                            <small class="text-muted">Assists</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render per-match statistics
     * @private
     */
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
            <!-- Match Statistics Summary -->
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

            <!-- Match Details Table -->
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-list me-2"></i>Match by Match Statistics</h6>
                </div>
                <div class="card-body p-1 p-sm-2">
                    <!-- Mobile Card View (visible on small screens) -->
                    <div class="d-sm-none">
                        ${this._renderMatchCards(matchStats)}
                    </div>
                    
                    <!-- Desktop Table View (hidden on small screens) -->
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

    /**
     * Render match cards for mobile view
     * @private
     */
    _renderMatchCards(matchStats) {
        return matchStats.map((match, index) => {
            const date = match.date || match.matchDate || 'Unknown';
            const opposition = match.opposition || match.opponent || 'Unknown';
            const ourGoals = match.ourGoals || match.goalsFor || 0;
            const theirGoals = match.theirGoals || match.goalsAgainst || 0;
            const attendance = match.attendance || 0;
            const topScorer = match.topScorer || 'None';

            // Determine result styling
            let resultClass = 'text-muted';
            let resultText = `${ourGoals}-${theirGoals}`;
            let resultBadge = 'secondary';

            if (ourGoals > theirGoals) {
                resultClass = 'text-success fw-bold';
                resultText = `W ${ourGoals}-${theirGoals}`;
                resultBadge = 'success';
            } else if (ourGoals < theirGoals) {
                resultClass = 'text-danger fw-bold';
                resultText = `L ${ourGoals}-${theirGoals}`;
                resultBadge = 'danger';
            } else if (ourGoals === theirGoals && ourGoals > 0) {
                resultClass = 'text-warning fw-bold';
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

    /**
     * Render match table rows
     * @private
     */
    _renderMatchRows(matchStats) {
        return matchStats.map((match, index) => {
            const date = match.date || match.matchDate || 'Unknown';
            const opposition = match.opposition || match.opponent || 'Unknown';
            const ourGoals = match.ourGoals || match.goalsFor || 0;
            const theirGoals = match.theirGoals || match.goalsAgainst || 0;
            const attendance = match.attendance || 0;
            const topScorer = match.topScorer || 'None';

            // Determine result styling
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

    /**
     * Format date for display
     * @private
     */
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

    /**
     * Render no data message
     * @private
     */
    _renderNoDataMessage() {
        return `
            <div class="text-center py-5">
                <i class="fas fa-chart-bar fa-4x text-muted mb-4"></i>
                <h4 class="text-muted mb-3">No Statistics Available</h4>
                <p class="text-muted">Statistics need to be generated by an administrator.</p>
            </div>
        `;
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEventListeners() {
        // Tab navigation
        const modalElement = document.getElementById('statistics-modal');
        if (modalElement) {
            modalElement.addEventListener('click', (e) => {
                if (e.target.matches('#statsNavTabs .nav-link')) {
                    e.preventDefault();

                    // Update active tab
                    const tabButtons = modalElement.querySelectorAll('#statsNavTabs .nav-link');
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');

                    // Update current view
                    this.currentView = e.target.getAttribute('data-view');
                    this._renderCurrentView();
                }
            });
        }
    }

    /**
     * Render the current view
     * @private
     */
    async _renderCurrentView() {
        const content = document.getElementById('statistics-content');
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
            default:
                html = await this._renderInitialContent();
        }

        content.innerHTML = html;
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create and export singleton instance
export const statisticsModal = new StatisticsModal();
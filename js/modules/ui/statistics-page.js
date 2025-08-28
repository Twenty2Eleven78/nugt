/**
 * Statistics Page UI Component
 * Shows admin-generated statistics as a dedicated page/screen
 */

import { authService } from '../services/auth.js';
import { notificationManager } from '../services/notifications.js';

class StatisticsPage {
    constructor() {
        this.isInitialized = false;
        this.currentView = 'overview'; // 'overview', 'players', 'teams'
        this.statistics = null;
    }

    /**
     * Initialize the statistics page
     */
    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    /**
     * Show the statistics page
     */
    async show() {
        // Load generated statistics
        await this._loadGeneratedStatistics();
        
        // Create and show the statistics page
        this._createStatisticsPage();
        this._bindEventListeners();
    }

    /**
     * Hide the statistics page and return to main app
     */
    hide() {
        const statsPage = document.getElementById('statistics-page');
        if (statsPage) {
            statsPage.remove();
        }
        
        // Show main app content
        const mainContent = document.querySelector('.container-fluid');
        if (mainContent) {
            mainContent.style.display = 'block';
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
     * Create the statistics page
     * @private
     */
    _createStatisticsPage() {
        // Hide main app content
        const mainContent = document.querySelector('.container-fluid');
        if (mainContent) {
            mainContent.style.display = 'none';
        }

        // Remove existing stats page if it exists
        const existingPage = document.getElementById('statistics-page');
        if (existingPage) {
            existingPage.remove();
        }

        const pageHtml = `
            <div id="statistics-page" class="statistics-page">
                <div class="container-fluid py-3">
                    <!-- Header -->
                    <div class="row mb-4">
                        <div class="col">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 class="mb-1">
                                        <i class="fas fa-chart-bar text-primary me-2"></i>
                                        Team Statistics
                                    </h2>
                                    <p class="text-muted mb-0">
                                        ${this.statistics ? 
                                            `Generated from ${this.statistics.totalMatches} approved matches` : 
                                            'No statistics available'
                                        }
                                    </p>
                                </div>
                                <div class="d-flex gap-2">
                                    ${authService.isUserAuthenticated() && authService.isAdmin() ? `
                                        <button class="btn btn-outline-primary" id="refreshStatsBtn">
                                            <i class="fas fa-sync-alt me-1"></i>Refresh
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-secondary" id="backToAppBtn">
                                        <i class="fas fa-arrow-left me-1"></i>Back to App
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Tabs -->
                    <div class="row mb-3">
                        <div class="col">
                            <ul class="nav nav-tabs" id="statsNavTabs">
                                <li class="nav-item">
                                    <button class="nav-link active" data-view="overview">
                                        <i class="fas fa-tachometer-alt me-1"></i>Overview
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" data-view="players">
                                        <i class="fas fa-users me-1"></i>Players
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" data-view="teams">
                                        <i class="fas fa-shield-alt me-1"></i>Teams
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="row">
                        <div class="col">
                            <div id="statistics-content">
                                ${this._renderInitialContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', pageHtml);
    }

    /**
     * Render initial content based on available statistics
     * @private
     */
    _renderInitialContent() {
        if (!this.statistics) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-chart-bar fa-4x text-muted mb-4"></i>
                    <h4 class="text-muted mb-3">No Statistics Available</h4>
                    <p class="text-muted mb-4">
                        Statistics need to be generated by an administrator from approved matches.
                    </p>
                    ${authService.isUserAuthenticated() && authService.isAdmin() ? `
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
        const generatedDate = new Date(stats.generatedAt).toLocaleString();

        return `
            <!-- Summary Cards -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-futbol text-primary fa-2x mb-2"></i>
                            <h4 class="card-title text-primary">${stats.totalMatches}</h4>
                            <p class="card-text small text-muted">Approved Matches</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-bullseye text-success fa-2x mb-2"></i>
                            <h4 class="card-title text-success">${stats.totalGoals}</h4>
                            <p class="card-text small text-muted">Total Goals</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-hands-helping text-info fa-2x mb-2"></i>
                            <h4 class="card-title text-info">${stats.totalAssists}</h4>
                            <p class="card-text small text-muted">Total Assists</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="fas fa-users text-warning fa-2x mb-2"></i>
                            <h4 class="card-title text-warning">${stats.playerStats.length}</h4>
                            <p class="card-text small text-muted">Total Players</p>
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

            <!-- Generation Info -->
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Statistics Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Generated:</strong> ${generatedDate}</p>
                            <p class="mb-1"><strong>Generated by:</strong> ${stats.generatedBy || 'Unknown'}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Matches included:</strong> ${stats.totalMatches}</p>
                            <p class="mb-1"><strong>Data source:</strong> Admin-approved matches only</p>
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
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-sm">
                            <thead class="table-light">
                                <tr>
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
                                        <td colspan="8" class="text-center fw-bold py-2">
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
                    <td>
                        <div class="d-flex align-items-center">
                            <strong>${this._escapeHtml(player.name)}</strong>
                            ${!player.isRosterPlayer ? '<i class="fas fa-user-plus text-warning ms-1" title="Non-roster player"></i>' : ''}
                        </div>
                    </td>
                    <td class="text-center">
                        ${player.shirtNumber !== null ? player.shirtNumber : '<span class="text-muted">-</span>'}
                    </td>
                    <td class="text-center">${player.appearances}</td>
                    <td class="text-center">${player.goals}</td>
                    <td class="text-center">${player.assists}</td>
                    <td class="text-center">${player.totalContributions}</td>
                    <td class="text-center text-muted small">${player.goalsPerMatch}</td>
                    <td class="text-center text-muted small">${player.assistsPerMatch}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render top scorers list
     * @private
     */
    _renderTopScorers(playerStats) {
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
                    <span class="badge bg-primary me-2">${index + 1}</span>
                    <strong>${this._escapeHtml(player.name)}</strong>
                </div>
                <span class="badge bg-success">${player.goals} goals</span>
            </div>
        `).join('');
    }

    /**
     * Render top assists list
     * @private
     */
    _renderTopAssists(playerStats) {
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
                    <span class="badge bg-primary me-2">${index + 1}</span>
                    <strong>${this._escapeHtml(player.name)}</strong>
                </div>
                <span class="badge bg-info">${player.assists} assists</span>
            </div>
        `).join('');
    }

    /**
     * Render teams statistics (placeholder)
     * @private
     */
    _renderTeamStats() {
        return `
            <div class="text-center py-5">
                <i class="fas fa-shield-alt fa-4x text-muted mb-4"></i>
                <h4 class="text-muted mb-3">Team Statistics</h4>
                <p class="text-muted">Team performance statistics will be available in a future update.</p>
            </div>
        `;
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
        // Back to app button
        const backBtn = document.getElementById('backToAppBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.hide());
        }

        // Refresh button (admin only)
        const refreshBtn = document.getElementById('refreshStatsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this._loadGeneratedStatistics();
                this._renderCurrentView();
                notificationManager.info('Statistics refreshed');
            });
        }

        // Tab navigation
        const tabButtons = document.querySelectorAll('#statsNavTabs .nav-link');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update current view
                this.currentView = button.getAttribute('data-view');
                this._renderCurrentView();
            });
        });
    }

    /**
     * Render the current view
     * @private
     */
    _renderCurrentView() {
        const content = document.getElementById('statistics-content');
        if (!content) return;

        switch (this.currentView) {
            case 'overview':
                content.innerHTML = this._renderOverviewStats();
                break;
            case 'players':
                content.innerHTML = this._renderPlayerStats();
                break;
            case 'teams':
                content.innerHTML = this._renderTeamStats();
                break;
        }
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
export const statisticsPage = new StatisticsPage();
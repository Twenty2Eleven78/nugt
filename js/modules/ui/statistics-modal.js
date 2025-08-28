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
                <div class="modal-dialog modal-fullscreen-lg-down modal-xl">
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
                            <ul class="nav nav-tabs mb-3" id="statsNavTabs">
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
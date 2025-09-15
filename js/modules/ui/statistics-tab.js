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
        return '<p class="text-muted">Player statistics view coming soon...</p>';
    }

    _renderTeamStats() {
        if (!this.statistics) return this._renderNoDataMessage();
        return '<p class="text-muted">Team statistics view coming soon...</p>';
    }

    _renderPerMatchStats() {
        if (!this.statistics) return this._renderNoDataMessage();
        return '<p class="text-muted">Match statistics view coming soon...</p>';
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

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export const statisticsTab = new StatisticsTab();
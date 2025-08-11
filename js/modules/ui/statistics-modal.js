/**
 * Statistics Modal
 * Displays comprehensive match and player statistics
 * @version 1.0
 */

import { statisticsService } from '../services/statistics.js';
import { showModal, hideModal } from './modals.js';
import { notificationManager } from '../services/notifications.js';

class StatisticsModal {
    constructor() {
        this.isInitialized = false;
        this.currentTab = 'overview';
    }

    init() {
        if (this.isInitialized) return;

        this.createModal();
        this.bindEvents();
        this.isInitialized = true;
    }

    createModal() {
        const modalHTML = `
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
                            <!-- Statistics Tabs -->
                            <ul class="nav nav-tabs mb-4" id="statsTabList" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="overview-tab" data-tab="overview" type="button" role="tab">
                                        <i class="fas fa-tachometer-alt me-1"></i>Overview
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="players-tab" data-tab="players" type="button" role="tab">
                                        <i class="fas fa-users me-1"></i>Players
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="opponents-tab" data-tab="opponents" type="button" role="tab">
                                        <i class="fas fa-shield-alt me-1"></i>Opponents
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="performance-tab" data-tab="performance" type="button" role="tab">
                                        <i class="fas fa-chart-line me-1"></i>Performance
                                    </button>
                                </li>
                            </ul>

                            <!-- Tab Content -->
                            <div class="tab-content" id="statsTabContent">
                                <!-- Overview Tab -->
                                <div class="tab-pane fade show active" id="overview-content" role="tabpanel">
                                    <div id="overviewStats">Loading...</div>
                                </div>

                                <!-- Players Tab -->
                                <div class="tab-pane fade" id="players-content" role="tabpanel">
                                    <div id="playerStats">Loading...</div>
                                </div>

                                <!-- Opponents Tab -->
                                <div class="tab-pane fade" id="opponents-content" role="tabpanel">
                                    <div id="opponentStats">Loading...</div>
                                </div>

                                <!-- Performance Tab -->
                                <div class="tab-pane fade" id="performance-content" role="tabpanel">
                                    <div id="performanceStats">Loading...</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-primary" id="exportStatsBtn">
                                <i class="fas fa-download me-2"></i>Export Data
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="refreshStatsBtn">
                                <i class="fas fa-sync-alt me-2"></i>Refresh
                            </button>
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('#statsTabList button[data-tab]')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Export button
        document.getElementById('exportStatsBtn')?.addEventListener('click', () => {
            this.exportStatistics();
        });

        // Refresh button
        document.getElementById('refreshStatsBtn')?.addEventListener('click', () => {
            this.refreshStatistics();
        });
    }

    show() {
        this.init();
        this.loadStatistics();
        showModal('statisticsModal');
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('#statsTabList .nav-link').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        document.getElementById(`${tabName}-content`).classList.add('show', 'active');

        this.currentTab = tabName;
        this.loadTabContent(tabName);
    }

    loadStatistics() {
        this.loadTabContent('overview');
    }

    loadTabContent(tabName) {
        const stats = statisticsService.getStatistics();
        const playerStats = statisticsService.calculatePlayerStatistics();

        switch (tabName) {
            case 'overview':
                this.renderOverviewTab(stats);
                break;
            case 'players':
                this.renderPlayersTab(playerStats);
                break;
            case 'opponents':
                this.renderOpponentsTab(stats.opponents);
                break;
            case 'performance':
                this.renderPerformanceTab(stats);
                break;
        }
    }

    renderOverviewTab(stats) {
        const { overview, goals, timeline } = stats;
        
        const html = `
            <div class="row">
                <!-- Match Record -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-trophy me-2"></i>Match Record</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-3">
                                    <div class="stat-number text-success">${overview.wins}</div>
                                    <small class="text-muted">Wins</small>
                                </div>
                                <div class="col-3">
                                    <div class="stat-number text-warning">${overview.draws}</div>
                                    <small class="text-muted">Draws</small>
                                </div>
                                <div class="col-3">
                                    <div class="stat-number text-danger">${overview.losses}</div>
                                    <small class="text-muted">Losses</small>
                                </div>
                                <div class="col-3">
                                    <div class="stat-number text-primary">${overview.winRate}%</div>
                                    <small class="text-muted">Win Rate</small>
                                </div>
                            </div>
                            <hr>
                            <div class="row text-center">
                                <div class="col-6">
                                    <div class="stat-number">${overview.totalMatches}</div>
                                    <small class="text-muted">Total Matches</small>
                                </div>
                                <div class="col-6">
                                    <div class="stat-number ${overview.goalDifference >= 0 ? 'text-success' : 'text-danger'}">${overview.goalDifference > 0 ? '+' : ''}${overview.goalDifference}</div>
                                    <small class="text-muted">Goal Difference</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Goal Statistics -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-futbol me-2"></i>Goal Statistics</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6">
                                    <div class="stat-number text-success">${overview.totalGoalsFor}</div>
                                    <small class="text-muted">Goals For</small>
                                </div>
                                <div class="col-6">
                                    <div class="stat-number text-danger">${overview.totalGoalsAgainst}</div>
                                    <small class="text-muted">Goals Against</small>
                                </div>
                            </div>
                            <hr>
                            <div class="row text-center">
                                <div class="col-4">
                                    <div class="stat-number">${overview.avgGoalsFor}</div>
                                    <small class="text-muted">Avg For</small>
                                </div>
                                <div class="col-4">
                                    <div class="stat-number">${overview.avgGoalsAgainst}</div>
                                    <small class="text-muted">Avg Against</small>
                                </div>
                                <div class="col-4">
                                    <div class="stat-number">${goals.penalties}</div>
                                    <small class="text-muted">Penalties</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Goals by Time Period -->
                <div class="col-12 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-clock me-2"></i>Goals by Time Period</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                ${Object.entries(timeline).map(([period, goals]) => `
                                    <div class="col-2">
                                        <div class="timeline-bar">
                                            <div class="timeline-fill" style="height: ${Math.max(goals * 10, 5)}px;"></div>
                                        </div>
                                        <div class="stat-number mt-2">${goals}</div>
                                        <small class="text-muted">${period} min</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Scorers Preview -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-star me-2"></i>Top Scorers</h6>
                        </div>
                        <div class="card-body">
                            ${goals.topScorers.length > 0 ? `
                                <div class="row">
                                    ${goals.topScorers.slice(0, 5).map((scorer, index) => `
                                        <div class="col-md-2 col-4 text-center mb-3">
                                            <div class="position-badge">${index + 1}</div>
                                            <div class="fw-medium">${scorer.name}</div>
                                            <div class="stat-number text-primary">${scorer.goals}</div>
                                            <small class="text-muted">goals</small>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-muted mb-0">No goal data available</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('overviewStats').innerHTML = html;
    }

    renderPlayersTab(playerStats) {
        const html = `
            <div class="row">
                <!-- Player Summary -->
                <div class="col-12 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-users me-2"></i>Player Summary</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-primary">${playerStats.totalPlayers}</div>
                                    <small class="text-muted">Active Players</small>
                                </div>
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-success">${playerStats.topScorer?.goals || 0}</div>
                                    <small class="text-muted">Top Goals</small>
                                </div>
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-info">${playerStats.topAssister?.assists || 0}</div>
                                    <small class="text-muted">Top Assists</small>
                                </div>
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-warning">${playerStats.mostAppearances?.matchesPlayed || 0}</div>
                                    <small class="text-muted">Most Apps</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Player Statistics Table -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-table me-2"></i>Player Statistics</h6>
                        </div>
                        <div class="card-body">
                            ${playerStats.players.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Player</th>
                                                <th class="text-center">Matches</th>
                                                <th class="text-center">Goals</th>
                                                <th class="text-center">Assists</th>
                                                <th class="text-center">Penalties</th>
                                                <th class="text-center">Goals/Match</th>
                                                <th class="text-center">Assists/Match</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${playerStats.players.map(player => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            ${player.shirtNumber ? `<span class="badge bg-primary me-2">#${player.shirtNumber}</span>` : ''}
                                                            <span class="fw-medium">${player.name}</span>
                                                        </div>
                                                    </td>
                                                    <td class="text-center">${player.matchesPlayed}</td>
                                                    <td class="text-center">
                                                        <span class="stat-highlight ${player.goals > 0 ? 'text-success' : ''}">${player.goals}</span>
                                                    </td>
                                                    <td class="text-center">
                                                        <span class="stat-highlight ${player.assists > 0 ? 'text-info' : ''}">${player.assists}</span>
                                                    </td>
                                                    <td class="text-center">${player.penalties}</td>
                                                    <td class="text-center">${player.goalsPerMatch}</td>
                                                    <td class="text-center">${player.assistsPerMatch}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-muted mb-0">No player data available</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('playerStats').innerHTML = html;
    }

    renderOpponentsTab(opponents) {
        const html = `
            <div class="row">
                <!-- Opponent Summary -->
                <div class="col-12 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-shield-alt me-2"></i>Opponent Analysis</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-primary">${opponents.totalOpponents}</div>
                                    <small class="text-muted">Total Opponents</small>
                                </div>
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-info">${opponents.mostPlayed?.played || 0}</div>
                                    <small class="text-muted">Most Played</small>
                                </div>
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-success">${opponents.bestRecord ? Math.round((opponents.bestRecord.wins / opponents.bestRecord.played) * 100) : 0}%</div>
                                    <small class="text-muted">Best Win Rate</small>
                                </div>
                                <div class="col-md-3 col-6">
                                    <div class="stat-number text-warning">${opponents.worstRecord ? Math.round((opponents.worstRecord.wins / opponents.worstRecord.played) * 100) : 0}%</div>
                                    <small class="text-muted">Worst Win Rate</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Opponents Table -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-table me-2"></i>Head-to-Head Records</h6>
                        </div>
                        <div class="card-body">
                            ${opponents.opponents.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Opponent</th>
                                                <th class="text-center">Played</th>
                                                <th class="text-center">Won</th>
                                                <th class="text-center">Drawn</th>
                                                <th class="text-center">Lost</th>
                                                <th class="text-center">Win Rate</th>
                                                <th class="text-center">Goals For</th>
                                                <th class="text-center">Goals Against</th>
                                                <th class="text-center">Goal Diff</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${opponents.opponents.map(opponent => {
                                                const winRate = Math.round((opponent.wins / opponent.played) * 100);
                                                const goalDiff = opponent.goalsFor - opponent.goalsAgainst;
                                                return `
                                                    <tr>
                                                        <td class="fw-medium">${opponent.name}</td>
                                                        <td class="text-center">${opponent.played}</td>
                                                        <td class="text-center text-success">${opponent.wins}</td>
                                                        <td class="text-center text-warning">${opponent.draws}</td>
                                                        <td class="text-center text-danger">${opponent.losses}</td>
                                                        <td class="text-center">
                                                            <span class="badge ${winRate >= 60 ? 'bg-success' : winRate >= 40 ? 'bg-warning' : 'bg-danger'}">${winRate}%</span>
                                                        </td>
                                                        <td class="text-center">${opponent.goalsFor}</td>
                                                        <td class="text-center">${opponent.goalsAgainst}</td>
                                                        <td class="text-center ${goalDiff > 0 ? 'text-success' : goalDiff < 0 ? 'text-danger' : ''}">${goalDiff > 0 ? '+' : ''}${goalDiff}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-muted mb-0">No opponent data available</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('opponentStats').innerHTML = html;
    }

    renderPerformanceTab(stats) {
        const { performance, overview } = stats;
        
        const html = `
            <div class="row">
                <!-- Recent Form -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Recent Form</h6>
                        </div>
                        <div class="card-body">
                            <div class="form-display mb-3">
                                ${performance.recentForm.length > 0 ? 
                                    performance.recentForm.map(result => `
                                        <span class="form-result ${result === 'W' ? 'win' : result === 'D' ? 'draw' : 'loss'}">${result}</span>
                                    `).join('') 
                                    : '<span class="text-muted">No recent matches</span>'
                                }
                            </div>
                            ${performance.currentStreak > 0 ? `
                                <div class="current-streak">
                                    <strong>Current Streak:</strong> 
                                    <span class="badge ${performance.streakType === 'W' ? 'bg-success' : performance.streakType === 'D' ? 'bg-warning' : 'bg-danger'}">
                                        ${performance.currentStreak} ${performance.streakType === 'W' ? 'wins' : performance.streakType === 'D' ? 'draws' : 'losses'}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Home vs Away -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-home me-2"></i>Home vs Away</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6">
                                    <h6 class="text-primary">Home</h6>
                                    <div class="stat-number">${performance.homeRecord.winRate}%</div>
                                    <small class="text-muted">${performance.homeRecord.wins}W ${performance.homeRecord.draws}D ${performance.homeRecord.losses}L</small>
                                </div>
                                <div class="col-6">
                                    <h6 class="text-info">Away</h6>
                                    <div class="stat-number">${performance.awayRecord.winRate}%</div>
                                    <small class="text-muted">${performance.awayRecord.wins}W ${performance.awayRecord.draws}D ${performance.awayRecord.losses}L</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-tachometer-alt me-2"></i>Performance Metrics</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-md-2 col-4 mb-3">
                                    <div class="metric-card">
                                        <div class="stat-number text-primary">${overview.avgGoalsFor}</div>
                                        <small class="text-muted">Avg Goals For</small>
                                    </div>
                                </div>
                                <div class="col-md-2 col-4 mb-3">
                                    <div class="metric-card">
                                        <div class="stat-number text-danger">${overview.avgGoalsAgainst}</div>
                                        <small class="text-muted">Avg Goals Against</small>
                                    </div>
                                </div>
                                <div class="col-md-2 col-4 mb-3">
                                    <div class="metric-card">
                                        <div class="stat-number text-success">${overview.winRate}%</div>
                                        <small class="text-muted">Win Rate</small>
                                    </div>
                                </div>
                                <div class="col-md-2 col-4 mb-3">
                                    <div class="metric-card">
                                        <div class="stat-number text-info">${overview.avgDuration}</div>
                                        <small class="text-muted">Avg Duration (min)</small>
                                    </div>
                                </div>
                                <div class="col-md-2 col-4 mb-3">
                                    <div class="metric-card">
                                        <div class="stat-number ${overview.goalDifference >= 0 ? 'text-success' : 'text-danger'}">${overview.goalDifference > 0 ? '+' : ''}${overview.goalDifference}</div>
                                        <small class="text-muted">Goal Difference</small>
                                    </div>
                                </div>
                                <div class="col-md-2 col-4 mb-3">
                                    <div class="metric-card">
                                        <div class="stat-number text-warning">${overview.totalMatches}</div>
                                        <small class="text-muted">Total Matches</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('performanceStats').innerHTML = html;
    }

    refreshStatistics() {
        const refreshBtn = document.getElementById('refreshStatsBtn');
        const originalText = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Refreshing...';
        refreshBtn.disabled = true;

        setTimeout(() => {
            statisticsService.getStatistics(true); // Force refresh
            this.loadTabContent(this.currentTab);
            
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
            
            notificationManager.success('Statistics refreshed successfully');
        }, 1000);
    }

    exportStatistics() {
        try {
            const data = statisticsService.exportStatistics();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `nufc-gametime-stats-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            notificationManager.success('Statistics exported successfully');
        } catch (error) {
            console.error('Error exporting statistics:', error);
            notificationManager.error('Failed to export statistics');
        }
    }
}

// Create and export singleton instance
export const statisticsModal = new StatisticsModal();

// Export convenience method
export function showStatisticsModal() {
    statisticsModal.show();
}
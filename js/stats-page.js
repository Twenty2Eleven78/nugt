/**
 * Statistics Page - Standalone non-authenticated stats viewer
 * @version 4.0
 */

import { notificationManager } from './modules/services/notifications.js';
import { faFullTimeService } from './modules/services/fa-fulltime.js';
import { seasonCharts } from './modules/ui/season-charts.js';
import { config } from './modules/shared/config.js';

class StatsPage {
    constructor() {
        this.currentView = 'overview';
        this.statistics = null;
        this.leagueTable = null;
        this.isInitialized = false;
        this.isLoadingLeagueTable = false;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Clear any cached data first
            this._clearAllCaches();

            // Load configuration first
            try {
                await config.load();
                console.log('Configuration loaded successfully');
            } catch (error) {
                console.warn('Configuration loading failed, using defaults:', error.message);
            }

            // Load statistics data
            await this._loadStatistics();

            // Bind event listeners
            this._bindEventListeners();

            // Render initial view
            await this._renderCurrentView();

            this.isInitialized = true;
            console.log('Stats page initialized successfully');

            // Show data source notification
            this._showDataSourceNotification();
        } catch (error) {
            console.error('Failed to initialize stats page:', error);
            this._renderError('Failed to initialize statistics page');
        }
    }

    _clearAllCaches() {
        // Clear browser caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }

        // Clear any localStorage related to stats
        try {
            localStorage.removeItem('generatedStatistics');
            localStorage.removeItem('saved-league-table');
        } catch (error) {
            console.warn('Could not clear localStorage:', error);
        }

        // Reset internal cache
        this.leagueTable = null;
        this.statistics = null;
        this.isLoadingLeagueTable = false;

        console.log('🧹 All caches cleared for fresh data');
    }

    async _loadStatistics() {
        try {
            // Force fresh data by adding cache-busting parameters
            const timestamp = Date.now();
            const cacheBuster = `?t=${timestamp}&nocache=true`;

            console.log('📊 Loading fresh statistics data...');

            // Try to load from Netlify function with cache busting
            const response = await fetch(`/.netlify/functions/public-stats${cacheBuster}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (response.ok) {
                this.statistics = await response.json();
                console.log('✅ Fresh statistics loaded from server');
                this._updateDataSourceIndicator();
            } else {
                console.warn('⚠️ Failed to load statistics from server, using demo data');
                // Fallback to demo data
                this.statistics = this._getDemoStatistics();
                this._updateDataSourceIndicator();
            }
        } catch (error) {
            console.warn('❌ Could not load live statistics, using demo data:', error);
            this.statistics = this._getDemoStatistics();
            this._updateDataSourceIndicator();
        }
    }

    _updateDataSourceIndicator() {
        const subtitle = document.getElementById('stats-subtitle');
        if (subtitle && this.statistics) {
            if (this.statistics.isLiveData) {
                const lastUpdated = new Date(this.statistics.lastUpdated).toLocaleDateString();
                subtitle.innerHTML = `
                    <i class="fas fa-check-circle text-success me-1"></i>
                    Live statistics - Last updated: ${lastUpdated}
                `;
                subtitle.className = 'text-success';
            } else {
                subtitle.innerHTML = `
                    <i class="fas fa-info-circle text-warning me-1"></i>
                    Demo data - No live statistics available
                `;
                subtitle.className = 'text-warning';
            }
        }
    }

    _showDataSourceNotification() {
        if (this.statistics) {
            if (this.statistics.isLiveData) {
                const lastUpdated = new Date(this.statistics.lastUpdated).toLocaleDateString();
                notificationManager.success(`Loaded live statistics generated on ${lastUpdated}`);
            } else {
                notificationManager.info('Showing demo data. Live statistics will appear here once generated by admin.');
            }
        }
    }

    _getDemoStatistics() {
        return {
            totalMatches: 12,
            totalGoals: 28,
            totalAssists: 15,
            playerStats: [
                { name: 'John Smith', goals: 8, assists: 3, appearances: 10, isRosterPlayer: true },
                { name: 'Mike Johnson', goals: 6, assists: 4, appearances: 12, isRosterPlayer: true },
                { name: 'David Wilson', goals: 5, assists: 2, appearances: 9, isRosterPlayer: true },
                { name: 'Chris Brown', goals: 4, assists: 3, appearances: 11, isRosterPlayer: true },
                { name: 'Tom Davis', goals: 3, assists: 2, appearances: 8, isRosterPlayer: true },
                { name: 'Alex Miller', goals: 2, assists: 1, appearances: 7, isRosterPlayer: true }
            ],
            teamStats: {
                totalMatches: 12,
                wins: 7,
                draws: 3,
                losses: 2,
                goalsFor: 28,
                goalsAgainst: 15,
                winPercentage: 58,
                avgGoalsFor: '2.3',
                avgGoalsAgainst: '1.3',
                avgAttendance: '18.5',
                avgAssists: '1.3'
            },
            matchStats: [
                { date: '2024-01-15', opposition: 'City United', ourGoals: 3, theirGoals: 1, attendance: 20 },
                { date: '2024-01-22', opposition: 'Rangers FC', ourGoals: 2, theirGoals: 2, attendance: 18 },
                { date: '2024-01-29', opposition: 'Athletic Club', ourGoals: 1, theirGoals: 0, attendance: 22 },
                { date: '2024-02-05', opposition: 'Town FC', ourGoals: 4, theirGoals: 2, attendance: 19 },
                { date: '2024-02-12', opposition: 'Rovers United', ourGoals: 2, theirGoals: 1, attendance: 17 }
            ]
        };
    }

    _bindEventListeners() {
        const container = document.getElementById('stats-content');
        if (!container) return;

        // Handle desktop navigation pill clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.stats-nav-pill');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                this._handleViewChange(button);
            }
        });

        // Handle league table controls
        document.addEventListener('click', (e) => {
            if (e.target.closest('#actual-table-btn')) {
                this._showActualTable();
            } else if (e.target.closest('#predicted-table-btn')) {
                this._showPredictedTable();
            }
        });

        // Handle refresh button clicks (both desktop and mobile)
        document.addEventListener('click', (e) => {
            if (e.target.closest('#refresh-data-btn') || e.target.closest('#mobile-refresh-btn')) {
                this._refreshAllData();
            }
        });

        // Handle mobile navigation
        this._bindMobileNavigation();

        // Handle window resize for responsive adjustments
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this._handleResize();
            }, 250);
        });
    }

    _bindMobileNavigation() {
        const mobileToggle = document.getElementById('mobile-nav-toggle');
        const mobileSidebar = document.getElementById('mobile-nav-sidebar');
        const mobileOverlay = document.getElementById('mobile-nav-overlay');
        const mobileClose = document.getElementById('mobile-nav-close');

        // Debug: Check if elements exist
        console.log('Mobile nav elements:', {
            toggle: !!mobileToggle,
            sidebar: !!mobileSidebar,
            overlay: !!mobileOverlay,
            close: !!mobileClose
        });

        // Toggle mobile sidebar
        if (mobileToggle) {
            mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Mobile toggle clicked');
                this._showMobileSidebar();
            });
        }

        // Close sidebar when clicking overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                this._hideMobileSidebar();
            });
        }

        // Close sidebar when clicking close button
        if (mobileClose) {
            mobileClose.addEventListener('click', () => {
                this._hideMobileSidebar();
            });
        }

        // Handle mobile navigation item clicks
        document.addEventListener('click', (e) => {
            const mobileNavItem = e.target.closest('.mobile-nav-item');
            if (mobileNavItem) {
                e.preventDefault();
                e.stopPropagation();
                this._handleViewChange(mobileNavItem);
                this._hideMobileSidebar();
            }
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileSidebar && mobileSidebar.classList.contains('show')) {
                this._hideMobileSidebar();
            }
        });
    }

    _showMobileSidebar() {
        const sidebar = document.getElementById('mobile-nav-sidebar');
        const toggle = document.getElementById('mobile-nav-toggle');

        console.log('Showing mobile sidebar:', !!sidebar);

        if (sidebar) {
            sidebar.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('Sidebar classes:', sidebar.className);
        }

        if (toggle) {
            toggle.classList.add('active');
        }
    }

    _hideMobileSidebar() {
        const sidebar = document.getElementById('mobile-nav-sidebar');
        const toggle = document.getElementById('mobile-nav-toggle');

        if (sidebar) {
            sidebar.classList.remove('show');
            document.body.style.overflow = '';
        }

        if (toggle) {
            toggle.classList.remove('active');
        }
    }

    _handleViewChange(button) {
        const view = button.getAttribute('data-view');
        if (!view || view === this.currentView) return;

        // Update active states for both desktop and mobile
        const desktopButtons = document.querySelectorAll('.stats-nav-pill');
        const mobileButtons = document.querySelectorAll('.mobile-nav-item');

        desktopButtons.forEach(btn => btn.classList.remove('active'));
        mobileButtons.forEach(btn => btn.classList.remove('active'));

        // Set active state for current view
        const activeDesktop = document.querySelector(`.stats-nav-pill[data-view="${view}"]`);
        const activeMobile = document.querySelector(`.mobile-nav-item[data-view="${view}"]`);

        if (activeDesktop) activeDesktop.classList.add('active');
        if (activeMobile) activeMobile.classList.add('active');

        // Update mobile toggle label
        this._updateMobileToggleLabel(view);

        // Add loading state and change view
        const container = document.getElementById('stats-content');
        if (container) {
            container.style.opacity = '0.5';
            setTimeout(async () => {
                this.currentView = view;
                await this._renderCurrentView();
                container.style.opacity = '1';

                // Scroll to top of content
                container.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Initialize charts if charts view
                if (view === 'charts') {
                    setTimeout(() => {
                        seasonCharts.initializeCharts(this.statistics);
                    }, 200);
                }
            }, 150);
        }
    }

    _updateMobileToggleLabel(view) {
        const label = document.getElementById('current-view-label');
        if (!label) return;

        const viewLabels = {
            'overview': 'Overview',
            'players': 'Players',
            'teams': 'Team',
            'matches': 'Matches',
            'league': 'League Table',
            'charts': 'Charts'
        };

        label.textContent = viewLabels[view] || 'Overview';
    }

    _handleResize() {
        // Close mobile sidebar if screen becomes large
        if (window.innerWidth > 768) {
            this._hideMobileSidebar();
        }

        // Re-render charts if visible and screen size changed significantly
        if (this.currentView === 'charts' && this.statistics) {
            setTimeout(() => {
                seasonCharts.initializeCharts(this.statistics);
            }, 100);
        }
    }

    async _renderCurrentView() {
        const container = document.getElementById('stats-content');
        if (!container) return;

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
                html = this._renderMatchStats();
                break;
            case 'league':
                html = await this._renderLeagueTable();
                break;
            case 'charts':
                html = await this._renderChartsView();
                break;
        }

        container.innerHTML = html;
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
                <div class="col-6">
                    <div class="stats-section">
                        <div class="stats-section-header">
                            <i class="fas fa-trophy text-warning me-2"></i>
                            <span>Top Goal Scorers</span>
                        </div>
                        <div class="stats-section-body" style="height: calc(100vh - 320px); min-height: 350px; max-height: 600px; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                            ${this._renderTopScorers(stats.playerStats || [])}
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="stats-section">
                        <div class="stats-section-header">
                            <i class="fas fa-handshake text-info me-2"></i>
                            <span>Top Assist Providers</span>
                        </div>
                        <div class="stats-section-body" style="height: calc(100vh - 320px); min-height: 350px; max-height: 600px; overflow-y: auto; -webkit-overflow-scrolling: touch;">
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
                            <div class="stats-number">${playerStats.length}</div>
                            <div class="stats-label">Players</div>
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
                    <div class="stats-card stats-card-info">
                        <div class="stats-icon">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${totalGoals + totalAssists}</div>
                            <div class="stats-label">Contributions</div>
                            <div class="stats-sub">${(totalGoals + totalAssists) / playerStats.length > 0 ? ((totalGoals + totalAssists) / playerStats.length).toFixed(1) : '0.0'} per player</div>
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
                        <div class="stats-section-body" style="height: calc(100vh - 380px); min-height: 350px; max-height: 600px; overflow-y: auto; -webkit-overflow-scrolling: touch;">
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
                <div class="col-6">
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
                <div class="col-6">
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
            <div class="row g-2 mb-3">
                <div class="col-4">
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
                <div class="col-4">
                    <div class="stats-card stats-card-danger">
                        <div class="stats-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${teamStats.losses || 0}</div>
                            <div class="stats-label">Losses</div>
                            <div class="stats-sub">${teamStats.avgGoalsAgainst || '0.0'} goals/game</div>
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="stats-card stats-card-warning">
                        <div class="stats-icon">
                            <i class="fas fa-handshake"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${teamStats.draws || 0}</div>
                            <div class="stats-label">Draws</div>
                            <div class="stats-sub">${teamStats.totalMatches ? ((teamStats.draws || 0) / teamStats.totalMatches * 100).toFixed(1) : '0.0'}% of matches</div>
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
                            <div class="stats-section-body" style="padding: 1rem; overflow: visible;">
                                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: flex-start;">
                                    ${opponents.map(opponent => `
                                        <span class="opposition-team-badge">${this._escapeHtml(opponent)}</span>
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

    _renderMatchStats() {
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
                        <div class="stats-section-body" style="height: calc(100vh - 380px); min-height: 350px; max-height: 600px; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                            ${this._renderMatchCards(matchStats)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async _renderLeagueTable() {
        try {
            // Get league table URL from config
            const leagueTableUrl = config.get('team.leagueTableUrl');
            console.log('🔍 League table URL from config:', leagueTableUrl);

            if (!leagueTableUrl) {
                console.warn('⚠️ No league table URL configured');
                return `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>League Table URL Not Configured</strong><br>
                        Please configure the league table URL in the team settings to view the league table.
                    </div>
                `;
            }

            // Check if we already have league table data
            if (this.leagueTable) {
                console.log('📋 Using cached league table data');
                const teamName = config.get('team.defaultTeam1Name', 'Netherton');
                return this._renderLeagueTableWithControls(this.leagueTable, teamName);
            }

            // Prevent multiple simultaneous calls
            if (this.isLoadingLeagueTable) {
                console.log('⏳ League table already loading, showing loading state...');
                return `
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary mb-3" role="status"></div>
                        <p class="text-muted">Loading league table...</p>
                    </div>
                `;
            }

            // Set loading flag
            this.isLoadingLeagueTable = true;
            console.log('🏆 Loading fresh league table data...');

            try {
                // Force fresh league table data
                console.log('🌐 Calling faFullTimeService.getLeagueTable...');
                this.leagueTable = await faFullTimeService.getLeagueTable(leagueTableUrl);
                console.log('✅ Fresh league table loaded:', this.leagueTable);

                if (!this.leagueTable || !this.leagueTable.teams) {
                    throw new Error('Invalid league table data received');
                }

                const teamName = config.get('team.defaultTeam1Name', 'Netherton');
                console.log('🏆 Rendering league table with team name:', teamName);
                return this._renderLeagueTableWithControls(this.leagueTable, teamName);

            } catch (error) {
                console.error('❌ Failed to load league table:', error);
                return `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>League Table Unavailable</strong><br>
                        Could not load the league table at this time. Please try again later.
                        <br><small class="text-muted">Error: ${error.message}</small>
                    </div>
                `;
            } finally {
                // Always clear the loading flag
                this.isLoadingLeagueTable = false;
                console.log('🏁 League table loading completed');
            }

        } catch (error) {
            this.isLoadingLeagueTable = false;
            console.error('❌ League table render error:', error);
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    }

    _renderLeagueTableWithControls(leagueData, teamName) {
        if (!leagueData || !leagueData.teams) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No league table data available.
                </div>
            `;
        }

        return `
            <!-- Enhanced League Table Controls -->
            <div class="league-controls-header mb-3" style="background: var(--bg-card, #f8f9fa); border: 1px solid var(--border-color, #dee2e6); border-radius: var(--border-radius, 0.375rem); padding: 1rem;">
                <div class="d-flex justify-content-center">
                    <div class="btn-group" role="group" aria-label="League table view options">
                        <button type="button" class="btn btn-outline-primary active" id="actual-table-btn">
                            <i class="fas fa-table me-1"></i>
                            <span class="d-none d-sm-inline">Current </span>Table
                        </button>
                        <button type="button" class="btn btn-outline-success" id="predicted-table-btn">
                            <i class="fas fa-calculator me-1"></i>
                            <span class="d-none d-sm-inline">Predicted </span>Max Points
                        </button>
                    </div>
                </div>
                <div class="text-center mt-2">
                    <small class="text-muted" id="league-table-info">
                        <i class="fas fa-table me-1"></i>Showing current league standings
                    </small>
                </div>
            </div>

            <!-- League Table Container - Extended to bottom -->
            <div id="league-table-container" class="league-table-full" style="height: calc(100vh - 380px); min-height: 400px; max-height: 700px; overflow-y: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--border-color, #dee2e6); border-radius: var(--border-radius, 0.375rem);">
                ${this._renderActualTable(leagueData, teamName)}
            </div>
        `;
    }

    _renderActualTable(leagueData, teamName) {
        const highlightName = teamName.toLowerCase();

        return `
            <div class="table-responsive" style="height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                <table class="table table-sm table-hover mb-0" style="font-size: 0.85rem;">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th class="position-col">Pos</th>
                            <th class="team-col">Team</th>
                            <th class="text-center">P</th>
                            <th class="text-center">W</th>
                            <th class="text-center">D</th>
                            <th class="text-center">L</th>
                            <th class="text-center">GF</th>
                            <th class="text-center">GA</th>
                            <th class="text-center">GD</th>
                            <th class="text-center points-col">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leagueData.teams.map((team, index) => {
            const isHighlighted = highlightName && team.team.toLowerCase().includes(highlightName);
            const rowClass = isHighlighted ? 'table-info fw-bold' : '';
            const goalDiff = team.goalsFor - team.goalsAgainst;
            const goalDiffDisplay = goalDiff > 0 ? `+${goalDiff}` : goalDiff.toString();

            return `
                                <tr class="${rowClass}">
                                    <td class="text-center position-col">${index + 1}</td>
                                    <td class="team-col">
                                        <div class="team-name">${this._escapeHtml(team.team)}</div>
                                    </td>
                                    <td class="text-center">${team.played}</td>
                                    <td class="text-center">${team.won}</td>
                                    <td class="text-center">${team.drawn}</td>
                                    <td class="text-center">${team.lost}</td>
                                    <td class="text-center">${team.goalsFor}</td>
                                    <td class="text-center">${team.goalsAgainst}</td>
                                    <td class="text-center ${goalDiff > 0 ? 'text-success' : goalDiff < 0 ? 'text-danger' : ''}">${goalDiffDisplay}</td>
                                    <td class="text-center fw-bold points-col">${team.points}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    _renderPredictedTable(leagueData, teamName) {
        const highlightName = teamName.toLowerCase();
        const teams = leagueData.teams;
        const totalGames = (teams.length - 1) * 2;

        const predictedTeams = teams.map(team => {
            const remainingGames = totalGames - team.played;
            const maxPoints = team.points + (remainingGames * 3);
            return {
                ...team,
                predictedPoints: maxPoints,
                remainingGames: remainingGames,
            };
        });

        predictedTeams.sort((a, b) => b.predictedPoints - a.predictedPoints);

        return `
            <div class="table-responsive" style="height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                <table class="table table-sm table-hover mb-0" style="font-size: 0.85rem;">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th class="position-col">Pos</th>
                            <th class="team-col">Team</th>
                            <th class="text-center">Current Pts</th>
                            <th class="text-center">Remaining</th>
                            <th class="text-center points-col">Max Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${predictedTeams.map((team, index) => {
            const isHighlighted = highlightName && team.team.toLowerCase().includes(highlightName);
            const rowClass = isHighlighted ? 'table-info fw-bold' : '';

            return `
                                <tr class="${rowClass}">
                                    <td class="text-center position-col">${index + 1}</td>
                                    <td class="team-col">
                                        <div class="team-name">${this._escapeHtml(team.team)}</div>
                                        <small class="text-muted">${team.remainingGames} games left</small>
                                    </td>
                                    <td class="text-center">${team.points}</td>
                                    <td class="text-center">${team.remainingGames}</td>
                                    <td class="text-center fw-bold points-col text-primary">${team.predictedPoints}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="fas fa-calculator me-1"></i>
                        Predicted table based on teams winning all remaining games.
                    </small>
                </div>
            </div>
        `;
    }

    async _renderChartsView() {
        if (!this.statistics) return this._renderNoDataMessage();

        const matchStats = this.statistics.matchStats || [];
        if (matchStats.length === 0) {
            return `
                <div class="stats-empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="empty-state-content">
                        <h4>No Chart Data Available</h4>
                        <p>Charts require match data to display trends and progression.</p>
                    </div>
                </div>
            `;
        }

        return `<div style="max-height: 70vh; overflow-y: auto; -webkit-overflow-scrolling: touch;">${await seasonCharts.renderChartsSection(this.statistics)}</div>`;
    }

    _renderTopScorers(playerStats) {
        const topScorers = [...playerStats]
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10);

        if (topScorers.length === 0) {
            return '<div class="text-muted text-center py-3">No goal scorers yet</div>';
        }

        return topScorers.map((player, index) => `
            <div class="player-stat-item">
                <div class="player-rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${this._escapeHtml(player.name)}</div>
                    <div class="player-details">${player.appearances} appearances</div>
                </div>
                <div class="player-stat-value">${player.goals}</div>
            </div>
        `).join('');
    }

    _renderTopAssists(playerStats) {
        const topAssists = [...playerStats]
            .filter(p => p.assists > 0)
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 10);

        if (topAssists.length === 0) {
            return '<div class="text-muted text-center py-3">No assists recorded yet</div>';
        }

        return topAssists.map((player, index) => `
            <div class="player-stat-item">
                <div class="player-rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${this._escapeHtml(player.name)}</div>
                    <div class="player-details">${player.appearances} appearances</div>
                </div>
                <div class="player-stat-value">${player.assists}</div>
            </div>
        `).join('');
    }

    _renderPlayerRankings(playerStats) {
        const sortedPlayers = [...playerStats].sort((a, b) => {
            const aTotal = a.goals + a.assists;
            const bTotal = b.goals + b.assists;
            if (bTotal !== aTotal) return bTotal - aTotal;
            return b.goals - a.goals;
        });

        return `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 40px;" class="small">Rank</th>
                            <th class="small">Player</th>
                            <th class="text-center small" style="width: 40px;">G</th>
                            <th class="text-center small" style="width: 40px;">A</th>
                            <th class="text-center small" style="width: 50px;">Total</th>
                            <th class="text-center small" style="width: 50px;">Apps</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedPlayers.map((player, index) => `
                            <tr>
                                <td class="text-center small">${index + 1}</td>
                                <td class="small">${this._escapeHtml(player.name)}</td>
                                <td class="text-center small">${player.goals}</td>
                                <td class="text-center small">${player.assists}</td>
                                <td class="text-center small fw-bold">${player.goals + player.assists}</td>
                                <td class="text-center small text-muted">${player.appearances}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    _renderMatchCards(matchStats) {
        return matchStats.map(match => {
            const result = match.ourGoals > match.theirGoals ? 'W' :
                match.ourGoals < match.theirGoals ? 'L' : 'D';
            const resultClass = result === 'W' ? 'success' : result === 'L' ? 'danger' : 'warning';

            return `
                <div class="match-card mb-2">
                    <div class="match-card-header">
                        <div class="match-date">${new Date(match.date).toLocaleDateString('en-GB')}</div>
                        <div class="match-result">
                            <span class="badge bg-${resultClass}">${result}</span>
                        </div>
                    </div>
                    <div class="match-card-body">
                        <div class="match-teams">
                            <span class="team-name">Netherton</span>
                            <span class="match-score">${match.ourGoals} - ${match.theirGoals}</span>
                            <span class="team-name">${this._escapeHtml(match.opposition)}</span>
                        </div>
                        <div class="match-details">
                            <small class="text-muted">
                                <i class="fas fa-users me-1"></i>${match.attendance} attendance
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    _renderNoDataMessage() {
        return `
            <div class="stats-empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="empty-state-content">
                    <h4>No Statistics Available</h4>
                    <p>Statistics will appear here once match data is available.</p>
                </div>
            </div>
        `;
    }

    _renderError(message) {
        const container = document.getElementById('stats-content');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    }

    _showActualTable() {
        if (!this.leagueTable) return;

        const container = document.getElementById('league-table-container');
        const actualBtn = document.getElementById('actual-table-btn');
        const predictedBtn = document.getElementById('predicted-table-btn');

        if (container && actualBtn && predictedBtn) {
            const teamName = config.get('team.defaultTeam1Name', 'Netherton');
            container.innerHTML = this._renderActualTable(this.leagueTable, teamName);

            // Update button states
            actualBtn.classList.add('active');
            actualBtn.classList.remove('btn-outline-primary');
            actualBtn.classList.add('btn-primary');

            predictedBtn.classList.remove('active');
            predictedBtn.classList.remove('btn-primary', 'btn-success');
            predictedBtn.classList.add('btn-outline-success');

            // Update info text
            const infoElement = document.getElementById('league-table-info');
            if (infoElement) {
                infoElement.innerHTML = '<i class="fas fa-table me-1"></i>Showing current league standings';
            }
        }
    }

    _showPredictedTable() {
        if (!this.leagueTable) return;

        const container = document.getElementById('league-table-container');
        const actualBtn = document.getElementById('actual-table-btn');
        const predictedBtn = document.getElementById('predicted-table-btn');

        if (container && actualBtn && predictedBtn) {
            const teamName = config.get('team.defaultTeam1Name', 'Netherton');
            container.innerHTML = this._renderPredictedTable(this.leagueTable, teamName);

            // Update button states
            predictedBtn.classList.add('active');
            predictedBtn.classList.remove('btn-outline-success');
            predictedBtn.classList.add('btn-success');

            actualBtn.classList.remove('active');
            actualBtn.classList.remove('btn-primary');
            actualBtn.classList.add('btn-outline-primary');

            // Update info text
            const infoElement = document.getElementById('league-table-info');
            if (infoElement) {
                infoElement.innerHTML = '<i class="fas fa-calculator me-1"></i>Showing predicted maximum points';
            }
        }
    }

    async _refreshAllData() {
        const refreshBtn = document.getElementById('refresh-data-btn');
        const mobileRefreshBtn = document.getElementById('mobile-refresh-btn');
        const refreshIcon = refreshBtn?.querySelector('i');
        const mobileRefreshIcon = mobileRefreshBtn?.querySelector('i');

        try {
            // Show loading state on both buttons
            if (refreshBtn) {
                refreshBtn.disabled = true;
                if (refreshIcon) {
                    refreshIcon.classList.add('fa-spin');
                }
            }
            if (mobileRefreshBtn) {
                mobileRefreshBtn.disabled = true;
                if (mobileRefreshIcon) {
                    mobileRefreshIcon.classList.add('fa-spin');
                }
            }

            console.log('🔄 Refreshing all data...');

            // Clear all caches
            this._clearAllCaches();

            // Reload statistics
            await this._loadStatistics();

            // Re-render current view
            await this._renderCurrentView();

            // Show success notification (if notification system is available)
            console.log('✅ All data refreshed');

        } catch (error) {
            console.error('❌ Failed to refresh data:', error);
        } finally {
            // Reset button states
            if (refreshBtn) {
                refreshBtn.disabled = false;
                if (refreshIcon) {
                    refreshIcon.classList.remove('fa-spin');
                }
            }
            if (mobileRefreshBtn) {
                mobileRefreshBtn.disabled = false;
                if (mobileRefreshIcon) {
                    mobileRefreshIcon.classList.remove('fa-spin');
                }
            }
        }
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the stats page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const statsPage = new StatsPage();
    statsPage.init();
});
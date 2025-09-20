/**
 * Season Progression Charts
 * Chart.js integration for visual analytics
 * @version 4.0
 */

class SeasonCharts {
  constructor() {
    this.charts = {};
    this.chartColors = {
      primary: '#dc3545',
      success: '#28a745',
      warning: '#ffc107',
      info: '#17a2b8',
      secondary: '#6c757d'
    };
  }

  // Load Chart.js dynamically
  async loadChartJS() {
    if (window.Chart) return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Create goals per match trend chart
  createGoalsPerMatchChart(container, matchStats) {
    if (!matchStats || matchStats.length === 0) return null;

    const ctx = document.createElement('canvas');
    container.appendChild(ctx);

    const labels = matchStats.map((match, index) => `Match ${index + 1}`);
    const goalsData = matchStats.map(match => match.ourGoals || 0);
    const concededData = matchStats.map(match => match.theirGoals || 0);

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Goals Scored',
          data: goalsData,
          borderColor: this.chartColors.success,
          backgroundColor: this.chartColors.success + '20',
          tension: 0.4,
          fill: false
        }, {
          label: 'Goals Conceded',
          data: concededData,
          borderColor: this.chartColors.primary,
          backgroundColor: this.chartColors.primary + '20',
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  // Create win/loss progression chart
  createWinLossChart(container, matchStats) {
    if (!matchStats || matchStats.length === 0) return null;

    const ctx = document.createElement('canvas');
    container.appendChild(ctx);

    let wins = 0, draws = 0, losses = 0;
    const progressionData = matchStats.map((match, index) => {
      const ourGoals = match.ourGoals || 0;
      const theirGoals = match.theirGoals || 0;
      
      if (ourGoals > theirGoals) wins++;
      else if (ourGoals === theirGoals) draws++;
      else losses++;
      
      return { wins, draws, losses, match: index + 1 };
    });

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: progressionData.map(d => `Match ${d.match}`),
        datasets: [{
          label: 'Wins',
          data: progressionData.map(d => d.wins),
          borderColor: this.chartColors.success,
          backgroundColor: this.chartColors.success + '20',
          tension: 0.4
        }, {
          label: 'Draws',
          data: progressionData.map(d => d.draws),
          borderColor: this.chartColors.warning,
          backgroundColor: this.chartColors.warning + '20',
          tension: 0.4
        }, {
          label: 'Losses',
          data: progressionData.map(d => d.losses),
          borderColor: this.chartColors.primary,
          backgroundColor: this.chartColors.primary + '20',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  // Create player performance chart
  createPlayerPerformanceChart(container, playerStats) {
    if (!playerStats || playerStats.length === 0) return null;

    const ctx = document.createElement('canvas');
    container.appendChild(ctx);

    const topPlayers = playerStats
      .filter(p => p.totalContributions > 0)
      .sort((a, b) => b.totalContributions - a.totalContributions)
      .slice(0, 8);

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topPlayers.map(p => p.name),
        datasets: [{
          label: 'Goals',
          data: topPlayers.map(p => p.goals),
          backgroundColor: this.chartColors.success + '80',
          borderColor: this.chartColors.success,
          borderWidth: 1
        }, {
          label: 'Assists',
          data: topPlayers.map(p => p.assists),
          backgroundColor: this.chartColors.info + '80',
          borderColor: this.chartColors.info,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  // Create attendance trend chart
  createAttendanceChart(container, matchStats) {
    if (!matchStats || matchStats.length === 0) return null;

    const ctx = document.createElement('canvas');
    container.appendChild(ctx);

    const attendanceData = matchStats.map(match => match.attendance || 0);
    const avgAttendance = attendanceData.reduce((sum, att) => sum + att, 0) / attendanceData.length;

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: matchStats.map((match, index) => `Match ${index + 1}`),
        datasets: [{
          label: 'Attendance',
          data: attendanceData,
          backgroundColor: this.chartColors.info + '60',
          borderColor: this.chartColors.info,
          borderWidth: 1
        }, {
          label: 'Average',
          data: new Array(attendanceData.length).fill(avgAttendance),
          type: 'line',
          borderColor: this.chartColors.warning,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  // Render charts section
  async renderChartsSection(statistics) {
    if (!statistics) return '';

    try {
      await this.loadChartJS();
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
      return '<div class="alert alert-warning">Charts unavailable - failed to load Chart.js</div>';
    }

    return `
      <div class="row g-2">
        <div class="col-12 col-lg-6">
          <div class="stats-section">
            <div class="stats-section-header">
              <i class="fas fa-chart-line text-success me-2"></i>
              <span>Goals Per Match Trend</span>
            </div>
            <div class="stats-section-body" style="height: 250px;">
              <div id="goals-trend-chart"></div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="stats-section">
            <div class="stats-section-header">
              <i class="fas fa-trophy text-warning me-2"></i>
              <span>Win/Loss Progression</span>
            </div>
            <div class="stats-section-body" style="height: 250px;">
              <div id="winloss-chart"></div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="stats-section">
            <div class="stats-section-header">
              <i class="fas fa-users text-primary me-2"></i>
              <span>Top Player Performance</span>
            </div>
            <div class="stats-section-body" style="height: 250px;">
              <div id="player-performance-chart"></div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="stats-section">
            <div class="stats-section-header">
              <i class="fas fa-chart-bar text-info me-2"></i>
              <span>Attendance Trend</span>
            </div>
            <div class="stats-section-body" style="height: 250px;">
              <div id="attendance-chart"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize charts after rendering
  async initializeCharts(statistics) {
    if (!statistics || !window.Chart) return;

    // Clear existing charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};

    const matchStats = statistics.matchStats || [];
    const playerStats = statistics.playerStats || [];

    // Create charts
    const goalsContainer = document.getElementById('goals-trend-chart');
    if (goalsContainer && matchStats.length > 0) {
      this.charts.goals = this.createGoalsPerMatchChart(goalsContainer, matchStats);
    }

    const winlossContainer = document.getElementById('winloss-chart');
    if (winlossContainer && matchStats.length > 0) {
      this.charts.winloss = this.createWinLossChart(winlossContainer, matchStats);
    }

    const playerContainer = document.getElementById('player-performance-chart');
    if (playerContainer && playerStats.length > 0) {
      this.charts.player = this.createPlayerPerformanceChart(playerContainer, playerStats);
    }

    const attendanceContainer = document.getElementById('attendance-chart');
    if (attendanceContainer && matchStats.length > 0) {
      this.charts.attendance = this.createAttendanceChart(attendanceContainer, matchStats);
    }
  }

  // Destroy all charts
  destroyCharts() {
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
  }
}

export const seasonCharts = new SeasonCharts();
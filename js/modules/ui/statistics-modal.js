import { CustomModal } from '../shared/custom-modal.js';
import { sharingService } from '../services/sharing.js';
import { notificationManager } from '../services/notifications.js';

const modalHtml = `
<div class="modal fade" id="statistics-modal" tabindex="-1" aria-labelledby="statistics-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="statistics-modal-label">Cloud Game Statistics</h5>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="statistics-modal-body">
                <!-- Statistics content will be generated here -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="share-stats-btn">
                    <i class="fas fa-share-alt me-1"></i>Share
                </button>
            </div>
        </div>
    </div>
</div>
`;

let modalInstance = null;
let allMatches = [];

const init = () => {
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('statistics-modal');
    modalInstance = CustomModal.getOrCreateInstance(modalElement);

    const shareButton = document.getElementById('share-stats-btn');
    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const statsText = generateShareableText();
            try {
                await sharingService.shareData(statsText, 'Cloud Game Statistics');
                notificationManager.success('Statistics shared successfully!');
            } catch (error) {
                notificationManager.error(error.message || 'Failed to share statistics');
            }
        });
    }
};

const show = (matches) => {
    allMatches = matches;
    renderStatistics();
    modalInstance.show();
};

const getPlayerStats = () => {
    const playerStats = {
        goals: {},
        assists: {},
        cards: {}
    };

    allMatches.forEach(match => {
        if (match.events) {
            match.events.forEach(event => {
                if (event.type === 'Goal' && event.details.player) {
                    playerStats.goals[event.details.player] = (playerStats.goals[event.details.player] || 0) + 1;
                    if (event.details.assist) {
                        playerStats.assists[event.details.assist] = (playerStats.assists[event.details.assist] || 0) + 1;
                    }
                } else if (event.type === 'Yellow Card' && event.details.player) {
                    playerStats.cards[event.details.player] = (playerStats.cards[event.details.player] || 0) + 1;
                } else if (event.type === 'Red Card' && event.details.player) {
                    playerStats.cards[event.details.player] = (playerStats.cards[event.details.player] || 0) + 1;
                }
            });
        }
    });

    const topScorers = Object.entries(playerStats.goals).sort(([, a], [, b]) => b - a).slice(0, 5);
    const topAssisters = Object.entries(playerStats.assists).sort(([, a], [, b]) => b - a).slice(0, 5);
    const topCards = Object.entries(playerStats.cards).sort(([, a], [, b]) => b - a).slice(0, 5);

    return { topScorers, topAssisters, topCards };
};

const getTeamStats = () => {
    const teamStats = {};

    allMatches.forEach(match => {
        const team1 = match.team1Name || 'Team 1';
        const team2 = match.team2Name || 'Team 2';
        const score1 = match.team1Score || 0;
        const score2 = match.team2Score || 0;

        if (!teamStats[team1]) teamStats[team1] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0 };
        if (!teamStats[team2]) teamStats[team2] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0 };

        teamStats[team1].matches++;
        teamStats[team2].matches++;
        teamStats[team1].goalsFor += score1;
        teamStats[team2].goalsFor += score2;
        teamStats[team1].goalsAgainst += score2;
        teamStats[team2].goalsAgainst += score1;

        if (score1 > score2) {
            teamStats[team1].wins++;
            teamStats[team2].losses++;
        } else if (score2 > score1) {
            teamStats[team2].wins++;
            teamStats[team1].losses++;
        } else {
            teamStats[team1].draws++;
            teamStats[team2].draws++;
        }
    });

    return Object.entries(teamStats).map(([name, stats]) => ({
        name,
        ...stats,
        avgGoalsFor: (stats.goalsFor / stats.matches).toFixed(2),
        avgGoalsAgainst: (stats.goalsAgainst / stats.matches).toFixed(2)
    })).sort((a, b) => b.wins - a.wins);
};

const getTimeBasedStats = () => {
    const timeStats = {
        firstHalfGoals: 0,
        secondHalfGoals: 0
    };

    allMatches.forEach(match => {
        if (match.events) {
            match.events.forEach(event => {
                if (event.type === 'Goal') {
                    if (event.isSecondHalf) {
                        timeStats.secondHalfGoals++;
                    } else {
                        timeStats.firstHalfGoals++;
                    }
                }
            });
        }
    });

    return timeStats;
};

const getCardStats = (eventCounts) => {
    return {
        yellow: eventCounts['Yellow Card'] || 0,
        red: eventCounts['Red Card'] || 0
    };
};

const renderStatistics = () => {
    const statsContainer = document.getElementById('statistics-modal-body');
    if (!statsContainer) return;

    if (!allMatches || allMatches.length === 0) {
        statsContainer.innerHTML = '<p>No match data available to generate statistics.</p>';
        return;
    }

    // Basic stats
    const totalMatches = allMatches.length;
    const totalGoals = allMatches.reduce((acc, match) => acc + (match.events ? match.events.filter(e => e.type === 'Goal').length : 0), 0);
    const averageGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : 0;

    // Event stats
    const eventCounts = {};
    allMatches.forEach(match => {
        if (match.events) {
            match.events.forEach(event => {
                eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
            });
        }
    });
    const sortedEvents = Object.entries(eventCounts).sort(([, a], [, b]) => b - a);

    // Player stats
    const { topScorers, topAssisters, topCards } = getPlayerStats();
    // Team stats
    const teamStats = getTeamStats();
    // Time-based stats
    const timeStats = getTimeBasedStats();
    // Card stats
    const cardStats = getCardStats(eventCounts);

    let statsHtml = `
        <h4>Summary</h4>
        <div class="row">
            <div class="col-md-4">
                <div class="card text-center mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${totalMatches}</h5>
                        <p class="card-text">Total Matches</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${totalGoals}</h5>
                        <p class="card-text">Total Goals</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${averageGoals}</h5>
                        <p class="card-text">Avg. Goals per Match</p>
                    </div>
                </div>
            </div>
        </div>

        <h4 class="mt-4">Discipline</h4>
        <div class="row">
            <div class="col-md-6">
                <div class="card text-center mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${cardStats.yellow}</h5>
                        <p class="card-text">Yellow Cards</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card text-center mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${cardStats.red}</h5>
                        <p class="card-text">Red Cards</p>
                    </div>
                </div>
            </div>
        </div>

        <h4 class="mt-4">Time-based Analysis</h4>
        <div class="row">
            <div class="col-md-6">
                <div class="card text-center mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${timeStats.firstHalfGoals}</h5>
                        <p class="card-text">1st Half Goals</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card text-center mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${timeStats.secondHalfGoals}</h5>
                        <p class="card-text">2nd Half Goals</p>
                    </div>
                </div>
            </div>
        </div>

        <h4 class="mt-4">Team Statistics</h4>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>Avg GF</th>
                        <th>Avg GA</th>
                    </tr>
                </thead>
                <tbody>
                    ${teamStats.map(team => `
                        <tr>
                            <td>${team.name}</td>
                            <td>${team.wins}</td>
                            <td>${team.draws}</td>
                            <td>${team.losses}</td>
                            <td>${team.goalsFor}</td>
                            <td>${team.goalsAgainst}</td>
                            <td>${team.avgGoalsFor}</td>
                            <td>${team.avgGoalsAgainst}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <h4 class="mt-4">Player Statistics</h4>
        <div class="row">
            <div class="col-md-4">
                <h5>Top Scorers</h5>
                <ul class="list-group">
                    ${topScorers.map(([player, count]) => `<li class="list-group-item d-flex justify-content-between align-items-center">${player}<span class="badge bg-primary rounded-pill">${count}</span></li>`).join('')}
                </ul>
            </div>
            <div class="col-md-4">
                <h5>Top Assists</h5>
                <ul class="list-group">
                    ${topAssisters.map(([player, count]) => `<li class="list-group-item d-flex justify-content-between align-items-center">${player}<span class="badge bg-primary rounded-pill">${count}</span></li>`).join('')}
                </ul>
            </div>
            <div class="col-md-4">
                <h5>Most Cards</h5>
                <ul class="list-group">
                    ${topCards.map(([player, count]) => `<li class="list-group-item d-flex justify-content-between align-items-center">${player}<span class="badge bg-danger rounded-pill">${count}</span></li>`).join('')}
                </ul>
            </div>
        </div>

        <h4 class="mt-4">Event Breakdown</h4>
        <ul class="list-group">
    `;

    sortedEvents.forEach(([type, count]) => {
        statsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">${type}<span class="badge bg-primary rounded-pill">${count}</span></li>`;
    });

    statsHtml += '</ul>';

    statsContainer.innerHTML = statsHtml;
};

const generateShareableText = () => {
    if (!allMatches || allMatches.length === 0) {
        return "No statistics to share.";
    }

    const totalMatches = allMatches.length;
    const totalGoals = allMatches.reduce((acc, match) => acc + (match.events ? match.events.filter(e => e.type === 'Goal').length : 0), 0);
    const averageGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : 0;

    const eventCounts = {};
    allMatches.forEach(match => {
        if (match.events) {
            match.events.forEach(event => {
                eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
            });
        }
    });
    const sortedEvents = Object.entries(eventCounts).sort(([, a], [, b]) => b - a);

    const { topScorers, topAssisters, topCards } = getPlayerStats();
    const teamStats = getTeamStats();
    const timeStats = getTimeBasedStats();
    const cardStats = getCardStats(eventCounts);

    let text = `Cloud Game Statistics:\n\n`;
    text += `Summary:\n`;
    text += `Total Matches: ${totalMatches}\n`;
    text += `Total Goals: ${totalGoals}\n`;
    text += `Average Goals per Match: ${averageGoals}\n\n`;

    text += `Discipline:\n`;
    text += `Yellow Cards: ${cardStats.yellow}\n`;
    text += `Red Cards: ${cardStats.red}\n\n`;

    text += `Time-based Analysis:\n`;
    text += `1st Half Goals: ${timeStats.firstHalfGoals}\n`;
    text += `2nd Half Goals: ${timeStats.secondHalfGoals}\n\n`;

    text += `Team Statistics:\n`;
    teamStats.forEach(team => {
        text += `- ${team.name}: ${team.wins}W-${team.draws}D-${team.losses}L, GF: ${team.goalsFor}, GA: ${team.goalsAgainst}\n`;
    });
    text += '\n';

    text += `Player Statistics:\n`;
    text += `Top Scorers:\n${topScorers.map(([player, count]) => `- ${player}: ${count}`).join('\n')}\n\n`;
    text += `Top Assists:\n${topAssisters.map(([player, count]) => `- ${player}: ${count}`).join('\n')}\n\n`;
    text += `Most Cards:\n${topCards.map(([player, count]) => `- ${player}: ${count}`).join('\n')}\n\n`;

    text += `Event Breakdown:\n`;
    sortedEvents.forEach(([type, count]) => {
        text += `- ${type}: ${count}\n`;
    });

    return text;
};

export const statisticsModal = {
    init,
    show
};

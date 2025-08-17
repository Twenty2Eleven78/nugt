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

    // More advanced stats
    const eventCounts = {};
    allMatches.forEach(match => {
        if (match.events) {
            match.events.forEach(event => {
                eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
            });
        }
    });

    const sortedEvents = Object.entries(eventCounts).sort(([, a], [, b]) => b - a);

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

        <h4>Event Breakdown</h4>
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

    let text = `Cloud Game Statistics:\n\n`;
    text += `Total Matches: ${totalMatches}\n`;
    text += `Total Goals: ${totalGoals}\n`;
    text += `Average Goals per Match: ${averageGoals}\n\n`;
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

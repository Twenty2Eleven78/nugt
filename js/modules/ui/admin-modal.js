import { userMatchesApi } from '../services/user-matches-api.js';

const modalHtml = `
<div class="modal fade" id="admin-modal" tabindex="-1" aria-labelledby="admin-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="admin-modal-label">Admin Dashboard</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <input type="text" class="form-control" id="admin-search" placeholder="Search by user email or match title...">
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>User Email</th>
                                <th>User ID</th>
                                <th>Match Title</th>
                                <th>Date Saved</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="matches-table-body">
                            <tr>
                                <td colspan="5" class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div id="admin-stats" class="mt-3">
                    <!-- Stats will be populated here -->
                </div>
            </div>
        </div>
    </div>
</div>
`;

let modalInstance = null;
let allMatches = []; // Store all matches for search functionality

const init = () => {
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('admin-modal');
    modalInstance = new bootstrap.Modal(modalElement);

    // Add search functionality
    const searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterMatches(e.target.value.toLowerCase());
        });
    }

    modalElement.addEventListener('show.bs.modal', async () => {
        await loadMatchesData();
    });
};

const loadMatchesData = async () => {
    const tableBody = document.getElementById('matches-table-body');
    const statsDiv = document.getElementById('admin-stats');
    
    if (!tableBody) return;

    try {
        // Show loading spinner
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        const matches = await userMatchesApi.loadAllMatchData();
        allMatches = matches || []; // Store for search functionality
        
        if (allMatches.length > 0) {
            renderMatches(allMatches);
            renderStats(allMatches, statsDiv);
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No matches found.</td></tr>';
            if (statsDiv) {
                statsDiv.innerHTML = '<div class="alert alert-info">No data available for statistics.</div>';
            }
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error loading matches: ${error.message}
                </td>
            </tr>
        `;
        if (statsDiv) {
            statsDiv.innerHTML = '<div class="alert alert-danger">Failed to load statistics.</div>';
        }
    }
};

const renderMatches = (matches) => {
    const tableBody = document.getElementById('matches-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    matches.forEach(match => {
        const row = document.createElement('tr');
        
        // Extract email from match data or fallback to userId-based email
        const userEmail = match.userEmail || 
                         (match.userId && match.userId !== 'unknown' ? `${match.userId}@unknown.com` : 'unknown@example.com');
        
        const matchTitle = match.title || match.matchTitle || 'Untitled Match';
        const savedDate = match.savedAt ? new Date(match.savedAt).toLocaleString() : 'Unknown';
        
        row.innerHTML = `
            <td>
                <span class="text-primary fw-medium">${escapeHtml(userEmail)}</span>
            </td>
            <td>
                <small class="text-muted font-monospace">${escapeHtml(match.userId || 'unknown')}</small>
            </td>
            <td>${escapeHtml(matchTitle)}</td>
            <td>
                <small>${savedDate}</small>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-match-btn" data-match='${JSON.stringify(match)}'>
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    // Add event listeners to view buttons
    tableBody.querySelectorAll('.view-match-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchData = JSON.parse(e.target.getAttribute('data-match'));
            showMatchDetails(matchData);
        });
    });
};

const renderStats = (matches, statsDiv) => {
    if (!statsDiv || !matches.length) return;

    // Calculate statistics
    const totalMatches = matches.length;
    const uniqueUsers = new Set(matches.map(m => m.userEmail || m.userId)).size;
    const recentMatches = matches.filter(m => 
        m.savedAt && (Date.now() - m.savedAt < 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Group matches by user
    const matchesByUser = matches.reduce((acc, match) => {
        const key = match.userEmail || match.userId || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const topUsers = Object.entries(matchesByUser)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    statsDiv.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="fw-bold">Statistics</h6>
                <ul class="list-unstyled">
                    <li><strong>Total Matches:</strong> ${totalMatches}</li>
                    <li><strong>Unique Users:</strong> ${uniqueUsers}</li>
                    <li><strong>Recent Matches (7 days):</strong> ${recentMatches}</li>
                </ul>
            </div>
            <div class="col-md-6">
                <h6 class="fw-bold">Top Users</h6>
                <ul class="list-unstyled">
                    ${topUsers.map(([user, count]) => 
                        `<li><strong>${escapeHtml(user)}:</strong> ${count} match${count !== 1 ? 'es' : ''}</li>`
                    ).join('')}
                </ul>
            </div>
        </div>
    `;
};

const filterMatches = (searchTerm) => {
    if (!searchTerm.trim()) {
        renderMatches(allMatches);
        return;
    }

    const filtered = allMatches.filter(match => {
        const email = (match.userEmail || '').toLowerCase();
        const title = (match.title || match.matchTitle || '').toLowerCase();
        const userId = (match.userId || '').toLowerCase();
        
        return email.includes(searchTerm) || 
               title.includes(searchTerm) || 
               userId.includes(searchTerm);
    });

    renderMatches(filtered);
};

const showMatchDetails = (matchData) => {
    // Create a simple alert with match details for now
    // You could create a more sophisticated modal here
    const details = [
        `User Email: ${matchData.userEmail || 'N/A'}`,
        `User ID: ${matchData.userId || 'N/A'}`,
        `Match Title: ${matchData.title || matchData.matchTitle || 'N/A'}`,
        `Saved At: ${matchData.savedAt ? new Date(matchData.savedAt).toLocaleString() : 'N/A'}`,
        `Match Data: ${JSON.stringify(matchData, null, 2)}`
    ].join('\n');
    
    alert(details);
};

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const show = () => {
    if (!modalInstance) {
        init();
    }
    modalInstance.show();
};

export const adminModal = {
    init,
    show
};
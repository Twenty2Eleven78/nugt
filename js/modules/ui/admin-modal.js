import { userMatchesApi } from '../services/user-matches-api.js';
import { notificationManager } from '../services/notifications.js';

const modalHtml = `
<div class="modal fade" id="admin-modal" tabindex="-1" aria-labelledby="admin-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen-lg-down modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="admin-modal-label">
                    <i class="fas fa-cog"></i> Admin Dashboard
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-2 p-md-3">
                <!-- Search and Controls -->
                <div class="mb-3">
                    <div class="row g-2">
                        <div class="col-md-8">
                            <input type="text" class="form-control" id="admin-search" placeholder="Search by email, title, or user ID...">
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-outline-secondary w-100" id="refresh-data-btn">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Mobile/Desktop Toggle -->
                <div class="d-block d-lg-none mb-3">
                    <div class="btn-group w-100" role="group">
                        <input type="radio" class="btn-check" name="view-mode" id="card-view" checked>
                        <label class="btn btn-outline-primary" for="card-view">
                            <i class="fas fa-th-large"></i> Cards
                        </label>
                        <input type="radio" class="btn-check" name="view-mode" id="table-view">
                        <label class="btn btn-outline-primary" for="table-view">
                            <i class="fas fa-table"></i> Table
                        </label>
                    </div>
                </div>

                <!-- Desktop Table View -->
                <div id="desktop-table-view" class="d-none d-lg-block">
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
                </div>

                <!-- Mobile Card View -->
                <div id="mobile-card-view" class="d-lg-none">
                    <div id="matches-cards-container">
                        <div class="text-center p-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mobile Table View -->
                <div id="mobile-table-view" class="d-lg-none" style="display: none;">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead class="table-dark">
                                <tr>
                                    <th class="text-nowrap">Email</th>
                                    <th class="text-nowrap">Title</th>
                                    <th class="text-nowrap">Date</th>
                                    <th class="text-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="matches-mobile-table-body">
                                <!-- Mobile table content -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Statistics -->
                <div id="admin-stats" class="mt-4 pt-3 border-top">
                    <!-- Stats will be populated here -->
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Confirmation Modal for Deletion -->
<div class="modal fade" id="delete-confirm-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="fas fa-trash"></i> Confirm Deletion
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this match?</p>
                <div class="alert alert-warning">
                    <strong>Warning:</strong> This action cannot be undone.
                </div>
                <div id="delete-match-details">
                    <!-- Match details will be shown here -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                    <i class="fas fa-trash"></i> Delete Match
                </button>
            </div>
        </div>
    </div>
</div>
`;

let modalInstance = null;
let deleteModalInstance = null;
let allMatches = []; // Store all matches for search functionality
let currentDeleteMatch = null;

const init = () => {
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('admin-modal');
    const deleteModalElement = document.getElementById('delete-confirm-modal');
    
    modalInstance = new bootstrap.Modal(modalElement);
    deleteModalInstance = new bootstrap.Modal(deleteModalElement);

    // Add search functionality
    const searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterMatches(e.target.value.toLowerCase());
        });
    }

    // Add refresh button functionality
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadMatchesData);
    }

    // Add view mode toggle for mobile
    const cardViewRadio = document.getElementById('card-view');
    const tableViewRadio = document.getElementById('table-view');
    const mobileCardView = document.getElementById('mobile-card-view');
    const mobileTableView = document.getElementById('mobile-table-view');

    if (cardViewRadio && tableViewRadio) {
        cardViewRadio.addEventListener('change', () => {
            if (cardViewRadio.checked) {
                mobileCardView.style.display = 'block';
                mobileTableView.style.display = 'none';
            }
        });

        tableViewRadio.addEventListener('change', () => {
            if (tableViewRadio.checked) {
                mobileCardView.style.display = 'none';
                mobileTableView.style.display = 'block';
                renderMobileTable(allMatches);
            }
        });
    }

    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    }

    modalElement.addEventListener('show.bs.modal', async () => {
        await loadMatchesData();
    });
};

const loadMatchesData = async () => {
    const tableBody = document.getElementById('matches-table-body');
    const cardsContainer = document.getElementById('matches-cards-container');
    const statsDiv = document.getElementById('admin-stats');
    const refreshBtn = document.getElementById('refresh-data-btn');
    
    // Show loading state
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }

    try {
        // Show loading in all views
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center p-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div class="mt-2">Loading matches...</div>
                    </td>
                </tr>
            `;
        }

        if (cardsContainer) {
            cardsContainer.innerHTML = `
                <div class="text-center p-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">Loading matches...</div>
                </div>
            `;
        }

        const matches = await userMatchesApi.loadAllMatchData();
        allMatches = matches || [];
        
        if (allMatches.length > 0) {
            renderDesktopTable(allMatches);
            renderMobileCards(allMatches);
            renderStats(allMatches, statsDiv);
            // Show info notification about loaded data
            notificationManager.info(`Loaded ${allMatches.length} matches from ${new Set(allMatches.map(m => m.userEmail || m.userId)).size} users.`);

        } else {
            showNoDataMessage();
            notificationManager.warning('No match data found.');
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        showErrorMessage(error.message);
        // Show error notification using notification manager
        notificationManager.error(`Failed to load match data: ${error.message}`);
    } finally {
        // Reset refresh button
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }
};

const renderDesktopTable = (matches) => {
    const tableBody = document.getElementById('matches-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    matches.forEach((match, index) => {
        const row = document.createElement('tr');
        
        const userEmail = match.userEmail || 
                         (match.userId && match.userId !== 'unknown' ? `${match.userId}@unknown.com` : 'unknown@example.com');
        
        const matchTitle = match.title || match.matchTitle || 'Untitled Match';
        const savedDate = match.savedAt ? new Date(match.savedAt).toLocaleString() : 'Unknown';
        
        row.innerHTML = `
            <td>
                <div class="text-primary fw-medium text-break">${escapeHtml(userEmail)}</div>
            </td>
            <td>
                <small class="text-muted font-monospace">${escapeHtml(match.userId || 'unknown')}</small>
            </td>
            <td class="text-break">${escapeHtml(matchTitle)}</td>
            <td>
                <small class="text-nowrap">${savedDate}</small>
            </td>
            <td>
                <div class="btn-group-vertical btn-group-sm" role="group">
                    <button class="btn btn-outline-primary view-match-btn" data-match-index="${index}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-outline-danger delete-match-btn" data-match-index="${index}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    addEventListeners();
};

const renderMobileCards = (matches) => {
    const cardsContainer = document.getElementById('matches-cards-container');
    if (!cardsContainer) return;

    if (matches.length === 0) {
        cardsContainer.innerHTML = `
            <div class="text-center text-muted p-4">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <h5>No matches found</h5>
                <p>No match data available to display.</p>
            </div>
        `;
        return;
    }

    cardsContainer.innerHTML = '';
    
    matches.forEach((match, index) => {
        const userEmail = match.userEmail || 
                         (match.userId && match.userId !== 'unknown' ? `${match.userId}@unknown.com` : 'unknown@example.com');
        
        const matchTitle = match.title || match.matchTitle || 'Untitled Match';
        const savedDate = match.savedAt ? new Date(match.savedAt).toLocaleString() : 'Unknown';
        
        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm';
        card.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-8">
                        <h6 class="card-title mb-1 text-break">${escapeHtml(matchTitle)}</h6>
                        <p class="card-text text-primary mb-1 small text-break">${escapeHtml(userEmail)}</p>
                        <p class="card-text text-muted mb-0 small">
                            <i class="fas fa-clock"></i> ${savedDate}
                        </p>
                    </div>
                    <div class="col-4 text-end">
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-outline-primary view-match-btn" data-match-index="${index}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-danger delete-match-btn" data-match-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        cardsContainer.appendChild(card);
    });

    addEventListeners();
};

const renderMobileTable = (matches) => {
    const tableBody = document.getElementById('matches-mobile-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    matches.forEach((match, index) => {
        const userEmail = match.userEmail || 'unknown@example.com';
        const matchTitle = match.title || match.matchTitle || 'Untitled';
        const savedDate = match.savedAt ? new Date(match.savedAt).toLocaleDateString() : 'Unknown';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-break small">${escapeHtml(userEmail.split('@')[0])}</td>
            <td class="text-break small">${escapeHtml(matchTitle.substring(0, 20))}${matchTitle.length > 20 ? '...' : ''}</td>
            <td class="text-nowrap small">${savedDate}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary view-match-btn" data-match-index="${index}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-match-btn" data-match-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    addEventListeners();
};

const addEventListeners = () => {
    // View buttons
    document.querySelectorAll('.view-match-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchIndex = parseInt(e.target.closest('button').getAttribute('data-match-index'));
            const matchData = allMatches[matchIndex];
            showMatchDetails(matchData);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-match-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchIndex = parseInt(e.target.closest('button').getAttribute('data-match-index'));
            const matchData = allMatches[matchIndex];
            showDeleteConfirmation(matchData, matchIndex);
        });
    });
};

const showDeleteConfirmation = (matchData, matchIndex) => {
    currentDeleteMatch = { data: matchData, index: matchIndex };
    
    const detailsDiv = document.getElementById('delete-match-details');
    if (detailsDiv) {
        const userEmail = matchData.userEmail || 'unknown@example.com';
        const matchTitle = matchData.title || matchData.matchTitle || 'Untitled Match';
        const savedDate = matchData.savedAt ? new Date(matchData.savedAt).toLocaleString() : 'Unknown';
        
        detailsDiv.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${escapeHtml(matchTitle)}</h6>
                    <p class="card-text mb-1"><strong>User:</strong> ${escapeHtml(userEmail)}</p>
                    <p class="card-text mb-0"><strong>Saved:</strong> ${savedDate}</p>
                </div>
            </div>
        `;
    }
    
    deleteModalInstance.show();
};

const handleDeleteConfirm = async () => {
    if (!currentDeleteMatch) return;

    const confirmBtn = document.getElementById('confirm-delete-btn');
    const originalText = confirmBtn.innerHTML;
    
    try {
        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        
        // Debug the match data
        console.log('Attempting to delete match:', currentDeleteMatch.data);
        console.log('Match userId:', currentDeleteMatch.data.userId);
        console.log('Match index:', currentDeleteMatch.index);
        console.log('Match blobKey:', currentDeleteMatch.data.blobKey);

         // Validate that we have the required data
        if (!currentDeleteMatch.data.userId || currentDeleteMatch.data.userId === 'unknown') {
            // For matches without proper userId, we need to handle them differently
            notificationManager.warning('This match has missing or invalid userId. It may be orphaned data that cannot be deleted through the normal API.');
            
            // Ask user if they want to remove it from the display only
            const removeFromDisplay = confirm('This match appears to be orphaned data. Would you like to remove it from the display? (Note: This will only hide it from the admin panel, not delete the actual data)');
            
            if (removeFromDisplay) {
                // Remove from local array and re-render
                allMatches.splice(currentDeleteMatch.index, 1);
                
                // Re-render all views
                renderDesktopTable(allMatches);
                renderMobileCards(allMatches);
                
                const tableViewRadio = document.getElementById('table-view');
                if (tableViewRadio && tableViewRadio.checked) {
                    renderMobileTable(allMatches);
                }
                
                const statsDiv = document.getElementById('admin-stats');
                renderStats(allMatches, statsDiv);
                
                deleteModalInstance.hide();
                notificationManager.info('Match removed from display. (Orphaned data may still exist in storage)');
                currentDeleteMatch = null;
                return;
            } else {
                deleteModalInstance.hide();
                currentDeleteMatch = null;
                return;
            }
        }

        // Call the actual delete API
        await userMatchesApi.deleteMatchData(
            currentDeleteMatch.data.userId, 
            currentDeleteMatch.index
        );
        
        // Remove from local array and re-render
        allMatches.splice(currentDeleteMatch.index, 1);
        
        // Re-render all views
        renderDesktopTable(allMatches);
        renderMobileCards(allMatches);
        
        // Update mobile table if it's visible
        const tableViewRadio = document.getElementById('table-view');
        if (tableViewRadio && tableViewRadio.checked) {
            renderMobileTable(allMatches);
        }
        
        // Update stats
        const statsDiv = document.getElementById('admin-stats');
        renderStats(allMatches, statsDiv);
        
        deleteModalInstance.hide();

        // Show success notification using notification manager
        const matchTitle = currentDeleteMatch.data.title || 
                          currentDeleteMatch.data.matchTitle || 
                          'Untitled Match';
        notificationManager.success(`Match "${matchTitle}" has been deleted successfully.`);
        
        currentDeleteMatch = null;
      
    } catch (error) {
        console.error('Error deleting match:', error);
        // Show error notification using notification manager
        notificationManager.error(`Failed to delete match: ${error.message}`);
    } finally {
        // Reset button
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
};

const renderStats = (matches, statsDiv) => {
    if (!statsDiv || !matches.length) {
        if (statsDiv) {
            statsDiv.innerHTML = '<div class="alert alert-info">No data available for statistics.</div>';
        }
        return;
    }

    const totalMatches = matches.length;
    const uniqueUsers = new Set(matches.map(m => m.userEmail || m.userId)).size;
    const recentMatches = matches.filter(m => 
        m.savedAt && (Date.now() - m.savedAt < 7 * 24 * 60 * 60 * 1000)
    ).length;

    const matchesByUser = matches.reduce((acc, match) => {
        const key = match.userEmail || match.userId || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const topUsers = Object.entries(matchesByUser)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    statsDiv.innerHTML = `
        <div class="row g-3">
            <div class="col-md-4">
                <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                        <h5 class="card-title">${totalMatches}</h5>
                        <p class="card-text mb-0">Total Matches</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-success text-white">
                    <div class="card-body text-center">
                        <h5 class="card-title">${uniqueUsers}</h5>
                        <p class="card-text mb-0">Unique Users</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-info text-white">
                    <div class="card-body text-center">
                        <h5 class="card-title">${recentMatches}</h5>
                        <p class="card-text mb-0">Recent (7 days)</p>
                    </div>
                </div>
            </div>
        </div>
        ${topUsers.length > 0 ? `
        <div class="mt-3">
            <h6 class="fw-bold">Most Active Users</h6>
            <div class="row g-2">
                ${topUsers.map(([user, count], index) => `
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-${index === 0 ? 'warning' : index === 1 ? 'secondary' : 'success'}">#${index + 1}</span>
                                    <div class="text-end">
                                        <div class="fw-bold small text-break">${escapeHtml(user)}</div>
                                        <small class="text-muted">${count} match${count !== 1 ? 'es' : ''}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
};

const filterMatches = (searchTerm) => {
    if (!searchTerm.trim()) {
        renderDesktopTable(allMatches);
        renderMobileCards(allMatches);
        
        const tableViewRadio = document.getElementById('table-view');
        if (tableViewRadio && tableViewRadio.checked) {
            renderMobileTable(allMatches);
        }
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

    renderDesktopTable(filtered);
    renderMobileCards(filtered);
    
    const tableViewRadio = document.getElementById('table-view');
    if (tableViewRadio && tableViewRadio.checked) {
        renderMobileTable(filtered);
    }
};

const showNoDataMessage = () => {
    const tableBody = document.getElementById('matches-table-body');
    const cardsContainer = document.getElementById('matches-cards-container');
    const statsDiv = document.getElementById('admin-stats');

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted p-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <h5>No matches found</h5>
                    <p class="mb-0">No match data available to display.</p>
                </td>
            </tr>
        `;
    }

    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="text-center text-muted p-4">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <h5>No matches found</h5>
                <p>No match data available to display.</p>
            </div>
        `;
    }

    if (statsDiv) {
        statsDiv.innerHTML = '<div class="alert alert-info">No data available for statistics.</div>';
    }
};

const showErrorMessage = (errorMessage) => {
    const tableBody = document.getElementById('matches-table-body');
    const cardsContainer = document.getElementById('matches-cards-container');
    const statsDiv = document.getElementById('admin-stats');

    const errorHtml = `
        <div class="text-center text-danger p-4">
            <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
            <h5>Error Loading Data</h5>
            <p>${escapeHtml(errorMessage)}</p>
            <button class="btn btn-outline-primary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Retry
            </button>
        </div>
    `;

    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="5">${errorHtml}</td></tr>`;
    }

    if (cardsContainer) {
        cardsContainer.innerHTML = errorHtml;
    }

    if (statsDiv) {
        statsDiv.innerHTML = '<div class="alert alert-danger">Failed to load statistics.</div>';
    }
    // Add retry functionality
    document.getElementById('retry-load-btn')?.addEventListener('click', loadMatchesData);
};

const showMatchDetails = (matchData) => {
    const details = [
        `User Email: ${matchData.userEmail || 'N/A'}`,
        `User ID: ${matchData.userId || 'N/A'}`,
        `Match Title: ${matchData.title || matchData.matchTitle || 'N/A'}`,
        `Saved At: ${matchData.savedAt ? new Date(matchData.savedAt).toLocaleString() : 'N/A'}`,
        `\nFull Match Data:\n${JSON.stringify(matchData, null, 2)}`
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
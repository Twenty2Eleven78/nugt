import { userMatchesApi } from '../services/user-matches-api.js';
import { notificationManager } from '../services/notifications.js';
import { matchSummaryModal } from './match-summary-modal.js';
import { statisticsModal } from './statistics-modal.js';
import { CustomModal } from '../shared/custom-modal.js';

const modalHtml = `
<div class="modal fade" id="admin-modal" tabindex="-1" aria-labelledby="admin-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen-lg-down modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="admin-modal-label">Admin Dashboard</h5>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body">
                <!-- Search and Controls -->
                <div class="mb-3">
                    <input type="text" class="form-control mb-2" id="admin-search" 
                           placeholder="Search matches...">
                    <div class="row g-2">
                        <div class="col-md-4">
                            <select class="form-select" id="filter-select">
                                <option value="">All Matches</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                        <div class="col-6 col-md-4">
                            <button class="btn btn-primary w-100" id="refresh-data-btn">
                                <i class="fas fa-sync-alt me-1"></i>Refresh
                            </button>
                        </div>
                        <div class="col-6 col-md-4">
                            <button class="btn btn-secondary w-100" id="stats-btn">
                                <i class="fas fa-chart-bar me-1"></i>Statistics
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Statistics -->
                <div class="row g-2 mb-3" id="admin-stats-cards">
                    <!-- Stats will be populated here -->
                </div>

                <!-- Matches List -->
                <div style="max-height: 400px; overflow-y: auto;">
                    <div id="matches-list">
                        <!-- Match cards will be populated here -->
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary mb-2" role="status"></div>
                            <div class="text-muted small">Loading match data...</div>
                        </div>
                    </div>
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
                <button type="button" class="btn-close btn-close-white" data-dismiss="modal" aria-label="Close"></button>
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
                <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                    <i class="fas fa-trash"></i> Delete Match
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Transfer Match Modal -->
<div class="modal fade" id="transfer-match-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
                <h5 class="modal-title">
                    <i class="fas fa-exchange-alt"></i> Transfer Match
                </h5>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <h6>Match to Transfer:</h6>
                    <div id="transfer-match-details" class="card bg-light">
                        <!-- Match details will be shown here -->
                    </div>
                </div>
                <div class="mb-3">
                    <label for="target-user-select" class="form-label">
                        <strong>Transfer to User:</strong>
                    </label>
                    <select class="form-select" id="target-user-select">
                        <option value="">Select target user...</option>
                        <!-- Options will be populated dynamically -->
                    </select>
                </div>
                <div class="mb-3">
                    <label for="new-user-email" class="form-label">
                        <strong>Or enter new user email:</strong>
                    </label>
                    <input type="email" class="form-control" id="new-user-email" placeholder="user@example.com">
                    <div class="form-text">
                        If the user doesn't exist, a new user ID will be generated based on this email.
                    </div>
                </div>
                <div class="alert alert-info">
                    <strong>Note:</strong> The match will be moved from the current user to the selected user. 
                    This action can be reversed by transferring it back.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelTransferBtn">Cancel</button>
                <button type="button" class="btn btn-warning" id="confirm-transfer-btn" disabled>
                    <i class="fas fa-exchange-alt"></i> Transfer Match
                </button>
            </div>
        </div>
    </div>
</div>
`;

let modalInstance = null;
let deleteModalInstance = null;
let transferModalInstance = null;
let allMatches = []; // Store all matches for search functionality
let currentDeleteMatch = null;
let currentTransferMatch = null;

const init = () => {
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('admin-modal');
    const deleteModalElement = document.getElementById('delete-confirm-modal');
    const transferModalElement = document.getElementById('transfer-match-modal');

    modalInstance = CustomModal.getOrCreateInstance(modalElement);
    deleteModalInstance = CustomModal.getOrCreateInstance(deleteModalElement);
    transferModalInstance = CustomModal.getOrCreateInstance(transferModalElement);

    // Initialize match summary modal
    matchSummaryModal.init();

    // Initialize statistics modal
    statisticsModal.init();

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

    // Add filter functionality
    const filterSelect = document.getElementById('filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            applyFilter(e.target.value);
        });
    }

    // Add stats button functionality
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            statisticsModal.show(allMatches);
        });
    }



    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    }

    // Cancel delete button
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModalInstance.hide();
        });
    }

    // Transfer confirmation and validation
    const confirmTransferBtn = document.getElementById('confirm-transfer-btn');
    const targetUserSelect = document.getElementById('target-user-select');
    const newUserEmail = document.getElementById('new-user-email');

    if (confirmTransferBtn) {
        confirmTransferBtn.addEventListener('click', handleTransferConfirm);
    }

    // Cancel transfer button
    const cancelTransferBtn = document.getElementById('cancelTransferBtn');
    if (cancelTransferBtn) {
        cancelTransferBtn.addEventListener('click', () => {
            transferModalInstance.hide();
        });
    }

    // Enable/disable transfer button based on selection
    const validateTransferForm = () => {
        const hasSelectedUser = targetUserSelect && targetUserSelect.value;
        const hasNewEmail = newUserEmail && newUserEmail.value.trim();
        const isValidEmail = hasNewEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail.value.trim());

        if (confirmTransferBtn) {
            confirmTransferBtn.disabled = !(hasSelectedUser || isValidEmail);
        }
    };

    if (targetUserSelect) {
        targetUserSelect.addEventListener('change', validateTransferForm);
    }

    if (newUserEmail) {
        newUserEmail.addEventListener('input', validateTransferForm);
    }

    modalElement.addEventListener('modal.show', async () => {
        await loadMatchesData();
    });

    // Clean up when admin modal is hidden
    modalElement.addEventListener('modal.hidden', cleanupModalBackdrops);
};

const loadMatchesData = async () => {
    const matchesList = document.getElementById('matches-list');
    const statsCardsContainer = document.getElementById('admin-stats-cards');
    const refreshBtn = document.getElementById('refresh-data-btn');

    // Show loading state
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }

    try {
        // Show loading in matches list
        if (matchesList) {
            matchesList.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="text-muted">Loading matches...</div>
                </div>
            `;
        }

        const matches = await userMatchesApi.loadAllMatchData();
        allMatches = matches || [];

        if (allMatches.length > 0) {
            renderCards(allMatches);
            renderStats(allMatches, statsCardsContainer);
            notificationManager.info(`Loaded ${allMatches.length} matches from ${new Set(allMatches.map(m => m.userEmail || m.userId)).size} users.`);

        } else {
            showNoDataMessage();
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        showErrorMessage(error.message);
        notificationManager.error(`Failed to load match data: ${error.message}`);
    } finally {
        // Reset refresh button
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }
};

const renderCards = (matches) => {
    const matchesList = document.getElementById('matches-list');
    if (!matchesList) return;

    if (matches.length === 0) {
        matchesList.innerHTML = `
            <div class="card shadow-sm" style="border-radius: 12px; border: 1px solid #e0e0e0;">
                <div class="card-body text-center text-muted" style="padding: 2rem;">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                    <h6>No matches found</h6>
                    <small>Try adjusting your search or filters</small>
                </div>
            </div>
        `;
        return;
    }

    matchesList.innerHTML = '';

    matches.forEach((match, index) => {
        const userEmail = match.userEmail ||
            (match.userId && match.userId !== 'unknown' ? `${match.userId}@unknown.com` : 'unknown@example.com');

        const matchTitle = match.title || match.matchTitle || 'Untitled Match';
        const matchDate = new Date(match.savedAt || Date.now());
        const formattedDate = matchDate.toLocaleDateString();
        const formattedTime = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Create user avatar initials
        const userInitials = userEmail.split('@')[0].substring(0, 2).toUpperCase();

        // Create team vs team display
        const teamsDisplay = match.team1Name && match.team2Name
            ? `${match.team1Name} vs ${match.team2Name}`
            : '';

        const listItem = document.createElement('div');
        listItem.className = 'card shadow-sm mb-3';
        listItem.style.borderRadius = '12px';
        listItem.style.border = '1px solid #e0e0e0';
        listItem.style.transition = 'all 0.2s ease';
        listItem.style.cursor = 'pointer';

        listItem.innerHTML = `
          <div class="card-body" style="padding: 1.25rem;">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1 me-3">
                <div class="d-flex align-items-center mb-1">
                  <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" 
                       style="width: 28px; height: 28px;">
                    <small class="fw-bold text-primary" style="font-size: 0.7rem;">${userInitials}</small>
                  </div>
                  <div class="min-width-0">
                    <div class="fw-bold text-truncate" style="font-size: 0.9rem;">${escapeHtml(matchTitle)}</div>
                    <div class="text-muted text-truncate" style="font-size: 0.75rem;">${escapeHtml(userEmail)}</div>
                  </div>
                </div>
                ${teamsDisplay ? `<div class="text-primary mb-1" style="font-size: 0.8rem;"><i class="fas fa-futbol me-1"></i>${escapeHtml(teamsDisplay)}</div>` : ''}
                <div class="text-muted" style="font-size: 0.75rem;">
                  <i class="fas fa-calendar me-1"></i>${formattedDate} ${formattedTime}
                </div>
              </div>
              <div class="d-flex flex-column gap-2 flex-shrink-0" style="padding: 0.25rem;">
                <button class="btn btn-primary btn-sm view-match-btn" data-match-index="${index}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" title="View Match">
                  View
                </button>
                <div class="d-flex gap-2">
                  <button class="btn btn-outline-warning btn-sm transfer-match-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="Transfer">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm delete-match-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Add hover effects
        listItem.addEventListener('mouseenter', () => {
            listItem.style.transform = 'translateY(-2px)';
            listItem.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            listItem.style.borderColor = '#c0c0c0';
        });

        listItem.addEventListener('mouseleave', () => {
            listItem.style.transform = 'translateY(0)';
            listItem.style.boxShadow = '';
            listItem.style.borderColor = '#e0e0e0';
        });

        matchesList.appendChild(listItem);
    });

    addEventListeners();
};



const addEventListeners = () => {
    // View buttons
    document.querySelectorAll('.view-match-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchIndex = parseInt(e.target.closest('button').getAttribute('data-match-index'));
            const matchData = allMatches[matchIndex];
            showMatchDetails(matchData, matchIndex);
        });
    });

    // Transfer buttons
    document.querySelectorAll('.transfer-match-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchIndex = parseInt(e.target.closest('button').getAttribute('data-match-index'));
            const matchData = allMatches[matchIndex];
            showTransferModal(matchData, matchIndex);
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

const showTransferModal = (matchData, matchIndex) => {
    currentTransferMatch = { data: matchData, index: matchIndex };

    // Populate match details
    const detailsDiv = document.getElementById('transfer-match-details');
    if (detailsDiv) {
        const userEmail = matchData.userEmail || 'unknown@example.com';
        const matchTitle = matchData.title || matchData.matchTitle || 'Untitled Match';
        const savedDate = matchData.savedAt ? new Date(matchData.savedAt).toLocaleString() : 'Unknown';

        detailsDiv.innerHTML = `
            <div class="card-body">
                <h6 class="card-title">${escapeHtml(matchTitle)}</h6>
                <p class="card-text mb-1"><strong>Current Owner:</strong> ${escapeHtml(userEmail)}</p>
                <p class="card-text mb-0"><strong>Saved:</strong> ${savedDate}</p>
            </div>
        `;
    }

    // Populate user dropdown with unique users (excluding current owner)
    const targetUserSelect = document.getElementById('target-user-select');
    if (targetUserSelect) {
        const uniqueUsers = [...new Set(allMatches
            .map(m => m.userEmail || m.userId)
            .filter(user => user && user !== 'unknown' && user !== (matchData.userEmail || matchData.userId))
        )];

        targetUserSelect.innerHTML = '<option value="">Select target user...</option>';
        uniqueUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            targetUserSelect.appendChild(option);
        });
    }

    // Clear new user email field
    const newUserEmail = document.getElementById('new-user-email');
    if (newUserEmail) {
        newUserEmail.value = '';
    }

    // Reset transfer button state
    const confirmTransferBtn = document.getElementById('confirm-transfer-btn');
    if (confirmTransferBtn) {
        confirmTransferBtn.disabled = true;
    }

    transferModalInstance.show();
};

const handleTransferConfirm = async () => {
    if (!currentTransferMatch) return;

    const confirmBtn = document.getElementById('confirm-transfer-btn');
    const targetUserSelect = document.getElementById('target-user-select');
    const newUserEmail = document.getElementById('new-user-email');
    const originalText = confirmBtn.innerHTML;

    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transferring...';

        // Determine target user
        let targetUser = targetUserSelect?.value;
        const emailInput = newUserEmail?.value?.trim();

        if (!targetUser && emailInput) {
            // Generate new user ID from email
            targetUser = emailInput;
        }

        if (!targetUser) {
            notificationManager.error('Please select a target user or enter an email address.');
            return;
        }

        console.log('Transferring match from', currentTransferMatch.data.userId, 'to', targetUser);

        // Create the match data for the new user
        const transferredMatch = {
            ...currentTransferMatch.data,
            userEmail: emailInput || targetUser,
            userId: generateUserIdFromEmail(emailInput || targetUser),
            transferredAt: Date.now(),
            transferredFrom: {
                userId: currentTransferMatch.data.userId,
                userEmail: currentTransferMatch.data.userEmail,
                transferredAt: Date.now()
            }
        };

        // Remove admin-specific properties that shouldn't be transferred
        delete transferredMatch.blobKey;
        delete transferredMatch.matchIndex;
        delete transferredMatch.id;

        // Save to new user (this will be handled by the API)
        await userMatchesApi.saveMatchData(transferredMatch);

        // Delete from original user - use the correct matchIndex
        const matchIndexToDelete = currentTransferMatch.data.matchIndex !== undefined
            ? currentTransferMatch.data.matchIndex
            : currentTransferMatch.index;

        await userMatchesApi.deleteMatchData(
            currentTransferMatch.data.userId,
            matchIndexToDelete
        );

        // Update local data
        allMatches.splice(currentTransferMatch.index, 1);

        // Re-render cards view
        renderCards(allMatches);

        const statsCardsContainer = document.getElementById('admin-stats-cards');
        renderStats(allMatches, statsCardsContainer);

        transferModalInstance.hide();

        const matchTitle = currentTransferMatch.data.title ||
            currentTransferMatch.data.matchTitle ||
            'Untitled Match';
        notificationManager.success(`Match "${matchTitle}" has been transferred to ${targetUser} successfully.`);

        currentTransferMatch = null;

    } catch (error) {
        console.error('Error transferring match:', error);
        notificationManager.error(`Failed to transfer match: ${error.message}`);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
};

// Helper function to generate user ID from email
const generateUserIdFromEmail = (email) => {
    if (!email || !email.includes('@')) {
        return 'user_' + Math.random().toString(36).substring(2, 15);
    }

    // Create a consistent user ID based on email
    const emailPart = email.split('@')[0];
    const domain = email.split('@')[1];
    return `user_${emailPart}_${domain.replace(/\./g, '_')}`;
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
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        console.log('Attempting to delete match:', currentDeleteMatch.data);
        console.log('Match userId:', currentDeleteMatch.data.userId);
        console.log('Match index:', currentDeleteMatch.index);
        console.log('Match blobKey:', currentDeleteMatch.data.blobKey);

        if (!currentDeleteMatch.data.userId || currentDeleteMatch.data.userId === 'unknown') {
            notificationManager.warning('This match has missing or invalid userId. It may be orphaned data that cannot be deleted through the normal API.');

            const removeFromDisplay = confirm('This match appears to be orphaned data. Would you like to remove it from the display? (Note: This will only hide it from the admin panel, not delete the actual data)');

            if (removeFromDisplay) {
                allMatches.splice(currentDeleteMatch.index, 1);

                // Re-render the cards view and stats
                renderCards(allMatches);
                const statsCardsContainer = document.getElementById('admin-stats-cards');
                renderStats(allMatches, statsCardsContainer);

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

        // Use the matchIndex from the match data if available, otherwise fall back to the array index
        const matchIndexToDelete = currentDeleteMatch.data.matchIndex !== undefined
            ? currentDeleteMatch.data.matchIndex
            : currentDeleteMatch.index;

        console.log('Deleting match with userId:', currentDeleteMatch.data.userId, 'matchIndex:', matchIndexToDelete);

        await userMatchesApi.deleteMatchData(
            currentDeleteMatch.data.userId,
            matchIndexToDelete
        );

        allMatches.splice(currentDeleteMatch.index, 1);

        // Re-render the cards view and stats
        renderCards(allMatches);
        const statsCardsContainer = document.getElementById('admin-stats-cards');
        renderStats(allMatches, statsCardsContainer);

        deleteModalInstance.hide();

        const matchTitle = currentDeleteMatch.data.title ||
            currentDeleteMatch.data.matchTitle ||
            'Untitled Match';
        notificationManager.success(`Match "${matchTitle}" has been deleted successfully.`);

        currentDeleteMatch = null;

    } catch (error) {
        console.error('Error deleting match:', error);
        notificationManager.error(`Failed to delete match: ${error.message}`);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
};

const renderStats = (matches, statsContainer) => {
    const statsCardsContainer = document.getElementById('admin-stats-cards');
    if (!statsCardsContainer) return;

    if (!matches || !matches.length) {
        statsCardsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info mb-0">
                    <i class="fas fa-info-circle me-2"></i>No data available for statistics.
                </div>
            </div>
        `;
        return;
    }

    const totalMatches = matches.length;
    const uniqueUsers = new Set(matches.map(m => m.userEmail || m.userId)).size;
    const recentMatches = matches.filter(m =>
        m.savedAt && (Date.now() - m.savedAt < 7 * 24 * 60 * 60 * 1000)
    ).length;

    const todayMatches = matches.filter(m => {
        if (!m.savedAt) return false;
        const today = new Date();
        const matchDate = new Date(m.savedAt);
        return matchDate.toDateString() === today.toDateString();
    }).length;

    statsCardsContainer.innerHTML = `
        <div class="col-6 col-md-3">
            <div class="card shadow-sm" style="border-radius: 8px; border: 1px solid #e0e0e0;">
                <div class="card-body text-center p-2">
                    <div class="text-primary mb-1">
                        <i class="fas fa-futbol"></i>
                    </div>
                    <div class="fw-bold text-primary">${totalMatches}</div>
                    <div class="small text-muted">Total</div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card shadow-sm" style="border-radius: 8px; border: 1px solid #e0e0e0;">
                <div class="card-body text-center p-2">
                    <div class="text-success mb-1">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="fw-bold text-success">${uniqueUsers}</div>
                    <div class="small text-muted">Users</div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card shadow-sm" style="border-radius: 8px; border: 1px solid #e0e0e0;">
                <div class="card-body text-center p-2">
                    <div class="text-info mb-1">
                        <i class="fas fa-calendar-week"></i>
                    </div>
                    <div class="fw-bold text-info">${recentMatches}</div>
                    <div class="small text-muted">Week</div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card shadow-sm" style="border-radius: 8px; border: 1px solid #e0e0e0;">
                <div class="card-body text-center p-2">
                    <div class="text-warning mb-1">
                        <i class="fas fa-calendar-day"></i>
                    </div>
                    <div class="fw-bold text-warning">${todayMatches}</div>
                    <div class="small text-muted">Today</div>
                </div>
            </div>
        </div>
    `;
};

const applyFilter = (filterValue) => {
    let filteredMatches = [...allMatches];

    if (filterValue) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        filteredMatches = allMatches.filter(match => {
            if (!match.savedAt) return false;
            const matchDate = new Date(match.savedAt);

            switch (filterValue) {
                case 'today':
                    return matchDate >= today;
                case 'week':
                    return matchDate >= weekAgo;
                case 'month':
                    return matchDate >= monthAgo;
                default:
                    return true;
            }
        });
    }

    renderCards(filteredMatches);

    // Update stats with filtered data
    const statsCardsContainer = document.getElementById('admin-stats-cards');
    renderStats(filteredMatches, statsCardsContainer);
};

const filterMatches = (searchTerm) => {
    if (!searchTerm.trim()) {
        // Apply current filter if any
        const filterSelect = document.getElementById('filter-select');
        const currentFilter = filterSelect ? filterSelect.value : '';
        applyFilter(currentFilter);
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

    renderCards(filtered);

    // Update stats with filtered data
    const statsCardsContainer = document.getElementById('admin-stats-cards');
    renderStats(filtered, statsCardsContainer);
};

const showNoDataMessage = () => {
    const matchesList = document.getElementById('matches-list');
    const statsCardsContainer = document.getElementById('admin-stats-cards');

    if (matchesList) {
        matchesList.innerHTML = `
            <div class="card shadow-sm" style="border-radius: 12px; border: 1px solid #e0e0e0;">
                <div class="card-body text-center text-muted" style="padding: 2rem;">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                    <h6>No matches found</h6>
                    <small>No match data available to display</small>
                </div>
            </div>
        `;
    }

    if (statsCardsContainer) {
        renderStats([], statsCardsContainer);
    }
};

const showErrorMessage = (errorMessage) => {
    const matchesList = document.getElementById('matches-list');
    const statsCardsContainer = document.getElementById('admin-stats-cards');

    if (matchesList) {
        matchesList.innerHTML = `
            <div class="card shadow-sm" style="border-radius: 12px; border: 1px solid #e0e0e0;">
                <div class="card-body text-center text-danger" style="padding: 2rem;">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h6>Error Loading Data</h6>
                    <p>${escapeHtml(errorMessage)}</p>
                    <button class="btn btn-outline-primary" onclick="location.reload()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            </div>
        `;
    }

    if (statsCardsContainer) {
        renderStats([], statsCardsContainer);
    }
};

// Updated showMatchDetails function to use matchSummaryModal
const showMatchDetails = (matchData, matchIndex) => {
    console.log('Showing match details for:', matchData);

    // Prepare the match data with admin information
    const enrichedMatchData = {
        ...matchData,
        _adminInfo: {
            isAdminView: true,
            userEmail: matchData.userEmail || 'Unknown',
            userId: matchData.userId || 'Unknown',
            savedAt: matchData.savedAt ? new Date(matchData.savedAt).toLocaleString() : 'Unknown',
            matchIndex: matchIndex,
            blobKey: matchData.blobKey || 'Unknown'
        }
    };

    // Initialize the match summary modal
    matchSummaryModal.init();

    // Get the admin modal element to determine its z-index
    const adminModalElement = document.getElementById('admin-modal');
    let targetZIndex = 1060; // Default higher z-index

    if (adminModalElement) {
        const adminZIndex = parseInt(window.getComputedStyle(adminModalElement).zIndex) || 1055;
        targetZIndex = adminZIndex + 10; // Ensure it's higher than admin modal
    }

    // Show the match summary modal
    matchSummaryModal.show(enrichedMatchData);

    // Force the z-index after a brief delay to ensure the modal is rendered
    setTimeout(() => {
        const matchSummaryModalElement = document.getElementById('matchSummaryModal');
        if (matchSummaryModalElement) {
            matchSummaryModalElement.style.zIndex = targetZIndex.toString();
            matchSummaryModalElement.style.display = 'block'; // Ensure it's visible

            // Also handle the backdrop
            const allBackdrops = document.querySelectorAll('.modal-backdrop');
            if (allBackdrops.length > 0) {
                // Set the most recent backdrop to a high z-index
                const lastBackdrop = allBackdrops[allBackdrops.length - 1];
                lastBackdrop.style.zIndex = (targetZIndex - 1).toString();
            }

            console.log(`Set match summary modal z-index to ${targetZIndex}`);
        }
    }, 50);
};

// Clean up any leftover modal backdrops when admin modal is hidden
const cleanupModalBackdrops = () => {
    // Small delay to ensure modal system has finished its cleanup
    setTimeout(() => {
        // Remove any orphaned modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.remove();
        });

        // Ensure body classes are cleaned up
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, 100);
};

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const show = () => {
    // Import auth service to check admin status
    import('../services/auth.js').then(({ authService }) => {
        if (!authService.isUserAuthenticated() || !authService.isAdmin()) {
            console.warn('Access denied: Admin privileges required');
            import('../services/notifications.js').then(({ notificationManager }) => {
                notificationManager.error('Access denied: Admin privileges required');
            });
            return;
        }
        
        if (!modalInstance) {
            init();
        }
        modalInstance.show();
    });
};

export const adminModal = {
    init,
    show
};
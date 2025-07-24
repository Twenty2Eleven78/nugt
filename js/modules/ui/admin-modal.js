const showDeleteConfirmation = (matchData, matchIndex) => {import { userMatchesApi } from '../services/user-matches-api.js';
import { notificationManager } from '../services/notifications.js';
import { matchSummaryModal } from './match-summary-modal.js';

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

<!-- Transfer Match Modal -->
<div class="modal fade" id="transfer-match-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
                <h5 class="modal-title">
                    <i class="fas fa-exchange-alt"></i> Transfer Match
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
    
    modalInstance = new bootstrap.Modal(modalElement);
    deleteModalInstance = new bootstrap.Modal(deleteModalElement);
    transferModalInstance = new bootstrap.Modal(transferModalElement);

    // Initialize match summary modal
    matchSummaryModal.init();

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

    // Transfer confirmation and validation
    const confirmTransferBtn = document.getElementById('confirm-transfer-btn');
    const targetUserSelect = document.getElementById('target-user-select');
    const newUserEmail = document.getElementById('new-user-email');
    
    if (confirmTransferBtn) {
        confirmTransferBtn.addEventListener('click', handleTransferConfirm);
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

    modalElement.addEventListener('show.bs.modal', async () => {
        await loadMatchesData();
    });

    // Clean up when admin modal is hidden
    modalElement.addEventListener('hidden.bs.modal', cleanupModalBackdrops);
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
                    <button class="btn btn-outline-warning transfer-match-btn" data-match-index="${index}">
                        <i class="fas fa-exchange-alt"></i> Transfer
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
                            <button class="btn btn-outline-warning transfer-match-btn" data-match-index="${index}">
                                <i class="fas fa-exchange-alt"></i>
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
                    <button class="btn btn-outline-warning transfer-match-btn" data-match-index="${index}">
                        <i class="fas fa-exchange-alt"></i>
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
        
        // Delete from original user
        await userMatchesApi.deleteMatchData(
            currentTransferMatch.data.userId, 
            currentTransferMatch.index
        );
        
        // Update local data
        allMatches.splice(currentTransferMatch.index, 1);
        
        // Re-render all views
        renderDesktopTable(allMatches);
        renderMobileCards(allMatches);
        
        const tableViewRadio = document.getElementById('table-view');
        if (tableViewRadio && tableViewRadio.checked) {
            renderMobileTable(allMatches);
        }
        
        const statsDiv = document.getElementById('admin-stats');
        renderStats(allMatches, statsDiv);
        
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

        await userMatchesApi.deleteMatchData(
            currentDeleteMatch.data.userId, 
            currentDeleteMatch.index
        );
        
        allMatches.splice(currentDeleteMatch.index, 1);
        
        renderDesktopTable(allMatches);
        renderMobileCards(allMatches);
        
        const tableViewRadio = document.getElementById('table-view');
        if (tableViewRadio && tableViewRadio.checked) {
            renderMobileTable(allMatches);
        }
        
        const statsDiv = document.getElementById('admin-stats');
        renderStats(allMatches, statsDiv);
        
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
    // Small delay to ensure Bootstrap has finished its cleanup
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
    if (!modalInstance) {
        init();
    }
    modalInstance.show();
};

export const adminModal = {
    init,
    show
};
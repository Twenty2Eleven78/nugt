import { userMatchesApi } from '../services/user-matches-api.js';
import { notificationManager } from '../services/notifications.js';
import { matchSummaryModal } from './match-summary-modal.js';
import { CustomModal } from '../shared/custom-modal.js';

const modalHtml = `
<div class="modal fade" id="admin-modal" tabindex="-1" aria-labelledby="admin-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen-lg-down modal-xl">
        <div class="modal-content">
            <!-- Modern Header with Gradient -->
            <div class="modal-header bg-gradient text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="d-flex align-items-center">
                    <div class="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                        <i class="fas fa-shield-alt fa-lg"></i>
                    </div>
                    <div>
                        <h4 class="modal-title mb-0" id="admin-modal-label">Admin Dashboard</h4>
                        <small class="opacity-75">Match Management & Analytics</small>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white" data-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body p-0">
                <!-- Top Control Bar -->
                <div class="bg-light border-bottom p-3">
                    <div class="row g-3 align-items-center">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0">
                                    <i class="fas fa-search text-muted"></i>
                                </span>
                                <input type="text" class="form-control border-start-0" id="admin-search" 
                                       placeholder="Search matches, users, or dates...">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filter-select">
                                <option value="">All Matches</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-outline-primary w-100" id="refresh-data-btn">
                                <i class="fas fa-sync-alt me-2"></i>Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="p-3 bg-white">
                    <div class="row g-3" id="admin-stats-cards">
                        <!-- Stats cards will be populated here -->
                        <div class="col-6 col-md-3">
                            <div class="card border-0 bg-primary bg-opacity-10 h-100">
                                <div class="card-body text-center p-3">
                                    <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                                    <div class="small text-muted">Loading...</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="card border-0 bg-success bg-opacity-10 h-100">
                                <div class="card-body text-center p-3">
                                    <div class="spinner-border spinner-border-sm text-success mb-2" role="status"></div>
                                    <div class="small text-muted">Loading...</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="card border-0 bg-info bg-opacity-10 h-100">
                                <div class="card-body text-center p-3">
                                    <div class="spinner-border spinner-border-sm text-info mb-2" role="status"></div>
                                    <div class="small text-muted">Loading...</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="card border-0 bg-warning bg-opacity-10 h-100">
                                <div class="card-body text-center p-3">
                                    <div class="spinner-border spinner-border-sm text-warning mb-2" role="status"></div>
                                    <div class="small text-muted">Loading...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- View Toggle for Mobile -->
                <div class="d-lg-none px-3 pb-3">
                    <div class="btn-group w-100" role="group">
                        <input type="radio" class="btn-check" name="view-mode" id="card-view" checked>
                        <label class="btn btn-outline-secondary" for="card-view">
                            <i class="fas fa-th-large me-1"></i>Cards
                        </label>
                        <input type="radio" class="btn-check" name="view-mode" id="table-view">
                        <label class="btn btn-outline-secondary" for="table-view">
                            <i class="fas fa-table me-1"></i>Table
                        </label>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="px-3 pb-3">
                    <!-- Desktop Table View -->
                    <div id="desktop-table-view" class="d-none d-lg-block">
                        <div class="card border-0 shadow-sm">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead class="table-dark">
                                        <tr>
                                            <th class="border-0">
                                                <i class="fas fa-user me-2"></i>User
                                            </th>
                                            <th class="border-0">
                                                <i class="fas fa-futbol me-2"></i>Match
                                            </th>
                                            <th class="border-0">
                                                <i class="fas fa-calendar me-2"></i>Date
                                            </th>
                                            <th class="border-0 text-center">
                                                <i class="fas fa-cogs me-2"></i>Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody id="matches-table-body">
                                        <tr>
                                            <td colspan="4" class="text-center py-5">
                                                <div class="spinner-border text-primary mb-3" role="status"></div>
                                                <div class="text-muted">Loading match data...</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Card View -->
                    <div id="mobile-card-view" class="d-lg-none">
                        <div id="matches-cards-container">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary mb-3" role="status"></div>
                                <div class="text-muted">Loading match data...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Table View -->
                    <div id="mobile-table-view" class="d-lg-none" style="display: none;">
                        <div class="card border-0 shadow-sm">
                            <div class="table-responsive">
                                <table class="table table-sm table-hover mb-0">
                                    <thead class="table-dark">
                                        <tr>
                                            <th class="border-0">User</th>
                                            <th class="border-0">Match</th>
                                            <th class="border-0">Date</th>
                                            <th class="border-0">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="matches-mobile-table-body">
                                        <!-- Mobile table content -->
                                    </tbody>
                                </table>
                            </div>
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
    const tableBody = document.getElementById('matches-table-body');
    const cardsContainer = document.getElementById('matches-cards-container');
    const statsCardsContainer = document.getElementById('admin-stats-cards');
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

const renderDesktopTable = (matches) => {
    const tableBody = document.getElementById('matches-table-body');
    if (!tableBody) return;

    if (matches.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <div class="text-muted">
                        <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                        <div>No matches found</div>
                        <small>Try adjusting your search or filters</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    
    matches.forEach((match, index) => {
        const row = document.createElement('tr');
        
        const userEmail = match.userEmail || 
                         (match.userId && match.userId !== 'unknown' ? `${match.userId}@unknown.com` : 'unknown@example.com');
        
        const matchTitle = match.title || match.matchTitle || 'Untitled Match';
        const savedDate = match.savedAt ? new Date(match.savedAt).toLocaleString() : 'Unknown';
        
        // Create user avatar initials
        const userInitials = userEmail.split('@')[0].substring(0, 2).toUpperCase();
        
        row.innerHTML = `
            <td class="align-middle">
                <div class="d-flex align-items-center">
                    <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style="width: 40px; height: 40px;">
                        <small class="fw-bold text-primary">${userInitials}</small>
                    </div>
                    <div>
                        <div class="fw-medium text-break">${escapeHtml(userEmail)}</div>
                        <small class="text-muted font-monospace">${escapeHtml(match.userId || 'unknown')}</small>
                    </div>
                </div>
            </td>
            <td class="align-middle">
                <div class="fw-medium text-break">${escapeHtml(matchTitle)}</div>
                <small class="text-muted">
                    ${match.team1Name || 'Team 1'} vs ${match.team2Name || 'Team 2'}
                </small>
            </td>
            <td class="align-middle">
                <div class="text-nowrap">${new Date(match.savedAt || Date.now()).toLocaleDateString()}</div>
                <small class="text-muted">${new Date(match.savedAt || Date.now()).toLocaleTimeString()}</small>
            </td>
            <td class="align-middle text-center">
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary view-match-btn" data-match-index="${index}" title="View Match">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning transfer-match-btn" data-match-index="${index}" title="Transfer Match">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-match-btn" data-match-index="${index}" title="Delete Match">
                        <i class="fas fa-trash"></i>
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
            <div class="text-center text-muted py-5">
                <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                <h5>No matches found</h5>
                <p>Try adjusting your search or filters</p>
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
        
        // Create user avatar initials
        const userInitials = userEmail.split('@')[0].substring(0, 2).toUpperCase();
        
        const card = document.createElement('div');
        card.className = 'card mb-3 border-0 shadow-sm';
        card.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex align-items-start">
                    <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" 
                         style="width: 45px; height: 45px;">
                        <small class="fw-bold text-primary">${userInitials}</small>
                    </div>
                    <div class="flex-grow-1 min-width-0">
                        <h6 class="card-title mb-1 text-break fw-bold">${escapeHtml(matchTitle)}</h6>
                        <div class="text-primary mb-1 small text-break">${escapeHtml(userEmail)}</div>
                        <div class="text-muted small mb-2">
                            <i class="fas fa-futbol me-1"></i>
                            ${match.team1Name || 'Team 1'} vs ${match.team2Name || 'Team 2'}
                        </div>
                        <div class="text-muted small">
                            <i class="fas fa-clock me-1"></i>
                            ${new Date(match.savedAt || Date.now()).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item view-match-btn" data-match-index="${index}">
                                    <i class="fas fa-eye me-2"></i>View Match
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item transfer-match-btn" data-match-index="${index}">
                                    <i class="fas fa-exchange-alt me-2"></i>Transfer
                                </button>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <button class="dropdown-item text-danger delete-match-btn" data-match-index="${index}">
                                    <i class="fas fa-trash me-2"></i>Delete
                                </button>
                            </li>
                        </ul>
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
                
                renderDesktopTable(allMatches);
                renderMobileCards(allMatches);
                
                const tableViewRadio = document.getElementById('table-view');
                if (tableViewRadio && tableViewRadio.checked) {
                    renderMobileTable(allMatches);
                }
                
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
            <div class="card border-0 bg-primary bg-opacity-10 h-100">
                <div class="card-body text-center p-3">
                    <div class="text-primary mb-2">
                        <i class="fas fa-futbol fa-2x"></i>
                    </div>
                    <h4 class="fw-bold text-primary mb-1">${totalMatches}</h4>
                    <div class="small text-muted">Total Matches</div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card border-0 bg-success bg-opacity-10 h-100">
                <div class="card-body text-center p-3">
                    <div class="text-success mb-2">
                        <i class="fas fa-users fa-2x"></i>
                    </div>
                    <h4 class="fw-bold text-success mb-1">${uniqueUsers}</h4>
                    <div class="small text-muted">Active Users</div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card border-0 bg-info bg-opacity-10 h-100">
                <div class="card-body text-center p-3">
                    <div class="text-info mb-2">
                        <i class="fas fa-calendar-week fa-2x"></i>
                    </div>
                    <h4 class="fw-bold text-info mb-1">${recentMatches}</h4>
                    <div class="small text-muted">This Week</div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card border-0 bg-warning bg-opacity-10 h-100">
                <div class="card-body text-center p-3">
                    <div class="text-warning mb-2">
                        <i class="fas fa-calendar-day fa-2x"></i>
                    </div>
                    <h4 class="fw-bold text-warning mb-1">${todayMatches}</h4>
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
    
    renderDesktopTable(filteredMatches);
    renderMobileCards(filteredMatches);
    
    const tableViewRadio = document.getElementById('table-view');
    if (tableViewRadio && tableViewRadio.checked) {
        renderMobileTable(filteredMatches);
    }
    
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
    const statsCardsContainer = document.getElementById('admin-stats-cards');

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
    const statsCardsContainer = document.getElementById('admin-stats-cards');

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
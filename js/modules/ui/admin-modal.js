import { userMatchesApi } from '../services/user-matches-api.js';
import { notificationManager } from '../services/notifications.js';
import { matchSummaryModal } from './match-summary-modal.js';
import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';
import { authService } from '../services/auth.js';

const createMainAdminModal = () => {
    const bodyContent = `
        <!-- Controls -->
        <div class="mb-3">
            <div class="row g-2">
                <div class="col-4">
                    <select class="form-select" id="filter-select">
                        <option value="">All Matches</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
                <div class="col-4">
                    <button class="btn btn-primary w-100" id="refresh-data-btn">
                        <i class="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                </div>
                <div class="col-4">
                    <button class="btn btn-success w-100" id="upload-json-btn" title="Upload Match Data">
                        <i class="fas fa-upload me-1"></i>Upload
                    </button>
                </div>
            </div>
            <div class="row g-2 mt-1">
                <div class="col-6">
                    <button class="btn btn-primary w-100" id="generate-stats-btn" title="Generate Statistics">
                        <i class="fas fa-chart-bar me-1"></i>Generate Stats
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-danger w-100" id="clear-stats-btn" title="Clear Cloud Stats">
                        <i class="fas fa-trash me-1"></i>Clear Stats
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
    `;

    // Create main admin modal using factory
    createAndAppendModal(
        'admin-modal',
        'Admin Dashboard',
        bodyContent,
        {
            ...MODAL_CONFIGS.EXTRA_LARGE,
            size: 'modal-fullscreen-lg-down modal-xl'
        }
    );
};

const modalHtml = `

<!-- Confirmation Modal for Deletion -->
<div class="modal fade" id="delete-confirm-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="fas fa-trash"></i> Confirm Deletion
                </h5>
                <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
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

<!-- Upload JSON Modal -->
<div class="modal fade" id="upload-json-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-success text-white">
                <h5 class="modal-title">
                    <i class="fas fa-upload"></i> Upload Match Data
                </h5>
                <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="json-file-input" class="form-label">
                        <strong>Select JSON File:</strong>
                    </label>
                    <input type="file" class="form-control" id="json-file-input" accept=".json" multiple>
                    <div class="form-text">
                        Select one or more JSON files containing match data to upload.
                    </div>
                </div>

                <div id="upload-preview" class="mb-3" style="display: none;">
                    <h6>Preview:</h6>
                    <div class="card bg-light">
                        <div class="card-body">
                            <div id="upload-preview-content"></div>
                        </div>
                    </div>
                </div>
                <div class="alert alert-info">
                    <strong>Note:</strong> The JSON files should contain valid match data. Each file will be imported as a separate match.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelUploadBtn">Cancel</button>
                <button type="button" class="btn btn-success" id="confirm-upload-btn" disabled>
                    <i class="fas fa-upload"></i> Upload Matches
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
                <button type="button" class="btn btn-danger btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times text-white" style="font-size: 14px;"></i>
                </button>
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

<!-- Confirmation Modal for Clearing Stats -->
<div class="modal fade" id="clear-stats-confirm-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="fas fa-trash"></i> Confirm Clear Statistics
                </h5>
                <button type="button" class="btn btn-primary btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 14px;"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete all generated statistics from the cloud?</p>
                <div class="alert alert-danger">
                    <strong>Warning:</strong> This will remove the shared statistics file for all users. This action cannot be undone.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-clear-stats-btn">
                    <i class="fas fa-trash"></i> Clear Statistics
                </button>
            </div>
        </div>
    </div>
</div>
`;

let modalInstance = null;
let deleteModalInstance = null;
let transferModalInstance = null;
let uploadModalInstance = null;
let clearStatsModalInstance = null;
let allMatches = []; // Store all matches for search functionality
let currentDeleteMatch = null;
let currentTransferMatch = null;
let selectedFiles = [];

const init = () => {
    // Create main admin modal using factory
    createMainAdminModal();
    
    // Add sub-modals using traditional HTML
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modalElement = document.getElementById('admin-modal');
    const deleteModalElement = document.getElementById('delete-confirm-modal');
    const uploadModalElement = document.getElementById('upload-json-modal');
    const transferModalElement = document.getElementById('transfer-match-modal');
    const clearStatsModalElement = document.getElementById('clear-stats-confirm-modal');

    modalInstance = CustomModal.getOrCreateInstance(modalElement);
    deleteModalInstance = CustomModal.getOrCreateInstance(deleteModalElement);
    uploadModalInstance = CustomModal.getOrCreateInstance(uploadModalElement);
    transferModalInstance = CustomModal.getOrCreateInstance(transferModalElement);
    clearStatsModalInstance = CustomModal.getOrCreateInstance(clearStatsModalElement);

    // Initialize match summary modal
    matchSummaryModal.init();

    // Set proper z-index for modal stacking
    if (modalElement && deleteModalElement && uploadModalElement && transferModalElement && clearStatsModalElement) {
        const baseZIndex = 1050; // Bootstrap's default modal z-index
        modalElement.style.zIndex = baseZIndex;
        
        // Set child modals to a much higher z-index to ensure they're always on top
        const childModalZIndex = baseZIndex + 100; // Using a larger offset
        deleteModalElement.style.zIndex = childModalZIndex;
        uploadModalElement.style.zIndex = childModalZIndex;
        transferModalElement.style.zIndex = childModalZIndex;
        clearStatsModalElement.style.zIndex = childModalZIndex;

        // Also update modal classes to ensure proper stacking
        [deleteModalElement, uploadModalElement, transferModalElement, clearStatsModalElement].forEach(element => {
            if (element) {
                element.classList.add('modal-child');
                element.setAttribute('data-child-modal', 'true');
            }
        });
    }



    // Add refresh button functionality
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadMatchesData);
    }

    // Add generate statistics button functionality
    const generateStatsBtn = document.getElementById('generate-stats-btn');
    if (generateStatsBtn) {
        generateStatsBtn.addEventListener('click', generateStatistics);
    }

    // Add clear statistics button functionality
    const clearStatsBtn = document.getElementById('clear-stats-btn');
    if (clearStatsBtn) {
        clearStatsBtn.addEventListener('click', () => {
            if (clearStatsModalInstance) {
                clearStatsModalInstance.show();
            }
        });
    }

    // Add modal show event listeners for backdrop adjustment
    if (deleteModalElement) {
        deleteModalElement.addEventListener('shown.bs.modal', () => adjustModalBackdrop(deleteModalElement));
    }
    if (uploadModalElement) {
        uploadModalElement.addEventListener('shown.bs.modal', () => adjustModalBackdrop(uploadModalElement));
    }
    if (transferModalElement) {
        transferModalElement.addEventListener('shown.bs.modal', () => adjustModalBackdrop(transferModalElement));
    }
    if (clearStatsModalElement) {
        clearStatsModalElement.addEventListener('shown.bs.modal', () => adjustModalBackdrop(clearStatsModalElement));
    }

    const confirmClearStatsBtn = document.getElementById('confirm-clear-stats-btn');
    if (confirmClearStatsBtn) {
        confirmClearStatsBtn.addEventListener('click', handleClearStatsConfirm);
    }

    // Add upload JSON button functionality
    const uploadJsonBtn = document.getElementById('upload-json-btn');
    if (uploadJsonBtn) {
        uploadJsonBtn.addEventListener('click', showUploadModal);
    }

    // Add filter functionality
    const filterSelect = document.getElementById('filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            applyFilter(e.target.value);
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

    // Upload modal event listeners
    const jsonFileInput = document.getElementById('json-file-input');
    const confirmUploadBtn = document.getElementById('confirm-upload-btn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');

    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', handleFileSelection);
    }

    if (confirmUploadBtn) {
        confirmUploadBtn.addEventListener('click', handleUploadConfirm);
    }

    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => {
            uploadModalInstance.hide();
        });
    }

    modalElement.addEventListener('modal.show', async () => {
        // Verify admin access before loading data
        try {
            const isAdmin = await authService.isAdmin();
            
            if (!isAdmin) {
                notificationManager.error('Access denied. Admin privileges required.');
                modalInstance.hide();
                return;
            }
            
            await loadMatchesData();
        } catch (error) {
            notificationManager.error('Unable to verify admin access. Please try again.');
            modalInstance.hide();
        }
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

        // Clear all caches to ensure fresh data
        userMatchesApi.clearCache();
        await clearServiceWorkerCache();

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

        // Check approval status (from localStorage or match data)
        const storedApproval = getApprovalStatus(match);
        const isApproved = storedApproval ? storedApproval.approved : (match.approvedForStats === true);
        
        // Debug logging for approval status
        const matchKey = getMatchApprovalKey(match);
        console.log(`Match approval check - Key: ${matchKey}, Stored: ${JSON.stringify(storedApproval)}, Final: ${isApproved}`);
        
        // Update match object with current approval status
        match.approvedForStats = isApproved;
        const approvalClass = isApproved ? 'border-success' : 'border-warning';

        const listItem = document.createElement('div');
        listItem.className = `card shadow-sm mb-3 ${approvalClass}`;
        listItem.style.borderRadius = '12px';
        listItem.style.border = `2px solid`;
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
                <div class="mt-1">
                  <span class="badge ${isApproved ? 'bg-success' : 'bg-warning'}" style="font-size: 0.65rem;">
                    <i class="fas ${isApproved ? 'fa-check-circle' : 'fa-clock'} me-1"></i>
                    ${isApproved ? 'Approved for Stats' : 'Pending Approval'}
                  </span>
                </div>
              </div>
              <div class="d-flex flex-column gap-1 flex-shrink-0" style="padding: 0.25rem;">
                <!-- View and Delete on same line -->
                <div class="d-flex gap-1">
                  <button class="btn btn-primary btn-sm view-match-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="View Match">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm delete-match-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <!-- Transfer and Approve on next line -->
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-warning btn-sm transfer-match-btn" data-match-index="${index}" style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" title="Transfer">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                  <button class="btn ${isApproved ? 'btn-outline-secondary' : 'btn-success'} btn-sm approve-match-btn" 
                          data-match-index="${index}" 
                          style="width: 28px; height: 28px; padding: 0; font-size: 0.7rem;" 
                          title="${isApproved ? 'Remove from Stats' : 'Approve for Stats'}">
                    <i class="fas ${isApproved ? 'fa-times' : 'fa-check'}"></i>
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

    // Approval buttons
    document.querySelectorAll('.approve-match-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchIndex = parseInt(e.target.closest('button').getAttribute('data-match-index'));
            const matchData = allMatches[matchIndex];
            toggleMatchApproval(matchData, matchIndex);
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

        // Clear all caches before deletion to ensure fresh data
        userMatchesApi.clearCache();
        await clearServiceWorkerCache();

        await userMatchesApi.deleteMatchData(
            currentDeleteMatch.data.userId,
            matchIndexToDelete
        );

        // Remove from local array
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

        // Clear caches again and refresh data to ensure consistency
        userMatchesApi.clearCache();
        await clearServiceWorkerCache();
        
        // Immediate refresh to ensure the UI is updated
        setTimeout(() => {
            loadMatchesData();
        }, 500);

    } catch (error) {
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

// Helper function to clear service worker cache
const clearServiceWorkerCache = () => {
    return new Promise((resolve) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                console.log('Service worker cache clear response:', event.data);
                resolve(event.data.success);
            };
            
            navigator.serviceWorker.controller.postMessage(
                { type: 'CLEAR_API_CACHE' },
                [messageChannel.port2]
            );
            
            // Timeout after 2 seconds
            setTimeout(() => resolve(false), 2000);
        } else {
            resolve(false);
        }
    });
};

// Helper functions for managing approval status
const getMatchApprovalKey = (matchData) => {
    // Create a unique key for this match based on multiple identifiers
    const userId = matchData.userId || 'unknown';
    const userEmail = matchData.userEmail || 'unknown';
    const savedAt = matchData.savedAt || matchData.timestamp || Date.now();
    const matchTitle = matchData.title || matchData.matchTitle || 'untitled';
    
    // Use a combination of identifiers to create a more stable key
    const keyComponents = [userId, userEmail.split('@')[0], savedAt, matchTitle.substring(0, 10)];
    return `match_approval_${keyComponents.join('_').replace(/[^a-zA-Z0-9_]/g, '_')}`;
};

const saveApprovalStatus = async (matchData, approved) => {
    const key = getMatchApprovalKey(matchData);
    let approvedBy = null;
    
    if (approved) {
        try {
            const currentUser = await authService.getCurrentUser();
            approvedBy = currentUser?.email || null;
        } catch (error) {
            console.warn('Could not get current user for approval:', error);
        }
    }
    
    const approvalData = {
        approved,
        approvedAt: approved ? Date.now() : null,
        approvedBy
    };
    
    console.log(`Saving approval status - Key: ${key}, Data: ${JSON.stringify(approvalData)}`);
    localStorage.setItem(key, JSON.stringify(approvalData));
    
    // Verify it was saved
    const verification = localStorage.getItem(key);
    console.log(`Verification - Saved data: ${verification}`);
};

const getApprovalStatus = (matchData) => {
    const key = getMatchApprovalKey(matchData);
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
};

const toggleMatchApproval = async (matchData, matchIndex) => {
    try {
        const currentApproval = matchData.approvedForStats === true;
        const newApproval = !currentApproval;
        
        // Save approval status to localStorage
        await saveApprovalStatus(matchData, newApproval);
        
        // Get current user for local update
        let approvedBy = null;
        if (newApproval) {
            try {
                const currentUser = await authService.getCurrentUser();
                approvedBy = currentUser?.email || null;
            } catch (error) {
                console.warn('Could not get current user for approval:', error);
            }
        }
        
        // Update the match data locally
        const updatedMatch = {
            ...matchData,
            approvedForStats: newApproval,
            approvedAt: newApproval ? Date.now() : null,
            approvedBy
        };
        
        // Update local data
        allMatches[matchIndex] = updatedMatch;
        
        // Re-render the cards
        renderCards(allMatches);
        
        const action = newApproval ? 'approved for' : 'removed from';
        notificationManager.success(`Match ${action} statistics generation`);
        
    } catch (error) {
        console.error('Error updating match approval:', error);
        notificationManager.error('Failed to update match approval status');
    }
};

// Function to handle modal backdrop z-index
const adjustModalBackdrop = (modalElement) => {
    setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
            const backdrop = backdrops[backdrops.length - 1];
            const modalZIndex = parseInt(window.getComputedStyle(modalElement).zIndex, 10);
            if (backdrop) {
                // For child modals, set backdrop higher than parent modal but lower than the child modal
                if (modalElement.getAttribute('data-child-modal') === 'true') {
                    backdrop.style.zIndex = modalZIndex - 1;
                    backdrop.classList.add('modal-backdrop-child');
                } else {
                    backdrop.style.zIndex = modalZIndex - 1;
                }
            }
        }
    }, 0);
};

const handleClearStatsConfirm = async () => {
    const confirmBtn = document.getElementById('confirm-clear-stats-btn');
    const originalText = confirmBtn.innerHTML;

    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Clearing...';

        // Call the API to delete the statistics from the cloud
        await userMatchesApi.deleteStatistics();

        // Clear the local cache
        localStorage.removeItem('generatedStatistics');

        // Hide the confirmation modal
        clearStatsModalInstance.hide();

        notificationManager.success('Cloud statistics have been cleared successfully.');

        // Optionally, refresh the statistics tab if it's visible
        const statsTab = document.querySelector('#statstab.active');
        if (statsTab) {
            import('./statistics-tab.js').then(({ statisticsTab }) => {
                if (statisticsTab && statisticsTab.show) {
                    statisticsTab.show();
                }
            });
        }

    } catch (error) {
        notificationManager.error(`Failed to clear statistics: ${error.message}`);
    } finally {
        if(confirmBtn){
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalText;
        }
    }
};

let isGeneratingStats = false;

const generateStatistics = async () => {
    if (isGeneratingStats) {
        notificationManager.warning('Statistics generation already in progress');
        return;
    }
    
    const generateBtn = document.getElementById('generate-stats-btn');
    const originalText = generateBtn?.innerHTML;
    
    try {
        isGeneratingStats = true;
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Generating...';
        }
        
        // Get all approved matches
        const approvedMatches = allMatches.filter(match => match.approvedForStats === true);
        
        if (approvedMatches.length === 0) {
            notificationManager.warning('No matches have been approved for statistics generation');
            return;
        }

        // Generate statistics from approved matches
        const statistics = await calculateStatisticsFromMatches(approvedMatches);
        
        // Save statistics to storage/API
        await saveGeneratedStatistics(statistics);
        
        notificationManager.success(`Statistics generated from ${approvedMatches.length} approved matches`);
        
    } catch (error) {
        console.error('Error generating statistics:', error);
        notificationManager.error('Failed to generate statistics');
    } finally {
        isGeneratingStats = false;
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalText || '<i class="fas fa-chart-bar me-1"></i>Generate Statistics';
        }
    }
};

const calculateStatisticsFromMatches = async (matches) => {
    // Import the statistics calculation logic
    const { rosterManager } = await import('../match/roster.js');
    
    const playerStatsMap = new Map();
    const roster = rosterManager.getRoster();
    
    // Initialize roster players
    roster.forEach(player => {
        const playerKey = player.name.toLowerCase().trim();
        playerStatsMap.set(playerKey, {
            name: player.name,
            shirtNumber: player.shirtNumber,
            goals: 0,
            assists: 0,
            appearances: 0,
            starts: 0,
            substitute: 0,
            matchesWithGoals: new Set(),
            matchesWithAssists: new Set(),
            matchesPlayed: new Set(),
            isRosterPlayer: true
        });
    });

    let totalGoalsFound = 0;
    let totalAssistsFound = 0;

    // Process each approved match
    matches.forEach((match, matchIndex) => {
        // Process lineup data
        if (match.matchLineup) {
            // Process starting XI
            if (match.matchLineup.startingXI && Array.isArray(match.matchLineup.startingXI)) {
                match.matchLineup.startingXI.forEach(playerName => {
                    if (playerName && playerName.trim()) {
                        const playerKey = playerName.toLowerCase().trim();
                        
                        if (playerStatsMap.has(playerKey)) {
                            const player = playerStatsMap.get(playerKey);
                            player.starts++;
                            player.matchesPlayed.add(matchIndex);
                        } else {
                            playerStatsMap.set(playerKey, {
                                name: playerName.trim(),
                                shirtNumber: null,
                                goals: 0,
                                assists: 0,
                                appearances: 0,
                                starts: 1,
                                substitute: 0,
                                matchesWithGoals: new Set(),
                                matchesWithAssists: new Set(),
                                matchesPlayed: new Set([matchIndex]),
                                isRosterPlayer: false
                            });
                        }
                    }
                });
            }
            
            // Process substitutes
            if (match.matchLineup.substitutes && Array.isArray(match.matchLineup.substitutes)) {
                match.matchLineup.substitutes.forEach(playerName => {
                    if (playerName && playerName.trim()) {
                        const playerKey = playerName.toLowerCase().trim();
                        
                        if (playerStatsMap.has(playerKey)) {
                            const player = playerStatsMap.get(playerKey);
                            player.substitute++;
                            player.matchesPlayed.add(matchIndex);
                        } else {
                            playerStatsMap.set(playerKey, {
                                name: playerName.trim(),
                                shirtNumber: null,
                                goals: 0,
                                assists: 0,
                                appearances: 0,
                                starts: 0,
                                substitute: 1,
                                matchesWithGoals: new Set(),
                                matchesWithAssists: new Set(),
                                matchesPlayed: new Set([matchIndex]),
                                isRosterPlayer: false
                            });
                        }
                    }
                });
            }
        }
        
        // Process attendance
        if (match.attendance && Array.isArray(match.attendance)) {
            match.attendance.forEach(attendee => {
                let name, isPresent;
                
                if (typeof attendee === 'string' && attendee.trim()) {
                    name = attendee.trim();
                    isPresent = true;
                } else if (attendee && typeof attendee === 'object') {
                    name = attendee.name || attendee.playerName || attendee.player;
                    // Check for attendance: true property
                    isPresent = attendee.attendance === true || attendee.present === true || attendee.attended === true || attendee.attending === true;
                }

                if (name && isPresent) {
                    const playerKey = name.toLowerCase().trim();
                    
                    if (playerStatsMap.has(playerKey)) {
                        playerStatsMap.get(playerKey).matchesPlayed.add(matchIndex);
                    } else {
                        playerStatsMap.set(playerKey, {
                            name: name.trim(),
                            shirtNumber: null,
                            goals: 0,
                            assists: 0,
                            appearances: 0,
                            starts: 0,
                            substitute: 0,
                            matchesWithGoals: new Set(),
                            matchesWithAssists: new Set(),
                            matchesPlayed: new Set([matchIndex]),
                            isRosterPlayer: false
                        });
                    }
                }
            });
        }

        // Process goals
        let goals = [];
        if (match.goals && Array.isArray(match.goals)) {
            goals = match.goals;
        } else if (match.matchEvents && Array.isArray(match.matchEvents)) {
            goals = match.matchEvents.filter(event => 
                event.type === 'goal' || event.eventType === 'goal'
            );
        }

        goals.forEach(goal => {
            totalGoalsFound++;
            
            // Process scorer - use the correct property names from the actual data
            const scorer = goal.goalScorerName || goal.scorer || goal.player || goal.goalScorer;
            if (scorer && scorer.trim() && scorer !== 'Opposition' && scorer.trim().toLowerCase() !== 'n/a') {
                const playerKey = scorer.toLowerCase().trim();
                
                if (playerStatsMap.has(playerKey)) {
                    const player = playerStatsMap.get(playerKey);
                    player.goals++;
                    player.matchesWithGoals.add(matchIndex);
                    player.matchesPlayed.add(matchIndex);
                    // Update shirt number from match data if available
                    if (goal.goalScorerShirtNumber && !player.shirtNumber) {
                        player.shirtNumber = goal.goalScorerShirtNumber;
                    }
                } else {
                    playerStatsMap.set(playerKey, {
                        name: scorer.trim(),
                        shirtNumber: goal.goalScorerShirtNumber || null,
                        goals: 1,
                        assists: 0,
                        appearances: 0,
                        starts: 0,
                        substitute: 0,
                        matchesWithGoals: new Set([matchIndex]),
                        matchesWithAssists: new Set(),
                        matchesPlayed: new Set([matchIndex]),
                        isRosterPlayer: false
                    });
                }
            }

            // Process assists - use the correct property names from the actual data
            const assistName = goal.goalAssistName || goal.assists || goal.assist || goal.assistedBy;
            if (assistName && assistName.trim() && assistName !== 'Opposition' && assistName.trim().toLowerCase() !== 'n/a') {
                totalAssistsFound++;
                const playerKey = assistName.toLowerCase().trim();
                
                if (playerStatsMap.has(playerKey)) {
                    const player = playerStatsMap.get(playerKey);
                    player.assists++;
                    player.matchesWithAssists.add(matchIndex);
                    player.matchesPlayed.add(matchIndex);
                    // Update shirt number from match data if available
                    if (goal.goalAssistShirtNumber && !player.shirtNumber) {
                        player.shirtNumber = goal.goalAssistShirtNumber;
                    }
                } else {
                    playerStatsMap.set(playerKey, {
                        name: assistName.trim(),
                        shirtNumber: goal.goalAssistShirtNumber || null,
                        goals: 0,
                        assists: 1,
                        appearances: 0,
                        starts: 0,
                        substitute: 0,
                        matchesWithGoals: new Set(),
                        matchesWithAssists: new Set([matchIndex]),
                        matchesPlayed: new Set([matchIndex]),
                        isRosterPlayer: false
                    });
                }
            }
        });
    });

    // Calculate final statistics
    const playerStats = Array.from(playerStatsMap.values()).map(player => {
        player.appearances = player.matchesPlayed.size;
        player.totalContributions = player.goals + player.assists;
        player.goalsPerMatch = player.appearances > 0 ? (player.goals / player.appearances).toFixed(2) : '0.00';
        player.assistsPerMatch = player.appearances > 0 ? (player.assists / player.appearances).toFixed(2) : '0.00';
        
        // Clean up Set objects for storage
        delete player.matchesWithGoals;
        delete player.matchesWithAssists;
        delete player.matchesPlayed;
        
        return player;
    });

    // Sort by total contributions, then goals, then assists
    playerStats.sort((a, b) => {
        if (b.totalContributions !== a.totalContributions) {
            return b.totalContributions - a.totalContributions;
        }
        if (b.goals !== a.goals) {
            return b.goals - a.goals;
        }
        return b.assists - a.assists;
    });

    // Calculate team statistics
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    let totalAttendance = 0;
    
    matches.forEach(match => {
        // Count goals for and against
        if (match.goals && Array.isArray(match.goals)) {
            match.goals.forEach(goal => {
                if (goal.goalScorerName && goal.goalScorerName !== 'Opposition') {
                    goalsFor++;
                } else if (goal.goalScorerName === 'Opposition') {
                    goalsAgainst++;
                }
            });
        }
        
        // Count attendance
        if (match.attendance && Array.isArray(match.attendance)) {
            const attendedCount = match.attendance.filter(attendee => {
                if (typeof attendee === 'string') return true;
                return attendee && (attendee.attendance === true || attendee.present === true || attendee.attended === true);
            }).length;
            totalAttendance += attendedCount;
        }
        
        // Determine match result (simplified - you might want to enhance this)
        const matchGoalsFor = match.goals ? match.goals.filter(g => g.goalScorerName !== 'Opposition').length : 0;
        const matchGoalsAgainst = match.goals ? match.goals.filter(g => g.goalScorerName === 'Opposition').length : 0;
        
        if (matchGoalsFor > matchGoalsAgainst) {
            wins++;
        } else if (matchGoalsFor === matchGoalsAgainst) {
            draws++;
        } else {
            losses++;
        }
    });
    
    const totalMatches = matches.length;
    const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const avgGoalsFor = totalMatches > 0 ? (goalsFor / totalMatches).toFixed(1) : '0.0';
    const avgGoalsAgainst = totalMatches > 0 ? (goalsAgainst / totalMatches).toFixed(1) : '0.0';
    const avgAttendance = totalMatches > 0 ? (totalAttendance / totalMatches).toFixed(1) : '0.0';
    const avgAssists = totalMatches > 0 ? (totalAssistsFound / totalMatches).toFixed(1) : '0.0';

    // Generate per-match statistics
    const matchStats = matches.map((match, index) => {
        const matchGoalsFor = match.goals ? match.goals.filter(g => g.goalScorerName && g.goalScorerName !== 'Opposition').length : 0;
        const matchGoalsAgainst = match.goals ? match.goals.filter(g => g.goalScorerName === 'Opposition').length : 0;
        const matchAssists = match.goals ? match.goals.filter(g => g.goalAssistName && g.goalAssistName !== 'Opposition').length : 0;
        
        // Count attendance for this match
        let matchAttendance = 0;
        if (match.attendance && Array.isArray(match.attendance)) {
            matchAttendance = match.attendance.filter(attendee => {
                if (typeof attendee === 'string') return true;
                return attendee && (attendee.attendance === true || attendee.present === true || attendee.attended === true || attendee.attending === true);
            }).length;
        }
        
        // Find top scorer for this match
        const matchGoals = match.goals ? match.goals.filter(g => g.goalScorerName && g.goalScorerName !== 'Opposition' && g.goalScorerName.toLowerCase() !== 'n/a') : [];
        const scorerCounts = {};
        matchGoals.forEach(goal => {
            const scorer = goal.goalScorerName;
            scorerCounts[scorer] = (scorerCounts[scorer] || 0) + 1;
        });
        
        let topScorer = 'None';
        let maxGoals = 0;
        Object.entries(scorerCounts).forEach(([scorer, goals]) => {
            if (goals > maxGoals) {
                maxGoals = goals;
                topScorer = `${scorer} (${goals})`;
            }
        });
        
        const opposition = match.team2Name || match.opposition || match.opponent || 'Unknown';
        console.log(`Match ${index}: team2name="${match.team2name}", opposition="${match.opposition}", opponent="${match.opponent}", final="${opposition}"`);
        
        return {
            date: match.date || match.matchDate || match.savedAt,
            opposition: opposition,
            ourGoals: matchGoalsFor,
            theirGoals: matchGoalsAgainst,
            assists: matchAssists,
            attendance: matchAttendance,
            topScorer: topScorer,
            matchIndex: index
        };
    });

    return {
        playerStats,
        totalMatches: matches.length,
        totalGoals: totalGoalsFound,
        totalAssists: totalAssistsFound,
        teamStats: {
            totalMatches,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            winPercentage,
            avgGoalsFor,
            avgGoalsAgainst,
            avgAttendance,
            avgAssists
        },
        matchStats,
        generatedAt: Date.now(),
        generatedBy: (await authService.getCurrentUser())?.email,
        approvedMatchIds: matches.map(m => m.id || m.savedAt).filter(Boolean)
    };
};

const saveGeneratedStatistics = async (statistics) => {
    console.log('📊 Admin: Saving generated statistics:', statistics);
    
    // Save to localStorage as fallback
    localStorage.setItem('generatedStatistics', JSON.stringify(statistics));
    console.log('💾 Admin: Saved to localStorage');
    
    // Save to cloud storage for sharing across users
    try {
        // Clear cache to ensure fresh data
        userMatchesApi.clearCache();
        
        // Save statistics - API will handle duplicate prevention
        await userMatchesApi.saveStatistics(statistics);
        console.log('☁️ Admin: Saved to cloud successfully');
    } catch (error) {
        console.warn('❌ Admin: Failed to save statistics to cloud:', error);
    }
};

const showUploadModal = () => {
    // Reset form
    const jsonFileInput = document.getElementById('json-file-input');
    const uploadPreview = document.getElementById('upload-preview');
    const confirmUploadBtn = document.getElementById('confirm-upload-btn');

    if (jsonFileInput) jsonFileInput.value = '';
    if (uploadPreview) uploadPreview.style.display = 'none';
    if (confirmUploadBtn) confirmUploadBtn.disabled = true;

    selectedFiles = [];
    uploadModalInstance.show();
};

const handleFileSelection = async (event) => {
    const files = Array.from(event.target.files);
    const uploadPreview = document.getElementById('upload-preview');
    const uploadPreviewContent = document.getElementById('upload-preview-content');
    const confirmUploadBtn = document.getElementById('confirm-upload-btn');

    selectedFiles = [];

    if (files.length === 0) {
        uploadPreview.style.display = 'none';
        confirmUploadBtn.disabled = true;
        return;
    }

    let validFiles = 0;
    let previewHtml = '';

    for (const file of files) {
        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            // Basic validation
            if (typeof jsonData === 'object' && jsonData !== null) {
                selectedFiles.push({ file, data: jsonData });
                validFiles++;

                const matchTitle = jsonData.title || jsonData.matchTitle || file.name;
                const userEmail = jsonData.userEmail || 'Not specified';
                const savedAt = jsonData.savedAt ? new Date(jsonData.savedAt).toLocaleString() : 'Not specified';

                previewHtml += `
                    <div class="border-bottom pb-2 mb-2">
                        <strong>File:</strong> ${escapeHtml(file.name)}<br>
                        <strong>Match:</strong> ${escapeHtml(matchTitle)}<br>
                        <strong>User:</strong> ${escapeHtml(userEmail)}<br>
                        <strong>Date:</strong> ${savedAt}
                    </div>
                `;
            }
        } catch (error) {
            previewHtml += `
                <div class="border-bottom pb-2 mb-2 text-danger">
                    <strong>File:</strong> ${escapeHtml(file.name)}<br>
                    <strong>Error:</strong> Invalid JSON format
                </div>
            `;
        }
    }

    if (uploadPreviewContent) {
        uploadPreviewContent.innerHTML = previewHtml;
    }

    uploadPreview.style.display = 'block';
    confirmUploadBtn.disabled = validFiles === 0;

    if (validFiles > 0) {
        notificationManager.info(`${validFiles} valid JSON file(s) selected for upload`);
    } else {
        notificationManager.error('No valid JSON files found');
    }
};

const handleUploadConfirm = async () => {
    if (selectedFiles.length === 0) return;

    const confirmBtn = document.getElementById('confirm-upload-btn');
    const originalText = confirmBtn.innerHTML;

    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        const currentUser = await authService.getCurrentUser();
        let successCount = 0;
        let errorCount = 0;

        for (const { file, data } of selectedFiles) {
            try {
                // Prepare match data - assign to current admin user
                const matchData = {
                    ...data,
                    uploadedAt: Date.now(),
                    uploadedBy: currentUser?.email || 'admin',
                    originalFileName: file.name,
                    userEmail: currentUser?.email || 'admin@nugt.app',
                    userId: currentUser?.id || 'admin_user'
                };

                // Remove any admin-specific properties
                delete matchData.blobKey;
                delete matchData.matchIndex;
                delete matchData.id;

                // Save the match data
                await userMatchesApi.saveMatchData(matchData);
                successCount++;

            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                errorCount++;
            }
        }

        // Refresh the data
        await loadMatchesData();

        uploadModalInstance.hide();

        if (successCount > 0) {
            notificationManager.success(`Successfully uploaded ${successCount} match(es)`);
        }
        if (errorCount > 0) {
            notificationManager.error(`Failed to upload ${errorCount} match(es)`);
        }

    } catch (error) {
        notificationManager.error(`Upload failed: ${error.message}`);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
};

const refreshData = async () => {
    if (modalInstance && modalInstance.isVisible) {
        await loadMatchesData();
    }
};

export const adminModal = {
    init,
    show,
    refreshData
};
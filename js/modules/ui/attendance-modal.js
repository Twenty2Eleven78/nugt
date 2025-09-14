/**
 * Attendance Modal
 * Handles match attendance modal UI
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';
import { attendanceManager } from '../services/attendance.js';

class AttendanceModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
  }

  /**
   * Initialize attendance modal
   */
  init() {
    if (this.isInitialized) return;
    
    this.createModal();
    this._bindEvents();
    this.isInitialized = true;
  }

  /**
   * Create attendance modal
   */
  createModal() {
    const bodyContent = `
      <!-- Attendance Summary -->
      <div class="attendance-summary mb-4">
        <div id="attendanceSummaryMain" class="text-center">
          <i class="fas fa-users me-1"></i>
          <strong>Loading...</strong>
        </div>
      </div>

      <!-- Attendance Controls -->
      <div class="attendance-controls-header mb-4">
        <div class="controls-info">
          <h6 class="mb-1"><i class="fas fa-sliders-h me-2"></i>Quick Actions</h6>
          <small class="text-muted">Manage attendance for all players at once</small>
        </div>
        <div class="controls-buttons">
          <button id="markAllAttendingBtnMain" class="btn btn-success">
            <i class="fas fa-user-check me-1"></i>All Present
          </button>
          <button id="markAllAbsentBtnMain" class="btn btn-warning">
            <i class="fas fa-user-times me-1"></i>All Absent
          </button>
          <button id="clearAttendanceBtnMain" class="btn btn-outline-danger">
            <i class="fas fa-undo me-1"></i>Reset
          </button>
        </div>
      </div>

      <!-- Attendance List -->
      <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
        <table class="table table-striped table-hover">
          <thead class="table-dark sticky-top">
            <tr>
              <th>Player</th>
              <th>Shirt #</th>
              <th>Status</th>
              <th class="text-center">Action</th>
            </tr>
          </thead>
          <tbody id="attendanceList">
            <!-- Attendance rows will be populated here -->
          </tbody>
        </table>
      </div>

      <!-- No Players Message -->
      <div id="noPlayersMessage" class="text-center text-muted py-4" style="display: none;">
        <i class="fas fa-users fa-3x mb-3"></i>
        <h5>No Players in Roster</h5>
        <p>Add players to your roster first to track attendance.</p>
        <button class="btn btn-primary" data-toggle="modal" data-target="#rosterModal" data-dismiss="modal">
          <i class="fas fa-users me-2"></i>Manage Roster
        </button>
      </div>
    `;

    // Create modal using factory
    createAndAppendModal(
      'attendanceModal',
      '<i class="fas fa-user-check me-2"></i>Match Attendance',
      bodyContent,
      MODAL_CONFIGS.LARGE
    );

    // Initialize custom modal
    this.modal = CustomModal.getOrCreateInstance('attendanceModal');
  }

  /**
   * Show attendance modal
   */
  show() {
    if (this.modal) {
      this.modal.show();
      // Update attendance list when modal is shown
      setTimeout(() => {
        if (attendanceManager && attendanceManager.updateAttendanceList) {
          attendanceManager.updateAttendanceList();
        }
      }, 200);
    }
  }

  /**
   * Hide attendance modal
   */
  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    // Use event delegation for dynamically created buttons
    document.addEventListener('click', (e) => {
      // Handle attendance control buttons
      if (e.target.id === 'markAllAttendingBtnMain') {
        e.preventDefault();
        if (attendanceManager && attendanceManager.markAllAttending) {
          attendanceManager.markAllAttending();
        }
      } else if (e.target.id === 'markAllAbsentBtnMain') {
        e.preventDefault();
        if (attendanceManager && attendanceManager.markAllAbsent) {
          attendanceManager.markAllAbsent();
        }
      } else if (e.target.id === 'clearAttendanceBtnMain') {
        e.preventDefault();
        if (attendanceManager && attendanceManager.clearAttendance) {
          attendanceManager.clearAttendance();
        }
      }
      
      // Handle individual attendance toggle buttons
      if (e.target.closest('.toggle-attendance-btn')) {
        e.preventDefault();
        const button = e.target.closest('.toggle-attendance-btn');
        const playerName = button.dataset.playerName;
        if (playerName && attendanceManager && attendanceManager.togglePlayerAttendance) {
          attendanceManager.togglePlayerAttendance(playerName);
        }
      }
    });
  }
}

// Create and export instance
const attendanceModal = new AttendanceModal();
export default attendanceModal;
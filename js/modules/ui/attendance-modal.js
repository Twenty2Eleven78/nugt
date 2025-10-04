/**
 * Attendance Modal
 * Handles match attendance modal UI
 */

import { CustomModal } from '../shared/custom-modal.js';
import { createAndAppendModal, MODAL_CONFIGS } from '../shared/modal-factory.js';
import { attendanceManager } from '../services/attendance.js';
import { rosterManager } from '../match/roster.js';
import { storage } from '../data/storage.js';
import { STORAGE_KEYS } from '../shared/constants.js';

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
      <!-- Attendance Header -->
      <div class="attendance-header mb-3">
        <div class="attendance-info">
          <h6 class="mb-1"><i class="fas fa-users me-2"></i>Match Attendance</h6>
          <small class="text-muted">
            <i class="fas fa-info-circle me-1"></i>
            Attending: <span id="attendingCount">0</span> | 
            Starting XI: <span id="startingCount">0</span> | 
            Substitutes: <span id="subsCount">0</span> | 
            Absent: <span id="absentCount">0</span>
          </small>
        </div>
        <div class="attendance-controls">
          <button type="button" class="btn btn-sm btn-outline-success" id="markAllAttendingBtn">
            <i class="fas fa-check-double me-1"></i>All Attending
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" id="markAllAbsentBtn">
            <i class="fas fa-times me-1"></i>All Absent
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" id="clearAttendanceBtn">
            <i class="fas fa-undo me-1"></i>Reset
          </button>
        </div>
      </div>

      <!-- Players Grid -->
      <div id="attendancePlayersGrid" class="row g-2" style="max-height: 500px; overflow-y: auto;">
        <!-- Players will be populated here -->
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
      // Update attendance grid when modal is shown
      setTimeout(() => {
        this.populateAttendanceGrid();
        this.updateCounts();
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
   * Populate attendance grid with current roster and attendance data
   */
  populateAttendanceGrid() {
    const playersGrid = document.getElementById('attendancePlayersGrid');
    const noPlayersMessage = document.getElementById('noPlayersMessage');
    
    if (!playersGrid) return;

    // Get roster from roster manager
    const roster = rosterManager ? rosterManager.getRoster() : [];
    
    if (roster.length === 0) {
      playersGrid.style.display = 'none';
      noPlayersMessage.style.display = 'block';
      return;
    }

    playersGrid.style.display = 'block';
    noPlayersMessage.style.display = 'none';

    // Get current attendance data from storage (same format as new match modal)
    const savedAttendance = storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, []);
    
    playersGrid.innerHTML = roster.map((player, index) => {
      const playerId = index;
      const attendanceRecord = savedAttendance.find(a => a.playerName === player.name);
      const isAttending = attendanceRecord ? attendanceRecord.attending : false;
      const lineupRole = attendanceRecord ? attendanceRecord.lineupRole : null;
      const isStarting = lineupRole === 'starter';
      
      // Determine status
      let status = 'absent';
      let statusText = 'Absent';
      if (isAttending && isStarting) {
        status = 'starting';
        statusText = 'Starting XI';
      } else if (isAttending) {
        status = 'attending';
        statusText = 'Substitute';
      }
      
      return `
        <div class="col-12">
          <div class="d-flex align-items-center gap-2 mb-2">
            <div class="player-card flex-grow-1 ${status !== 'absent' ? 'selected' : ''}" 
                 data-player-id="${playerId}" 
                 data-player-name="${player.name}" 
                 style="min-height: 45px; padding: 0.5rem; cursor: pointer; border: 2px solid ${status !== 'absent' ? 'var(--theme-primary)' : '#dee2e6'}; border-radius: 8px; background: ${status !== 'absent' ? 'rgba(var(--theme-primary-rgb), 0.1)' : '#fff'}; transition: all 0.2s ease;">
              <div class="d-flex align-items-center">
                <span class="badge bg-primary me-2" style="font-size: 0.7rem;">#${player.shirtNumber || '?'}</span>
                <div class="flex-grow-1">
                  <div class="fw-medium" style="font-size: 0.9rem;">${player.name}</div>
                  <small class="text-muted" style="font-size: 0.75rem;">${statusText}</small>
                </div>
                <div class="selection-indicator" style="display: ${status !== 'absent' ? 'block' : 'none'};">
                  <i class="fas fa-check text-success"></i>
                </div>
              </div>
            </div>
            <button type="button" 
                    class="btn btn-sm ${status === 'starting' ? 'btn-success' : 'btn-outline-success'} starter-btn" 
                    data-player-id="${playerId}" 
                    data-player-name="${player.name}"
                    style="min-width: 60px;" 
                    ${status === 'absent' ? 'disabled' : ''}>
              <i class="fas fa-play"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update attendance counts display
   */
  updateCounts() {
    const savedAttendance = storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, []);
    const roster = rosterManager ? rosterManager.getRoster() : [];
    
    let attending = 0;
    let starting = 0;
    let substitutes = 0;
    let absent = 0;
    
    roster.forEach(player => {
      const attendanceRecord = savedAttendance.find(a => a.playerName === player.name);
      const isAttending = attendanceRecord ? attendanceRecord.attending : false;
      const lineupRole = attendanceRecord ? attendanceRecord.lineupRole : null;
      
      if (isAttending) {
        attending++;
        if (lineupRole === 'starter') {
          starting++;
        } else {
          substitutes++;
        }
      } else {
        absent++;
      }
    });
    
    // Update count displays
    const attendingEl = document.getElementById('attendingCount');
    const startingEl = document.getElementById('startingCount');
    const subsEl = document.getElementById('subsCount');
    const absentEl = document.getElementById('absentCount');
    
    if (attendingEl) attendingEl.textContent = attending;
    if (startingEl) startingEl.textContent = starting;
    if (subsEl) subsEl.textContent = substitutes;
    if (absentEl) absentEl.textContent = absent;
  }

  /**
   * Toggle player attendance status
   */
  togglePlayerAttendance(playerName) {
    const savedAttendance = storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, []);
    const roster = rosterManager.getRoster();
    
    // Find or create attendance record for this player
    let playerRecord = savedAttendance.find(a => a.playerName === playerName);
    
    if (!playerRecord) {
      // Create new record
      playerRecord = {
        playerName: playerName,
        attending: false,
        lineupRole: null
      };
      savedAttendance.push(playerRecord);
    }
    
    // Toggle attendance
    playerRecord.attending = !playerRecord.attending;
    
    // If setting to absent, clear lineup role
    if (!playerRecord.attending) {
      playerRecord.lineupRole = null;
    }
    
    // Save updated attendance
    storage.saveImmediate(STORAGE_KEYS.MATCH_ATTENDANCE, savedAttendance);
    
    // Refresh the grid and counts
    this.populateAttendanceGrid();
    this.updateCounts();
  }

  /**
   * Toggle player starting status
   */
  togglePlayerStarting(playerName) {
    const savedAttendance = storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, []);
    const playerRecord = savedAttendance.find(a => a.playerName === playerName);
    
    if (!playerRecord || !playerRecord.attending) return;
    
    // Count current starters
    const currentStarters = savedAttendance.filter(a => a.lineupRole === 'starter').length;
    
    if (playerRecord.lineupRole !== 'starter' && currentStarters >= 11) {
      // Show notification that max starters reached
      if (window.notificationManager) {
        window.notificationManager.warning('Maximum 11 starters allowed');
      }
      return;
    }
    
    // Toggle starting status
    if (playerRecord.lineupRole === 'starter') {
      playerRecord.lineupRole = 'substitute';
    } else {
      playerRecord.lineupRole = 'starter';
    }
    
    // Save updated attendance
    storage.saveImmediate(STORAGE_KEYS.MATCH_ATTENDANCE, savedAttendance);
    
    // Refresh the grid and counts
    this.populateAttendanceGrid();
    this.updateCounts();
  }

  /**
   * Mark all players as attending
   */
  markAllAttending() {
    const roster = rosterManager.getRoster();
    const attendanceData = roster.map(player => ({
      playerName: player.name,
      attending: true,
      lineupRole: 'substitute' // Default to substitute when marking all attending
    }));
    
    storage.saveImmediate(STORAGE_KEYS.MATCH_ATTENDANCE, attendanceData);
    this.populateAttendanceGrid();
    this.updateCounts();
  }

  /**
   * Mark all players as absent
   */
  markAllAbsent() {
    const roster = rosterManager.getRoster();
    const attendanceData = roster.map(player => ({
      playerName: player.name,
      attending: false,
      lineupRole: null
    }));
    
    storage.saveImmediate(STORAGE_KEYS.MATCH_ATTENDANCE, attendanceData);
    this.populateAttendanceGrid();
    this.updateCounts();
  }

  /**
   * Clear attendance (reset all)
   */
  clearAttendance() {
    storage.remove(STORAGE_KEYS.MATCH_ATTENDANCE);
    this.populateAttendanceGrid();
    this.updateCounts();
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    // Use event delegation for dynamically created buttons
    document.addEventListener('click', (e) => {
      // Handle attendance control buttons
      if (e.target.id === 'markAllAttendingBtn') {
        e.preventDefault();
        this.markAllAttending();
      } else if (e.target.id === 'markAllAbsentBtn') {
        e.preventDefault();
        this.markAllAbsent();
      } else if (e.target.id === 'clearAttendanceBtn') {
        e.preventDefault();
        this.clearAttendance();
      }
      
      // Handle starter button clicks
      if (e.target.closest('.starter-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const button = e.target.closest('.starter-btn');
        const playerName = button.dataset.playerName;
        if (playerName) {
          this.togglePlayerStarting(playerName);
        }
        return;
      }
      
      // Handle player card clicks (toggle attendance)
      if (e.target.closest('.player-card')) {
        e.preventDefault();
        const card = e.target.closest('.player-card');
        const playerName = card.dataset.playerName;
        if (playerName) {
          this.togglePlayerAttendance(playerName);
        }
      }
    });
  }
}

// Create and export instance
const attendanceModal = new AttendanceModal();
export default attendanceModal;
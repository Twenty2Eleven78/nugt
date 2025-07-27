/**
 * Match Attendance Manager
 * @version 1.0
 * 
 * Dedicated service for managing player attendance in a separate modal
 */

import { rosterManager } from '../match/roster.js';
import { notificationManager } from './notifications.js';
import { storage } from '../data/storage.js';
import { STORAGE_KEYS } from '../shared/constants.js';

// Attendance management class
class AttendanceManager {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize attendance manager
  init() {
    if (this.isInitialized) return;
    
    this._bindEvents();
    this.isInitialized = true;
  }

  // Get current match attendance
  getMatchAttendance() {
    const savedAttendance = storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, []);
    const roster = rosterManager.getRoster();
    
    // Create attendance records for all current roster players
    const attendanceMap = new Map();
    savedAttendance.forEach(record => {
      attendanceMap.set(record.playerName.toLowerCase(), record.attending);
    });

    return roster.map(player => ({
      playerName: player.name,
      shirtNumber: player.shirtNumber,
      attending: attendanceMap.get(player.name.toLowerCase()) ?? true // Default to attending
    }));
  }

  // Helper method to save attendance and update UI
  _saveAndUpdateUI(attendanceData, successMessage) {
    this._saveAttendance(attendanceData);
    
    // Use setTimeout to ensure storage is complete before UI update
    setTimeout(() => {
      this.updateAttendanceList();
      notificationManager.success(successMessage);
    }, 100);
  }

  // Helper method to find player by name (case-insensitive)
  _findPlayerByName(attendance, playerName) {
    const lowerName = playerName.toLowerCase();
    return attendance.find(p => p.playerName.toLowerCase() === lowerName);
  }

  // Set player attendance
  setPlayerAttendance(playerName, attending) {
    const currentAttendance = this.getMatchAttendance();
    const updatedAttendance = currentAttendance.map(record => 
      record.playerName.toLowerCase() === playerName.toLowerCase() 
        ? { ...record, attending }
        : record
    );
    
    const status = attending ? 'present' : 'absent';
    this._saveAndUpdateUI(updatedAttendance, `${playerName} marked as ${status}`);
  }

  // Toggle player attendance
  togglePlayerAttendance(playerName) {
    const attendance = this.getMatchAttendance();
    const playerRecord = this._findPlayerByName(attendance, playerName);
    
    if (playerRecord) {
      this.setPlayerAttendance(playerName, !playerRecord.attending);
    }
  }

  // Mark all players as attending
  markAllAttending() {
    const attendance = this.getMatchAttendance().map(record => ({
      ...record,
      attending: true
    }));
    
    this._saveAndUpdateUI(attendance, 'All players marked as present');
  }

  // Mark all players as absent
  markAllAbsent() {
    const attendance = this.getMatchAttendance().map(record => ({
      ...record,
      attending: false
    }));
    
    this._saveAndUpdateUI(attendance, 'All players marked as absent');
  }

  // Clear attendance (reset all to attending)
  clearAttendance() {
    storage.remove(STORAGE_KEYS.MATCH_ATTENDANCE);
    
    // Use setTimeout to ensure storage is complete before UI update
    setTimeout(() => {
      this.updateAttendanceList();
      notificationManager.success('Attendance reset - all players marked as present');
    }, 100);
  }

  // Update attendance list in modal
  updateAttendanceList() {
    const attendanceList = document.getElementById('attendanceList');
    const noPlayersMessage = document.getElementById('noPlayersMessage');
    
    if (!attendanceList || !noPlayersMessage) return;

    const attendance = this.getMatchAttendance();
    
    if (attendance.length === 0) {
      attendanceList.innerHTML = '';
      noPlayersMessage.style.display = 'block';
      return;
    }

    noPlayersMessage.style.display = 'none';
    
    attendanceList.innerHTML = attendance
      .map(player => {
        const isAttending = player.attending;
        const statusClass = isAttending ? 'text-success' : 'text-danger';
        const statusIcon = isAttending ? 'fa-check-circle' : 'fa-times-circle';
        const statusText = isAttending ? 'Present' : 'Absent';
        const buttonClass = isAttending ? 'btn-outline-warning' : 'btn-outline-success';
        const buttonIcon = isAttending ? 'fa-user-times' : 'fa-user-check';
        const buttonTitle = isAttending ? 'Mark as absent' : 'Mark as present';
        
        return `
          <tr class="${isAttending ? '' : 'table-secondary'}">
            <td>
              <strong>${player.playerName}</strong>
            </td>
            <td>${player.shirtNumber !== null ? `#${player.shirtNumber}` : '-'}</td>
            <td>
              <span class="${statusClass}">
                <i class="fas ${statusIcon} me-1"></i>${statusText}
              </span>
            </td>
            <td class="text-center">
              <button class="btn btn-sm ${buttonClass} toggle-attendance-btn" 
                      data-player-name="${player.playerName}" 
                      title="${buttonTitle}">
                <i class="fas ${buttonIcon}"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
    
    // Update attendance summary
    this.updateAttendanceSummary();
  }

  // Update attendance summary display
  updateAttendanceSummary() {
    const summaryElement = document.getElementById('attendanceSummaryMain');
    if (!summaryElement) return;

    const summary = this.getAttendanceSummary();
    summaryElement.innerHTML = `
      <i class="fas fa-users me-1"></i>
      <strong>${summary.attending}/${summary.total}</strong> players attending 
      <span class="text-success">(${summary.attendanceRate}%)</span>
      ${summary.absent > 0 ? `<span class="text-danger ms-2">${summary.absent} absent</span>` : ''}
    `;
  }

  // Get attendance summary for match reports
  getAttendanceSummary() {
    const attendance = this.getMatchAttendance();
    const attending = attendance.filter(p => p.attending);
    const absent = attendance.filter(p => !p.attending);
    
    return {
      total: attendance.length,
      attending: attending.length,
      absent: absent.length,
      attendingPlayers: attending.map(p => p.playerName),
      absentPlayers: absent.map(p => p.playerName),
      attendanceRate: attendance.length > 0 ? Math.round((attending.length / attendance.length) * 100) : 0
    };
  }

  // Save attendance to storage
  _saveAttendance(attendanceData) {
    try {
      // Only save the essential data
      const attendanceToSave = attendanceData.map(record => ({
        playerName: record.playerName,
        attending: record.attending
      }));
      
      storage.save(STORAGE_KEYS.MATCH_ATTENDANCE, attendanceToSave);
    } catch (error) {
      console.error('Error saving attendance:', error);
      notificationManager.error('Error saving attendance. Please try again.');
    }
  }

  // Bind event listeners
  _bindEvents() {
    // Bind attendance modal events when it's shown
    const attendanceModal = document.getElementById('attendanceModal');
    if (attendanceModal) {
      attendanceModal.addEventListener('show.bs.modal', () => {
        this.updateAttendanceList();
      });
    }

    // Bind bulk attendance action buttons
    this._bindBulkAttendanceEvents();
    
    // Bind individual attendance toggle events
    this._bindAttendanceToggleEvents();
  }

  // Helper method to create button event handler with debouncing
  _createButtonHandler(button, action) {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (button.disabled) return;
      button.disabled = true;
      
      action();
      
      setTimeout(() => {
        button.disabled = false;
      }, 500);
    };
  }

  // Bind bulk attendance events
  _bindBulkAttendanceEvents() {
    const buttons = [
      { id: 'markAllAttendingBtnMain', action: () => this.markAllAttending() },
      { id: 'markAllAbsentBtnMain', action: () => this.markAllAbsent() },
      { id: 'clearAttendanceBtnMain', action: () => this.clearAttendance() }
    ];

    buttons.forEach(({ id, action }) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener('click', this._createButtonHandler(button, action));
      }
    });
  }

  // Bind attendance toggle events using event delegation
  _bindAttendanceToggleEvents() {
    const attendanceList = document.getElementById('attendanceList');
    if (!attendanceList) return;

    attendanceList.addEventListener('click', (e) => {
      const button = e.target.closest('.toggle-attendance-btn');
      if (!button) return;

      // Prevent event bubbling and default behavior
      e.preventDefault();
      e.stopPropagation();

      // Prevent double-clicking
      if (button.disabled) return;
      button.disabled = true;

      const playerName = button.dataset.playerName;
      this.togglePlayerAttendance(playerName);

      // Re-enable button after processing is complete
      setTimeout(() => {
        button.disabled = false;
      }, 500);
    });
  }
}

// Create and export singleton instance
export const attendanceManager = new AttendanceManager();

// Export convenience methods
export const {
  getMatchAttendance,
  setPlayerAttendance,
  togglePlayerAttendance,
  markAllAttending,
  markAllAbsent,
  clearAttendance,
  getAttendanceSummary,
  updateAttendanceList
} = attendanceManager;
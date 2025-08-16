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
    this.cachedElements = {}; // Cache for frequently accessed DOM elements
  }

  _getCachedElement(id) {
    if (!this.cachedElements[id]) {
      this.cachedElements[id] = document.getElementById(id);
    }
    return this.cachedElements[id];
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
      // Safety check for valid record structure
      if (record && record.playerName && typeof record.playerName === 'string') {
        attendanceMap.set(record.playerName.toLowerCase(), record.attending);
      }
    });

    return roster.map(player => ({
      playerName: player.name,
      shirtNumber: player.shirtNumber,
      attending: attendanceMap.get(player.name.toLowerCase()) ?? true // Default to attending
    }));
  }

  // Helper method to save attendance and update UI
  _saveAndUpdateUI(attendanceData, successMessage, silent = false) {
    this._saveAttendance(attendanceData);
    
    // Use setTimeout to ensure storage is complete before UI update
    setTimeout(() => {
      this.updateAttendanceList();
      if (!silent) {
        notificationManager.success(successMessage);
      }
    }, 100);
  }

  // Helper method to find player by name (case-insensitive)
  _findPlayerByName(attendance, playerName) {
    if (!playerName || typeof playerName !== 'string') return null;
    const lowerName = playerName.toLowerCase();
    return attendance.find(p => p && p.playerName && typeof p.playerName === 'string' && p.playerName.toLowerCase() === lowerName);
  }

  // Set player attendance
  setPlayerAttendance(playerName, attending, silent = false) {
    if (!playerName || typeof playerName !== 'string') {
      console.warn('Invalid player name provided to setPlayerAttendance:', playerName);
      return;
    }
    
    const currentAttendance = this.getMatchAttendance();
    const updatedAttendance = currentAttendance.map(record => 
      record && record.playerName && typeof record.playerName === 'string' && 
      record.playerName.toLowerCase() === playerName.toLowerCase() 
        ? { ...record, attending }
        : record
    );
    
    const status = attending ? 'present' : 'absent';
    this._saveAndUpdateUI(updatedAttendance, `${playerName} marked as ${status}`, silent);
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
  markAllAttending(silent = false) {
    const attendance = this.getMatchAttendance().map(record => ({
      ...record,
      attending: true
    }));
    
    this._saveAndUpdateUI(attendance, 'All players marked as present', silent);
  }

  // Mark all players as absent
  markAllAbsent(silent = false) {
    const attendance = this.getMatchAttendance().map(record => ({
      ...record,
      attending: false
    }));
    
    this._saveAndUpdateUI(attendance, 'All players marked as absent', silent);
  }

  // Clear attendance (reset all to attending)
  clearAttendance(silent = false) {
    storage.remove(STORAGE_KEYS.MATCH_ATTENDANCE);
    
    // Use setTimeout to ensure storage is complete before UI update
    setTimeout(() => {
      this.updateAttendanceList();
      if (!silent) {
        notificationManager.success('Attendance reset - all players marked as present');
      }
    }, 100);
  }

  // Update attendance list in modal
  updateAttendanceList() {
    const attendanceList = this._getCachedElement('attendanceList');
    const noPlayersMessage = this._getCachedElement('noPlayersMessage');
    
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
    const summaryElement = this._getCachedElement('attendanceSummaryMain');
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
    // Event handling is now done by the attendance modal directly
    // No need to bind events here since the modal handles button clicks
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
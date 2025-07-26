/**
 * Roster Management Module
 * @version 3.3
 */

import { storage } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { notificationManager } from '../services/notifications.js';
import { showModal, hideModal } from '../ui/modals.js';
import { rosterUtils } from '../data/default-roster.js';
import { STORAGE_KEYS } from '../shared/constants.js';

// Configuration constants
const ROSTER_CONFIG = {
  MAX_PLAYER_NAME_LENGTH: 50,
  STORAGE_KEY: 'goalTracker_roster'
};

// Roster management class
class RosterManager {
  constructor() {
    this.roster = [];
    this.isInitialized = false;
  }

  // Initialize roster
  init() {
    if (this.isInitialized) return;

    this.roster = this._loadRoster();
    this.updateSelects();
    this.updateRosterList();
    this._bindEvents();
    this.isInitialized = true;
  }

  // Load roster from storage
  _loadRoster() {
    try {
      const savedRosterJSON = storage.load(ROSTER_CONFIG.STORAGE_KEY);

      if (!savedRosterJSON) {
        return this._getDefaultRoster();
      }

      if (!Array.isArray(savedRosterJSON)) {
        console.warn('Invalid roster format in localStorage (not an array). Using default roster.');
        return this._getDefaultRoster();
      }

      if (savedRosterJSON.length === 0) {
        return this._getDefaultRoster();
      }

      // Handle migration from old string-based format
      if (typeof savedRosterJSON[0] === 'string') {
        console.log('Migrating old string-based roster to new object format.');
        const migratedRoster = savedRosterJSON.map(playerName => ({
          name: playerName,
          shirtNumber: null
        }));
        return this._sortRoster(migratedRoster);
      }

      // Handle object-based format
      if (typeof savedRosterJSON[0] === 'object' && savedRosterJSON[0]?.name) {
        const processedRoster = savedRosterJSON
          .map(player => ({
            name: player.name,
            shirtNumber: player.shirtNumber !== undefined ? player.shirtNumber : null
          }))
          .filter(player => typeof player.name === 'string' && player.name.trim() !== '');

        // Ensure uniqueness by name (case-insensitive)
        const uniqueRoster = this._removeDuplicates(processedRoster);
        return this._sortRoster(uniqueRoster);
      }

      console.warn('Unrecognized roster format in localStorage. Using default roster.');
      return this._getDefaultRoster();

    } catch (error) {
      console.error('Error loading or parsing roster:', error);
      notificationManager.warning('Error loading roster. Default roster will be used.');
      return this._getDefaultRoster();
    }
  }

  // Get default roster
  _getDefaultRoster() {
    return rosterUtils.getDefaultRoster();
  }

  // Sort roster alphabetically
  _sortRoster(roster) {
    return roster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  // Remove duplicate players (case-insensitive)
  _removeDuplicates(roster) {
    const uniqueRoster = [];
    const namesSeen = new Set();

    for (const player of roster) {
      const lowerName = player.name.toLowerCase();
      if (!namesSeen.has(lowerName)) {
        uniqueRoster.push(player);
        namesSeen.add(lowerName);
      }
    }

    return uniqueRoster;
  }

  // Save roster to storage
  _saveRoster() {
    try {
      storage.save(ROSTER_CONFIG.STORAGE_KEY, this.roster);
    } catch (error) {
      console.error('Error saving roster:', error);
      notificationManager.error('Error saving roster. Please try again.');
    }
  }

  // Get current roster (deep copy)
  getRoster() {
    return this.roster.map(player => ({ ...player }));
  }

  // Get player by name
  getPlayerByName(name) {
    if (!name) return null;
    const lowerCaseName = name.toLowerCase();
    return this.roster.find(player => player.name.toLowerCase() === lowerCaseName) || null;
  }

  // Update select dropdowns
  updateSelects() {
    const goalScorerSelect = domCache.get('goalScorer');
    const goalAssistSelect = domCache.get('goalAssist');

    if (!goalScorerSelect || !goalAssistSelect) {
      return;
    }

    const currentGoalScorer = goalScorerSelect.value;
    const currentGoalAssist = goalAssistSelect.value;
    const currentRosterObjects = this.getRoster();

    // Static options that should always be present
    const staticScorerOptions = ['', 'Own Goal'];
    const staticAssistOptions = ['', 'N/A'];

    this._updateSingleSelect(goalScorerSelect, currentGoalScorer, staticScorerOptions, currentRosterObjects);
    this._updateSingleSelect(goalAssistSelect, currentGoalAssist, staticAssistOptions, currentRosterObjects);
  }

  // Update a single select element
  _updateSingleSelect(selectElement, currentSelectedValue, staticOptions, rosterObjects) {
    const initialPlayerOptions = Array.from(selectElement.options)
      .filter(opt => !staticOptions.includes(opt.value));
    const initialPlayerNames = initialPlayerOptions.map(opt => opt.value);
    const currentRosterNames = rosterObjects.map(p => p.name);

    // Remove players no longer in roster
    initialPlayerOptions.forEach(optionElement => {
      if (!currentRosterNames.includes(optionElement.value)) {
        selectElement.removeChild(optionElement);
      }
    });

    // Add new players to select
    rosterObjects.forEach(playerObj => {
      if (!initialPlayerNames.includes(playerObj.name)) {
        const newOption = document.createElement('option');
        newOption.value = playerObj.name;
        newOption.textContent = playerObj.name;
        selectElement.appendChild(newOption);
      }
    });

    // Restore selection or set to default
    if (currentRosterNames.includes(currentSelectedValue) || staticOptions.includes(currentSelectedValue)) {
      selectElement.value = currentSelectedValue;
    } else {
      selectElement.value = staticOptions[0];
    }
  }

  // Update roster list in modal
  updateRosterList() {
    const rosterList = document.getElementById('rosterList');
    if (!rosterList) return;

    rosterList.innerHTML = this.roster
      .map(player => `
        <tr>
          <td>${player.name}</td>
          <td>${player.shirtNumber !== null ? player.shirtNumber : '-'}</td>
          <td class="text-end roster-actions-cell">
            <button class="btn btn-sm btn-outline-primary me-1 edit-player" data-player-name="${player.name}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger remove-player" data-player-name="${player.name}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `)
      .join('');
  }

  // Add a new player
  addPlayer(name, shirtNumber) {
    if (!name) return false;

    const trimmedName = name.trim();
    const num = shirtNumber !== null && shirtNumber !== '' ? parseInt(shirtNumber, 10) : null;

    // Validation
    if (!this._validatePlayerData(trimmedName, num)) {
      return false;
    }

    // Check for duplicates
    if (this._playerExists(trimmedName)) {
      notificationManager.warning(`Player "${trimmedName}" already exists!`);
      return false;
    }

    // Add player
    this.roster.push({ name: trimmedName, shirtNumber: num });
    this.roster = this._sortRoster(this.roster);
    this._saveRoster();
    this.updateSelects();
    this.updateRosterList();

    const shirtText = num !== null ? ` (#${num})` : '';
    notificationManager.success(`Player ${trimmedName}${shirtText} added successfully.`);
    return true;
  }

  // Remove a player
  removePlayer(playerName) {
    const index = this.roster.findIndex(p => p.name === playerName);
    if (index === -1) return false;

    // Check if player is currently selected in dropdowns
    this._handlePlayerRemovalFromSelects(playerName);

    this.roster.splice(index, 1);
    this._saveRoster();
    this.updateSelects();
    this.updateRosterList();

    notificationManager.success(`Player ${playerName} removed successfully.`);
    return true;
  }

  // Edit a player
  editPlayer(oldName, newName, newShirtNumber) {
    if (!oldName || !newName) {
      notificationManager.warning('Player names cannot be empty.');
      return false;
    }

    const trimmedNewName = newName.trim();
    const num = newShirtNumber !== null && newShirtNumber !== '' ? parseInt(newShirtNumber, 10) : null;

    // Validation
    if (!this._validatePlayerData(trimmedNewName, num)) {
      return false;
    }

    const oldPlayerIndex = this.roster.findIndex(p => p.name === oldName);
    if (oldPlayerIndex === -1) {
      notificationManager.warning(`Player "${oldName}" not found.`);
      return false;
    }

    // Check for name conflicts (excluding current player)
    if (this._playerExists(trimmedNewName, oldPlayerIndex)) {
      notificationManager.warning(`Player name "${trimmedNewName}" already exists!`);
      return false;
    }

    // Update player
    this.roster[oldPlayerIndex].name = trimmedNewName;
    this.roster[oldPlayerIndex].shirtNumber = num;
    this.roster = this._sortRoster(this.roster);
    this._saveRoster();
    this.updateSelects();
    this.updateRosterList();

    // Update dropdowns if player was selected
    this._updateSelectsAfterEdit(oldName, trimmedNewName);

    const shirtText = num !== null ? ` (#${num})` : '';
    notificationManager.success(`Player updated to "${trimmedNewName}${shirtText}" successfully.`);
    return true;
  }

  // Add multiple players from bulk input
  addPlayersBulk(namesString) {
    if (!namesString?.trim()) {
      notificationManager.warning('No player names provided for bulk add.');
      return;
    }

    const namesArray = namesString
      .split(/[,\n]+/)
      .map(name => name.trim())
      .filter(name => name !== '');

    if (namesArray.length === 0) {
      notificationManager.warning('No valid player names found.');
      return;
    }

    const results = this._processBulkAdd(namesArray);

    if (results.added.length > 0) {
      this.roster.push(...results.added);
      this.roster = this._sortRoster(this.roster);
      this._saveRoster();
      this.updateSelects();
      this.updateRosterList();

      const successMsg = `Successfully added ${results.added.length} player(s): ${results.added.map(p => p.name).join(', ')}. Shirt numbers can be added via Edit.`;
      notificationManager.success(successMsg);
    }

    if (results.failed.length > 0) {
      const failedMsg = `Could not add ${results.failed.length} player(s): ${results.failed.map(f => `"${f.name}" (${f.reason})`).join(', ')}`;
      notificationManager.warning(failedMsg, 10000);
    }

    if (results.added.length === 0 && results.failed.length === 0) {
      notificationManager.info('No new players were added from the list.');
    }
  }

  // Process bulk add operation
  _processBulkAdd(namesArray) {
    const added = [];
    const failed = [];

    namesArray.forEach(name => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      if (trimmedName.length > ROSTER_CONFIG.MAX_PLAYER_NAME_LENGTH) {
        failed.push({ name: trimmedName, reason: `Name too long (max ${ROSTER_CONFIG.MAX_PLAYER_NAME_LENGTH} chars)` });
      } else if (this._playerExists(trimmedName)) {
        failed.push({ name: trimmedName, reason: 'Player already exists' });
      } else if (added.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        failed.push({ name: trimmedName, reason: 'Duplicate in current bulk list' });
      } else {
        added.push({ name: trimmedName, shirtNumber: null });
      }
    });

    return { added, failed };
  }

  // Clear entire roster
  clearRoster() {
    if (!confirm('Are you sure you want to clear the entire roster? This action cannot be undone.')) {
      return;
    }

    this.roster = [];
    this._saveRoster();
    this.updateSelects();
    this.updateRosterList();
    notificationManager.success('Roster cleared successfully.');
  }

  // Validation helper
  _validatePlayerData(name, shirtNumber) {
    if (!name) {
      notificationManager.warning('Player name cannot be empty.');
      return false;
    }

    if (name.length > ROSTER_CONFIG.MAX_PLAYER_NAME_LENGTH) {
      notificationManager.warning(`Player name is too long. Maximum ${ROSTER_CONFIG.MAX_PLAYER_NAME_LENGTH} characters allowed.`);
      return false;
    }

    if (shirtNumber !== null && (isNaN(shirtNumber) || shirtNumber < 0 || shirtNumber > 99)) {
      notificationManager.warning('Invalid shirt number. Must be between 0 and 99.');
      return false;
    }

    return true;
  }

  // Check if player exists
  _playerExists(name, excludeIndex = -1) {
    const lowerName = name.toLowerCase();
    return this.roster.some((player, index) =>
      index !== excludeIndex && player.name.toLowerCase() === lowerName
    );
  }

  // Handle player removal from select dropdowns
  _handlePlayerRemovalFromSelects(playerName) {
    const goalScorerSelect = domCache.get('goalScorer');
    const goalAssistSelect = domCache.get('goalAssist');

    if (goalScorerSelect?.value === playerName) {
      goalScorerSelect.value = '';
      notificationManager.info(`Goal scorer selection was reset as ${playerName} was removed.`);
    }

    if (goalAssistSelect?.value === playerName) {
      goalAssistSelect.value = '';
      notificationManager.info(`Goal assist selection was reset as ${playerName} was removed.`);
    }
  }

  // Update selects after player edit
  _updateSelectsAfterEdit(oldName, newName) {
    const goalScorerSelect = domCache.get('goalScorer');
    const goalAssistSelect = domCache.get('goalAssist');

    if (goalScorerSelect?.value === oldName) {
      goalScorerSelect.value = newName;
    }

    if (goalAssistSelect?.value === oldName) {
      goalAssistSelect.value = newName;
    }
  }

  // Bind event listeners
  _bindEvents() {
    this._bindAddPlayerEvents();
    this._bindBulkAddEvents();
    this._bindRosterListEvents();
    this._bindEditPlayerEvents();
    this._bindClearRosterEvents();
  }

  // Bind add player events
  _bindAddPlayerEvents() {
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const newPlayerNameInput = document.getElementById('newPlayerName');
    const newPlayerShirtNumberInput = document.getElementById('newPlayerShirtNumber');

    if (addPlayerBtn && newPlayerNameInput && newPlayerShirtNumberInput) {
      addPlayerBtn.addEventListener('click', () => {
        const playerName = newPlayerNameInput.value.trim();
        const playerShirtNumber = newPlayerShirtNumberInput.value;

        if (this.addPlayer(playerName, playerShirtNumber)) {
          newPlayerNameInput.value = '';
          newPlayerShirtNumberInput.value = '';
        }
      });

      // Allow Enter key to add player
      [newPlayerNameInput, newPlayerShirtNumberInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            addPlayerBtn.click();
          }
        });
      });
    }
  }

  // Bind bulk add events
  _bindBulkAddEvents() {
    const addPlayersBulkBtn = document.getElementById('addPlayersBulkBtn');
    const bulkPlayerNamesTextarea = document.getElementById('bulkPlayerNames');

    if (addPlayersBulkBtn && bulkPlayerNamesTextarea) {
      addPlayersBulkBtn.addEventListener('click', () => {
        const namesString = bulkPlayerNamesTextarea.value;
        this.addPlayersBulk(namesString);
        bulkPlayerNamesTextarea.value = '';
      });
    }
  }

  // Bind roster list events
  _bindRosterListEvents() {
    const rosterList = document.getElementById('rosterList');
    if (!rosterList) return;

    rosterList.addEventListener('click', (e) => {
      // Prevent multiple rapid clicks
      e.preventDefault();
      e.stopPropagation();

      const targetButton = e.target.closest('button');
      if (!targetButton) return;

      // Prevent double-clicking by temporarily disabling the button
      if (targetButton.disabled) return;
      targetButton.disabled = true;

      const playerName = targetButton.dataset.playerName;

      if (targetButton.classList.contains('remove-player')) {
        if (confirm(`Are you sure you want to remove ${playerName}?`)) {
          this.removePlayer(playerName);
        } else {
          // Re-enable button if user cancels
          targetButton.disabled = false;
        }
      } else if (targetButton.classList.contains('edit-player')) {
        this._showEditPlayerModal(playerName);
        // Re-enable button after modal opens
        setTimeout(() => {
          targetButton.disabled = false;
        }, 100);
      }
    });
  }



  // Show edit player modal
  _showEditPlayerModal(playerName) {
    const playerToEdit = this.roster.find(p => p.name === playerName);
    if (!playerToEdit) return;

    const oldNameInput = document.getElementById('editPlayerOldName');
    const nameInput = document.getElementById('editPlayerName');
    const shirtNumberInput = document.getElementById('editPlayerShirtNumber');

    if (oldNameInput) oldNameInput.value = playerToEdit.name;
    if (nameInput) nameInput.value = playerToEdit.name;
    if (shirtNumberInput) {
      shirtNumberInput.value = playerToEdit.shirtNumber !== null ? playerToEdit.shirtNumber : '';
    }

    showModal('editPlayerModal');
  }

  // Bind edit player events
  _bindEditPlayerEvents() {
    const editPlayerForm = document.getElementById('editPlayerForm');
    if (!editPlayerForm) return;

    editPlayerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const oldName = document.getElementById('editPlayerOldName')?.value;
      const newName = document.getElementById('editPlayerName')?.value.trim();
      const newShirtNumber = document.getElementById('editPlayerShirtNumber')?.value;

      if (this.editPlayer(oldName, newName, newShirtNumber)) {
        hideModal('editPlayerModal');
      }
    });
  }

  // Bind clear roster events
  _bindClearRosterEvents() {
    const clearRosterBtn = document.getElementById('clearRosterBtn');
    if (clearRosterBtn) {
      clearRosterBtn.addEventListener('click', () => {
        this.clearRoster();
      });
    }
  }

  // Get roster statistics
  getStats() {
    return {
      totalPlayers: this.roster.length,
      playersWithShirtNumbers: this.roster.filter(p => p.shirtNumber !== null).length,
      playersWithoutShirtNumbers: this.roster.filter(p => p.shirtNumber === null).length,
      shirtNumbers: this.roster
        .filter(p => p.shirtNumber !== null)
        .map(p => p.shirtNumber)
        .sort((a, b) => a - b)
    };
  }
}

// Create and export singleton instance
export const rosterManager = new RosterManager();

// Export for backward compatibility
export default rosterManager;
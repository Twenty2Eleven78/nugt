// Roster Management Module
const RosterManager = (function() {
  const MAX_PLAYER_NAME_LENGTH = 50; // Define character limit
  
  // Private variables
  const STORAGE_KEY = 'goalTracker_roster';
  let roster = [];
  // let currentlyEditingPlayerName = null; // Removed for string-based roster

  // Save roster to local storage
  function saveRoster() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    } catch (error) {
      console.error('Error saving roster:', error);
      // Call showNotification to display a user-friendly message
      if (typeof showNotification === 'function') {
        showNotification('Error saving roster. Please try again.', 'danger');
      }
    }
  }
  // Load roster from local storage
  function loadRoster() {
    try {
      const savedRosterJSON = localStorage.getItem(STORAGE_KEY);
      if (savedRosterJSON === null) {
        return getDefaultRoster();
      }

      const parsedRoster = JSON.parse(savedRosterJSON);

      if (!Array.isArray(parsedRoster)) {
        console.warn('Invalid roster format in localStorage (not an array). Using default roster.');
        return getDefaultRoster();
      }

      if (parsedRoster.length === 0) { // If the stored roster is empty
        return getDefaultRoster(); // Load default roster
      }

      let processedRoster = [];
      if (typeof parsedRoster[0] === 'object' && parsedRoster[0] !== null && parsedRoster[0].hasOwnProperty('name')) {
        // Migrate from object array to string array
        processedRoster = parsedRoster
          .map(player => player.name)
          .filter(name => typeof name === 'string' && name.trim() !== '');
      } else if (typeof parsedRoster[0] === 'string') {
        // Already a string array
        processedRoster = parsedRoster.filter(name => typeof name === 'string' && name.trim() !== '');
      } else {
        // Unrecognized format
        console.warn('Unrecognized roster format in localStorage. Using default roster.');
        return getDefaultRoster();
      }

      // Ensure uniqueness and sort
      const uniqueRoster = [...new Set(processedRoster)];
      return uniqueRoster.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    } catch (error) {
      console.error('Error loading or parsing roster:', error);
      if (typeof showNotification === 'function') {
        showNotification('Error loading roster. Default roster will be used.', 'warning');
      }
      return getDefaultRoster();
    }
  }

  // Set a default roster if no roster is stored
  function getDefaultRoster() {
    // Returns a sorted array of unique player name strings
    return [
      'A-R.Obidi','A.Seaman','D.Peacock','E.Doyle','E.Van-Kerro','E.Mutiti',
      'F.Asadi','F.Kendall','H.Strowthers','M.Finch','M.Stevens','N.Janicka',
      'S.Smith','T.Rushmer','V.Aig-Imoru'
    ];
  }

  // Public interface
  return {
    // Initialize roster
    init() {
      roster = loadRoster(); // roster is now an array of strings
      this.updateSelects();
      this.updateRosterList();
      this.bindEvents();
    },

    // Get current roster
    getRoster() {
      return [...roster]; // Return a copy of the string array
    },

    // Update select dropdowns
    updateSelects() {
      const goalScorerSelect = document.getElementById('goalScorer');
      const goalAssistSelect = document.getElementById('goalAssist');

      if (!goalScorerSelect || !goalAssistSelect) {
        return;
      }

      const currentGoalScorer = goalScorerSelect.value;
      const currentGoalAssist = goalAssistSelect.value;
      const currentRoster = this.getRoster(); // Use getter for consistency

      // Define static options. These values should match the <option value="..."> in HTML.
      const staticScorerOptions = ['', 'Own Goal']; // "" is "Select goal scorer"
      const staticAssistOptions = ['', 'N/A'];    // "" is "Select goal assist"

      // Helper function to update a single select element
      const updateSingleSelect = (selectElement, currentSelectedValue, staticOptions) => {
        const initialPlayerOptionElements = Array.from(selectElement.options)
          .filter(opt => !staticOptions.includes(opt.value));
        const initialPlayerOptionValues = initialPlayerOptionElements.map(opt => opt.value);

        // Determine players to remove
        initialPlayerOptionElements.forEach(optionElement => {
          if (!currentRoster.includes(optionElement.value)) {
            selectElement.removeChild(optionElement);
          }
        });

        // Determine players to add
        currentRoster.forEach(player => {
          if (!initialPlayerOptionValues.includes(player)) {
            const newOption = document.createElement('option');
            newOption.value = player;
            newOption.textContent = player;
            selectElement.appendChild(newOption);
          }
        });

        // Restore selection or set to default
        if (currentRoster.includes(currentSelectedValue) || staticOptions.includes(currentSelectedValue)) {
          selectElement.value = currentSelectedValue;
        } else {
          selectElement.value = staticOptions[0]; // Default value (e.g., "Select goal scorer")
        }
      };

      updateSingleSelect(goalScorerSelect, currentGoalScorer, staticScorerOptions);
      updateSingleSelect(goalAssistSelect, currentGoalAssist, staticAssistOptions);
    },

    // Update roster list in modal
    updateRosterList() {
      const rosterList = document.getElementById('rosterList');
      if (rosterList) {
        rosterList.innerHTML = roster // roster is an array of strings
          .map(player => `
            <tr>
              <td>${player}</td>
              <td class="text-end roster-actions-cell">
                <button class="btn btn-sm btn-outline-primary me-2 edit-player" data-player="${player}">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger remove-player" data-player="${player}">
                  <i class="fas fa-trash"></i> Remove
                </button>
              </td>
            </tr>
          `)
          .join('');
      }
    },

    // Clear the entire roster
    clearRoster() {
      if (confirm('Are you sure you want to clear the entire roster? This action cannot be undone.')) {
        roster = [];
        saveRoster();
        this.updateSelects();
        this.updateRosterList();
        if (typeof showNotification === 'function') {
          showNotification('Roster cleared successfully.', 'success');
        }
      }
    },

    // Add a new player (string)
    addPlayer(name) {
      if (!name) return false;

      const trimmedName = name.trim();

      if (!trimmedName) {
        if (typeof showNotification === 'function') {
          showNotification('Player name cannot be empty.', 'warning');
        }
        return false;
      }

      if (trimmedName.length > MAX_PLAYER_NAME_LENGTH) {
        if (typeof showNotification === 'function') {
          showNotification(`Player name is too long. Maximum ${MAX_PLAYER_NAME_LENGTH} characters allowed.`, 'warning');
        }
        return false;
      }

      const trimmedNameLower = trimmedName.toLowerCase();
      if (roster.some(existingPlayer => existingPlayer.toLowerCase() === trimmedNameLower)) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${trimmedName}" already exists (case-insensitive match)!`, 'warning');
        }
        return false;
      }

      roster.push(trimmedName);
      roster.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      saveRoster();
      this.updateSelects();
      this.updateRosterList();
      if (typeof showNotification === 'function') {
        showNotification(`Player ${trimmedName} added successfully.`, 'success');
      }
      return true;
    },

    // Remove a player (string)
    removePlayer(name) {
      const index = roster.indexOf(name);
      if (index > -1) {
        // Store current selections before modifying roster
        const goalScorerSelect = document.getElementById('goalScorer');
        const goalAssistSelect = document.getElementById('goalAssist');

        const scorerBeforeRemove = goalScorerSelect ? goalScorerSelect.value : null;
        const assistBeforeRemove = goalAssistSelect ? goalAssistSelect.value : null;

        roster.splice(index, 1);
        saveRoster();
        this.updateSelects();
        this.updateRosterList();

        if (typeof showNotification === 'function') {
          showNotification(`Player ${name} removed successfully.`, 'success');
        }

        // Check and notify if selections were reset
        if (goalScorerSelect && scorerBeforeRemove === name && goalScorerSelect.value === '') {
          if (typeof showNotification === 'function') {
            showNotification(`Goal scorer selection was reset as ${name} was removed.`, 'info');
          }
        }
        if (goalAssistSelect && assistBeforeRemove === name && goalAssistSelect.value === '') {
          if (typeof showNotification === 'function') {
            showNotification(`Goal assist selection was reset as ${name} was removed.`, 'info');
          }
        }
        return true;
      }
      return false;
    },

    // Edit a player's name (string)
    editPlayer(oldName, newName) {
      if (!oldName || !newName) {
        if (typeof showNotification === 'function') {
          showNotification('Old or new player name cannot be empty.', 'warning');
        }
        return false;
      }

      const trimmedNewName = newName.trim();

      if (!trimmedNewName) {
        if (typeof showNotification === 'function') {
          showNotification('New player name cannot be empty.', 'warning');
        }
        return false;
      }

      if (trimmedNewName.length > MAX_PLAYER_NAME_LENGTH) {
        if (typeof showNotification === 'function') {
          showNotification(`Player name is too long. Maximum ${MAX_PLAYER_NAME_LENGTH} characters allowed.`, 'warning');
        }
        return false;
      }

      const oldNameIndex = roster.indexOf(oldName);

      if (oldNameIndex === -1) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${oldName}" not found in the roster.`, 'warning');
        }
        return false;
      }

      const trimmedNewNameLower = trimmedNewName.toLowerCase();
      const oldNameLower = oldName.toLowerCase();
      if (trimmedNewNameLower !== oldNameLower && roster.some(existingPlayer => existingPlayer.toLowerCase() === trimmedNewNameLower)) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${trimmedNewName}" already exists (case-insensitive match)!`, 'warning');
        }
        return false;
      }

      // Store current selections before modifying roster
      const goalScorerSelect = document.getElementById('goalScorer');
      const goalAssistSelect = document.getElementById('goalAssist');
      const scorerBeforeEdit = goalScorerSelect ? goalScorerSelect.value : null;
      const assistBeforeEdit = goalAssistSelect ? goalAssistSelect.value : null;

      roster[oldNameIndex] = trimmedNewName;
      roster.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      saveRoster();
      this.updateSelects();
      this.updateRosterList();

      if (typeof showNotification === 'function') {
        showNotification(`Player "${oldName}" updated to "${trimmedNewName}" successfully.`, 'success');
      }

      // Restore selections if they were the player being edited
      if (goalScorerSelect && scorerBeforeEdit === oldName) {
        goalScorerSelect.value = trimmedNewName;
      }
      if (goalAssistSelect && assistBeforeEdit === oldName) {
        goalAssistSelect.value = trimmedNewName;
      }

      return true;
    },

    // Add multiple players from a string
    addPlayersBulk(namesString) {
      if (!namesString || namesString.trim() === "") {
        if (typeof showNotification === 'function') {
          showNotification('No player names provided for bulk add.', 'warning');
        }
        return;
      }

      const namesArray = namesString.split(/[,\n]+/).map(name => name.trim()).filter(name => name !== "");

      if (namesArray.length === 0) {
        if (typeof showNotification === 'function') {
          showNotification('No valid player names found after parsing.', 'warning');
        }
        return;
      }

      let addedNames = [];
      let failedNames = [];

      namesArray.forEach(name => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const nameLower = trimmedName.toLowerCase();
        if (trimmedName.length > MAX_PLAYER_NAME_LENGTH) {
          failedNames.push({ name: trimmedName, reason: `Name too long (max ${MAX_PLAYER_NAME_LENGTH} chars).` });
        } else if (roster.some(existingPlayer => existingPlayer.toLowerCase() === nameLower)) {
          failedNames.push({ name: trimmedName, reason: 'Player already exists (case-insensitive match).' });
        } else {
          if (addedNames.some(addedPlayer => addedPlayer.toLowerCase() === nameLower)) {
            failedNames.push({ name: trimmedName, reason: 'Duplicate in current bulk list (case-insensitive match).' });
          } else {
            addedNames.push(trimmedName); // Add string with original casing
          }
        }
      });

      if (addedNames.length > 0) {
        roster.push(...addedNames);
        roster.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        saveRoster();
        this.updateSelects();
        this.updateRosterList();

        let successMsg = `Successfully added ${addedNames.length} player(s): ${addedNames.join(', ')}.`;
        if (typeof showNotification === 'function') {
          showNotification(successMsg, 'success');
        }
      } else {
         if (namesArray.length > 0 && typeof showNotification === 'function') {
          showNotification('No new players were added from the list. They may already exist or were invalid.', 'info');
        } else if (namesArray.length === 0 && typeof showNotification === 'function') {
           showNotification('No valid player names found after parsing.', 'warning');
        }
      }

      if (failedNames.length > 0) {
        let failedMsg = `Could not add ${failedNames.length} player(s): `;
        failedNames.forEach(item => {
          failedMsg += `"${item.name}" (${item.reason}) `;
        });
        if (typeof showNotification === 'function') {
          showNotification(failedMsg, 'warning', 10000); // Longer duration for more complex message
        }
      }
    },

    // Bind event listeners
    bindEvents() {
      // Cache frequently used DOM elements
      const addPlayerBtn = document.getElementById('addPlayerBtn');
      const newPlayerNameInput = document.getElementById('newPlayerName');
      // const newPlayerShirtNumberInput = document.getElementById('newPlayerShirtNumber'); // Removed
      const rosterList = document.getElementById('rosterList');
      const addPlayersBulkBtn = document.getElementById('addPlayersBulkBtn');
      const bulkPlayerNamesTextarea = document.getElementById('bulkPlayerNames');
      const clearRosterBtn = document.getElementById('clearRosterBtn');
      const openRosterModalBtn = document.getElementById('openRosterModalBtn');

      // Add player event listener
      if (addPlayerBtn && newPlayerNameInput) {
        addPlayerBtn.addEventListener('click', () => {
          const playerName = newPlayerNameInput.value.trim();
          if (this.addPlayer(playerName)) {
            newPlayerNameInput.value = ''; // Clear input on successful add
          }
        });

        newPlayerNameInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            addPlayerBtn.click();
          }
        });
      }

      // Clear roster event listener
      if (clearRosterBtn) {
        clearRosterBtn.addEventListener('click', () => {
          this.clearRoster();
        });
      }

      // Bulk add players event listener
      if (addPlayersBulkBtn && bulkPlayerNamesTextarea) {
        addPlayersBulkBtn.addEventListener('click', () => {
          const namesString = bulkPlayerNamesTextarea.value;
          this.addPlayersBulk(namesString);
          bulkPlayerNamesTextarea.value = ''; // Clear textarea after processing
        });
      }

      // Roster list event delegation (for edit/remove player)
      if (rosterList) {
        rosterList.addEventListener('click', (e) => {
          const targetButton = e.target.closest('button');
          if (!targetButton) return;

          const player = targetButton.dataset.player; // Use dataset for cleaner attribute access

          if (targetButton.classList.contains('remove-player')) {
            if (confirm(`Are you sure you want to remove ${player}?`)) {
              this.removePlayer(player);
            }
          } else if (targetButton.classList.contains('edit-player')) {
            const oldName = targetButton.dataset.player;
            const newName = prompt(`Enter new name for ${oldName}:`, oldName);
            if (newName !== null && newName.trim() !== '') {
              this.editPlayer(oldName, newName.trim());
            }
          }
        });
      }

      // Open roster modal event listener
      if (openRosterModalBtn) {
        openRosterModalBtn.addEventListener('click', () => {
          // Reset newPlayerNameInput if needed, though typically it's cleared on add
          // newPlayerNameInput.value = ''; // Optional: clear name input when modal opens
          const rosterModalElement = document.getElementById('rosterModal');
          if (rosterModalElement) {
            const rosterModal = bootstrap.Modal.getInstance(rosterModalElement) || new bootstrap.Modal(rosterModalElement);
            rosterModal.show();
          }
        });
      }
      // Removed modal close event listener that called resetAddPlayerForm
    }
  };
})();
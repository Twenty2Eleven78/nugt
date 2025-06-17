// Roster Management Module
const RosterManager = (function() {
  const MAX_PLAYER_NAME_LENGTH = 50; // Define character limit
  
  // Private variables
  const STORAGE_KEY = 'goalTracker_roster';
  let roster = [];
  let currentlyEditingPlayerName = null; // Track editing state

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
      // Case 1: No roster in localStorage, use default.
      if (savedRosterJSON === null) { // More explicit check for null
        return getDefaultRoster();
      }

      const parsedRoster = JSON.parse(savedRosterJSON);

      // Ensure parsedRoster is an array. If not, it's corrupted.
      if (!Array.isArray(parsedRoster)) {
        console.warn('Invalid roster format in localStorage (not an array). Using default roster.');
        return getDefaultRoster();
      }

      // Case 2: localStorage has an empty array "[]". This is a valid, intentionally empty roster.
      if (parsedRoster.length === 0) {
        return [];
      }

      // Case 3: Migration for old format (array of strings).
      if (typeof parsedRoster[0] === 'string') {
        // Additional check: ensure all elements are strings for safety, though less likely if first is.
        // For simplicity here, we trust the initial typeof check is sufficient for this migration path.
        return parsedRoster.map(playerName => ({ name: String(playerName), shirtNumber: null })); // Ensure playerName is string
      }

      // Case 4: It's an array of objects (new format).
      // Also check that player.name exists, otherwise it's not a valid player object.
      if (typeof parsedRoster[0] === 'object' && parsedRoster[0] !== null && parsedRoster[0].hasOwnProperty('name')) {
        // Optional: Add more validation here to check if objects have 'name' property.
        // For now, assume structure is correct if it's an array of objects with name property.
        // We also ensure that all items in the array are valid objects
        if (parsedRoster.every(player => typeof player === 'object' && player !== null && player.hasOwnProperty('name'))) {
          return parsedRoster;
        } else {
          console.warn('Invalid roster items in localStorage (some items are not valid player objects). Using default roster.');
          return getDefaultRoster();
        }
      }

      // Case 5: Unrecognized array format (e.g., array of numbers, mixed types not caught above).
      console.warn('Unrecognized roster format in localStorage. Using default roster.');
      return getDefaultRoster();

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
    return [
      { name: 'A-R.Obidi', shirtNumber: '1' }, { name: 'A.Seaman', shirtNumber: '1' },
      { name: 'D.Peacock', shirtNumber: '1' }, { name: 'E.Doyle', shirtNumber: '1' },
      { name: 'E.Van-Kerro', shirtNumber: '1' }, { name: 'E.Mutiti', shirtNumber: '1' },
      { name: 'F.Asadi', shirtNumber: '1' }, { name: 'F.Kendall', shirtNumber: '1' },
      { name: 'H.Strowthers', shirtNumber: '1' }, { name: 'M.Finch', shirtNumber: '1' },
      { name: 'M.Stevens', shirtNumber: '1' }, { name: 'N.Janicka', shirtNumber: '1' },
      { name: 'S.Smith', shirtNumber: '1' }, { name: 'T.Rushmer', shirtNumber: '1' },
      { name: 'V.Aig-Imoru', shirtNumber: '1' }
    ].sort((a, b) => a.name.localeCompare(b.name)); // Keep default sorted
  }

  // Public interface
  return {
    // Initialize roster
    init() {
      roster = loadRoster();
      this.updateSelects();
      this.updateRosterList();
      this.bindEvents();
    },

    // Get current roster (returns array of names for compatibility)
    getRoster() {
      return roster.map(player => player.name);
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
        rosterList.innerHTML = roster
          .map(player => `
            <tr>
              <td>${player.name}</td>
              <td>${player.shirtNumber !== null && player.shirtNumber !== undefined ? player.shirtNumber : ''}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-2 edit-player" data-player="${player.name}">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger remove-player" data-player="${player.name}">
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

    // Add a new player
    addPlayer(name, shirtNumber = null) {
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
      if (roster.some(existingPlayer => existingPlayer.name.toLowerCase() === trimmedNameLower)) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${trimmedName}" already exists (case-insensitive match)!`, 'warning');
        }
        return false;
      }

      const newPlayer = { name: trimmedName, shirtNumber: shirtNumber };
      roster.push(newPlayer);
      roster.sort((a, b) => a.name.localeCompare(b.name));
      saveRoster();
      this.updateSelects();
      this.updateRosterList();
      if (typeof showNotification === 'function') {
        showNotification(`Player ${trimmedName} added successfully.`, 'success');
      }
      return true;
    },

    // Remove a player
    removePlayer(name) {
      const index = roster.findIndex(player => player.name === name);
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

    // Edit a player's name and shirt number
    editPlayer(oldName, newName, newShirtNumber = null) {
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

      const playerIndex = roster.findIndex(player => player.name === oldName);

      if (playerIndex === -1) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${oldName}" not found in the roster.`, 'warning');
        }
        return false;
      }

      // Check if new name already exists (case-insensitive and not the same old name)
      const trimmedNewNameLower = trimmedNewName.toLowerCase();
      if (trimmedNewNameLower !== oldName.toLowerCase() &&
          roster.some(p => p.name.toLowerCase() === trimmedNewNameLower && p.name !== oldName)) { // Ensure it's not the player itself if name casing changes
        if (typeof showNotification === 'function') {
          showNotification(`Another player with the name "${trimmedNewName}" already exists (case-insensitive match)!`, 'warning');
        }
        return false;
      }

      // Store current selections before modifying roster
      const goalScorerSelect = document.getElementById('goalScorer');
      const goalAssistSelect = document.getElementById('goalAssist');
      const scorerBeforeEdit = goalScorerSelect ? goalScorerSelect.value : null;
      const assistBeforeEdit = goalAssistSelect ? goalAssistSelect.value : null;

      roster[playerIndex].name = trimmedNewName;
      roster[playerIndex].shirtNumber = newShirtNumber;
      roster.sort((a, b) => a.name.localeCompare(b.name));
      saveRoster();
      this.updateSelects();
      this.updateRosterList();

      if (typeof showNotification === 'function') {
        showNotification(`Player "${oldName}" updated to "${trimmedNewName}" successfully.`, 'success');
      }

      // Restore selections if they were the player being edited
      if (goalScorerSelect && scorerBeforeEdit === oldName) {
        goalScorerSelect.value = trimmedNewName; // getRoster() returns names, so this should still work
      }
      if (goalAssistSelect && assistBeforeEdit === oldName) {
        goalAssistSelect.value = trimmedNewName; // getRoster() returns names, so this should still work
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

      let addedPlayersObjects = [];
      let failedNames = [];

      namesArray.forEach(name => {
        const trimmedName = name.trim(); // Ensure trimming here as well
        if (!trimmedName) return; // Skip empty names resulting from split/trim

        const nameLower = trimmedName.toLowerCase();
        if (trimmedName.length > MAX_PLAYER_NAME_LENGTH) {
          failedNames.push({ name: trimmedName, reason: `Name too long (max ${MAX_PLAYER_NAME_LENGTH} chars).` });
        } else if (roster.some(existingPlayer => existingPlayer.name.toLowerCase() === nameLower)) {
          failedNames.push({ name: trimmedName, reason: 'Player already exists (case-insensitive match).' });
        } else {
          // Check for duplicates within the current bulk add list (case-insensitive)
          if (addedPlayersObjects.some(addedPlayerObj => addedPlayerObj.name.toLowerCase() === nameLower)) {
            failedNames.push({ name: trimmedName, reason: 'Duplicate in current bulk list (case-insensitive match).' });
          } else {
            addedPlayersObjects.push({ name: trimmedName, shirtNumber: null }); // Add as object
          }
        }
      });

      if (addedPlayersObjects.length > 0) {
        roster.push(...addedPlayersObjects);
        roster.sort((a, b) => a.name.localeCompare(b.name));
        saveRoster();
        this.updateSelects();
        this.updateRosterList();

        let successMsg = `Successfully added ${addedPlayersObjects.length} player(s): ${addedPlayersObjects.map(p => p.name).join(', ')}.`;
        if (typeof showNotification === 'function') {
          showNotification(successMsg, 'success');
        }
      } else {
        if (namesArray.length > 0 && typeof showNotification === 'function') { // only show if there were names to process
          showNotification('No new players were added from the list. They may already exist or were invalid.', 'info');
        } else if (namesArray.length === 0 && typeof showNotification === 'function') {
           // This case is handled by the initial check, but as a fallback:
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
      const newPlayerNameInput = document.getElementById('newPlayerName'); // Renamed for clarity
      const newPlayerShirtNumberInput = document.getElementById('newPlayerShirtNumber');
      const rosterList = document.getElementById('rosterList');
      const addPlayersBulkBtn = document.getElementById('addPlayersBulkBtn');
      const bulkPlayerNamesTextarea = document.getElementById('bulkPlayerNames');
      const clearRosterBtn = document.getElementById('clearRosterBtn');
      const openRosterModalBtn = document.getElementById('openRosterModalBtn');

      // Function to reset add player form and button
      function resetAddPlayerForm() {
        newPlayerNameInput.value = '';
        newPlayerShirtNumberInput.value = '';
        addPlayerBtn.innerHTML = '<i class="fas fa-plus"></i> Add Player';
        currentlyEditingPlayerName = null;
      }

      // Add player / Save Changes event listener
      if (addPlayerBtn && newPlayerNameInput && newPlayerShirtNumberInput) {
        addPlayerBtn.addEventListener('click', () => {
          const playerName = newPlayerNameInput.value.trim();
          const shirtNumberValue = newPlayerShirtNumberInput.value.trim();
          let shirtNumber = null;

          if (shirtNumberValue !== '') {
            shirtNumber = parseInt(shirtNumberValue, 10);
            if (isNaN(shirtNumber)) {
              if (typeof showNotification === 'function') {
                showNotification('Invalid shirt number. It must be a number.', 'warning');
              }
              return;
            }
          }

          if (currentlyEditingPlayerName) {
            // Editing existing player
            if (this.editPlayer(currentlyEditingPlayerName, playerName, shirtNumber)) {
              resetAddPlayerForm();
            }
          } else {
            // Adding new player
            if (this.addPlayer(playerName, shirtNumber)) {
              resetAddPlayerForm();
            }
          }
        });

        newPlayerNameInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            addPlayerBtn.click();
          }
        });
        newPlayerShirtNumberInput.addEventListener('keypress', (e) => {
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
              // If the removed player was being edited, reset the form
              if (currentlyEditingPlayerName === player) {
                resetAddPlayerForm();
              }
            }
          } else if (targetButton.classList.contains('edit-player')) {
            const playerNameToEdit = targetButton.dataset.player;
            const playerToEdit = roster.find(p => p.name === playerNameToEdit);
            if (playerToEdit) {
              newPlayerNameInput.value = playerToEdit.name;
              newPlayerShirtNumberInput.value = playerToEdit.shirtNumber !== null ? playerToEdit.shirtNumber : '';
              addPlayerBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
              currentlyEditingPlayerName = playerNameToEdit;
              newPlayerNameInput.focus(); // Focus on name input for editing
            }
          }
        });
      }

      // Open roster modal event listener
      if (openRosterModalBtn) {
        openRosterModalBtn.addEventListener('click', () => {
          resetAddPlayerForm(); // Ensure form is in "add" mode when modal opens
          const rosterModalElement = document.getElementById('rosterModal');
          if (rosterModalElement) {
            const rosterModal = bootstrap.Modal.getInstance(rosterModalElement) || new bootstrap.Modal(rosterModalElement);
            rosterModal.show();
          }
        });
      }
      // Also, handle modal close events to reset editing state
      const rosterModalElement = document.getElementById('rosterModal');
      if (rosterModalElement) {
          rosterModalElement.addEventListener('hidden.bs.modal', function () {
              resetAddPlayerForm();
          });
      }
    }
  };
})();
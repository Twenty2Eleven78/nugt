// Roster Management Module
const RosterManager = (function() {
  const MAX_PLAYER_NAME_LENGTH = 50; // Define character limit
  
  // Private variables
  const STORAGE_KEY = 'goalTracker_roster';
  let roster = []; // Now stores objects: { name: "Player Name", shirtNumber: 10 }

  // Save roster to local storage
  function saveRoster() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    } catch (error) {
      console.error('Error saving roster:', error);
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
        return getDefaultRoster(); // Returns array of objects
      }

      const parsedRoster = JSON.parse(savedRosterJSON);

      if (!Array.isArray(parsedRoster)) {
        console.warn('Invalid roster format in localStorage (not an array). Using default roster.');
        return getDefaultRoster();
      }

      if (parsedRoster.length === 0) {
        return getDefaultRoster();
      }

      // Check the format of the first item to determine if migration is needed
      if (typeof parsedRoster[0] === 'string') {
        // This is an old string-based roster, migrate it
        console.log('Migrating old string-based roster to new object format.');
        const migratedRoster = parsedRoster.map(playerName => ({
          name: playerName,
          shirtNumber: null // Or some default like '', or prompt user later
        }));
        // Sort by name after migration
        return migratedRoster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      } else if (typeof parsedRoster[0] === 'object' && parsedRoster[0] !== null && parsedRoster[0].hasOwnProperty('name')) {
        // This is already the new object-based roster or a compatible old object format
        // Ensure all items have name and shirtNumber properties
        const processedRoster = parsedRoster.map(player => ({
          name: player.name,
          shirtNumber: player.shirtNumber !== undefined ? player.shirtNumber : null
        })).filter(player => typeof player.name === 'string' && player.name.trim() !== '');

        // Ensure uniqueness by name (case-insensitive for checking, but keep original casing)
        const uniqueRoster = [];
        const namesSeen = new Set();
        for (const player of processedRoster) {
            if (!namesSeen.has(player.name.toLowerCase())) {
                uniqueRoster.push(player);
                namesSeen.add(player.name.toLowerCase());
            }
        }
        return uniqueRoster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      } else {
        // Unrecognized format
        console.warn('Unrecognized roster format in localStorage. Using default roster.');
        return getDefaultRoster();
      }
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
    // Returns a sorted array of player objects
    return [
      { name: 'A-R.Obidi', shirtNumber: null }, { name: 'A.Seaman', shirtNumber: null },
      { name: 'D.Peacock', shirtNumber: null }, { name: 'E.Doyle', shirtNumber: null },
      { name: 'E.Van-Kerro', shirtNumber: null }, { name: 'E.Mutiti', shirtNumber: null },
      { name: 'F.Asadi', shirtNumber: null }, { name: 'F.Kendall', shirtNumber: null },
      { name: 'H.Strowthers', shirtNumber: null }, { name: 'M.Finch', shirtNumber: null },
      { name: 'M.Stevens', shirtNumber: null }, { name: 'N.Janicka', shirtNumber: null },
      { name: 'S.Smith', shirtNumber: null }, { name: 'T.Rushmer', shirtNumber: null },
      { name: 'V.Aig-Imoru', shirtNumber: null }
    ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
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

    // Get current roster
    getRoster() {
      return roster.map(player => ({ ...player })); // Return a deep copy
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
      const currentRosterObjects = this.getRoster(); // Array of {name, shirtNumber}

      // Define static options. These values should match the <option value="..."> in HTML.
      const staticScorerOptions = ['', 'Own Goal']; // "" is "Select goal scorer"
      const staticAssistOptions = ['', 'N/A'];    // "" is "Select goal assist"

      // Helper function to update a single select element
      const updateSingleSelect = (selectElement, currentSelectedValue, staticOptions) => {
        const initialPlayerOptionElements = Array.from(selectElement.options)
          .filter(opt => !staticOptions.includes(opt.value));
        const initialPlayerNamesInSelect = initialPlayerOptionElements.map(opt => opt.value);
        const currentRosterPlayerNames = currentRosterObjects.map(p => p.name);

        // Determine players to remove from select
        initialPlayerOptionElements.forEach(optionElement => {
          if (!currentRosterPlayerNames.includes(optionElement.value)) {
            selectElement.removeChild(optionElement);
          }
        });

        // Determine players to add to select
        currentRosterObjects.forEach(playerObj => {
          if (!initialPlayerNamesInSelect.includes(playerObj.name)) {
            const newOption = document.createElement('option');
            newOption.value = playerObj.name;
            newOption.textContent = playerObj.name; // Display only name in dropdown
            selectElement.appendChild(newOption);
          }
        });

        // Restore selection or set to default
        if (currentRosterPlayerNames.includes(currentSelectedValue) || staticOptions.includes(currentSelectedValue)) {
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
        rosterList.innerHTML = roster // roster is an array of player objects
          .map(player => `
            <tr>
              <td>${player.name}</td>
              <td>${player.shirtNumber !== null ? player.shirtNumber : '-'}</td>
              <td class="text-end roster-actions-cell">
                <button class="btn btn-sm btn-outline-primary me-2 edit-player" data-player-name="${player.name}">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger remove-player" data-player-name="${player.name}">
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

    // Add a new player object {name, shirtNumber}
    addPlayer(name, shirtNumber) {
      if (!name) return false;

      const trimmedName = name.trim();
      const num = shirtNumber !== null && shirtNumber !== '' ? parseInt(shirtNumber, 10) : null;

      if (num !== null && (isNaN(num) || num < 0 || num > 99)) {
        if (typeof showNotification === 'function') {
            showNotification('Invalid shirt number. Must be between 0 and 99.', 'warning');
        }
        return false;
      }


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
      if (roster.some(player => player.name.toLowerCase() === trimmedNameLower)) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${trimmedName}" already exists (case-insensitive match)!`, 'warning');
        }
        return false;
      }

      roster.push({ name: trimmedName, shirtNumber: num });
      roster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      saveRoster();
      this.updateSelects();
      this.updateRosterList();
      if (typeof showNotification === 'function') {
        showNotification(`Player ${trimmedName} ${num !== null ? '(#' + num + ')' : ''} added successfully.`, 'success');
      }
      return true;
    },

    // Remove a player by name (string)
    removePlayer(playerName) {
      const index = roster.findIndex(p => p.name === playerName);
      if (index > -1) {
        const goalScorerSelect = document.getElementById('goalScorer');
        const goalAssistSelect = document.getElementById('goalAssist');
        const scorerBeforeRemove = goalScorerSelect ? goalScorerSelect.value : null;
        const assistBeforeRemove = goalAssistSelect ? goalAssistSelect.value : null;

        roster.splice(index, 1);
        saveRoster();
        this.updateSelects();
        this.updateRosterList();

        if (typeof showNotification === 'function') {
          showNotification(`Player ${playerName} removed successfully.`, 'success');
        }

        if (goalScorerSelect && scorerBeforeRemove === playerName && goalScorerSelect.value === '') {
          if (typeof showNotification === 'function') {
            showNotification(`Goal scorer selection was reset as ${playerName} was removed.`, 'info');
          }
        }
        if (goalAssistSelect && assistBeforeRemove === playerName && goalAssistSelect.value === '') {
          if (typeof showNotification === 'function') {
            showNotification(`Goal assist selection was reset as ${playerName} was removed.`, 'info');
          }
        }
        return true;
      }
      return false;
    },

    // Edit a player's name and/or shirt number
    editPlayer(oldName, newName, newShirtNumber) {
      if (!oldName || !newName) {
        if (typeof showNotification === 'function') {
          showNotification('Old or new player name cannot be empty.', 'warning');
        }
        return false;
      }

      const trimmedNewName = newName.trim();
      const num = newShirtNumber !== null && newShirtNumber !== '' ? parseInt(newShirtNumber, 10) : null;

      if (num !== null && (isNaN(num) || num < 0 || num > 99)) {
        if (typeof showNotification === 'function') {
            showNotification('Invalid shirt number. Must be between 0 and 99.', 'warning');
        }
        return false;
      }

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

      const oldPlayerIndex = roster.findIndex(p => p.name === oldName);

      if (oldPlayerIndex === -1) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${oldName}" not found in the roster.`, 'warning');
        }
        return false;
      }

      const trimmedNewNameLower = trimmedNewName.toLowerCase();
      // Check if new name already exists, excluding the current player being edited
      if (roster.some((p, index) => index !== oldPlayerIndex && p.name.toLowerCase() === trimmedNewNameLower)) {
        if (typeof showNotification === 'function') {
          showNotification(`Player name "${trimmedNewName}" already exists (case-insensitive match)!`, 'warning');
        }
        return false;
      }

      const goalScorerSelect = document.getElementById('goalScorer');
      const goalAssistSelect = document.getElementById('goalAssist');
      const scorerBeforeEdit = goalScorerSelect ? goalScorerSelect.value : null;
      const assistBeforeEdit = goalAssistSelect ? goalAssistSelect.value : null;

      roster[oldPlayerIndex].name = trimmedNewName;
      roster[oldPlayerIndex].shirtNumber = num;
      roster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      saveRoster();
      this.updateSelects();
      this.updateRosterList();

      if (typeof showNotification === 'function') {
        showNotification(`Player "${oldName}" updated to "${trimmedNewName}" ${num !== null ? '(#' + num + ')' : ''} successfully.`, 'success');
      }

      if (goalScorerSelect && scorerBeforeEdit === oldName) {
        goalScorerSelect.value = trimmedNewName;
      }
      if (goalAssistSelect && assistBeforeEdit === oldName) {
        goalAssistSelect.value = trimmedNewName;
      }
      return true;
    },

    // Add multiple players from a string (names only for now)
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

        // For bulk add, shirt numbers are not processed, set to null.
        const nameLower = trimmedName.toLowerCase();
        if (trimmedName.length > MAX_PLAYER_NAME_LENGTH) {
          failedNames.push({ name: trimmedName, reason: `Name too long (max ${MAX_PLAYER_NAME_LENGTH} chars).` });
        } else if (roster.some(player => player.name.toLowerCase() === nameLower)) {
          failedNames.push({ name: trimmedName, reason: 'Player already exists (case-insensitive match).' });
        } else {
          // Check for duplicates within the bulk list itself
          if (addedNames.some(addedPlayer => addedPlayer.name.toLowerCase() === nameLower)) {
            failedNames.push({ name: trimmedName, reason: 'Duplicate in current bulk list (case-insensitive match).' });
          } else {
            addedNames.push({ name: trimmedName, shirtNumber: null }); // Add as object
          }
        }
      });

      if (addedNames.length > 0) {
        roster.push(...addedNames); // Add new player objects
        roster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
        saveRoster();
        this.updateSelects();
        this.updateRosterList();

        let successMsg = `Successfully added ${addedNames.length} player(s): ${addedNames.map(p => p.name).join(', ')}. Shirt numbers can be added via Edit.`;
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
      const newPlayerShirtNumberInput = document.getElementById('newPlayerShirtNumber');
      const rosterList = document.getElementById('rosterList');
      const addPlayersBulkBtn = document.getElementById('addPlayersBulkBtn');
      const bulkPlayerNamesTextarea = document.getElementById('bulkPlayerNames');
      const clearRosterBtn = document.getElementById('clearRosterBtn');
      const openRosterModalBtn = document.getElementById('openRosterModalBtn'); // Assuming this ID exists for a button that opens the modal

      // Add player event listener
      if (addPlayerBtn && newPlayerNameInput && newPlayerShirtNumberInput) {
        addPlayerBtn.addEventListener('click', () => {
          const playerName = newPlayerNameInput.value.trim();
          const playerShirtNumber = newPlayerShirtNumberInput.value; // Get as string, validation in addPlayer
          if (this.addPlayer(playerName, playerShirtNumber)) {
            newPlayerNameInput.value = '';
            newPlayerShirtNumberInput.value = ''; // Clear shirt number input on successful add
          }
        });

        // Allow Enter key to add player from either input field
        [newPlayerNameInput, newPlayerShirtNumberInput].forEach(input => {
          input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              addPlayerBtn.click();
            }
          });
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

          const playerName = targetButton.dataset.playerName; // Use dataset for cleaner attribute access

          if (targetButton.classList.contains('remove-player')) {
            if (confirm(`Are you sure you want to remove ${playerName}?`)) {
              this.removePlayer(playerName);
            }
          } else if (targetButton.classList.contains('edit-player')) {
            const playerToEdit = roster.find(p => p.name === playerName);
            if (!playerToEdit) return;

            const newName = prompt(`Enter new name for ${playerName}:`, playerName);
            if (newName !== null && newName.trim() !== '') {
              const currentShirtNumber = playerToEdit.shirtNumber !== null ? playerToEdit.shirtNumber : '';
              const newShirtNumberStr = prompt(`Enter new shirt number for ${newName.trim()} (leave blank for no number):`, currentShirtNumber);

              // newShirtNumberStr could be null if user cancels prompt, or empty string
              // parseInt will handle empty string as NaN, which is fine for validation in editPlayer
              this.editPlayer(playerName, newName.trim(), newShirtNumberStr);
            }
          }
        });
      }

      // Open roster modal event listener
      // This event listener might be in script.js or elsewhere if 'openRosterModalBtn' is a global button.
      // For now, assuming it's specific to this modal's context or handled externally.
      // If openRosterModalBtn is indeed part of this component's controlled elements:
      // if (openRosterModalBtn) {
      //   openRosterModalBtn.addEventListener('click', () => {
      //     const rosterModalElement = document.getElementById('rosterModal');
      //     if (rosterModalElement) {
      //       const rosterModal = bootstrap.Modal.getInstance(rosterModalElement) || new bootstrap.Modal(rosterModalElement);
      //       rosterModal.show();
      //       // Optionally clear inputs when modal opens
      //       if(newPlayerNameInput) newPlayerNameInput.value = '';
      //       if(newPlayerShirtNumberInput) newPlayerShirtNumberInput.value = '';
      //     }
      //   });
      // }
    }
  };
})();
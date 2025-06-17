// Roster Management Module
const RosterManager = (function() {
  
  // Private variables
  const STORAGE_KEY = 'goalTracker_roster';
  let roster = [];

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
      const savedRoster = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return savedRoster && savedRoster.length ? savedRoster : getDefaultRoster();
    } catch (error) {
      console.error('Error loading roster:', error);
      // Call showNotification to display a user-friendly message
      if (typeof showNotification === 'function') {
        showNotification('Error loading roster. Default roster will be used.', 'warning');
      }
      return getDefaultRoster();
    }
  }
  // Set a default roster if not roster is stored
  function getDefaultRoster() {
    return [
      'A.Seaman','A-R.Obidi','D.Peacock','E.Doyle','E.Van-Kerro','E.Mutiti','F.Asadi','F.Kendall','H.Strowthers','M.Finch','M.Luttwak','M.Stevens','N.Janicka','R.Azar','S.Smith'
      ,'T.Rushmer','V.Aig-Imoru'
    ];
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
      return [...roster];
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
        const existingPlayerOptions = Array.from(selectElement.options)
          .map(opt => opt.value)
          .filter(val => !staticOptions.includes(val));

        const playersToAdd = currentRoster.filter(player => !existingPlayerOptions.includes(player));
        const playersToRemove = existingPlayerOptions.filter(player => !currentRoster.includes(player));

        // Remove players who are no longer in the roster
        playersToRemove.forEach(playerValue => {
          const optionToRemove = Array.from(selectElement.options).find(opt => opt.value === playerValue);
          if (optionToRemove) {
            selectElement.removeChild(optionToRemove);
          }
        });

        // Add new players from the roster
        playersToAdd.forEach(player => {
          const newOption = document.createElement('option');
          newOption.value = player;
          newOption.textContent = player;
          selectElement.appendChild(newOption);
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
              <td>${player}</td>
              <td class="text-end">
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

    // Add a new player
    addPlayer(name) {
      const MAX_PLAYER_NAME_LENGTH = 50; // Define character limit

      if (!name) return false; // Quick exit if original name is null/undefined
      
      // Trim and validate name
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

      // Check for duplicates
      if (roster.includes(trimmedName)) {
        if (typeof showNotification === 'function') { // Ensure showNotification exists for this path too
          showNotification('Player already exists!', 'warning');
        }
        return false;
      }

      // Add player and sort
      roster.push(trimmedName);
      roster.sort();
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

    // Edit a player's name
    editPlayer(oldName, newName) {
      const MAX_PLAYER_NAME_LENGTH = 50; // Consistent with addPlayer

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

      // Check if new name already exists (and it's not the same player)
      if (roster.includes(trimmedNewName) && trimmedNewName !== oldName) {
        if (typeof showNotification === 'function') {
          showNotification(`Player "${trimmedNewName}" already exists in the roster.`, 'warning');
        }
        return false;
      }

      // Store current selections before modifying roster
      const goalScorerSelect = document.getElementById('goalScorer');
      const goalAssistSelect = document.getElementById('goalAssist');
      const scorerBeforeEdit = goalScorerSelect ? goalScorerSelect.value : null;
      const assistBeforeEdit = goalAssistSelect ? goalAssistSelect.value : null;

      roster[oldNameIndex] = trimmedNewName;
      roster.sort();
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

      const MAX_PLAYER_NAME_LENGTH = 50; // Consistent with addPlayer
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
        if (name.length > MAX_PLAYER_NAME_LENGTH) {
          failedNames.push({ name: name, reason: `Name too long (max ${MAX_PLAYER_NAME_LENGTH} chars).` });
        } else if (roster.includes(name)) {
          failedNames.push({ name: name, reason: 'Player already exists.' });
        } else {
          // Check for duplicates within the current bulk add list before adding to main roster
          if (addedNames.includes(name)) {
            failedNames.push({ name: name, reason: 'Duplicate in current bulk list.' });
          } else {
            addedNames.push(name);
          }
        }
      });

      if (addedNames.length > 0) {
        roster.push(...addedNames);
        roster.sort();
        saveRoster();
        this.updateSelects();
        this.updateRosterList();

        let successMsg = `Successfully added ${addedNames.length} player(s): ${addedNames.join(', ')}.`;
        if (typeof showNotification === 'function') {
          showNotification(successMsg, 'success');
        }
      } else {
        if (typeof showNotification === 'function') {
          showNotification('No new players were added from the list.', 'info');
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
      const addPlayerBtn = document.getElementById('addPlayerBtn');
      const newPlayerInput = document.getElementById('newPlayerName');
      const rosterList = document.getElementById('rosterList');
      const addPlayersBulkBtn = document.getElementById('addPlayersBulkBtn');
      const bulkPlayerNamesTextarea = document.getElementById('bulkPlayerNames');
      const clearRosterBtn = document.getElementById('clearRosterBtn');

      if (addPlayerBtn && newPlayerInput) {
        // Add player on button click
        addPlayerBtn.addEventListener('click', () => {
          const playerName = newPlayerInput.value.trim();
          if (this.addPlayer(playerName)) {
            newPlayerInput.value = '';
          }
        });

        // Add player on Enter key
        newPlayerInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const playerName = newPlayerInput.value.trim();
            if (this.addPlayer(playerName)) {
              newPlayerInput.value = '';
            }
          }
        });
      }

      // Event listener for clear roster button
      if (clearRosterBtn) {
        clearRosterBtn.addEventListener('click', () => {
          this.clearRoster();
        });
      }

      // Event listener for bulk add button
      if (addPlayersBulkBtn && bulkPlayerNamesTextarea) {
        addPlayersBulkBtn.addEventListener('click', () => {
          const namesString = bulkPlayerNamesTextarea.value;
          this.addPlayersBulk(namesString);
          bulkPlayerNamesTextarea.value = ''; // Clear textarea after processing
        });
      }

      // Event listener for clear roster button
      if (clearRosterBtn) {
        clearRosterBtn.addEventListener('click', () => {
          this.clearRoster();
        });
      }

      // Delegate remove player event
      if (rosterList) {
        rosterList.addEventListener('click', (e) => {
          const targetButton = e.target.closest('button'); // Get the button element, even if icon is clicked
          if (!targetButton) return;

          if (targetButton.classList.contains('remove-player')) {
            const playerToRemove = targetButton.getAttribute('data-player');
            // Confirmation before removing
            if (confirm(`Are you sure you want to remove ${playerToRemove}?`)) {
              this.removePlayer(playerToRemove);
            }
          } else if (targetButton.classList.contains('edit-player')) {
            const playerToEdit = targetButton.getAttribute('data-player');
            const newName = prompt(`Enter new name for ${playerToEdit}:`, playerToEdit);
            if (newName !== null) { // Prompt returns null if Cancel is clicked
              this.editPlayer(playerToEdit, newName);
            }
          }
        });
      }

      // Open roster modal button
      const openRosterModalBtn = document.getElementById('openRosterModalBtn');
      if (openRosterModalBtn) {
        openRosterModalBtn.addEventListener('click', () => {
          const rosterModal = new bootstrap.Modal(document.getElementById('rosterModal'));
          rosterModal.show();
        });
      }
    }
  };
})();
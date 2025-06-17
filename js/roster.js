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
              <td>
                 <button class="btn btn-sm btn-outline-danger remove-player" data-player="${player}">
                  <i class="fas fa-trash"></i> Remove
                </button>
              </td>
            </tr>
          `)
          .join('');
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
        const goalScorerSelect = document.getElementById('goalScorer');
        const goalAssistSelect = document.getElementById('goalAssist');

        const scorerBeforeRemove = goalScorerSelect ? goalScorerSelect.value : null;
        const assistBeforeRemove = goalAssistSelect ? goalAssistSelect.value : null;

        roster.splice(index, 1);
        saveRoster();
        this.updateSelects(); // This is crucial as it might reset dropdowns
        this.updateRosterList();

        if (typeof showNotification === 'function') {
          showNotification(`Player ${name} removed successfully.`, 'success');
        }

        // Check if scorer selection was reset
        if (goalScorerSelect && scorerBeforeRemove === name) {
          const scorerAfterRemove = goalScorerSelect.value;
          if (scorerAfterRemove === '') { // Default empty value
            if (typeof showNotification === 'function') {
              showNotification(`Goal scorer selection was reset as ${name} was removed.`, 'info');
            }
          }
        }

        // Check if assist selection was reset
        if (goalAssistSelect && assistBeforeRemove === name) {
          const assistAfterRemove = goalAssistSelect.value;
          if (assistAfterRemove === '') { // Default empty value
            if (typeof showNotification === 'function') {
              showNotification(`Goal assist selection was reset as ${name} was removed.`, 'info');
            }
          }
        }
        return true;
      }
      return false;
    },

    // Bind event listeners
    bindEvents() {
      const addPlayerBtn = document.getElementById('addPlayerBtn');
      const newPlayerInput = document.getElementById('newPlayerName');
      const rosterList = document.getElementById('rosterList');

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

      // Delegate remove player event
      if (rosterList) {
        rosterList.addEventListener('click', (e) => {
          if (e.target.classList.contains('remove-player')) {
            const playerToRemove = e.target.getAttribute('data-player');
            this.removePlayer(playerToRemove);
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
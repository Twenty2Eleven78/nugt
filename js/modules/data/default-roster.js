/**
 * Default Roster Configuration
 * @version 4.0
 * 
 * This file contains the default player roster.
 * You can customize this list by adding, removing, or modifying players.
 */

// Default roster configuration
export const DEFAULT_ROSTER_CONFIG = {
    // Team information
    teamName: 'Netherton United',
    season: '2025-2026',
    ageGroup: 'U13 Girls (U14)',

    // Default players list
    players: [
        { name: 'Rae ', shirtNumber: 3 },
        { name: 'Amelia O', shirtNumber: 6 },
        { name: 'Amelia P', shirtNumber: 17 },
        { name: 'Aoife', shirtNumber: 2 },
        { name: 'Cimmy', shirtNumber: 16 },
        { name: 'Ciana', shirtNumber: 14 },
        { name: 'Daisy', shirtNumber: 15 },
        { name: 'Ella D', shirtNumber: 8 },
        { name: 'Ella VK', shirtNumber: 12 },
        { name: 'Emily', shirtNumber: 10 },
        { name: 'Farah', shirtNumber: null },
        { name: 'Freya B', shirtNumber: 4 },
        { name: 'Freya K', shirtNumber: 1 },
        { name: 'Havana', shirtNumber: 18 },
        { name: 'Megan', shirtNumber: 9 },
        { name: 'Mia', shirtNumber: 19 },
        { name: 'Miliana', shirtNumber: null },
        { name: 'Sienna', shirtNumber: 7 },
        { name: 'Tulula', shirtNumber: 5 },
        { name: 'Veronica', shirtNumber: 11 }
    ]
};



// Utility functions for roster management
export const rosterUtils = {
    // Helper function to sort players alphabetically
    _sortPlayers(players) {
        return [...players].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
    },

    // Get default roster sorted alphabetically
    getDefaultRoster() {
        return this._sortPlayers(DEFAULT_ROSTER_CONFIG.players);
    }
};

// Export default roster for backward compatibility
export default DEFAULT_ROSTER_CONFIG;
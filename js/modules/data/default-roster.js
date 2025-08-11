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
    ageGroup: 'U13 Girls',

    // Default players list
    players: [
        { name: 'A-R.Obidi', shirtNumber: null },
        { name: 'A.Seaman', shirtNumber: null },
        { name: 'D.Peacock', shirtNumber: null },
        { name: 'E.Doyle', shirtNumber: null },
        { name: 'E.Van-Kerro', shirtNumber: '10' },
        { name: 'E.Mutiti', shirtNumber: null },
        { name: 'F.Asadi', shirtNumber: null },
        { name: 'F.Kendall', shirtNumber: '1' },
        { name: 'H.Strowthers', shirtNumber: null },
        { name: 'M.Finch', shirtNumber: null },
        { name: 'M.Stevens', shirtNumber: null },
        { name: 'S.Smith', shirtNumber: null },
        { name: 'T.Rushmer', shirtNumber: null },
        { name: 'V.Aig-Imoru', shirtNumber: null }
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
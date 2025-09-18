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
        { name: 'Rae.O', shirtNumber: 3 },
        { name: 'Amelia.O', shirtNumber: 6 },
        { name: 'Amelia.P', shirtNumber: 17 },
        { name: 'Aoife.S', shirtNumber: 2 },
        { name: 'Cimmy.A', shirtNumber: 16 },
        { name: 'Ciana.B', shirtNumber: 14 },
        { name: 'Daisy.P', shirtNumber: 15 },
        { name: 'Ella.D', shirtNumber: 8 },
        { name: 'Ella.VK', shirtNumber: 12 },
        { name: 'Emily.M', shirtNumber: 10 },
        { name: 'Farah.A', shirtNumber: null },
        { name: 'Freya.B', shirtNumber: 4 },
        { name: 'Freya.K', shirtNumber: 1 },
        { name: 'Havana.S', shirtNumber: 18 },
        { name: 'Megan.F', shirtNumber: null },
        { name: 'Mia.S', shirtNumber: 19 },
        { name: 'Miliana.L', shirtNumber: null },
        { name: 'Sienna.S', shirtNumber: 7 },
        { name: 'Tulula.R', shirtNumber: 5 },
        { name: 'Veronica.AI', shirtNumber: 11 }
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
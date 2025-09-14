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
        { name: 'Rae.O', shirtNumber: null },
        { name: 'Amelia.O', shirtNumber: null },
        { name: 'Amelia.P', shirtNumber: null },
        { name: 'Aoife.S', shirtNumber: null },
        { name: 'Cimmy.A', shirtNumber: null },
        { name: 'Ciana', shirtNumber: null },
        { name: 'Daisy.P', shirtNumber: null },
        { name: 'Ella.D', shirtNumber: null },
        { name: 'Ella.VK', shirtNumber: null },
        { name: 'Emily.M', shirtNumber: null },
        { name: 'Farah.A', shirtNumber: null },
        { name: 'Freya.B', shirtNumber: null },
        { name: 'Freya.K', shirtNumber: 1 },
        { name: 'Havana.S', shirtNumber: null },
        { name: 'Megan.F', shirtNumber: null },
        { name: 'Mia.S', shirtNumber: null },
        { name: 'Miliana.L', shirtNumber: null },
        { name: 'Sienna.S', shirtNumber: null },
        { name: 'Tulula.R', shirtNumber: null },
        { name: 'Veronica.AI', shirtNumber: null }
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
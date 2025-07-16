/**
 * Default Roster Configuration
 * @version 3.3
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
        { name: 'E.Doyle', shirtNumber: null },
        { name: 'E.Van-Kerro', shirtNumber: null },
        { name: 'E.Mutiti', shirtNumber: null },
        { name: 'F.Asadi', shirtNumber: null },
        { name: 'F.Kendall', shirtNumber: null },
        { name: 'H.Strowthers', shirtNumber: null },
        { name: 'M.Finch', shirtNumber: null },
        { name: 'M.Stevens', shirtNumber: null },
        { name: 'N.Janicka', shirtNumber: null },
        { name: 'S.Smith', shirtNumber: null },
        { name: 'T.Rushmer', shirtNumber: null },
        { name: 'V.Aig-Imoru', shirtNumber: null }
    ]
};

// Alternative roster configurations for different teams/seasons
export const ROSTER_TEMPLATES = {
    // Example template for a different team
    example: {
        teamName: 'Example Team',
        season: '2025-2026',
        ageGroup: 'U12',
        players: [
            { name: 'Player 1', shirtNumber: 1 },
            { name: 'Player 2', shirtNumber: 2 },
            { name: 'Player 3', shirtNumber: 3 },
            // Add more players as needed
        ]
    },

    // Empty template for starting fresh
    empty: {
        teamName: 'New Team',
        season: '2025-2026',
        ageGroup: 'Youth',
        players: []
    }
};

// Utility functions for roster management
export const rosterUtils = {
    // Get default roster sorted alphabetically
    getDefaultRoster() {
        return [...DEFAULT_ROSTER_CONFIG.players].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
    },

    // Get roster from template
    getRosterFromTemplate(templateName) {
        const template = ROSTER_TEMPLATES[templateName];
        if (!template) {
            console.warn(`Roster template '${templateName}' not found`);
            return this.getDefaultRoster();
        }
        return [...template.players].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
    },

    // Validate roster data
    validateRoster(roster) {
        if (!Array.isArray(roster)) {
            return false;
        }

        return roster.every(player =>
            player &&
            typeof player === 'object' &&
            typeof player.name === 'string' &&
            player.name.trim() !== '' &&
            (player.shirtNumber === null ||
                (typeof player.shirtNumber === 'number' &&
                    player.shirtNumber >= 0 &&
                    player.shirtNumber <= 99))
        );
    },

    // Create a new roster with shirt numbers
    createRosterWithNumbers(playerNames, startingNumber = 1) {
        return playerNames.map((name, index) => ({
            name: name.trim(),
            shirtNumber: startingNumber + index
        }));
    },

    // Get roster statistics
    getRosterStats(roster) {
        if (!Array.isArray(roster)) return null;

        return {
            totalPlayers: roster.length,
            playersWithNumbers: roster.filter(p => p.shirtNumber !== null).length,
            playersWithoutNumbers: roster.filter(p => p.shirtNumber === null).length,
            usedNumbers: roster
                .filter(p => p.shirtNumber !== null)
                .map(p => p.shirtNumber)
                .sort((a, b) => a - b),
            availableNumbers: Array.from({ length: 100 }, (_, i) => i)
                .filter(num => !roster.some(p => p.shirtNumber === num))
        };
    }
};

// Export default roster for backward compatibility
export default DEFAULT_ROSTER_CONFIG;
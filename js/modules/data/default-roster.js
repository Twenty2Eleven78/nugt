/**
 * Default Roster Configuration
 * @version 4.0
 * 
 * This file provides roster defaults from configuration.
 * Roster can now be customized via config.json
 */

import { config } from '../shared/config.js';

// Get roster configuration from config.json with fallbacks
export function getRosterConfig() {
    try {
        return {
            // Team information
            teamName: config.get('team.clubName'),
            season: config.get('team.season'),
            ageGroup: config.get('team.ageGroup'),

            // Roster settings
            maxPlayers: config.get('roster.maxPlayers'),
            allowDuplicateNumbers: config.get('roster.allowDuplicateNumbers'),
            autoSort: config.get('roster.autoSort'),

            // Default players list from config
            players: config.get('roster.defaultPlayers')
        };
    } catch (error) {
        console.warn('Error loading roster config, using hardcoded defaults:', error);
        // Single fallback to hardcoded defaults if config fails
        return {
            teamName: 'Your Team',
            season: '2025-2026',
            ageGroup: 'Youth',
            maxPlayers: 25,
            allowDuplicateNumbers: false,
            autoSort: true,
            players: [
                { name: 'Player 1', shirtNumber: 1 },
                { name: 'Player 2', shirtNumber: 2 },
                { name: 'Player 3', shirtNumber: 3 },
                { name: 'Player 4', shirtNumber: 4 },
                { name: 'Player 5', shirtNumber: 5 },
                { name: 'Player 6', shirtNumber: 6 },
                { name: 'Player 7', shirtNumber: 7 },
                { name: 'Player 8', shirtNumber: 8 },
                { name: 'Player 9', shirtNumber: 9 },
                { name: 'Player 10', shirtNumber: 10 },
                { name: 'Player 11', shirtNumber: 11 }
            ]
        };
    }
}

// Legacy export for backward compatibility
export const DEFAULT_ROSTER_CONFIG = getRosterConfig();



// Utility functions for roster management
export const rosterUtils = {
    // Helper function to sort players alphabetically
    _sortPlayers(players) {
        return [...players].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
    },

    // Get default roster from configuration
    getDefaultRoster() {
        const rosterConfig = getRosterConfig();
        return rosterConfig.autoSort ?
            this._sortPlayers(rosterConfig.players) :
            rosterConfig.players;
    },

    // Get roster configuration
    getRosterConfig() {
        return getRosterConfig();
    }
};

// Export default roster for backward compatibility
export default getRosterConfig();
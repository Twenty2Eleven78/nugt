/**
 * League Configuration Module
 * Handles league-specific settings and competition rules
 */

import { config } from './config.js';

/**
 * Get league configuration
 */
export function getLeagueConfig() {
    try {
        return {
            leagueName: config.get('league.leagueName') || 'Local League',
            season: config.get('league.season') || '2025-2026',
            division: config.get('league.division') || 'Division 1',
            competitionType: config.get('league.competitionType') || 'league',
            pointsSystem: {
                win: config.get('league.pointsSystem.win') || 3,
                draw: config.get('league.pointsSystem.draw') || 1,
                loss: config.get('league.pointsSystem.loss') || 0
            },
            matchDuration: config.get('league.matchDuration') || 70, // minutes
            enableLeagueTable: config.get('league.enableLeagueTable') !== false, // default true
            enableFixtures: config.get('league.enableFixtures') !== false, // default true
            enableStandings: config.get('league.enableStandings') !== false // default true
        };
    } catch (error) {
        console.warn('Error loading league config, using defaults');
        return {
            leagueName: 'Local League',
            season: '2025-2026',
            division: 'Division 1',
            competitionType: 'league',
            pointsSystem: {
                win: 3,
                draw: 1,
                loss: 0
            },
            matchDuration: 70,
            enableLeagueTable: true,
            enableFixtures: true,
            enableStandings: true
        };
    }
}

/**
 * Get points system configuration
 */
export function getPointsSystem() {
    const leagueConfig = getLeagueConfig();
    return leagueConfig.pointsSystem;
}

/**
 * Calculate points for a match result
 */
export function calculatePoints(homeScore, awayScore, isHomeTeam = true) {
    const points = getPointsSystem();
    
    if (homeScore > awayScore) {
        // Home team wins
        return isHomeTeam ? points.win : points.loss;
    } else if (homeScore < awayScore) {
        // Away team wins
        return isHomeTeam ? points.loss : points.win;
    } else {
        // Draw
        return points.draw;
    }
}

/**
 * Get competition type
 */
export function getCompetitionType() {
    const leagueConfig = getLeagueConfig();
    return leagueConfig.competitionType;
}

/**
 * Check if league table is enabled
 */
export function isLeagueTableEnabled() {
    const leagueConfig = getLeagueConfig();
    return leagueConfig.enableLeagueTable;
}

/**
 * Check if fixtures are enabled
 */
export function isFixturesEnabled() {
    const leagueConfig = getLeagueConfig();
    return leagueConfig.enableFixtures;
}

/**
 * Check if standings are enabled
 */
export function isStandingsEnabled() {
    const leagueConfig = getLeagueConfig();
    return leagueConfig.enableStandings;
}

/**
 * Get league display information
 */
export function getLeagueDisplayInfo() {
    const leagueConfig = getLeagueConfig();
    return {
        fullName: `${leagueConfig.leagueName} - ${leagueConfig.division}`,
        season: leagueConfig.season,
        type: leagueConfig.competitionType,
        duration: `${leagueConfig.matchDuration} minutes`
    };
}

/**
 * Get available competition types
 */
export function getAvailableCompetitionTypes() {
    return {
        league: 'League Competition',
        cup: 'Cup Competition',
        tournament: 'Tournament',
        friendly: 'Friendly Matches',
        playoff: 'Playoff Competition'
    };
}

/**
 * Validate league configuration
 */
export function validateLeagueConfig() {
    const leagueConfig = getLeagueConfig();
    const errors = [];
    const warnings = [];

    // Validate points system
    if (leagueConfig.pointsSystem.win < 0) {
        errors.push('Win points cannot be negative');
    }
    if (leagueConfig.pointsSystem.draw < 0) {
        errors.push('Draw points cannot be negative');
    }
    if (leagueConfig.pointsSystem.loss < 0) {
        errors.push('Loss points cannot be negative');
    }

    // Validate match duration
    if (leagueConfig.matchDuration < 10 || leagueConfig.matchDuration > 120) {
        warnings.push('Match duration should be between 10 and 120 minutes');
    }

    // Check logical points system
    if (leagueConfig.pointsSystem.win <= leagueConfig.pointsSystem.draw) {
        warnings.push('Win points should be greater than draw points');
    }
    if (leagueConfig.pointsSystem.draw < leagueConfig.pointsSystem.loss) {
        warnings.push('Draw points should be greater than or equal to loss points');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
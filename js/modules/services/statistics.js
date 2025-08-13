/**
 * Statistics Service
 * Analyzes saved matches and provides comprehensive statistics
 * @version 1.0
 */

import { storage } from '../data/storage.js';
import { STORAGE_KEYS, GAME_CONFIG } from '../shared/constants.js';
import { rosterManager } from '../match/roster.js';

class StatisticsService {
    constructor() {
        this.cachedStats = null;
        this.lastCalculated = null;
    }

    /**
     * Get all saved matches from storage
     * Loads from cloud data and local fallback
     */
    async getAllMatches() {
        try {
            let matches = [];
            
            // First, try to load from cloud if user is authenticated
            try {
                const { authService } = await import('../services/auth.js');
                if (authService.isUserAuthenticated()) {
                    const { userMatchesApi } = await import('../services/user-matches-api.js');
                    const cloudData = await userMatchesApi.loadMatchData();
                    
                    if (cloudData && Array.isArray(cloudData.matches)) {
                        matches = cloudData.matches;
                    }
                }
            } catch (cloudError) {
                console.warn('Could not load cloud data:', cloudError.message);
            }
            
            // If no cloud data, check local storage for any current match data
            if (matches.length === 0) {
                const goals = storage.load(STORAGE_KEYS.GOALS, []);
                const matchEvents = storage.load(STORAGE_KEYS.MATCH_EVENTS, []);
                const team1Name = storage.load(STORAGE_KEYS.TEAM1_NAME, GAME_CONFIG.DEFAULT_TEAM1_NAME);
                const team2Name = storage.load(STORAGE_KEYS.TEAM2_NAME, GAME_CONFIG.DEFAULT_TEAM2_NAME);
                const gameTime = storage.load(STORAGE_KEYS.GAME_TIME, GAME_CONFIG.DEFAULT_GAME_TIME);
                
                // If we have any match data, create a current match object
                if (goals.length > 0 || matchEvents.length > 0 || team1Name !== GAME_CONFIG.DEFAULT_TEAM1_NAME || team2Name !== GAME_CONFIG.DEFAULT_TEAM2_NAME) {
                    const currentMatch = {
                        team1Name: team1Name,
                        team2Name: team2Name,
                        score1: goals.filter(goal => goal.team === 'first').length,
                        score2: goals.filter(goal => goal.team === 'second').length,
                        goals: goals,
                        matchEvents: matchEvents,
                        gameTime: gameTime,
                        savedAt: Date.now(),
                        attendance: storage.load(STORAGE_KEYS.MATCH_ATTENDANCE, [])
                    };
                    
                    matches = [currentMatch];
                }
            }
            
            // Fallback to local saved matches
            if (matches.length === 0) {
                const localMatches = storage.load('savedMatches', []);
                matches = Array.isArray(localMatches) ? localMatches : [];
            }
            
            return matches;
        } catch (error) {
            console.error('Error loading matches for statistics:', error);
            return [];
        }
    }

    /**
     * Calculate comprehensive match statistics
     */
    async calculateMatchStatistics() {
        const matches = await this.getAllMatches();
        
        if (matches.length === 0) {
            return this.getEmptyStats();
        }

        const stats = {
            overview: this.calculateOverviewStats(matches),
            performance: this.calculatePerformanceStats(matches),
            opponents: this.calculateOpponentStats(matches),
            timeline: this.calculateTimelineStats(matches),
            goals: this.calculateGoalStats(matches)
        };

        this.cachedStats = stats;
        this.lastCalculated = Date.now();
        
        return stats;
    }

    /**
     * Calculate overview statistics
     */
    calculateOverviewStats(matches) {
        const totalMatches = matches.length;
        let wins = 0, draws = 0, losses = 0;
        let totalGoalsFor = 0, totalGoalsAgainst = 0;
        let totalDuration = 0;

        matches.forEach(match => {
            const score1 = parseInt(match.score1) || 0;
            const score2 = parseInt(match.score2) || 0;
            
            totalGoalsFor += score1;
            totalGoalsAgainst += score2;
            totalDuration += match.gameTime || 4200; // Default 70 minutes

            if (score1 > score2) wins++;
            else if (score1 === score2) draws++;
            else losses++;
        });

        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
        const avgGoalsFor = totalMatches > 0 ? (totalGoalsFor / totalMatches).toFixed(1) : '0.0';
        const avgGoalsAgainst = totalMatches > 0 ? (totalGoalsAgainst / totalMatches).toFixed(1) : '0.0';
        const avgDuration = totalMatches > 0 ? Math.round(totalDuration / totalMatches / 60) : 0;

        return {
            totalMatches,
            wins,
            draws,
            losses,
            winRate,
            totalGoalsFor,
            totalGoalsAgainst,
            avgGoalsFor,
            avgGoalsAgainst,
            avgDuration,
            goalDifference: totalGoalsFor - totalGoalsAgainst
        };
    }

    /**
     * Calculate performance trends
     */
    calculatePerformanceStats(matches) {
        const recentMatches = matches.slice(-10); // Last 10 matches
        const form = recentMatches.map(match => {
            const score1 = parseInt(match.score1) || 0;
            const score2 = parseInt(match.score2) || 0;
            
            if (score1 > score2) return 'W';
            else if (score1 === score2) return 'D';
            else return 'L';
        });

        // Calculate streaks
        let currentStreak = 0;
        let streakType = null;
        
        if (form.length > 0) {
            streakType = form[form.length - 1];
            for (let i = form.length - 1; i >= 0; i--) {
                if (form[i] === streakType) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Home vs Away performance (if venue data available)
        const homeMatches = matches.filter(m => m.venue === 'home' || !m.venue);
        const awayMatches = matches.filter(m => m.venue === 'away');

        return {
            recentForm: form,
            currentStreak,
            streakType,
            homeRecord: this.calculateRecord(homeMatches),
            awayRecord: this.calculateRecord(awayMatches)
        };
    }

    /**
     * Calculate opponent statistics
     */
    calculateOpponentStats(matches) {
        const opponents = {};
        
        matches.forEach(match => {
            const opponent = match.team2Name || 'Unknown';
            if (!opponents[opponent]) {
                opponents[opponent] = {
                    name: opponent,
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    goalsFor: 0,
                    goalsAgainst: 0
                };
            }

            const score1 = parseInt(match.score1) || 0;
            const score2 = parseInt(match.score2) || 0;

            opponents[opponent].played++;
            opponents[opponent].goalsFor += score1;
            opponents[opponent].goalsAgainst += score2;

            if (score1 > score2) opponents[opponent].wins++;
            else if (score1 === score2) opponents[opponent].draws++;
            else opponents[opponent].losses++;
        });

        // Convert to array and sort by games played
        const opponentsList = Object.values(opponents)
            .sort((a, b) => b.played - a.played);

        return {
            totalOpponents: opponentsList.length,
            opponents: opponentsList,
            mostPlayed: opponentsList[0] || null,
            bestRecord: this.findBestOpponentRecord(opponentsList),
            worstRecord: this.findWorstOpponentRecord(opponentsList)
        };
    }

    /**
     * Calculate timeline statistics (goals by time period)
     */
    calculateTimelineStats(matches) {
        const periods = {
            '0-15': 0,
            '16-30': 0,
            '31-45': 0,
            '46-60': 0,
            '61-75': 0,
            '76-90+': 0
        };

        matches.forEach(match => {
            if (match.goals && Array.isArray(match.goals)) {
                match.goals.forEach(goal => {
                    if (goal.team === 'first' && goal.minute) {
                        const minute = parseInt(goal.minute);
                        if (minute <= 15) periods['0-15']++;
                        else if (minute <= 30) periods['16-30']++;
                        else if (minute <= 45) periods['31-45']++;
                        else if (minute <= 60) periods['46-60']++;
                        else if (minute <= 75) periods['61-75']++;
                        else periods['76-90+']++;
                    }
                });
            }
        });

        return periods;
    }

    /**
     * Calculate goal statistics
     */
    calculateGoalStats(matches) {
        let totalGoals = 0;
        let penalties = 0;
        let ownGoals = 0;
        const scorers = {};

        matches.forEach(match => {
            if (match.goals && Array.isArray(match.goals)) {
                match.goals.forEach(goal => {
                    if (goal.team === 'first') {
                        totalGoals++;
                        
                        if (goal.type === 'penalty') penalties++;
                        if (goal.scorer === 'Own Goal') ownGoals++;
                        
                        const scorer = goal.scorer || 'Unknown';
                        if (scorer !== 'Own Goal') {
                            if (!scorers[scorer]) {
                                scorers[scorer] = {
                                    name: scorer,
                                    goals: 0,
                                    assists: 0,
                                    penalties: 0
                                };
                            }
                            scorers[scorer].goals++;
                            if (goal.type === 'penalty') scorers[scorer].penalties++;
                        }

                        // Track assists
                        const assister = goal.assist;
                        if (assister && assister !== 'N/A' && assister !== '') {
                            if (!scorers[assister]) {
                                scorers[assister] = {
                                    name: assister,
                                    goals: 0,
                                    assists: 0,
                                    penalties: 0
                                };
                            }
                            scorers[assister].assists++;
                        }
                    }
                });
            }
        });

        const topScorers = Object.values(scorers)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10);

        const topAssisters = Object.values(scorers)
            .filter(player => player.assists > 0)
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 10);

        return {
            totalGoals,
            penalties,
            ownGoals,
            avgGoalsPerMatch: matches.length > 0 ? (totalGoals / matches.length).toFixed(1) : '0.0',
            topScorers,
            topAssisters,
            uniqueScorers: Object.keys(scorers).length
        };
    }

    /**
     * Calculate player statistics across all matches
     */
    async calculatePlayerStatistics() {
        const matches = await this.getAllMatches();
        const players = {};
        const roster = rosterManager.getRoster();

        // Initialize all roster players
        roster.forEach(player => {
            players[player.name] = {
                name: player.name,
                shirtNumber: player.shirtNumber,
                matchesPlayed: 0,
                goals: 0,
                assists: 0,
                penalties: 0,
                appearances: [],
                goalsPerMatch: 0,
                assistsPerMatch: 0
            };
        });

        matches.forEach(match => {
            // Track attendance
            if (match.attendance && Array.isArray(match.attendance)) {
                match.attendance.forEach(attendanceRecord => {
                    if (attendanceRecord.attending && players[attendanceRecord.playerName]) {
                        players[attendanceRecord.playerName].matchesPlayed++;
                        players[attendanceRecord.playerName].appearances.push({
                            date: match.savedAt || Date.now(),
                            opponent: match.team2Name,
                            result: this.getMatchResult(match)
                        });
                    }
                });
            }

            // Track goals and assists
            if (match.goals && Array.isArray(match.goals)) {
                match.goals.forEach(goal => {
                    if (goal.team === 'first') {
                        const scorer = goal.scorer;
                        const assister = goal.assist;

                        if (scorer && scorer !== 'Own Goal' && players[scorer]) {
                            players[scorer].goals++;
                            if (goal.type === 'penalty') {
                                players[scorer].penalties++;
                            }
                        }

                        if (assister && assister !== 'N/A' && assister !== '' && players[assister]) {
                            players[assister].assists++;
                        }
                    }
                });
            }
        });

        // Calculate per-match averages
        Object.values(players).forEach(player => {
            if (player.matchesPlayed > 0) {
                player.goalsPerMatch = (player.goals / player.matchesPlayed).toFixed(2);
                player.assistsPerMatch = (player.assists / player.matchesPlayed).toFixed(2);
            }
        });

        // Filter out players with no activity and sort
        const activePlayers = Object.values(players)
            .filter(player => player.matchesPlayed > 0 || player.goals > 0 || player.assists > 0)
            .sort((a, b) => {
                // Sort by goals first, then assists, then matches played
                if (b.goals !== a.goals) return b.goals - a.goals;
                if (b.assists !== a.assists) return b.assists - a.assists;
                return b.matchesPlayed - a.matchesPlayed;
            });

        return {
            totalPlayers: activePlayers.length,
            players: activePlayers,
            topScorer: activePlayers[0] || null,
            topAssister: activePlayers.find(p => p.assists > 0) || null,
            mostAppearances: activePlayers.sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0] || null
        };
    }

    /**
     * Helper methods
     */
    calculateRecord(matches) {
        if (matches.length === 0) return { played: 0, wins: 0, draws: 0, losses: 0, winRate: 0 };

        let wins = 0, draws = 0, losses = 0;
        matches.forEach(match => {
            const score1 = parseInt(match.score1) || 0;
            const score2 = parseInt(match.score2) || 0;
            
            if (score1 > score2) wins++;
            else if (score1 === score2) draws++;
            else losses++;
        });

        return {
            played: matches.length,
            wins,
            draws,
            losses,
            winRate: Math.round((wins / matches.length) * 100)
        };
    }

    findBestOpponentRecord(opponents) {
        return opponents
            .filter(opp => opp.played >= 2)
            .sort((a, b) => {
                const aWinRate = a.wins / a.played;
                const bWinRate = b.wins / b.played;
                return bWinRate - aWinRate;
            })[0] || null;
    }

    findWorstOpponentRecord(opponents) {
        return opponents
            .filter(opp => opp.played >= 2)
            .sort((a, b) => {
                const aWinRate = a.wins / a.played;
                const bWinRate = b.wins / b.played;
                return aWinRate - bWinRate;
            })[0] || null;
    }

    getMatchResult(match) {
        const score1 = parseInt(match.score1) || 0;
        const score2 = parseInt(match.score2) || 0;
        
        if (score1 > score2) return 'W';
        else if (score1 === score2) return 'D';
        else return 'L';
    }

    getEmptyStats() {
        return {
            overview: {
                totalMatches: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                winRate: 0,
                totalGoalsFor: 0,
                totalGoalsAgainst: 0,
                avgGoalsFor: '0.0',
                avgGoalsAgainst: '0.0',
                avgDuration: 0,
                goalDifference: 0
            },
            performance: {
                recentForm: [],
                currentStreak: 0,
                streakType: null,
                homeRecord: { played: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
                awayRecord: { played: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
            },
            opponents: {
                totalOpponents: 0,
                opponents: [],
                mostPlayed: null,
                bestRecord: null,
                worstRecord: null
            },
            timeline: {
                '0-15': 0,
                '16-30': 0,
                '31-45': 0,
                '46-60': 0,
                '61-75': 0,
                '76-90+': 0
            },
            goals: {
                totalGoals: 0,
                penalties: 0,
                ownGoals: 0,
                avgGoalsPerMatch: '0.0',
                topScorers: [],
                topAssisters: [],
                uniqueScorers: 0
            }
        };
    }

    /**
     * Create sample match data for testing
     */
    createSampleData() {
        const sampleMatches = [
            {
                team1Name: 'Netherton',
                team2Name: 'City United',
                score1: 2,
                score2: 1,
                goals: [
                    { team: 'first', scorer: 'John Smith', minute: 15, type: 'goal' },
                    { team: 'second', scorer: 'Mike Johnson', minute: 32, type: 'goal' },
                    { team: 'first', scorer: 'David Wilson', minute: 78, type: 'goal' }
                ],
                matchEvents: [],
                gameTime: 4200,
                savedAt: Date.now() - 86400000 // 1 day ago
            },
            {
                team1Name: 'Netherton',
                team2Name: 'Rangers FC',
                score1: 1,
                score2: 1,
                goals: [
                    { team: 'first', scorer: 'John Smith', minute: 25, type: 'goal' },
                    { team: 'second', scorer: 'Tom Brown', minute: 67, type: 'goal' }
                ],
                matchEvents: [],
                gameTime: 4200,
                savedAt: Date.now() - 172800000 // 2 days ago
            }
        ];

        storage.save('savedMatches', sampleMatches);
        return sampleMatches;
    }

    /**
     * Get cached statistics or calculate new ones
     */
    async getStatistics(forceRefresh = false) {
        const cacheAge = Date.now() - (this.lastCalculated || 0);
        const cacheExpired = cacheAge > 300000; // 5 minutes

        if (forceRefresh || !this.cachedStats || cacheExpired) {
            return await this.calculateMatchStatistics();
        }

        return this.cachedStats;
    }

    /**
     * Export statistics as JSON
     */
    async exportStatistics() {
        const stats = await this.getStatistics();
        const playerStats = await this.calculatePlayerStatistics();
        const matches = await this.getAllMatches();
        
        return {
            generatedAt: new Date().toISOString(),
            matchStatistics: stats,
            playerStatistics: playerStats,
            totalMatches: matches.length
        };
    }
}

// Create and export singleton instance
export const statisticsService = new StatisticsService();
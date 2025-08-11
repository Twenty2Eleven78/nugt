/**
 * Statistics Service
 * Analyzes saved matches and provides comprehensive statistics
 * @version 1.0
 */

import { storage } from '../data/storage.js';
import { STORAGE_KEYS } from '../shared/constants.js';
import { rosterManager } from '../match/roster.js';

class StatisticsService {
    constructor() {
        this.cachedStats = null;
        this.lastCalculated = null;
    }

    /**
     * Get all saved matches from storage
     */
    getAllMatches() {
        try {
            const matches = storage.load('savedMatches', []);
            return Array.isArray(matches) ? matches : [];
        } catch (error) {
            console.error('Error loading matches for statistics:', error);
            return [];
        }
    }

    /**
     * Calculate comprehensive match statistics
     */
    calculateMatchStatistics() {
        const matches = this.getAllMatches();
        
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
    calculatePlayerStatistics() {
        const matches = this.getAllMatches();
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
     * Get cached statistics or calculate new ones
     */
    getStatistics(forceRefresh = false) {
        const cacheAge = Date.now() - (this.lastCalculated || 0);
        const cacheExpired = cacheAge > 300000; // 5 minutes

        if (forceRefresh || !this.cachedStats || cacheExpired) {
            return this.calculateMatchStatistics();
        }

        return this.cachedStats;
    }

    /**
     * Export statistics as JSON
     */
    exportStatistics() {
        const stats = this.getStatistics();
        const playerStats = this.calculatePlayerStatistics();
        
        return {
            generatedAt: new Date().toISOString(),
            matchStatistics: stats,
            playerStatistics: playerStats,
            totalMatches: this.getAllMatches().length
        };
    }
}

// Create and export singleton instance
export const statisticsService = new StatisticsService();
/**
 * Sharing and Statistics Service
 * @version 3.3
 */

import { gameState } from '../data/state.js';
import { domCache } from '../shared/dom.js';
import { formatTime } from '../shared/utils.js';
import { getEventIcon } from '../ui/components.js';
import { rosterManager } from '../match/roster.js';

// Statistics and sharing service
class SharingService {
  // Generate match statistics
  generateStats() {
    const goalScorers = new Map();
    const assists = new Map();
    let oppositionGoals = 0;
    let teamGoals = 0;

    // Process goals data
    if (gameState.goals && gameState.goals.length > 0) {
      gameState.goals.forEach(({ goalScorerName, goalAssistName, disallowed }) => {
        // Skip disallowed goals
        if (disallowed) return;

        // Check if the goal scorer matches any historical team 2 name
        if (gameState.team2History.includes(goalScorerName)) {
          oppositionGoals++;
        } else if (gameState.team1History.includes(goalScorerName) || goalScorerName) {
          // Exclude 'N/A' and empty entries
          if (goalScorerName && goalScorerName.trim() !== '' && goalScorerName !== 'N/A') {
            // Count goals for team 1
            teamGoals++;
            goalScorers.set(goalScorerName, (goalScorers.get(goalScorerName) || 0) + 1);
          }

          // Handle assists, excluding 'N/A' and empty entries
          if (goalAssistName && goalAssistName.trim() !== '' && goalAssistName !== 'N/A') {
            assists.set(goalAssistName, (assists.get(goalAssistName) || 0) + 1);
          }
        }
      });
    }

    // Get current team names for the report
    const team1Name = domCache.get('Team1NameElement')?.textContent || 'Team 1';
    const team2Name = domCache.get('Team2NameElement')?.textContent || 'Team 2';

    // Sort goal scorers and assists by count
    const sortedScorers = Array.from(goalScorers.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, goals]) => `${name}: ${goals}`);

    const sortedAssists = Array.from(assists.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, assistCount]) => `${name}: ${assistCount}`);

    // Get attendance data
    const attendanceSummary = rosterManager.getAttendanceSummary();
    const attendingPlayers = attendanceSummary.attendingPlayers.join(', ');
    const absentPlayers = attendanceSummary.absentPlayers.length > 0 ?
      attendanceSummary.absentPlayers.join(', ') : 'None';

    // Prepare stats string
    const scorersString = sortedScorers.length > 0 ? sortedScorers.join(', ') : 'None';
    const assistsString = sortedAssists.length > 0 ? sortedAssists.join(', ') : 'None';

    const statsString = `📊 Match Statistics:\n` +
      `⚽ ${team1Name} Goals: ${teamGoals}\n` +
      `⚽ ${team2Name} Goals: ${oppositionGoals}\n` +
      `🥅 Goal Scorers: ${scorersString}\n` +
      `🎯 Assists: ${assistsString}\n` +
      `👥 Attendance: ${attendanceSummary.attending}/${attendanceSummary.total} (${attendanceSummary.attendanceRate}%)\n` +
      `✅ Present: ${attendingPlayers}\n` +
      `❌ Absent: ${absentPlayers}`;

    return {
      teamGoals,
      oppositionGoals,
      goalScorers: sortedScorers,
      assists: sortedAssists,
      attendance: attendanceSummary,
      statsstring: statsString,
      team1Name,
      team2Name
    };
  }

  // Format match data for WhatsApp sharing
  formatForWhatsApp() {
    const gameTime = formatTime(gameState.seconds);
    const stats = this.generateStats();

    let gameResult = 'DRAW';
    if (stats.teamGoals > stats.oppositionGoals) {
      gameResult = 'WIN';
    } else if (stats.teamGoals < stats.oppositionGoals) {
      gameResult = 'LOSS';
    }

    const header = `⚽ Match Summary: ${stats.team1Name} vs ${stats.team2Name}\n⌚ Game Time: ${gameTime}\n🔢 Result: ${gameResult} (${stats.teamGoals} - ${stats.oppositionGoals})\n\n`;

    const allEvents = [...gameState.goals, ...gameState.matchEvents]
      .sort((a, b) => a.rawTime - b.rawTime)
      .map(event => {
        if (event.type) {
          // Match event
          const icon = getEventIcon(event.type);
          return `${icon} ${event.timestamp}' - ${event.type}${event.score ? ` (${event.score})` : ''}`;
        } else {
          // Goal event
          const isOppositionGoal = event.goalScorerName === stats.team2Name;
          const disallowedText = event.disallowed ? ` (DISALLOWED: ${event.disallowedReason})` : '';
          return isOppositionGoal
            ? `🥅 ${event.timestamp}' - ${stats.team2Name} Goal${disallowedText}`
            : `🥅 ${event.timestamp}' - Goal: ${event.goalScorerName}, Assist: ${event.goalAssistName}${disallowedText}`;
        }
      })
      .join('\n');

    return encodeURIComponent(`${header}${allEvents}\n\n${stats.statsstring}`);
  }

  // Share match report via WhatsApp
  shareViaWhatsApp() {
    try {
      const whatsappText = this.formatForWhatsApp();
      const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      throw new Error('Failed to share match report');
    }
  }

  // Share via Web Share API (if supported)
  async shareViaWebAPI() {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    try {
      const stats = this.generateStats();
      const gameTime = formatTime(gameState.seconds);

      await navigator.share({
        title: `${stats.team1Name} vs ${stats.team2Name} - Match Report`,
        text: `Match finished ${stats.teamGoals}-${stats.oppositionGoals} after ${gameTime}`,
        url: window.location.href
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing via Web Share API:', error);
        throw error;
      }
    }
  }

  // Copy match report to clipboard
  async copyToClipboard() {
    try {
      const whatsappText = decodeURIComponent(this.formatForWhatsApp());
      await navigator.clipboard.writeText(whatsappText);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw new Error('Failed to copy match report to clipboard');
    }
  }

  // Export match data as JSON
  exportAsJSON() {
    const exportData = {
      timestamp: new Date().toISOString(),
      gameState: {
        seconds: gameState.seconds,
        gameTime: gameState.gameTime,
        isSecondHalf: gameState.isSecondHalf,
        goals: gameState.goals,
        matchEvents: gameState.matchEvents,
        team1History: gameState.team1History,
        team2History: gameState.team2History
      },
      attendance: rosterManager.getMatchAttendance(),
      roster: rosterManager.getRoster(),
      stats: this.generateStats()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `match-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(link.href);
  }
}

// Create and export singleton instance
export const sharingService = new SharingService();

// Export convenience methods
export const {
  generateStats,
  formatForWhatsApp,
  shareViaWhatsApp,
  shareViaWebAPI,
  copyToClipboard,
  exportAsJSON
} = sharingService;
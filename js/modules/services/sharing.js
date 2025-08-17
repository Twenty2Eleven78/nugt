/**
 * Sharing and Statistics Service
 * Enhanced match data sharing and statistics generation
 */

import { gameState } from '../data/state.js';
import { domCache } from '../shared/dom.js';
import { formatTime } from '../shared/utils.js';
import { getEventIcon } from '../ui/components.js';
import { attendanceManager } from './attendance.js';

const SHARE_PLATFORMS = {
  WHATSAPP: 'whatsapp',
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  WEB_API: 'web-api',
  CLIPBOARD: 'clipboard'
};

const MATCH_RESULTS = {
  WIN: 'WIN',
  LOSS: 'LOSS',
  DRAW: 'DRAW'
};

const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  TXT: 'txt'
};
class SharingService {
  constructor() {
    this.cachedStats = null;
    this.lastStatsUpdate = 0;
    this.cacheTimeout = 5000; // 5 seconds cache
  }

  generateStats() {
    const now = Date.now();
    if (this.cachedStats && (now - this.lastStatsUpdate) < this.cacheTimeout) {
      return this.cachedStats;
    }

    const { goalScorers, assists, teamGoals, oppositionGoals } = this._processGoalsData();
    const { team1Name, team2Name } = this._getTeamNames();
    const attendanceSummary = this._getAttendanceData();

    const sortedScorers = this._sortAndFormat(goalScorers);
    const sortedAssists = this._sortAndFormat(assists);

    const statsString = this._buildStatsString({
      team1Name, team2Name, teamGoals, oppositionGoals,
      sortedScorers, sortedAssists, attendanceSummary
    });

    this.cachedStats = {
      teamGoals,
      oppositionGoals,
      goalScorers: sortedScorers,
      assists: sortedAssists,
      attendance: attendanceSummary,
      statsstring: statsString,
      team1Name,
      team2Name,
      matchResult: this._getMatchResult(teamGoals, oppositionGoals)
    };

    this.lastStatsUpdate = now;
    return this.cachedStats;
  }

  formatForWhatsApp() {
    const stats = this.generateStats();
    const gameTime = formatTime(gameState.seconds);
    const header = this._buildMatchHeader(stats, gameTime);
    const events = this._formatMatchEvents(stats);

    return encodeURIComponent(`${header}${events}\n\n${stats.statsstring}`);
  }

  formatForTwitter() {
    const stats = this.generateStats();
    const gameTime = formatTime(gameState.seconds);
    const resultEmoji = this._getResultEmoji(stats.matchResult);
    const matchTitle = gameState.matchTitle || null;
    const titleLine = matchTitle ? `🏆 ${matchTitle}\n` : '';

    return encodeURIComponent(
      `${titleLine}${resultEmoji} ${stats.team1Name} ${stats.teamGoals}-${stats.oppositionGoals} ${stats.team2Name}\n` +
      `⏱️ ${gameTime}\n` +
      `⚽ Goals: ${stats.goalScorers.join(', ') || 'None'}\n` +
      `#Football #MatchReport`
    );
  }

  formatForFacebook() {
    const stats = this.generateStats();
    const gameTime = formatTime(gameState.seconds);
    const matchTitle = gameState.matchTitle || null;
    const titleText = matchTitle ? matchTitle : `${stats.team1Name} vs ${stats.team2Name}`;

    return encodeURIComponent(
      `🏆 Match Report: ${titleText}\n\n` +
      `Final Score: ${stats.teamGoals} - ${stats.oppositionGoals}\n` +
      `Game Time: ${gameTime}\n` +
      `Result: ${stats.matchResult}\n\n` +
      `${stats.statsstring}`
    );
  }

  shareViaWhatsApp() {
    try {
      const whatsappText = this.formatForWhatsApp();
      const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
      this._openShareWindow(whatsappUrl, SHARE_PLATFORMS.WHATSAPP);
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      throw new Error('Failed to share match report');
    }
  }

  shareViaTwitter() {
    try {
      const twitterText = this.formatForTwitter();
      const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;
      this._openShareWindow(twitterUrl, SHARE_PLATFORMS.TWITTER);
    } catch (error) {
      console.error('Error sharing via Twitter:', error);
      throw new Error('Failed to share to Twitter');
    }
  }

  shareViaFacebook() {
    try {
      const facebookText = this.formatForFacebook();
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?quote=${facebookText}&u=${encodeURIComponent(window.location.href)}`;
      this._openShareWindow(facebookUrl, SHARE_PLATFORMS.FACEBOOK);
    } catch (error) {
      console.error('Error sharing via Facebook:', error);
      throw new Error('Failed to share to Facebook');
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

  exportAsJSON() {
    const exportData = this._buildExportData();
    this._downloadFile(exportData, EXPORT_FORMATS.JSON);
  }

  exportAsCSV() {
    const stats = this.generateStats();
    const csvData = this._buildCSVData(stats);
    this._downloadFile(csvData, EXPORT_FORMATS.CSV);
  }

  exportAsText() {
    const whatsappText = decodeURIComponent(this.formatForWhatsApp());
    this._downloadFile(whatsappText, EXPORT_FORMATS.TXT);
  }

  // Enhanced sharing with platform detection
  async shareMatch(platform = null) {
    if (!platform) {
      platform = this._detectBestPlatform();
    }

    switch (platform) {
      case SHARE_PLATFORMS.WHATSAPP:
        return this.shareViaWhatsApp();
      case SHARE_PLATFORMS.TWITTER:
        return this.shareViaTwitter();
      case SHARE_PLATFORMS.FACEBOOK:
        return this.shareViaFacebook();
      case SHARE_PLATFORMS.WEB_API:
        return await this.shareViaWebAPI();
      case SHARE_PLATFORMS.CLIPBOARD:
        return await this.copyToClipboard();
      default:
        throw new Error(`Unsupported sharing platform: ${platform}`);
    }
  }

  // Clear cached stats (useful when match data changes)
  clearCache() {
    this.cachedStats = null;
    this.lastStatsUpdate = 0;
  }

  async shareData(text, title) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
            });
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing data:', error);
                throw error;
            }
            return false;
        }
    } else {
        try {
            await navigator.clipboard.writeText(text);
            // Consider showing a notification that the text was copied.
            console.log('Copied to clipboard');
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            throw new Error('Failed to copy data to clipboard');
        }
    }
  }

  // Private helper methods
  _processGoalsData() {
    const goalScorers = new Map();
    const assists = new Map();
    let oppositionGoals = 0;
    let teamGoals = 0;

    if (gameState.goals?.length > 0) {
      gameState.goals.forEach(({ goalScorerName, goalAssistName, disallowed }) => {
        if (disallowed) return;

        if (gameState.team2History.includes(goalScorerName)) {
          oppositionGoals++;
        } else if (this._isValidPlayer(goalScorerName)) {
          teamGoals++;
          goalScorers.set(goalScorerName, (goalScorers.get(goalScorerName) || 0) + 1);

          if (this._isValidPlayer(goalAssistName)) {
            assists.set(goalAssistName, (assists.get(goalAssistName) || 0) + 1);
          }
        }
      });
    }

    return { goalScorers, assists, teamGoals, oppositionGoals };
  }

  _getTeamNames() {
    return {
      team1Name: domCache.get('Team1NameElement')?.textContent || 'Team 1',
      team2Name: domCache.get('Team2NameElement')?.textContent || 'Team 2'
    };
  }

  _getAttendanceData() {
    const attendanceSummary = attendanceManager.getAttendanceSummary();
    return {
      ...attendanceSummary,
      attendingPlayers: attendanceSummary.attendingPlayers.join(', '),
      absentPlayers: attendanceSummary.absentPlayers.length > 0 ?
        attendanceSummary.absentPlayers.join(', ') : 'None'
    };
  }

  _sortAndFormat(dataMap) {
    return Array.from(dataMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `${name}: ${count}`);
  }

  _buildStatsString({ team1Name, team2Name, teamGoals, oppositionGoals, sortedScorers, sortedAssists, attendanceSummary }) {
    const scorersString = sortedScorers.length > 0 ? sortedScorers.join(', ') : 'None';
    const assistsString = sortedAssists.length > 0 ? sortedAssists.join(', ') : 'None';

    return `📊 Match Statistics:\n` +
      `⚽ ${team1Name} Goals: ${teamGoals}\n` +
      `⚽ ${team2Name} Goals: ${oppositionGoals}\n` +
      `🥅 Goal Scorers: ${scorersString}\n` +
      `🎯 Assists: ${assistsString}\n` +
      `👥 Attendance: ${attendanceSummary.attending}/${attendanceSummary.total} (${attendanceSummary.attendanceRate}%)\n` +
      `✅ Present: ${attendanceSummary.attendingPlayers}\n` +
      `❌ Absent: ${attendanceSummary.absentPlayers}`;
  }

  _getMatchResult(teamGoals, oppositionGoals) {
    if (teamGoals > oppositionGoals) return MATCH_RESULTS.WIN;
    if (teamGoals < oppositionGoals) return MATCH_RESULTS.LOSS;
    return MATCH_RESULTS.DRAW;
  }

  _buildMatchHeader(stats, gameTime) {
    const matchTitle = gameState.matchTitle || null;
    const titleLine = matchTitle ? `🏆 ${matchTitle}\n` : '';
    
    return `${titleLine}⚽ Match Summary: ${stats.team1Name} vs ${stats.team2Name}\n` +
      `⌚ Game Time: ${gameTime}\n` +
      `🔢 Result: ${stats.matchResult} (${stats.teamGoals} - ${stats.oppositionGoals})\n\n`;
  }

  _formatMatchEvents(stats) {
    return [...gameState.goals, ...gameState.matchEvents]
      .sort((a, b) => a.rawTime - b.rawTime)
      .map(event => {
        if (event.type) {
          const icon = getEventIcon(event.type);
          return `${icon} ${event.timestamp}' - ${event.type}${event.score ? ` (${event.score})` : ''}`;
        } else {
          const isOppositionGoal = event.goalScorerName === stats.team2Name;
          const disallowedText = event.disallowed ? ` (DISALLOWED: ${event.disallowedReason})` : '';
          return isOppositionGoal
            ? `🥅 ${event.timestamp}' - ${stats.team2Name} Goal${disallowedText}`
            : `🥅 ${event.timestamp}' - Goal: ${event.goalScorerName}, Assist: ${event.goalAssistName}${disallowedText}`;
        }
      })
      .join('\n');
  }

  _getResultEmoji(result) {
    switch (result) {
      case MATCH_RESULTS.WIN: return '🏆';
      case MATCH_RESULTS.LOSS: return '😔';
      case MATCH_RESULTS.DRAW: return '🤝';
      default: return '⚽';
    }
  }

  _openShareWindow(url, platform) {
    const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes';
    const shareWindow = window.open(url, `share_${platform}`, windowFeatures);

    if (!shareWindow) {
      throw new Error('Popup blocked. Please allow popups for sharing.');
    }
  }

  _buildExportData() {
    return {
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
      attendance: attendanceManager.getMatchAttendance(),
      stats: this.generateStats()
    };
  }

  _buildCSVData(stats) {
    const headers = ['Player', 'Goals', 'Assists'];
    
    // Optimized: Single-pass data collection (O(n) instead of O(n²))
    const playerData = new Map();
    
    // Process goal scorers
    for (const scorer of stats.goalScorers) {
      const [name, count] = scorer.split(':');
      const playerName = name.trim();
      playerData.set(playerName, { 
        goals: count.trim(), 
        assists: playerData.get(playerName)?.assists || '0' 
      });
    }
    
    // Process assists
    for (const assist of stats.assists) {
      const [name, count] = assist.split(':');
      const playerName = name.trim();
      const existing = playerData.get(playerName) || { goals: '0', assists: '0' };
      existing.assists = count.trim();
      playerData.set(playerName, existing);
    }

    // Build CSV rows
    const rows = [headers.join(',')];
    for (const [player, data] of playerData) {
      rows.push(`${player},${data.goals},${data.assists}`);
    }

    return rows.join('\n');
  }

  _downloadFile(data, format) {
    const timestamp = new Date().toISOString().split('T')[0];
    let content, mimeType, filename;

    switch (format) {
      case EXPORT_FORMATS.JSON:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename = `match-report-${timestamp}.json`;
        break;
      case EXPORT_FORMATS.CSV:
        content = data;
        mimeType = 'text/csv';
        filename = `match-stats-${timestamp}.csv`;
        break;
      case EXPORT_FORMATS.TXT:
        content = data;
        mimeType = 'text/plain';
        filename = `match-report-${timestamp}.txt`;
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  _detectBestPlatform() {
    if (navigator.share) return SHARE_PLATFORMS.WEB_API;
    if (navigator.userAgent.includes('WhatsApp')) return SHARE_PLATFORMS.WHATSAPP;
    if (navigator.clipboard) return SHARE_PLATFORMS.CLIPBOARD;
    return SHARE_PLATFORMS.WHATSAPP; // Default fallback
  }

  _isValidPlayer(name) {
    return name && name.trim() !== '' && name !== 'N/A';
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
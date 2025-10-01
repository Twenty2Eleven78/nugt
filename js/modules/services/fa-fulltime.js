/**
 * FA Full-Time League Table Integration
 * Fetches league tables from FA Full-Time URLs
 * @version 4.0
 */

import { configService } from './config.js';

class FAFullTimeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Extract league table from FA Full-Time URL
  async getLeagueTable(url) {
    // Check if league table integration is enabled
    const integrationConfig = configService.getIntegrationConfig('leagueTable');
    if (!integrationConfig || !integrationConfig.enabled) {
      throw new Error('League table integration is disabled in configuration');
    }

    if (!url || !this.isValidFAUrl(url)) {
      throw new Error('Invalid FA Full-Time URL');
    }

    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Get CORS proxies from configuration
      const corsProxies = integrationConfig.corsProxies || [
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/get?url='
      ];
      
      // Build proxy URLs
      const proxies = corsProxies.map(proxy => {
        if (proxy.includes('allorigins')) {
          return `${proxy}${encodeURIComponent(url)}`;
        } else if (proxy.endsWith('?')) {
          return `${proxy}${encodeURIComponent(url)}`;
        } else {
          return `${proxy}${url}`;
        }
      });
      
      let html = null;
      let lastError = null;
      
      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl);
          if (response.ok) {
            if (proxyUrl.includes('allorigins')) {
              const data = await response.json();
              html = data.contents;
            } else {
              html = await response.text();
            }
            break;
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      
      if (!html) {
        throw lastError || new Error('All proxy services failed');
      }
      

      
      const leagueTable = this.parseLeagueTable(html);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: leagueTable,
        timestamp: Date.now()
      });

      return leagueTable;
    } catch (error) {
      
      // Fallback: Show manual entry option
      throw new Error(`FA Full-Time uses dynamic loading. Please try copying the table data manually or use a different league table source.`);
    }
  }

  // Parse HTML to extract league table
  parseLeagueTable(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for league table in tab-2 div
    const tab2 = doc.querySelector('.tab-2');
    let table = null;
    
    if (tab2) {
      table = tab2.querySelector('table');
      if (!table) {
        const tables = tab2.querySelectorAll('table');
        for (const t of tables) {
          const rows = t.querySelectorAll('tr');
          if (rows.length > 3) {
            table = t;
            break;
          }
        }
      }
    }
    
    if (!table) {
      const tableSelectors = ['table', '.table', '[class*="table"]'];
      for (const selector of tableSelectors) {
        const tables = doc.querySelectorAll(selector);
        for (const t of tables) {
          const rows = t.querySelectorAll('tr');
          if (rows.length > 3) {
            table = t;
            break;
          }
        }
        if (table) break;
      }
    }

    if (!table) {
      // Try to find any table with team data
      const allTables = doc.querySelectorAll('table');
      for (const t of allTables) {
        const text = t.textContent.toLowerCase();
        if (text.includes('played') || text.includes('points') || text.includes('pos')) {
          table = t;
          break;
        }
      }
    }

    if (!table) {
      throw new Error('League table not found on page');
    }

    return this.extractTableData(table);
  }

  // Extract table data from DOM
  extractTableData(table) {
    const rows = table.querySelectorAll('tr');
    const teams = [];
    let headerSkipped = false;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td, th');
      
      if (cells.length < 4) continue;
      

      
      // Skip header row
      const firstCellText = this.extractText(cells[0]).toLowerCase();
      if (firstCellText.includes('pos') || firstCellText.includes('team') || firstCellText.includes('#')) {
        headerSkipped = true;
        continue;
      }
      
      const team = this.parseTeamRow(cells, teams.length);
      if (team && team.team && team.team.length > 1) {
        teams.push(team);
      }
    }


    
    if (teams.length === 0) {
      throw new Error('No valid team data found in table');
    }

    return {
      teams,
      lastUpdated: new Date().toISOString(),
      source: 'FA Full-Time'
    };
  }

  // Parse individual team row
  parseTeamRow(cells, position) {
    try {
      // Standard FA Full-Time format: Pos | Team | P | W | D | L | GF | GA | GD | Pts
      const teamName = this.extractText(cells[1] || cells[0]);
      const played = parseInt(this.extractText(cells[2])) || 0;
      const won = parseInt(this.extractText(cells[13])) || 0;
      const drawn = parseInt(this.extractText(cells[14])) || 0;
      const lost = parseInt(this.extractText(cells[15])) || 0;
      const goalsFor = parseInt(this.extractText(cells[16])) || 0;
      const goalsAgainst = parseInt(this.extractText(cells[17])) || 0;
      const goalDifference = parseInt(this.extractText(cells[18])) || (goalsFor - goalsAgainst);
      const points = parseInt(this.extractText(cells[19])) || 0;

      if (!teamName || teamName.toLowerCase().includes('team')) return null;

      return {
        position: position + 1,
        team: teamName,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points
      };
    } catch (error) {
      return null;
    }
  }

  // Extract text from cell
  extractText(cell) {
    if (!cell) return '';
    return cell.textContent?.trim() || '';
  }

  // Validate FA Full-Time URL
  isValidFAUrl(url) {
    return url.includes('fulltime.thefa.com') || 
           url.includes('fa-fulltime.com') ||
           url.includes('thefa.com');
  }

  // Find team in league table
  findTeam(leagueTable, teamName) {
    if (!leagueTable?.teams) return null;
    
    const searchName = teamName.toLowerCase();
    return leagueTable.teams.find(team => 
      team.team.toLowerCase().includes(searchName) ||
      searchName.includes(team.team.toLowerCase())
    );
  }

  // Get league table HTML for display
  renderLeagueTable(leagueTable, highlightTeam = null) {
    if (!leagueTable?.teams) {
      return '<div class="alert alert-warning">No league table data available</div>';
    }

    const highlightName = highlightTeam?.toLowerCase();

    return `
      <div class="table-responsive" style="overflow-y: auto;">
        <table class="table table-sm table-hover" style="font-size: 0.8rem;">
          <thead class="table-light sticky-top">
            <tr>
              <th style="width: 30px; padding: 0.25rem;">Pos</th>
              <th style="padding: 0.25rem;">Team & Stats</th>
            </tr>
          </thead>
          <tbody>
            ${leagueTable.teams.map(team => {
              const isHighlighted = highlightName && 
                team.team.toLowerCase().includes(highlightName);
              const rowClass = isHighlighted ? 'table-success fw-bold' : '';
              
              return `
                <tr class="${rowClass}">
                  <td class="text-center" style="padding: 0.25rem;">${team.position}</td>
                  <td style="padding: 0.25rem;">
                    <div style="font-weight: 600; font-size: 0.85rem;">${this.escapeHtml(team.team)} <span style="font-weight: 700; color: var(--theme-primary);">(${team.points}pts)</span></div>
                    <div style="font-size: 0.7rem; color: #6c757d;">${team.played}P ${team.won}W ${team.drawn}D ${team.lost}L | ${team.goalsFor}-${team.goalsAgainst} <span class="${team.goalDifference >= 0 ? 'text-success' : 'text-danger'}">(${team.goalDifference >= 0 ? '+' : ''}${team.goalDifference})</span></div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <small class="text-muted">
          <i class="fas fa-clock me-1"></i>
          Last updated: ${new Date(leagueTable.lastUpdated).toLocaleString()}
        </small>
      </div>
    `;
  }

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get default league table URL from configuration
  getDefaultLeagueUrl() {
    const integrationConfig = configService.getIntegrationConfig('leagueTable');
    return integrationConfig?.defaultUrl || null;
  }

  // Check if league table integration is enabled
  isIntegrationEnabled() {
    const integrationConfig = configService.getIntegrationConfig('leagueTable');
    return integrationConfig?.enabled === true;
  }

  // Get configured CORS proxies
  getCorsProxies() {
    const integrationConfig = configService.getIntegrationConfig('leagueTable');
    return integrationConfig?.corsProxies || [
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/get?url='
    ];
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export const faFullTimeService = new FAFullTimeService();
/**
 * Team Name Updater Service
 * Handles dynamic updating of team names throughout the UI
 * @version 1.0
 */

import { configService } from './config.js';

class TeamNameUpdaterService {
  constructor() {
    this.isInitialized = false;
    this.originalTeamNames = new Map();
    
    // Bind methods to preserve context
    this.handleConfigChange = this.handleConfigChange.bind(this);
  }

  /**
   * Initialize the team name updater service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Wait for config to be loaded
      if (!configService.isConfigLoaded()) {
        await configService.loadConfig();
      }
      
      // Store original team names for fallback
      this.storeOriginalTeamNames();
      
      // Apply initial team names
      this.updateTeamNames();
      
      // Listen for configuration changes
      configService.onConfigChange(this.handleConfigChange);
      
      this.isInitialized = true;
      console.log('Team name updater service initialized successfully');
      
    } catch (error) {
      console.error('Error initializing team name updater service:', error);
    }
  }

  /**
   * Update all team name references in the UI
   */
  updateTeamNames() {
    try {
      const teamConfig = configService.getTeamConfig();
      
      if (!teamConfig) {
        console.warn('No team configuration available, using defaults');
        return;
      }

      // Update page title
      this.updatePageTitle(teamConfig);
      
      // Update team name buttons in scoreboard
      this.updateScoreboardTeamNames(teamConfig);
      
      // Update goal button labels
      this.updateGoalButtonLabels(teamConfig);
      
      // Update PWA meta tags
      this.updatePWAMetaTags(teamConfig);
      
      console.log('Team names updated successfully');
      
    } catch (error) {
      console.error('Error updating team names:', error);
    }
  }

  /**
   * Update the page title
   * @param {Object} teamConfig - Team configuration
   */
  updatePageTitle(teamConfig) {
    try {
      const currentTitle = document.title;
      
      // Store original title if not already stored
      if (!this.originalTeamNames.has('pageTitle')) {
        this.originalTeamNames.set('pageTitle', currentTitle);
      }
      
      // Create new title using team abbreviation or short name
      const teamIdentifier = teamConfig.abbreviation || teamConfig.shortName || teamConfig.name;
      const newTitle = `${teamIdentifier} GameTime App v4.0`;
      
      document.title = newTitle;
      
    } catch (error) {
      console.error('Error updating page title:', error);
    }
  }

  /**
   * Update team name buttons in the scoreboard
   * @param {Object} teamConfig - Team configuration
   */
  updateScoreboardTeamNames(teamConfig) {
    try {
      // Update first team (home team) button
      const firstTeamBtn = document.getElementById('first-team-name');
      if (firstTeamBtn) {
        // Store original text if not already stored
        if (!this.originalTeamNames.has('firstTeam')) {
          this.originalTeamNames.set('firstTeam', firstTeamBtn.textContent);
        }
        
        firstTeamBtn.textContent = teamConfig.shortName || teamConfig.name;
      }

      // Update second team (away team) button - use default opponent name
      const secondTeamBtn = document.getElementById('second-team-name');
      if (secondTeamBtn) {
        // Store original text if not already stored
        if (!this.originalTeamNames.has('secondTeam')) {
          this.originalTeamNames.set('secondTeam', secondTeamBtn.textContent);
        }
        
        secondTeamBtn.textContent = teamConfig.defaultOpponentName || 'Opposition Team';
      }
      
    } catch (error) {
      console.error('Error updating scoreboard team names:', error);
    }
  }

  /**
   * Update goal button labels to reflect team names
   * @param {Object} teamConfig - Team configuration
   */
  updateGoalButtonLabels(teamConfig) {
    try {
      // Update Team1 Goal button
      const goalButton = document.getElementById('goalButton');
      if (goalButton) {
        const btnText = goalButton.querySelector('.btn-text');
        if (btnText) {
          // Store original text if not already stored
          if (!this.originalTeamNames.has('goalButton')) {
            this.originalTeamNames.set('goalButton', btnText.textContent);
          }
          
          const teamName = teamConfig.shortName || teamConfig.name;
          btnText.textContent = `${teamName} Goal`;
        }
      }

      // Update Team2 Goal button
      const opGoalButton = document.getElementById('opgoalButton');
      if (opGoalButton) {
        const btnText = opGoalButton.querySelector('.btn-text');
        if (btnText) {
          // Store original text if not already stored
          if (!this.originalTeamNames.has('opGoalButton')) {
            this.originalTeamNames.set('opGoalButton', btnText.textContent);
          }
          
          const opponentName = teamConfig.defaultOpponentName || 'Opposition Team';
          // Use a shorter version for button if opponent name is long
          const shortOpponentName = opponentName.length > 12 ? 'Away' : opponentName;
          btnText.textContent = `${shortOpponentName} Goal`;
        }
      }
      
    } catch (error) {
      console.error('Error updating goal button labels:', error);
    }
  }

  /**
   * Update PWA meta tags with team information
   * @param {Object} teamConfig - Team configuration
   */
  updatePWAMetaTags(teamConfig) {
    try {
      // Update apple-mobile-web-app-title
      let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitleMeta) {
        // Store original content if not already stored
        if (!this.originalTeamNames.has('appleTitle')) {
          this.originalTeamNames.set('appleTitle', appleTitleMeta.content);
        }
        
        appleTitleMeta.content = teamConfig.abbreviation || teamConfig.shortName;
      }
      
    } catch (error) {
      console.error('Error updating PWA meta tags:', error);
    }
  }

  /**
   * Handle configuration changes
   * @param {Object} newConfig - New configuration object
   */
  handleConfigChange(newConfig) {
    try {
      console.log('Team name updater: Configuration changed, updating team names');
      this.updateTeamNames();
    } catch (error) {
      console.error('Error handling configuration change in team name updater:', error);
    }
  }

  /**
   * Store original team names for fallback
   */
  storeOriginalTeamNames() {
    try {
      // This will be populated as elements are updated
      // Original values are stored in the update methods
    } catch (error) {
      console.error('Error storing original team names:', error);
    }
  }

  /**
   * Revert to original team names
   */
  revertToOriginals() {
    try {
      // Revert page title
      const originalTitle = this.originalTeamNames.get('pageTitle');
      if (originalTitle) {
        document.title = originalTitle;
      }

      // Revert first team button
      const firstTeamBtn = document.getElementById('first-team-name');
      const originalFirstTeam = this.originalTeamNames.get('firstTeam');
      if (firstTeamBtn && originalFirstTeam) {
        firstTeamBtn.textContent = originalFirstTeam;
      }

      // Revert second team button
      const secondTeamBtn = document.getElementById('second-team-name');
      const originalSecondTeam = this.originalTeamNames.get('secondTeam');
      if (secondTeamBtn && originalSecondTeam) {
        secondTeamBtn.textContent = originalSecondTeam;
      }

      // Revert goal buttons
      const goalButton = document.getElementById('goalButton');
      const originalGoalButton = this.originalTeamNames.get('goalButton');
      if (goalButton && originalGoalButton) {
        const btnText = goalButton.querySelector('.btn-text');
        if (btnText) {
          btnText.textContent = originalGoalButton;
        }
      }

      const opGoalButton = document.getElementById('opgoalButton');
      const originalOpGoalButton = this.originalTeamNames.get('opGoalButton');
      if (opGoalButton && originalOpGoalButton) {
        const btnText = opGoalButton.querySelector('.btn-text');
        if (btnText) {
          btnText.textContent = originalOpGoalButton;
        }
      }

      // Revert apple title meta
      const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      const originalAppleTitle = this.originalTeamNames.get('appleTitle');
      if (appleTitleMeta && originalAppleTitle) {
        appleTitleMeta.content = originalAppleTitle;
      }

      console.log('Reverted to original team names');
      
    } catch (error) {
      console.error('Error reverting to original team names:', error);
    }
  }

  /**
   * Get current team name updater status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      storedOriginals: Array.from(this.originalTeamNames.keys())
    };
  }

  /**
   * Cleanup method for service shutdown
   */
  cleanup() {
    try {
      // Remove config change listener
      configService.offConfigChange(this.handleConfigChange);
      
      // Revert to originals
      this.revertToOriginals();
      
      // Clear stored data
      this.originalTeamNames.clear();
      this.isInitialized = false;
      
      console.log('Team name updater service cleaned up');
      
    } catch (error) {
      console.error('Error during team name updater cleanup:', error);
    }
  }
}

// Create and export singleton instance
export const teamNameUpdaterService = new TeamNameUpdaterService();
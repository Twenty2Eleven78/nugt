/**
 * Team Branding Module
 * Handles dynamic team branding based on configuration
 */

import { config } from '../shared/config.js';

/**
 * Update team names in the UI based on configuration
 */
export function updateTeamNames() {
  const team1Name = config.get('team.defaultTeam1Name', 'Netherton');
  const team2Name = config.get('team.defaultTeam2Name', 'Opposition');

  // Update scoreboard team names
  const team1Button = document.getElementById('first-team-name');
  const team2Button = document.getElementById('second-team-name');

  if (team1Button) {
    team1Button.textContent = team1Name;
  }

  if (team2Button) {
    team2Button.textContent = team2Name;
  }

  // Update goal button labels
  const goalButton = document.getElementById('goalButton');
  const opGoalButton = document.getElementById('opgoalButton');

  if (goalButton) {
    const btnText = goalButton.querySelector('.btn-text');
    if (btnText) {
      btnText.textContent = `${team1Name} Goal`;
    }
  }

  if (opGoalButton) {
    const btnText = opGoalButton.querySelector('.btn-text');
    if (btnText) {
      btnText.textContent = `${team2Name} Goal`;
    }
  }

  console.log(`Team names updated: ${team1Name} vs ${team2Name}`);
}

/**
 * Update app logo and branding
 */
export function updateAppBranding() {
  const appName = config.get('app.name', 'NUFC GameTime');
  
  // Update logo alt text
  const logo = document.querySelector('img[src="nugtlogo.png"]');
  if (logo) {
    logo.alt = `${appName} logo`;
  }

  // Update any other branding elements as needed
}

/**
 * Apply default theme from configuration
 */
export async function applyDefaultTheme() {
  const defaultTheme = config.get('ui.theme.defaultTheme', 'red');
  
  // Check if there's a saved theme
  const savedTheme = localStorage.getItem('app-theme');
  
  try {
    const { default: themeManager } = await import('../shared/theme-manager.js');
    
    if (!savedTheme) {
      // No saved theme, apply config default
      if (themeManager && themeManager.changeTheme) {
        themeManager.changeTheme(defaultTheme);
        console.log(`✓ Default theme applied from config: ${defaultTheme}`);
      }
    } else {
      // There's a saved theme, but check if it matches config
      if (savedTheme !== defaultTheme) {
        console.log(`ℹ Using saved theme: ${savedTheme}, config suggests: ${defaultTheme}`);
        console.log(`ℹ To use config theme, clear localStorage or change theme manually`);
      } else {
        console.log(`✓ Saved theme matches config: ${savedTheme}`);
      }
    }
  } catch (error) {
    console.warn('Could not apply default theme from config:', error);
  }

  // Update theme-color meta tag with the theme's primary color
  updateThemeColorMeta(defaultTheme);
}

/**
 * Force apply theme from config (ignores saved theme)
 */
export async function forceApplyConfigTheme() {
  const defaultTheme = config.get('ui.theme.defaultTheme', 'red');
  
  try {
    const { default: themeManager } = await import('../shared/theme-manager.js');
    if (themeManager && themeManager.changeTheme) {
      themeManager.changeTheme(defaultTheme);
      console.log(`✓ Config theme force applied: ${defaultTheme}`);
    }
  } catch (error) {
    console.warn('Could not force apply config theme:', error);
  }
}

/**
 * Update theme-color meta tag based on theme
 */
function updateThemeColorMeta(themeName) {
  const themeColors = {
    red: '#dc3545',
    blue: '#007bff',
    green: '#28a745',
    purple: '#6f42c1',
    orange: '#fd7e14',
    yellow: '#ffc107',
    cyan: '#17a2b8',
    pink: '#e83e8c'
  };

  const themeColor = themeColors[themeName] || themeColors.red;
  
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.content = themeColor;
  }
}

/**
 * Initialize all team branding
 */
export async function initTeamBranding() {
  // Wait a bit for DOM to be ready
  setTimeout(async () => {
    updateTeamNames();
    updateAppBranding();
    await applyDefaultTheme();
    
    console.log('Team branding initialization complete');
  }, 100);
}

/**
 * Update branding when configuration changes
 */
export function refreshBranding() {
  initTeamBranding();
}

/**
 * Apply default theme immediately (for testing)
 */
export function applyDefaultThemeNow() {
  applyDefaultTheme();
}
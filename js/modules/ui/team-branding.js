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
 * Apply team colors to the UI
 */
export function applyTeamColors() {
  const primaryColor = config.get('team.clubColors.primary', '#dc3545');
  const secondaryColor = config.get('team.clubColors.secondary', '#ffffff');

  // Create or update CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--team-primary-color', primaryColor);
  root.style.setProperty('--team-secondary-color', secondaryColor);

  // Update theme-color meta tag
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.content = primaryColor;
  }

  console.log(`Team colors applied: Primary ${primaryColor}, Secondary ${secondaryColor}`);
}

/**
 * Initialize all team branding
 */
export function initTeamBranding() {
  updateTeamNames();
  updateAppBranding();
  applyTeamColors();
}

/**
 * Update branding when configuration changes
 */
export function refreshBranding() {
  initTeamBranding();
}
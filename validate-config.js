#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates config.json files for GameTime app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateConfig(configPath = './config.json') {
  console.log('🔍 Validating GameTime configuration...\n');

  try {
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      console.error('❌ Configuration file not found:', configPath);
      return false;
    }

    // Parse JSON
    const configContent = fs.readFileSync(configPath, 'utf8');
    let config;
    
    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      console.error('❌ Invalid JSON syntax:', parseError.message);
      return false;
    }

    console.log('✅ JSON syntax is valid');

    // Validate structure
    const errors = [];
    const warnings = [];

    // Required sections
    const requiredSections = ['app', 'team', 'match', 'ui', 'features'];
    for (const section of requiredSections) {
      if (!config[section]) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // App validation
    if (config.app) {
      if (!config.app.name) errors.push('Missing app.name');
      if (!config.app.shortName) errors.push('Missing app.shortName');
      if (config.app.shortName && config.app.shortName.length > 4) {
        warnings.push('app.shortName should be 4 characters or less');
      }
      if (!config.app.version) warnings.push('Missing app.version');
    }

    // Team validation
    if (config.team) {
      if (!config.team.defaultTeam1Name) errors.push('Missing team.defaultTeam1Name');
      if (!config.team.defaultTeam2Name) warnings.push('Missing team.defaultTeam2Name');
      if (!config.team.clubName) warnings.push('Missing team.clubName');
      if (config.team.season && typeof config.team.season !== 'string') {
        warnings.push('team.season should be a string');
      }
      if (config.team.ageGroup && typeof config.team.ageGroup !== 'string') {
        warnings.push('team.ageGroup should be a string');
      }
    }

    // Roster validation
    if (config.roster) {
      if (config.roster.defaultPlayers && !Array.isArray(config.roster.defaultPlayers)) {
        errors.push('roster.defaultPlayers should be an array');
      }
      if (config.roster.defaultPlayers && Array.isArray(config.roster.defaultPlayers)) {
        config.roster.defaultPlayers.forEach((player, index) => {
          if (!player.name || typeof player.name !== 'string') {
            warnings.push(`roster.defaultPlayers[${index}] missing or invalid name`);
          }
          if (player.shirtNumber !== null && (typeof player.shirtNumber !== 'number' || player.shirtNumber < 1 || player.shirtNumber > 99)) {
            warnings.push(`roster.defaultPlayers[${index}] invalid shirt number (should be 1-99 or null)`);
          }
        });
      }
      if (config.roster.maxPlayers && (typeof config.roster.maxPlayers !== 'number' || config.roster.maxPlayers < 1)) {
        warnings.push('roster.maxPlayers should be a positive number');
      }
      if (config.roster.allowDuplicateNumbers && typeof config.roster.allowDuplicateNumbers !== 'boolean') {
        warnings.push('roster.allowDuplicateNumbers should be a boolean');
      }
      if (config.roster.autoSort && typeof config.roster.autoSort !== 'boolean') {
        warnings.push('roster.autoSort should be a boolean');
      }
    }

    // Match validation
    if (config.match) {
      if (!config.match.defaultGameTime) errors.push('Missing match.defaultGameTime');
      if (config.match.defaultGameTime && (config.match.defaultGameTime < 600 || config.match.defaultGameTime > 7200)) {
        warnings.push('match.defaultGameTime should be between 600 (10 min) and 7200 (120 min) seconds');
      }
      
      if (!config.match.gameDurations) warnings.push('Missing match.gameDurations');
      if (!config.match.timerUpdateInterval) warnings.push('Missing match.timerUpdateInterval');
      if (!config.match.autoSaveInterval) warnings.push('Missing match.autoSaveInterval');
    }

    // UI validation
    if (config.ui) {
      if (!config.ui.theme) warnings.push('Missing ui.theme');
      if (config.ui.theme && config.ui.theme.defaultTheme) {
        const validThemes = ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'cyan', 'pink'];
        if (!validThemes.includes(config.ui.theme.defaultTheme)) {
          warnings.push(`ui.theme.defaultTheme should be one of: ${validThemes.join(', ')}`);
        }
      }
      if (!config.ui.notifications) warnings.push('Missing ui.notifications');
      if (!config.ui.debounceDelay) warnings.push('Missing ui.debounceDelay');
    }

    // Events validation
    if (config.events) {
      if (config.events.customEventTypes && typeof config.events.customEventTypes !== 'object') {
        warnings.push('events.customEventTypes should be an object');
      }
      if (config.events.enabledEventTypes && !Array.isArray(config.events.enabledEventTypes)) {
        warnings.push('events.enabledEventTypes should be an array');
      }
      if (config.events.eventIcons && typeof config.events.eventIcons !== 'object') {
        warnings.push('events.eventIcons should be an object');
      }
    }

    // Sharing validation
    if (config.sharing) {
      if (config.sharing.enabledPlatforms && !Array.isArray(config.sharing.enabledPlatforms)) {
        warnings.push('sharing.enabledPlatforms should be an array');
      }
      if (config.sharing.defaultMessage && typeof config.sharing.defaultMessage !== 'string') {
        warnings.push('sharing.defaultMessage should be a string');
      }
      const booleanSharingFields = ['includeScore', 'includeEvents', 'includeStatistics'];
      booleanSharingFields.forEach(field => {
        if (config.sharing[field] !== undefined && typeof config.sharing[field] !== 'boolean') {
          warnings.push(`sharing.${field} should be a boolean`);
        }
      });
    }

    // Enhanced UI validation
    if (config.ui) {
      if (!config.ui.theme) warnings.push('Missing ui.theme');
      if (config.ui.theme && config.ui.theme.defaultTheme) {
        const validThemes = ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'cyan', 'pink'];
        if (!validThemes.includes(config.ui.theme.defaultTheme)) {
          warnings.push(`ui.theme.defaultTheme should be one of: ${validThemes.join(', ')}`);
        }
      }
      if (!config.ui.notifications) warnings.push('Missing ui.notifications');
      if (config.ui.animations) {
        const validSpeeds = ['fast', 'normal', 'slow'];
        if (config.ui.animations.animationSpeed && !validSpeeds.includes(config.ui.animations.animationSpeed)) {
          warnings.push(`ui.animations.animationSpeed should be one of: ${validSpeeds.join(', ')}`);
        }
      }
      if (!config.ui.debounceDelay) warnings.push('Missing ui.debounceDelay');
    }

    // Features validation
    if (config.features) {
      const expectedFeatures = ['authentication', 'cloudStorage', 'attendance', 'statistics', 'sharing', 'pwa'];
      for (const feature of expectedFeatures) {
        if (typeof config.features[feature] !== 'boolean') {
          warnings.push(`features.${feature} should be a boolean (true/false)`);
        }
      }
    }

    // Report results
    if (errors.length === 0) {
      console.log('✅ Configuration structure is valid');
    } else {
      console.log('❌ Configuration errors found:');
      errors.forEach(error => console.log(`   • ${error}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Configuration warnings:');
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    // Display key configuration values
    console.log('\n📋 Configuration Summary:');
    console.log(`   App Name: ${config.app?.name || 'Not set'}`);
    console.log(`   Short Name: ${config.app?.shortName || 'Not set'}`);
    console.log(`   Team Name: ${config.team?.defaultTeam1Name || 'Not set'}`);
    console.log(`   Club Name: ${config.team?.clubName || 'Not set'}`);
    console.log(`   Season: ${config.team?.season || 'Not set'}`);
    console.log(`   Age Group: ${config.team?.ageGroup || 'Not set'}`);
    console.log(`   Default Theme: ${config.ui?.theme?.defaultTheme || 'Not set'}`);
    console.log(`   Default Game Time: ${config.match?.defaultGameTime || 'Not set'} seconds`);
    console.log(`   Default Players: ${config.roster?.defaultPlayers?.length || 0} players`);
    console.log(`   Enabled Event Types: ${config.events?.enabledEventTypes?.length || 0} events`);
    console.log(`   Sharing Platforms: ${config.sharing?.enabledPlatforms?.length || 0} platforms`);
    console.log(`   Animations: ${config.ui?.animations?.enableAnimations !== false ? 'Enabled' : 'Disabled'}`);
    console.log(`   Authentication: ${config.features?.authentication ? 'Enabled' : 'Disabled'}`);
    console.log(`   Cloud Storage: ${config.features?.cloudStorage ? 'Enabled' : 'Disabled'}`);

    return errors.length === 0;

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Command line usage
if (process.argv[1] && process.argv[1].endsWith('validate-config.js')) {
  const configPath = process.argv[2] || './config.json';
  const isValid = validateConfig(configPath);
  
  console.log('\n' + '='.repeat(50));
  if (isValid) {
    console.log('🎉 Configuration is ready to use!');
  } else {
    console.log('❌ Please fix the errors above before using this configuration.');
  }
  
  process.exit(isValid ? 0 : 1);
}

export { validateConfig };
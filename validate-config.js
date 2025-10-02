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
      
      if (config.team.clubColors) {
        if (!config.team.clubColors.primary) warnings.push('Missing team.clubColors.primary');
        
        // Validate color format
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (config.team.clubColors.primary && !colorRegex.test(config.team.clubColors.primary)) {
          warnings.push('team.clubColors.primary should be a valid hex color (e.g., #dc3545)');
        }
        if (config.team.clubColors.secondary && !colorRegex.test(config.team.clubColors.secondary)) {
          warnings.push('team.clubColors.secondary should be a valid hex color (e.g., #ffffff)');
        }
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
      if (!config.ui.notifications) warnings.push('Missing ui.notifications');
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
    console.log(`   Primary Color: ${config.team?.clubColors?.primary || 'Not set'}`);
    console.log(`   Default Game Time: ${config.match?.defaultGameTime || 'Not set'} seconds`);
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
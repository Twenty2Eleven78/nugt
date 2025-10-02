#!/usr/bin/env node

/**
 * Team Setup Script
 * Simple script to help teams configure their GameTime app
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupTeam() {
  console.log('🏈 Welcome to GameTime Team Setup!');
  console.log('This will help you configure the app for your team.\n');

  try {
    // Collect team information
    const teamName = await question('What is your team name? (e.g., Manchester United): ');
    const clubName = await question('What is your club name? (e.g., Manchester United FC): ');
    const shortName = await question(`What should the short name be? (max 4 chars, default: ${teamName.substring(0, 4).toUpperCase()}): `) || teamName.substring(0, 4).toUpperCase();
    const primaryColor = await question('What is your primary team color? (hex code, e.g., #dc3545): ') || '#dc3545';
    
    console.log('\nMatch Duration Options:');
    console.log('1. 40 minutes (7v7 Youth)');
    console.log('2. 50 minutes (7v7 Youth)');
    console.log('3. 60 minutes (9v9 Youth)');
    console.log('4. 70 minutes (11v11 Youth) - Default');
    console.log('5. 80 minutes (11v11 Youth)');
    console.log('6. 90 minutes (11v11 Adult)');
    
    const durationChoice = await question('Select default match duration (1-6): ') || '4';
    const durations = [2400, 3000, 3600, 4200, 4800, 5400];
    const defaultGameTime = durations[parseInt(durationChoice) - 1] || 4200;

    console.log('\nFeature Options:');
    const useAuth = (await question('Enable user authentication? (y/n): ')).toLowerCase().startsWith('y');
    const useCloud = (await question('Enable cloud storage? (y/n): ')).toLowerCase().startsWith('y');
    const useSharing = (await question('Enable match sharing? (y/n): ')).toLowerCase().startsWith('y');

    // Generate configuration
    const config = {
      app: {
        name: `${teamName} GameTime`,
        shortName: shortName.substring(0, 4).toUpperCase(),
        version: "4.0",
        description: `${teamName} match tracking application`,
        author: `${clubName} Team`
      },
      team: {
        defaultTeam1Name: teamName,
        defaultTeam2Name: "Opposition",
        clubName: clubName,
        clubColors: {
          primary: primaryColor,
          secondary: "#ffffff"
        }
      },
      match: {
        defaultGameTime: defaultGameTime,
        gameDurations: {
          "7v7_40min": 2400,
          "7v7_50min": 3000,
          "9v9_60min": 3600,
          "11v11_70min": 4200,
          "11v11_80min": 4800,
          "11v11_90min": 5400
        },
        timerUpdateInterval: 100,
        autoSaveInterval: 5000
      },
      ui: {
        theme: {
          defaultTheme: "red",
          availableThemes: ["red", "blue", "green", "purple", "orange", "yellow", "cyan", "pink"]
        },
        notifications: {
          defaultDuration: 2000,
          maxNotifications: 5
        },
        debounceDelay: 300
      },
      features: {
        authentication: useAuth,
        cloudStorage: useCloud,
        attendance: true,
        statistics: true,
        sharing: useSharing,
        pwa: true
      }
    };

    // Write configuration file
    const configPath = path.join(__dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('\n✅ Configuration created successfully!');
    console.log(`📁 Config saved to: ${configPath}`);
    console.log('\n🚀 Next steps:');
    console.log('1. Review the generated config.json file');
    console.log('2. Reload your GameTime app');
    console.log('3. Verify team names and colors appear correctly');
    console.log('\n📖 For advanced configuration, see docs/CONFIGURATION.md');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup if called directly
if (process.argv[1] && process.argv[1].endsWith('setup-team.js')) {
  setupTeam();
}

export { setupTeam };
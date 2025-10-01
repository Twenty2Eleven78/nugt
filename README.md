
# GameTime - Multi-Team Football Match Tracker

A configurable football match tracking application that can be customized for any team or club. Track matches, manage rosters, record events, and maintain statistics with a professional, mobile-optimized interface.

## Quick Start

1. **Download or clone** this repository
2. **Configure your team** by editing `team-config.json`
3. **Deploy** to your web server or hosting platform
4. **Access** the application and start tracking matches

## Team Configuration Setup

### Overview

GameTime uses a single configuration file (`team-config.json`) to customize the application for your team. This file controls team branding, names, integrations, and default settings without requiring any code changes.

### Configuration File Location

The configuration file should be placed in the root directory of your application:
```
your-app/
├── team-config.json  ← Your team configuration
├── index.html
├── js/
└── css/
```

### Basic Configuration

Here's a minimal configuration to get started:

```json
{
  "team": {
    "name": "Your Team Name",
    "shortName": "YTN",
    "abbreviation": "YTN",
    "defaultOpponentName": "Opposition"
  },
  "branding": {
    "primaryColor": "#dc3545",
    "secondaryColor": "#ffffff",
    "logoUrl": "./your-logo.png",
    "faviconUrl": "./favicon.ico",
    "appIconUrl": "./your-app-icon.png"
  }
}
```

### Complete Configuration Options

#### Team Settings
- `team.name`: Full team name displayed throughout the application
- `team.shortName`: Abbreviated team name for compact displays
- `team.abbreviation`: Short code used for storage keys and internal references
- `team.defaultOpponentName`: Default name for opposition teams

#### Branding Settings
- `branding.primaryColor`: Main theme color (hex format)
- `branding.secondaryColor`: Secondary color for accents
- `branding.logoUrl`: Path to your team logo image
- `branding.faviconUrl`: Path to favicon file
- `branding.appIconUrl`: Path to PWA app icon (512x512px recommended)

#### PWA (Progressive Web App) Settings
- `pwa.appName`: Full application name for PWA
- `pwa.shortName`: Short name for PWA (12 characters max)
- `pwa.description`: App description for PWA manifest
- `pwa.themeColor`: Theme color for PWA (matches branding.primaryColor)
- `pwa.backgroundColor`: Background color for PWA splash screen

#### Integration Settings
- `integrations.leagueTable.enabled`: Enable/disable league table integration
- `integrations.leagueTable.defaultUrl`: Default URL for league table data
- `integrations.leagueTable.corsProxies`: Array of CORS proxy services
- `integrations.statistics.enabled`: Enable/disable statistics integration
- `integrations.statistics.apiEndpoint`: API endpoint for statistics data

#### Default Settings
- `defaults.matchDuration`: Default match duration in seconds (4200 = 70 minutes)
- `defaults.theme`: Default color theme ("red", "blue", "green", etc.)
- `defaults.darkMode`: Enable dark mode by default (true/false)

#### Storage Settings
- `storage.keyPrefix`: Prefix for localStorage keys (prevents conflicts)
- `storage.cachePrefix`: Prefix for cache storage keys

### Step-by-Step Setup Guide

#### 1. Prepare Your Assets

Before configuring, prepare these files:
- **Team Logo**: PNG or JPG, recommended size 200x200px
- **App Icon**: PNG, 512x512px for PWA functionality
- **Favicon**: ICO file, 32x32px

#### 2. Edit Configuration File

1. Open `team-config.json` in a text editor
2. Update the `team` section with your team information
3. Modify `branding` colors and asset paths
4. Configure `pwa` settings for mobile app functionality
5. Set up `integrations` if you have league table URLs
6. Adjust `defaults` to match your typical match setup
7. Update `storage.keyPrefix` to use your team abbreviation

#### 3. Upload Assets

Place your logo, icon, and favicon files in the application directory and ensure the paths in your configuration match the file locations.

#### 4. Test Configuration

1. Open the application in a web browser
2. Check that your team name appears correctly
3. Verify that your logo and colors are applied
4. Test creating a new match to ensure defaults work
5. If you're an admin, use the configuration modal to validate settings

#### 5. Deploy Application

Deploy the configured application to your web server, hosting platform, or CDN. The application works with any static hosting service.

### Configuration Validation

The application automatically validates your configuration on startup:
- **Missing file**: Uses default Netherton United configuration
- **Invalid JSON**: Shows error message and uses defaults
- **Missing required fields**: Uses default values for missing fields
- **Invalid values**: Shows warnings and uses fallback values

### Advanced Configuration

#### Custom Storage Prefixes

If multiple teams use the same hosting environment, ensure each team has a unique `storage.keyPrefix`:

```json
{
  "storage": {
    "keyPrefix": "myteam_",
    "cachePrefix": "myteam-cache-"
  }
}
```

#### League Table Integration

To integrate with your league's online table:

```json
{
  "integrations": {
    "leagueTable": {
      "enabled": true,
      "defaultUrl": "https://your-league-website.com/table",
      "corsProxies": [
        "https://corsproxy.io/?",
        "https://api.allorigins.win/get?url="
      ]
    }
  }
}
```

#### Multiple Team Configurations

For clubs with multiple teams, create separate deployments with different configurations, or use the configuration management UI to switch between team setups.

---

## Version History

🚀 Version 4.0
**Released: August 2025**
- Custom CSS Framework: Removed Bootstrap dependency and implemented custom CSS for better performance
- Enhanced Authentication: Resolved auth issues and improved user profile functionality
- New Match Workflow: Streamlined start new match process with improved modal system
- Code Optimization: Removed redundant code, duplicate functions, and optimized imports
- Improved Error Handling: Better error handling for goal modal and form submissions
- Performance Enhancements: Enhanced modal initialization and reduced code duplication
---
📋 Previous Versions
Version 3.7 - Layout Optimization
**Released: July 2025**
- Mobile Layout Revolution: Compact events tab with redesigned statistics cards for maximum screen space
- 40px+ Space Savings: Streamlined controls and simplified interface for better mobile experience
- Touch-Optimized Design: Larger buttons, responsive spacing, and improved visual hierarchy
- Game Tab Redesign: Complete mobile-first redesign with Scoreboard → Actions → Timer flow
- Professional UI: Card-based layout with Bootstrap gutters, gradients, and modern styling
- Compact Statistics: 70px height cards with optimized typography and full-width timer button
---
Version 3.6 - Enhanced Events & Attendance System
**Released: July 2025**
- Enhanced Events Tab: Statistics dashboard with real-time event counting and visual cards
- Advanced Filtering: Search and filter events by type (Goals, Cards, Fouls) with CSV export
- Player Attendance System: Complete attendance tracking with dedicated modal interface
- Modern UI: Card-based layout with hover effects, enhanced timeline, and quick actions
- Technical Improvements: PWA updates, modular architecture, and optimized performance
- Data Integration: Attendance data included in cloud saves and unified notifications
---
Version 3.5 - Authentication, Cloud Storage and Code Architecture
**Released: 2025**
- Passkey Authentication: Secure user authentication system
- Cloud Data Storage: Save and load match data to/from cloud
- User Management: Personal match history and data management
- Modular JavaScript: Modern ES6 module architecture
- Separated Roster Defaults: Cleaner code organization
- Performance Improvements: Faster loading and better maintainability

Version 3.4 - Modern Architecture
**Released: 2025**
- JavaScript Refactor: Complete rewrite using modern module architecture
- Improved Performance: Better code organization and loading times
- Enhanced Maintainability: Cleaner, more maintainable codebase

Version 3.3 - Enhanced Gameplay
**Released: 2025**
- Disallowed Goals: Option to mark goals as disallowed with reasons
- Additional Game Times: More match duration options for different age groups
- Improved Goal Management: Better goal tracking and modification

Version 3.2 - Timeline & Player Management
**Released: 2025**
- Timeline View: Events displayed in chronological timeline format
- Goal Timestamp Accuracy: Improved timing precision for goals
- Shirt Numbers: Added shirt number functionality to player roster

Version 3.1 - Match Events System
**Released: 2025**
- Match Events: Comprehensive event tracking (Cards, Fouls, Penalties)
- Event Management: Ability to edit and delete individual log entries

Version 3.0 - Major UI Overhaul
**Released: 2025**
- Complete UI Redesign: Modern, professional interface
- Dynamic Scoreboard: Real-time score display
- Navigation Pills: Improved tab-based navigation
- Fixture Management: Team name and fixture management

Version 2.1 - UI & Functionality
**Released: 2025**
- UI Improvements: General interface enhancements
- Time Rounding: Automatic time rounding for goal timestamps

Version 2.0 - Team Management
**Released: 2024**
- Roster Management: Team roster system
- Player Tracking: Individual player management
- Team Organization: Structured team data management

Version 1.3 - Reports & UI
**Released: 2024**
- WhatsApp Reports: Share match reports via WhatsApp
- UI Enhancements: General user interface improvements

Version 1.0 - Initial Release
**Released: 2024**
- Core Functionality: Basic match timing and goal tracking
- Foundation: Core app architecture and functionality

</details>
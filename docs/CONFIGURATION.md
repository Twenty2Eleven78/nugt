# Configuration Guide

This document explains how to configure the NUFC GameTime App for different teams and deployments.

## Configuration File

The main configuration is stored in `config.json` at the root of the application. This file allows you to customize the app for different teams without modifying the source code.

## Configuration Structure

### App Settings
```json
{
  "app": {
    "name": "Your Team GameTime",
    "shortName": "YTGT",
    "version": "4.0",
    "description": "Football match tracking application",
    "author": "Your Team Name"
  }
}
```

### Team Settings
```json
{
  "team": {
    "defaultTeam1Name": "Your Team Name",
    "defaultTeam2Name": "Opposition",
    "clubName": "Your Football Club",
    "clubColors": {
      "primary": "#your-primary-color",
      "secondary": "#your-secondary-color"
    }
  }
}
```

### Match Settings
```json
{
  "match": {
    "defaultGameTime": 4200,
    "gameDurations": {
      "7v7_40min": 2400,
      "7v7_50min": 3000,
      "9v9_60min": 3600,
      "11v11_70min": 4200,
      "11v11_80min": 4800,
      "11v11_90min": 5400
    },
    "timerUpdateInterval": 100,
    "autoSaveInterval": 5000
  }
}
```

### UI Settings
```json
{
  "ui": {
    "theme": {
      "defaultTheme": "red",
      "availableThemes": ["red", "blue", "green", "purple", "orange", "yellow", "cyan", "pink"]
    },
    "notifications": {
      "defaultDuration": 2000,
      "maxNotifications": 5
    },
    "debounceDelay": 300
  }
}
```

### Feature Toggles
```json
{
  "features": {
    "authentication": true,
    "cloudStorage": true,
    "attendance": true,
    "statistics": true,
    "sharing": true,
    "pwa": true
  }
}
```

## Quick Setup for Different Teams

### 1. Basic Team Setup
1. Copy `config.json` to `config-yourteam.json`
2. Update the following fields:
   - `app.name`: "YourTeam GameTime"
   - `app.shortName`: "YTGT"
   - `team.defaultTeam1Name`: "Your Team Name"
   - `team.clubName`: "Your Football Club"
   - `team.clubColors.primary`: Your team's primary color

### 2. Color Customization
The `team.clubColors.primary` field controls:
- App theme color
- PWA manifest theme
- Primary UI elements

Common team colors:
- Red: `#dc3545`
- Blue: `#0d6efd`
- Green: `#198754`
- Yellow: `#ffc107`
- Purple: `#6f42c1`

### 3. Match Duration Setup
Adjust `match.defaultGameTime` based on your league:
- Youth 7v7 (40min): `2400`
- Youth 7v7 (50min): `3000`
- Youth 9v9 (60min): `3600`
- Youth 11v11 (70min): `4200`
- Youth 11v11 (80min): `4800`
- Adult 11v11 (90min): `5400`

## Advanced Configuration

### Custom Game Durations
Add custom match durations to `match.gameDurations`:
```json
"gameDurations": {
  "custom_45min": 2700,
  "tournament_30min": 1800
}
```

### Feature Toggles
Disable features not needed for your deployment:
```json
"features": {
  "authentication": false,  // Disable user accounts
  "cloudStorage": false,    // Disable cloud saves
  "attendance": true,       // Keep attendance tracking
  "statistics": true,       // Keep statistics
  "sharing": false,         // Disable sharing features
  "pwa": true              // Keep PWA functionality
}
```

### Performance Tuning
Adjust performance settings:
```json
"match": {
  "timerUpdateInterval": 100,    // Timer update frequency (ms)
  "autoSaveInterval": 5000       // Auto-save frequency (ms)
},
"ui": {
  "debounceDelay": 300,          // UI debounce delay (ms)
  "notifications": {
    "defaultDuration": 2000,     // Notification display time (ms)
    "maxNotifications": 5        // Max concurrent notifications
  }
}
```

## Deployment Examples

### Example 1: Manchester United Youth
```json
{
  "app": {
    "name": "Manchester United GameTime",
    "shortName": "MUGT",
    "description": "Manchester United youth match tracker"
  },
  "team": {
    "defaultTeam1Name": "Manchester United",
    "clubName": "Manchester United FC",
    "clubColors": {
      "primary": "#da020e",
      "secondary": "#ffd700"
    }
  },
  "match": {
    "defaultGameTime": 3600
  }
}
```

### Example 2: Local Sunday League
```json
{
  "app": {
    "name": "Sunday League Tracker",
    "shortName": "SLT"
  },
  "team": {
    "defaultTeam1Name": "Local FC",
    "clubName": "Sunday League",
    "clubColors": {
      "primary": "#28a745"
    }
  },
  "match": {
    "defaultGameTime": 5400
  },
  "features": {
    "authentication": false,
    "cloudStorage": false
  }
}
```

## Testing Configuration

After updating `config.json`:

1. Reload the application
2. Check the browser console for configuration loading messages
3. Verify the app name appears correctly in the header
4. Check that team names are updated in the scoreboard
5. Confirm theme colors are applied

## Troubleshooting

### Configuration Not Loading
- Check `config.json` syntax with a JSON validator
- Ensure the file is in the root directory
- Check browser console for error messages

### Missing Values
- The app will use default values for missing configuration
- Check the browser console for warnings about missing config values

### Invalid Colors
- Use valid CSS color values (hex, rgb, named colors)
- Test colors in browser developer tools first

## Migration from Hardcoded Values

This configuration system replaces hardcoded values throughout the application. The migration is backward compatible - if `config.json` is missing, the app will use default values.

Key areas now configurable:
- Team names and colors
- Match durations
- App branding
- Feature availability
- Performance settings
- UI behavior

## Support

For configuration assistance:
1. Check this documentation
2. Validate your JSON syntax
3. Review browser console messages
4. Test with minimal configuration first
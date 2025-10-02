# 🎨 Theme Configuration System

## Overview

The NUFC GameTime App now supports team-specific configuration using the existing theme system. Teams can easily customize their app by selecting from predefined themes and setting team names, without needing custom colors.

## ✅ What's Configurable

### 1. Team Information
- **Team Names** - Default team names in scoreboard and buttons
- **Club Name** - Used in app title and branding
- **App Name** - Custom app name and short name

### 2. Theme Selection
- **Default Theme** - Choose from 8 predefined color themes
- **Available Themes**: Red, Blue, Green, Purple, Orange, Yellow, Cyan, Pink
- **Automatic Application** - Theme applies on first load if no user preference exists

### 3. Match Settings
- **Game Duration** - Default match length
- **Timer Settings** - Update intervals and auto-save frequency

### 4. Feature Toggles
- **Authentication** - Enable/disable user accounts
- **Cloud Storage** - Enable/disable cloud saves
- **Attendance** - Enable/disable attendance tracking
- **Statistics** - Enable/disable statistics features
- **Sharing** - Enable/disable match sharing
- **PWA** - Enable/disable PWA features

## 🚀 Quick Setup

### Option 1: Interactive Setup
```bash
npm run setup-team
```

### Option 2: Manual Configuration
Edit `config.json`:
```json
{
  "app": {
    "name": "Your Team GameTime",
    "shortName": "YTGT"
  },
  "team": {
    "defaultTeam1Name": "Your Team",
    "clubName": "Your Football Club"
  },
  "ui": {
    "theme": {
      "defaultTheme": "blue"
    }
  }
}
```

### Option 3: Use Examples
Copy from `config-examples/`:
- `manchester-united.json` - Red theme
- `sunday-league.json` - Green theme  
- `youth-academy.json` - Purple theme

## 🎨 Available Themes

| Theme | Color | Best For |
|-------|-------|----------|
| Red | #dc3545 | Manchester United, Liverpool, Arsenal |
| Blue | #007bff | Chelsea, Manchester City, Everton |
| Green | #28a745 | Celtic, Norwich, Sporting |
| Purple | #6f42c1 | Custom, unique branding |
| Orange | #fd7e14 | Netherlands, Blackpool |
| Yellow | #ffc107 | Borussia Dortmund, Norwich |
| Cyan | #17a2b8 | Manchester City (away), custom |
| Pink | #e83e8c | Custom, unique branding |

## 🔧 How It Works

1. **Configuration Loading** - App loads `config.json` at startup
2. **Theme Application** - If no user theme preference exists, applies default theme from config
3. **Team Names** - Updates scoreboard and button labels with configured team names
4. **PWA Manifest** - Updates app manifest with theme colors and team name
5. **User Override** - Users can still change themes manually, which overrides the default

## 🛠 Tools Available

- **Theme Tester** - `tools/color-tester.html` - Preview themes and generate config
- **Setup Script** - `setup-team.js` - Interactive team configuration
- **Validation** - `validate-config.js` - Check configuration validity
- **Test Page** - `test-colors.html` - Test theme application

## ✅ Benefits

1. **Simplified** - No custom color codes, just theme selection
2. **Consistent** - Uses existing, tested theme system
3. **User Friendly** - Teams can still override themes manually
4. **Maintainable** - Leverages existing theme infrastructure
5. **Backward Compatible** - Works with or without configuration

## 📝 Example Configurations

### Manchester United Style
```json
{
  "team": {
    "defaultTeam1Name": "Manchester United",
    "clubName": "Manchester United FC"
  },
  "ui": {
    "theme": {
      "defaultTheme": "red"
    }
  }
}
```

### Chelsea Style
```json
{
  "team": {
    "defaultTeam1Name": "Chelsea",
    "clubName": "Chelsea FC"
  },
  "ui": {
    "theme": {
      "defaultTheme": "blue"
    }
  }
}
```

### Celtic Style
```json
{
  "team": {
    "defaultTeam1Name": "Celtic",
    "clubName": "Celtic FC"
  },
  "ui": {
    "theme": {
      "defaultTheme": "green"
    }
  }
}
```

## 🧪 Testing

1. **Validate Config**: `npm run validate-config`
2. **Test Themes**: Open `test-colors.html`
3. **Preview Setup**: Open `tools/color-tester.html`

The system is now simpler, more maintainable, and leverages the existing robust theme system while still providing team customization capabilities.
# 🔧 Configuration System

A simple, flexible configuration system for the NUFC GameTime App that allows easy customization for different teams and deployments.

## Quick Start

1. **Edit `config.json`** - Update team names, colors, and settings
2. **Reload the app** - Changes take effect immediately
3. **Test configuration** - Open `test-config.html` to verify settings

## What's Configurable

### ✅ Already Moved to Config
- **App Name & Branding** - App title, short name, description
- **Team Names** - Default team names in scoreboard and buttons
- **Team Colors** - Primary and secondary colors for theming
- **Match Settings** - Default game duration, timer intervals
- **UI Settings** - Notification duration, debounce delays
- **Feature Toggles** - Enable/disable authentication, cloud storage, etc.

### 🔄 Next Steps (Incremental Migration)
- Player roster defaults
- Event types and descriptions
- Sharing platform configurations
- Cache settings
- Storage key prefixes
- UI breakpoints and animations

## Files Changed

### New Files
- `config.json` - Main configuration file
- `js/modules/shared/config.js` - Configuration manager
- `js/modules/ui/team-branding.js` - Team branding updates
- `js/modules/services/manifest-generator.js` - Dynamic manifest generation
- `tools/config-generator.html` - Visual configuration generator
- `docs/CONFIGURATION.md` - Detailed configuration guide

### Modified Files
- `js/modules/shared/constants.js` - Now uses config values
- `js/modules/app.js` - Loads configuration at startup
- `index.html` - Team names updated dynamically

## Usage Examples

### Basic Team Setup
```json
{
  "team": {
    "defaultTeam1Name": "Manchester United",
    "clubName": "Manchester United FC",
    "clubColors": {
      "primary": "#da020e"
    }
  }
}
```

### Feature Toggles
```json
{
  "features": {
    "authentication": false,
    "cloudStorage": false,
    "attendance": true
  }
}
```

### Match Configuration
```json
{
  "match": {
    "defaultGameTime": 5400,
    "autoSaveInterval": 3000
  }
}
```

## Testing

1. **Open `test-config.html`** - Comprehensive configuration testing
2. **Check browser console** - Configuration loading messages
3. **Verify UI updates** - Team names, colors, app title

## Benefits

- **No Code Changes** - Customize without touching JavaScript
- **Team Separation** - Different configs for different deployments
- **Backward Compatible** - Falls back to defaults if config missing
- **Validation** - Built-in configuration validation
- **Performance** - Loads once at startup, cached thereafter

## Next Phase

The system is designed for incremental migration. We can gradually move more hardcoded values to the configuration file:

1. **Phase 1** ✅ - Basic app and team settings
2. **Phase 2** - Player management and roster defaults
3. **Phase 3** - Advanced UI customization
4. **Phase 4** - Integration and API configurations

## Tools

- **Configuration Generator** - `tools/config-generator.html`
- **Test Suite** - `test-config.html`
- **Documentation** - `docs/CONFIGURATION.md`

This system makes it easy to deploy the same app for different teams while keeping the codebase unified and maintainable.
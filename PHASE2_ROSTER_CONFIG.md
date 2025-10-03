# 🏈 Phase 2: Roster Configuration System

## Overview

Phase 2 of the configuration system adds comprehensive roster and player management configuration. Teams can now customize their default roster, player settings, and roster behavior through the configuration file.

## ✅ What's New in Phase 2

### 1. Roster Configuration
- **Default Players** - Configure team roster with names and shirt numbers
- **Roster Settings** - Max players, auto-sort, duplicate number handling
- **Team Information** - Season, age group, extended team details

### 2. Enhanced Team Settings
- **Season** - Configure current season (e.g., "2025-2026")
- **Age Group** - Set team age group (e.g., "U13 Girls", "Adult")
- **Extended Metadata** - Additional team information for better organization

### 3. Roster Behavior Controls
- **Auto-Sort** - Automatically sort players alphabetically
- **Max Players** - Set maximum roster size
- **Duplicate Numbers** - Allow or prevent duplicate shirt numbers

## 🔧 Configuration Structure

### New Configuration Sections

```json
{
  "team": {
    "defaultTeam1Name": "Your Team",
    "defaultTeam2Name": "Opposition", 
    "clubName": "Your Football Club",
    "season": "2025-2026",
    "ageGroup": "U13 Girls"
  },
  "roster": {
    "defaultPlayers": [
      { "name": "Player Name", "shirtNumber": 1 },
      { "name": "Another Player", "shirtNumber": 2 },
      { "name": "No Number Player", "shirtNumber": null }
    ],
    "maxPlayers": 25,
    "allowDuplicateNumbers": false,
    "autoSort": true
  }
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `team.season` | string | "2025-2026" | Current season |
| `team.ageGroup` | string | "U13 Girls" | Team age group |
| `roster.defaultPlayers` | array | [] | Default player roster |
| `roster.maxPlayers` | number | 25 | Maximum roster size |
| `roster.allowDuplicateNumbers` | boolean | false | Allow duplicate shirt numbers |
| `roster.autoSort` | boolean | true | Auto-sort players alphabetically |

## 👥 Player Configuration

### Player Object Structure
```json
{
  "name": "Player Name",
  "shirtNumber": 10
}
```

### Player Rules
- **Name** - Required, string, player's name
- **Shirt Number** - Optional, number 1-99 or null for no number
- **Duplicates** - Controlled by `allowDuplicateNumbers` setting

### Example Player Configurations

**Basic Roster:**
```json
"defaultPlayers": [
  { "name": "Goalkeeper", "shirtNumber": 1 },
  { "name": "Defender", "shirtNumber": 2 },
  { "name": "Midfielder", "shirtNumber": 8 },
  { "name": "Striker", "shirtNumber": 9 }
]
```

**Mixed Numbers:**
```json
"defaultPlayers": [
  { "name": "Captain", "shirtNumber": 10 },
  { "name": "Sub Player", "shirtNumber": null },
  { "name": "New Player", "shirtNumber": null }
]
```

## 🛠 Tools Updated

### 1. Configuration Generator
- **Roster Section** - Visual roster configuration
- **Player Input** - Textarea for easy player entry
- **Settings Controls** - Checkboxes for roster behavior

### 2. Setup Script
- **Roster Questions** - Interactive roster setup
- **Season/Age Group** - Prompts for team information
- **Default Options** - Quick roster templates

### 3. Validation Script
- **Roster Validation** - Checks player format and settings
- **Number Validation** - Validates shirt numbers (1-99)
- **Array Validation** - Ensures proper player array structure

## 📋 Example Configurations

### Manchester United Youth
```json
{
  "team": {
    "defaultTeam1Name": "Manchester United",
    "clubName": "Manchester United FC",
    "season": "2025-2026",
    "ageGroup": "U16 Boys"
  },
  "roster": {
    "defaultPlayers": [
      { "name": "Marcus", "shirtNumber": 10 },
      { "name": "Bruno", "shirtNumber": 8 },
      { "name": "Casemiro", "shirtNumber": 18 }
    ],
    "maxPlayers": 25,
    "allowDuplicateNumbers": false,
    "autoSort": true
  }
}
```

### Sunday League
```json
{
  "team": {
    "defaultTeam1Name": "Local FC",
    "clubName": "Sunday League",
    "season": "2025-2026", 
    "ageGroup": "Adult"
  },
  "roster": {
    "defaultPlayers": [
      { "name": "John", "shirtNumber": 1 },
      { "name": "Mike", "shirtNumber": 2 }
    ],
    "maxPlayers": 20,
    "allowDuplicateNumbers": true,
    "autoSort": false
  }
}
```

### Youth Academy
```json
{
  "team": {
    "defaultTeam1Name": "Academy U13",
    "clubName": "Youth Football Academy",
    "season": "2025-2026",
    "ageGroup": "U13 Mixed"
  },
  "roster": {
    "defaultPlayers": [
      { "name": "Alex", "shirtNumber": 1 },
      { "name": "Bailey", "shirtNumber": 2 },
      { "name": "Charlie", "shirtNumber": 3 }
    ],
    "maxPlayers": 30,
    "allowDuplicateNumbers": false,
    "autoSort": true
  }
}
```

## 🧪 Testing

### Test Pages
- **`test-roster-config.html`** - Comprehensive roster testing
- **`validate-config.js`** - Configuration validation
- **Configuration Generator** - Visual roster setup

### Test Scenarios
1. **Default Roster Loading** - Verify players load from config
2. **Auto-Sort Behavior** - Test alphabetical sorting
3. **Number Validation** - Check duplicate number handling
4. **Max Players** - Verify roster size limits

## 🔄 Migration Path

### Backward Compatibility
- **Existing Rosters** - Saved rosters take priority over config
- **Fallback System** - Hardcoded defaults if config fails
- **Gradual Adoption** - Teams can migrate incrementally

### Migration Steps
1. **Add Roster Config** - Add roster section to config.json
2. **Test Configuration** - Use test pages to verify setup
3. **Clear Saved Data** - Reset to use config defaults (optional)
4. **Validate Setup** - Run validation script

## 📈 Benefits

1. **Team Customization** - Each deployment can have unique rosters
2. **Seasonal Updates** - Easy roster updates between seasons
3. **Consistent Setup** - New installations get proper team rosters
4. **Flexible Management** - Control roster behavior per team needs
5. **Easy Maintenance** - Update rosters without code changes

## 🚀 Next Phase Preview

**Phase 3** will focus on:
- Event type customization
- Sharing platform configurations  
- Advanced UI customization
- League-specific settings

The roster configuration system provides a solid foundation for team-specific deployments while maintaining the flexibility and ease of use that makes the GameTime app accessible to teams of all levels.
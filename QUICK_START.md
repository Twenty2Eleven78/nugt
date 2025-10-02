# 🚀 Quick Start - Team Configuration

## For New Teams (5 minutes setup)

### Option 1: Interactive Setup
```bash
npm run setup-team
```
Follow the prompts to configure your team.

### Option 2: Manual Configuration
1. **Edit `config.json`**:
```json
{
  "team": {
    "defaultTeam1Name": "Your Team Name",
    "clubName": "Your Football Club"
  },
  "ui": {
    "theme": {
      "defaultTheme": "blue"
    }
  }
}
```

2. **Reload the app** - Changes apply immediately!

### Option 3: Use Examples
Copy from `config-examples/`:
- `manchester-united.json` - Professional club setup
- `sunday-league.json` - Minimal features
- `youth-academy.json` - Youth-focused

## Test Your Setup

1. **Validate**: `npm run validate-config`
2. **Test Colors**: Open `tools/color-tester.html`
3. **Full Test**: Open `test-config.html`

## What Changes

✅ **Team Names** - Scoreboard and buttons update automatically  
✅ **Theme Colors** - Default theme applies to buttons, links, UI elements  
✅ **App Title** - Browser tab and PWA manifest  
✅ **Match Settings** - Default game duration  
✅ **Features** - Enable/disable authentication, cloud storage, etc.

## Available Themes

- **Red**: `"red"` (Manchester United, Liverpool, Arsenal)
- **Blue**: `"blue"` (Chelsea, Manchester City, Everton) 
- **Green**: `"green"` (Celtic, Norwich, Sporting)
- **Purple**: `"purple"` (Custom, unique branding)
- **Orange**: `"orange"` (Netherlands, Blackpool)
- **Yellow**: `"yellow"` (Borussia Dortmund, Norwich)
- **Cyan**: `"cyan"` (Manchester City away, custom)
- **Pink**: `"pink"` (Custom, unique branding)

## Need Help?

- 📖 **Full Guide**: `docs/CONFIGURATION.md`
- 🎨 **Theme Tester**: `tools/color-tester.html`
- ⚙️ **Config Generator**: `tools/config-generator.html`
- ✅ **Validation**: `npm run validate-config`

## Advanced

The system supports incremental migration - more settings can be moved to configuration over time without breaking existing deployments.
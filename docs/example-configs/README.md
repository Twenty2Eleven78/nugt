# Example Team Configurations

This directory contains example configuration files for different types of football teams and scenarios. Use these as starting points for your own team configuration.

## Available Examples

### 1. Youth Team Configuration (`youth-team-config.json`)
**Scenario**: Under-16 youth team with shorter match duration
- **Match Duration**: 60 minutes (3600 seconds)
- **Theme**: Green color scheme
- **Integrations**: League table enabled, statistics disabled
- **Use Case**: Youth leagues, academy teams, school teams

### 2. Adult Team Configuration (`adult-team-config.json`)
**Scenario**: Adult semi-professional team with full integrations
- **Match Duration**: 90 minutes (5400 seconds)
- **Theme**: Blue color scheme
- **Integrations**: Both league table and statistics enabled
- **Use Case**: County leagues, semi-professional teams, adult amateur leagues

### 3. Sunday League Configuration (`sunday-league-config.json`)
**Scenario**: Casual Sunday league team with minimal integrations
- **Match Duration**: 90 minutes (5400 seconds)
- **Theme**: Purple color scheme
- **Integrations**: All integrations disabled
- **Use Case**: Sunday leagues, pub teams, casual football clubs

### 4. Women's Team Configuration (`womens-team-config.json`)
**Scenario**: Women's football team with league integration
- **Match Duration**: 90 minutes (5400 seconds)
- **Theme**: Pink color scheme
- **Integrations**: League table and statistics enabled
- **Use Case**: Women's leagues, ladies' football clubs

### 5. Minimal Configuration (`minimal-config.json`)
**Scenario**: Bare minimum configuration to get started
- **Contains**: Only essential fields required for basic functionality
- **Use Case**: Quick setup, testing, or when you want to configure everything through the UI

## How to Use These Examples

### 1. Choose Your Starting Point
Select the example that most closely matches your team type and requirements.

### 2. Copy and Customize
1. Copy the chosen example file to your application root directory
2. Rename it to `team-config.json`
3. Edit the values to match your team:
   - Update team names and abbreviations
   - Change colors to match your team colors
   - Update asset paths to point to your logo and icon files
   - Modify integration URLs if you have them
   - Adjust match duration for your league requirements

### 3. Prepare Your Assets
Based on your configuration, prepare these files:
- **Logo**: Place your team logo at the path specified in `branding.logoUrl`
- **App Icon**: Place your PWA icon at the path specified in `branding.appIconUrl`
- **Favicon**: Place your favicon at the path specified in `branding.faviconUrl`

### 4. Test Your Configuration
1. Load your application in a web browser
2. Check that your team name appears correctly
3. Verify that colors and logos are applied
4. Test creating a new match to ensure defaults work properly

## Configuration Field Reference

### Team Settings
- `name`: Full team name (displayed in headers, titles)
- `shortName`: Abbreviated name (used in compact displays)
- `abbreviation`: 2-5 character code (used for storage keys)
- `defaultOpponentName`: Default name for opposition teams

### Branding Settings
- `primaryColor`: Main theme color (hex format, e.g., "#dc3545")
- `secondaryColor`: Secondary accent color
- `logoUrl`: Path to team logo image
- `faviconUrl`: Path to favicon file
- `appIconUrl`: Path to PWA app icon (512x512px recommended)

### Match Duration Options
Common match durations for different age groups:
- **Under-8**: 2400 seconds (40 minutes)
- **Under-10**: 3000 seconds (50 minutes)
- **Under-12**: 3600 seconds (60 minutes)
- **Under-14**: 4200 seconds (70 minutes)
- **Under-16**: 4800 seconds (80 minutes)
- **Adult**: 5400 seconds (90 minutes)

### Color Theme Options
Available theme options:
- `"red"` - Red color scheme
- `"blue"` - Blue color scheme
- `"green"` - Green color scheme
- `"purple"` - Purple color scheme
- `"pink"` - Pink color scheme
- `"orange"` - Orange color scheme
- `"teal"` - Teal color scheme

## Troubleshooting

If you encounter issues with your configuration:

1. **Check JSON Syntax**: Use a JSON validator to ensure proper formatting
2. **Verify File Paths**: Ensure logo and icon files exist at specified paths
3. **Check Color Formats**: Use hex color codes (e.g., "#dc3545")
4. **Validate URLs**: Ensure integration URLs are accessible
5. **Review Console**: Check browser console for configuration error messages

For more detailed troubleshooting, see the main troubleshooting documentation.

## Need Help?

- Review the validation examples in `validation-examples.md`
- Check the main README for detailed setup instructions
- Consult the troubleshooting guide for common issues
- Use the configuration UI in the application for guided setup
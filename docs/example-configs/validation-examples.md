# Configuration Validation Examples

This document shows examples of correct and incorrect configuration formats to help you avoid common mistakes.

## ✅ Correct Configuration Examples

### Valid Color Formats
```json
{
  "branding": {
    "primaryColor": "#dc3545",     // ✅ Hex with #
    "secondaryColor": "#ffffff"    // ✅ Hex with #
  }
}
```

### Valid Team Configuration
```json
{
  "team": {
    "name": "Manchester United FC",        // ✅ Full team name
    "shortName": "Man Utd",               // ✅ Short display name
    "abbreviation": "MUFC",               // ✅ 2-5 character code
    "defaultOpponentName": "Opposition"    // ✅ Default opponent name
  }
}
```

### Valid Integration Configuration
```json
{
  "integrations": {
    "leagueTable": {
      "enabled": true,                                    // ✅ Boolean value
      "defaultUrl": "https://example.com/league-table",   // ✅ Valid HTTPS URL
      "corsProxies": [                                    // ✅ Array of strings
        "https://corsproxy.io/?",
        "https://api.allorigins.win/get?url="
      ]
    }
  }
}
```

### Valid Storage Configuration
```json
{
  "storage": {
    "keyPrefix": "mufc_",           // ✅ Lowercase with underscore
    "cachePrefix": "mufc-cache-"    // ✅ Lowercase with hyphens
  }
}
```

## ❌ Common Configuration Errors

### Invalid Color Formats
```json
{
  "branding": {
    "primaryColor": "red",          // ❌ Use hex format: "#dc3545"
    "secondaryColor": "rgb(255,0,0)" // ❌ Use hex format: "#ff0000"
  }
}
```

### Invalid Team Configuration
```json
{
  "team": {
    "name": "",                     // ❌ Empty team name
    "shortName": "Manchester United Football Club", // ❌ Too long for short name
    "abbreviation": "MANCHESTERUTD", // ❌ Too long for abbreviation
    "defaultOpponentName": null     // ❌ Should be string, not null
  }
}
```

### Invalid Integration Configuration
```json
{
  "integrations": {
    "leagueTable": {
      "enabled": "true",            // ❌ Should be boolean, not string
      "defaultUrl": "ftp://example.com", // ❌ Use HTTP/HTTPS URLs only
      "corsProxies": "proxy-url"    // ❌ Should be array, not string
    }
  }
}
```

### Invalid Storage Configuration
```json
{
  "storage": {
    "keyPrefix": "MUFC_",          // ❌ Avoid uppercase
    "cachePrefix": "mufc cache "   // ❌ Avoid spaces
  }
}
```

### Invalid JSON Syntax
```json
{
  "team": {
    "name": "Manchester United FC",
    "shortName": "Man Utd",        // ❌ Missing comma
    "abbreviation": "MUFC"
  }
  "branding": {                    // ❌ Missing comma after previous object
    "primaryColor": "#dc3545"
  }
}
```

## Configuration Validation Rules

### Required Fields
These fields are required and must be present:
- `team.name` - String, 1-50 characters
- `team.abbreviation` - String, 2-5 characters
- `storage.keyPrefix` - String, 2-10 characters

### Optional Fields with Defaults
These fields are optional and will use defaults if not provided:
- `team.shortName` - Defaults to `team.name`
- `team.defaultOpponentName` - Defaults to "Opposition"
- `branding.primaryColor` - Defaults to "#dc3545"
- `branding.secondaryColor` - Defaults to "#ffffff"

### Field Validation Rules

#### Colors
- Must be valid hex color codes starting with #
- Examples: "#dc3545", "#ffffff", "#007bff"

#### URLs
- Must be valid HTTP or HTTPS URLs
- Examples: "https://example.com", "./local-file.png"

#### Booleans
- Must be true or false (not strings)
- Examples: `true`, `false`

#### Arrays
- Must be valid JSON arrays
- Examples: `[]`, `["item1", "item2"]`

#### Storage Prefixes
- Should be lowercase
- Should end with underscore for keyPrefix
- Should end with hyphen for cachePrefix
- Should be unique per team to avoid conflicts

## Testing Your Configuration

1. **JSON Validation**: Use a JSON validator to check syntax
2. **Application Test**: Load the app and check for error messages
3. **Visual Check**: Verify colors, logos, and team names appear correctly
4. **Storage Check**: Ensure no conflicts with existing data
5. **Integration Test**: Test league table and other integrations if enabled
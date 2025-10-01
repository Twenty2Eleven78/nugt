# Design Document

## Overview

The multi-team configuration feature will transform the current Netherton United-specific application into a flexible, configurable system that can be easily customized for any football team or club. The design centers around a JSON configuration file that contains all team-specific information, with a configuration management system that loads and applies these settings throughout the application.

## Architecture

### Configuration-Driven Architecture

The application will adopt a configuration-driven architecture where:

1. **Configuration File**: A single `team-config.json` file contains all team-specific settings
2. **Configuration Service**: A centralized service loads, validates, and provides configuration data
3. **Dynamic Application**: All components consume configuration data instead of hardcoded values
4. **Fallback System**: Default values ensure the application works even with missing configuration

### Configuration File Structure

```json
{
  "team": {
    "name": "Netherton United",
    "shortName": "NUFC", 
    "abbreviation": "NUGT",
    "defaultOpponentName": "Opposition Team"
  },
  "branding": {
    "primaryColor": "#dc3545",
    "secondaryColor": "#ffffff", 
    "logoUrl": "./nugtlogo.png",
    "faviconUrl": "./favicon.ico",
    "appIconUrl": "./nugt512.png"
  },
  "pwa": {
    "appName": "Netherton United Game Time App",
    "shortName": "NUGT",
    "description": "Advanced football match tracker with attendance, statistics, and enhanced event management",
    "themeColor": "#dc3545",
    "backgroundColor": "#ffffff"
  },
  "integrations": {
    "leagueTable": {
      "enabled": true,
      "defaultUrl": "https://example-league-url.com",
      "corsProxies": [
        "https://corsproxy.io/?",
        "https://cors-anywhere.herokuapp.com/",
        "https://api.allorigins.win/get?url="
      ]
    },
    "statistics": {
      "enabled": true,
      "apiEndpoint": null
    }
  },
  "defaults": {
    "matchDuration": 4200,
    "theme": "red",
    "darkMode": false
  },
  "storage": {
    "keyPrefix": "nugt_",
    "cachePrefix": "nugt-cache-"
  }
}
```

## Components and Interfaces

### 1. Configuration Service (`config-service.js`)

**Purpose**: Central service for loading, validating, and providing configuration data.

**Key Methods**:
- `loadConfig()`: Loads configuration from file with fallback to defaults
- `getTeamConfig()`: Returns team-specific configuration
- `getBrandingConfig()`: Returns branding and visual configuration  
- `getPWAConfig()`: Returns PWA manifest configuration
- `getIntegrationConfig(type)`: Returns integration-specific configuration
- `validateConfig(config)`: Validates configuration structure and values

**Interface**:
```javascript
class ConfigService {
  async loadConfig(configPath = './team-config.json')
  getTeamConfig()
  getBrandingConfig() 
  getPWAConfig()
  getIntegrationConfig(type)
  validateConfig(config)
  onConfigChange(callback)
}
```

### 2. Dynamic Manifest Generator (`manifest-generator.js`)

**Purpose**: Generates PWA manifest.json dynamically based on team configuration.

**Key Methods**:
- `generateManifest()`: Creates manifest object from configuration
- `updateManifest()`: Updates the manifest link in the document head
- `generateIcons()`: Creates icon configuration array

### 3. Branding Service (`branding-service.js`)

**Purpose**: Applies team branding throughout the application.

**Key Methods**:
- `applyBranding()`: Applies colors, logos, and visual elements
- `updateLogo()`: Updates logo elements in the UI
- `applyThemeColors()`: Updates CSS custom properties for colors
- `updateFavicon()`: Updates favicon dynamically

### 4. Configuration UI (`config-ui.js`)

**Purpose**: Provides UI for viewing and editing configuration (admin feature).

**Key Methods**:
- `showConfigModal()`: Displays configuration editing interface
- `validateInput()`: Validates user input for configuration values
- `saveConfiguration()`: Saves updated configuration
- `resetToDefaults()`: Resets configuration to default values

## Data Models

### Configuration Schema

```typescript
interface TeamConfig {
  team: {
    name: string;
    shortName: string;
    abbreviation: string;
    defaultOpponentName: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    appIconUrl: string;
  };
  pwa: {
    appName: string;
    shortName: string;
    description: string;
    themeColor: string;
    backgroundColor: string;
  };
  integrations: {
    leagueTable: {
      enabled: boolean;
      defaultUrl?: string;
      corsProxies: string[];
    };
    statistics: {
      enabled: boolean;
      apiEndpoint?: string;
    };
  };
  defaults: {
    matchDuration: number;
    theme: string;
    darkMode: boolean;
  };
  storage: {
    keyPrefix: string;
    cachePrefix: string;
  };
}
```

### Default Configuration

The system will include a comprehensive default configuration that matches the current Netherton United setup, ensuring backward compatibility.

## Error Handling

### Configuration Loading Errors

1. **Missing Configuration File**: Use default configuration and show setup prompt
2. **Invalid JSON**: Display error message and use defaults
3. **Schema Validation Errors**: Show specific validation errors and use defaults for invalid fields
4. **Network Errors**: Cache last valid configuration and retry loading

### Runtime Configuration Errors

1. **Invalid URLs**: Disable affected features and show user-friendly messages
2. **Missing Assets**: Use fallback assets (default logo, favicon)
3. **Color Format Errors**: Use default colors and log warnings

### Error Recovery

- Graceful degradation: Application continues to function with default values
- User notification: Clear messages about configuration issues
- Automatic retry: Attempt to reload configuration on app restart
- Validation feedback: Specific error messages for configuration editing

## Testing Strategy

### Unit Tests

1. **Configuration Service Tests**:
   - Configuration loading with valid/invalid files
   - Schema validation with various input scenarios
   - Default value fallback behavior
   - Configuration change event handling

2. **Branding Service Tests**:
   - Color application and CSS custom property updates
   - Logo and favicon updates
   - Theme switching functionality

3. **Manifest Generator Tests**:
   - Manifest generation with different configurations
   - Icon array generation
   - PWA metadata creation

### Integration Tests

1. **End-to-End Configuration Flow**:
   - Load configuration → Apply branding → Update UI
   - Configuration changes → Real-time updates
   - Error scenarios → Fallback behavior

2. **Cross-Component Integration**:
   - Configuration service integration with existing modules
   - Storage key prefix updates
   - Team name propagation throughout UI

### Configuration Validation Tests

1. **Schema Validation**:
   - Valid configuration acceptance
   - Invalid field rejection
   - Required field validation
   - Type checking for all fields

2. **Asset Validation**:
   - URL accessibility checks
   - Image format validation
   - Fallback asset loading

### Performance Tests

1. **Configuration Loading Performance**:
   - Initial load time impact
   - Configuration change application speed
   - Memory usage with large configurations

2. **Caching Effectiveness**:
   - Configuration caching behavior
   - Asset caching with dynamic URLs
   - Storage efficiency with custom prefixes

## Implementation Phases

### Phase 1: Core Configuration Infrastructure
- Create configuration service and schema
- Implement configuration loading and validation
- Add default configuration file

### Phase 2: Branding and Visual Updates  
- Implement branding service
- Update UI components to use configuration
- Create dynamic manifest generator

### Phase 3: Integration Configuration
- Update external service integrations
- Implement configurable API endpoints
- Add integration enable/disable functionality

### Phase 4: Configuration Management UI
- Create configuration editing interface
- Add validation and error handling
- Implement configuration export/import

### Phase 5: Documentation and Examples
- Create setup documentation
- Provide example configurations
- Add deployment guides for different teams
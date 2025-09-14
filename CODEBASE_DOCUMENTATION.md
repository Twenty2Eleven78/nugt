# NUFC GameTime App - Complete Codebase Documentation

## Overview
A Progressive Web Application (PWA) for football match tracking with advanced features including real-time scoring, event logging, player management, attendance tracking, and cloud synchronization.

**Version**: 4.0  
**Architecture**: Modular ES6 JavaScript with custom CSS framework  
**Type**: Single Page Application (SPA) with PWA capabilities  

## Core Features

### 1. Match Management
- Real-time timer with pause/resume functionality
- Live scoreboard with team name editing
- Goal tracking with timestamps and player attribution
- Match event logging (cards, fouls, penalties, etc.)
- Half-time and full-time markers

### 2. Player & Team Management
- Dynamic roster management with player profiles
- Attendance tracking for matches
- Team name customization
- Player statistics and history

### 3. Data Persistence & Cloud Sync
- Local storage for offline functionality
- Cloud storage via Netlify Functions
- User authentication with passkey support
- Match data export/import capabilities

### 4. User Interface
- Mobile-first responsive design
- Custom CSS framework (Bootstrap replacement)
- Touch gesture support for tab navigation
- Dark/light theme support with multiple color schemes
- Progressive Web App with offline capabilities

## Architecture Overview

### File Structure
```
nugt/
├── index.html                 # Main HTML file
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker
├── css/
│   ├── all.min.css          # Font Awesome icons
│   └── custom-framework.css  # Custom CSS framework
├── js/
│   ├── main.js              # Application entry point
│   └── modules/
│       ├── app.js           # Main application controller
│       ├── data/            # Data management
│       ├── match/           # Match-related functionality
│       ├── services/        # External services
│       ├── shared/          # Shared utilities
│       └── ui/              # User interface components
└── netlify/functions/       # Serverless functions
```

### Module System
The application uses ES6 modules with a clear separation of concerns:

- **Data Layer**: State management, storage, and data models
- **Business Logic**: Match operations, timer logic, event handling
- **UI Layer**: Components, modals, and user interactions
- **Services**: Authentication, cloud sync, notifications

## Technical Implementation

### 1. Core Technologies
- **Frontend**: Vanilla JavaScript (ES6+), Custom CSS Framework
- **Storage**: LocalStorage + IndexedDB for offline, Netlify Blobs for cloud
- **Authentication**: WebAuthn (Passkeys)
- **PWA**: Service Worker, Web App Manifest
- **Backend**: Netlify Functions (Node.js)

### 2. State Management
Centralized state management using a reactive pattern:

```javascript
// gameState object holds all application state
export const gameState = {
  seconds: 0,
  isRunning: false,
  goals: [],
  matchEvents: [],
  team1History: [],
  team2History: []
};

// stateManager provides controlled mutations
export const stateManager = {
  setTimerState(seconds, isRunning, startTimestamp),
  addGoal(goalData),
  addMatchEvent(eventData),
  // ... other mutation methods
};
```

### 3. Timer System
High-precision timer with persistence across page reloads:

```javascript
class TimerController {
  constructor() {
    this.intervalId = null;
    this.updateInterval = 100; // 100ms precision
  }
  
  start() {
    this.intervalId = setInterval(() => {
      this.updateTimer();
    }, this.updateInterval);
  }
  
  // Handles page visibility changes and maintains accuracy
  handlePageVisibilityChange() {
    if (!document.hidden && gameState.isRunning) {
      this.recalculateFromTimestamp();
    }
  }
}
```

### 4. Event System
Comprehensive event logging with timeline visualization:

```javascript
const EVENT_TYPES = {
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  FOUL: 'Foul',
  PENALTY: 'Penalty',
  HALF_TIME: 'Half Time',
  FULL_TIME: 'Full Time'
};

// Events are stored with timestamps and can be edited/deleted
const eventStructure = {
  id: 'unique-id',
  type: 'EVENT_TYPE',
  timestamp: Date.now(),
  gameTime: 1234, // seconds
  description: 'Event description',
  player: 'Player name',
  team: 'team1|team2'
};
```

### 5. Storage Strategy
Multi-layered storage approach:

```javascript
// Local storage for immediate access
const storage = {
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  load(key, defaultValue) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }
};

// Cloud storage for synchronization
const userMatchesApi = {
  async saveMatchData(matchData) {
    return fetch('/.netlify/functions/user-matches', {
      method: 'POST',
      body: JSON.stringify(matchData)
    });
  }
};
```

## Key Components

### 1. Main Application (app.js)
Central coordinator that initializes all modules and manages application lifecycle.

**Key Functions:**
- `initializeApp()` - Main initialization
- `loadAppState()` - Restore saved state
- `bindEventListeners()` - Set up UI interactions
- `resetTracker()` - Reset application state

### 2. Timer Controller (timer.js)
Manages match timing with high precision and persistence.

**Features:**
- Sub-second precision (100ms updates)
- Automatic pause/resume on page visibility changes
- State persistence across browser sessions
- Game time configuration (40-90 minutes)

### 3. Goal Manager (goals.js)
Handles goal scoring and management.

**Features:**
- Goal modal with player selection
- Timestamp recording
- Goal editing and deletion
- Disallowed goals tracking

### 4. Events Manager (combined-events.js)
Comprehensive event logging system.

**Features:**
- Multiple event types (cards, fouls, penalties)
- Timeline visualization
- Event editing and deletion
- Export capabilities

### 5. Authentication Service (auth.js)
WebAuthn-based authentication system.

**Features:**
- Passkey registration and login
- User session management
- Admin role checking
- Usage tracking

### 6. Custom Modal System (custom-modal.js)
Bootstrap-independent modal system.

**Features:**
- Programmatic modal creation
- Event handling
- Backdrop management
- Mobile-optimized

## UI Framework

### Custom CSS Framework
Lightweight replacement for Bootstrap with:

- **Grid System**: Flexbox-based responsive grid
- **Components**: Buttons, forms, cards, modals
- **Utilities**: Spacing, typography, colors
- **Themes**: Multiple color schemes + dark mode
- **Mobile-First**: Optimized for touch devices

### Theme System
Dynamic theming with CSS custom properties:

```css
:root {
  --theme-primary: #dc3545;
  --theme-primary-light: #e74c3c;
  --theme-primary-dark: #c82333;
  /* ... other theme variables */
}

[data-theme="blue"] {
  --theme-primary: #007bff;
  --theme-primary-light: #0d6efd;
  --theme-primary-dark: #0056b3;
}
```

### Responsive Design
Mobile-first approach with breakpoints:
- XS: 0-575px (Mobile)
- SM: 576-767px (Large Mobile)
- MD: 768-991px (Tablet)
- LG: 992-1199px (Desktop)
- XL: 1200px+ (Large Desktop)

## Data Models

### Match Data Structure
```javascript
const matchData = {
  title: "Match Title",
  notes: "Match notes",
  goals: [
    {
      id: "goal-id",
      timestamp: 1234567890,
      gameTime: 1800,
      player: "Player Name",
      team: "team1",
      isDisallowed: false,
      disallowedReason: ""
    }
  ],
  matchEvents: [
    {
      id: "event-id",
      type: "Yellow Card",
      timestamp: 1234567890,
      gameTime: 1200,
      description: "Event description",
      player: "Player Name",
      team: "team1"
    }
  ],
  team1Name: "Netherton",
  team2Name: "Opposition",
  score1: 2,
  score2: 1,
  gameTime: 4200,
  attendance: [
    {
      id: "player-id",
      name: "Player Name",
      shirtNumber: 10,
      position: "MID",
      isPresent: true
    }
  ],
  savedAt: 1234567890
};
```

### Player Data Structure
```javascript
const player = {
  id: "unique-id",
  name: "Player Name",
  shirtNumber: 10,
  position: "GK|DEF|MID|FWD",
  isActive: true,
  stats: {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0
  }
};
```

## Service Worker & PWA

### Caching Strategy
```javascript
// Cache-first for static assets
// Network-first for HTML documents
// Runtime caching for API responses

const CACHE_NAME = "nugt-cache-v151";
const cacheFiles = [
  './',
  './index.html',
  './css/custom-framework.css',
  './js/main.js',
  // ... all static assets
];
```

### Offline Functionality
- Complete offline operation for match tracking
- Background sync for cloud data when online
- Automatic cache updates
- Offline indicator

## API Integration

### Netlify Functions
Serverless backend for cloud functionality:

```javascript
// user-matches.js - Main API endpoint
exports.handler = async (event, context) => {
  const method = event.httpMethod;
  
  switch (method) {
    case 'GET':
      return await getMatches(event);
    case 'POST':
      return await saveMatch(event);
    case 'DELETE':
      return await deleteMatch(event);
    default:
      return { statusCode: 405 };
  }
};
```

### Authentication Flow
1. User initiates login/register
2. WebAuthn challenge generated
3. Biometric/PIN verification
4. Credential stored securely
5. Session token issued
6. API access granted

## Performance Optimizations

### 1. Code Splitting
- Modular architecture allows selective loading
- Dynamic imports for non-critical features
- Lazy loading of modal components

### 2. Asset Optimization
- Font preloading for critical fonts
- Image optimization and lazy loading
- CSS custom properties for theming
- Minimal external dependencies

### 3. Memory Management
- Event listener cleanup
- Timer interval management
- Storage quota monitoring
- Garbage collection optimization

### 4. Mobile Optimizations
- Touch-optimized UI elements
- Reduced animations on low-power devices
- Efficient scroll handling
- Battery-conscious timer updates

## Security Considerations

### 1. Authentication
- WebAuthn for secure authentication
- No password storage
- Session token management
- Admin role verification

### 2. Data Protection
- Client-side data encryption
- Secure API communication
- Input validation and sanitization
- XSS prevention

### 3. Privacy
- Minimal data collection
- Local-first approach
- Optional cloud sync
- User data control

## Deployment & Configuration

### Build Process
1. No build step required (vanilla JS)
2. Asset optimization via CDN
3. Service worker registration
4. Manifest validation

### Environment Setup
```javascript
// Configuration constants
const API_CONFIG = {
  BASE_URL: '/.netlify/functions',
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3
};

const GAME_CONFIG = {
  DEFAULT_GAME_TIME: 4200, // 70 minutes
  TIMER_UPDATE_INTERVAL: 100,
  AUTO_SAVE_INTERVAL: 5000
};
```

### Netlify Configuration
```toml
# netlify.toml
[build]
  functions = "netlify/functions"
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

## Testing Strategy

### 1. Unit Testing
- Module isolation testing
- State management validation
- Timer accuracy verification
- Storage functionality testing

### 2. Integration Testing
- Component interaction testing
- API integration validation
- Authentication flow testing
- PWA functionality verification

### 3. Performance Testing
- Load time optimization
- Memory usage monitoring
- Battery consumption testing
- Network efficiency validation

## Maintenance & Updates

### 1. Version Management
- Semantic versioning (MAJOR.MINOR.PATCH)
- Service worker cache versioning
- Database migration handling
- Backward compatibility

### 2. Monitoring
- Error tracking and reporting
- Performance metrics collection
- User analytics (privacy-focused)
- System health monitoring

### 3. Update Process
- Automatic service worker updates
- User notification system
- Graceful degradation
- Rollback capabilities

## Extension Points

### 1. New Features
- Video recording integration
- Advanced statistics
- Multi-language support
- Tournament management

### 2. Integrations
- Third-party APIs
- Social media sharing
- Calendar integration
- Notification services

### 3. Customization
- Team branding
- Custom event types
- Configurable UI layouts
- Plugin architecture

## Development Guidelines

### 1. Code Standards
- ES6+ JavaScript features
- Modular architecture
- Consistent naming conventions
- Comprehensive error handling

### 2. Performance Guidelines
- Minimize DOM manipulation
- Efficient event handling
- Memory leak prevention
- Battery optimization

### 3. Accessibility
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

### 4. Browser Support
- Modern browsers (ES6+ support)
- Progressive enhancement
- Graceful degradation
- Mobile browser optimization

## Conclusion

The NUFC GameTime App represents a modern, efficient approach to football match tracking with a focus on performance, usability, and reliability. The modular architecture and comprehensive feature set make it suitable for both casual and professional use cases while maintaining simplicity and ease of use.

The codebase is designed for maintainability and extensibility, with clear separation of concerns and well-defined interfaces between components. The custom CSS framework provides a lightweight alternative to heavy UI libraries while maintaining full functionality and responsive design.

This documentation provides the foundation for understanding, maintaining, and extending the application while preserving its core principles of performance, usability, and reliability.
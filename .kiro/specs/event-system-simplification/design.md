# Design Document

## Overview

The current event management system has evolved into a complex structure with overlapping responsibilities between `enhanced-events.js` and `combined-events.js`. The design aims to create a single, unified event management system that consolidates all event-related functionality while maintaining clean modular architecture and improving performance.

## Current State Analysis

### Existing Files
- **enhanced-events.js**: Handles event statistics and filtering (simplified version with removed search/export)
- **combined-events.js**: Comprehensive events manager with both basic and enhanced functionality
- **event-modals.js**: Modal management for event recording and editing

### Issues Identified
1. **Code Duplication**: Both files implement event statistics calculation
2. **Redundant Initialization**: Multiple event managers being initialized
3. **Inconsistent Interfaces**: Different methods for similar functionality
4. **Memory Overhead**: Multiple instances handling the same data
5. **Maintenance Complexity**: Changes need to be made in multiple places

## Architecture

### Unified Event Management System

The new design consolidates all event functionality into a single, well-structured module:

```
EventManager (Single Source of Truth)
├── Core Event Operations
│   ├── Add/Edit/Delete Events
│   ├── Timeline Management
│   └── Event Validation
├── Statistics & Analytics
│   ├── Real-time Statistics
│   ├── Event Categorization
│   └── Performance Metrics
├── UI Integration
│   ├── Timeline Rendering
│   ├── Modal Management
│   └── Event Display
└── Data Persistence
    ├── State Management
    ├── Storage Operations
    └── Data Synchronization
```

## Components and Interfaces

### 1. Core EventManager Class

**Primary Responsibilities:**
- Centralized event lifecycle management
- Statistics calculation and caching
- Timeline rendering and updates
- Integration with state management

**Key Methods:**
```javascript
class EventManager {
  // Core Operations
  addEvent(eventData)
  updateEvent(index, updates, type)
  deleteEvent(index, type)
  
  // Statistics
  calculateStatistics()
  updateStatisticsDisplay()
  
  // UI Management
  renderTimeline()
  updateEventDisplay()
  
  // Modal Integration
  showRecordModal()
  showEditModal(index, type)
}
```

### 2. Event Statistics Module

**Responsibilities:**
- Real-time statistics calculation
- Efficient caching of computed values
- Statistics display updates

**Implementation:**
- Single calculation method used by all components
- Cached results to avoid redundant calculations
- Event-driven updates when data changes

### 3. Timeline Renderer

**Responsibilities:**
- Efficient DOM manipulation for timeline
- Event item creation and styling
- Action button management

**Optimizations:**
- Document fragments for batch DOM updates
- Event delegation for action buttons
- Minimal DOM queries through caching

### 4. Modal Integration Layer

**Responsibilities:**
- Seamless integration with existing modal system
- Form data handling and validation
- Event lifecycle coordination

## Data Models

### Event Data Structure
```javascript
{
  timestamp: string,      // Formatted time display
  rawTime: number,        // Seconds for calculations
  type: string,          // Event type from constants
  notes: string,         // Optional description
  team: number,          // Team association (1 or 2)
  teamName: string,      // Team name at time of event
  originalIndex: number, // Index in original array
  updatetype: string     // 'goal' or 'matchEvent'
}
```

### Statistics Data Structure
```javascript
{
  goals: number,         // Valid goals count
  cards: number,         // All card events
  fouls: number,         // Foul events
  total: number,         // Total events
  lastUpdated: timestamp // Cache invalidation
}
```

## Error Handling

### Event Operation Errors
- Validation of event data before processing
- Graceful handling of invalid indices
- User-friendly error messages through notification system

### UI Error Recovery
- Fallback rendering for corrupted timeline data
- Modal state recovery on errors
- Automatic retry mechanisms for failed operations

### Data Consistency
- State validation before persistence
- Rollback mechanisms for failed operations
- Conflict resolution for concurrent updates

## Testing Strategy

### Unit Testing
- **Event Operations**: Test all CRUD operations with various data scenarios
- **Statistics Calculation**: Verify accuracy with different event combinations
- **Data Validation**: Test edge cases and invalid inputs
- **State Management**: Ensure proper state transitions

### Integration Testing
- **Modal Integration**: Test complete event recording/editing workflows
- **Timeline Rendering**: Verify correct display with various event types
- **Statistics Updates**: Ensure real-time updates work correctly
- **Storage Integration**: Test data persistence and retrieval

### Performance Testing
- **Memory Usage**: Monitor memory consumption with large event datasets
- **Rendering Performance**: Test timeline rendering with many events
- **Statistics Calculation**: Benchmark calculation performance
- **DOM Operations**: Measure DOM manipulation efficiency

## Migration Strategy

### Phase 1: Consolidation
1. Create new unified EventManager class
2. Migrate core functionality from combined-events.js
3. Integrate statistics from enhanced-events.js
4. Maintain backward compatibility

### Phase 2: Optimization
1. Implement performance optimizations
2. Add caching for statistics
3. Optimize DOM operations
4. Enhance error handling

### Phase 3: Cleanup
1. Remove redundant files
2. Update import statements
3. Clean up unused code
4. Update documentation

## Performance Optimizations

### Statistics Caching
- Cache calculated statistics until data changes
- Invalidate cache only when events are modified
- Lazy calculation for expensive operations

### DOM Optimization
- Use document fragments for batch updates
- Implement event delegation for action buttons
- Cache frequently accessed DOM elements

### Memory Management
- Single event manager instance
- Efficient event listener management
- Proper cleanup on component destruction

## Backward Compatibility

### Export Compatibility
- Maintain existing export names for smooth transition
- Provide aliases for deprecated methods
- Gradual migration path for dependent modules

### API Consistency
- Keep existing method signatures where possible
- Provide migration guides for changed interfaces
- Deprecation warnings for removed functionality
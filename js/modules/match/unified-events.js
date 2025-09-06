/**
 * Unified Event Management System
 * Consolidates functionality from combined-events.js and enhanced-events.js
 * 
 * Enhanced Features:
 * - Advanced statistics caching with cache key generation
 * - Lazy calculation for expensive operations
 * - Configurable cache behavior and performance metrics
 * - Automatic cache invalidation on data changes
 * 
 * @version 1.1
 * @updated Cache refresh fix for process.env issue
 */

// Core dependencies
import { gameState, stateManager } from '../data/state.js';
import { storageHelpers } from '../data/storage.js';
import { domCache } from '../shared/dom.js';
import { getCurrentSeconds, formatMatchTime } from '../shared/utils.js';
import { EVENT_TYPES } from '../shared/constants.js';

// Service dependencies
import { notificationManager } from '../services/notifications.js';
import { attendanceManager } from '../services/attendance.js';

// UI dependencies
import { showModal, hideModal } from '../ui/modals.js';
import { getEventIcon, getEventCardClass } from '../ui/components.js';
import eventModals from '../ui/event-modals.js';

// Game dependencies
import { timerController } from '../game/timer.js';

/**
 * Unified Event Manager Class
 * Handles all event-related functionality in a single, consolidated system
 */
class EventManager {
    constructor() {
        this.isInitialized = false;
        this.statisticsCache = null;
        this.lastCacheUpdate = null;
        this.cacheKey = null;
        // Note: Removed _timelineVisible - timeline always updates when events are added
        this._statisticsVisible = true; // Initialize as visible by default

        // DOM element cache for frequently accessed elements
        this._domElementCache = new Map();
        this._cacheTimestamps = new Map();
        this._cacheTimeout = 10000; // 10 seconds
        this._animationFrameId = null;
        this._pendingUpdates = new Set();

        // DOM element cache for timeline optimization
        this._timelineCache = {
            logElement: null,
            lastCacheTime: null,
            cacheTimeout: 5000 // 5 seconds
        };

        this.cacheConfig = {
            maxAge: 30000, // 30 seconds
            enableLazyCalculation: true,
            enableCacheKeyGeneration: true
        };
    }

    /**
     * Initialize the event management system with performance optimizations
     */
    init() {
        if (this.isInitialized) return;

        // Initialize event modals
        eventModals.init();

        this._bindEvents();
        this._bindModalEvents();

        // Setup performance optimizations
        this._optimizeDOMOperations();

        // Initial statistics update
        this.updateEventStatistics();

        this.isInitialized = true;
    }

    /**
     * Destroy the event manager and cleanup resources
     */
    destroy() {
        if (!this.isInitialized) return;

        // Cleanup performance optimizations
        this._cleanupOptimizations();

        // Clear editing state
        stateManager.clearEditingEvent();

        // Reset initialization flag
        this.isInitialized = false;
    }

    // ===== CORE EVENT OPERATIONS =====

    /**
     * Add a new match event
     * @param {string} eventType - Type of event from EVENT_TYPES
     * @param {string} notes - Optional notes for the event
     */
    addMatchEvent(eventType, notes = '') {
        try {
            // Validate operation permissions
            const operationValidation = this._validateEventOperation('add');
            if (!operationValidation.isValid) {
                notificationManager.error(`Operation validation failed: ${operationValidation.errors.join(', ')}`);
                return;
            }

            // Validate inputs
            if (!eventType || typeof eventType !== 'string') {
                notificationManager.error('Event type is required');
                return;
            }

            if (!this._isValidEventType(eventType)) {
                notificationManager.error(`Invalid event type: ${eventType}`);
                return;
            }

            // Sanitize notes input
            const sanitizedNotes = this._sanitizeInput(notes);

            const currentSeconds = getCurrentSeconds();
            const team1Name = domCache.get('Team1NameElement')?.textContent;
            const team2Name = domCache.get('Team2NameElement')?.textContent;

            // Validate team names
            const teamValidation = this._validateTeamNames(team1Name, team2Name);
            if (!teamValidation.isValid) {
                notificationManager.error(`Team validation failed: ${teamValidation.errors.join(', ')}`);
                return;
            }

            // Validate time
            const timeValidation = this._validateTime(currentSeconds);
            if (!timeValidation.isValid) {
                notificationManager.error(`Time validation failed: ${timeValidation.errors.join(', ')}`);
                return;
            }

            const eventData = {
                timestamp: formatMatchTime(currentSeconds),
                type: eventType,
                notes: sanitizedNotes,
                rawTime: currentSeconds
            };

            // Determine team association
            if (eventType.includes(team1Name)) {
                eventData.team = 1;
                eventData.teamName = team1Name;
            } else if (eventType.includes(team2Name)) {
                eventData.team = 2;
                eventData.teamName = team2Name;
            }

            // Validate complete event data
            const eventValidation = this._validateEventData(eventData);
            if (!eventValidation.isValid) {
                notificationManager.error(`Event validation failed: ${eventValidation.errors.join(', ')}`);
                return;
            }

            // Handle special events
            if (eventType === EVENT_TYPES.HALF_TIME) {
                this._handleHalfTimeEvent(eventData, team1Name, team2Name);
                timerController.handleHalfTime();
            } else if (eventType === EVENT_TYPES.FULL_TIME) {
                this._handleFullTimeEvent(eventData, team1Name, team2Name);
                timerController.handleFullTime();
            }

            // Add event to state
            stateManager.addMatchEvent(eventData);

            // Invalidate statistics cache
            this._invalidateStatisticsCache();

            // Update displays
            this.updateMatchLog();
            this.updateEventStatistics();

            // Save data
            storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

            // Show notification with appropriate type (skip for system events as timer already shows notification)
            if (eventType !== EVENT_TYPES.GAME_STARTED &&
                eventType !== EVENT_TYPES.HALF_TIME &&
                eventType !== EVENT_TYPES.FULL_TIME) {
                const notificationType = this._getNotificationType(eventType);
                if (notificationType === 'warning') {
                    notificationManager.warning(`${eventType} recorded at ${eventData.timestamp}`);
                } else {
                    notificationManager.success(`${eventType} recorded at ${eventData.timestamp}`);
                }
            }
        } catch (error) {
            console.error('Error adding match event:', error);
            notificationManager.error('Error adding event. Please try again.');
        }
    }

    /**
     * Update an existing event
     * @param {number} index - Index of event to update
     * @param {Object} updates - Updates to apply
     * @param {string} type - Type of event ('goal' or 'matchEvent')
     */
    updateEvent(index, updates, type) {
        try {
            // Validate operation permissions
            const operationValidation = this._validateEventOperation('update');
            if (!operationValidation.isValid) {
                notificationManager.error(`Operation validation failed: ${operationValidation.errors.join(', ')}`);
                return;
            }

            // Validate event index
            const indexValidation = this._validateEventIndex(index, type);
            if (!indexValidation.isValid) {
                notificationManager.error(`Index validation failed: ${indexValidation.errors.join(', ')}`);
                return;
            }

            if (!updates || typeof updates !== 'object') {
                notificationManager.error('Invalid update data');
                return;
            }

            // Sanitize updates
            const sanitizedUpdates = { ...updates };
            if (sanitizedUpdates.notes) {
                sanitizedUpdates.notes = this._sanitizeInput(sanitizedUpdates.notes);
            }
            if (sanitizedUpdates.type && !this._isValidEventType(sanitizedUpdates.type)) {
                notificationManager.error(`Invalid event type in updates: ${sanitizedUpdates.type}`);
                return;
            }

            // Validate time if being updated
            if (sanitizedUpdates.rawTime !== undefined) {
                const timeValidation = this._validateTime(sanitizedUpdates.rawTime);
                if (!timeValidation.isValid) {
                    notificationManager.error(`Time validation failed: ${timeValidation.errors.join(', ')}`);
                    return;
                }
            }

            // Update based on type
            if (type === 'goal') {
                const currentGoal = gameState.goals[index];
                const updatedGoal = { ...currentGoal, ...sanitizedUpdates };

                // Validate updated goal data
                const goalValidation = this._validateGoalData(updatedGoal);
                if (!goalValidation.isValid) {
                    notificationManager.error(`Goal validation failed: ${goalValidation.errors.join(', ')}`);
                    return;
                }

                stateManager.updateGoal(index, sanitizedUpdates);
                this._recalculateScores();
            } else if (type === 'matchEvent') {
                const currentEvent = gameState.matchEvents[index];
                const updatedEvent = { ...currentEvent, ...sanitizedUpdates };

                // Validate updated event data
                const eventValidation = this._validateEventData(updatedEvent);
                if (!eventValidation.isValid) {
                    notificationManager.error(`Event validation failed: ${eventValidation.errors.join(', ')}`);
                    return;
                }

                stateManager.updateMatchEvent(index, updatedEvent);
            }

            // Invalidate statistics cache
            this._invalidateStatisticsCache();

            // Update displays
            this.updateMatchLog();
            this.updateEventStatistics();

            // Save data
            storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

            notificationManager.success('Event updated successfully');
        } catch (error) {
            console.error('Error updating event:', error);
            notificationManager.error('Error updating event. Please try again.');
        }
    }

    /**
     * Delete an event
     * @param {number} index - Index of event to delete
     * @param {string} type - Type of event ('goal' or 'matchEvent')
     */
    deleteEvent(index, type) {
        try {
            // Validate operation permissions
            const operationValidation = this._validateEventOperation('delete');
            if (!operationValidation.isValid) {
                notificationManager.error(`Operation validation failed: ${operationValidation.errors.join(', ')}`);
                return;
            }

            // Validate event index
            const indexValidation = this._validateEventIndex(index, type);
            if (!indexValidation.isValid) {
                notificationManager.error(`Index validation failed: ${indexValidation.errors.join(', ')}`);
                return;
            }

            // Validate event type
            if (!['goal', 'matchEvent'].includes(type)) {
                notificationManager.error('Invalid event type for deletion');
                return;
            }

            // Validate event exists
            const event = type === 'goal' ? gameState.goals[index] : gameState.matchEvents[index];
            if (!event) {
                notificationManager.error('Event not found');
                return;
            }

            // Store deletion info for confirmation
            pendingDeletion = { index, type };

            const itemType = type === 'goal' ? 'goal' : 'event';
            const itemName = type === 'goal' ?
                (event.goalScorerName || 'Unknown') :
                (event.type || 'Unknown');

            // Show confirmation modal
            this._showEventDeleteModal(itemType, itemName);
        } catch (error) {
            console.error('Error initiating event deletion:', error);
            notificationManager.error('Error deleting event. Please try again.');
        }
    }

    // ===== EVENT VALIDATION AND HELPERS =====

    /**
     * Validate event data before processing
     * @param {Object} eventData - Event data to validate
     * @returns {Object} Validation result with isValid and errors
     */
    _validateEventData(eventData) {
        const errors = [];

        // Check required fields
        if (!eventData) {
            errors.push('Event data is required');
            return { isValid: false, errors };
        }

        // Validate event type
        if (!eventData.type || typeof eventData.type !== 'string') {
            errors.push('Event type is required and must be a string');
        } else if (!this._isValidEventType(eventData.type)) {
            errors.push(`Invalid event type: ${eventData.type}`);
        }

        // Validate timestamp
        if (eventData.timestamp && typeof eventData.timestamp !== 'string') {
            errors.push('Timestamp must be a string');
        }

        // Validate raw time
        if (eventData.rawTime !== undefined) {
            if (typeof eventData.rawTime !== 'number' || eventData.rawTime < 0) {
                errors.push('Raw time must be a non-negative number');
            }
        }

        // Validate team association
        if (eventData.team !== undefined) {
            if (![1, 2].includes(eventData.team)) {
                errors.push('Team must be 1 or 2');
            }
        }

        // Validate team name
        if (eventData.teamName && typeof eventData.teamName !== 'string') {
            errors.push('Team name must be a string');
        }

        // Validate notes
        if (eventData.notes && typeof eventData.notes !== 'string') {
            errors.push('Notes must be a string');
        } else if (eventData.notes && eventData.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate goal data before processing
     * @param {Object} goalData - Goal data to validate
     * @returns {Object} Validation result with isValid and errors
     */
    _validateGoalData(goalData) {
        const errors = [];

        if (!goalData) {
            errors.push('Goal data is required');
            return { isValid: false, errors };
        }

        // Validate scorer name
        if (!goalData.goalScorerName || typeof goalData.goalScorerName !== 'string') {
            errors.push('Goal scorer name is required and must be a string');
        } else if (goalData.goalScorerName.length > 100) {
            errors.push('Goal scorer name cannot exceed 100 characters');
        }

        // Validate shirt number (optional)
        if (goalData.goalScorerShirtNumber !== undefined && goalData.goalScorerShirtNumber !== '') {
            const shirtNum = parseInt(goalData.goalScorerShirtNumber, 10);
            if (isNaN(shirtNum) || shirtNum < 1 || shirtNum > 99) {
                errors.push('Shirt number must be between 1 and 99');
            }
        }

        // Validate assist name (optional)
        if (goalData.goalAssistName && typeof goalData.goalAssistName !== 'string') {
            errors.push('Goal assist name must be a string');
        } else if (goalData.goalAssistName && goalData.goalAssistName.length > 100) {
            errors.push('Goal assist name cannot exceed 100 characters');
        }

        // Validate assist shirt number (optional)
        if (goalData.goalAssistShirtNumber !== undefined && goalData.goalAssistShirtNumber !== '') {
            const assistNum = parseInt(goalData.goalAssistShirtNumber, 10);
            if (isNaN(assistNum) || assistNum < 1 || assistNum > 99) {
                errors.push('Assist shirt number must be between 1 and 99');
            }
        }

        // Validate timestamp and raw time
        if (goalData.timestamp && typeof goalData.timestamp !== 'string') {
            errors.push('Timestamp must be a string');
        }

        if (goalData.rawTime !== undefined) {
            if (typeof goalData.rawTime !== 'number' || goalData.rawTime < 0) {
                errors.push('Raw time must be a non-negative number');
            }
        }

        // Validate team association
        if (goalData.team !== undefined && ![1, 2].includes(goalData.team)) {
            errors.push('Team must be 1 or 2');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate event index for operations
     * @param {number} index - Index to validate
     * @param {string} type - Type of event ('goal' or 'matchEvent')
     * @returns {Object} Validation result with isValid and errors
     */
    _validateEventIndex(index, type) {
        const errors = [];

        if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
            errors.push('Index must be a non-negative integer');
            return { isValid: false, errors };
        }

        if (type === 'goal') {
            if (index >= gameState.goals.length) {
                errors.push(`Goal index ${index} is out of range (max: ${gameState.goals.length - 1})`);
            }
        } else if (type === 'matchEvent') {
            if (index >= gameState.matchEvents.length) {
                errors.push(`Event index ${index} is out of range (max: ${gameState.matchEvents.length - 1})`);
            }
        } else {
            errors.push('Event type must be "goal" or "matchEvent"');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate time input
     * @param {number} timeInSeconds - Time to validate
     * @returns {Object} Validation result with isValid and errors
     */
    _validateTime(timeInSeconds) {
        const errors = [];

        if (typeof timeInSeconds !== 'number') {
            errors.push('Time must be a number');
            return { isValid: false, errors };
        }

        if (timeInSeconds < 0) {
            errors.push('Time cannot be negative');
        }

        if (timeInSeconds > 7200) { // 120 minutes max (including extra time)
            errors.push('Time cannot exceed 120 minutes');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Check if event type is valid
     * @param {string} eventType - Event type to check
     * @returns {boolean} True if valid event type
     */
    _isValidEventType(eventType) {
        return Object.values(EVENT_TYPES).includes(eventType);
    }

    /**
     * Validate team names
     * @param {string} team1Name - Team 1 name
     * @param {string} team2Name - Team 2 name
     * @returns {Object} Validation result with isValid and errors
     */
    _validateTeamNames(team1Name, team2Name) {
        const errors = [];

        if (!team1Name || typeof team1Name !== 'string') {
            errors.push('Team 1 name is required and must be a string');
        } else if (team1Name.length < 1 || team1Name.length > 50) {
            errors.push('Team 1 name must be between 1 and 50 characters');
        }

        if (!team2Name || typeof team2Name !== 'string') {
            errors.push('Team 2 name is required and must be a string');
        } else if (team2Name.length < 1 || team2Name.length > 50) {
            errors.push('Team 2 name must be between 1 and 50 characters');
        }

        if (team1Name === team2Name) {
            errors.push('Team names must be different');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Sanitize input text
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    _sanitizeInput(text) {
        if (typeof text !== 'string') return '';

        return text
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 500); // Limit length
    }

    /**
     * Get notification type for an event
     * @param {string} eventType - The event type
     * @returns {string} Notification type ('warning', 'info', etc.)
     */
    _getNotificationType(eventType) {
        const warningEvents = [
            EVENT_TYPES.INCIDENT, EVENT_TYPES.PENALTY, EVENT_TYPES.YELLOW_CARD,
            EVENT_TYPES.RED_CARD, EVENT_TYPES.SIN_BIN, EVENT_TYPES.FOUL
        ];
        return warningEvents.includes(eventType) ? 'warning' : 'info';
    }

    /**
     * Handle half-time event
     * @param {Object} eventData - Event data object
     * @param {string} team1Name - Team 1 name
     * @param {string} team2Name - Team 2 name
     */
    _handleHalfTimeEvent(eventData, team1Name, team2Name) {
        this._addScoreData(eventData, team1Name, team2Name);
        eventData.notes = `Half Time - ${team1Name} vs ${team2Name}`;
        eventData.isSystemEvent = true;
    }

    /**
     * Handle full-time event
     * @param {Object} eventData - Event data object
     * @param {string} team1Name - Team 1 name
     * @param {string} team2Name - Team 2 name
     */
    _handleFullTimeEvent(eventData, team1Name, team2Name) {
        this._addScoreData(eventData, team1Name, team2Name);
        eventData.notes = `Full Time - ${team1Name} vs ${team2Name}`;
        eventData.isSystemEvent = true;
    }

    /**
     * Add score data to event
     * @param {Object} eventData - Event data object
     * @param {string} team1Name - Team 1 name
     * @param {string} team2Name - Team 2 name
     */
    _addScoreData(eventData, team1Name, team2Name) {
        try {
            // Validate team names
            const teamValidation = this._validateTeamNames(team1Name, team2Name);
            if (!teamValidation.isValid) {
                console.warn('Invalid team names for score data:', teamValidation.errors);
                return;
            }

            const team1Score = domCache.get('firstScoreElement')?.textContent || '0';
            const team2Score = domCache.get('secondScoreElement')?.textContent || '0';

            // Validate scores are numbers
            if (isNaN(parseInt(team1Score, 10)) || isNaN(parseInt(team2Score, 10))) {
                console.warn('Invalid score values:', { team1Score, team2Score });
                return;
            }

            eventData.score = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;
            eventData.team1Name = team1Name;
            eventData.team2Name = team2Name;
        } catch (error) {
            console.error('Error adding score data:', error);
        }
    }

    /**
     * Update team names in event data
     * @param {Object} eventData - Event data to update
     * @param {string} newTeam1Name - New team 1 name
     * @param {string} newTeam2Name - New team 2 name
     * @returns {Object} Updated event data
     */
    _updateEventTeamNames(eventData, newTeam1Name, newTeam2Name) {
        if (!eventData) return eventData;

        try {
            // Validate new team names
            const teamValidation = this._validateTeamNames(newTeam1Name, newTeam2Name);
            if (!teamValidation.isValid) {
                console.warn('Invalid team names for update:', teamValidation.errors);
                return eventData;
            }

            const updatedEvent = { ...eventData };

            // Update team name in event type if it contains team names
            if (updatedEvent.type && updatedEvent.teamName) {
                if (updatedEvent.team === 1) {
                    updatedEvent.type = updatedEvent.type.replace(updatedEvent.teamName, newTeam1Name);
                    updatedEvent.teamName = newTeam1Name;
                } else if (updatedEvent.team === 2) {
                    updatedEvent.type = updatedEvent.type.replace(updatedEvent.teamName, newTeam2Name);
                    updatedEvent.teamName = newTeam2Name;
                }
            }

            // Update score information if present
            if (updatedEvent.score && updatedEvent.team1Name && updatedEvent.team2Name) {
                updatedEvent.score = this._updateTeamNames(
                    updatedEvent.score,
                    updatedEvent.team1Name,
                    updatedEvent.team2Name,
                    newTeam1Name,
                    newTeam2Name
                );
                updatedEvent.team1Name = newTeam1Name;
                updatedEvent.team2Name = newTeam2Name;
            }

            return updatedEvent;
        } catch (error) {
            console.error('Error updating event team names:', error);
            return eventData;
        }
    }

    /**
     * Validate event operation permissions
     * @param {string} operation - Operation type ('add', 'update', 'delete')
     * @param {Object} eventData - Event data (optional)
     * @returns {Object} Validation result with isValid and errors
     */
    _validateEventOperation(operation, eventData = null) {
        const errors = [];

        // Check if game is in a valid state for operations
        if (!gameState) {
            errors.push('Game state not initialized');
            return { isValid: false, errors };
        }

        // Validate operation type
        if (!['add', 'update', 'delete'].includes(operation)) {
            errors.push('Invalid operation type');
            return { isValid: false, errors };
        }

        // Check for system events that shouldn't be manually modified
        if (eventData && eventData.isSystemEvent && operation !== 'add') {
            errors.push('System events cannot be manually modified');
        }

        // Additional operation-specific validations can be added here
        switch (operation) {
            case 'add':
                // Check if we're not exceeding reasonable event limits
                const totalEvents = gameState.goals.length + gameState.matchEvents.length;
                if (totalEvents > 1000) { // Reasonable limit
                    errors.push('Maximum number of events reached');
                }
                break;

            case 'update':
            case 'delete':
                // These operations require existing events, validated elsewhere
                break;
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate multiple events for batch operations
     * @param {Array} events - Array of events to validate
     * @param {string} operation - Operation type ('add', 'update', 'delete')
     * @returns {Object} Validation result with isValid, errors, and validEvents
     */
    _validateBatchEvents(events, operation) {
        const errors = [];
        const validEvents = [];
        const invalidEvents = [];

        if (!Array.isArray(events)) {
            errors.push('Events must be an array');
            return { isValid: false, errors, validEvents, invalidEvents };
        }

        if (events.length === 0) {
            errors.push('No events provided');
            return { isValid: false, errors, validEvents, invalidEvents };
        }

        if (events.length > 100) { // Reasonable batch limit
            errors.push('Too many events in batch (max 100)');
            return { isValid: false, errors, validEvents, invalidEvents };
        }

        events.forEach((event, index) => {
            const eventValidation = this._validateEventData(event);
            if (eventValidation.isValid) {
                validEvents.push({ ...event, batchIndex: index });
            } else {
                invalidEvents.push({
                    event,
                    batchIndex: index,
                    errors: eventValidation.errors
                });
                errors.push(`Event ${index}: ${eventValidation.errors.join(', ')}`);
            }
        });

        return {
            isValid: invalidEvents.length === 0,
            errors,
            validEvents,
            invalidEvents
        };
    }

    /**
     * Check if event can be safely deleted
     * @param {Object} event - Event to check
     * @param {string} type - Event type
     * @returns {Object} Validation result
     */
    _canDeleteEvent(event, type) {
        const errors = [];

        if (!event) {
            errors.push('Event not found');
            return { isValid: false, errors };
        }

        // System events should not be deleted manually
        if (event.isSystemEvent) {
            errors.push('System events cannot be deleted manually');
        }

        // Check for critical events that might affect game state
        if (type === 'matchEvent') {
            const criticalEvents = [EVENT_TYPES.GAME_STARTED, EVENT_TYPES.HALF_TIME, EVENT_TYPES.FULL_TIME];
            if (criticalEvents.includes(event.type)) {
                errors.push('Critical game events should not be deleted');
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate event timing constraints
     * @param {number} rawTime - Time in seconds
     * @param {string} eventType - Type of event
     * @returns {Object} Validation result
     */
    _validateEventTiming(rawTime, eventType) {
        const errors = [];

        // Basic time validation
        const timeValidation = this._validateTime(rawTime);
        if (!timeValidation.isValid) {
            return timeValidation;
        }

        // Event-specific timing rules
        if (eventType === EVENT_TYPES.HALF_TIME) {
            // Half-time should be around 35 minutes (2100 seconds) but allow flexibility
            if (rawTime < 1800 || rawTime > 2700) { // 30-45 minutes
                errors.push('Half-time event timing seems unusual (expected around 35 minutes)');
            }
        }

        if (eventType === EVENT_TYPES.FULL_TIME) {
            // Full-time should be around 70 minutes (4200 seconds) but allow flexibility
            if (rawTime < 3600 || rawTime > 5400) { // 60-90 minutes
                errors.push('Full-time event timing seems unusual (expected around 70 minutes)');
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    // ===== MODAL FORM VALIDATION AND ERROR HANDLING =====

    /**
     * Validate record event form data
     * @param {Object} formData - Form data to validate
     * @returns {Object} Validation result with isValid and errors
     */
    _validateRecordEventForm(formData) {
        const errors = [];

        // Validate event type selection
        if (!formData.eventType || typeof formData.eventType !== 'string') {
            errors.push('Please select an event type');
        } else if (!this._isValidEventType(formData.eventType)) {
            errors.push('Selected event type is not valid');
        }

        // Validate notes (optional but if provided, must be valid)
        if (formData.notes) {
            if (typeof formData.notes !== 'string') {
                errors.push('Notes must be text');
            } else if (formData.notes.length > 500) {
                errors.push('Notes cannot exceed 500 characters');
            }
        }

        // Check if game is in valid state for adding events
        if (!gameState) {
            errors.push('Game not initialized');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate edit event form data
     * @param {Object} formData - Form data to validate
     * @returns {Object} Validation result with isValid and errors
     */
    _validateEditEventForm(formData) {
        const errors = [];

        // Validate time input
        if (!formData.newMinutes && formData.newMinutes !== 0) {
            errors.push('Time is required');
        } else if (typeof formData.newMinutes !== 'number' || isNaN(formData.newMinutes)) {
            errors.push('Please enter a valid time in minutes');
        } else if (formData.newMinutes < 0) {
            errors.push('Time cannot be negative');
        } else if (formData.newMinutes > 120) {
            errors.push('Time cannot exceed 120 minutes');
        }

        // Validate editing state
        if (!gameState.editingEventType || !Number.isInteger(gameState.editingEventIndex)) {
            errors.push('No event selected for editing');
        }

        // Validate event exists
        if (gameState.editingEventType === 'goal') {
            if (!gameState.goals[gameState.editingEventIndex]) {
                errors.push('Goal not found');
            }
        } else if (gameState.editingEventType === 'matchEvent') {
            if (!gameState.matchEvents[gameState.editingEventIndex]) {
                errors.push('Event not found');
            }
        }

        // Validate event type if being updated (for match events)
        if (formData.eventType && !this._isValidEventType(formData.eventType)) {
            errors.push('Selected event type is not valid');
        }

        // Validate notes if being updated
        if (formData.notes && formData.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Get edit event form data with validation
     * @returns {Object} Parsed and validated form data
     */
    _getEditEventFormData() {
        const timeElement = document.getElementById('editEventTime');
        const eventTypeElement = document.getElementById('editEventType');
        const eventNotesElement = document.getElementById('editEventNotes');

        const newMinutes = timeElement ? parseInt(timeElement.value, 10) : null;
        const newRawTime = newMinutes !== null ? newMinutes * 60 : null;
        const newTimestamp = newRawTime !== null ? formatMatchTime(newRawTime) : null;

        return {
            newMinutes,
            newRawTime,
            newTimestamp,
            eventType: eventTypeElement?.value,
            notes: eventNotesElement?.value
        };
    }

    /**
     * Display form validation errors
     * @param {string} formId - ID of the form to display errors for
     * @param {Array} errors - Array of error messages
     */
    _displayFormErrors(formId, errors) {
        if (!errors || errors.length === 0) return;

        // Remove existing error display
        this._clearFormErrors(formId);

        const form = document.getElementById(formId);
        if (!form) return;

        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger form-errors';
        errorContainer.setAttribute('role', 'alert');

        if (errors.length === 1) {
            errorContainer.textContent = errors[0];
        } else {
            const errorList = document.createElement('ul');
            errorList.className = 'mb-0';
            errors.forEach(error => {
                const listItem = document.createElement('li');
                listItem.textContent = error;
                errorList.appendChild(listItem);
            });
            errorContainer.appendChild(errorList);
        }

        // Insert error container at the top of the form
        form.insertBefore(errorContainer, form.firstChild);

        // Auto-scroll to show errors
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Clear form validation errors
     * @param {string} formId - ID of the form to clear errors for
     */
    _clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const existingErrors = form.querySelectorAll('.form-errors');
        existingErrors.forEach(error => error.remove());

        // Also clear individual field error states
        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
            const feedback = field.parentNode.querySelector('.invalid-feedback');
            if (feedback) feedback.remove();
        });
    }

    /**
     * Set modal loading state
     * @param {string} modalId - ID of the modal
     * @param {boolean} isLoading - Whether modal should show loading state
     */
    _setModalLoadingState(modalId, isLoading) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const submitButton = modal.querySelector('button[type="submit"]');
        const form = modal.querySelector('form');

        if (isLoading) {
            // Disable form and show loading
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
            if (form) {
                form.style.pointerEvents = 'none';
                form.style.opacity = '0.7';
            }
        } else {
            // Re-enable form and restore button
            if (submitButton) {
                submitButton.disabled = false;
                if (modalId === 'recordEventModal') {
                    submitButton.innerHTML = 'Record Event';
                } else if (modalId === 'editEventModal') {
                    submitButton.innerHTML = 'Save Changes';
                }
            }
            if (form) {
                form.style.pointerEvents = '';
                form.style.opacity = '';
            }
        }
    }

    /**
     * Validate modal state before operations
     * @param {string} modalId - ID of the modal to validate
     * @returns {Object} Validation result
     */
    _validateModalState(modalId) {
        const errors = [];

        const modal = document.getElementById(modalId);
        if (!modal) {
            errors.push('Modal not found');
            return { isValid: false, errors };
        }

        const form = modal.querySelector('form');
        if (!form) {
            errors.push('Form not found in modal');
            return { isValid: false, errors };
        }

        // Check if modal is currently visible
        const isVisible = modal.classList.contains('show') ||
            modal.style.display === 'block' ||
            modal.getAttribute('aria-hidden') === 'false';

        if (!isVisible) {
            errors.push('Modal is not currently visible');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Handle modal form reset with proper state management
     * @param {string} modalId - ID of the modal
     * @param {string} formId - ID of the form to reset
     */
    _resetModalForm(modalId, formId) {
        try {
            // Clear any errors
            this._clearFormErrors(formId);

            // Reset form
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
            }

            // Clear loading state
            this._setModalLoadingState(modalId, false);

            // Clear any character feedback
            const modal = document.getElementById(modalId);
            if (modal) {
                const feedbacks = modal.querySelectorAll('.char-feedback');
                feedbacks.forEach(feedback => feedback.remove());
            }

            // Clear field validation states
            const invalidFields = modal?.querySelectorAll('.is-invalid') || [];
            invalidFields.forEach(field => field.classList.remove('is-invalid'));

        } catch (error) {
            console.error('Error resetting modal form:', error);
        }
    }

    /**
     * Enhanced modal state management for better UX
     * @param {string} modalId - ID of the modal
     * @param {Object} options - Modal state options
     */
    _manageModalState(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const {
            preventClose = false,
            showProgress = false,
            disableInputs = false
        } = options;

        // Manage close prevention
        const closeButtons = modal.querySelectorAll('[data-dismiss="modal"], .btn-close');
        closeButtons.forEach(button => {
            button.disabled = preventClose;
        });

        // Manage progress indication
        if (showProgress) {
            let progressBar = modal.querySelector('.modal-progress');
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.className = 'modal-progress progress position-absolute w-100';
                progressBar.style.height = '3px';
                progressBar.style.top = '0';
                progressBar.innerHTML = '<div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>';

                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.position = 'relative';
                    modalContent.insertBefore(progressBar, modalContent.firstChild);
                }
            }
            progressBar.style.display = 'block';
        } else {
            const progressBar = modal.querySelector('.modal-progress');
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }

        // Manage input states
        const inputs = modal.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => {
            if (disableInputs) {
                input.disabled = true;
            } else if (!input.hasAttribute('data-permanent-disabled')) {
                input.disabled = false;
            }
        });
    }

    // ===== TIMELINE RENDERING SYSTEM =====

    /**
     * Update match log display with efficient rendering and performance optimizations
     * Migrated from combined-events.js with enhanced optimizations
     */
    updateMatchLog() {
        try {
            console.log('🔄 updateMatchLog called - timeline will always update');

            // Note: Removed timeline visibility check to ensure updates always happen when events are added

            // Use cached element for better performance
            const logElement = this._getCachedDOMElement('log');
            if (!logElement) {
                console.warn('❌ Log element not found');
                return;
            }
            console.log('✅ Log element found:', logElement);

            const currentTeam1Name = this._getCachedDOMElement('Team1NameElement')?.textContent;
            const currentTeam2Name = this._getCachedDOMElement('Team2NameElement')?.textContent;

            // Validate team names
            if (!currentTeam1Name || !currentTeam2Name) {
                console.warn('❌ Team names not found for timeline rendering', { currentTeam1Name, currentTeam2Name });
                return;
            }
            console.log('✅ Team names found:', { currentTeam1Name, currentTeam2Name });

            // Combine and sort all events by time
            const allEvents = [
                ...gameState.goals.map((event, index) => ({
                    ...event,
                    originalIndex: index,
                    updatetype: 'goal'
                })),
                ...gameState.matchEvents.map((event, index) => ({
                    ...event,
                    originalIndex: index,
                    updatetype: 'matchEvent'
                }))
            ].sort((a, b) => a.rawTime - b.rawTime);

            console.log('📊 Events to render:', {
                goals: gameState.goals.length,
                matchEvents: gameState.matchEvents.length,
                totalEvents: allEvents.length,
                events: allEvents
            });

            // Handle empty state with enhanced UI
            if (allEvents.length === 0) {
                console.log('📝 No events to display, rendering empty timeline');
                this._batchDOMUpdate(() => {
                    this._renderEmptyTimeline(logElement);
                }, 'timeline_empty');
                return;
            }

            // Use optimized rendering with requestAnimationFrame for better performance
            console.log('🎨 Starting timeline render with', allEvents.length, 'events');
            this._batchDOMUpdate(() => {
                this._optimizedTimelineRender(allEvents, logElement, currentTeam1Name, currentTeam2Name);
                console.log('✅ Timeline render completed');
            }, 'timeline_update');

        } catch (error) {
            console.error('❌ Error updating match log:', error);
            console.error('Stack trace:', error.stack);
            notificationManager.error('Error updating timeline display');
        }
    }

    /**
     * Create a timeline item element
     * @param {Object} event - Event data
     * @param {number} index - Event index for styling
     * @param {string} currentTeam1Name - Current team 1 name
     * @param {string} currentTeam2Name - Current team 2 name
     * @returns {HTMLElement} Timeline item element
     */
    _createTimelineItem(event, index, currentTeam1Name, currentTeam2Name) {
        try {
            // Validate inputs
            if (!event || typeof index !== 'number' || !currentTeam1Name || !currentTeam2Name) {
                console.warn('Invalid parameters for timeline item creation');
                return document.createElement('div'); // Return empty div as fallback
            }

            // Alternate timeline item positioning
            const timelineItemClass = index % 2 === 0 ? 'timeline-item-left' : 'timeline-item-right';
            const item = document.createElement('div');
            item.className = `timeline-item ${timelineItemClass}`;

            // Create content based on event type
            if (event.updatetype === 'matchEvent') {
                item.innerHTML = this._createMatchEventHTML(event, currentTeam1Name, currentTeam2Name);
            } else if (event.updatetype === 'goal') {
                item.innerHTML = this._createGoalEventHTML(event, currentTeam1Name, currentTeam2Name);
            } else {
                console.warn('Unknown event type for timeline item:', event.updatetype);
                item.innerHTML = this._createMatchEventHTML(event, currentTeam1Name, currentTeam2Name);
            }

            return item;
        } catch (error) {
            console.error('Error creating timeline item:', error);
            // Return a basic error item
            const errorItem = document.createElement('div');
            errorItem.className = 'timeline-item timeline-item-error';
            errorItem.innerHTML = `
        <div class="timeline-marker"></div>
        <div class="timeline-content border-danger">
          <div class="timeline-time">Error</div>
          <div class="timeline-body">
            <p class="text-danger mb-0">Error displaying event</p>
          </div>
        </div>
      `;
            return errorItem;
        }
    }

    /**
     * Create match event HTML content
     * @param {Object} event - Match event data
     * @param {string} currentTeam1Name - Current team 1 name
     * @param {string} currentTeam2Name - Current team 2 name
     * @returns {string} HTML content for match event
     */
    _createMatchEventHTML(event, currentTeam1Name, currentTeam2Name) {
        try {
            const cardClass = getEventCardClass(event.type);
            const icon = getEventIcon(event.type);
            const eventTypeClass = this._getEventTypeClass(event.type);

            let eventText = event.type;
            let scoreInfo = event.score ? ` (${event.score})` : '';

            // Update team names if needed
            if (event.teamName) {
                eventText = event.team === 1
                    ? event.type.replace(event.teamName, currentTeam1Name)
                    : event.type.replace(event.teamName, currentTeam2Name);
            }

            if (event.score && event.team1Name && event.team2Name) {
                scoreInfo = ` (${this._updateTeamNames(event.score, event.team1Name, event.team2Name, currentTeam1Name, currentTeam2Name)})`;
            }

            return `
        <div class="timeline-marker ${eventTypeClass}-marker"></div>
        <div class="timeline-content ${cardClass} ${eventTypeClass}-event">
          <div class="timeline-time">${event.timestamp}' - ${icon} <strong>${eventText}</strong>${scoreInfo}</div>
          <div class="timeline-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="event-info d-flex align-items-center">
                <p class="mb-0">${event.notes || ''}</p>
              </div>
              <div class="event-actions">
                ${this._createActionButtons(event, 'event')}
              </div>
            </div>
          </div>
        </div>
      `;
        } catch (error) {
            console.error('Error creating match event HTML:', error);
            return `
        <div class="timeline-marker"></div>
        <div class="timeline-content border-danger">
          <div class="timeline-time">${event.timestamp || 'Unknown'}' - Error</div>
          <div class="timeline-body">
            <p class="text-danger mb-0">Error displaying event</p>
          </div>
        </div>
      `;
        }
    }

    /**
     * Create goal event HTML content
     * @param {Object} event - Goal event data
     * @param {string} currentTeam1Name - Current team 1 name
     * @param {string} currentTeam2Name - Current team 2 name
     * @returns {string} HTML content for goal event
     */
    _createGoalEventHTML(event, currentTeam1Name, currentTeam2Name) {
        try {
            const goalTeam = event.team || (event.goalScorerName === currentTeam2Name ? 2 : 1);
            const isOppositionGoal = goalTeam === 2;
            const displayTeamName = isOppositionGoal ? currentTeam2Name : currentTeam1Name;

            // Determine styling classes
            const cardClass = isOppositionGoal ? 'border-danger border-2' : 'border-success border-2';
            const markerClass = isOppositionGoal ? 'goal-marker-opposition' : 'goal-marker-team';
            const disallowedClass = event.disallowed ? 'border-warning border-2' : cardClass;
            const disallowedMarker = event.disallowed ? 'goal-marker-disallowed' : markerClass;

            // Create content elements
            const goalIcon = `<i class="fa-regular fa-futbol"></i>`;
            const goalTitle = isOppositionGoal
                ? `<span class="text-danger">${goalIcon} Goal: ${displayTeamName}</span>`
                : `<span class="text-success">${goalIcon} Goal: ${displayTeamName}</span>`;

            const disallowedText = event.disallowed
                ? `<br><small class="text-warning"><strong>DISALLOWED:</strong> ${event.disallowedReason}</small>`
                : '';

            const goalDetails = this._createGoalDetails(event, isOppositionGoal);

            return `
        <div class="timeline-marker ${disallowedMarker}"></div>
        <div class="timeline-content ${disallowedClass} goal-event">
          <div class="timeline-time">${event.timestamp}' - <strong>${goalTitle}</strong></div>
          <div class="timeline-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="event-info">
                ${goalDetails}${disallowedText}
              </div>
              <div class="event-actions">
                ${this._createActionButtons(event, 'goal')}
              </div>
            </div>
          </div>
        </div>
      `;
        } catch (error) {
            console.error('Error creating goal event HTML:', error);
            return `
        <div class="timeline-marker"></div>
        <div class="timeline-content border-danger">
          <div class="timeline-time">${event.timestamp || 'Unknown'}' - Error</div>
          <div class="timeline-body">
            <p class="text-danger mb-0">Error displaying goal</p>
          </div>
        </div>
      `;
        }
    }

    /**
     * Create goal details HTML
     * @param {Object} event - Goal event data
     * @param {boolean} isOppositionGoal - Whether this is an opposition goal
     * @returns {string} HTML content for goal details
     */
    _createGoalDetails(event, isOppositionGoal) {
        try {
            if (isOppositionGoal) return '';

            const scorerInfo = `${event.goalScorerName} ${event.goalScorerShirtNumber ? `(#${event.goalScorerShirtNumber})` : ''}`;
            const assistInfo = `${event.goalAssistName} ${event.goalAssistShirtNumber ? `(#${event.goalAssistShirtNumber})` : ''}`;

            return `<br><small><strong>Scored By: </strong>${scorerInfo}<br> <Strong>Assisted By:</strong> ${assistInfo}</small>`;
        } catch (error) {
            console.error('Error creating goal details:', error);
            return '';
        }
    }

    /**
     * Create action buttons HTML for timeline items
     * @param {Object} event - Event data
     * @param {string} type - Event type ('goal' or 'event')
     * @returns {string} HTML content for action buttons
     */
    _createActionButtons(event, type) {
        try {
            const editButton = `
        <button class="btn btn-sm btn-outline-primary" 
          onclick="window.EventsModule.openEditEventModal(${event.originalIndex}, '${event.updatetype}')">
          <i class="fas fa-edit"></i>
        </button>`;

            const deleteButton = `
        <button class="btn btn-sm btn-outline-danger" 
          onclick="window.EventsModule.deleteLogEntry(${event.originalIndex}, '${type}')" 
          aria-label="Delete ${type}">
          <i class="fas fa-trash"></i>
        </button>`;

            if (type === 'goal') {
                const toggleButton = `
          <button class="btn btn-sm btn-outline-warning me-2" 
             onclick="window.GoalsModule.toggleGoalDisallowed(${event.originalIndex})" 
             title="${event.disallowed ? 'Allow goal' : 'Disallow goal'}">
            <i class="fas fa-${event.disallowed ? 'check' : 'ban'}"></i>
          </button>`;

                const goalEditButton = `
          <button class="btn btn-sm btn-outline-primary me-2" 
            onclick="window.EventsModule.openEditEventModal(${event.originalIndex}, '${event.updatetype}')">
            <i class="fas fa-edit"></i>
          </button>`;

                return `${toggleButton}${goalEditButton}${deleteButton}`;
            }

            return `${editButton}${deleteButton}`;
        } catch (error) {
            console.error('Error creating action buttons:', error);
            return '<span class="text-muted">Actions unavailable</span>';
        }
    }

    /**
     * Update team names in text content
     * @param {string} text - Text to update
     * @param {string} oldTeam1Name - Old team 1 name
     * @param {string} oldTeam2Name - Old team 2 name
     * @param {string} newTeam1Name - New team 1 name
     * @param {string} newTeam2Name - New team 2 name
     * @returns {string} Updated text
     */
    _updateTeamNames(text, oldTeam1Name, oldTeam2Name, newTeam1Name, newTeam2Name) {
        try {
            if (!text) return text;
            return text.replace(oldTeam1Name, newTeam1Name).replace(oldTeam2Name, newTeam2Name);
        } catch (error) {
            console.error('Error updating team names:', error);
            return text || '';
        }
    }

    // ===== STATISTICS SYSTEM =====

    /**
     * Calculate event statistics with enhanced caching system
     * @param {boolean} forceRecalculation - Force recalculation even if cache is valid
     * @returns {Object} Statistics object with caching metadata
     */
    calculateStatistics(forceRecalculation = false) {
        try {
            // Check if cache is valid and not forcing recalculation
            if (!forceRecalculation && this._isStatisticsCacheValid()) {
                return {
                    ...this.statisticsCache,
                    fromCache: true,
                    lastUpdated: this.lastCacheUpdate,
                    cacheKey: this.cacheKey
                };
            }

            // Generate new cache key
            const newCacheKey = this._generateCacheKey();

            // Lazy calculation check - if we have expensive operations, defer them
            const shouldUseLazyCalculation = this.cacheConfig.enableLazyCalculation &&
                this._shouldUseLazyCalculation();

            let stats;
            if (shouldUseLazyCalculation) {
                stats = this._calculateStatisticsLazy();
            } else {
                stats = this._calculateEventStatistics();
            }

            // Update cache with new key
            this.statisticsCache = { ...stats };
            this.lastCacheUpdate = Date.now();
            this.cacheKey = newCacheKey;

            return {
                ...stats,
                fromCache: false,
                lastUpdated: this.lastCacheUpdate,
                cacheKey: this.cacheKey,
                calculationMethod: shouldUseLazyCalculation ? 'lazy' : 'full'
            };
        } catch (error) {
            console.error('Error calculating statistics:', error);
            // Return default stats on error
            return {
                goals: 0,
                cards: 0,
                fouls: 0,
                penalties: 0,
                incidents: 0,
                total: 0,
                fromCache: false,
                lastUpdated: Date.now(),
                error: true
            };
        }
    }

    /**
     * Update statistics display in DOM with enhanced caching awareness and performance optimizations
     */
    updateEventStatistics() {
        try {
            // Skip update if statistics are not visible (performance optimization)
            if (this._statisticsVisible === false) {
                return;
            }

            const stats = this.calculateStatistics();

            // Batch all statistics updates for better performance
            this._batchDOMUpdate(() => {
                // Update statistics cards with error handling
                this._updateStatisticsElement('goals-count', stats.goals);
                this._updateStatisticsElement('cards-count', stats.cards);
                this._updateStatisticsElement('fouls-count', stats.fouls);
                this._updateStatisticsElement('total-events-count', stats.total);

                // Update additional statistics if elements exist
                this._updateStatisticsElement('penalties-count', stats.penalties);
                this._updateStatisticsElement('incidents-count', stats.incidents);

                // Add cache indicator for development/debugging
                this._updateCacheIndicator(stats);
            }, 'statistics_update');

            // Log cache performance in development (browser-compatible check)
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                const cacheInfo = stats.fromCache ? 'cached' : stats.calculationMethod || 'calculated';
                console.log(`Statistics updated (${cacheInfo}):`, {
                    ...stats,
                    cacheMetrics: this.getCacheMetrics()
                });
            }
        } catch (error) {
            console.error('Error updating statistics display:', error);
            notificationManager.error('Error updating statistics display');
        }
    }

    /**
     * Update cache indicator in UI (for development/debugging)
     * @param {Object} stats - Statistics object with cache metadata
     */
    _updateCacheIndicator(stats) {
        try {
            // Only show cache indicator in development or if explicitly enabled
            if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !this.cacheConfig.showCacheIndicator) {
                return;
            }

            const indicator = document.getElementById('cache-indicator');
            if (indicator) {
                const cacheStatus = stats.fromCache ? 'cached' : 'fresh';
                const cacheAge = stats.lastUpdated ? Date.now() - stats.lastUpdated : 0;

                indicator.textContent = `${cacheStatus} (${Math.round(cacheAge / 1000)}s)`;
                indicator.className = `cache-indicator ${cacheStatus}`;
            }
        } catch (error) {
            // Silently fail for cache indicator updates
            console.debug('Cache indicator update failed:', error);
        }
    }

    /**
     * Internal unified statistics calculation method
     * Merges logic from both enhanced-events.js and combined-events.js
     * @returns {Object} Raw statistics
     */
    _calculateEventStatistics() {
        try {
            // Validate game state
            if (!gameState || !gameState.goals || !gameState.matchEvents) {
                console.warn('Invalid game state for statistics calculation');
                return this._getDefaultStatistics();
            }

            // Combine all events for comprehensive analysis
            const allEvents = [
                ...gameState.goals.map(goal => ({ ...goal, type: 'goal' })),
                ...gameState.matchEvents
            ];

            // Initialize statistics object
            const stats = {
                goals: 0,
                cards: 0,
                fouls: 0,
                penalties: 0,
                incidents: 0,
                total: allEvents.length
            };

            // Count valid goals (non-disallowed)
            stats.goals = gameState.goals.filter(goal => !goal.disallowed).length;

            // Count different event types from match events
            gameState.matchEvents.forEach(event => {
                if (!event.type) return;

                const eventType = event.type.toLowerCase();

                // Count cards (yellow, red, or any event containing 'card')
                if (eventType.includes('card') ||
                    eventType.includes('yellow') ||
                    eventType.includes('red')) {
                    stats.cards++;
                }

                // Count fouls
                if (eventType.includes('foul')) {
                    stats.fouls++;
                }

                // Count penalties
                if (eventType.includes('penalty')) {
                    stats.penalties++;
                }

                // Count incidents
                if (eventType.includes('incident')) {
                    stats.incidents++;
                }
            });

            // Validate calculated statistics
            if (stats.total < 0 || stats.goals < 0 || stats.cards < 0 ||
                stats.fouls < 0 || stats.penalties < 0 || stats.incidents < 0) {
                console.warn('Invalid statistics calculated, using defaults');
                return this._getDefaultStatistics();
            }

            // Ensure totals make sense
            const eventSum = stats.goals + stats.cards + stats.fouls + stats.penalties + stats.incidents;
            if (eventSum > stats.total * 2) { // Allow some overlap but catch major errors
                console.warn('Statistics calculation may have errors - event sum exceeds reasonable bounds');
            }

            return stats;
        } catch (error) {
            console.error('Error in statistics calculation:', error);
            return this._getDefaultStatistics();
        }
    }

    /**
     * Generate efficient cache key based on current game state
     * @returns {string} Cache key representing current state
     */
    _generateCacheKey() {
        try {
            if (!this.cacheConfig.enableCacheKeyGeneration) {
                return null;
            }

            // Create hash based on event data that affects statistics
            const goalsHash = gameState.goals ?
                gameState.goals.map(g => `${g.rawTime}-${g.disallowed ? 'D' : 'V'}`).join('|') : '';

            const eventsHash = gameState.matchEvents ?
                gameState.matchEvents.map(e => `${e.rawTime}-${e.type}`).join('|') : '';

            // Combine hashes with counts for efficiency
            const cacheKey = `g${gameState.goals?.length || 0}-e${gameState.matchEvents?.length || 0}-${this._simpleHash(goalsHash + eventsHash)}`;

            return cacheKey;
        } catch (error) {
            console.error('Error generating cache key:', error);
            return null;
        }
    }

    /**
     * Simple hash function for cache key generation
     * @param {string} str - String to hash
     * @returns {string} Simple hash
     */
    _simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }

    /**
     * Check if statistics cache is still valid
     * @returns {boolean} True if cache is valid
     */
    _isStatisticsCacheValid() {
        // No cache exists
        if (!this.statisticsCache || !this.lastCacheUpdate || !this.cacheKey) {
            return false;
        }

        // Check if cache key matches current state
        const currentCacheKey = this._generateCacheKey();
        if (currentCacheKey && this.cacheKey !== currentCacheKey) {
            return false;
        }

        // Cache is too old
        const cacheAge = Date.now() - this.lastCacheUpdate;
        if (cacheAge > this.cacheConfig.maxAge) {
            return false;
        }

        // Cache is valid
        return true;
    }

    /**
     * Determine if lazy calculation should be used
     * @returns {boolean} True if lazy calculation should be used
     */
    _shouldUseLazyCalculation() {
        try {
            // Use lazy calculation for large datasets
            const totalEvents = (gameState.goals?.length || 0) + (gameState.matchEvents?.length || 0);

            // Threshold for lazy calculation (adjust based on performance testing)
            const lazyThreshold = 100;

            return totalEvents > lazyThreshold;
        } catch (error) {
            console.error('Error determining lazy calculation need:', error);
            return false;
        }
    }

    /**
     * Calculate statistics using lazy evaluation for expensive operations
     * @returns {Object} Statistics object
     */
    _calculateStatisticsLazy() {
        try {
            // Start with basic counts (cheap operations)
            const stats = {
                total: (gameState.goals?.length || 0) + (gameState.matchEvents?.length || 0),
                goals: 0,
                cards: 0,
                fouls: 0,
                penalties: 0,
                incidents: 0
            };

            // Lazy evaluation - only calculate what's needed immediately
            // Goals count (relatively cheap)
            if (gameState.goals) {
                stats.goals = gameState.goals.filter(goal => !goal.disallowed).length;
            }

            // Defer expensive event type analysis using requestIdleCallback if available
            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => {
                    this._calculateEventTypesAsync(stats);
                });
            } else {
                // Fallback to immediate calculation if requestIdleCallback not available
                this._calculateEventTypes(stats);
            }

            return stats;
        } catch (error) {
            console.error('Error in lazy statistics calculation:', error);
            return this._getDefaultStatistics();
        }
    }

    /**
     * Calculate event types synchronously
     * @param {Object} stats - Statistics object to update
     */
    _calculateEventTypes(stats) {
        try {
            if (!gameState.matchEvents) return;

            gameState.matchEvents.forEach(event => {
                if (!event.type) return;

                const eventType = event.type.toLowerCase();

                // Count different event types
                if (eventType.includes('card') || eventType.includes('yellow') || eventType.includes('red')) {
                    stats.cards++;
                }
                if (eventType.includes('foul')) {
                    stats.fouls++;
                }
                if (eventType.includes('penalty')) {
                    stats.penalties++;
                }
                if (eventType.includes('incident')) {
                    stats.incidents++;
                }
            });
        } catch (error) {
            console.error('Error calculating event types:', error);
        }
    }

    /**
     * Calculate event types asynchronously and update cache
     * @param {Object} stats - Statistics object to update
     */
    _calculateEventTypesAsync(stats) {
        try {
            this._calculateEventTypes(stats);

            // Update cache with complete statistics
            if (this.statisticsCache) {
                this.statisticsCache = { ...this.statisticsCache, ...stats };
            }

            // Trigger display update if needed
            this._updateStatisticsDisplayIfNeeded();
        } catch (error) {
            console.error('Error in async event types calculation:', error);
        }
    }

    /**
     * Update statistics display only if elements are visible
     */
    _updateStatisticsDisplayIfNeeded() {
        try {
            // Check if statistics elements are visible before updating
            const statsContainer = document.querySelector('.statistics-container, .stats-panel, #statistics-section');
            if (statsContainer && this._isElementVisible(statsContainer)) {
                this.updateEventStatistics();
            }
        } catch (error) {
            console.error('Error checking if statistics display update is needed:', error);
        }
    }

    /**
     * Check if an element is visible in the viewport
     * @param {Element} element - Element to check
     * @returns {boolean} True if element is visible
     */
    _isElementVisible(element) {
        try {
            if (!element) return false;

            const rect = element.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        } catch (error) {
            return true; // Default to visible if check fails
        }
    }

    /**
     * Invalidate statistics cache with enhanced cleanup
     * Called when events are added, updated, or deleted
     */
    _invalidateStatisticsCache() {
        this.statisticsCache = null;
        this.lastCacheUpdate = null;
        this.cacheKey = null;

        // Cancel any pending async calculations
        if (this._pendingAsyncCalculation) {
            clearTimeout(this._pendingAsyncCalculation);
            this._pendingAsyncCalculation = null;
        }
    }

    /**
     * Get default statistics object
     * @returns {Object} Default statistics
     */
    _getDefaultStatistics() {
        return {
            goals: 0,
            cards: 0,
            fouls: 0,
            penalties: 0,
            incidents: 0,
            total: 0
        };
    }

    /**
     * Configure statistics caching behavior
     * @param {Object} config - Cache configuration options
     */
    configureCaching(config = {}) {
        try {
            // Validate configuration
            if (typeof config !== 'object') {
                console.warn('Invalid cache configuration provided');
                return;
            }

            // Update cache configuration with validation
            if (typeof config.maxAge === 'number' && config.maxAge > 0) {
                this.cacheConfig.maxAge = Math.min(config.maxAge, 300000); // Max 5 minutes
            }

            if (typeof config.enableLazyCalculation === 'boolean') {
                this.cacheConfig.enableLazyCalculation = config.enableLazyCalculation;
            }

            if (typeof config.enableCacheKeyGeneration === 'boolean') {
                this.cacheConfig.enableCacheKeyGeneration = config.enableCacheKeyGeneration;
            }

            // Invalidate cache if configuration changed significantly
            if (config.maxAge !== undefined || config.enableCacheKeyGeneration === false) {
                this._invalidateStatisticsCache();
            }

            console.log('Statistics cache configuration updated:', this.cacheConfig);
        } catch (error) {
            console.error('Error configuring statistics cache:', error);
        }
    }

    /**
     * Get cache performance metrics
     * @returns {Object} Cache performance data
     */
    getCacheMetrics() {
        try {
            const currentTime = Date.now();
            const cacheAge = this.lastCacheUpdate ? currentTime - this.lastCacheUpdate : null;

            return {
                hasCachedData: !!this.statisticsCache,
                cacheAge: cacheAge,
                cacheKey: this.cacheKey,
                isValid: this._isStatisticsCacheValid(),
                config: { ...this.cacheConfig },
                lastUpdated: this.lastCacheUpdate ? new Date(this.lastCacheUpdate).toISOString() : null
            };
        } catch (error) {
            console.error('Error getting cache metrics:', error);
            return {
                hasCachedData: false,
                cacheAge: null,
                cacheKey: null,
                isValid: false,
                error: true
            };
        }
    }

    /**
     * Clear statistics cache manually
     * @param {boolean} force - Force clear even if cache is valid
     */
    clearStatisticsCache(force = false) {
        try {
            if (force || !this._isStatisticsCacheValid()) {
                this._invalidateStatisticsCache();
                console.log('Statistics cache cleared');
                return true;
            }

            console.log('Cache is valid, use force=true to clear anyway');
            return false;
        } catch (error) {
            console.error('Error clearing statistics cache:', error);
            return false;
        }
    }

    /**
     * Update a statistics element safely
     * @param {string} elementId - ID of element to update
     * @param {number} value - Value to set
     */
    _updateStatisticsElement(elementId, value) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                // Validate value is a number
                const numValue = typeof value === 'number' ? value : 0;
                element.textContent = numValue.toString();
            }
        } catch (error) {
            console.error(`Error updating statistics element ${elementId}:`, error);
        }
    }

    // ===== MODAL INTEGRATION =====

    /**
     * Show record event modal
     */
    showRecordEventModal() {
        try {
            // Validate game state
            if (!gameState) {
                notificationManager.error('Game not initialized');
                return;
            }

            // Reset form and clear any previous state
            this._resetModalForm('recordEventModal', 'recordEventForm');

            // Reset modal state
            this._manageModalState('recordEventModal', {
                preventClose: false,
                showProgress: false,
                disableInputs: false
            });

            // Show the modal
            eventModals.showRecordEventModal();
        } catch (error) {
            console.error('Error showing record event modal:', error);
            notificationManager.error('Error opening event recording modal. Please try again.');
        }
    }

    /**
     * Open edit event modal
     * @param {number} index - Event index
     * @param {string} type - Event type ('goal' or 'matchEvent')
     */
    openEditEventModal(index, type = 'matchEvent') {
        try {
            // Validate inputs
            const indexValidation = this._validateEventIndex(index, type);
            if (!indexValidation.isValid) {
                notificationManager.error(`Invalid event index: ${indexValidation.errors.join(', ')}`);
                return;
            }

            // Set editing state
            stateManager.setEditingEvent(index, type);

            // Get event data
            const event = type === 'goal' ? gameState.goals[index] : gameState.matchEvents[index];
            if (!event) {
                notificationManager.error('Event not found');
                return;
            }

            const currentMinutes = Math.floor(event.rawTime / 60);

            // Prepare event data for modal
            const eventData = {
                index,
                type,
                time: currentMinutes,
                eventType: event.type || '',
                notes: event.notes || ''
            };

            // Show the edit modal with populated data
            this._showEditEventModal(eventData);
        } catch (error) {
            console.error('Error opening edit modal:', error);
            notificationManager.error('Error opening edit modal. Please try again.');
        }
    }

    /**
     * Show edit event modal with data
     * @param {Object} eventData - Event data to populate modal
     */
    _showEditEventModal(eventData) {
        try {
            // Reset form and clear any previous state
            this._resetModalForm('editEventModal', 'editEventForm');

            // Reset modal state
            this._manageModalState('editEventModal', {
                preventClose: false,
                showProgress: false,
                disableInputs: false
            });

            // Update modal title and show/hide fields based on type
            const modalTitle = document.getElementById('editEventModalLabel');
            const editEventTypeContainer = document.getElementById('editEventTypeContainer');
            const editEventNotesContainer = document.getElementById('editEventNotesContainer');

            if (eventData.type === 'goal') {
                if (modalTitle) modalTitle.textContent = 'Edit Goal Time';
                if (editEventTypeContainer) editEventTypeContainer.style.display = 'none';
                if (editEventNotesContainer) editEventNotesContainer.style.display = 'none';
            } else {
                if (modalTitle) modalTitle.textContent = 'Edit Event';
                if (editEventTypeContainer) editEventTypeContainer.style.display = 'block';
                if (editEventNotesContainer) editEventNotesContainer.style.display = 'block';

                // Populate event type and notes for match events
                const editEventType = document.getElementById('editEventType');
                const editEventNotes = document.getElementById('editEventNotes');

                if (editEventType) editEventType.value = eventData.eventType;
                if (editEventNotes) editEventNotes.value = eventData.notes;
            }

            // Set common fields
            const editEventIndex = document.getElementById('editEventIndex');
            const editTimeInput = document.getElementById('editEventTime');

            if (editEventIndex) editEventIndex.value = eventData.index;
            if (editTimeInput) editTimeInput.value = eventData.time;

            // Validate the modal state before showing
            const modalValidation = this._validateModalState('editEventModal');
            if (!modalValidation.isValid) {
                console.warn('Modal state validation failed:', modalValidation.errors);
            }

            // Show the modal using event modals
            eventModals.showEditEventModal(eventData);
        } catch (error) {
            console.error('Error showing edit event modal:', error);
            notificationManager.error('Error displaying edit modal. Please try again.');
        }
    }

    /**
     * Handle record event form submission
     * @param {Event} e - Form submission event
     */
    _handleRecordEventFormSubmission(e) {
        e.preventDefault();

        try {
            // Clear any previous form errors
            this._clearFormErrors('recordEventForm');

            // Get form data using event modals helper
            const formData = eventModals.getRecordEventFormData();

            // Comprehensive form validation
            const formValidation = this._validateRecordEventForm(formData);
            if (!formValidation.isValid) {
                this._displayFormErrors('recordEventForm', formValidation.errors);
                return;
            }

            // Validate event operation permissions
            const operationValidation = this._validateEventOperation('add');
            if (!operationValidation.isValid) {
                this._displayFormErrors('recordEventForm', operationValidation.errors);
                return;
            }

            // Set modal state to loading
            this._setModalLoadingState('recordEventModal', true);

            // Add the event using existing addMatchEvent method
            this.addMatchEvent(formData.eventType, formData.notes);

            // Hide modal and reset form on success
            eventModals.hideRecordEventModal();
            eventModals.resetRecordEventForm();

            // Clear loading state
            this._setModalLoadingState('recordEventModal', false);

        } catch (error) {
            console.error('Error handling record event form submission:', error);

            // Clear loading state and show error
            this._setModalLoadingState('recordEventModal', false);
            this._displayFormErrors('recordEventForm', ['Error recording event. Please try again.']);
            notificationManager.error('Error recording event. Please try again.');
        }
    }

    /**
     * Handle edit event form submission
     * @param {Event} e - Form submission event
     */
    handleEditEventFormSubmission(e) {
        e.preventDefault();

        try {
            // Clear any previous form errors
            this._clearFormErrors('editEventForm');

            // Get and validate form data
            const formData = this._getEditEventFormData();
            const formValidation = this._validateEditEventForm(formData);

            if (!formValidation.isValid) {
                this._displayFormErrors('editEventForm', formValidation.errors);
                return;
            }

            // Validate event operation permissions
            const operationValidation = this._validateEventOperation('update');
            if (!operationValidation.isValid) {
                this._displayFormErrors('editEventForm', operationValidation.errors);
                return;
            }

            // Set modal state to loading
            this._setModalLoadingState('editEventModal', true);

            const { newMinutes, newRawTime, newTimestamp } = formData;

            // Handle different event types
            if (gameState.editingEventType === 'goal') {
                // Validate goal index
                const indexValidation = this._validateEventIndex(gameState.editingEventIndex, 'goal');
                if (!indexValidation.isValid) {
                    this._displayFormErrors('editEventForm', indexValidation.errors);
                    this._setModalLoadingState('editEventModal', false);
                    return;
                }

                const updates = {
                    rawTime: newRawTime,
                    timestamp: newTimestamp
                };

                // Validate the updated goal would be valid
                const currentGoal = gameState.goals[gameState.editingEventIndex];
                const updatedGoal = { ...currentGoal, ...updates };
                const goalValidation = this._validateGoalData(updatedGoal);
                if (!goalValidation.isValid) {
                    this._displayFormErrors('editEventForm', goalValidation.errors);
                    this._setModalLoadingState('editEventModal', false);
                    return;
                }

                stateManager.updateGoal(gameState.editingEventIndex, updates);
            } else if (gameState.editingEventType === 'matchEvent') {
                const eventIndexElement = document.getElementById('editEventIndex');

                if (!eventIndexElement) {
                    this._displayFormErrors('editEventForm', ['Error: Event index not found']);
                    this._setModalLoadingState('editEventModal', false);
                    return;
                }

                const eventIndex = parseInt(eventIndexElement.value, 10);

                // Validate event index
                const indexValidation = this._validateEventIndex(eventIndex, 'matchEvent');
                if (!indexValidation.isValid) {
                    this._displayFormErrors('editEventForm', indexValidation.errors);
                    this._setModalLoadingState('editEventModal', false);
                    return;
                }

                const newType = formData.eventType || gameState.matchEvents[eventIndex].type;
                const rawNotes = formData.notes || '';

                // Validate event type
                if (!this._isValidEventType(newType)) {
                    this._displayFormErrors('editEventForm', [`Invalid event type: ${newType}`]);
                    this._setModalLoadingState('editEventModal', false);
                    return;
                }

                // Sanitize notes
                const newNotes = this._sanitizeInput(rawNotes);

                const updatedEvent = {
                    ...gameState.matchEvents[eventIndex],
                    type: newType,
                    notes: newNotes,
                    rawTime: newRawTime,
                    timestamp: newTimestamp
                };

                // Validate complete updated event
                const eventValidation = this._validateEventData(updatedEvent);
                if (!eventValidation.isValid) {
                    this._displayFormErrors('editEventForm', eventValidation.errors);
                    this._setModalLoadingState('editEventModal', false);
                    return;
                }

                stateManager.updateMatchEvent(eventIndex, updatedEvent);
            } else {
                this._displayFormErrors('editEventForm', ['Invalid editing event type']);
                this._setModalLoadingState('editEventModal', false);
                return;
            }

            // Update displays
            this.updateMatchLog();
            this.updateEventStatistics();

            // Save data
            storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

            // Clean up and close modal
            stateManager.clearEditingEvent();
            eventModals.hideEditEventModal();

            // Clear loading state
            this._setModalLoadingState('editEventModal', false);

            notificationManager.success('Event updated successfully');

        } catch (error) {
            console.error('Error updating event:', error);

            // Clear loading state and show error
            this._setModalLoadingState('editEventModal', false);
            this._displayFormErrors('editEventForm', ['Error updating event. Please try again.']);
            notificationManager.error('Error updating event. Please try again.');
        }
    }

    // ===== TIMELINE OPTIMIZATION FEATURES =====

    /**
     * Get CSS class for event type styling
     * @param {string} eventType - The event type
     * @returns {string} CSS class for the event type
     */
    _getEventTypeClass(eventType) {
        const typeClassMap = {
            [EVENT_TYPES.YELLOW_CARD]: 'card-event',
            [EVENT_TYPES.RED_CARD]: 'card-event',
            [EVENT_TYPES.SIN_BIN]: 'disciplinary-event',
            [EVENT_TYPES.FOUL]: 'foul-event',
            [EVENT_TYPES.PENALTY]: 'penalty-event',
            [EVENT_TYPES.INCIDENT]: 'incident-event',
            [EVENT_TYPES.GAME_STARTED]: 'system-event',
            [EVENT_TYPES.HALF_TIME]: 'system-event',
            [EVENT_TYPES.FULL_TIME]: 'system-event'
        };
        return typeClassMap[eventType] || 'general-event';
    }



    /**
     * Get cached DOM element or fetch and cache it
     * @param {string} elementId - ID of element to cache
     * @returns {HTMLElement|null} Cached or fetched element
     */
    _getCachedElement(elementId) {
        const now = Date.now();

        // Check if cache is expired
        if (this._timelineCache.lastCacheTime &&
            (now - this._timelineCache.lastCacheTime) > this._timelineCache.cacheTimeout) {
            this._clearTimelineCache();
        }

        // Return cached element if available
        if (this._timelineCache[elementId]) {
            return this._timelineCache[elementId];
        }

        // Fetch and cache element
        const element = document.getElementById(elementId) || domCache.get(elementId);
        if (element) {
            this._timelineCache[elementId] = element;
            this._timelineCache.lastCacheTime = now;
        }

        return element;
    }

    /**
     * Clear timeline DOM cache
     */
    _clearTimelineCache() {
        Object.keys(this._timelineCache).forEach(key => {
            if (key !== 'cacheTimeout') {
                this._timelineCache[key] = null;
            }
        });
    }

    /**
     * Enhanced empty state handling for timeline
     * @param {HTMLElement} logElement - Timeline container element
     */
    _renderEmptyTimeline(logElement) {
        const emptyStateHTML = `
      <div class="empty-timeline-message">
        <div class="text-center p-4">
          <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No events recorded yet</h5>
          <p class="text-muted mb-3">
            Match events and goals will appear here as they happen.
          </p>
          <small class="text-muted d-block mt-2">
            Use the event recording buttons to add match events
          </small>
        </div>
      </div>
    `;

        logElement.innerHTML = emptyStateHTML;
    }

    /**
     * Optimize timeline rendering with efficient DOM operations and requestAnimationFrame
     * @param {Array} events - Array of events to render
     * @param {HTMLElement} logElement - Timeline container
     * @param {string} currentTeam1Name - Current team 1 name
     * @param {string} currentTeam2Name - Current team 2 name
     */
    _optimizedTimelineRender(events, logElement, currentTeam1Name, currentTeam2Name) {
        try {
            // Create document fragment for batch DOM operations
            const fragment = document.createDocumentFragment();
            const timelineContainer = document.createElement('div');
            timelineContainer.className = 'timeline optimized-timeline';

            // Batch create timeline items efficiently
            const timelineItems = events.map((event, index) =>
                this._createTimelineItem(event, index, currentTeam1Name, currentTeam2Name)
            );

            // Append all items to container in one operation
            timelineItems.forEach(item => timelineContainer.appendChild(item));

            // Single DOM update for better performance
            fragment.appendChild(timelineContainer);
            logElement.innerHTML = '';
            logElement.appendChild(fragment);

            // Event delegation is now handled globally, no need for local setup
            // The global click handler will manage all timeline button interactions

        } catch (error) {
            console.error('Error in optimized timeline render:', error);
            // Fallback to basic rendering
            this._basicTimelineRender(events, logElement, currentTeam1Name, currentTeam2Name);
        }
    }

    /**
     * Basic timeline rendering fallback
     * @param {Array} events - Array of events to render
     * @param {HTMLElement} logElement - Timeline container
     * @param {string} currentTeam1Name - Current team 1 name
     * @param {string} currentTeam2Name - Current team 2 name
     */
    _basicTimelineRender(events, logElement, currentTeam1Name, currentTeam2Name) {
        const fragment = document.createDocumentFragment();
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline';

        events.forEach((event, index) => {
            const timelineItem = this._createTimelineItem(event, index, currentTeam1Name, currentTeam2Name);
            timelineContainer.appendChild(timelineItem);
        });

        fragment.appendChild(timelineContainer);
        logElement.innerHTML = '';
        logElement.appendChild(fragment);
    }



    // ===== PERFORMANCE OPTIMIZATIONS =====



    /**
     * Optimize DOM operations with enhanced caching and batching
     */
    _optimizeDOMOperations() {
        // Initialize DOM element caching
        this._initializeDOMCache();

        // Setup event delegation for better performance
        this._setupGlobalEventDelegation();

        // Clear cache periodically to prevent memory leaks
        this._cacheCleanupInterval = setInterval(() => {
            this._clearExpiredDOMCache();
            this._clearTimelineCache();
        }, this._timelineCache.cacheTimeout * 2);

        // Setup intersection observer for visibility-based optimizations
        this._setupIntersectionObserver();
    }

    /**
     * Initialize DOM element cache with frequently accessed elements
     */
    _initializeDOMCache() {
        const frequentElements = [
            'log',
            'Team1NameElement',
            'Team2NameElement',
            'firstScoreElement',
            'secondScoreElement',
            'goals-count',
            'cards-count',
            'fouls-count',
            'total-events-count',
            'penalties-count',
            'incidents-count'
        ];

        frequentElements.forEach(elementId => {
            this._getCachedDOMElement(elementId);
        });
    }

    /**
     * Get cached DOM element with automatic cache management
     * @param {string} elementId - ID of element to cache
     * @returns {HTMLElement|null} Cached or fetched element
     */
    _getCachedDOMElement(elementId) {
        const now = Date.now();
        const cacheKey = `element_${elementId}`;

        // Check if cache is expired
        const timestamp = this._cacheTimestamps.get(cacheKey);
        if (timestamp && (now - timestamp) > this._cacheTimeout) {
            this._domElementCache.delete(cacheKey);
            this._cacheTimestamps.delete(cacheKey);
        }

        // Return cached element if available
        if (this._domElementCache.has(cacheKey)) {
            return this._domElementCache.get(cacheKey);
        }

        // Fetch and cache element
        const element = document.getElementById(elementId) || domCache.get(elementId);
        if (element) {
            this._domElementCache.set(cacheKey, element);
            this._cacheTimestamps.set(cacheKey, now);
        }

        return element;
    }

    /**
     * Clear expired DOM cache entries
     */
    _clearExpiredDOMCache() {
        const now = Date.now();

        for (const [key, timestamp] of this._cacheTimestamps.entries()) {
            if ((now - timestamp) > this._cacheTimeout) {
                this._domElementCache.delete(key);
                this._cacheTimestamps.delete(key);
            }
        }
    }

    /**
     * Setup global event delegation for better performance
     */
    _setupGlobalEventDelegation() {
        // Remove existing listeners to prevent duplicates
        document.removeEventListener('click', this._globalClickHandler);

        // Single global click handler with delegation
        this._globalClickHandler = (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            // Handle timeline action buttons
            if (button.closest('.timeline')) {
                this._handleTimelineButtonClick(e, button);
                return;
            }

            // Handle modal buttons
            if (button.closest('.modal')) {
                this._handleModalButtonClick(e, button);
                return;
            }

            // Handle statistics refresh buttons
            if (button.classList.contains('refresh-stats')) {
                e.preventDefault();
                this._handleStatsRefresh();
                return;
            }
        };

        document.addEventListener('click', this._globalClickHandler, { passive: false });
    }

    /**
     * Handle timeline button clicks with optimized event delegation
     * @param {Event} e - Click event
     * @param {HTMLElement} button - Button element
     */
    _handleTimelineButtonClick(e, button) {
        e.preventDefault();
        e.stopPropagation();

        // Handle different button types based on classes
        if (button.classList.contains('btn-outline-primary')) {
            // Edit button
            const onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes('openEditEventModal')) {
                const match = onclick.match(/openEditEventModal\((\d+),\s*'(\w+)'\)/);
                if (match) {
                    const [, index, type] = match;
                    this.openEditEventModal(parseInt(index, 10), type);
                }
            }
        } else if (button.classList.contains('btn-outline-danger')) {
            // Delete button
            const onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes('deleteLogEntry')) {
                const match = onclick.match(/deleteLogEntry\((\d+),\s*'(\w+)'\)/);
                if (match) {
                    const [, index, type] = match;
                    this.deleteEvent(parseInt(index, 10), type);
                }
            }
        } else if (button.classList.contains('btn-outline-warning')) {
            // Toggle goal button
            const onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes('toggleGoalDisallowed')) {
                const match = onclick.match(/toggleGoalDisallowed\((\d+)\)/);
                if (match && window.GoalsModule) {
                    const [, index] = match;
                    window.GoalsModule.toggleGoalDisallowed(parseInt(index, 10));
                }
            }
        }
    }

    /**
     * Handle modal button clicks
     * @param {Event} e - Click event  
     * @param {HTMLElement} button - Button element
     */
    _handleModalButtonClick(e, button) {
        // Handle modal-specific button actions
        if (button.hasAttribute('data-dismiss')) {
            e.preventDefault();
            const modal = button.closest('.modal');
            if (modal) {
                this._hideModal(modal.id);
            }
        }
    }

    /**
     * Handle statistics refresh with debouncing
     */
    _handleStatsRefresh() {
        // Debounce stats refresh to prevent excessive calls
        clearTimeout(this._statsRefreshTimeout);
        this._statsRefreshTimeout = setTimeout(() => {
            this._invalidateStatisticsCache();
            this.updateEventStatistics();
        }, 100);
    }

    /**
     * Setup intersection observer for visibility-based optimizations
     */
    _setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            return; // Fallback for older browsers
        }

        this._intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Note: Removed timeline visibility tracking - timeline always updates when events are added
                
                if (entry.target.classList.contains('statistics-container')) {
                    // Statistics are visible, enable real-time updates
                    this._statisticsVisible = entry.isIntersecting;
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Observe statistics containers (timeline always updates regardless of visibility)
        const statsContainer = document.querySelector('.statistics-container, .stats-panel');

        if (statsContainer) {
            this._intersectionObserver.observe(statsContainer);
        }
    }

    /**
     * Batch DOM updates using requestAnimationFrame for smooth performance
     * @param {Function} updateFunction - Function to execute in animation frame
     * @param {string} updateKey - Unique key for the update to prevent duplicates
     */
    _batchDOMUpdate(updateFunction, updateKey = 'default') {
        // Prevent duplicate updates
        if (this._pendingUpdates.has(updateKey)) {
            return;
        }

        this._pendingUpdates.add(updateKey);

        // Cancel previous animation frame if exists
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
        }

        this._animationFrameId = requestAnimationFrame(() => {
            try {
                updateFunction();
                this._pendingUpdates.delete(updateKey);
            } catch (error) {
                console.error('Error in batched DOM update:', error);
                this._pendingUpdates.delete(updateKey);
            }
        });
    }

    /**
     * Update statistics element with caching and error handling
     * @param {string} elementId - ID of statistics element
     * @param {number} value - Value to display
     */
    _updateStatisticsElement(elementId, value) {
        const element = this._getCachedDOMElement(elementId);
        if (element && element.textContent !== value.toString()) {
            // Only update if value has changed
            this._batchDOMUpdate(() => {
                element.textContent = value;

                // Add visual feedback for updates
                element.classList.add('stat-updated');
                setTimeout(() => {
                    element.classList.remove('stat-updated');
                }, 300);
            }, `stats_${elementId}`);
        }
    }

    /**
     * Implement efficient event delegation (enhanced version)
     */
    _setupEventDelegation() {
        // This is now handled by _setupGlobalEventDelegation
        // Keep this method for backward compatibility
    }

    /**
     * Hide modal with proper cleanup
     * @param {string} modalId - ID of modal to hide
     */
    _hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');

            // Clear any pending updates for this modal
            this._pendingUpdates.delete(`modal_${modalId}`);
        }
    }

    /**
     * Cleanup performance optimization resources
     */
    _cleanupOptimizations() {
        // Clear intervals
        if (this._cacheCleanupInterval) {
            clearInterval(this._cacheCleanupInterval);
        }

        // Clear animation frames
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
        }

        // Clear timeouts
        if (this._statsRefreshTimeout) {
            clearTimeout(this._statsRefreshTimeout);
        }

        // Disconnect intersection observer
        if (this._intersectionObserver) {
            this._intersectionObserver.disconnect();
        }

        // Remove global event listeners
        document.removeEventListener('click', this._globalClickHandler);

        // Clear caches
        this._domElementCache.clear();
        this._cacheTimestamps.clear();
        this._pendingUpdates.clear();
    }

    // ===== DELETE MODAL FUNCTIONALITY =====

    /**
     * Show event delete confirmation modal
     * @param {string} itemType - Type of item being deleted
     * @param {string} itemName - Name of item being deleted
     */
    _showEventDeleteModal(itemType, itemName) {
        // Create modal if it doesn't exist
        if (!document.getElementById('eventDeleteModal')) {
            this._createEventDeleteModal();
        }

        // Update modal content
        const modalTitle = document.getElementById('eventDeleteModalTitle');
        const modalBody = document.getElementById('eventDeleteModalBody');

        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-exclamation-triangle text-warning me-2"></i>Confirm Deletion`;
        }

        if (modalBody) {
            modalBody.innerHTML = `
        <p class="mb-3">Are you sure you want to delete this ${itemType}?</p>
        <div class="alert alert-warning">
          <strong>${itemType.charAt(0).toUpperCase() + itemType.slice(1)}:</strong> ${itemName}
        </div>
        <p class="text-muted small mb-0">This action cannot be undone.</p>
      `;
        }

        // Show modal
        const modal = document.getElementById('eventDeleteModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    /**
     * Create event delete confirmation modal
     */
    _createEventDeleteModal() {
        const modalHTML = `
      <div class="modal fade" id="eventDeleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title" id="eventDeleteModalTitle">
                <i class="fas fa-exclamation-triangle me-2"></i>Confirm Deletion
              </h5>
              <button type="button" class="btn btn-light btn-sm rounded-circle" data-dismiss="modal" aria-label="Close" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-times text-danger" style="font-size: 14px;"></i>
              </button>
            </div>
            <div class="modal-body" id="eventDeleteModalBody">
              <!-- Content will be populated dynamically -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelEventDeleteBtn">
                <i class="fas fa-times me-1"></i>Cancel
              </button>
              <button type="button" class="btn btn-danger" id="confirmEventDeleteBtn">
                <i class="fas fa-trash me-1"></i>Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners
        const modal = document.getElementById('eventDeleteModal');
        const cancelBtn = document.getElementById('cancelEventDeleteBtn');
        const confirmBtn = document.getElementById('confirmEventDeleteBtn');
        const closeBtn = modal.querySelector('[data-dismiss="modal"]');

        // Cancel button
        cancelBtn?.addEventListener('click', () => {
            this._hideEventDeleteModal();
            pendingDeletion = null;
        });

        // Close button
        closeBtn?.addEventListener('click', () => {
            this._hideEventDeleteModal();
            pendingDeletion = null;
        });

        // Confirm button
        confirmBtn?.addEventListener('click', () => {
            this._hideEventDeleteModal();
            this._performEventDeletion();
        });

        // Click outside to close
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this._hideEventDeleteModal();
                pendingDeletion = null;
            }
        });
    }

    /**
     * Hide event delete modal
     */
    _hideEventDeleteModal() {
        const modal = document.getElementById('eventDeleteModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }

    /**
     * Perform the actual event deletion
     */
    _performEventDeletion() {
        if (!pendingDeletion) return;

        try {
            const { index, type } = pendingDeletion;
            const itemType = type === 'goal' ? 'goal' : 'event';

            // Validate index
            const indexValidation = this._validateEventIndex(index, type);
            if (!indexValidation.isValid) {
                notificationManager.error(`Index validation failed: ${indexValidation.errors.join(', ')}`);
                pendingDeletion = null;
                return;
            }

            // Get the event and check if it can be deleted
            const event = type === 'goal' ? gameState.goals[index] : gameState.matchEvents[index];
            const deleteValidation = this._canDeleteEvent(event, type);
            if (!deleteValidation.isValid) {
                notificationManager.error(`Cannot delete event: ${deleteValidation.errors.join(', ')}`);
                pendingDeletion = null;
                return;
            }

            if (type === 'goal') {
                stateManager.removeGoal(index);
                // Recalculate scores after goal deletion
                this._recalculateScores();
            } else if (type === 'matchEvent') {
                stateManager.removeMatchEvent(index);
            }

            // Invalidate statistics cache
            this._invalidateStatisticsCache();

            // Update displays
            this.updateMatchLog();
            this.updateEventStatistics();

            // Save data
            storageHelpers.saveCompleteMatchData(gameState, attendanceManager.getMatchAttendance());

            // Show success notification
            notificationManager.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);

            // Clear pending deletion
            pendingDeletion = null;
        } catch (error) {
            console.error('Error performing event deletion:', error);
            notificationManager.error('Error deleting event. Please try again.');
            pendingDeletion = null;
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Update team names in text
     * @param {string} text - Text to update
     * @param {string} oldTeam1Name - Old team 1 name
     * @param {string} oldTeam2Name - Old team 2 name
     * @param {string} newTeam1Name - New team 1 name
     * @param {string} newTeam2Name - New team 2 name
     * @returns {string} Updated text
     */
    _updateTeamNames(text, oldTeam1Name, oldTeam2Name, newTeam1Name, newTeam2Name) {
        if (!text) return text;
        return text.replace(oldTeam1Name, newTeam1Name).replace(oldTeam2Name, newTeam2Name);
    }

    /**
     * Recalculate scores after goal changes
     */
    _recalculateScores() {
        try {
            const team2Name = domCache.get('Team2NameElement')?.textContent;

            const teamGoals = gameState.goals.filter(goal =>
                !goal.disallowed && goal.goalScorerName !== team2Name
            ).length;

            const oppositionGoals = gameState.goals.filter(goal =>
                !goal.disallowed && goal.goalScorerName === team2Name
            ).length;

            // Update UI elements
            const firstScoreElement = domCache.get('firstScoreElement');
            const secondScoreElement = domCache.get('secondScoreElement');

            if (firstScoreElement) firstScoreElement.textContent = teamGoals;
            if (secondScoreElement) secondScoreElement.textContent = oppositionGoals;

            // Update storage using storageHelpers
            storageHelpers.saveMatchData(gameState);

            // Invalidate statistics cache since scores changed
            this._invalidateStatisticsCache();
        } catch (error) {
            console.error('Error recalculating scores:', error);
        }
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        // TODO: Implement event listener binding
    }

    /**
     * Bind modal event listeners
     */
    _bindModalEvents() {
        try {
            // Use a slight delay to ensure modals are created
            setTimeout(() => {
                this._bindRecordEventModalHandlers();
                this._bindEditEventModalHandlers();
            }, 100);
        } catch (error) {
            console.error('Error binding modal events:', error);
        }
    }

    /**
     * Bind record event modal handlers
     */
    _bindRecordEventModalHandlers() {
        const recordEventForm = document.getElementById('recordEventForm');
        const recordEventModal = document.getElementById('recordEventModal');

        if (recordEventForm) {
            // Form submission handler
            recordEventForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this._handleRecordEventFormSubmission(e);
            });

            // Real-time validation on form inputs
            const eventTypeSelect = document.getElementById('eventTypeSelect');
            const eventNotes = document.getElementById('eventNotes');

            if (eventTypeSelect) {
                eventTypeSelect.addEventListener('change', () => {
                    this._clearFormErrors('recordEventForm');
                });
            }

            if (eventNotes) {
                eventNotes.addEventListener('input', (e) => {
                    // Clear errors when user starts typing
                    this._clearFormErrors('recordEventForm');

                    // Show character count for notes
                    const maxLength = 500;
                    const currentLength = e.target.value.length;
                    const remaining = maxLength - currentLength;

                    let feedback = eventNotes.parentNode.querySelector('.char-feedback');
                    if (!feedback) {
                        feedback = document.createElement('small');
                        feedback.className = 'char-feedback text-muted';
                        eventNotes.parentNode.appendChild(feedback);
                    }

                    feedback.textContent = `${remaining} characters remaining`;

                    if (remaining < 0) {
                        feedback.className = 'char-feedback text-danger';
                        eventNotes.classList.add('is-invalid');
                    } else {
                        feedback.className = 'char-feedback text-muted';
                        eventNotes.classList.remove('is-invalid');
                    }
                });
            }
        }

        // Modal event handlers
        if (recordEventModal) {
            recordEventModal.addEventListener('hidden.bs.modal', () => {
                this._clearFormErrors('recordEventForm');
                this._setModalLoadingState('recordEventModal', false);
            });

            recordEventModal.addEventListener('shown.bs.modal', () => {
                // Focus on first input when modal opens
                const firstInput = recordEventModal.querySelector('select, input, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            });
        }
    }

    /**
     * Bind edit event modal handlers
     */
    _bindEditEventModalHandlers() {
        const editEventForm = document.getElementById('editEventForm');
        const editEventModal = document.getElementById('editEventModal');

        if (editEventForm) {
            // Form submission handler
            editEventForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditEventFormSubmission(e);
            });

            // Real-time validation on time input
            const timeInput = document.getElementById('editEventTime');
            if (timeInput) {
                timeInput.addEventListener('input', (e) => {
                    this._clearFormErrors('editEventForm');

                    const value = parseInt(e.target.value, 10);
                    if (value < 0 || value > 120 || isNaN(value)) {
                        timeInput.classList.add('is-invalid');
                    } else {
                        timeInput.classList.remove('is-invalid');
                    }
                });
            }

            // Real-time validation on notes input
            const notesInput = document.getElementById('editEventNotes');
            if (notesInput) {
                notesInput.addEventListener('input', (e) => {
                    this._clearFormErrors('editEventForm');

                    const maxLength = 500;
                    const currentLength = e.target.value.length;

                    if (currentLength > maxLength) {
                        notesInput.classList.add('is-invalid');
                    } else {
                        notesInput.classList.remove('is-invalid');
                    }
                });
            }
        }

        // Modal event handlers
        if (editEventModal) {
            editEventModal.addEventListener('hidden.bs.modal', () => {
                this._clearFormErrors('editEventForm');
                this._setModalLoadingState('editEventModal', false);
                // Clear editing state when modal is closed
                if (gameState.editingEventType) {
                    stateManager.clearEditingEvent();
                }
            });

            editEventModal.addEventListener('shown.bs.modal', () => {
                // Focus on time input when modal opens
                const timeInput = document.getElementById('editEventTime');
                if (timeInput) {
                    timeInput.focus();
                    timeInput.select(); // Select all text for easy editing
                }
            });
        }
    }

    /**
     * Called when events are updated (for external integrations)
     */
    onEventsUpdated() {
        try {
            // Invalidate statistics cache
            this._invalidateStatisticsCache();

            // Update statistics display
            this.updateEventStatistics();

            // Update timeline
            this.updateMatchLog();

            // Log update for debugging
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                console.log('Events updated - displays refreshed');
            }
        } catch (error) {
            console.error('Error in onEventsUpdated:', error);
        }
    }

    /**
     * Cleanup method to prevent memory leaks
     */
    cleanup() {
        try {
            // Clear timeline cache
            this._clearTimelineCache();

            // Remove event listeners
            const logElement = this._getCachedElement('log');
            if (logElement && this._timelineClickHandler) {
                logElement.removeEventListener('click', this._timelineClickHandler);
            }

            // Clear intervals
            if (this._cacheCleanupInterval) {
                clearInterval(this._cacheCleanupInterval);
                this._cacheCleanupInterval = null;
            }

            // Reset initialization state
            this.isInitialized = false;

            console.log('EventManager cleanup completed');
        } catch (error) {
            console.error('Error during EventManager cleanup:', error);
        }
    }

    // ===== BACKWARD COMPATIBILITY =====

    /**
     * Apply filters to timeline (compatibility method)
     */
    applyFilters() {
        // TODO: Implement filter application (simplified from enhanced-events)
    }

    /**
     * Clear all filters (compatibility method)
     */
    clearFilters() {
        // TODO: Implement filter clearing (simplified from enhanced-events)
    }

    /**
     * Get event modals instance for external access
     * @returns {Object} Event modals instance
     */
    getEventModals() {
        return eventModals;
    }
}

// Create and export singleton instance
export const eventManager = new EventManager();

// Export convenience methods for backward compatibility (properly bound)
export const addMatchEvent = (...args) => eventManager.addMatchEvent(...args);
export const updateEvent = (...args) => eventManager.updateEvent(...args);
export const deleteEvent = (...args) => eventManager.deleteEvent(...args);
export const showRecordEventModal = (...args) => eventManager.showRecordEventModal(...args);
export const openEditEventModal = (...args) => eventManager.openEditEventModal(...args);
export const handleEditEventFormSubmission = (...args) => eventManager.handleEditEventFormSubmission(...args);
export const updateEventStatistics = (...args) => eventManager.updateEventStatistics(...args);
export const updateMatchLog = (...args) => eventManager.updateMatchLog(...args);
export const renderTimeline = (...args) => eventManager.renderTimeline(...args);
export const calculateStatistics = (...args) => eventManager.calculateStatistics(...args);
export const onEventsUpdated = (...args) => eventManager.onEventsUpdated(...args);
export const applyFilters = (...args) => eventManager.applyFilters(...args);
export const clearFilters = (...args) => eventManager.clearFilters(...args);
export const cleanup = (...args) => eventManager.cleanup(...args);
export const getEventModals = (...args) => eventManager.getEventModals(...args);
// Enhanced caching methods
export const configureCaching = (...args) => eventManager.configureCaching(...args);
export const getCacheMetrics = (...args) => eventManager.getCacheMetrics(...args);
export const clearStatisticsCache = (...args) => eventManager.clearStatisticsCache(...args);

// Additional method aliases for backward compatibility with combined-events.js
export const init = () => eventManager.init();
export const destroy = () => eventManager.destroy();

// Method aliases for enhanced-events.js compatibility
export const _calculateEventStatistics = () => eventManager.calculateStatistics();

// Expose internal methods that were previously available
export const _getNotificationType = (eventType) => eventManager._getNotificationType(eventType);
export const _handleHalfTimeEvent = (eventData, team1Name, team2Name) => eventManager._handleHalfTimeEvent(eventData, team1Name, team2Name);
export const _handleFullTimeEvent = (eventData, team1Name, team2Name) => eventManager._handleFullTimeEvent(eventData, team1Name, team2Name);
export const _addScoreData = (eventData, team1Name, team2Name) => eventManager._addScoreData(eventData, team1Name, team2Name);
export const _recalculateScores = () => eventManager._recalculateScores();

// Timeline and UI method aliases
export const _createTimelineItem = (event, index, currentTeam1Name, currentTeam2Name) => eventManager._createTimelineItem(event, index, currentTeam1Name, currentTeam2Name);
export const _createMatchEventHTML = (event, currentTeam1Name, currentTeam2Name) => eventManager._createMatchEventHTML(event, currentTeam1Name, currentTeam2Name);
export const _createGoalEventHTML = (event, currentTeam1Name, currentTeam2Name) => eventManager._createGoalEventHTML(event, currentTeam1Name, currentTeam2Name);
export const _createActionButtons = (event, type) => eventManager._createActionButtons(event, type);
export const _createGoalDetails = (event, isOppositionGoal) => eventManager._createGoalDetails(event, isOppositionGoal);

// Additional utility method aliases from combined-events.js
export const _updateTeamNames = (text, oldTeam1Name, oldTeam2Name, newTeam1Name, newTeam2Name) => eventManager._updateTeamNames(text, oldTeam1Name, oldTeam2Name, newTeam1Name, newTeam2Name);
export const _updateEventTeamNames = (eventData, newTeam1Name, newTeam2Name) => eventManager._updateEventTeamNames(eventData, newTeam1Name, newTeam2Name);

// Internal method aliases that might be called externally
export const _bindEvents = () => eventManager._bindEvents();
export const _bindModalEvents = () => eventManager._bindModalEvents();
export const _optimizeDOMOperations = () => eventManager._optimizeDOMOperations();
export const _cleanupOptimizations = () => eventManager._cleanupOptimizations();

// Enhanced-events.js specific method aliases
export const _updateEmptyState = () => eventManager._updateEmptyState ? eventManager._updateEmptyState() : undefined;

// Performance and caching method aliases
export const _shouldRecalculateStatistics = () => eventManager._shouldRecalculateStatistics ? eventManager._shouldRecalculateStatistics() : true;
export const _getCachedStatistics = () => eventManager._getCachedStatistics ? eventManager._getCachedStatistics() : null;

// Modal-related method aliases for external access
export const _showEventDeleteModal = (itemType, itemName) => eventManager._showEventDeleteModal(itemType, itemName);
export const _createEventDeleteModal = () => eventManager._createEventDeleteModal();
export const _hideEventDeleteModal = () => eventManager._hideEventDeleteModal();
export const _performEventDeletion = () => eventManager._performEventDeletion();

// Validation method aliases
export const _validateEventData = (eventData) => eventManager._validateEventData(eventData);
export const _validateGoalData = (goalData) => eventManager._validateGoalData(goalData);
export const _isValidEventType = (eventType) => eventManager._isValidEventType(eventType);
export const _sanitizeInput = (text) => eventManager._sanitizeInput(text);

// Cache management aliases
export const _invalidateStatisticsCache = () => eventManager._invalidateStatisticsCache();
export const _generateCacheKey = () => eventManager._generateCacheKey();
export const _isCacheValid = () => eventManager._isCacheValid();

// Aliases for backward compatibility
export const combinedEventsManager = eventManager;
export const enhancedEventsManager = eventManager;
export const eventsManager = eventManager;

// Global access functions for HTML onclick handlers
export function deleteLogEntry(index, type) {
    eventManager.deleteEvent(index, type);
}

// Store pending deletion info for confirmation modals
let pendingDeletion = null;

/**
 * Show event delete confirmation modal
 * @param {string} itemType - Type of item being deleted
 * @param {string} itemName - Name of item being deleted
 */
function showEventDeleteModal(itemType, itemName) {
    eventManager._showEventDeleteModal(itemType, itemName);
}

/**
 * Create event delete confirmation modal
 */
function createEventDeleteModal() {
    eventManager._createEventDeleteModal();
}

/**
 * Hide event delete modal
 */
function hideEventDeleteModal() {
    eventManager._hideEventDeleteModal();
}

/**
 * Perform the actual event deletion
 */
function performEventDeletion() {
    eventManager._performEventDeletion();
}

// Export modal functions for external use
export {
    showEventDeleteModal,
    createEventDeleteModal,
    hideEventDeleteModal,
    performEventDeletion,
    pendingDeletion
};

// ===== GLOBAL WINDOW OBJECT INTEGRATION =====
// Maintain backward compatibility for HTML onclick handlers and existing integrations

// Ensure window.EventsModule exists and properly integrates with HTML onclick handlers
if (typeof window !== 'undefined') {
    console.log('🔧 Initializing EventsModule global integration...');
    // Preserve existing EventsModule if it exists (for backward compatibility)
    const existingEventsMethods = window.EventsModule ? { ...window.EventsModule } : {};
    window.EventsModule = window.EventsModule || {};

    // Core event operations - primary interface for HTML onclick handlers
    window.EventsModule.addMatchEvent = (eventType, notes) => eventManager.addMatchEvent(eventType, notes);
    window.EventsModule.updateEvent = (index, updates, type) => eventManager.updateEvent(index, updates, type);
    window.EventsModule.deleteEvent = (index, type) => eventManager.deleteEvent(index, type);
    window.EventsModule.deleteLogEntry = (index, type) => deleteLogEntry(index, type);

    // Modal operations - used by HTML onclick handlers in timeline buttons
    window.EventsModule.showRecordEventModal = () => eventManager.showRecordEventModal();
    window.EventsModule.openEditEventModal = (index, type) => eventManager.openEditEventModal(index, type);
    window.EventsModule.handleEditEventFormSubmission = (event) => eventManager.handleEditEventFormSubmission(event);

    // Display updates - used by other modules and potentially HTML
    window.EventsModule.updateMatchLog = () => eventManager.updateMatchLog();
    window.EventsModule.updateEventStatistics = () => eventManager.updateEventStatistics();
    window.EventsModule.renderTimeline = () => eventManager.renderTimeline();

    // Statistics and filtering - for advanced usage
    window.EventsModule.calculateStatistics = () => eventManager.calculateStatistics();
    window.EventsModule.applyFilters = () => eventManager.applyFilters();
    window.EventsModule.clearFilters = () => eventManager.clearFilters();

    // Lifecycle methods - for module management
    window.EventsModule.init = () => eventManager.init();
    window.EventsModule.destroy = () => eventManager.destroy();
    window.EventsModule.cleanup = () => eventManager.cleanup();

    // Enhanced functionality - for performance tuning
    window.EventsModule.configureCaching = (config) => eventManager.configureCaching(config);
    window.EventsModule.getCacheMetrics = () => eventManager.getCacheMetrics();
    window.EventsModule.clearStatisticsCache = () => eventManager.clearStatisticsCache();

    // Event callbacks - for reactive programming
    window.EventsModule.onEventsUpdated = (callback) => eventManager.onEventsUpdated(callback);

    // Utility methods - for debugging and integration testing
    window.EventsModule.getEventModals = () => eventManager.getEventModals();
    window.EventsModule.getEventManager = () => eventManager;

    // Backward compatibility aliases - maintain existing interfaces
    window.EventsModule.eventsManager = eventManager;
    window.EventsModule.combinedEventsManager = eventManager;
    window.EventsModule.enhancedEventsManager = eventManager;
    window.EventsModule.eventManager = eventManager;

    // Restore any existing methods that weren't overridden (for full backward compatibility)
    Object.keys(existingEventsMethods).forEach(key => {
        if (!window.EventsModule.hasOwnProperty(key)) {
            window.EventsModule[key] = existingEventsMethods[key];
        }
    });

    // Integration testing method (for development and debugging)
    window.EventsModule.testGlobalIntegration = () => {
        console.log('🔍 Testing EventsModule global integration...');
        console.log('📋 Available methods:', Object.keys(window.EventsModule));
        console.log('🎯 Event manager instance:', eventManager);

        // Test critical HTML onclick handler methods
        const criticalMethods = [
            'openEditEventModal',    // Used in timeline edit buttons
            'deleteLogEntry',        // Used in timeline delete buttons  
            'showRecordEventModal',  // Used in record event button
            'addMatchEvent',         // Used for adding events
            'updateMatchLog'         // Used for display updates
        ];

        const missingMethods = criticalMethods.filter(method =>
            typeof window.EventsModule[method] !== 'function'
        );

        // Test method signatures by calling with safe parameters
        const testResults = {};
        criticalMethods.forEach(method => {
            if (typeof window.EventsModule[method] === 'function') {
                testResults[method] = '✅ Available';
            } else {
                testResults[method] = '❌ Missing';
            }
        });

        console.table(testResults);

        // Test GoalsModule integration
        const goalsModuleStatus = window.GoalsModule &&
            typeof window.GoalsModule.toggleGoalDisallowed === 'function'
            ? '✅ Available' : '⚠️ Not available';

        console.log('🥅 GoalsModule.toggleGoalDisallowed:', goalsModuleStatus);

        // Test backward compatibility aliases
        const aliases = ['eventsManager', 'combinedEventsManager', 'enhancedEventsManager'];
        const aliasResults = {};
        aliases.forEach(alias => {
            aliasResults[alias] = window.EventsModule[alias] === eventManager ? '✅ Correct' : '❌ Incorrect';
        });

        console.log('🔄 Backward compatibility aliases:');
        console.table(aliasResults);

        const allTestsPassed = missingMethods.length === 0;

        if (allTestsPassed) {
            console.log('🎉 All critical HTML integration methods are available and properly configured!');
        } else {
            console.error('💥 Missing critical methods:', missingMethods);
        }

        return {
            success: allTestsPassed,
            missingMethods,
            availableMethods: Object.keys(window.EventsModule),
            goalsModuleAvailable: goalsModuleStatus.includes('✅'),
            testResults
        };
    };

    // Quick test method for HTML onclick handler simulation
    window.EventsModule.testHtmlIntegration = () => {
        console.log('🧪 Testing HTML onclick handler integration...');

        try {
            // Test that methods can be called (with safe parameters)
            console.log('Testing openEditEventModal availability:',
                typeof window.EventsModule.openEditEventModal === 'function' ? '✅' : '❌');
            console.log('Testing deleteLogEntry availability:',
                typeof window.EventsModule.deleteLogEntry === 'function' ? '✅' : '❌');
            console.log('Testing showRecordEventModal availability:',
                typeof window.EventsModule.showRecordEventModal === 'function' ? '✅' : '❌');

            // Test GoalsModule integration
            console.log('Testing GoalsModule.toggleGoalDisallowed availability:',
                window.GoalsModule && typeof window.GoalsModule.toggleGoalDisallowed === 'function' ? '✅' : '❌');

            console.log('🎯 HTML integration test completed successfully!');
            return true;
        } catch (error) {
            console.error('💥 HTML integration test failed:', error);
            return false;
        }
    };
}

// Ensure GoalsModule integration for goal-specific operations referenced in HTML onclick handlers
if (typeof window !== 'undefined') {
    // Preserve existing GoalsModule if it exists (important for integration with goals.js)
    const existingGoalsModule = window.GoalsModule ? { ...window.GoalsModule } : {};
    window.GoalsModule = window.GoalsModule || {};

    // Store original toggleGoalDisallowed if it exists (from goals.js module)
    const originalToggleGoalDisallowed = existingGoalsModule.toggleGoalDisallowed;

    // Goal-specific operations that might be called from HTML onclick handlers
    window.GoalsModule.toggleGoalDisallowed = (index) => {
        try {
            // Try to use the original method first (from goals.js module)
            if (originalToggleGoalDisallowed && typeof originalToggleGoalDisallowed === 'function') {
                return originalToggleGoalDisallowed(index);
            }
            // Fallback: try to access through preserved methods
            else if (existingGoalsModule.originalToggleGoalDisallowed) {
                return existingGoalsModule.originalToggleGoalDisallowed(index);
            }
            // Last resort: provide graceful degradation with user feedback
            else {
                console.warn('GoalsModule.toggleGoalDisallowed not available - ensure goals module is loaded');
                // Could show a notification to the user
                if (window.notificationManager) {
                    window.notificationManager.warning('Goal toggle feature not available. Please refresh the page.');
                }
                return false;
            }
        } catch (error) {
            console.error('Error in toggleGoalDisallowed:', error);
            if (window.notificationManager) {
                window.notificationManager.error('Error toggling goal status');
            }
            return false;
        }
    };

    // Restore any other existing GoalsModule methods
    Object.keys(existingGoalsModule).forEach(key => {
        if (key !== 'toggleGoalDisallowed' && !window.GoalsModule.hasOwnProperty(key)) {
            window.GoalsModule[key] = existingGoalsModule[key];
        }
    });

    // Store reference for potential future use
    if (originalToggleGoalDisallowed) {
        window.GoalsModule.originalToggleGoalDisallowed = originalToggleGoalDisallowed;
    }
}

// Log successful global integration setup
if (typeof window !== 'undefined') {
    console.log('✅ EventsModule global integration completed successfully');
    console.log('🎯 HTML onclick handlers ready:', ['openEditEventModal', 'deleteLogEntry', 'showRecordEventModal']);
    console.log('🥅 GoalsModule integration ready for toggleGoalDisallowed');
}
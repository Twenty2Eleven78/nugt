/**
 * Event Configuration Module
 * Handles configurable event types and icons
 */

import { config } from './config.js';

/**
 * Get event types from configuration
 */
export function getEventTypes() {
    try {
        const customTypes = config.get('events.customEventTypes');
        if (customTypes) {
            return customTypes;
        }
    } catch (error) {
        console.warn('Error loading custom event types, using defaults');
    }

    // Fallback to default event types
    return {
        YELLOW_CARD: 'Yellow Card',
        RED_CARD: 'Red Card',
        SIN_BIN: 'Sin Bin',
        FOUL: 'Foul',
        PENALTY: 'Penalty',
        OFFSIDE: 'Offside',
        GAME_STARTED: 'Game Started',
        HALF_TIME: 'Half Time',
        FULL_TIME: 'Full Time',
        INCIDENT: 'Incident',
        INJURY: 'Injury',
        SUBSTITUTION: 'Substitution'
    };
}

/**
 * Get enabled event types from configuration
 */
export function getEnabledEventTypes() {
    try {
        const enabled = config.get('events.enabledEventTypes');
        if (enabled && Array.isArray(enabled)) {
            return enabled;
        }
    } catch (error) {
        console.warn('Error loading enabled event types, using defaults');
    }

    // Fallback to all event types enabled
    const eventTypes = getEventTypes();
    return Object.keys(eventTypes);
}

/**
 * Get event icons from configuration
 */
export function getEventIcons() {
    try {
        const customIcons = config.get('events.eventIcons');
        if (customIcons) {
            return customIcons;
        }
    } catch (error) {
        console.warn('Error loading custom event icons, using defaults');
    }

    // Fallback to default icons
    const eventTypes = getEventTypes();
    const defaultIcons = {};
    
    Object.keys(eventTypes).forEach(type => {
        switch (type) {
            case 'YELLOW_CARD':
                defaultIcons[type] = 'fas fa-square text-warning';
                break;
            case 'RED_CARD':
                defaultIcons[type] = 'fas fa-square text-danger';
                break;
            case 'SIN_BIN':
                defaultIcons[type] = 'fas fa-clock text-info';
                break;
            case 'FOUL':
                defaultIcons[type] = 'fas fa-hand-paper text-warning';
                break;
            case 'PENALTY':
                defaultIcons[type] = 'fas fa-futbol text-danger';
                break;
            case 'OFFSIDE':
                defaultIcons[type] = 'fas fa-flag text-warning';
                break;
            case 'GAME_STARTED':
                defaultIcons[type] = 'fas fa-play text-success';
                break;
            case 'HALF_TIME':
                defaultIcons[type] = 'fas fa-pause text-secondary';
                break;
            case 'FULL_TIME':
                defaultIcons[type] = 'fas fa-stop text-dark';
                break;
            case 'INCIDENT':
                defaultIcons[type] = 'fas fa-exclamation-triangle text-warning';
                break;
            case 'INJURY':
                defaultIcons[type] = 'fas fa-plus text-danger';
                break;
            case 'SUBSTITUTION':
                defaultIcons[type] = 'fas fa-exchange-alt text-success';
                break;
            default:
                defaultIcons[type] = 'fas fa-circle text-info';
        }
    });

    return defaultIcons;
}

/**
 * Check if an event type is enabled
 */
export function isEventTypeEnabled(eventType) {
    const enabledTypes = getEnabledEventTypes();
    return enabledTypes.includes(eventType);
}

/**
 * Get filtered event types (only enabled ones)
 */
export function getFilteredEventTypes() {
    const allTypes = getEventTypes();
    const enabledTypes = getEnabledEventTypes();
    const filtered = {};

    enabledTypes.forEach(type => {
        if (allTypes[type]) {
            filtered[type] = allTypes[type];
        }
    });

    return filtered;
}

/**
 * Get event configuration for UI components
 */
export function getEventConfig() {
    return {
        types: getFilteredEventTypes(),
        icons: getEventIcons(),
        enabled: getEnabledEventTypes()
    };
}
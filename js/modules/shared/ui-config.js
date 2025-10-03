/**
 * UI Configuration Module
 * Handles configurable UI settings and animations
 */

import { config } from './config.js';

/**
 * Get notification configuration
 */
export function getNotificationConfig() {
    try {
        return {
            defaultDuration: config.get('ui.notifications.defaultDuration') || 2000,
            maxNotifications: config.get('ui.notifications.maxNotifications') || 5,
            position: config.get('ui.notifications.position') || 'top-right',
            enableSound: config.get('ui.notifications.enableSound') || false
        };
    } catch (error) {
        console.warn('Error loading notification config, using defaults');
        return {
            defaultDuration: 2000,
            maxNotifications: 5,
            position: 'top-right',
            enableSound: false
        };
    }
}

/**
 * Get animation configuration
 */
export function getAnimationConfig() {
    try {
        const speed = config.get('ui.animations.animationSpeed') || 'normal';
        const speedMap = {
            fast: 150,
            normal: 300,
            slow: 500
        };

        return {
            enableAnimations: config.get('ui.animations.enableAnimations') !== false, // default true
            animationSpeed: speedMap[speed] || 300,
            enableTransitions: config.get('ui.animations.enableTransitions') !== false, // default true
            speedName: speed
        };
    } catch (error) {
        console.warn('Error loading animation config, using defaults');
        return {
            enableAnimations: true,
            animationSpeed: 300,
            enableTransitions: true,
            speedName: 'normal'
        };
    }
}

/**
 * Get UI debounce delay
 */
export function getDebounceDelay() {
    try {
        return config.get('ui.debounceDelay') || 300;
    } catch (error) {
        return 300;
    }
}

/**
 * Get complete UI configuration
 */
export function getUIConfig() {
    return {
        notifications: getNotificationConfig(),
        animations: getAnimationConfig(),
        debounceDelay: getDebounceDelay()
    };
}

/**
 * Apply UI configuration to the document
 */
export function applyUIConfig() {
    const uiConfig = getUIConfig();
    const root = document.documentElement;

    // Apply animation settings
    if (!uiConfig.animations.enableAnimations) {
        root.style.setProperty('--animation-duration', '0ms');
        document.body.classList.add('no-animations');
    } else {
        root.style.setProperty('--animation-duration', `${uiConfig.animations.animationSpeed}ms`);
        document.body.classList.remove('no-animations');
    }

    // Apply transition settings
    if (!uiConfig.animations.enableTransitions) {
        root.style.setProperty('--transition-duration', '0ms');
        document.body.classList.add('no-transitions');
    } else {
        root.style.setProperty('--transition-duration', `${uiConfig.animations.animationSpeed}ms`);
        document.body.classList.remove('no-transitions');
    }

    // Set notification position class
    document.body.setAttribute('data-notification-position', uiConfig.notifications.position);

    console.log('UI configuration applied:', uiConfig);
}

/**
 * Get available notification positions
 */
export function getAvailableNotificationPositions() {
    return {
        'top-left': 'Top Left',
        'top-center': 'Top Center',
        'top-right': 'Top Right',
        'bottom-left': 'Bottom Left',
        'bottom-center': 'Bottom Center',
        'bottom-right': 'Bottom Right'
    };
}

/**
 * Get available animation speeds
 */
export function getAvailableAnimationSpeeds() {
    return {
        fast: 'Fast (150ms)',
        normal: 'Normal (300ms)',
        slow: 'Slow (500ms)'
    };
}
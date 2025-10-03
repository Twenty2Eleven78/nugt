/**
 * Sharing Configuration Module
 * Handles configurable sharing platforms and settings
 */

import { config } from './config.js';

/**
 * Get enabled sharing platforms from configuration
 */
export function getEnabledSharingPlatforms() {
    try {
        const enabled = config.get('sharing.enabledPlatforms');
        if (enabled && Array.isArray(enabled)) {
            return enabled;
        }
    } catch (error) {
        console.warn('Error loading sharing platforms, using defaults');
    }

    // Fallback to default platforms
    return ['whatsapp', 'clipboard'];
}

/**
 * Get sharing configuration
 */
export function getSharingConfig() {
    try {
        return {
            enabledPlatforms: config.get('sharing.enabledPlatforms') || ['whatsapp', 'clipboard'],
            defaultMessage: config.get('sharing.defaultMessage') || 'Check out our match results!',
            includeScore: config.get('sharing.includeScore') !== false, // default true
            includeEvents: config.get('sharing.includeEvents') !== false, // default true
            includeStatistics: config.get('sharing.includeStatistics') || false
        };
    } catch (error) {
        console.warn('Error loading sharing config, using defaults');
        return {
            enabledPlatforms: ['whatsapp', 'clipboard'],
            defaultMessage: 'Check out our match results!',
            includeScore: true,
            includeEvents: true,
            includeStatistics: false
        };
    }
}

/**
 * Check if a sharing platform is enabled
 */
export function isSharingPlatformEnabled(platform) {
    const enabledPlatforms = getEnabledSharingPlatforms();
    return enabledPlatforms.includes(platform);
}

/**
 * Get available sharing platforms with their configurations
 */
export function getAvailableSharingPlatforms() {
    const allPlatforms = {
        whatsapp: {
            name: 'WhatsApp',
            icon: 'fab fa-whatsapp',
            color: '#25D366',
            description: 'Share via WhatsApp'
        },
        twitter: {
            name: 'Twitter',
            icon: 'fab fa-twitter',
            color: '#1DA1F2',
            description: 'Share on Twitter'
        },
        facebook: {
            name: 'Facebook',
            icon: 'fab fa-facebook',
            color: '#1877F2',
            description: 'Share on Facebook'
        },
        clipboard: {
            name: 'Copy to Clipboard',
            icon: 'fas fa-copy',
            color: '#6c757d',
            description: 'Copy match summary'
        },
        'web-api': {
            name: 'Native Share',
            icon: 'fas fa-share-alt',
            color: '#007bff',
            description: 'Use device sharing'
        }
    };

    const enabledPlatforms = getEnabledSharingPlatforms();
    const available = {};

    enabledPlatforms.forEach(platform => {
        if (allPlatforms[platform]) {
            available[platform] = allPlatforms[platform];
        }
    });

    return available;
}
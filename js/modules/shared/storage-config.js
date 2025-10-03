/**
 * Storage Configuration Module
 * Handles configurable storage settings and cache management
 */

import { config } from './config.js';

/**
 * Get storage configuration
 */
export function getStorageConfig() {
    try {
        return {
            cacheVersion: config.get('storage.cacheVersion') || 'v318',
            cacheName: config.get('storage.cacheName') || 'nugt-cache-v318',
            maxStorageSize: config.get('storage.maxStorageSize') || 50, // MB
            autoCleanup: config.get('storage.autoCleanup') !== false, // default true
            cleanupInterval: config.get('storage.cleanupInterval') || 86400000, // 24 hours
            retentionDays: config.get('storage.retentionDays') || 30,
            storageKeys: {
                prefix: config.get('storage.storageKeys.prefix') || 'nugt_',
                teamPrefix: config.get('storage.storageKeys.teamPrefix') || 'team_',
                matchPrefix: config.get('storage.storageKeys.matchPrefix') || 'match_',
                statsPrefix: config.get('storage.storageKeys.statsPrefix') || 'stats_'
            }
        };
    } catch (error) {
        console.warn('Error loading storage config, using defaults');
        return {
            cacheVersion: 'v318',
            cacheName: 'nugt-cache-v318',
            maxStorageSize: 50,
            autoCleanup: true,
            cleanupInterval: 86400000,
            retentionDays: 30,
            storageKeys: {
                prefix: 'nugt_',
                teamPrefix: 'team_',
                matchPrefix: 'match_',
                statsPrefix: 'stats_'
            }
        };
    }
}

/**
 * Get cache configuration for service worker
 */
export function getCacheConfig() {
    const storageConfig = getStorageConfig();
    return {
        name: storageConfig.cacheName,
        version: storageConfig.cacheVersion,
        maxSize: storageConfig.maxStorageSize * 1024 * 1024, // Convert MB to bytes
        autoCleanup: storageConfig.autoCleanup,
        cleanupInterval: storageConfig.cleanupInterval
    };
}

/**
 * Get storage key with configured prefix
 */
export function getStorageKey(type, key) {
    const storageConfig = getStorageConfig();
    const prefixes = storageConfig.storageKeys;
    
    switch (type) {
        case 'team':
            return `${prefixes.prefix}${prefixes.teamPrefix}${key}`;
        case 'match':
            return `${prefixes.prefix}${prefixes.matchPrefix}${key}`;
        case 'stats':
            return `${prefixes.prefix}${prefixes.statsPrefix}${key}`;
        default:
            return `${prefixes.prefix}${key}`;
    }
}

/**
 * Check if auto cleanup is enabled
 */
export function isAutoCleanupEnabled() {
    const storageConfig = getStorageConfig();
    return storageConfig.autoCleanup;
}

/**
 * Get retention period in milliseconds
 */
export function getRetentionPeriod() {
    const storageConfig = getStorageConfig();
    return storageConfig.retentionDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
}
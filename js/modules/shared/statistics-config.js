/**
 * Statistics Configuration Module
 * Handles configurable statistics and analytics settings
 */

import { config } from './config.js';

/**
 * Get statistics configuration
 */
export function getStatisticsConfig() {
    try {
        return {
            enableAdvancedStats: config.get('statistics.enableAdvancedStats') !== false, // default true
            enableCharts: config.get('statistics.enableCharts') !== false, // default true
            chartTypes: config.get('statistics.chartTypes') || ['line', 'bar', 'pie'],
            trackPlayerStats: config.get('statistics.trackPlayerStats') !== false, // default true
            trackTeamStats: config.get('statistics.trackTeamStats') !== false, // default true
            trackSeasonStats: config.get('statistics.trackSeasonStats') !== false, // default true
            autoGenerateReports: config.get('statistics.autoGenerateReports') !== false, // default true
            reportFormats: config.get('statistics.reportFormats') || ['summary', 'detailed', 'charts'],
            retentionPeriod: config.get('statistics.retentionPeriod') || 365 // days
        };
    } catch (error) {
        console.warn('Error loading statistics config, using defaults');
        return {
            enableAdvancedStats: true,
            enableCharts: true,
            chartTypes: ['line', 'bar', 'pie'],
            trackPlayerStats: true,
            trackTeamStats: true,
            trackSeasonStats: true,
            autoGenerateReports: true,
            reportFormats: ['summary', 'detailed', 'charts'],
            retentionPeriod: 365
        };
    }
}

/**
 * Check if advanced statistics are enabled
 */
export function isAdvancedStatsEnabled() {
    const statsConfig = getStatisticsConfig();
    return statsConfig.enableAdvancedStats;
}

/**
 * Check if charts are enabled
 */
export function isChartsEnabled() {
    const statsConfig = getStatisticsConfig();
    return statsConfig.enableCharts;
}

/**
 * Get enabled chart types
 */
export function getEnabledChartTypes() {
    const statsConfig = getStatisticsConfig();
    return statsConfig.chartTypes;
}

/**
 * Check if a specific chart type is enabled
 */
export function isChartTypeEnabled(chartType) {
    const enabledTypes = getEnabledChartTypes();
    return enabledTypes.includes(chartType);
}

/**
 * Get enabled report formats
 */
export function getEnabledReportFormats() {
    const statsConfig = getStatisticsConfig();
    return statsConfig.reportFormats;
}

/**
 * Check if a specific report format is enabled
 */
export function isReportFormatEnabled(format) {
    const enabledFormats = getEnabledReportFormats();
    return enabledFormats.includes(format);
}

/**
 * Get statistics tracking configuration
 */
export function getTrackingConfig() {
    const statsConfig = getStatisticsConfig();
    return {
        players: statsConfig.trackPlayerStats,
        team: statsConfig.trackTeamStats,
        season: statsConfig.trackSeasonStats
    };
}

/**
 * Get statistics retention period in milliseconds
 */
export function getStatsRetentionPeriod() {
    const statsConfig = getStatisticsConfig();
    return statsConfig.retentionPeriod * 24 * 60 * 60 * 1000; // Convert days to milliseconds
}
/**
 * Integrations Configuration Module
 * Handles external integrations, APIs, and data exchange settings
 */

import { config } from './config.js';

/**
 * Get integrations configuration
 */
export function getIntegrationsConfig() {
    try {
        return {
            enableWebhooks: config.get('integrations.enableWebhooks') || false,
            webhookUrl: config.get('integrations.webhookUrl') || '',
            enableExports: config.get('integrations.enableExports') !== false, // default true
            exportFormats: config.get('integrations.exportFormats') || ['json', 'csv'],
            enableImports: config.get('integrations.enableImports') !== false, // default true
            importSources: config.get('integrations.importSources') || ['csv', 'json'],
            apiSettings: {
                enableApi: config.get('integrations.apiSettings.enableApi') || false,
                apiKey: config.get('integrations.apiSettings.apiKey') || '',
                baseUrl: config.get('integrations.apiSettings.baseUrl') || ''
            },
            externalServices: {
                enableLeagueSync: config.get('integrations.externalServices.enableLeagueSync') || false,
                leagueApiUrl: config.get('integrations.externalServices.leagueApiUrl') || '',
                enableStatsSync: config.get('integrations.externalServices.enableStatsSync') || false,
                statsApiUrl: config.get('integrations.externalServices.statsApiUrl') || ''
            }
        };
    } catch (error) {
        console.warn('Error loading integrations config, using defaults');
        return {
            enableWebhooks: false,
            webhookUrl: '',
            enableExports: true,
            exportFormats: ['json', 'csv'],
            enableImports: true,
            importSources: ['csv', 'json'],
            apiSettings: {
                enableApi: false,
                apiKey: '',
                baseUrl: ''
            },
            externalServices: {
                enableLeagueSync: false,
                leagueApiUrl: '',
                enableStatsSync: false,
                statsApiUrl: ''
            }
        };
    }
}

/**
 * Check if webhooks are enabled
 */
export function isWebhooksEnabled() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.enableWebhooks && integrationsConfig.webhookUrl;
}

/**
 * Get webhook configuration
 */
export function getWebhookConfig() {
    const integrationsConfig = getIntegrationsConfig();
    return {
        enabled: integrationsConfig.enableWebhooks,
        url: integrationsConfig.webhookUrl
    };
}

/**
 * Check if exports are enabled
 */
export function isExportsEnabled() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.enableExports;
}

/**
 * Get enabled export formats
 */
export function getEnabledExportFormats() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.exportFormats;
}

/**
 * Check if a specific export format is enabled
 */
export function isExportFormatEnabled(format) {
    const enabledFormats = getEnabledExportFormats();
    return enabledFormats.includes(format);
}

/**
 * Check if imports are enabled
 */
export function isImportsEnabled() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.enableImports;
}

/**
 * Get enabled import sources
 */
export function getEnabledImportSources() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.importSources;
}

/**
 * Check if a specific import source is enabled
 */
export function isImportSourceEnabled(source) {
    const enabledSources = getEnabledImportSources();
    return enabledSources.includes(source);
}

/**
 * Check if API is enabled
 */
export function isApiEnabled() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.apiSettings.enableApi && integrationsConfig.apiSettings.apiKey;
}

/**
 * Get API configuration
 */
export function getApiConfig() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.apiSettings;
}

/**
 * Check if league sync is enabled
 */
export function isLeagueSyncEnabled() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.externalServices.enableLeagueSync &&
        integrationsConfig.externalServices.leagueApiUrl;
}

/**
 * Check if stats sync is enabled
 */
export function isStatsSyncEnabled() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.externalServices.enableStatsSync &&
        integrationsConfig.externalServices.statsApiUrl;
}

/**
 * Get external services configuration
 */
export function getExternalServicesConfig() {
    const integrationsConfig = getIntegrationsConfig();
    return integrationsConfig.externalServices;
}

/**
 * Get available export formats with descriptions
 */
export function getAvailableExportFormats() {
    return {
        json: {
            name: 'JSON',
            description: 'JavaScript Object Notation',
            extension: '.json',
            mimeType: 'application/json'
        },
        csv: {
            name: 'CSV',
            description: 'Comma Separated Values',
            extension: '.csv',
            mimeType: 'text/csv'
        },
        txt: {
            name: 'Text',
            description: 'Plain Text Format',
            extension: '.txt',
            mimeType: 'text/plain'
        },
        xml: {
            name: 'XML',
            description: 'Extensible Markup Language',
            extension: '.xml',
            mimeType: 'application/xml'
        }
    };
}

/**
 * Get available import sources with descriptions
 */
export function getAvailableImportSources() {
    return {
        csv: {
            name: 'CSV File',
            description: 'Import from CSV file',
            accepts: '.csv'
        },
        json: {
            name: 'JSON File',
            description: 'Import from JSON file',
            accepts: '.json'
        },
        xml: {
            name: 'XML File',
            description: 'Import from XML file',
            accepts: '.xml'
        },
        api: {
            name: 'External API',
            description: 'Import from external API',
            accepts: 'application/json'
        }
    };
}

/**
 * Validate integrations configuration
 */
export function validateIntegrationsConfig() {
    const integrationsConfig = getIntegrationsConfig();
    const errors = [];
    const warnings = [];

    // Validate webhook URL if webhooks are enabled
    if (integrationsConfig.enableWebhooks) {
        if (!integrationsConfig.webhookUrl) {
            errors.push('Webhook URL is required when webhooks are enabled');
        } else if (!isValidUrl(integrationsConfig.webhookUrl)) {
            errors.push('Invalid webhook URL format');
        }
    }

    // Validate API settings if API is enabled
    if (integrationsConfig.apiSettings.enableApi) {
        if (!integrationsConfig.apiSettings.apiKey) {
            errors.push('API key is required when API is enabled');
        }
        if (!integrationsConfig.apiSettings.baseUrl) {
            warnings.push('Base URL is recommended when API is enabled');
        } else if (!isValidUrl(integrationsConfig.apiSettings.baseUrl)) {
            errors.push('Invalid API base URL format');
        }
    }

    // Validate external services URLs
    if (integrationsConfig.externalServices.enableLeagueSync) {
        if (!integrationsConfig.externalServices.leagueApiUrl) {
            errors.push('League API URL is required when league sync is enabled');
        } else if (!isValidUrl(integrationsConfig.externalServices.leagueApiUrl)) {
            errors.push('Invalid league API URL format');
        }
    }

    if (integrationsConfig.externalServices.enableStatsSync) {
        if (!integrationsConfig.externalServices.statsApiUrl) {
            errors.push('Stats API URL is required when stats sync is enabled');
        } else if (!isValidUrl(integrationsConfig.externalServices.statsApiUrl)) {
            errors.push('Invalid stats API URL format');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Helper function to validate URL format
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
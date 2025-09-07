/**
 * Config Module
 * Fetches and provides the application configuration.
 */

let config = null;

/**
 * Fetches the configuration from the server.
 * @returns {Promise<object>} A promise that resolves to the configuration object.
 */
async function fetchConfig() {
    if (config) {
        return config;
    }

    try {
        const response = await fetch('/config/config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        config = await response.json();
        return config;
    } catch (error) {
        console.error("Could not load configuration:", error);
        // Fallback to a default config or handle the error appropriately
        return {};
    }
}

/**
 * Returns the loaded configuration.
 * It's recommended to call and await fetchConfig() at app startup
 * to ensure the config is loaded.
 */
export function getConfig() {
    if (!config) {
        console.warn("Configuration not yet loaded. Call fetchConfig() first.");
        return {};
    }
    return config;
}

// Export the fetch function to be used at application startup.
export { fetchConfig };

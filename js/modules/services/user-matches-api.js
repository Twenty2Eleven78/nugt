/**
 * User Matches API Service
 * Handles saving/loading user match data via Netlify Functions
 */

import { authService } from './auth.js';

const API_ENDPOINTS = {
  USER_MATCHES: '/.netlify/functions/user-matches'
};

const HTTP_METHODS = {
  GET: 'GET',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class UserMatchesAPI {
  constructor() {
    this.requestCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }
  async saveMatchData(matchData) {
    if (!matchData || typeof matchData !== 'object') {
      throw new Error('Invalid match data provided');
    }

    const token = await this._getAuthToken();
    const enhancedMatchData = this._enhanceMatchData(matchData);

    const requestOptions = {
      method: HTTP_METHODS.PUT,
      headers: this._buildHeaders(token, true),
      body: JSON.stringify(enhancedMatchData)
    };

    const response = await this._makeRequest(API_ENDPOINTS.USER_MATCHES, requestOptions);
    this._clearCache(); // Clear all caches after save (including admin data)
    return response.data;
  }

  async loadMatchData() {
    const cacheKey = 'loadMatchData';
    const cachedData = this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const token = await this._getAuthToken();
    const requestOptions = {
      method: HTTP_METHODS.GET,
      headers: this._buildHeaders(token)
    };

    try {
      const response = await this._makeRequest(API_ENDPOINTS.USER_MATCHES, requestOptions);
      this._setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async loadAllMatchData() {
    const cacheKey = 'loadAllMatchData';
    const cachedData = this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const token = await this._getAuthToken();
    const url = `${API_ENDPOINTS.USER_MATCHES}?admin=true`;
    const requestOptions = {
      method: HTTP_METHODS.GET,
      headers: this._buildHeaders(token)
    };

    const response = await this._makeRequest(url, requestOptions);
    this._setCache(cacheKey, response.data);
    return response.data;
  }

  async deleteMatchData(userId, matchIndex) {
    if (!userId) {
      throw new Error('User ID is required for deletion');
    }

    const token = await this._getAuthToken();
    const params = this._buildQueryParams({ userId, matchIndex });
    const url = `${API_ENDPOINTS.USER_MATCHES}?${params}`;

    const requestOptions = {
      method: HTTP_METHODS.DELETE,
      headers: this._buildHeaders(token)
    };

    const response = await this._makeRequest(url, requestOptions);
    this._clearCache(); // Clear all caches after delete (including admin data)
    return response;
  }

  // Clear all cached data
  clearCache() {
    this._clearCache();
  }

  // Private helper methods
  async _getAuthToken() {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return token;
  }

  _enhanceMatchData(matchData) {
    const currentUser = authService.getCurrentUser();
    return {
      ...matchData,
      userEmail: currentUser?.email || 'unknown@example.com',
      userName: currentUser?.name || 'Unknown User',
      timestamp: new Date().toISOString()
    };
  }

  _buildHeaders(token, includeContentType = false) {
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  _buildQueryParams(params) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  async _makeRequest(url, options, retryCount = 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      if (retryCount < MAX_RETRIES && this._shouldRetry(error)) {
        await this._delay(RETRY_DELAY * (retryCount + 1));
        return this._makeRequest(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  async _handleErrorResponse(response) {
    let errorMessage = 'Unknown error occurred';

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || `HTTP ${response.status}`;
    }

    throw new Error(`${response.status}: ${errorMessage}`);
  }

  _shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return error.name === 'TypeError' ||
      error.message.includes('timeout') ||
      error.message.includes('5');
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _getFromCache(key) {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    const now = Date.now();

    if (now - timestamp > this.cacheTimeout) {
      this.requestCache.delete(key);
      return null;
    }

    return data;
  }

  _setCache(key, data) {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _clearCache() {
    this.requestCache.clear();
  }
}

// Create and export singleton instance
export const userMatchesApi = new UserMatchesAPI();
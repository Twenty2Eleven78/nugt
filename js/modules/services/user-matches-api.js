/**
 * User Matches API Service
 * Handles saving/loading user match data via Netlify Functions
 */

import { authService } from './auth.js';

const API_ENDPOINTS = {
  USER_MATCHES: '/.netlify/functions/user-matches',
  STATISTICS: '/.netlify/functions/statistics'
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

  async updateMatchData(matchData, originalUserId) {
    if (!matchData || typeof matchData !== 'object') {
      throw new Error('Invalid match data provided');
    }

    const token = await this._getAuthToken();
    
    // For admin updates, we need to preserve the original user info
    const updatedMatch = {
      ...matchData,
      // Preserve original user information
      userEmail: matchData.userEmail,
      userName: matchData.userName,
      userId: originalUserId || matchData.userId,
      // Add admin update tracking
      lastUpdatedBy: (await authService.getCurrentUser())?.email,
      lastUpdatedAt: new Date().toISOString()
    };

    const requestOptions = {
      method: HTTP_METHODS.PUT,
      headers: this._buildHeaders(token, true),
      body: JSON.stringify({
        ...updatedMatch,
        _adminUpdate: true,
        _targetUserId: originalUserId || matchData.userId
      })
    };

    const response = await this._makeRequest(API_ENDPOINTS.USER_MATCHES, requestOptions);
    this._clearCache(); // Clear all caches after update
    return response.data;
  }

  async saveStatistics(statistics) {
    if (!statistics || typeof statistics !== 'object') {
      throw new Error('Invalid statistics data provided');
    }

    // First, delete existing statistics
    try {
      await this.deleteStatistics();
    } catch (error) {
      // Ignore if no existing statistics to delete
      console.log('No existing statistics to delete:', error.message);
    }

    const currentUser = await authService.getCurrentUser();
    const statsData = {
      title: 'Team Statistics',
      statistics: {
        ...statistics,
        savedBy: currentUser?.email,
        savedAt: Date.now()
      },
      userEmail: 'statistics@nugt.app',
      userId: 'system_statistics',
      savedAt: Date.now(),
      _statsUpdate: true
    };

    return await this.saveMatchData(statsData);
  }

  async deleteStatistics() {
    const token = await this._getAuthToken();
    const params = this._buildQueryParams({ 
      userId: 'system_statistics',
      statistics: true,
      title: 'Team Statistics',
      userEmail: 'statistics@system.com'
    });
    const url = `${API_ENDPOINTS.USER_MATCHES}?${params}`;

    const requestOptions = {
      method: HTTP_METHODS.DELETE,
      headers: this._buildHeaders(token)
    };

    const response = await this._makeRequest(url, requestOptions);
    this._clearCache();
    return response;
  }

  async loadStatistics() {
    console.log('🌐 API: Loading statistics from cloud...');
    
    const cacheKey = 'loadStatistics';
    const cachedData = this._getFromCache(cacheKey);
    if (cachedData) {
      console.log('💾 API: Returning cached statistics:', cachedData);
      return cachedData;
    }

    const token = await this._getAuthToken();
    const url = `${API_ENDPOINTS.USER_MATCHES}?statistics=true`;
    const requestOptions = {
      method: HTTP_METHODS.GET,
      headers: this._buildHeaders(token)
    };

    try {
      console.log('🌐 API: Making request to:', url);
      const response = await this._makeRequest(url, requestOptions);
      console.log('🌐 API: Statistics response:', response);
      
      // Extract statistics from the response data
      const statsData = response.data?.statistics || response.data;
      console.log('📊 API: Extracted statistics data:', statsData);
      
      this._setCache(cacheKey, statsData);
      return statsData;
    } catch (error) {
      console.log('❌ API: Statistics load error:', error);
      if (error.message.includes('404')) {
        console.log('🔄 API: No statistics found (404)');
        return null;
      }
      throw error;
    }
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
    
    // Don't override system identifiers for statistics
    if (matchData._statsUpdate || matchData.userId === 'system_statistics') {
      return {
        ...matchData,
        timestamp: new Date().toISOString()
      };
    }
    
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
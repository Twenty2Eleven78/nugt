// Frontend API for saving/loading user match data via Netlify Function
import { authService } from './auth.js';

export const userMatchesApi = {
  async saveMatchData(matchData) {
    // Get user token from auth service
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Get current user info to include with match data
    const currentUser = authService.getCurrentUser();
    const enhancedMatchData = {
      ...matchData,
      userEmail: currentUser?.email || 'unknown@example.com',
      userName: currentUser?.name || 'Unknown User'
    };

    const res = await fetch('/.netlify/functions/user-matches', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(enhancedMatchData)
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to save match data');
    }
    
    const response = await res.json();
    return response.data;
  },

  async loadMatchData() {
    // Get user token from auth service
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const res = await fetch('/.netlify/functions/user-matches', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to load match data');
    }
    
    const response = await res.json();
    return response.data;
  },

  async loadAllMatchData() {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const res = await fetch('/.netlify/functions/user-matches?admin=true', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to load all match data');
    }

    const response = await res.json();
    return response.data;
  },

  async deleteMatchData(userId, matchIndex) {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const res = await fetch('/.netlify/functions/user-matches', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        userId: userId,
        matchIndex: matchIndex 
      })
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to delete match data');
    }

    const response = await res.json();
    return response;
  }
};
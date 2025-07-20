// Frontend API for saving/loading user match data via Netlify Function

export const userMatchesApi = {
  async saveMatchData(matchData) {
    const res = await fetch('/.netlify/functions/user-matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData)
    });
    if (!res.ok) throw new Error('Failed to save match data');
    return await res.json();
  },

  async loadMatchData() {
    const res = await fetch('/.netlify/functions/user-matches');
    if (!res.ok) return null;
    return await res.json();
  }
};

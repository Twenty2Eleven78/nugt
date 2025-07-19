// Netlify function to save match data to Netlify Blob Store
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  try {
    // Check content length
    const contentLength = parseInt(event.headers['content-length'] || '0');
    if (contentLength > 5 * 1024 * 1024) { // 5MB limit
      return {
        statusCode: 413,
        body: JSON.stringify({ message: 'Request too large. Match data must be under 5MB.' })
      };
    }
    
    // Parse request body with error handling
    let matchId, matchData, userId;
    try {
      const body = JSON.parse(event.body);
      matchId = body.matchId;
      matchData = body.matchData;
      userId = body.userId;
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON in request body' })
      };
    }
    
    if (!matchId || !matchData || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }
    
    // Validate match data structure
    if (!matchData.title || !matchData.teams || !matchData.gameState) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid match data structure' })
      };
    }
    
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_API_TOKEN;

    if (!siteID || !token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Netlify Blob Storage not configured. Missing NETLIFY_SITE_ID or NETLIFY_API_TOKEN environment variables.' })
      };
    }

    // Try to use Netlify Blob Store
    const store = getStore({
      name: `user-matches-${userId}`,
      siteID,
      token
    });

    // Save match data to blob store
    await store.set(matchId, JSON.stringify(matchData));

    console.log('Match saved to Netlify Blob Store successfully');
    
    // Always return success to the client
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Match saved successfully',
        timestamp: new Date().toISOString(),
        matchId
      })
    };
  } catch (error) {
    console.error('Error in save-match function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error', error: error.message })
    };
  }
};
// Netlify function to save match data to Netlify Blob Store
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  try {
    // Parse request body
    const { matchId, matchData, userId } = JSON.parse(event.body);
    
    if (!matchId || !matchData || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
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
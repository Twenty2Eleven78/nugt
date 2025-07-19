// Netlify function to save match data to Netlify Blob Store
const { getStore } = require('@netlify/blobs');
const { NetlifyIntegration } = require('@netlify/blobs/adapters');

exports.handler = async (event, context) => {
  try {
    // Parse request body
    const { matchId, matchData, userId, userEmail } = JSON.parse(event.body);
    
    if (!matchId || !matchData || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }
    
    // Create a store for this user's matches with Netlify integration
    const store = getStore({
      name: `user-matches-${userId}`,
      siteID: context.site.id,
      integration: NetlifyIntegration(context)
    });
    
    // Save match data to blob store
    await store.set(matchId, JSON.stringify(matchData));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Match saved successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error saving match:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error saving match data', error: error.message })
    };
  }
};
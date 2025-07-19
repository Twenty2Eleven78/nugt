// Netlify function to save match data to Netlify Blob Store
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  // Check if user is authenticated
  if (!context.clientContext || !context.clientContext.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }

  try {
    // Parse request body
    const { matchId, matchData } = JSON.parse(event.body);
    
    if (!matchId || !matchData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }
    
    // Get user ID from context
    const userId = context.clientContext.user.sub;
    
    // Create a store for this user's matches
    const store = getStore({
      name: `user-matches-${userId}`,
      siteID: context.site.id
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
// Netlify function to retrieve saved matches from Netlify Blob Store
const { getStore } = require('@netlify/blobs');
const { NetlifyIntegration } = require('@netlify/blobs/adapters');

exports.handler = async (event, context) => {
  try {
    // Get user ID from query parameters
    const params = new URLSearchParams(event.queryStringParameters);
    const userId = params.get('userId') || event.queryStringParameters.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing userId parameter' })
      };
    }
    
    // Create a store for this user's matches with Netlify integration
    const store = getStore({
      name: `user-matches-${userId}`,
      siteID: context.site.id,
      integration: NetlifyIntegration(context)
    });
    
    // List all blobs in the store
    const blobs = await store.list();
    
    // Get match data for each blob
    const matches = [];
    for (const blobKey of blobs) {
      const matchData = await store.get(blobKey);
      if (matchData) {
        matches.push({
          id: blobKey,
          data: JSON.parse(matchData.toString())
        });
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ matches })
    };
  } catch (error) {
    console.error('Error retrieving matches:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error retrieving match data', error: error.message })
    };
  }
};
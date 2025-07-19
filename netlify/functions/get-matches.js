// Netlify function to retrieve saved matches from Netlify Blob Store
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
    // Get user ID from context
    const userId = context.clientContext.user.sub;
    
    // Create a store for this user's matches
    const store = getStore({
      name: `user-matches-${userId}`,
      siteID: context.site.id
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
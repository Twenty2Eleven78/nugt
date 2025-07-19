// Netlify function to retrieve saved matches from Netlify Blob Store
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  try {
    // Get user ID from query parameters
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing userId parameter' })
      };
    }
    
    let matches = [];
    
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_API_TOKEN;

    if (!siteID || !token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Netlify Blob Storage not configured. Missing NETLIFY_SITE_ID or NETLIFY_API_TOKEN environment variables.' })
      };
    }

    const store = getStore({
      name: `user-matches-${userId}`,
      siteID,
      token
    });

    // List all blobs in the store
    const { blobs } = await store.list();

    // Get match data for each blob
    for (const blob of blobs) {
      const matchData = await store.get(blob.key);
      if (matchData) {
        matches.push({
          id: blob.key,
          data: JSON.parse(matchData)
        });
      }
    }
    
    console.log(`Retrieved ${matches.length} matches from Netlify Blob Store`);

    return {
      statusCode: 200,
      body: JSON.stringify({ matches })
    };
  } catch (error) {
    console.error('Error in get-matches function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error', error: error.message })
    };
  }
};
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
    
    try {
      // Try to use Netlify Blob Store
      const store = getStore({
        name: `user-matches-${userId}`,
        siteID: process.env.NETLIFY_SITE_ID || 'b4a91544-9264-462c-a90e-28fde735b9f4'
      });
      
      // List all blobs in the store
      const blobs = await store.list();
      
      // Get match data for each blob
      for (const blobKey of blobs) {
        const matchData = await store.get(blobKey);
        if (matchData) {
          matches.push({
            id: blobKey,
            data: JSON.parse(matchData.toString())
          });
        }
      }
      
      console.log(`Retrieved ${matches.length} matches from Netlify Blob Store`);
    } catch (blobError) {
      // Log the error but don't fail the function
      console.error('Error retrieving from Netlify Blob Store:', blobError);
      
      // Provide mock data as fallback
      matches = [
        {
          id: 'mock_match_1',
          data: {
            title: 'Example Match',
            timestamp: Date.now() - 86400000, // 1 day ago
            teams: {
              team1: { name: 'Netherton', score: 3 },
              team2: { name: 'Opposition', score: 1 }
            }
          }
        }
      ];
      console.log('Using mock data as fallback');
    }
    
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
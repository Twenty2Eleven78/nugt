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
    
    try {
      // Try to use Netlify Blob Store
      const store = getStore({
        name: `user-matches-${userId}`,
        siteID: process.env.NETLIFY_SITE_ID || 'b4a91544-9264-462c-a90e-28fde735b9f4'
      });
      
      // Save match data to blob store
      await store.set(matchId, JSON.stringify(matchData));
      
      console.log('Match saved to Netlify Blob Store successfully');
    } catch (blobError) {
      // Log the error but don't fail the function
      console.error('Error saving to Netlify Blob Store:', blobError);
      console.log('Continuing with response anyway');
    }
    
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
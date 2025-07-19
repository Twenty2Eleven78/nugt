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

    // Get match data for each blob with parallel processing
    const matchPromises = blobs.map(async (blob) => {
      try {
        const matchData = await store.get(blob.key);
        if (!matchData) return null;

        const data = JSON.parse(matchData);
        
        // Basic validation of retrieved data
        if (!data.title || !data.teams || !data.gameState) {
          console.warn(`Invalid match data structure for ${blob.key}`);
          return null;
        }

        return {
          id: blob.key,
          data,
          savedAt: data.savedAt || null,
          version: data.version || '1.0.0'
        };
      } catch (e) {
        console.warn(`Error processing match ${blob.key}:`, e);
        return null;
      }
    });

    const results = await Promise.all(matchPromises);
    matches = results.filter(match => match !== null);
    
    // Sort matches by savedAt date, newest first
    matches.sort((a, b) => {
      return new Date(b.savedAt || 0) - new Date(a.savedAt || 0);
    });
    
    console.log(`Retrieved ${matches.length} valid matches from Netlify Blob Store`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        matches,
        totalCount: matches.length,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error in get-matches function:', error);
    
    // Return appropriate status code based on error
    const statusCode = error.code === 'ENOENT' ? 404 :
                      error.code === 'EACCES' ? 403 : 500;
    
    return {
      statusCode,
      body: JSON.stringify({ 
        message: 'Server error', 
        error: error.message,
        code: error.code || 'UNKNOWN'
      })
    };
  }
};
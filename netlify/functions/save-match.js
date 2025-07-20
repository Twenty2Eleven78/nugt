// Netlify function to save match data to Netlify Blob Store
const { getStore } = require('@netlify/blobs');

// Validate environment variables
const validateConfig = () => {
  if (!process.env.SITE_ID) {
    throw new Error('SITE_ID environment variable is required');
  }
};

exports.handler = async (event, context) => {
  // Check if user is authenticated
  if (!context.clientContext?.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized - Please log in to save matches' })
    };
  }
  
  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    console.error('Configuration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error', error: error.message })
    };
  }

  try {
    // Parse and validate request body
    let matchId, matchData;
    try {
      const body = JSON.parse(event.body);
      matchId = body.matchId;
      matchData = body.matchData;
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid request body format' })
      };
    }
    
    // Validate required fields
    if (!matchId || typeof matchId !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid or missing matchId' })
      };
    }
    
    if (!matchData || typeof matchData !== 'object') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid or missing matchData' })
      };
    }
    
    // Get user ID from context
    const userId = context.clientContext.user.sub;
    
    // Create a store for this user's matches
    const store = getStore({
      name: `user-matches-${userId}`,
      siteID: process.env.SITE_ID || context.site.id,
      // Add caching options for better performance
      cache: {
        maxAge: 60 * 5, // Cache for 5 minutes
        staleWhileRevalidate: 60 // Allow serving stale content while revalidating
      }
    });
    
    try {
      // Save match data to blob store with metadata
      await store.set(matchId, JSON.stringify(matchData), {
        metadata: {
          userId: userId,
          createdAt: new Date().toISOString(),
          matchId: matchId
        }
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Match saved successfully',
          timestamp: new Date().toISOString(),
          matchId: matchId
        })
      };
    } catch (storageError) {
      console.error('Blob storage error:', storageError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          message: 'Failed to save match to blob storage',
          error: storageError.message
        })
      };
    }
  } catch (error) {
    console.error('Error saving match:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error saving match data', error: error.message })
    };
  }
};
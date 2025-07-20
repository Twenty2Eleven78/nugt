const NETLIFY_BLOBS_API = 'https://api.netlify.com/api/v1/blobs';
const SITE_ID = process.env.NETLIFY_SITE_ID; // Set in Netlify environment variables
const ACCESS_TOKEN = process.env.NETLIFY_API_TOKEN; // Set in Netlify environment variables

exports.handler = async function(event, context) {
  try {
    // Check for Authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing or invalid authorization token' })
      };
    }

    // Get token from header and decode it
    const token = authHeader.split(' ')[1];
    
    try {
      // Our token is base64 encoded as userId:timestamp
      const [userId, timestamp] = atob(token).split(':');
      
      // Basic validation - token shouldn't be older than 24 hours
      const tokenAge = Date.now() - Number(timestamp);
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Token expired' })
        };
      }

      if (!userId) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid token format' })
        };
      }
    } catch (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token format' })
      };
    }
    const key = `user-data/${userId}/matches.json`;

    if (event.httpMethod === 'GET') {
      try {
        // Retrieve user data
        const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${key}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        if (!res.ok) {
          return { 
            statusCode: res.status === 404 ? 404 : 500, 
            body: JSON.stringify({ error: 'No data found' }) 
          };
        }
        const data = await res.text();
        return { statusCode: 200, body: data };
      } catch (error) {
        console.error('Error retrieving data:', error);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ error: 'Failed to retrieve data' }) 
        };
      }
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      try {
        // Save user data
        const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${key}`;
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: event.body
        });
        if (!res.ok) {
          return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Failed to save data' }) 
          };
        }
        const data = await res.text();
        return { statusCode: 200, body: data };
      } catch (error) {
        console.error('Error saving data:', error);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ error: 'Failed to save data' }) 
        };
      }
    }

    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

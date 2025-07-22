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
    let userId;
    
    try {
      // Our token is base64 encoded as userId:timestamp
      const decoded = Buffer.from(token, 'base64').toString('binary').split(':');
      userId = decoded[0];
      const timestamp = decoded[1];
      
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
      const isAdmin = event.queryStringParameters.admin === 'true';

      if (isAdmin) {
        // Admin request to get all matches
        try {
          const url = `${NETLIFY_BLOBS_API}/${SITE_ID}?prefix=user-data`;
          const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
          });

          if (!res.ok) {
            return { 
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to retrieve data' })
            };
          }

          const { blobs = [] } = await res.json();
          const allMatches = [];

          for (const blob of blobs) {
            const blobRes = await fetch(`${NETLIFY_BLOBS_API}/${SITE_ID}/${blob.key}`, {
              headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            if (blobRes.ok) {
              const data = await blobRes.text();
              try {
                const matches = data ? JSON.parse(data) : [];
                const matchArray = Array.isArray(matches) ? matches : [matches];
                allMatches.push(...matchArray.map(match => ({ ...match, userId: blob.key.split('/')[1] })));
              } catch (e) {
                // ignore parsing errors
              }
            }
          }

          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'All matches retrieved successfully',
              data: allMatches
            })
          };
        } catch (error) {
          console.error('Error retrieving all data:', error);
          console.log('Error:', error);
          return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Failed to retrieve all data' })
          };
        }
      } else {
        // Regular user request
        try {
          // Retrieve user data
          const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${key}`;
          const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
          });
          if (!res.ok) {
            if (res.status === 404) {
              // Return empty array for new users
              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'No matches found',
                  data: []
                })
              };
            }
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to retrieve data' })
            };
          }
          const data = await res.text();
          try {
            // Try to parse the data as JSON to ensure it's valid
            const matches = data ? JSON.parse(data) : [];
            // Ensure we always return an array
            const matchArray = Array.isArray(matches) ? matches : [matches];
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Matches retrieved successfully',
                data: matchArray
              })
            };
          } catch (parseError) {
            console.error('Error parsing data:', parseError);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Invalid data format' })
            };
          }
        } catch (error) {
          console.error('Error retrieving data:', error);
          return { 
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to retrieve data' })
          };
        }
      }
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      try {
        // First, try to get existing matches
        const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${key}`;
        const getRes = await fetch(url, {
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        
        // Initialize matches array
        let matches = [];
        if (getRes.ok) {
          const existingData = await getRes.text();
          try {
            const parsed = JSON.parse(existingData);
            matches = Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.warn('Could not parse existing matches:', parseError);
          }
        }
        
        // Add new match data
        const newMatch = JSON.parse(event.body);
        matches.push(newMatch);
        
        // Keep only the latest 50 matches
        if (matches.length > 50) {
          matches = matches.sort((a, b) => b.savedAt - a.savedAt).slice(0, 50);
        }
        
        // Save updated matches array
        const saveRes = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(matches)
        });
        
        if (!saveRes.ok) {
          return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Failed to save match' }) 
          };
        }
        
        return { 
          statusCode: 200, 
          body: JSON.stringify({ 
            message: 'Match saved successfully',
            data: newMatch 
          })
        };
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

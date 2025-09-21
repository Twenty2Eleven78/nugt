const NETLIFY_BLOBS_API = 'https://api.netlify.com/api/v1/blobs';
const SITE_ID = process.env.NETLIFY_SITE_ID;
const ACCESS_TOKEN = process.env.NETLIFY_API_TOKEN;

exports.handler = async function(event, context) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authorization token' })
      };
    }

    const token = authHeader.split(' ')[1];
    let userId, userEmail;
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('binary').split(':');
      userId = decoded[0];
      userEmail = decoded[1];
      const timestamp = decoded[2];
      
      if (Date.now() - Number(timestamp) > 24 * 60 * 60 * 1000) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Token expired' })
        };
      }
    } catch (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Create or update team
      const team = JSON.parse(event.body);
      
      // Check if user is admin for team creation
      if (!team.members || team.members.length === 1) {
        // This is a new team creation, check admin status
        const isAdmin = isAdminUser(userId, userEmail);
        if (!isAdmin) {
          return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Only administrators can create teams' })
          };
        }
      }
      
      const teamKey = `teams/${team.id}.json`;
      
      // Save team data
      const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${teamKey}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(team)
      });
      
      if (!response.ok) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to save team' })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Team saved successfully', team })
      };
    }

    if (event.httpMethod === 'GET') {
      const teamCode = event.queryStringParameters?.code;
      
      if (teamCode) {
        // Find team by code
        const storeUrl = `${NETLIFY_BLOBS_API}/${SITE_ID}/teams`;
        const response = await fetch(storeUrl, {
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        
        if (!response.ok) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Team not found' })
          };
        }
        
        const storeData = await response.json();
        const blobs = storeData.blobs || [];
        
        for (const blob of blobs) {
          const blobUrl = `${NETLIFY_BLOBS_API}/${SITE_ID}/teams/${blob.key}`;
          const blobResponse = await fetch(blobUrl, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
          });
          
          if (blobResponse.ok) {
            const teamData = JSON.parse(await blobResponse.text());
            if (teamData.code === teamCode) {
              return {
                statusCode: 200,
                body: JSON.stringify({ team: teamData })
              };
            }
          }
        }
        
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Team not found' })
        };
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Teams function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
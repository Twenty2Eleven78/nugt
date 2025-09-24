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
    let userId, userEmail;
    
    try {
      // Our token is now base64 encoded as userId:email:timestamp
      const decoded = Buffer.from(token, 'base64').toString('binary').split(':');
      userId = decoded[0];
      userEmail = decoded[1];
      const timestamp = decoded[2];
      
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

    // Helper function to check if user is admin
    const isAdminUser = (userId, userEmail) => {
  
      // Get admin identifiers from environment variables
      const adminEmails = process.env.ADMIN_EMAILS ? 
        process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase()) : 
        [];
      
      const adminUserIds = process.env.ADMIN_USER_IDS ? 
        process.env.ADMIN_USER_IDS.split(',').map(id => id.trim()) : 
        [];
      
      // SECURITY: If no admin emails/IDs are configured, deny access
      if (adminEmails.length === 0 && adminUserIds.length === 0) {
        console.log('Admin access denied: No admin configuration found');
        return false;
      }
  
      // Check if userEmail matches any admin email OR userId matches any admin user ID
      const isAdminByEmail = adminEmails.length > 0 && adminEmails.includes(userEmail.toLowerCase());
      const isAdminByUserId = adminUserIds.length > 0 && adminUserIds.includes(userId);
      const isAdmin = isAdminByEmail || isAdminByUserId;
  
      console.log('Admin check results:', {
        isAdminByEmail,
        isAdminByUserId,
        finalResult: isAdmin
      });
      console.log('Admin access:', isAdmin ? '✅ GRANTED' : '❌ DENIED');
      console.log('=== ADMIN CHECK END ===');
      return isAdmin;
};

    if (event.httpMethod === 'GET') {
      const isAdmin = event.queryStringParameters?.admin === 'true';
      const checkAdmin = event.queryStringParameters?.checkAdmin === 'true';

      // Handle admin status check
      if (checkAdmin) {
        console.log('=== ADMIN STATUS CHECK REQUEST ===');
        const adminStatus = isAdminUser(userId, userEmail);
        
        const response = {
          isAdmin: adminStatus,
          userId: userId,
          userEmail: userEmail,
          debug: {
            hasAdminEmails: !!process.env.ADMIN_EMAILS,
            hasAdminUserIds: !!process.env.ADMIN_USER_IDS,
            timestamp: new Date().toISOString()
          }
        };
        
        console.log('Admin check response:', response);
        console.log('=== ADMIN STATUS CHECK COMPLETE ===');
        
        return {
          statusCode: 200,
          body: JSON.stringify(response)
        };
      }

      const isStatsRequest = event.queryStringParameters?.statistics === 'true';
      if (isStatsRequest) {
        console.log('=== STATISTICS REQUEST STARTED ===');
        try {
          const statsKey = 'statistics/stats.json';
          const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${statsKey}`;
          const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });

          if (!res.ok) {
            if (res.status === 404) {
              return { statusCode: 200, body: JSON.stringify({ message: 'No statistics found', data: null }) };
            }
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to retrieve statistics' }) };
          }

          const data = await res.text();
          const stats = data ? JSON.parse(data) : null;
          console.log('=== STATISTICS REQUEST COMPLETED ===');
          return { statusCode: 200, body: JSON.stringify({ message: 'Statistics retrieved successfully', data: stats }) };
        } catch (error) {
          console.error('=== STATISTICS ERROR ===:', error);
          return { statusCode: 500, body: JSON.stringify({ error: 'Failed to retrieve statistics' }) };
        }
      }

      if (isAdmin) {
        // Verify admin permissions
        if (!isAdminUser(userId, userEmail)) {
          return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Insufficient permissions for admin access' })
          };
        }

        // Admin request to get all matches
        console.log('=== ADMIN REQUEST STARTED ===');
        console.log('User ID from token:', userId);
        console.log('User Email from token:', userEmail);
        console.log('Site ID:', SITE_ID);
        console.log('Access token exists:', !!ACCESS_TOKEN);
        
        try {
          // Check if required environment variables are set
          if (!SITE_ID || !ACCESS_TOKEN) {
            console.error('Missing required environment variables:', {
              SITE_ID: !!SITE_ID,
              ACCESS_TOKEN: !!ACCESS_TOKEN
            });
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: 'Server configuration error',
                debug: {
                  missingSiteId: !SITE_ID,
                  missingAccessToken: !ACCESS_TOKEN
                }
              })
            };
          }

          // Try different store query approaches
          const storeUrl = `${NETLIFY_BLOBS_API}/${SITE_ID}/user-data`;
          console.log('Querying store directly:', storeUrl);
          console.log('Full API URL breakdown:', {
            baseApi: NETLIFY_BLOBS_API,
            siteId: SITE_ID,
            store: 'user-data',
            fullUrl: storeUrl
          });
          
          const res = await fetch(storeUrl, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
          });

          console.log('Store response status:', res.status);
          console.log('Store response headers:', Object.fromEntries(res.headers.entries()));

          if (!res.ok) {
            console.error('Failed to query store:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('Store error response:', errorText);
            
            // Try alternative approach - list all stores first
            console.log('Trying alternative approach - listing all stores...');
            const allStoresUrl = `${NETLIFY_BLOBS_API}/${SITE_ID}`;
            const storesRes = await fetch(allStoresUrl, {
              headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            
            if (storesRes.ok) {
              const storesData = await storesRes.json();
              console.log('Available stores:', storesData);
            }
            
            return { 
              statusCode: 500,
              body: JSON.stringify({ 
                error: 'Failed to retrieve data from store',
                debug: {
                  siteId: SITE_ID,
                  hasToken: !!ACCESS_TOKEN,
                  storeUrl,
                  responseStatus: res.status,
                  responseText: errorText
                }
              })
            };
          }

          const storeData = await res.json();
          console.log('Store response data structure:', {
            hasBlobs: !!storeData.blobs,
            blobsType: typeof storeData.blobs,
            blobsLength: storeData.blobs?.length,
            storeDataKeys: Object.keys(storeData)
          });
          
          const blobs = storeData.blobs || [];
          console.log('Total blobs found in store:', blobs.length);
          
          if (blobs.length > 0) {
            console.log('All blob keys:', blobs.map(b => b.key));
            console.log('Sample blob structure:', blobs[0]);
          } else {
            console.log('No blobs found in store. Full store data:', storeData);
          }
          
          // Filter blobs that contain match data - be more inclusive
          const matchBlobs = blobs.filter(blob => {
            const key = blob.key || '';
            const isMatchFile = key.includes('matches.json') || 
                               key.includes('/matches') ||
                               key.endsWith('.json') ||
                               key.includes('user-data/') ||
                               key.match(/user_.*\/matches/);
            console.log(`Blob "${key}": isMatchFile=${isMatchFile}`);
            return isMatchFile;
          });
          
          console.log('Match blobs after filtering:', matchBlobs.length);
          if (matchBlobs.length > 0) {
            console.log('Match blob keys:', matchBlobs.map(b => b.key));
          } else {
            console.log('No match blobs found after filtering. This might indicate:');
            console.log('1. No match data has been saved yet');
            console.log('2. Different blob key structure than expected');
            console.log('3. Data is stored in a different store name');
          }
          
          const allMatches = [];
          let processedCount = 0;
          let errorCount = 0;

          for (const blob of matchBlobs) {
            console.log(`Processing blob: ${blob.key}`);
            
            try {
              const blobUrl = `${NETLIFY_BLOBS_API}/${SITE_ID}/user-data/${blob.key}`;
              console.log(`Fetching blob from: ${blobUrl}`);
              
              const blobRes = await fetch(blobUrl, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
              });
              
              console.log(`Blob fetch status for ${blob.key}:`, blobRes.status);
              
              if (blobRes.ok) {
                const data = await blobRes.text();
                processedCount++;
                
                console.log(`Data length for ${blob.key}:`, data?.length);
                console.log(`First 200 chars:`, data?.substring(0, 200));
                
                if (data && data.trim()) {
                  try {
                    const matches = JSON.parse(data);
                    const matchArray = Array.isArray(matches) ? matches : [matches];
                    
                    // Extract userId from the blob key
                    const keyParts = blob.key.split('/');
                    let extractedUserId = 'unknown';
                    
                    // Handle different key formats
                    if (keyParts.length >= 2) {
                      extractedUserId = keyParts[0]; // First part should be userId
                    } else {
                      extractedUserId = blob.key.replace(/\.json$/, '').replace(/\/.*$/, '');
                    }
                    
                    console.log(`Extracted userId: ${extractedUserId} from key: ${blob.key}`);
                    
                    // Add userId and other metadata to each match
                    const matchesWithUserId = matchArray.map((match, index) => ({
                      ...match,
                      userId: extractedUserId,
                      blobKey: blob.key,
                      matchIndex: index, // Add index for deletion
                      id: `${extractedUserId}_${index}_${match.savedAt || Date.now()}` // Unique ID
                    }));
                    
                    allMatches.push(...matchesWithUserId);
                    console.log(`Added ${matchesWithUserId.length} matches for user ${extractedUserId}`);
                  } catch (parseError) {
                    console.error('Error parsing matches for blob:', blob.key, parseError);
                    console.error('Raw data:', data);
                    errorCount++;
                  }
                } else {
                  console.log('Empty or whitespace-only data for blob:', blob.key);
                }
              } else {
                console.error('Failed to fetch blob:', blob.key, blobRes.status, blobRes.statusText);
                const errorText = await blobRes.text();
                console.error('Blob fetch error response:', errorText);
                errorCount++;
              }
            } catch (fetchError) {
              console.error('Error fetching blob:', blob.key, fetchError);
              errorCount++;
            }
          }

          console.log(`=== ADMIN QUERY COMPLETED ===`);
          console.log(`Processed: ${processedCount}, Errors: ${errorCount}, Total matches: ${allMatches.length}`);

          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'All matches retrieved successfully',
              data: allMatches,
              meta: {
                totalBlobs: blobs.length,
                matchBlobs: matchBlobs.length,
                processedBlobs: processedCount,
                errors: errorCount,
                totalMatches: allMatches.length,
                debug: {
                  siteId: SITE_ID,
                  hasToken: !!ACCESS_TOKEN,
                  userId: userId,
                  storeUrl
                }
              }
            })
          };
        } catch (error) {
          console.error('=== ADMIN ERROR ===:', error);
          console.error('Error stack:', error.stack);
          return { 
            statusCode: 500, 
            body: JSON.stringify({ 
              error: 'Failed to retrieve all data',
              details: error.message,
              stack: error.stack
            })
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
        // Add timestamp if not present
        if (!newMatch.savedAt) {
          newMatch.savedAt = Date.now();
        }
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

    if (event.httpMethod === 'DELETE') {
      try {
        const queryParams = event.queryStringParameters || {};
        const targetUserId = queryParams.userId;
        const matchIndex = parseInt(queryParams.matchIndex);

      // Check if current user is admin or deleting their own data
        if (!isAdminUser(userId, userEmail) && userId !== targetUserId) {
          return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Insufficient permissions to delete this match' })
          };
        }

        if (!targetUserId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId parameter is required for deletion' })
          };
        }

        // Build the key for the target user's matches
        const targetKey = `user-data/${targetUserId}/matches.json`;
        const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${targetKey}`;
        
        // Get existing matches
        const getRes = await fetch(url, {
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        
        if (!getRes.ok) {
          if (getRes.status === 404) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'No matches found for this user' })
            };
          }
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to retrieve user matches' })
          };
        }
        
        const existingData = await getRes.text();
        let matches = [];
        
        try {
          const parsed = JSON.parse(existingData);
          matches = Array.isArray(parsed) ? parsed : [parsed];
        } catch (parseError) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Invalid data format' })
          };
        }

        // Handle different deletion scenarios
        if (!isNaN(matchIndex) && matchIndex >= 0) {
          // Delete specific match by index
          if (matchIndex >= matches.length) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'Match index not found' })
            };
          }
          
          const deletedMatch = matches.splice(matchIndex, 1)[0];
          
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
              body: JSON.stringify({ error: 'Failed to save updated matches' })
            };
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify({ 
              message: 'Match deleted successfully',
              deletedMatch: deletedMatch,
              remainingMatches: matches.length
            })
          };
        } else {
          // Delete all matches for the user
          const deleteRes = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
          });
          
          if (!deleteRes.ok && deleteRes.status !== 404) {
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to delete user matches' })
            };
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify({ 
              message: 'All matches deleted successfully for user',
              deletedCount: matches.length,
              userId: targetUserId
            })
          };
        }
      } catch (error) {
        console.error('Error deleting data:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to delete data' })
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
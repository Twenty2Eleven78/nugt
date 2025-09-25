const NETLIFY_BLOBS_API = 'https://api.netlify.com/api/v1/blobs';
const SITE_ID = process.env.NETLIFY_SITE_ID;
const ACCESS_TOKEN = process.env.NETLIFY_API_TOKEN;

const STATS_KEY = 'statistics/stats.json';

// Helper function to check for admin privileges
const isAdminUser = (context) => {
  const clientContext = context.clientContext;
  if (!clientContext || !clientContext.user) {
    return false;
  }
  const user = clientContext.user;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  return adminEmails.includes(user.email);
};

exports.handler = async function(event, context) {
  if (!SITE_ID || !ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error.' })
    };
  }

  const storeUrl = `${NETLIFY_BLOBS_API}/${SITE_ID}`;

  switch (event.httpMethod) {
    case 'GET':
      try {
        const res = await fetch(`${storeUrl}/${STATS_KEY}`, {
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        if (res.status === 404) {
          return { statusCode: 200, body: JSON.stringify(null) };
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch stats: ${res.statusText}`);
        }
        const data = await res.json();
        return { statusCode: 200, body: JSON.stringify(data) };
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }

    case 'PUT':
      if (!isAdminUser(context)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Permission denied.' }) };
      }
      try {
        const statsData = JSON.parse(event.body);
        await fetch(`${storeUrl}/${STATS_KEY}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(statsData)
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Statistics saved.' }) };
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }

    case 'DELETE':
      if (!isAdminUser(context)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Permission denied.' }) };
      }
      try {
        await fetch(`${storeUrl}/${STATS_KEY}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Statistics deleted.' }) };
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
  }
};
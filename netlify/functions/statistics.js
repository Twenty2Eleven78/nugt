const NETLIFY_BLOBS_API = 'https://api.netlify.com/api/v1/blobs';
const SITE_ID = process.env.NETLIFY_SITE_ID;
const ACCESS_TOKEN = process.env.NETLIFY_API_TOKEN;

const STATS_KEY = 'statistics/stats.json';

// Helper to decode token and check for admin privileges
const getAdminStatus = (event) => {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'Missing or invalid authorization token', isAdmin: false };
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = Buffer.from(token, 'base64').toString('binary').split(':');
        const userId = decoded[0];
        const userEmail = decoded[1];
        const timestamp = decoded[2];

        if (!userId || !userEmail || !timestamp) {
            return { error: 'Invalid token format', isAdmin: false };
        }

        if (Date.now() - Number(timestamp) > 24 * 60 * 60 * 1000) {
            return { error: 'Token expired', isAdmin: false };
        }

        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        const adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim());

        const isAdmin = adminEmails.includes(userEmail.toLowerCase()) || adminUserIds.includes(userId);
        return { isAdmin, userId, userEmail };
    } catch (error) {
        return { error: 'Token decoding failed', isAdmin: false };
    }
};

exports.handler = async function(event, context) {
  if (!SITE_ID || !ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error.' })
    };
  }

  const { isAdmin, error } = getAdminStatus(event);
  if (error && (event.httpMethod === 'PUT' || event.httpMethod === 'DELETE')) {
      return { statusCode: 401, body: JSON.stringify({ error }) };
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
      if (!isAdmin) {
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
      if (!isAdmin) {
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
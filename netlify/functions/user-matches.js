const fetch = require('node-fetch');

const NETLIFY_BLOBS_API = 'https://api.netlify.com/api/v1/blobs';
const SITE_ID = process.env.NETLIFY_SITE_ID; // Set in Netlify environment variables
const ACCESS_TOKEN = process.env.NETLIFY_API_TOKEN; // Set in Netlify environment variables

exports.handler = async function(event, context) {
  // Only allow authenticated users
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Not authenticated' })
    };
  }

  const userId = user.sub || user.email || user.id;
  const key = `user-data/${userId}/matches.json`;

  if (event.httpMethod === 'GET') {
    // Retrieve user data
    const url = `${NETLIFY_BLOBS_API}/${SITE_ID}/${key}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    if (!res.ok) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No data found' }) };
    }
    const data = await res.text();
    return { statusCode: 200, body: data };
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
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
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save data' }) };
    }
    const data = await res.text();
    return { statusCode: 200, body: data };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

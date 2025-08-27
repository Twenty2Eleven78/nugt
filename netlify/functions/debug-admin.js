// Debug endpoint to check admin configuration
// This should be removed in production!

exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Basic security check - only allow in development
  const isDevelopment = process.env.NODE_ENV !== 'production' && 
                       process.env.CONTEXT !== 'production';

  if (!isDevelopment) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Debug endpoint disabled in production' })
    };
  }

  try {
    const adminEmails = process.env.ADMIN_EMAILS || '';
    const adminUserIds = process.env.ADMIN_USER_IDS || '';
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Admin configuration debug info',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          CONTEXT: process.env.CONTEXT,
          hasAdminEmails: !!process.env.ADMIN_EMAILS,
          hasAdminUserIds: !!process.env.ADMIN_USER_IDS,
          adminEmailsLength: adminEmails.split(',').filter(e => e.trim()).length,
          adminUserIdsLength: adminUserIds.split(',').filter(id => id.trim()).length
        },
        // Only show first character of emails for security
        adminEmailsPreview: adminEmails ? 
          adminEmails.split(',').map(email => email.trim().charAt(0) + '***') : [],
        adminUserIdsPreview: adminUserIds ? 
          adminUserIds.split(',').map(id => id.trim().substring(0, 10) + '***') : [],
        instructions: [
          '1. Set ADMIN_EMAILS in Netlify environment variables',
          '2. Set ADMIN_USER_IDS in Netlify environment variables', 
          '3. Redeploy the site',
          '4. Remove this debug endpoint in production'
        ]
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Debug endpoint error',
        message: error.message 
      })
    };
  }
};
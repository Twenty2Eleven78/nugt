# Testing Instructions for Admin Dashboard

## Quick Console Test

### Method 1: Simple Copy-Paste Test (RECOMMENDED)
1. **Sign in to your app first**
2. **Refresh the page** and wait 2-3 seconds for services to load
3. Open your browser console (F12)
4. Copy and paste the entire contents of `simple-admin-test.js` into the console
5. Press Enter to run the test

### Method 2: Using Global Services (after page load)
1. Refresh the page and wait for it to fully load
2. Open browser console (F12)
3. Check if services are available:
   ```javascript
   console.log('Auth Service:', typeof window.authService);
   console.log('API Service:', typeof window.userMatchesApi);
   ```
4. If they show as 'object', run the test file:
   ```javascript
   // Load and run the test
   fetch('./test-match-data.js')
     .then(r => r.text())
     .then(code => eval(code));
   ```

### Method 3: Manual Testing
```javascript
// Check current user
window.authService.getCurrentUser()

// Check admin status
await window.authService.isAdmin()

// Load user matches
await window.userMatchesApi.loadMatchData()

// Load all matches (admin only)
await window.userMatchesApi.loadAllMatchData()
```

## Expected Results

### If Admin Dashboard is Working:
- ✅ Current user shows your email
- ✅ Admin status returns `true`
- ✅ User matches shows your saved matches
- ✅ Admin matches shows all users' matches

### If No Matches Show:
- Check Netlify environment variables:
  - `NETLIFY_SITE_ID`
  - `NETLIFY_API_TOKEN`
  - `ADMIN_EMAILS`
  - `ADMIN_USER_IDS`
- Try saving a test match first
- Check Netlify function logs for errors

## Troubleshooting

### "Required services not available"
- **Refresh the page** and wait 2-3 seconds for services to load
- Services are exposed globally only on localhost and netlify.app domains
- Make sure you're signed in first
- Try the simple test in `simple-admin-test.js`

### "User is not admin"
- Check that your email is in `ADMIN_EMAILS` environment variable
- Check that your user ID is in `ADMIN_USER_IDS` environment variable
- Redeploy after setting environment variables

### "No matches found"
- This is normal if no users have saved matches yet
- Try saving a test match first
- Check Netlify function logs for blob store errors

## Environment Variables Checklist

In Netlify Dashboard → Site Settings → Environment Variables:

```
NETLIFY_SITE_ID=your-site-id
NETLIFY_API_TOKEN=your-api-token-with-blob-access
ADMIN_EMAILS=your-email@example.com
ADMIN_USER_IDS=user_youremail_example_com
```

After setting these, trigger a new deployment for changes to take effect.
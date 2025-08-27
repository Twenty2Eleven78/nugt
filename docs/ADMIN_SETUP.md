# Admin Dashboard Setup Guide

## Configuration Steps

### 1. Configure Netlify Environment Variables (SECURE METHOD)

**CRITICAL**: You MUST set these environment variables or NO ONE will have admin access.

#### Step-by-Step Setup:

1. **Go to Netlify Dashboard**
   - Log into your Netlify account
   - Select your site
   - Go to Site Settings > Environment Variables

2. **Add Admin Configuration**
   ```
   ADMIN_EMAILS=your-actual-email@example.com,coach@netherton.com
   ADMIN_USER_IDS=user_youremail_example_com,user_coach_netherton_com
   ```

3. **Example Configuration**
   If your email is `john@example.com`, set:
   ```
   ADMIN_EMAILS=john@example.com
   ADMIN_USER_IDS=user_john_example_com
   ```

4. **Deploy Changes**
   - Save the environment variables
   - Trigger a new deployment (or wait for next deployment)

## ✅ Setup Complete!

Your admin dashboard is now working securely with the following features:

### **Security Features**
- 🔒 **No admin emails in client code** - All admin verification happens server-side
- 🛡️ **Environment variable protection** - Admin access controlled by secure server variables
- 🔐 **Token-based authentication** - Secure API calls with proper authorization

### **Admin Dashboard Features**
- 📊 **View all matches** from all users across devices
- 🗑️ **Delete matches** with proper confirmation
- 🔄 **Transfer matches** between users
- 📈 **Statistics overview** showing total matches, users, and activity
- 🔍 **Search and filter** functionality

### **Cross-Device Sync**
- ✅ **Consistent user IDs** - Users can access their data from any device
- ✅ **Email-based identification** - User IDs generated consistently from email addresses
- ✅ **Automatic migration** - Existing users automatically upgraded to new system

## Quick Test (Optional)

If you ever need to test the admin functionality, you can run this in browser console:

```javascript
// Quick admin test
(async () => {
    const user = window.authService?.getCurrentUser();
    const isAdmin = await window.authService?.isAdmin();
    const matches = await window.userMatchesApi?.loadAllMatchData();
    console.log('User:', user?.email, '| Admin:', isAdmin, '| Matches:', matches?.length || 0);
})();
```

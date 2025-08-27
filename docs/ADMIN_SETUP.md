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

5. **Deploy Changes**
   - Save the environment variables
   - Trigger a new deployment (or wait for next deployment)

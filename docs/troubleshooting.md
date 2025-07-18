# Authentication Troubleshooting Guide

## Common Issues and Solutions

### Registration Button Not Working

If clicking the "Register with Passkey" button doesn't do anything:

1. **Check Browser Console**: Open your browser's developer tools (F12) and check for errors in the console.
2. **Browser Compatibility**: Make sure you're using a modern browser that supports WebAuthn (Chrome, Edge, Firefox, Safari).
3. **HTTPS Requirement**: WebAuthn requires a secure context (HTTPS) except on localhost. If you're testing on a non-secure connection, the fallback authentication will be used instead.
4. **Device Support**: Make sure your device has the necessary hardware for passkeys (biometric sensors, TPM, etc.).

### Login Button Not Working

If clicking the "Sign in with Passkey" button doesn't do anything:

1. **Check Registration**: Make sure you've registered a passkey first.
2. **Browser Storage**: Check if your browser's localStorage is enabled and not in private/incognito mode.
3. **Different Browser**: If you registered in a different browser, you'll need to register again in the current browser.

### Authentication Modal Not Showing

If the authentication modal doesn't appear:

1. **Bootstrap Loading**: Make sure Bootstrap JavaScript is properly loaded.
2. **DOM Ready**: The modal might be trying to show before the DOM is fully loaded.
3. **Manual Trigger**: Try clicking the user profile button in the header to show the modal.

### WebAuthn Not Supported

If you see a warning about WebAuthn not being supported:

1. **Browser Support**: Your browser might not support WebAuthn. Try using a more recent version of Chrome, Edge, Firefox, or Safari.
2. **Secure Context**: WebAuthn requires HTTPS except on localhost.
3. **Fallback Authentication**: The app will use a simplified authentication method instead.

## Resetting Authentication

If you need to reset your authentication:

1. Open your browser's developer tools (F12)
2. Go to the "Application" tab (Chrome/Edge) or "Storage" tab (Firefox)
3. Select "Local Storage" in the left panel
4. Find and delete the following keys:
   - `nugt_user_id`
   - `nugt_username`
   - `nugt_credential_id`
   - `nugt_is_authenticated`
   - `nugt_auth_timestamp`
   - `nugt_usage_stats`
5. Refresh the page

## Browser Support

- **Chrome/Edge**: Version 67+ (Windows, macOS, Android)
- **Firefox**: Version 60+ (Windows, macOS, Android)
- **Safari**: Version 13+ (macOS, iOS)

## Contact Support

If you continue to experience issues with the authentication system, please contact support with the following information:

1. Browser name and version
2. Operating system
3. Any error messages from the browser console
4. Steps to reproduce the issue
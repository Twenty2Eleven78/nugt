# GameTime Troubleshooting Guide

## Team Configuration Issues

### Configuration File Not Loading

**Problem**: Your team configuration isn't being applied, and the app shows default Netherton United branding.

**Solutions**:
1. **Check File Location**: Ensure `team-config.json` is in the root directory of your application
2. **Verify File Name**: The file must be named exactly `team-config.json` (case-sensitive)
3. **Check JSON Syntax**: Use a JSON validator to ensure your configuration file has valid JSON syntax
4. **Browser Console**: Open developer tools (F12) and check the console for configuration loading errors
5. **File Permissions**: Ensure the web server can read the configuration file

### Team Name Not Updating

**Problem**: Your team name appears as "Netherton United" instead of your configured team name.

**Solutions**:
1. **Check Configuration**: Verify `team.name` is set correctly in your `team-config.json`
2. **Clear Cache**: Clear your browser cache and refresh the page
3. **Check Storage Keys**: If you changed `storage.keyPrefix`, existing data might use old keys
4. **Restart Application**: Close and reopen your browser tab

### Logo Not Displaying

**Problem**: Your team logo doesn't appear, or shows a broken image icon.

**Solutions**:
1. **Check File Path**: Verify the path in `branding.logoUrl` matches your actual file location
2. **File Format**: Ensure your logo is in a supported format (PNG, JPG, SVG)
3. **File Size**: Large images may load slowly; try optimizing your logo file
4. **Relative Paths**: Use relative paths like `./assets/logo.png` instead of absolute paths
5. **CORS Issues**: If using external URLs, ensure they allow cross-origin requests

### Colors Not Applying

**Problem**: Your team colors aren't being applied to the application theme.

**Solutions**:
1. **Hex Format**: Ensure colors are in hex format (e.g., "#dc3545", not "red")
2. **Valid Colors**: Use valid 6-digit hex codes with the # symbol
3. **CSS Cache**: Clear browser cache to ensure new styles are loaded
4. **Check Configuration**: Verify `branding.primaryColor` and `branding.secondaryColor` are set correctly

### PWA Not Working

**Problem**: The Progressive Web App features aren't working with your team configuration.

**Solutions**:
1. **HTTPS Required**: PWA features require HTTPS (except on localhost)
2. **Manifest Generation**: Check that `pwa` section is configured in your team config
3. **Icon Sizes**: Ensure your app icon is 512x512 pixels for best PWA support
4. **Browser Support**: Some browsers have limited PWA support
5. **Service Worker**: Check browser console for service worker registration errors

### League Table Integration Issues

**Problem**: League table integration isn't working or shows errors.

**Solutions**:
1. **URL Accessibility**: Test your league table URL directly in a browser
2. **CORS Proxies**: Try different CORS proxy services from the configured list
3. **URL Format**: Ensure the league table URL returns data in the expected format
4. **Network Issues**: Check your internet connection and firewall settings
5. **Disable Integration**: Set `integrations.leagueTable.enabled` to `false` if not needed

### Storage Conflicts

**Problem**: Data from different teams is mixing, or old data is interfering.

**Solutions**:
1. **Unique Prefixes**: Ensure each team has a unique `storage.keyPrefix`
2. **Clear Storage**: Clear browser localStorage to remove conflicting data
3. **Migration**: Use the configuration UI to migrate existing data to new prefixes
4. **Separate Deployments**: Consider separate deployments for different teams

### Configuration Validation Errors

**Problem**: The application shows configuration validation errors.

**Solutions**:
1. **Required Fields**: Ensure all required fields are present (team.name, team.abbreviation, storage.keyPrefix)
2. **Field Types**: Check that boolean fields use `true`/`false`, not strings
3. **Array Format**: Ensure arrays are properly formatted with square brackets
4. **String Length**: Check that team names and abbreviations meet length requirements
5. **Special Characters**: Avoid special characters in storage prefixes

## Configuration FAQ

### Q: Can I use the same configuration for multiple teams?
**A**: Each team should have its own unique configuration, especially the `storage.keyPrefix` to avoid data conflicts.

### Q: What happens if my configuration file is invalid?
**A**: The application will use default values and show error messages in the browser console. The app will still function with Netherton United defaults.

### Q: Can I change configuration while the app is running?
**A**: Yes, if you're an admin, you can use the configuration management UI. Changes are applied immediately without restarting.

### Q: Do I need all sections in the configuration file?
**A**: No, only `team.name`, `team.abbreviation`, and `storage.keyPrefix` are required. Other sections will use defaults if not provided.

### Q: Can I use external URLs for logos and icons?
**A**: Yes, but ensure they support CORS and are accessible from your domain. Local files are recommended for better performance.

### Q: How do I backup my configuration?
**A**: Use the configuration export feature in the admin UI, or simply copy your `team-config.json` file.

### Q: Can I have different configurations for different environments?
**A**: Yes, you can have different `team-config.json` files for development, staging, and production deployments.

### Q: What's the difference between team.name and team.shortName?
**A**: `team.name` is the full name displayed in headers and titles. `team.shortName` is used in compact displays where space is limited.

### Q: How do I migrate from the old hardcoded setup?
**A**: Create a `team-config.json` with your team details. The app will automatically use the new configuration and maintain compatibility with existing match data.

### Q: Can I disable certain features through configuration?
**A**: Yes, you can disable integrations by setting their `enabled` property to `false`. Some UI elements will be hidden when features are disabled.

## Getting Help

If you're still experiencing issues:

1. **Check Browser Console**: Look for error messages in the developer tools console
2. **Validate Configuration**: Use the validation examples in the documentation
3. **Test with Minimal Config**: Try using the minimal configuration example to isolate issues
4. **Review Examples**: Compare your configuration with the provided examples
5. **Check File Permissions**: Ensure your web server can serve the configuration file

---

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
   - `nugt_email`
   - `nugt_display_name`
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
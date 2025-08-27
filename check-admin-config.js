// Admin Configuration Checker
// Run this in browser console to test admin setup

async function checkAdminConfiguration() {
    console.log('=== ADMIN CONFIGURATION CHECK ===');
    
    // Check if user is authenticated
    if (typeof authService === 'undefined') {
        console.log('❌ authService not available');
        return;
    }
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        console.log('❌ No user signed in. Please sign in first.');
        return;
    }
    
    console.log('✅ Current user:', currentUser.email);
    console.log('✅ User ID:', currentUser.id);
    
    // Test admin check API
    try {
        console.log('\n--- Testing Admin Check API ---');
        const token = await authService.getAuthToken();
        
        const response = await fetch('/.netlify/functions/user-matches?checkAdmin=true', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Admin API Response:', result);
            
            if (result.isAdmin) {
                console.log('🎉 USER IS ADMIN');
            } else {
                console.log('❌ USER IS NOT ADMIN');
            }
            
            // Check debug info
            if (result.debug) {
                console.log('\n--- Environment Configuration ---');
                console.log('Admin emails configured:', result.debug.hasAdminEmails ? '✅' : '❌');
                console.log('Admin user IDs configured:', result.debug.hasAdminUserIds ? '✅' : '❌');
                
                if (!result.debug.hasAdminEmails && !result.debug.hasAdminUserIds) {
                    console.log('\n🚨 CONFIGURATION ISSUE:');
                    console.log('No admin configuration found in environment variables.');
                    console.log('Please set ADMIN_EMAILS and/or ADMIN_USER_IDS in Netlify.');
                }
            }
        } else {
            console.log('❌ Admin API Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Admin check failed:', error.message);
    }
    
    console.log('\n=== CONFIGURATION GUIDE ===');
    console.log('To set up admin access:');
    console.log('1. Go to Netlify Dashboard > Site Settings > Environment Variables');
    console.log('2. Add ADMIN_EMAILS with your admin email(s):');
    console.log(`   ADMIN_EMAILS=${currentUser.email}`);
    console.log('3. Add ADMIN_USER_IDS with your user ID(s):');
    console.log(`   ADMIN_USER_IDS=${currentUser.id}`);
    console.log('4. Redeploy your site or wait for the next deployment');
    console.log('\n=== CHECK COMPLETE ===');
}

// Auto-run the check
checkAdminConfiguration();
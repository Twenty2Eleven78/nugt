// Simple Admin Test - Copy and paste this into browser console
// Make sure you're signed in first!

(async function() {
    console.log('🔍 SIMPLE ADMIN TEST');
    
    // Wait a moment for services to be available
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if services are available
    if (!window.authService) {
        console.log('❌ authService not available. Try refreshing the page and waiting a moment.');
        return;
    }
    
    if (!window.userMatchesApi) {
        console.log('❌ userMatchesApi not available. Try refreshing the page and waiting a moment.');
        return;
    }
    
    console.log('✅ Services found');
    
    // Check current user
    const user = window.authService.getCurrentUser();
    if (!user) {
        console.log('❌ Not signed in. Please sign in first.');
        return;
    }
    
    console.log('✅ Signed in as:', user.email);
    console.log('✅ User ID:', user.id);
    
    // Check admin status
    try {
        const isAdmin = await window.authService.isAdmin();
        console.log('🔑 Admin status:', isAdmin ? 'YES' : 'NO');
        
        if (!isAdmin) {
            console.log('❌ Not an admin. Check environment variables:');
            console.log('   ADMIN_EMAILS should include:', user.email);
            console.log('   ADMIN_USER_IDS should include:', user.id);
            return;
        }
        
        // Test loading matches
        console.log('📊 Loading admin data...');
        const matches = await window.userMatchesApi.loadAllMatchData();
        
        console.log('📈 Results:');
        console.log('   Total matches:', matches?.length || 0);
        
        if (matches && matches.length > 0) {
            const users = [...new Set(matches.map(m => m.userEmail || m.userId))];
            console.log('   Users with data:', users.length);
            console.log('   Sample match:', matches[0]);
        } else {
            console.log('⚠️  No matches found. This could mean:');
            console.log('   1. No users have saved matches yet');
            console.log('   2. Environment variables missing (NETLIFY_SITE_ID, NETLIFY_API_TOKEN)');
            console.log('   3. Blob store access issues');
            
            // Try saving a test match
            console.log('💾 Trying to save a test match...');
            try {
                await window.userMatchesApi.saveMatchData({
                    title: 'Test Match',
                    team1Name: 'Team A',
                    team2Name: 'Team B',
                    savedAt: Date.now()
                });
                console.log('✅ Test match saved! Try running this test again.');
            } catch (saveError) {
                console.log('❌ Could not save test match:', saveError.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('🏁 Test complete');
})();
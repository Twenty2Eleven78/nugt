// Simple console test - copy and paste this entire code block into browser console

(async function testAdminAccess() {
    console.log('=== ADMIN ACCESS TEST ===');
    
    try {
        // Import services dynamically
        const { authService } = await import('./js/modules/services/auth.js');
        const { userMatchesApi } = await import('./js/modules/services/user-matches-api.js');
        
        console.log('✅ Services loaded');
        
        // Check current user
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            console.log('❌ No user signed in. Please sign in first.');
            return;
        }
        
        console.log('✅ Current user:', currentUser.email);
        console.log('✅ User ID:', currentUser.id);
        
        // Check admin status
        const isAdmin = await authService.isAdmin();
        console.log('Admin status:', isAdmin ? '✅ IS ADMIN' : '❌ NOT ADMIN');
        
        if (!isAdmin) {
            console.log('❌ User is not admin - cannot test admin data access');
            return;
        }
        
        // Test user matches
        console.log('\n--- Testing User Matches ---');
        const userMatches = await userMatchesApi.loadMatchData();
        console.log('User matches found:', userMatches?.length || 0);
        
        // Test admin matches
        console.log('\n--- Testing Admin Matches ---');
        const adminMatches = await userMatchesApi.loadAllMatchData();
        console.log('Admin matches found:', adminMatches?.length || 0);
        
        if (adminMatches?.length > 0) {
            console.log('✅ Sample match:', adminMatches[0]);
            const uniqueUsers = new Set(adminMatches.map(m => m.userEmail || m.userId));
            console.log('✅ Unique users:', Array.from(uniqueUsers));
        } else {
            console.log('⚠️ No matches found in admin view');
            console.log('This could mean:');
            console.log('1. No users have saved matches yet');
            console.log('2. Blob store configuration issue');
            console.log('3. Environment variables not set correctly');
            
            // Test saving a match
            console.log('\n--- Testing Match Save ---');
            const testMatch = {
                title: 'Console Test Match',
                team1Name: 'Test Team A',
                team2Name: 'Test Team B',
                savedAt: Date.now(),
                isTestData: true
            };
            
            try {
                await userMatchesApi.saveMatchData(testMatch);
                console.log('✅ Test match saved successfully');
                
                // Try loading again
                const newUserMatches = await userMatchesApi.loadMatchData();
                console.log('✅ User matches after save:', newUserMatches?.length || 0);
                
            } catch (saveError) {
                console.log('❌ Error saving test match:', saveError.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('Full error:', error);
    }
    
    console.log('\n=== TEST COMPLETE ===');
})();
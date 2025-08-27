// Test script to check if match data exists and admin can access it
// Run this in browser console after signing in as admin

async function testMatchDataAccess() {
    console.log('=== MATCH DATA ACCESS TEST ===');
    
    // Try to get services from global scope first, then import dynamically
    let authService, userMatchesApi;
    
    if (window.authService && window.userMatchesApi) {
        authService = window.authService;
        userMatchesApi = window.userMatchesApi;
        console.log('✅ Services found in global scope');
    } else {
        try {
            console.log('Services not in global scope, importing dynamically...');
            const authModule = await import('./js/modules/services/auth.js');
            const apiModule = await import('./js/modules/services/user-matches-api.js');
            
            authService = authModule.authService;
            userMatchesApi = apiModule.userMatchesApi;
            
            console.log('✅ Services loaded via dynamic import');
        } catch (error) {
            console.log('❌ Error loading services:', error.message);
            console.log('Make sure you are running this from the correct domain/localhost');
            console.log('Try refreshing the page and waiting a moment for services to load');
            return;
        }
    }
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        console.log('❌ No user signed in');
        return;
    }
    
    console.log('✅ Current user:', currentUser.email);
    
    // Check admin status
    try {
        const isAdmin = await authService.isAdmin();
        console.log('Admin status:', isAdmin ? '✅ IS ADMIN' : '❌ NOT ADMIN');
        
        if (!isAdmin) {
            console.log('Cannot test admin data access - user is not admin');
            return;
        }
    } catch (error) {
        console.log('❌ Error checking admin status:', error.message);
        return;
    }
    
    // Test regular user data access
    console.log('\n--- Testing User Match Data ---');
    try {
        const userMatches = await userMatchesApi.loadMatchData();
        console.log('User matches:', userMatches?.length || 0, 'matches');
        if (userMatches?.length > 0) {
            console.log('Sample user match:', userMatches[0]);
        }
    } catch (error) {
        console.log('❌ Error loading user matches:', error.message);
    }
    
    // Test admin data access
    console.log('\n--- Testing Admin Match Data ---');
    try {
        const allMatches = await userMatchesApi.loadAllMatchData();
        console.log('All matches (admin):', allMatches?.length || 0, 'matches');
        
        if (allMatches?.length > 0) {
            console.log('Sample admin match:', allMatches[0]);
            
            // Show unique users
            const uniqueUsers = new Set(allMatches.map(m => m.userEmail || m.userId));
            console.log('Unique users with data:', Array.from(uniqueUsers));
        } else {
            console.log('🔍 No matches found. This could mean:');
            console.log('1. No users have saved match data yet');
            console.log('2. Data is stored with different blob keys');
            console.log('3. There\'s an issue with the blob store query');
            
            // Check if we can save a test match
            console.log('\n--- Testing Match Save ---');
            try {
                const testMatch = {
                    title: 'Test Match',
                    team1Name: 'Test Team 1',
                    team2Name: 'Test Team 2',
                    savedAt: Date.now(),
                    isTestData: true
                };
                
                await userMatchesApi.saveMatchData(testMatch);
                console.log('✅ Test match saved successfully');
                
                // Try loading again
                const userMatchesAfterSave = await userMatchesApi.loadMatchData();
                console.log('User matches after save:', userMatchesAfterSave?.length || 0);
                
            } catch (saveError) {
                console.log('❌ Error saving test match:', saveError.message);
            }
        }
    } catch (error) {
        console.log('❌ Error loading admin matches:', error.message);
        console.log('Error details:', error);
    }
    
    console.log('\n=== TEST COMPLETE ===');
}

// Auto-run the test
testMatchDataAccess();
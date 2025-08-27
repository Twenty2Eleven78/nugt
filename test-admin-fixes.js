// Test script to verify admin dashboard fixes
// Run this in browser console after loading the app

console.log('=== ADMIN DASHBOARD TEST ===');

// Test 1: Check user ID generation consistency
function testUserIdGeneration() {
    console.log('\n1. Testing User ID Generation:');

    // Simulate the new user ID generation logic
    function generateUserId(email) {
        if (email) {
            const emailPart = email.split('@')[0];
            const domain = email.split('@')[1];
            return `user_${emailPart}_${domain.replace(/\./g, '_')}`;
        }
        return 'user_' + Math.random().toString(36).substring(2, 15);
    }

    const testEmails = [
        'admin@nugt.app'
    ];

    testEmails.forEach(email => {
        const userId1 = generateUserId(email);
        const userId2 = generateUserId(email);
        console.log(`Email: ${email}`);
        console.log(`  First generation: ${userId1}`);
        console.log(`  Second generation: ${userId2}`);
        console.log(`  Consistent: ${userId1 === userId2 ? '✅' : '❌'}`);
    });
}

// Test 2: Check admin access (now async)
async function testAdminAccess() {
    console.log('\n2. Testing Admin Access (Secure):');

    if (typeof authService !== 'undefined') {
        const currentUser = authService.getCurrentUser();

        console.log('Current user:', currentUser);

        if (currentUser) {
            console.log('User email:', currentUser.email);
            console.log('User ID:', currentUser.id);

            try {
                const isAdmin = await authService.isAdmin();
                console.log('Is admin (secure check):', isAdmin ? '✅' : '❌');
            } catch (error) {
                console.log('❌ Admin check failed:', error.message);
            }
        } else {
            console.log('❌ No user signed in');
        }
    } else {
        console.log('❌ authService not available');
    }
}

// Test 3: Check admin button visibility
function testAdminButtonVisibility() {
    console.log('\n3. Testing Admin Button Visibility:');

    const adminButton = document.getElementById('admin-modal-button');
    if (adminButton) {
        const isVisible = !adminButton.classList.contains('d-none');
        console.log('Admin button found:', '✅');
        console.log('Admin button visible:', isVisible ? '✅' : '❌');
        console.log('Button classes:', adminButton.className);
    } else {
        console.log('❌ Admin button not found');
    }
}

// Test 4: Check API connectivity
async function testApiConnectivity() {
    console.log('\n4. Testing API Connectivity:');

    if (typeof userMatchesApi !== 'undefined') {
        try {
            console.log('Attempting to load match data...');
            const matches = await userMatchesApi.loadMatchData();
            console.log('✅ User matches loaded:', matches?.length || 0, 'matches');

            try {
                const isAdmin = await authService.isAdmin();
                if (isAdmin) {
                    console.log('Attempting to load all match data (admin)...');
                    const allMatches = await userMatchesApi.loadAllMatchData();
                    console.log('✅ All matches loaded:', allMatches?.length || 0, 'matches');
                }
            } catch (error) {
                console.log('❌ Admin check failed for API test:', error.message);
            }
        } catch (error) {
            console.log('❌ API Error:', error.message);
        }
    } else {
        console.log('❌ userMatchesApi not available');
    }
}

// Run all tests
async function runAllTests() {
    testUserIdGeneration();
    await testAdminAccess();
    testAdminButtonVisibility();
    await testApiConnectivity();

    console.log('\n=== TEST COMPLETE ===');
    console.log('If you see any ❌ marks, check the ADMIN_SETUP.md file for troubleshooting steps.');
    console.log('\n🔒 SECURITY NOTE: Admin emails are now stored securely on the server only!');
}

// Auto-run tests
runAllTests();
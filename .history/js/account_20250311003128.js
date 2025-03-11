// Handle user logout
async function handleLogout() {
    try {
        // Sign out from Supabase
        const { error } = await window.supabaseClient.auth.signOut();
        
        if (error) {
            throw error;
        }

        // Redirect to homepage after successful logout
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Error logging out:', error);
        // Could add error handling UI here if needed
    }
}

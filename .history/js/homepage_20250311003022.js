// DOM Elements
const loginButton = document.getElementById('open-login-button');
const myAccountButton = document.getElementById('my-account-button');
const loginModal = document.getElementById('login-modal');

// Check login status on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkLoginStatus();
});

// Check if user is logged in and update UI accordingly
async function checkLoginStatus() {
    try {
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error) throw error;

        if (user) {
            // User is logged in - show My Account button
            loginButton.style.display = 'none';
            myAccountButton.style.display = 'block';
        } else {
            // User is not logged in - show Login button
            loginButton.style.display = 'block';
            myAccountButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        // On error, default to showing login button
        loginButton.style.display = 'block';
        myAccountButton.style.display = 'none';
    }
}

// Login button click handler
loginButton.addEventListener('click', () => {
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
});

// My Account button click handler 
myAccountButton.addEventListener('click', () => {
    window.location.href = 'account.html';
});


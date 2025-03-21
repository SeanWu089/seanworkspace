// DOM Elements
const loginButton = document.getElementById('open-login-button');
const myAccountButton = document.getElementById('my-account-button');
const loginModal = document.getElementById('login-modal');

// 将checkLoginStatus定义在全局作用域
async function checkLoginStatus() {
    try {
        // 先尝试获取会话
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        // 如果没有会话，直接处理未登录状态
        if (!session) {
            console.log('No active session found - user not logged in');
            loginButton.style.display = 'block';
            myAccountButton.style.display = 'none';
            return;
        }
        
        // 如果有会话，再获取用户信息
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
        // 处理错误情况 - 显示登录按钮
        loginButton.style.display = 'block';
        myAccountButton.style.display = 'none';
    }
}

// Check login status on page load
document.addEventListener('DOMContentLoaded', async () => {
    // 确保DOM元素已正确获取
    console.log('Login button exists:', !!loginButton);
    console.log('My account button exists:', !!myAccountButton);
    console.log('Login modal exists:', !!loginModal);
    
    // 检查Supabase客户端是否已初始化
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized!');
        return; // 如果没有初始化，不继续执行
    }
    
    // 检查登录状态
    await checkLoginStatus();
    
    // Login button click handler
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Login button clicked');
            if (loginModal) {
                loginModal.style.display = 'flex';
                console.log('Modal should be visible now');
            } else {
                console.error('Login modal not found!');
            }
        });
    }
    
    // My Account button click handler 
    if (myAccountButton) {
        myAccountButton.addEventListener('click', () => {
            window.location.href = 'account.html';
        });
    }
}); 
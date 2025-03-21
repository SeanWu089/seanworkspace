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
        
        // 如果有会话，获取用户信息
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
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

// 设置事件监听器
function setupEventListeners() {
    // Login button click handler
    if (loginButton) {
        // 移除可能存在的旧事件监听器
        loginButton.removeEventListener('click', showLoginModal);
        // 添加新的事件监听器
        loginButton.addEventListener('click', showLoginModal);
    }
    
    // My Account button click handler 
    if (myAccountButton) {
        myAccountButton.addEventListener('click', () => {
            window.location.href = 'account.html';
        });
    }
}

// 显示登录模态框的函数
function showLoginModal() {
    console.log('Login button clicked');
    if (loginModal) {
        loginModal.style.display = 'flex';
        console.log('Modal should be visible now');
    } else {
        console.error('Login modal not found!');
    }
}

// 检查Supabase客户端是否已初始化
function ensureSupabaseInitialized() {
    return new Promise((resolve) => {
        // 如果已经初始化，直接返回
        if (window.supabaseClient) {
            console.log('Supabase client already initialized');
            resolve(true);
            return;
        }
        
        console.log('Waiting for Supabase client to initialize...');
        
        // 等待Supabase初始化的最大尝试次数
        let attempts = 0;
        const maxAttempts = 10;
        
        // 定期检查Supabase是否已初始化
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.supabaseClient) {
                console.log('Supabase client initialized');
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                console.error('Supabase client initialization timeout');
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 100);
    });
}

// 页面加载时的主函数
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded');
    
    // 确保DOM元素已正确获取
    console.log('Login button exists:', !!loginButton);
    console.log('My account button exists:', !!myAccountButton);
    console.log('Login modal exists:', !!loginModal);
    
    // 确保Supabase已初始化
    const initialized = await ensureSupabaseInitialized();
    
    if (initialized) {
        // 检查登录状态
        await checkLoginStatus();
    } else {
        // Supabase未初始化，显示登录按钮
        loginButton.style.display = 'block';
        myAccountButton.style.display = 'none';
    }
    
    // 设置事件监听器
    setupEventListeners();
});

// 添加页面可见性变化监听器，在用户返回页面时重新检查登录状态
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && window.supabaseClient) {
        console.log('Page became visible, rechecking login status');
        await checkLoginStatus();
    }
}); 
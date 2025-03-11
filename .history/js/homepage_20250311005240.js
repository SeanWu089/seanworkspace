// 添加登录表单处理
document.addEventListener('DOMContentLoaded', async () => {
    // ... 现有代码 ...
    
    // 获取登录表单和相关元素
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const loginLoading = document.getElementById('login-loading');
    
    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 显示加载状态
            if (loginLoading) loginLoading.style.display = 'block';
            if (loginError) loginError.textContent = '';
            
            try {
                const email = loginEmail.value;
                const password = loginPassword.value;
                
                // 使用Supabase进行登录
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                console.log('Login successful:', data);
                
                // 隐藏登录模态框
                loginModal.style.display = 'none';
                
                // 更新UI状态
                await checkLoginStatus();
                
            } catch (error) {
                console.error('Login error:', error);
                if (loginError) loginError.textContent = error.message || 'Login failed';
            } finally {
                if (loginLoading) loginLoading.style.display = 'none';
            }
        });
    }
    
    // Google登录按钮处理
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                
                if (error) throw error;
                
            } catch (error) {
                console.error('Google login error:', error);
                if (loginError) loginError.textContent = error.message || 'Google login failed';
            }
        });
    }
    
    // 点击模态框背景关闭
    const authOverlay = document.querySelector('.auth-overlay');
    if (authOverlay) {
        authOverlay.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }
    
    // 获取注册和登录链接
    const signupLink = document.getElementById('signup-link');
    const loginLink = document.getElementById('login-link');
    const signupModal = document.getElementById('signup-modal');
    
    // 切换到注册页面
    if (signupLink && signupModal) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            signupModal.style.display = 'flex';
        });
    }
    
    // 切换到登录页面
    if (loginLink && loginModal) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    }
    
    // 监听认证状态变化
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN') {
            console.log('User signed in');
            // 更新UI状态
            await checkLoginStatus();
            // 隐藏登录模态框
            loginModal.style.display = 'none';
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            // 更新UI状态
            await checkLoginStatus();
        }
    });
    
    // ... 其他现有代码 ...
}); 

async function checkLoginStatus() {
    try {
        console.log('Checking login status...');
        
        // 先尝试获取会话
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        
        console.log('Session check result:', session, sessionError);
        
        // 如果没有会话，直接处理未登录状态
        if (!session) {
            console.log('No active session found - user not logged in');
            loginButton.style.display = 'block';
            myAccountButton.style.display = 'none';
            return;
        }
        
        console.log('Active session found:', session);
        
        // 如果有会话，获取用户信息
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
        
        console.log('User check result:', user, userError);
        
        if (user) {
            // User is logged in - show My Account button
            console.log('User is logged in:', user.email);
            loginButton.style.display = 'none';
            myAccountButton.style.display = 'block';
        } else {
            // User is not logged in - show Login button
            console.log('User data not found despite session');
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
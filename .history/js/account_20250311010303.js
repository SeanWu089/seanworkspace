document.addEventListener('DOMContentLoaded', async function() {
    await loadUserInfo();
    
    // 获取登出按钮并添加事件监听器
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});

// 加载用户信息
async function loadUserInfo() {
    try {
        // 检查 Supabase 是否已初始化
        if (!window.supabaseInitialized || !window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        // 获取当前用户信息
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error) {
            throw error;
        }
        
        if (!user) {
            // 如果没有用户登录，重定向到首页
            console.log('No user logged in, redirecting to homepage');
            window.location.href = 'index.html';
            return;
        }
        
        // 显示用户信息
        displayUserInfo(user);
        
    } catch (error) {
        console.error('Error loading user info:', error);
        // 错误处理 - 可能重定向到首页
        window.location.href = 'index.html';
    }
}

// 显示用户信息
function displayUserInfo(user) {
    // 获取显示用户信息的元素
    const userEmailElement = document.getElementById('user-email');
    const userNameElement = document.getElementById('user-name');
    
    // 显示用户邮箱
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
    
    // 显示用户名（如果有）
    if (userNameElement) {
        // 使用用户名或邮箱前缀作为显示名
        const displayName = user.user_metadata?.name || user.email.split('@')[0];
        userNameElement.textContent = displayName;
    }
    
    // 如果有头像元素，也可以显示用户头像
    const userAvatarElement = document.getElementById('user-avatar');
    if (userAvatarElement && user.user_metadata?.avatar_url) {
        userAvatarElement.src = user.user_metadata.avatar_url;
        userAvatarElement.style.display = 'block';
    }
    
    console.log('User info displayed:', user.email);
}

// 登出功能
async function handleLogout() {
    try {
        // 检查 Supabase 是否已初始化
        if (!window.supabaseInitialized || !window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        // 使用 supabase-config.js 中定义的辅助函数
        const { error } = await window.supabaseAuth.signOut();
        
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
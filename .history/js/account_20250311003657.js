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
// Supabase 配置
const SUPABASE_URL = 'https://gzhwzshdbpxnziuwqxrm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aHd6c2hkYnB4bnppdXdxeHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMzY5ODgsImV4cCI6MjA1NjYxMjk4OH0.HtNwEG7MYClIX2683u_m_tO73ZhyImgl-IP1o9m7B8A';

// 初始化 Supabase 客户端并挂载到 window 对象
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
});

// 会话刷新函数
async function refreshSession() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error || !session) {
            throw error || new Error('No session found');
        }
        return { session, error: null };
    } catch (error) {
        console.error('Session refresh failed:', error);
        return { session: null, error };
    }
}

// 用户认证相关函数
const auth = {
    // 检查用户状态
    async checkUser() {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        return user;
    },

    // 用户注册
    async signUp(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            return { data, error };
        } catch (error) {
            console.error('Registration error:', error);
            return { data: null, error };
        }
    },

    // 用户登录
    async signIn(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            return { data, error };
        } catch (error) {
            console.error('Login error:', error);
            return { data: null, error };
        }
    },

    // Google登录
    async signInWithGoogle() {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            return { data, error };
        } catch (error) {
            console.error('Google login error:', error);
            return { data: null, error };
        }
    },

    // 用户登出
    async signOut() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            return { error };
        } catch (error) {
            console.error('Logout error:', error);
            return { error };
        }
    }
};

// 文件操作相关函数
const storage = {
    // 上传文件
    async uploadFile(file, path) {
        try {
            const { data, error } = await window.supabaseClient
                .storage
                .from('user_files')
                .upload(path, file);
            return { data, error };
        } catch (error) {
            console.error('File upload error:', error);
            return { data: null, error };
        }
    },

    // 获取文件列表
    async listFiles(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('user_files')
                .select('*')
                .eq('user_id', userId);
            return { data, error };
        } catch (error) {
            console.error('File list error:', error);
            return { data: null, error };
        }
    }
};

// 添加全局认证助手函数
window.supabaseAuth = {
    getSession: async () => {
        return await window.supabaseClient.auth.getSession();
    },
    
    signIn: async (email, password) => {
        return await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
    },
    
    signOut: async () => {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            return { error };
        } catch (error) {
            console.error('Logout error:', error);
            return { error };
        }
    }
};

// 添加初始化完成标志
window.supabaseInitialized = true; 
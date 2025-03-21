// DOM Elements
const loginButton = document.getElementById('open-login-button');
const myAccountButton = document.getElementById('my-account-button');
const authModal = document.getElementById('auth-modal'); // 修改为正确的ID

// 添加上传相关的 DOM 元素
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('file-input');

// 将checkLoginStatus定义在全局作用域
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

// 显示登录模态框的函数
function showLoginModal() {
    console.log('Login button clicked');
    if (authModal) {
        authModal.style.display = 'flex';
        console.log('Modal should be visible now');
    } else {
        console.error('Login modal not found!');
    }
}

// 页面加载时的主函数
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded');
    
    // 确保DOM元素已正确获取
    console.log('Login button exists:', !!loginButton);
    console.log('My account button exists:', !!myAccountButton);
    console.log('Login modal exists:', !!authModal);
    
    // 检查登录状态
    if (window.supabaseClient) {
        await checkLoginStatus();
    } else {
        console.error('Supabase client not initialized!');
        // Supabase未初始化，显示登录按钮
        loginButton.style.display = 'block';
        myAccountButton.style.display = 'none';
      }
    
    // 设置事件监听器
    if (loginButton) {
        loginButton.addEventListener('click', showLoginModal);
  }

    // My Account button click handler 
    if (myAccountButton) {
        myAccountButton.addEventListener('click', () => {
            window.location.href = 'account.html';
        });
    }
    
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
                authModal.style.display = 'none';
                
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
            authModal.style.display = 'none';
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
            authModal.style.display = 'none';
            signupModal.style.display = 'flex';
        });
      }
    
    // 切换到登录页面
    if (loginLink && authModal) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.style.display = 'none';
            authModal.style.display = 'flex';
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
            authModal.style.display = 'none';
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            // 更新UI状态
            await checkLoginStatus();
        }
    });

    // 添加上传按钮的点击事件
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            // 检查用户是否已登录
            window.supabaseClient.auth.getUser().then(({ data: { user } }) => {
                if (!user) {
                    // 如果未登录，显示登录模态框
                    showLoginModal();
                    return;
                }
                // 触发文件选择
                fileInput.click();
            });
        });

        // 添加文件选择的change事件
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (!user) {
                    throw new Error('User not authenticated');
                }

                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Uploading...';

                const result = await handleFileUpload(file, user);

                if (result.success) {
                    alert(result.message);
                } else {
                    alert(result.message);
                }

            } catch (error) {
                console.error('Upload error:', error);
                alert('Upload failed: ' + error.message);
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'WHY DONT WE START FROM HERE';
                fileInput.value = '';
            }
        });
    }
});

async function handleFileUpload(file, user) {
    try {
        // 计算当前文件的哈希值
        const fileHash = await calculateFileHash(file);
        const baseFileName = file.name;
        const filePath = `${user.id}/${baseFileName}`;

        // 检查是否存在同名文件
        const { data: existingFiles } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(`${user.id}/`);

        const existingFile = existingFiles?.find(f => f.name === baseFileName);

        if (existingFile) {
            // 如果存在同名文件，检查内容是否相同
            const existingFileUrl = window.supabaseClient
                .storage
                .from('user_files')
                .getPublicUrl(`${user.id}/${existingFile.name}`).data.publicUrl;

            const existingFileResponse = await fetch(existingFileUrl);
            const existingFileBlob = await existingFileResponse.blob();
            const existingFileHash = await calculateFileHash(existingFileBlob);

            if (fileHash === existingFileHash) {
                // 文件完全相同，提示用户
                return {
                    success: false,
                    message: 'This exact file already exists in your storage.'
                };
            }
        }

        // 上传文件，使用 upsert: true 来覆盖同名文件
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true  // 设置为 true 以覆盖同名文件
            });

        if (error) throw error;

        return {
            success: true,
            data: data,
            message: existingFile 
                ? 'File updated successfully!' 
                : 'File uploaded successfully!'
        };

    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// 计算文件哈希值的辅助函数
async function calculateFileHash(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
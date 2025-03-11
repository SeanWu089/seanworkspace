/**
 * Sean's Workspace Homepage JavaScript
 * 所有功能统一管理
 */

// 立即执行函数，避免全局变量污染
(function() {
    // 添加调试信息确认脚本加载
    console.log('Script loaded');

    // 设置会话刷新定时器
    let sessionRefreshTimer;

    // 定义全局更新时间函数
    function updateDateTime(element) {
        if (!element) return;
        
        const now = new Date();
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        
        const dateStr = now.toLocaleDateString('en-US', dateOptions);
        const timeStr = now.toLocaleTimeString('en-US', timeOptions);
        
        element.innerHTML = `${dateStr}<br>${timeStr}`;
    }

    // 刷新会话token的函数
    async function refreshSession() {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error || !session) {
                throw error || new Error('No session found');
            }
            
            console.log('Session refreshed successfully');
            
            // 确保按钮状态正确
            const loginButton = document.getElementById('open-login-button');
            const myAccountButton = document.getElementById('my-account-button');
            
            if (loginButton && myAccountButton) {
                loginButton.style.display = 'none';
                myAccountButton.style.display = 'block';
            }
            
            // 设置下一次刷新（每15分钟刷新一次，确保不会超过20分钟）
            if (sessionRefreshTimer) {
                clearTimeout(sessionRefreshTimer);
            }
            sessionRefreshTimer = setTimeout(refreshSession, 15 * 60 * 1000);
            
        } catch (error) {
            console.error('Session refresh failed:', error);
            // 如果刷新失败，说明会话可能已过期
            const loginButton = document.getElementById('open-login-button');
            const myAccountButton = document.getElementById('my-account-button');
            
            if (loginButton && myAccountButton) {
                loginButton.style.display = 'block';
                myAccountButton.style.display = 'none';
            }
        }
    }

    // DOM加载完成后执行
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('DOM Content Loaded');
        
        // 首先检查会话状态
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        const loginButton = document.getElementById('open-login-button');
        const myAccountButton = document.getElementById('my-account-button');

        if (session) {
            console.log('Active session found:', session);
            if (loginButton) loginButton.style.display = 'none';
            if (myAccountButton) {
                myAccountButton.style.display = 'block';
                myAccountButton.onclick = () => {
                    window.location.href = 'account.html';
                };
            }
            refreshSession();
        } else {
            console.log('No active session');
            if (loginButton) loginButton.style.display = 'block';
            if (myAccountButton) myAccountButton.style.display = 'none';
        }

        initDateTime();
        initLoginModal();
        initSignupModal();
        initSidebars();
        initFileUpload();

        // 初始化登出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        checkUserLoginStatus();
    });

    /**
     * 登录弹窗相关功能
     */
    function initLoginModal() {
        // 获取所有需要的元素
        const loginButton = document.getElementById('open-login-button');
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const signupLink = document.getElementById('signup-link');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const loginError = document.getElementById('login-error');
        const loginLoading = document.getElementById('login-loading');

        // 检查必要元素是否存在
        if (!loginButton || !modal || !loginForm) {
            console.error('Required login elements not found:', {
                loginButton: !!loginButton,
                modal: !!modal,
                loginForm: !!loginForm
            });
            return;
        }

        // 登录按钮点击事件
        loginButton.addEventListener('click', function(e) {
            console.log('Login button clicked');
            e.preventDefault();
            modal.style.display = 'flex';
            modal.classList.add('show');
        });

        // 点击背景关闭弹窗
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('auth-overlay')) {
                modal.classList.remove('show');
            }
        });

        // ESC键关闭弹窗
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });

        // 处理登录表单提交
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 显示加载状态
            loginLoading.style.display = 'block';
            loginError.textContent = '';
            loginError.classList.remove('visible');
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                console.log('Attempting login...');
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                console.log('Login successful:', data);
                await handleLoginSuccess(data);
                
            } catch (error) {
                console.error('Login error:', error);
                loginError.textContent = error.message || 'Login failed. Please try again.';
                loginError.classList.add('visible');
            } finally {
                loginLoading.style.display = 'none';
            }
        });

        // Google登录按钮点击事件
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', async function() {
                try {
                    loginLoading.style.display = 'block';
                    loginError.classList.remove('visible');
                    
                    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: window.location.origin
                        }
                    });
                    
                    if (error) throw error;
                    
                    console.log('Redirecting to Google login...');
                    
                } catch (error) {
                    console.error('Google login error:', error);
                    loginError.textContent = error.message || 'Google login failed. Please try again.';
                    loginError.classList.add('visible');
                    loginLoading.style.display = 'none';
                }
            });
        }

        // 注册链接点击事件
        if (signupLink) {
            signupLink.addEventListener('click', function(e) {
                e.preventDefault();
                modal.classList.remove('show');
                document.getElementById('signup-modal').classList.add('show');
            });
        }
    }
    
    /**
     * 注册弹窗相关功能
     */
    function initSignupModal() {
        const signupModal = document.getElementById('signup-modal');
        const loginLink = document.getElementById('login-link');
        const signupForm = document.getElementById('signup-form');
        const googleSignupBtn = document.getElementById('google-signup-btn');
        const signupError = document.getElementById('signup-error');
        const signupLoading = document.getElementById('signup-loading');
        
        if (!signupModal) {
            console.error('Required signup elements not found');
            return;
        }
        
        console.log('Signup modal initialized');
        
        // 点击背景关闭弹窗
        signupModal.addEventListener('click', function(e) {
            if (e.target === signupModal || e.target.classList.contains('auth-overlay')) {
                signupModal.classList.remove('show');
            }
        });
        
        // ESC键关闭弹窗
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && signupModal.classList.contains('show')) {
                signupModal.classList.remove('show');
            }
        });
        
        // 转到登录页面
        if (loginLink) {
            loginLink.addEventListener('click', function(e) {
                e.preventDefault();
                signupModal.classList.remove('show');
                document.getElementById('auth-modal').classList.add('show');
            });
        }
        
        // 处理注册表单提交
        if (signupForm) {
            signupForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // 显示加载状态
                signupLoading.style.display = 'block';
                signupError.classList.remove('visible');
                
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const confirmPassword = document.getElementById('signup-confirm-password').value;
                
                // 密码验证
                if (password !== confirmPassword) {
                    signupError.textContent = 'Passwords do not match';
                    signupError.classList.add('visible');
                    signupLoading.style.display = 'none';
                    return;
                }
                
                try {
                    const { data, error } = await window.supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            emailRedirectTo: window.location.origin
                        }
                    });
                    
                    if (error) throw error;
                    
                    console.log('Signup successful:', data);
                    
                    if (data.user.identities && data.user.identities.length === 0) {
                        // 用户可能已存在
                        signupError.textContent = 'This email is already registered. Please try logging in.';
                        signupError.classList.add('visible');
                    } else {
                        // 注册成功，显示确认信息
                        signupForm.innerHTML = `
                            <div style="text-align: center; padding: 20px;">
                                <h3>Registration Successful!</h3>
                                <p>Please check your email for confirmation link.</p>
                            </div>
                        `;
                    }
                    
                } catch (error) {
                    console.error('Signup error:', error);
                    signupError.textContent = error.message || 'Registration failed. Please try again.';
                    signupError.classList.add('visible');
                } finally {
                    signupLoading.style.display = 'none';
                }
            });
        }
        
        // 处理Google注册
        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', async function() {
                try {
                    signupLoading.style.display = 'block';
                    signupError.classList.remove('visible');
                    
                    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: window.location.origin
                        }
                    });
                    
                    if (error) throw error;
                    
                    // 重定向到Google登录页面
                    console.log('Redirecting to Google login...');
                    
                } catch (error) {
                    console.error('Google signup error:', error);
                    signupError.textContent = error.message || 'Google signup failed. Please try again.';
                    signupError.classList.add('visible');
                    signupLoading.style.display = 'none';
                }
            });
        }
        
        // 更新注册页面时间
        const signupDateTimeElement = document.getElementById('signup-date-time');
        if (signupDateTimeElement) {
            updateDateTime(signupDateTimeElement);
        }
    }
    
    /**
     * 日期时间更新功能
     */
    function initDateTime() {
        const dateTimeElement = document.getElementById('auth-date-time');
        const signupDateTimeElement = document.getElementById('signup-date-time');
        
        // 初始化并设置定时更新
            if (dateTimeElement) {
            updateDateTime(dateTimeElement);
            setInterval(() => updateDateTime(dateTimeElement), 1000);
        }
        
        if (signupDateTimeElement) {
            updateDateTime(signupDateTimeElement);
            setInterval(() => updateDateTime(signupDateTimeElement), 1000);
        }
    }

    
    /**
     * 文件上传功能
     */
    async function initFileUpload() {
        // 更新允许的文件类型
        const ALLOWED_TYPES = [
            // Office 文档
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // .xlsx
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            'application/vnd.ms-excel',   // .xls
            'application/vnd.ms-powerpoint', // .ppt
            // PDF
            'application/pdf',            // .pdf
            // CSV & JSON
            'text/csv',                  // .csv
            'application/json'           // .json
        ];
        
        const ALLOWED_EXTENSIONS = ['.csv', '.json', '.xlsx', '.xls', '.pdf', '.docx', '.pptx', '.ppt'];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('file-input');
        
        console.log('Initializing file upload...'); // 调试日志
        
        if (!uploadBtn || !fileInput) {
            console.error('Upload button or file input not found');
            return;
        }

        // 添加点击事件监听器
        uploadBtn.onclick = function(e) {
            console.log('Upload button clicked');
                fileInput.click();
        };
            
        // 文件选择事件监听器
        fileInput.onchange = async function(e) {
                const file = e.target.files[0];
            if (!file) {
                console.log('No file selected');
                return;
            }

            console.log('File selected:', file.name, 'Type:', file.type);

            try {
                // 检查文件扩展名
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                const isAllowedExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
                const isAllowedType = ALLOWED_TYPES.includes(file.type);

                if (!isAllowedExtension && !isAllowedType) {
                    throw new Error(`Unsupported file type. Allowed types are: ${ALLOWED_EXTENSIONS.join(', ')}`);
                }

                // 文件大小检查
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error('File size exceeds 10MB limit.');
                }

                // 检查用户登录状态
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                
                uploadBtn.innerText = 'Uploading...';
                uploadBtn.disabled = true;

                if (session) {
                    // 登录用户 - 使用 Supabase 存储
                    await handleAuthenticatedUpload(file, session);
                } else {
                    // 未登录用户 - 使用 Railway 后端
                    await handleGuestUpload(file);
                }

            } catch (error) {
                console.error('Upload error:', error);
                uploadBtn.innerText = 'Upload Failed';
                alert(error.message || 'Upload failed. Please try again.');
            } finally {
                setTimeout(() => {
                    uploadBtn.innerText = 'WHY DONT WE START FROM HERE';
                    uploadBtn.disabled = false;
                }, 2000);
            }
        };

        // 处理文件预览
        function handleFilePreview(file) {
            const fileExt = file.name.split('.').pop().toLowerCase();
            
            // 只为 CSV 文件生成预览
            if (fileExt === 'csv' || file.type === 'text/csv') {
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const csvContent = event.target.result;
                        const lines = csvContent.split('\n');
                        if (lines.length > 0) {
                            const headers = lines[0].split(',');
                            const previewData = {
                                columns: headers.map(header => ({
                                    name: header.trim(),
                                    type: 'string'
                                }))
                            };
                            updatePreviewTable(previewData.columns);
                        }
                    } catch (error) {
                        console.error('Preview generation failed:', error);
                    }
                };
                reader.readAsText(file);
            } else {
                // 对于其他类型的文件，显示基本信息
                const previewData = {
                    columns: [{
                        name: 'File Name',
                        type: file.name
                    }, {
                        name: 'File Type',
                        type: file.type || fileExt
                    }, {
                        name: 'File Size',
                        type: `${(file.size / 1024).toFixed(2)} KB`
                    }]
                };
                updatePreviewTable(previewData.columns);
            }
        }

        // 处理登录用户的上传
        async function handleAuthenticatedUpload(file, session) {
            // 生成唯一的文件路径
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Date.now()}_${file.name}`;

            console.log('Uploading to Supabase:', fileName);

            // 上传文件到 Supabase 存储
            const { data: storageData, error: uploadError } = await window.supabaseClient
                .storage
                .from('user_files')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 获取文件的公共URL
            const { data: { publicUrl } } = window.supabaseClient
                .storage
                .from('user_files')
                .getPublicUrl(fileName);

            // 在数据库中记录文件信息
            const { data: fileData, error: dbError } = await window.supabaseClient
                .from('user_files')
                .insert([{
                    user_id: session.user.id,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    file_path: fileName,
                    storage_bucket: 'user_files',
                    metadata: {
                        originalName: file.name,
                        contentType: file.type,
                        publicUrl: publicUrl
                    }
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            console.log('File uploaded and recorded:', fileData);
            uploadBtn.innerText = 'Upload Complete!';
            
            // 处理文件预览
            handleFilePreview(file);
        }

        // 处理未登录用户的上传
        async function handleGuestUpload(file) {
            console.log('Uploading to Railway backend');
            
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://seanholisticworkspace-production.up.railway.app/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload to Railway failed');
            }

            const data = await response.json();
            console.log('Railway upload successful:', data);
            uploadBtn.innerText = 'Upload Complete!';

            // 处理文件预览
            if (data.columns) {
                updatePreviewTable(data.columns);
            } else {
                // 如果后端没有返回列信息，本地处理预览
                handleFilePreview(file);
            }

            // 设置20分钟后自动清除的提示
            alert('Note: This file will be automatically deleted after 20 minutes. Please login to save your files permanently.');
        }
    }

    // 修改登录成功后的处理
    async function handleLoginSuccess(data) {
        const modal = document.getElementById('auth-modal');
        const loginButton = document.getElementById('open-login-button');
        const myAccountButton = document.getElementById('my-account-button');
        
        // 隐藏登录弹窗
        modal.classList.remove('show');
        modal.style.display = 'none';
        
        // 更新按钮显示状态
        loginButton.style.display = 'none';
        myAccountButton.style.display = 'block';
        
        // 添加 My Account 按钮点击事件
        myAccountButton.onclick = () => {
            window.location.href = 'account.html';
        };
        
        // 启动会话刷新机制
        refreshSession();
        
        // 将会话信息存储到 localStorage
        localStorage.setItem('sessionStartTime', new Date().getTime());
    }

    async function checkUserLoginStatus() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                // 用户已登录，显示My Account按钮，隐藏Login按钮
                document.getElementById('open-login-button').style.display = 'none';
                document.getElementById('my-account-button').style.display = 'inline-block';
            } else {
                // 用户未登录，显示Login按钮，隐藏My Account按钮
                document.getElementById('open-login-button').style.display = 'inline-block';
                document.getElementById('my-account-button').style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            // 出错时默认显示Login按钮
            document.getElementById('open-login-button').style.display = 'inline-block';
            document.getElementById('my-account-button').style.display = 'none';
        }
    }
})();

/** ========================== 上传文件到后端 ========================== */
function uploadFileToBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  const uploadBtn = document.getElementById('uploadBtn');
  uploadBtn.innerText = 'Uploading...';
  uploadBtn.disabled = true;

  fetch('https://seanholisticworkspace-production.up.railway.app/upload', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
            console.log('Success:', data);
            uploadBtn.innerText = 'Upload Complete!';
            setTimeout(() => {
                uploadBtn.innerText = 'WHY DONT WE START FROM HERE';
                uploadBtn.disabled = false;
            }, 2000);

            // 存储预览数据
      if (data.columns) {
        localStorage.setItem('previewData', JSON.stringify(data.columns));

                // 更新预览表格
        const tbody = document.querySelector('#preview-table tbody');
        tbody.innerHTML = data.columns.map(col =>
          `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
        ).join('');
                
                // 显示右侧边栏
                const rightSidebar = document.getElementById('rightSidebar');
                rightSidebar.classList.add('show');
                
                const rightToggle = document.getElementById('rightToggle');
                rightToggle.style.transform = 'rotate(180deg)';
                rightToggle.style.right = '180px';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            uploadBtn.innerText = 'Upload Failed';
            setTimeout(() => {
                uploadBtn.innerText = 'WHY DONT WE START FROM HERE';
                uploadBtn.disabled = false;
            }, 2000);
        });
}

// 修改现有的 handleLogout 函数
async function handleLogout() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// 确保登出按钮有事件监听器
const logoutButton = document.getElementById('logout-btn');
if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}

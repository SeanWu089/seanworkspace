/**
 * Sean's Workspace Homepage JavaScript
 * 统一管理所有主页功能
 */

// 使用立即执行函数表达式(IIFE)避免全局变量污染
(function() {
  // 会话管理
  let sessionRefreshTimer;
  
  // DOM 元素缓存
  const elements = {
    loginButton: document.getElementById('open-login-button'),
    myAccountButton: document.getElementById('my-account-button'),
    authModal: document.getElementById('auth-modal'),
    signupModal: document.getElementById('signup-modal'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    loginError: document.getElementById('login-error'),
    loginLoading: document.getElementById('login-loading'),
    signupError: document.getElementById('signup-error'),
    signupLoading: document.getElementById('signup-loading'),
    dateTimeElement: document.getElementById('auth-date-time'),
    signupDateTimeElement: document.getElementById('signup-date-time'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInput: document.getElementById('file-input'),
    logoutBtn: document.getElementById('logout-btn')
  };

  /**
   * 会话管理函数
   */
  async function refreshSession() {
    try {
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      if (error || !session) {
        throw error || new Error('No session found');
      }
      
      console.log('Session refreshed successfully');
      
      // 确保按钮状态正确
      if (elements.loginButton && elements.myAccountButton) {
        elements.loginButton.style.display = 'none';
        elements.myAccountButton.style.display = 'block';
      }
      
      // 设置下一次刷新（每15分钟刷新一次，确保不会超过20分钟）
      if (sessionRefreshTimer) {
        clearTimeout(sessionRefreshTimer);
      }
      sessionRefreshTimer = setTimeout(refreshSession, 15 * 60 * 1000);
      
    } catch (error) {
      console.error('Session refresh failed:', error);
      // 如果刷新失败，说明会话可能已过期
      if (elements.loginButton && elements.myAccountButton) {
        elements.loginButton.style.display = 'block';
        elements.myAccountButton.style.display = 'none';
      }
    }
  }

  /**
   * 日期时间更新函数
   */
  function updateDateTime(element) {
    if (!element) return;
    
    const now = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    const dateStr = now.toLocaleDateString('en-US', dateOptions);
    const timeStr = now.toLocaleTimeString('en-US', timeOptions);
    
    element.innerHTML = `${dateStr}<br>${timeStr}`;
  }

  function initDateTime() {
    // 初始化并设置定时更新
    if (elements.dateTimeElement) {
      updateDateTime(elements.dateTimeElement);
      setInterval(() => updateDateTime(elements.dateTimeElement), 1000);
    }
    
    if (elements.signupDateTimeElement) {
      updateDateTime(elements.signupDateTimeElement);
      setInterval(() => updateDateTime(elements.signupDateTimeElement), 1000);
    }
  }

  /**
   * 登录相关函数
   */
  function initLoginModal() {
    const { loginButton, authModal, loginForm, signupLink, googleLoginBtn, loginError, loginLoading } = elements;
    
    // 检查必要元素是否存在
    if (!loginButton || !authModal || !loginForm) {
      console.error('Required login elements not found:', {
        loginButton: !!loginButton,
        authModal: !!authModal,
        loginForm: !!loginForm
      });
      return;
    }

    // 登录按钮点击事件
    loginButton.addEventListener('click', function(e) {
      console.log('Login button clicked');
      e.preventDefault();
      authModal.style.display = 'flex';
      authModal.classList.add('show');
    });

    // 点击背景关闭弹窗
    authModal.addEventListener('click', function(e) {
      if (e.target === authModal || e.target.classList.contains('auth-overlay')) {
        authModal.classList.remove('show');
      }
    });

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && authModal.classList.contains('show')) {
        authModal.classList.remove('show');
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
    const signupLink = document.getElementById('signup-link');
    if (signupLink) {
      signupLink.addEventListener('click', function(e) {
        e.preventDefault();
        authModal.classList.remove('show');
        document.getElementById('signup-modal').classList.add('show');
      });
    }
  }
  
  /**
   * 注册相关函数
   */
  function initSignupModal() {
    const { signupModal, signupForm, googleSignupBtn, signupError, signupLoading } = elements;
    
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
    const loginLink = document.getElementById('login-link');
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
  }

  /**
   * 侧边栏初始化
   */
  function initSidebars() {
    // 左侧边栏
    const leftSidebar = document.getElementById('leftSidebar');
    const leftToggle = document.getElementById('leftToggle');

    if (leftToggle && leftSidebar) {
      leftToggle.addEventListener('click', () => {
        leftSidebar.classList.toggle('show');
        if (leftSidebar.classList.contains('show')) {
          leftToggle.style.transform = 'rotate(180deg)';
          leftToggle.style.left = '280px';
        } else {
          leftToggle.style.transform = 'rotate(0deg)';
          leftToggle.style.left = '5px';
        }
      });
    }

    // 右侧边栏
    const rightSidebar = document.getElementById('rightSidebar');
    const rightToggle = document.getElementById('rightToggle');

    if (rightToggle && rightSidebar) {
      rightToggle.addEventListener('click', () => {
        rightSidebar.classList.toggle('show');
        if (rightSidebar.classList.contains('show')) {
          rightToggle.style.transform = 'rotate(180deg)';
          rightToggle.style.right = '180px';
        } else {
          rightToggle.style.transform = 'rotate(0deg)';
          rightToggle.style.right = '5px';
        }
      });
    }
  }

  /**
   * 文件上传相关函数
   */
  function initFileUpload() {
    const { uploadBtn, fileInput } = elements;
    
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
  }

  /**
   * 文件处理函数
   */
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

  // 更新预览表格
  function updatePreviewTable(columns) {
    const previewContent = document.getElementById('preview-content');
    const previewEmptyState = document.getElementById('preview-empty-state');
    const tbody = document.querySelector('#preview-table tbody');
    
    if (!tbody) return;
    
    // 清空现有内容
    tbody.innerHTML = '';
    
    // 添加新行
    columns.forEach(col => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${col.name}</td><td>${col.type}</td>`;
      tbody.appendChild(row);
    });
    
    // 显示预览内容，隐藏空状态
    if (previewContent) previewContent.style.display = 'block';
    if (previewEmptyState) previewEmptyState.style.display = 'none';
    
    // 显示右侧边栏
    const rightSidebar = document.getElementById('rightSidebar');
    const rightToggle = document.getElementById('rightToggle');
    
    if (rightSidebar) {
      rightSidebar.classList.add('show');
      if (rightToggle) {
        rightToggle.style.transform = 'rotate(180deg)';
        rightToggle.style.right = '180px';
      }
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
    elements.uploadBtn.innerText = 'Upload Complete!';
    
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
    elements.uploadBtn.innerText = 'Upload Complete!';

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

  /**
   * 用户认证状态管理
   */
  // 登录成功后的处理
  async function handleLoginSuccess(data) {
    const { authModal, loginButton, myAccountButton } = elements;
    
    // 隐藏登录弹窗
    authModal.classList.remove('show');
    authModal.style.display = 'none';
    
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

  // 检查用户登录状态
  async function checkUserLoginStatus() {
    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      const { loginButton, myAccountButton } = elements;
      
      if (user) {
        // 用户已登录，显示My Account按钮，隐藏Login按钮
        loginButton.style.display = 'none';
        myAccountButton.style.display = 'inline-block';
        
        // 设置My Account按钮点击事件
        myAccountButton.onclick = () => {
          window.location.href = 'account.html';
        };
      } else {
        // 用户未登录，显示Login按钮，隐藏My Account按钮
        loginButton.style.display = 'inline-block';
        myAccountButton.style.display = 'none';
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // 出错时默认显示Login按钮
      elements.loginButton.style.display = 'inline-block';
      elements.myAccountButton.style.display = 'none';
    }
  }

  /**
   * 页面初始化
   */
  document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    
    // 首先检查会话状态
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    const { loginButton, myAccountButton } = elements;

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

    // 初始化各个功能模块
    initDateTime();
    initLoginModal();
    initSignupModal();
    initSidebars();
    initFileUpload();

    // 初始化登出按钮
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', handleLogout);
    }

    // 检查用户登录状态
    checkUserLoginStatus();
  });
})();

/**
 * 全局函数
 */
// 上传文件到后端
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

// 登出函数
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
document.addEventListener('DOMContentLoaded', function() {
  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
});

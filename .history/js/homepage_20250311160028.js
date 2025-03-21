// DOM Elements
const loginButton = document.getElementById('open-login-button');
const myAccountButton = document.getElementById('my-account-button');
const authModal = document.getElementById('auth-modal'); // 修改为正确的ID

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
    });
  }

  /** ========================== 右侧侧边栏 ========================== */
  const rightSidebar = document.getElementById('rightSidebar');
  const rightToggle = document.getElementById('rightToggle');

  if (rightToggle && rightSidebar) {
    rightToggle.addEventListener('click', () => {
      rightSidebar.classList.toggle('show');

      if (rightSidebar.classList.contains('show')) {
        rightToggle.style.transform = 'rotate(180deg)';
        rightToggle.style.right = '180px'; // 右侧边栏展开时的位置
      } else {
        // 边栏收回：复位旋转和位置
        rightToggle.style.transform = 'rotate(0deg)';
        rightToggle.style.right = '5px';
      }
    });
  }

  /** ========================== 上传文件 ========================== */
  const uploadBtn = document.getElementById('uploadBtn');

  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv, .xlsx, .txt';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) uploadFileToBackend(file);
        document.body.removeChild(input);
      };
    });
  }
});

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
      console.log('Upload success:', data);
      if (data.file_path) {
        window.uploadedFilePath = data.file_path;
        localStorage.setItem('uploadedFilePath', data.file_path);
      }
      if (data.columns) {
        // 保存预览数据到 Local Storage
        localStorage.setItem('previewData', JSON.stringify(data.columns));

        const tbody = document.querySelector('#preview-table tbody');
        tbody.innerHTML = data.columns.map(col =>
          `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
        ).join('');
        window.dataColumns = data.columns;
      }
    })
    .catch(err => console.error('Upload failed:', err))
    .finally(() => {
      uploadBtn.innerText = 'Upload File';
      uploadBtn.disabled = false;
    });
}

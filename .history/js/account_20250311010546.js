document.addEventListener('DOMContentLoaded', async function() {
    await loadUserInfo();
    
    // 获取登出按钮并添加事件监听器
    const logoutButton = document.getElementById('logout-btn'); // 注意：HTML中是logout-btn而不是logout-button
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // 加载用户上传的文件
    await loadUserFiles();
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
    
    // 显示用户邮箱
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
    
    // 如果有头像元素，也可以显示用户头像
    const profileImage = document.getElementById('profile-image');
    if (profileImage && user.user_metadata?.avatar_url) {
        profileImage.src = user.user_metadata.avatar_url;
    }
    
    console.log('User info displayed:', user.email);
}

// 加载用户上传的文件
async function loadUserFiles() {
    try {
        // 检查 Supabase 是否已初始化
        if (!window.supabaseInitialized || !window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        // 获取当前用户
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            console.error('No user found');
            return;
        }
        
        // 从Supabase存储中获取用户文件列表
        const { data: files, error } = await window.supabaseClient
            .storage
            .from('user_files') // 替换为您的存储桶名称
            .list(`${user.id}/`, { // 假设文件按用户ID组织
                sortBy: { column: 'created_at', order: 'desc' }
            });
        
        if (error) {
            throw error;
        }
        
        // 显示文件列表
        displayUserFiles(files, user.id);
        
    } catch (error) {
        console.error('Error loading user files:', error);
        // 显示错误信息
        const filesListElement = document.getElementById('files-list');
        if (filesListElement) {
            filesListElement.innerHTML = `
                <div class="error-message">
                    <p>Error loading files. Please try again later.</p>
                </div>
            `;
        }
    }
}

// 显示用户文件列表
function displayUserFiles(files, userId) {
    const filesListElement = document.getElementById('files-list');
    
    if (!filesListElement) {
        console.error('Files list element not found');
        return;
    }
    
    // 如果没有文件
    if (!files || files.length === 0) {
        filesListElement.innerHTML = `
            <div class="empty-state">
                <p>You haven't uploaded any files yet.</p>
            </div>
        `;
        return;
    }
    
    // 创建文件列表HTML
    let filesHTML = '<div class="files-list">';
    
    files.forEach(file => {
        // 确定文件图标
        let fileIcon = 'fa-file';
        if (file.name.endsWith('.csv')) fileIcon = 'fa-file-csv';
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) fileIcon = 'fa-file-excel';
        else if (file.name.endsWith('.pdf')) fileIcon = 'fa-file-pdf';
        else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) fileIcon = 'fa-file-word';
        else if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) fileIcon = 'fa-file-powerpoint';
        
        // 格式化文件大小
        const fileSize = formatFileSize(file.metadata?.size || 0);
        
        // 格式化上传日期
        const uploadDate = new Date(file.created_at).toLocaleDateString();
        
        // 生成文件URL
        const fileUrl = window.supabaseClient.storage
            .from('user_files')
            .getPublicUrl(`${userId}/${file.name}`).data.publicUrl;
        
        filesHTML += `
            <div class="file-item" data-file-path="${userId}/${file.name}">
                <div class="file-info">
                    <i class="file-icon fas ${fileIcon}"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">${fileSize} • Uploaded on ${uploadDate}</div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn download" onclick="downloadFile('${fileUrl}', '${file.name}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="file-action-btn delete" onclick="deleteFile('${userId}/${file.name}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    filesHTML += '</div>';
    filesListElement.innerHTML = filesHTML;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 下载文件
function downloadFile(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// 删除文件
async function deleteFile(filePath) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .storage
            .from('user_files')
            .remove([filePath]);
        
        if (error) {
            throw error;
        }
        
        // 重新加载文件列表
        await loadUserFiles();
        
    } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
    }
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
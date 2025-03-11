// 设置会话刷新定时器
let sessionRefreshTimer;

// 刷新会话token的函数
async function refreshSession() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error || !session) {
            console.error('Session refresh failed:', error);
            window.location.href = './index.html'; // 如果刷新失败，重定向到主页
            return;
        }
        // 设置下一次刷新（每9分钟刷新一次，确保不会超过10分钟）
        sessionRefreshTimer = setTimeout(refreshSession, 9 * 60 * 1000);
    } catch (e) {
        console.error('Session refresh exception:', e);
        window.location.href = './index.html';
    }
}

// 检查会话状态的函数
async function checkSession() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error || !session) {
            // 未登录，重定向到主页
            window.location.href = './index.html';
            return false;
        }
        return true;
    } catch (e) {
        console.error('Check session exception:', e);
        window.location.href = './index.html';
        return false;
    }
}

// 全局登出处理函数
window.handleLogout = async function() {
    console.log("登出函数被调用");
    try {
        if (!window.supabaseClient) {
            console.error("Supabase客户端未初始化");
            alert("系统初始化失败，请刷新页面重试");
            return;
        }
        
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            console.error("登出API错误:", error);
            throw error;
        }
        
        console.log("登出成功，准备重定向");
        // 清除本地存储的会话数据
        localStorage.removeItem('sessionStartTime');
        
        // 登出成功后重定向到主页
        window.location.href = './index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to log out. Please try again.');
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    console.log("页面加载完成");
    
    // 检查Supabase客户端是否可用
    if (!window.supabaseClient) {
        console.error("Supabase客户端未初始化");
        alert("系统初始化失败，请刷新页面重试");
        return;
    }
    
    console.log("Supabase客户端已初始化");
    
    // 首先检查会话状态
    if (!await checkSession()) {
        return;
    }

    // 获取当前用户信息
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    
    if (error || !user) {
        window.location.href = './index.html';
        return;
    }

    // 启动会话刷新机制
    refreshSession();

    // 更新用户信息
    updateUserInfo(user);
    
    // 初始化页面功能
    initLogout();
    initSidebars();
    loadUserActivities();
    loadUserProjects();
    initFileUploadListener();
    loadUserFiles();
});

// 更新用户信息显示
function updateUserInfo(user) {
    const userEmail = document.getElementById('user-email');
    const membershipStatus = document.getElementById('membership-status');
    
    if (userEmail) {
        userEmail.textContent = user.email;
    }
    
    if (membershipStatus) {
        // 这里可以根据实际的用户数据判断是否为付费用户
        if (user.is_paid_member) {
            membershipStatus.textContent = `Member since: ${new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`;
            membershipStatus.classList.remove('free');
            membershipStatus.classList.add('pro');
        } else {
            membershipStatus.textContent = 'Free Member';
            membershipStatus.classList.add('free');
            membershipStatus.classList.remove('pro');
        }
    }
}

// 初始化登出功能
function initLogout() {
    console.log("初始化登出功能");
    const logoutBtn = document.getElementById('logout-btn');
    console.log("登出按钮元素:", logoutBtn);
    
    if (logoutBtn) {
        // 直接设置onclick属性
        logoutBtn.onclick = window.handleLogout;
        console.log("登出按钮事件监听器已添加");
    } else {
        console.error("找不到登出按钮元素");
    }
}

// 初始化侧边栏功能
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

// 加载用户活动
async function loadUserActivities() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    try {
        // 从Supabase获取用户活动数据
        const { data: activities, error } = await window.supabaseClient
            .from('user_activities')
            .select('*')
            .eq('user_id', (await window.supabaseClient.auth.getUser()).data.user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                <div class="activity-details">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-date">${formatDate(activity.created_at)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activities:', error);
        activityList.innerHTML = '<p>Failed to load activities</p>';
    }
}

// 获取活动图标
function getActivityIcon(type) {
    const icons = {
        'upload': '📤',
        'analysis': '📊',
        'visualization': '📈',
        'file_delete': '🗑️',
        'file_update': '🔄'
    };
    return icons[type] || '📝';
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60000) {
        return 'Just now';
    }
    // 小于1小时
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    // 小于24小时
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    // 小于7天
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    // 其他情况显示具体日期
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// 监听文件上传事件
async function handleFileUpload(file) {
    try {
        const user = (await window.supabaseClient.auth.getUser()).data.user;
        if (!user) throw new Error('User not authenticated');

        // 记录文件上传活动
        const { error: activityError } = await window.supabaseClient
            .from('user_activities')
            .insert([
                {
                    user_id: user.id,
                    type: 'upload',
                    description: `Uploaded file: ${file.name}`,
                    file_type: file.type,
                    file_size: file.size
                }
            ]);

        if (activityError) throw activityError;

        // 刷新活动列表
        loadUserActivities();
    } catch (error) {
        console.error('Error recording file upload:', error);
    }
}

// 初始化文件上传监听
function initFileUploadListener() {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
    }
}

// 加载用户项目
function loadUserProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;

    const colors = ['blue', 'orange', 'pink', 'purple', 'green', 'red'];
    
    try {
        const projects = [
            { name: 'Data Analysis 1', description: 'Statistical analysis project', date: '2024-01-15' },
            { name: 'Visualization Study', description: 'Data visualization project', date: '2024-01-10' },
            { name: 'Research Project', description: 'Academic research data', date: '2024-01-05' }
        ];

        projectsGrid.innerHTML = projects.map(project => `
            <div class="project-card blue" data-colors='${JSON.stringify(colors)}'>
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="project-date">Last modified: ${project.date}</div>
            </div>
        `).join('');

        // 添加点击事件处理
        const projectCards = projectsGrid.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            // 单击切换颜色
            card.addEventListener('click', function(e) {
                const colors = JSON.parse(this.dataset.colors);
                const currentColor = colors.find(color => this.classList.contains(color));
                const currentIndex = colors.indexOf(currentColor);
                const nextIndex = (currentIndex + 1) % colors.length;
                
                // 移除当前颜色
                this.classList.remove(currentColor);
                // 添加下一个颜色
                this.classList.add(colors[nextIndex]);
            });

            // 双击打开项目
            card.addEventListener('dblclick', function(e) {
                // TODO: 实现项目打开逻辑
                console.log('Opening project:', this.querySelector('h3').textContent);
            });
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsGrid.innerHTML = '<p>Failed to load projects</p>';
    }
}

// 在现有代码后添加文件管理相关功能

async function loadUserFiles() {
    const filesList = document.getElementById('files-list');
    if (!filesList) return;

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: files, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(user.id);

        if (error) throw error;

        if (!files || files.length === 0) {
            filesList.innerHTML = '<p class="text-center text-gray-500">No files uploaded yet</p>';
            return;
        }

        filesList.innerHTML = files.map(file => {
            // 从文件名中提取原始文件名
            const originalName = file.name.split('_').slice(1).join('_');
            const fileExt = originalName.split('.').pop().toLowerCase();
            
            // 获取文件图标
            const iconClass = getFileIconClass(fileExt);
            
            return `
                <div class="file-item">
                    <div class="file-info">
                        <i class="fas ${iconClass} file-icon"></i>
                        <div class="file-details">
                            <span class="file-name">${originalName}</span>
                            <span class="file-meta">
                                ${formatFileSize(file.metadata?.size || 0)} • ${formatDate(file.created_at)}
                            </span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="file-action-btn download" onclick="downloadFile('${user.id}/${file.name}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="file-action-btn delete" onclick="deleteFile('${user.id}/${file.name}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading files:', error);
        filesList.innerHTML = '<p class="text-center text-red-500">Failed to load files</p>';
    }
}

// 根据文件扩展名获取对应的图标类
function getFileIconClass(ext) {
    const iconMap = {
        'csv': 'fa-file-csv',
        'xlsx': 'fa-file-excel',
        'xls': 'fa-file-excel',
        'pdf': 'fa-file-pdf',
        'docx': 'fa-file-word',
        'doc': 'fa-file-word',
        'pptx': 'fa-file-powerpoint',
        'ppt': 'fa-file-powerpoint',
        'json': 'fa-file-code'
    };
    return iconMap[ext] || 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 修改下载文件函数
async function downloadFile(path) {
    try {
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .download(path);

        if (error) throw error;

        // 创建下载链接
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = path.split('/').pop(); // 使用文件名作为下载名称
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download file');
    }
}

// 修改删除文件函数
async function deleteFile(path) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
        const { error } = await window.supabaseClient
            .storage
            .from('user_files')
            .remove([path]);

        if (error) throw error;

        // 重新加载文件列表
        loadUserFiles();
    } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file');
    }
} 
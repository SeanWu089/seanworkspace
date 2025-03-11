// 统一的数据读取和解析函数
async function processDataFile(file, isUpload = false) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    let headers = [];
                    let types = [];
                    let rawData = null;
                    
                    // 根据文件类型处理数据
                    if (file.name.endsWith('.csv')) {
                        const csvContent = e.target.result;
                        const lines = csvContent.split('\n');
                        if (lines.length > 0) {
                            headers = lines[0].split(',').map(h => h.trim());
                            types = analyzeDataTypes(lines.slice(1), headers);
                            rawData = {
                                headers: headers,
                                rows: lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
                            };
                        }
                    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        const workbook = XLSX.read(e.target.result, {type: 'binary'});
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
                        if (data.length > 0) {
                            headers = data[0];
                            types = analyzeDataTypes(data.slice(1), headers);
                            rawData = {
                                headers: headers,
                                rows: data.slice(1)
                            };
                        }
                    }
                    
                    // 如果是上传的文件，保存到Supabase
                    if (isUpload) {
                        const session = await checkUserAuth();
                        if (session) {
                            const fileName = `${Date.now()}_${file.name}`;
                            const filePath = `${session.user.id}/${fileName}`;
                            
                            const { error: uploadError } = await window.supabaseClient
                                .storage
                                .from('user_files')
                                .upload(filePath, file);

                            if (uploadError) throw uploadError;
                        }
                    }
                    
                    // 更新预览表格
                    updatePreviewTable(types, rawData);
                    resolve({types, rawData});
                } catch (error) {
                    console.error('Error processing file data:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        } catch (error) {
            console.error('Error in processDataFile:', error);
            reject(error);
        }
    });
}

// 分析数据类型的辅助函数
function analyzeDataTypes(rows, headers) {
    const types = headers.map(header => ({
        name: header.trim(),
        type: 'unknown'
    }));

    // 分析每一列的数据类型
    rows.forEach(row => {
        headers.forEach((header, index) => {
            const value = row[index];
            if (value !== undefined && value !== null) {
                const currentType = getValueType(value);
                if (types[index].type === 'unknown') {
                    types[index].type = currentType;
                } else if (types[index].type !== currentType) {
                    types[index].type = 'mixed';
                }
            }
        });
    });

    return types;
}

// !获取值的数据类型
// ?这里感觉有问题
function getValueType(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'float';
    }
    if (!isNaN(Date.parse(value))) {
        return 'date';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    return 'string';
}

// 更新预览表格
function updatePreviewTable(data, rawData = null) {
    console.log('Updating preview table with data:', data);

    const previewEmptyState = document.getElementById('preview-empty-state');
    const previewContent = document.getElementById('preview-content');
    const fullPreviewContent = document.getElementById('full-preview-content');
    
    if (!data || data.length === 0) {
        // 从 localStorage 获取之前保存的预览数据
        const savedPreview = localStorage.getItem('previewData');
        if (savedPreview) {
            try {
                const savedData = JSON.parse(savedPreview);
                data = savedData.types || savedData;
                rawData = savedData.rawData;
            } catch (error) {
                console.error('Error parsing saved preview data:', error);
                if (previewEmptyState) previewEmptyState.style.display = 'block';
                if (previewContent) previewContent.style.display = 'none';
                if (fullPreviewContent) fullPreviewContent.style.display = 'none';
                return;
            }
        } else {
            if (previewEmptyState) previewEmptyState.style.display = 'block';
            if (previewContent) previewContent.style.display = 'none';
            if (fullPreviewContent) fullPreviewContent.style.display = 'none';
            return;
        }
    }

    if (previewEmptyState) previewEmptyState.style.display = 'none';
    if (previewContent) previewContent.style.display = 'block';
    
    // 更新类型预览表格
    const tbody = document.querySelector('#preview-table tbody');
    if (tbody) {
        tbody.innerHTML = data.map(col =>
            `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
        ).join('');
        
        // 保存预览数据到 localStorage
        localStorage.setItem('previewData', JSON.stringify({
            types: data,
            rawData: rawData
        }));
        
        // 显示右侧边栏
        toggleSidebar('right', true);
        
        // 如果有原始数据，更新完整预览表格
        if (rawData && fullPreviewContent) {
            updateFullPreviewTable(rawData);
        }
    }
}

// 更新完整数据预览表格
function updateFullPreviewTable(rawData) {
    const fullPreviewContent = document.getElementById('full-preview-content');
    if (!fullPreviewContent || !rawData) return;
    
    const fullPreviewTable = document.getElementById('full-preview-table');
    if (!fullPreviewTable) return;
    
    // 创建表头
    const thead = fullPreviewTable.querySelector('thead');
    thead.innerHTML = `<tr>${rawData.headers.map(header => `<th>${header}</th>`).join('')}</tr>`;
    
    // 创建表格内容
    const tbody = fullPreviewTable.querySelector('tbody');
    tbody.innerHTML = rawData.rows.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    
    // 默认隐藏完整预览
    fullPreviewContent.style.display = 'none';
}

// 统一的侧边栏切换函数
function toggleSidebar(side, forceShow = null) {
    const sidebar = document.getElementById(`${side}Sidebar`);
    const toggle = document.getElementById(`${side}Toggle`);
    
    if (!sidebar || !toggle) return;
    
    if (forceShow === true) {
        sidebar.classList.add('show');
        toggle.classList.add('rotated');
    } else if (forceShow === false) {
        sidebar.classList.remove('show');
        toggle.classList.remove('rotated');
    } else {
        sidebar.classList.toggle('show');
        toggle.classList.toggle('rotated');
    }
    
    // 关闭另一侧边栏
    const otherSide = side === 'left' ? 'right' : 'left';
    const otherSidebar = document.getElementById(`${otherSide}Sidebar`);
    const otherToggle = document.getElementById(`${otherSide}Toggle`);
    
    if (otherSidebar && otherSidebar.classList.contains('show')) {
        otherSidebar.classList.remove('show');
        if (otherToggle) otherToggle.classList.remove('rotated');
    }
    
    // 如果是右侧边栏且已经显示，检查是否需要展开完整预览
    if (side === 'right' && sidebar.classList.contains('show')) {
        const previewContent = document.getElementById('preview-content');
        const fullPreviewContent = document.getElementById('full-preview-content');
        
        if (previewContent && previewContent.style.display !== 'none' && fullPreviewContent) {
            // 如果是点击切换按钮且不是强制显示，则切换完整预览
            if (forceShow === null) {
                toggleFullPreview();
            }
        }
    }
}

// 切换完整预览显示
function toggleFullPreview() {
    const rightSidebar = document.getElementById('rightSidebar');
    const previewContent = document.getElementById('preview-content');
    const fullPreviewContent = document.getElementById('full-preview-content');
    
    if (!rightSidebar || !previewContent || !fullPreviewContent) return;
    
    // 如果完整预览已显示，则隐藏它并恢复边栏宽度
    if (fullPreviewContent.style.display === 'block') {
        fullPreviewContent.style.display = 'none';
        previewContent.style.display = 'block';
        rightSidebar.style.width = '300px';
    } else {
        // 否则显示完整预览并扩展边栏宽度
        fullPreviewContent.style.display = 'block';
        previewContent.style.display = 'none';
        rightSidebar.style.width = '66%';
    }
}

// 确保只在 DOM 加载完成后初始化一次
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebars);
} else {
    initSidebars();
}

// 初始化侧边栏功能
function initSidebars() {
    console.log('Initializing sidebars...');

    const leftSidebar = document.getElementById('leftSidebar');
    const leftToggle = document.getElementById('leftToggle');
    const rightSidebar = document.getElementById('rightSidebar');
    const rightToggle = document.getElementById('rightToggle');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const clearPreviewBtn = document.getElementById('clearPreviewBtn');

    console.log('Elements found:', {
        leftSidebar: !!leftSidebar,
        leftToggle: !!leftToggle,
        rightSidebar: !!rightSidebar,
        rightToggle: !!rightToggle,
        selectFileBtn: !!selectFileBtn,
        clearPreviewBtn: !!clearPreviewBtn
    });

    // 初始化各个组件
    if (leftToggle && leftSidebar) {
        initLeftSidebar(leftToggle, leftSidebar);
    }

    if (rightToggle && rightSidebar) {
        initRightSidebar(rightToggle, rightSidebar);
    }

    if (selectFileBtn) {
        initFileSelector(selectFileBtn);
    }

    if (clearPreviewBtn) {
        initClearPreviewButton(clearPreviewBtn);
    }

    // 检查是否有保存的预览数据
    checkSavedPreview();
}

// 初始化左侧边栏
function initLeftSidebar(toggle, sidebar) {
    toggle.onclick = function() {
        console.log('Left toggle clicked');
        sidebar.classList.toggle('show');
        this.classList.toggle('rotated');
        
        // 如果右侧边栏是打开的，关闭它
        const rightSidebar = document.getElementById('rightSidebar');
        const rightToggle = document.getElementById('rightToggle');
        if (rightSidebar && rightSidebar.classList.contains('show')) {
            rightSidebar.classList.remove('show');
            rightToggle.classList.remove('rotated');
        }
    };
}

// 初始化右侧边栏
function initRightSidebar(toggle, sidebar) {
    toggle.onclick = function() {
        console.log('Right toggle clicked');
        
        // 如果预览内容已显示，则切换完整预览
        const previewContent = document.getElementById('preview-content');
        if (previewContent && previewContent.style.display === 'block' && sidebar.classList.contains('show')) {
            toggleFullPreview();
        } else {
            // 否则正常切换边栏显示
            sidebar.classList.toggle('show');
            this.classList.toggle('rotated');
            
            // 如果左侧边栏是打开的，关闭它
            const leftSidebar = document.getElementById('leftSidebar');
            const leftToggle = document.getElementById('leftToggle');
            if (leftSidebar && leftSidebar.classList.contains('show')) {
                leftSidebar.classList.remove('show');
                leftToggle.classList.remove('rotated');
            }
        }
    };
}

// 初始化文件选择器
function initFileSelector(button) {
    button.addEventListener('click', async function() {
        try {
            // 检查用户是否已登录
            const session = await checkUserAuth();
            if (!session) {
                alert('请先登录以访问您的文件');
                return;
            }
            
            // 显示文件选择对话框
            showFileSelector(session.user.id);
        } catch (error) {
            console.error('Error initializing file selector:', error);
            alert('无法加载文件选择器: ' + error.message);
        }
    });
}

// 显示文件选择对话框
async function showFileSelector(userId) {
    try {
        // 创建对话框元素
        const dialog = document.createElement('div');
        dialog.className = 'file-selector-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>选择数据文件</h3>
                <div class="file-list" id="file-list">
                    <p class="loading-message">正在加载文件列表...</p>
                </div>
                <div class="dialog-buttons">
                    <button class="upload-new-btn">上传新文件</button>
                    <button class="close-btn">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 获取用户文件列表
        const { data: files, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(userId);
            
        if (error) throw error;
        
        const fileList = dialog.querySelector('#file-list');
        
        if (!files || files.length === 0) {
            fileList.innerHTML = '<p class="no-files-message">没有找到文件。请上传一个新文件。</p>';
        } else {
            // 过滤出支持的文件类型
            const supportedFiles = files.filter(file => 
                file.name.endsWith('.csv') || 
                file.name.endsWith('.xlsx') || 
                file.name.endsWith('.xls')
            );
            
            if (supportedFiles.length === 0) {
                fileList.innerHTML = '<p class="no-files-message">没有找到支持的数据文件。请上传 CSV 或 Excel 文件。</p>';
            } else {
                // 显示文件列表
                fileList.innerHTML = supportedFiles.map(file => {
                    const fileName = file.name.split('_').slice(1).join('_'); // 移除时间戳前缀
                    return `
                        <div class="file-item" data-path="${userId}/${file.name}">
                            <div class="file-icon">${getFileIcon(file.name)}</div>
                            <div class="file-info">
                                <div class="file-name">${fileName}</div>
                                <div class="file-date">上传于 ${new Date(file.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // 添加文件点击事件
                fileList.querySelectorAll('.file-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const filePath = item.getAttribute('data-path');
                        await loadFileFromStorage(filePath);
                        dialog.remove();
                    });
                });
            }
        }
        
        // 添加上传新文件按钮事件
        dialog.querySelector('.upload-new-btn').addEventListener('click', () => {
            // 触发文件上传
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.click();
                dialog.remove();
            }
        });
        
        // 添加关闭按钮事件
        dialog.querySelector('.close-btn').addEventListener('click', () => {
            dialog.remove();
        });
        
    } catch (error) {
        console.error('Error showing file selector:', error);
        alert('无法加载文件列表: ' + error.message);
    }
}

// 从存储中加载文件
async function loadFileFromStorage(filePath) {
    try {
        // 获取文件 URL
        const { data: { signedURL }, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .createSignedUrl(filePath, 60); // 60秒有效期
            
        if (error) throw error;
        
        // 下载文件
        const response = await fetch(signedURL);
        const blob = await response.blob();
        
        // 创建文件对象
        const fileName = filePath.split('/').pop().split('_').slice(1).join('_'); // 移除时间戳前缀
        const file = new File([blob], fileName, { type: blob.type });
        
        // 处理文件
        await processDataFile(file);
        
    } catch (error) {
        console.error('Error loading file from storage:', error);
        alert('无法加载文件: ' + error.message);
    }
}

// 获取文件图标
function getFileIcon(fileName) {
    if (fileName.endsWith('.csv')) {
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M10 12v4"/><path d="M14 12v4"/></svg>';
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M8 11h8"/><path d="M8 15h8"/><path d="M8 19h8"/></svg>';
    }
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>';
}

// 初始化清除预览按钮
function initClearPreviewButton(button) {
    button.addEventListener('click', function() {
        // 清除预览数据
        localStorage.removeItem('previewData');
        
        // 隐藏预览内容
        const previewEmptyState = document.getElementById('preview-empty-state');
        const previewContent = document.getElementById('preview-content');
        const fullPreviewContent = document.getElementById('full-preview-content');
        
        if (previewEmptyState) previewEmptyState.style.display = 'block';
        if (previewContent) previewContent.style.display = 'none';
        if (fullPreviewContent) fullPreviewContent.style.display = 'none';
        
        // 恢复边栏宽度
        const rightSidebar = document.getElementById('rightSidebar');
        if (rightSidebar) rightSidebar.style.width = '300px';
        
        // 关闭边栏
        toggleSidebar('right', false);
    });
}

// 检查保存的预览数据
function checkSavedPreview() {
    const savedPreview = localStorage.getItem('previewData');
    if (savedPreview) {
        try {
            const previewData = JSON.parse(savedPreview);
            updatePreviewTable(previewData.types || previewData, previewData.rawData);
        } catch (error) {
            console.error('Error loading saved preview:', error);
            localStorage.removeItem('previewData');
        }
    }
}

// 检查用户认证状态
async function checkUserAuth() {
    try {
        // 确保 supabaseClient 已初始化
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return null;
        }
        
        // 使用全局辅助函数或直接调用
        if (window.supabaseAuth) {
            const { data: { session }, error } = await window.supabaseAuth.getSession();
            if (error) throw error;
            return session;
        } else {
            // 直接使用 supabaseClient
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error) throw error;
            return session;
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        return null;
    }
}
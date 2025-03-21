// 统一的数据读取和解析函数
async function processDataFile(fileData, isUpload = false) {
    return new Promise((resolve, reject) => {
        try {
            // 检查文件是否为Blob或File对象
            if (!fileData || !(fileData instanceof Blob)) {
                console.error('Invalid file object:', fileData);
                reject(new Error('Invalid file object'));
                return;
            }
            
            // 获取文件名（如果是Blob，可能需要从上下文中获取）
            const fileName = fileData.name || 'downloaded-file';
            console.log('Processing file data, type:', fileData.type, 'size:', fileData.size);
            
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    let headers = [];
                    let types = [];
                    let rawData = null;
                    
                    // 根据文件类型处理数据
                    if (fileData.type === 'text/csv' || fileName.endsWith('.csv')) {
                        console.log('Processing CSV file');
                        const csvContent = e.target.result;
                        const lines = csvContent.split('\n');
                        if (lines.length > 0) {
                            headers = lines[0].split(',').map(h => h.trim());
                            types = analyzeDataTypes(lines.slice(1), headers);
                            rawData = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
                        }
                    } else if (fileData.type.includes('excel') || 
                              fileName.endsWith('.xlsx') || 
                              fileName.endsWith('.xls')) {
                        console.log('Processing Excel file');
                        // 确保XLSX对象存在
                        if (typeof XLSX === 'undefined') {
                            throw new Error('XLSX library not loaded');
                        }
                        
                        const workbook = XLSX.read(e.target.result, {type: 'binary'});
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
                        if (data.length > 0) {
                            headers = data[0];
                            types = analyzeDataTypes(data.slice(1), headers);
                            rawData = data.slice(1);
                        }
                    } else {
                        throw new Error('Unsupported file format: ' + fileData.type);
                    }
                    
                    // 如果是上传的文件，保存到Supabase
                    if (isUpload) {
                        console.log('Uploading file to Supabase');
                        const session = await checkUserAuth();
                        if (session) {
                            const fileName = `${Date.now()}_${fileData.name}`;
                            const filePath = `${session.user.id}/${fileName}`;
                            
                            const { error: uploadError } = await window.supabaseClient
                                .storage
                                .from('user_files')
                                .upload(filePath, fileData);

                            if (uploadError) throw uploadError;
                        } else {
                            throw new Error('User not authenticated');
                        }
                    }
                    
                    // 更新预览表格
                    updatePreviewTable(types, rawData);
                    resolve({ types, rawData, headers });
                } catch (error) {
                    console.error('Error processing file data:', error);
                    reject(error);
                }
            };
            
            reader.onerror = (event) => {
                console.error('FileReader error:', event);
                reject(reader.error || new Error('File reading failed'));
            };
            
            if (fileData.type === 'text/csv' || fileName.endsWith('.csv')) {
                reader.readAsText(fileData);
            } else {
                reader.readAsBinaryString(fileData);
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
    
    if (!data || data.length === 0) {
        // 从 localStorage 获取之前保存的预览数据
        const savedPreview = localStorage.getItem('previewData');
        if (savedPreview) {
            data = JSON.parse(savedPreview);
        } else {
            if (previewEmptyState) previewEmptyState.style.display = 'block';
            if (previewContent) previewContent.style.display = 'none';
            return;
        }
    }

    if (previewEmptyState) previewEmptyState.style.display = 'none';
    if (previewContent) previewContent.style.display = 'block';
    
    const tbody = document.querySelector('#preview-table tbody');
    if (tbody) {
        tbody.innerHTML = data.map(col =>
            `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
        ).join('');
        
        // 保存预览数据到 localStorage
        localStorage.setItem('previewData', JSON.stringify(data));
        
        // 如果有原始数据，也保存到 localStorage
        if (rawData) {
            localStorage.setItem('rawData', JSON.stringify(rawData));
        }
        
        // 显示右侧边栏
        toggleSidebar('right', true);
    }
}

// 统一的侧边栏切换函数
function toggleSidebar(side, forceShow = null) {
    const sidebar = document.getElementById(`${side}Sidebar`);
    const toggle = document.getElementById(`${side}Toggle`);
    
    if (!sidebar || !toggle) return;
    
    // 检查是否是右侧边栏且有数据预览
    const hasDataPreview = document.getElementById('preview-content') && 
                          document.getElementById('preview-content').style.display !== 'none';
    
    // 右侧边栏的特殊处理
    if (side === 'right') {
        // 如果是强制显示或隐藏，直接执行
        if (forceShow === true) {
            sidebar.classList.add('show');
            toggle.classList.add('rotated');
            return;
        } else if (forceShow === false) {
            sidebar.classList.remove('show');
            toggle.classList.remove('rotated');
            sidebar.classList.remove('expanded');
            return;
        }
        
        // 如果右侧边栏已经显示
        if (sidebar.classList.contains('show')) {
            // 如果有数据预览且已经是展开状态，则隐藏整个侧边栏
            if (hasDataPreview && sidebar.classList.contains('expanded')) {
                sidebar.classList.remove('expanded');
                sidebar.classList.remove('show');
                toggle.classList.remove('rotated');
                // 恢复简洁预览
                showCompactPreview();
            } else if (hasDataPreview) {
                // 如果有数据预览但不是展开状态，则展开为大视图
                sidebar.classList.add('expanded');
                // 显示完整数据表格
                showFullDataTable();
            } else {
                // 如果没有数据预览，则直接隐藏侧边栏
                sidebar.classList.remove('show');
                toggle.classList.remove('rotated');
            }
        } else {
            // 如果右侧边栏隐藏，则显示它（小窗状态）
            sidebar.classList.add('show');
            toggle.classList.add('rotated');
            sidebar.classList.remove('expanded'); // 确保不是展开状态
            showCompactPreview(); // 确保显示简洁预览
        }
        
        // 如果左侧边栏是打开的，关闭它
        const leftSidebar = document.getElementById('leftSidebar');
        const leftToggle = document.getElementById('leftToggle');
        if (leftSidebar && leftSidebar.classList.contains('show')) {
            leftSidebar.classList.remove('show');
            if (leftToggle) leftToggle.classList.remove('rotated');
        }
        
        return;
    }
    
    // 左侧边栏的处理保持不变
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
    
    // 如果左侧边栏打开，关闭右侧边栏
    if (side === 'left' && sidebar.classList.contains('show')) {
        const rightSidebar = document.getElementById('rightSidebar');
        const rightToggle = document.getElementById('rightToggle');
        if (rightSidebar && rightSidebar.classList.contains('show')) {
            rightSidebar.classList.remove('show');
            if (rightToggle) rightToggle.classList.remove('rotated');
            rightSidebar.classList.remove('expanded');
            showCompactPreview();
        }
    }
}

// 显示完整数据表格
function showFullDataTable() {
        const previewContent = document.getElementById('preview-content');
    if (!previewContent) return;
    
    // 获取保存的原始数据
    const rawDataStr = localStorage.getItem('rawData');
    if (!rawDataStr) return;
    
    try {
        const rawData = JSON.parse(rawDataStr);
        const previewDataStr = localStorage.getItem('previewData');
        const columnInfo = previewDataStr ? JSON.parse(previewDataStr) : [];
        
        // 创建完整数据表格
        const fullTableContainer = document.createElement('div');
        fullTableContainer.id = 'full-data-table-container';
        fullTableContainer.className = 'full-data-table-container';
        
        const fullTable = document.createElement('table');
        fullTable.id = 'full-data-table';
        fullTable.className = 'full-data-table';
        
        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columnInfo.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.name;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        fullTable.appendChild(thead);
        
        // 创建表体
        const tbody = document.createElement('tbody');
        
        // 最多显示100行数据，避免过多数据导致性能问题
        const maxRows = Math.min(rawData.length, 100);
        
        for (let i = 0; i < maxRows; i++) {
            const row = document.createElement('tr');
            
            for (let j = 0; j < columnInfo.length; j++) {
                const td = document.createElement('td');
                td.textContent = rawData[i][j] !== undefined ? rawData[i][j] : '';
                row.appendChild(td);
            }
            
            tbody.appendChild(row);
        }
        
        fullTable.appendChild(tbody);
        fullTableContainer.appendChild(fullTable);
        
        // 隐藏简洁预览
        const compactPreview = document.getElementById('preview-table');
        if (compactPreview) {
            compactPreview.style.display = 'none';
        }
        
        // 添加完整表格到预览内容
        previewContent.appendChild(fullTableContainer);
        
    } catch (error) {
        console.error('Error showing full data table:', error);
    }
}

// 显示简洁预览
function showCompactPreview() {
    const fullTableContainer = document.getElementById('full-data-table-container');
    if (fullTableContainer) {
        fullTableContainer.remove();
    }
    
    const compactPreview = document.getElementById('preview-table');
    if (compactPreview) {
        compactPreview.style.display = 'table';
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

    // 确保右侧边栏默认隐藏
    if (rightSidebar) {
        rightSidebar.classList.remove('show');
        if (rightToggle) rightToggle.classList.remove('rotated');
    }

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

    // 检查是否有保存的预览数据，但不自动显示右侧边栏
    checkSavedPreviewWithoutShowing();
}

// 检查保存的预览数据但不显示右侧边栏
function checkSavedPreviewWithoutShowing() {
    const savedPreview = localStorage.getItem('previewData');
    if (savedPreview) {
        try {
            const previewData = JSON.parse(savedPreview);
            // 更新预览表格但不显示右侧边栏
            updatePreviewTableWithoutShowing(previewData);
        } catch (error) {
            console.error('Error loading saved preview:', error);
            localStorage.removeItem('previewData');
        }
    }
}

// 更新预览表格但不显示右侧边栏
function updatePreviewTableWithoutShowing(data, rawData = null) {
    console.log('Updating preview table with data:', data);

    const previewEmptyState = document.getElementById('preview-empty-state');
    const previewContent = document.getElementById('preview-content');
    
    if (!data || data.length === 0) {
        // 从 localStorage 获取之前保存的预览数据
        const savedPreview = localStorage.getItem('previewData');
        if (savedPreview) {
            data = JSON.parse(savedPreview);
        } else {
            if (previewEmptyState) previewEmptyState.style.display = 'block';
            if (previewContent) previewContent.style.display = 'none';
            return;
        }
    }

    if (previewEmptyState) previewEmptyState.style.display = 'none';
    if (previewContent) previewContent.style.display = 'block';
    
    const tbody = document.querySelector('#preview-table tbody');
    if (tbody) {
        tbody.innerHTML = data.map(col =>
            `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
        ).join('');
        
        // 保存预览数据到 localStorage
        localStorage.setItem('previewData', JSON.stringify(data));
        
        // 如果有原始数据，也保存到 localStorage
        if (rawData) {
            localStorage.setItem('rawData', JSON.stringify(rawData));
        }
        
        // 不自动显示右侧边栏
        // toggleSidebar('right', true); - 移除这一行
    }
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
            // 确保右侧边栏不是展开状态
            rightSidebar.classList.remove('expanded');
            // 恢复简洁预览
            showCompactPreview();
        }
    };
}

// 初始化右侧边栏
function initRightSidebar(toggle, sidebar) {
    toggle.onclick = function() {
        console.log('Right toggle clicked');
        toggleSidebar('right');
    };
}

// 初始化文件选择器
function initFileSelector(button) {
    button.addEventListener('click', async function() {
        try {
            // 检查用户是否已登录
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) {
                alert('请先登录以访问您的文件');
                return;
            }
            
            // 创建文件选择器对话框
            createFileSelector(session.user.id);
        } catch (error) {
            console.error('Error initializing file selector:', error);
            alert('无法加载文件列表，请稍后再试');
        }
    });
}

// 初始化清除预览按钮
function initClearPreviewButton(button) {
    button.addEventListener('click', function() {
        // 清除预览数据
        localStorage.removeItem('previewData');
        localStorage.removeItem('rawData');
        
        // 隐藏预览内容，显示空状态
        const previewEmptyState = document.getElementById('preview-empty-state');
        const previewContent = document.getElementById('preview-content');
        
        if (previewEmptyState) previewEmptyState.style.display = 'block';
        if (previewContent) {
            previewContent.style.display = 'none';
            
            // 移除完整数据表格
            const fullTableContainer = document.getElementById('full-data-table-container');
            if (fullTableContainer) {
                fullTableContainer.remove();
            }
            
            // 恢复简洁预览表格显示
            const compactPreview = document.getElementById('preview-table');
            if (compactPreview) {
                compactPreview.style.display = 'table';
            }
        }
        
        // 确保右侧边栏不是展开状态
        const rightSidebar = document.getElementById('rightSidebar');
        if (rightSidebar) {
            rightSidebar.classList.remove('expanded');
        }
    });
}

// 创建文件选择器对话框
async function createFileSelector(userId) {
    // 创建对话框容器
        const dialog = document.createElement('div');
        dialog.className = 'file-selector-dialog';
    
    // 创建对话框内容
    const content = document.createElement('div');
    content.className = 'dialog-content';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = '选择数据文件';
    content.appendChild(title);
    
    // 添加文件列表容器
    const fileListContainer = document.createElement('div');
    fileListContainer.className = 'file-list';
    
    // 加载文件列表
    try {
        // 显示加载中提示
        fileListContainer.innerHTML = '<p>加载文件列表中...</p>';
        content.appendChild(fileListContainer);
        
        // 从Supabase获取文件列表
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(userId);
            
        if (error) throw error;
        
        // 清空加载提示
        fileListContainer.innerHTML = '';
        
            // 过滤出支持的文件类型
        const supportedFiles = data.filter(file => 
                file.name.endsWith('.csv') || 
                file.name.endsWith('.xlsx') || 
                file.name.endsWith('.xls')
            );
            
            if (supportedFiles.length === 0) {
            fileListContainer.innerHTML = '<p class="no-files-message">没有找到支持的数据文件<br>（支持的格式：CSV, XLSX, XLS）</p>';
            } else {
            // 为每个文件创建列表项
            supportedFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                // 文件图标
                const fileIcon = document.createElement('div');
                fileIcon.className = 'file-icon';
                
                // 根据文件类型设置不同的图标
                if (file.name.endsWith('.csv')) {
                    fileIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19H8V18H10V19M10,17H8V16H10V17M10,15H8V14H10V15M14,19H12V18H14V19M14,17H12V16H14V17M14,15H12V14H14V15Z" /></svg>';
                } else {
                    fileIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6,2H14L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M13,3.5V9H18.5L13,3.5M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M10,17L15,14L10,11V17Z" /></svg>';
                }
                
                fileItem.appendChild(fileIcon);
                
                // 文件信息
                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';
                
                // 文件名
                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = file.name.replace(/^\d+_/, ''); // 移除时间戳前缀
                fileInfo.appendChild(fileName);
                
                // 文件日期
                const fileDate = document.createElement('div');
                fileDate.className = 'file-date';
                fileDate.textContent = new Date(file.created_at).toLocaleString();
                fileInfo.appendChild(fileDate);
                
                fileItem.appendChild(fileInfo);
        
                // 点击文件项时的处理
                fileItem.addEventListener('click', async () => {
                    try {
                        // 显示加载中提示
                        fileListContainer.innerHTML = '<p>加载文件数据中...</p>';
                        
                        // 从Supabase下载文件
                        console.log('Downloading file:', file.name);
                        const { data: fileData, error: downloadError } = await window.supabaseClient
                            .storage
                            .from('user_files')
                            .download(`${userId}/${file.name}`);
                        
                        if (downloadError) {
                            console.error('Download error:', downloadError);
                            throw downloadError;
                        }
                        
                        if (!fileData) {
                            throw new Error('No file data received');
                        }
                        
                        console.log('File downloaded successfully, size:', fileData.size, 'type:', fileData.type);
                        
                        // 为Blob添加name属性
                        fileData.name = file.name;
                        
                        // 处理文件数据
                        await processDataFile(fileData);
                        
                        // 关闭对话框
                        document.body.removeChild(dialog);
                    } catch (error) {
                        console.error('Error loading file:', error);
                        fileListContainer.innerHTML = '<p class="error-message">无法加载文件: ' + error.message + '</p>';
                    }
                });
                
                fileListContainer.appendChild(fileItem);
            });
        }
    } catch (error) {
        console.error('Error fetching files:', error);
        fileListContainer.innerHTML = '<p class="no-files-message">无法加载文件列表，请稍后再试</p>';
    }
    
    content.appendChild(fileListContainer);
    
    // 添加按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';
    
    // 添加上传新文件按钮
    const uploadButton = document.createElement('button');
    uploadButton.className = 'upload-new-btn';
    uploadButton.textContent = '上传新文件';
    uploadButton.addEventListener('click', () => {
        // 触发文件上传
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.click();
        }
        // 关闭对话框
        document.body.removeChild(dialog);
    });
    buttonContainer.appendChild(uploadButton);
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    buttonContainer.appendChild(closeButton);
    
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    
    // 添加对话框到页面
    document.body.appendChild(dialog);
    
    // 点击对话框外部关闭对话框
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
        }
    });
}

// 检查用户认证状态
async function checkUserAuth() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
            return session;
    } catch (error) {
        console.error('Error checking auth:', error);
        return null;
    }
}
// 用户认证状态管理
async function checkUserAuth() {
    try {
        // 确保 supabaseClient 存在
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return null;
        }

        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) {
            console.error('Auth check error:', error);
            return null;
        }
        return session;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// 更新UI根据登录状态
async function updateUIBasedOnAuth() {
    try {
        const session = await checkUserAuth();
        const rightToggle = document.getElementById('rightToggle');
        const selectFileBtn = document.getElementById('selectFileBtn');
        
        // 未登录时隐藏右侧边栏箭头，但始终显示文件选择按钮
        if (!session) {
            if (rightToggle) rightToggle.style.display = 'none';
            // 不再隐藏selectFileBtn，但会在点击时提示登录
        } else {
            if (rightToggle) rightToggle.style.display = 'block';
        }
        
        // 确保文件选择按钮始终可见
        if (selectFileBtn) selectFileBtn.style.display = 'block';
        
        // 根据登录状态更新 UI
        const loginButton = document.getElementById('open-login-button');
        const myAccountButton = document.getElementById('my-account-button');
        
        if (session) {
            if (loginButton) loginButton.style.display = 'none';
            if (myAccountButton) myAccountButton.style.display = 'block';
        } else {
            if (loginButton) loginButton.style.display = 'block';
            if (myAccountButton) myAccountButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// 统一的数据读取和解析函数
async function processDataFile(file, isUpload = false) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    let headers = [];
                    let types = [];
                    
                    // 根据文件类型处理数据
                    if (file.name.endsWith('.csv')) {
                        const csvContent = e.target.result;
                        const lines = csvContent.split('\n');
                        if (lines.length > 0) {
                            headers = lines[0].split(',').map(h => h.trim());
                            types = analyzeDataTypes(lines.slice(1), headers);
                        }
                    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        const workbook = XLSX.read(e.target.result, {type: 'binary'});
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
                        if (data.length > 0) {
                            headers = data[0];
                            types = analyzeDataTypes(data.slice(1), headers);
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
                    updatePreviewTable(types);
                    resolve(types);
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

// 获取值的数据类型
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
function updatePreviewTable(data) {
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
        
        // 显示右侧边栏
        toggleSidebar('right', true);
    }
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
}

// 这个函数已在前面重新定义

// 获取用户文件列表
async function fetchUserFiles() {
    try {
        const session = await checkUserAuth();
        if (!session) {
            console.log('No user logged in');
            return [];
        }

        // 从 user_files 表获取文件信息
        const { data, error } = await window.supabaseClient
            .from('user_files')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error fetching user files:', error);
        return [];
    }
}

// 添加 Supabase 客户端检查
function checkSupabaseInit() {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        return false;
    }
    return true;
}

// 修改文件选择器初始化
function initFileSelector(selectFileBtn) {
    if (!selectFileBtn || !checkSupabaseInit()) return;

    selectFileBtn.addEventListener('click', async function() {
        try {
            if (!checkSupabaseInit()) {
                throw new Error('Supabase client not initialized');
            }

            // 检查用户是否登录
            const session = await checkUserAuth();
            if (!session) {
                alert('Please login to access your files');
                return;
            }

            // 创建文件选择对话框
            const dialogHTML = `
                <div class="file-selector-dialog">
                    <div class="dialog-content">
                        <h3>Select a File</h3>
                        <div class="file-list"></div>
                        <div class="dialog-buttons">
                            <button class="upload-new-btn">Upload New File</button>
                            <button class="close-btn">Close</button>
                        </div>
                    </div>
                </div>
            `;

            // 添加对话框到页面
            document.body.insertAdjacentHTML('beforeend', dialogHTML);
            const dialog = document.querySelector('.file-selector-dialog');
            const fileList = dialog.querySelector('.file-list');
            const closeBtn = dialog.querySelector('.close-btn');
            const uploadNewBtn = dialog.querySelector('.upload-new-btn');

            // 获取用户文件列表 - 从数据库获取
            const files = await fetchUserFiles();

            // 过滤 CSV 和 Excel 文件
            const validFiles = files.filter(file => {
                const filename = file.filename || '';
                const ext = filename.split('.').pop().toLowerCase();
                return ['csv', 'xlsx', 'xls'].includes(ext);
            });

            // 显示文件列表
            if (validFiles.length === 0) {
                fileList.innerHTML = '<p class="no-files-message">No data files available. Please upload CSV or Excel files.</p>';
            } else {
                fileList.innerHTML = validFiles.map(file => `
                    <div class="file-item" data-file-id="${file.id}" data-storage-path="${file.storage_path}">
                        <div class="file-icon">
                            ${(file.filename || '').endsWith('.csv') ? '📊' : '📑'}
                        </div>
                        <div class="file-info">
                            <div class="file-name">${file.filename || 'Unnamed file'}</div>
                            <div class="file-date">${new Date(file.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                `).join('');

                // 添加文件点击事件 - 从Supabase存储获取文件并预览
                fileList.querySelectorAll('.file-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const fileId = item.dataset.fileId;
                        const storagePath = item.dataset.storagePath;
                        
                        try {
                            // 从 Supabase 存储获取文件
                            const { data, error: downloadError } = await window.supabaseClient
                                .storage
                                .from('user_files') // 存储桶名称
                                .download(storagePath);

                            if (downloadError) throw downloadError;

                            // 创建File对象进行处理
                            const fileName = item.querySelector('.file-name').textContent;
                            const fileExt = fileName.split('.').pop().toLowerCase();
                            const fileType = fileExt === 'csv' ? 'text/csv' : 
                                             fileExt === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                                             'application/vnd.ms-excel';
                            
                            const file = new File([data], fileName, { type: fileType });
                            
                            // 只进行预览，不上传
                            await processDataFile(file, false);
                            
                            // 更新文件的访问时间（可选）
                            await window.supabaseClient
                                .from('user_files')
                                .update({ last_accessed: new Date().toISOString() })
                                .eq('id', fileId);
                                
                            dialog.remove();
                        } catch (error) {
                            console.error('Error downloading file:', error);
                            alert('Failed to download file');
                        }
                    });
                });
            }

            // 上传新文件按钮事件
            uploadNewBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.xlsx,.xls';
                input.style.display = 'none';
                document.body.appendChild(input);

                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            // 上传文件到 Supabase 存储
                            const fileName = file.name;
                            const storageFilePath = `${session.user.id}/${Date.now()}_${fileName}`;
                            
                            // 1. 上传到存储
                            const { data: uploadData, error: uploadError } = await window.supabaseClient
                                .storage
                                .from('user_files')
                                .upload(storageFilePath, file);

                            if (uploadError) throw uploadError;
                            
                            // 2. 在 user_files 表中记录文件信息
                            const { data: fileData, error: fileError } = await window.supabaseClient
                                .from('user_files')
                                .insert([{
                                    user_id: session.user.id,
                                    filename: fileName,
                                    storage_path: storageFilePath,
                                    file_type: file.type,
                                    file_size: file.size
                                }])
                                .select('*');
                                
                            if (fileError) throw fileError;
                            
                            // 3. 处理文件以显示预览
                            await processDataFile(file, false);
                            
                            dialog.remove();
                            
                            // 成功提示
                            alert('File uploaded successfully');
                        } catch (error) {
                            console.error('Upload error:', error);
                            alert('Failed to upload file: ' + error.message);
                        }
                    }
                    document.body.removeChild(input);
                };

                input.click();
            });

            // 关闭按钮事件
            closeBtn.addEventListener('click', () => dialog.remove());

            // 点击背景关闭对话框
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) dialog.remove();
            });

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load files. Please try again.');
        }
    });
}

// 清除预览功能
function initClearPreviewButton(clearPreviewBtn) {
    if (!clearPreviewBtn) return;
    
    clearPreviewBtn.addEventListener('click', function() {
        const previewEmptyState = document.getElementById('preview-empty-state');
        const previewContent = document.getElementById('preview-content');
        
        if (previewEmptyState && previewContent) {
            previewEmptyState.style.display = 'block';
            previewContent.style.display = 'none';
            // 清除 localStorage 中的预览数据
            localStorage.removeItem('previewData');
            
            // 关闭右侧边栏
            toggleSidebar('right', false);
        }
    });
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
        sidebar.classList.toggle('show');
        this.classList.toggle('rotated');
        
        // 如果左侧边栏是打开的，关闭它
        const leftSidebar = document.getElementById('leftSidebar');
        const leftToggle = document.getElementById('leftToggle');
        if (leftSidebar && leftSidebar.classList.contains('show')) {
            leftSidebar.classList.remove('show');
            leftToggle.classList.remove('rotated');
        }
    };
}

// 检查保存的预览数据
function checkSavedPreview() {
    const savedPreview = localStorage.getItem('previewData');
    if (savedPreview) {
        try {
            const previewData = JSON.parse(savedPreview);
            updatePreviewTable(previewData);
        } catch (error) {
            console.error('Error loading saved preview:', error);
            localStorage.removeItem('previewData');
        }
    }
}
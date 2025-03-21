document.addEventListener('DOMContentLoaded', function() {
    // 获取所有必要的DOM元素
    const modelSelect = document.getElementById('modelSelect');
    const fileSelect = document.getElementById('fileSelect');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const selectedVariables = document.getElementById('selectedVariables');
    const modelInfos = {
        arima: document.getElementById('arimaDesc'),
        garch: document.getElementById('garchDesc'),
        ewma: document.getElementById('ewmaDesc')
    };

    // 获取URL参数中的模型类型
    const urlParams = new URLSearchParams(window.location.search);
    const modelType = urlParams.get('model');

    // 如果URL中包含模型参数，自动选择相应的模型
    if (modelType && modelSelect) {
        modelSelect.value = modelType;
        showModelDescription(modelType);
    }

    // 监听模型选择变化
    if (modelSelect) {
    modelSelect.addEventListener('change', function(e) {
        const selectedModel = e.target.value;
        showModelDescription(selectedModel);
        
        // 更新URL，不刷新页面
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('model', selectedModel);
        window.history.pushState({}, '', newUrl);
    });
    }

    // 搜索输入处理
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = e.target.value;
                if (query.length < 2) {
                    searchResults.classList.add('hidden');
                    return;
                }

                const results = await searchVariables(query);
                displaySearchResults(results);
            }, 300);
        });
    }

    // 初始化文件列表
    initializeFileList();

    // 初始化侧边栏
    if (typeof initializeSidebars === 'function') {
        initializeSidebars();
    }

    // 显示选中模型的描述
    function showModelDescription(modelType) {
        // 隐藏所有模型描述
        Object.values(modelInfos).forEach(info => {
            if (info) info.classList.add('hidden');
        });

        // 显示选中的模型描述
        if (modelType && modelInfos[modelType]) {
            modelInfos[modelType].classList.remove('hidden');
        }
    }
});

// 变量搜索和选择功能
async function searchVariables(query) {
    try {
        const { data, error } = await window.supabaseClient
            .from('time_series_variables')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error searching variables:', error);
        return [];
    }
}

// 获取变量数据
async function getVariableData(variableId) {
    try {
        const { data, error } = await supabase
            .from('time_series_data')
            .select('*')
            .eq('variable_id', variableId)
            .order('timestamp', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching variable data:', error);
        return null;
    }
}

// 显示搜索结果
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    searchResults.innerHTML = '';
    searchResults.classList.remove('hidden');

    results.forEach(variable => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.textContent = variable.name;
        div.addEventListener('click', () => selectVariable(variable));
        searchResults.appendChild(div);
    });
}

// 选择变量
async function selectVariable(variable) {
    const variableData = await getVariableData(variable.id);
    if (variableData) {
        // 添加到已选变量列表
        addSelectedVariable(variable);
        // 更新数据预览
        updateDataPreview(variableData);
    }
    searchInput.value = '';
    searchResults.classList.add('hidden');
}

// 添加已选变量
function addSelectedVariable(variable) {
    const div = document.createElement('div');
    div.className = 'selected-variable';
    div.innerHTML = `
        <span>${variable.name}</span>
        <button class="delete-variable" onclick="removeVariable('${variable.id}')">×</button>
    `;
    selectedVariables.appendChild(div);
}

// 修改初始化文件列表函数
async function initializeFileList() {
    try {
        const fileSelect = document.getElementById('fileSelect');
        if (!fileSelect) return;

        // 创建自定义下拉容器
        const customDropdown = document.createElement('div');
        customDropdown.className = 'custom-file-dropdown';
        
        // 创建选中项显示区域
        const selectedDisplay = document.createElement('div');
        selectedDisplay.className = 'selected-file';
        selectedDisplay.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file"></i>
                <span>Choose a file...</span>
            </div>
            <i class="fas fa-chevron-down dropdown-arrow"></i>
        `;

        // 创建文件列表容器
        const filesList = document.createElement('div');
        filesList.className = 'files-list hidden';

        // 获取当前用户
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session?.user) {
            console.log('No user logged in');
            return;
        }

        // 获取用户文件列表
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(session.user.id + '/');

        if (error) {
            console.error('Error fetching files:', error);
            return;
        }

        // 处理文件列表
        const uniqueFiles = new Map();
        data.forEach(file => {
            const displayName = file.name.replace(/^\d+_/, '');
            if (!uniqueFiles.has(displayName)) {
                uniqueFiles.set(displayName, file);
            }
        });

        // 添加文件选项
        Array.from(uniqueFiles.values()).forEach(file => {
            const displayName = file.name.replace(/^\d+_/, '');
            const fileSize = formatFileSize(file.metadata?.size || 0);
            const uploadDate = new Date(file.created_at).toLocaleDateString();
            
            // 确定文件图标
            let fileIcon = 'fa-file';
            if (displayName.endsWith('.csv')) fileIcon = 'fa-file-csv';
            else if (displayName.endsWith('.xlsx') || displayName.endsWith('.xls')) fileIcon = 'fa-file-excel';

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="file-icon fas ${fileIcon}"></i>
                    <div class="file-details">
                        <div class="file-name">${displayName}</div>
                        <div class="file-meta">${fileSize} • Uploaded on ${uploadDate}</div>
                    </div>
                </div>
            `;

            fileItem.addEventListener('click', () => {
                // 更新选中显示时保持箭头
                selectedDisplay.innerHTML = `
                    <div class="file-info">
                        <i class="file-icon fas ${fileIcon}"></i>
                        <div class="file-details">
                            <div class="file-name">${displayName}</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                `;
                
                // 隐藏下拉列表
                filesList.classList.add('hidden');
                selectedDisplay.querySelector('.dropdown-arrow').classList.remove('rotate');
                
                // 触发文件选择事件
                const event = new CustomEvent('fileSelected', {
                    detail: { fileName: file.name, displayName: displayName }
                });
                document.dispatchEvent(event);

                // 处理选中的文件
                processSelectedFile(file.name);
            });

            filesList.appendChild(fileItem);
        });

        // 组装下拉框
        customDropdown.appendChild(selectedDisplay);
        customDropdown.appendChild(filesList);

        // 替换原始select元素
        fileSelect.parentNode.replaceChild(customDropdown, fileSelect);

        // 添加点击事件处理
        selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            filesList.classList.toggle('hidden');
            selectedDisplay.querySelector('.dropdown-arrow').classList.toggle('rotate');
        });

        // 点击外部关闭下拉列表
        document.addEventListener('click', () => {
            filesList.classList.add('hidden');
            selectedDisplay.querySelector('.dropdown-arrow')?.classList.remove('rotate');
        });

    } catch (error) {
        console.error('Error initializing file list:', error);
    }
}

// 添加文件大小格式化函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 清空变量列表
function clearVariablesList() {
    const variablesList = document.getElementById('variablesList');
    if (variablesList) {
        variablesList.innerHTML = '';
    }
}

// 在 displayVariables 函数中修改变量项的创建逻辑
function getVariableTypeIcon(variable, sampleValue) {
    // 转换变量名为小写以便比较
    const varName = variable.toLowerCase();
    
    // 日期类型判断
    if (varName.includes('date') || 
        varName.includes('time') || 
        varName.includes('year') ||
        varName.includes('month') ||
        varName.includes('day')) {
        return '<i class="far fa-calendar-alt variable-icon date"></i>';
    }
    
    // 数值/连续型变量判断
    if (varName.includes('price') ||
        varName.includes('amount') ||
        varName.includes('value') ||
        varName.includes('rate') ||
        varName.includes('ratio') ||
        varName.includes('number') ||
        varName.includes('qty') ||
        varName.includes('quantity') ||
        varName.includes('age') ||
        varName.includes('score')) {
        return '<i class="fas fa-chart-line variable-icon continuous"></i>';
    }
    
    // 分类变量判断
    if (varName.includes('type') ||
        varName.includes('category') ||
        varName.includes('status') ||
        varName.includes('level') ||
        varName.includes('grade') ||
        varName.includes('group') ||
        varName.includes('class')) {
        return '<i class="fas fa-list variable-icon categorical"></i>';
    }
    
    // 文本变量判断
    if (varName.includes('name') ||
        varName.includes('description') ||
        varName.includes('comment') ||
        varName.includes('address') ||
        varName.includes('title') ||
        varName.includes('note')) {
        return '<i class="fas fa-font variable-icon text"></i>';
    }
    
    // 默认为分类变量
    return '<i class="fas fa-tag variable-icon categorical"></i>';
}

function displayVariables(variables, sampleData = {}) {
    const variablesList = document.getElementById('variablesList');
    if (!variablesList) return;

    variablesList.innerHTML = '';
    
    if (variables.length === 0) {
        variablesList.innerHTML = '<div class="no-variables">No variables found in the file</div>';
        return;
    }

    const listContainer = document.createElement('div');
    listContainer.className = 'variables-grid';

    variables.forEach(variable => {
        const div = document.createElement('div');
        div.className = 'variable-item';
        div.dataset.variable = variable;
        
        // 获取变量类型图标
        const icon = getVariableTypeIcon(variable, sampleData[variable]);
        
        div.innerHTML = `
            <div class="variable-content">
                ${icon}
                <span>${variable}</span>
            </div>
            <div class="variable-actions">
                <button class="select-btn" title="Select for analysis">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        
        // 添加点击事件
        div.querySelector('.select-btn').addEventListener('click', () => {
            div.classList.toggle('selected');
            updateTimeSeriesPreview(variable);
        });

        listContainer.appendChild(div);
    });

    variablesList.appendChild(listContainer);
}

// 变量拖拽功能
function initializeDragAndDrop() {
    const variableItems = document.querySelectorAll('.variable-item');
    const previewArea = document.getElementById('timeSeriesPreview');

    variableItems.forEach(item => {
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.dataset.variable);
        });
    });

    previewArea.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    previewArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        const variableName = e.dataTransfer.getData('text/plain');
        await updateTimeSeriesPreview(variableName);
    });
}

// 更新时间序列预览
async function updateTimeSeriesPreview(variableName) {
    const placeholder = document.getElementById('dataPreviewPlaceholder');
    const preview = document.getElementById('timeSeriesPreview');

    placeholder.classList.add('hidden');
    preview.classList.remove('hidden');

    // 这里添加绘制时间序列图表的逻辑
    // 使用 Chart.js 或其他图表库
}

// 添加文件处理函数
async function processSelectedFile(fileName) {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session?.user) {
            console.log('No user logged in');
            return;
        }

        // 从 Supabase 存储中获取文件
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .download(`${session.user.id}/${fileName}`);

        if (error) {
            throw error;
        }

        // 读取文件内容
        const fileContent = await data.text();
        let variables = [];

        // 根据文件类型处理数据
        if (fileName.endsWith('.csv')) {
            // 处理 CSV 文件
            const lines = fileContent.split('\n');
            if (lines.length > 0) {
                // 获取表头作为变量名
                variables = lines[0].split(',').map(header => header.trim());
            }
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // 处理 Excel 文件
            const workbook = XLSX.read(await data.arrayBuffer(), { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const headers = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0];
            variables = headers.map(header => header.toString().trim());
        }

        // 显示变量列表
        displayVariables(variables);

    } catch (error) {
        console.error('Error processing file:', error);
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeFileList();
}); 
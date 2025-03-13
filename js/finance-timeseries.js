// 将函数移到文件顶部，全局作用域
function showModelDescription(modelType) {
    const modelInfos = {
        arima: document.getElementById('arimaDesc'),
        garch: document.getElementById('garchDesc'),
        ewma: document.getElementById('ewmaDesc')
    };

    // 隐藏所有模型描述
    Object.values(modelInfos).forEach(info => {
        if (info) info.classList.add('hidden');
    });

    // 显示选中的模型描述
    if (modelType && modelInfos[modelType]) {
        modelInfos[modelType].classList.remove('hidden');
    }
}

// 添加 Railway 的基础 URL
const API_BASE_URL = 'https://seanholisticworkspace-production.up.railway.app';  // 你的 Railway URL

document.addEventListener('DOMContentLoaded', function() {
    // 获取所有必要的DOM元素
    const modelSelect = document.getElementById('modelSelect');
    const fileSelect = document.getElementById('fileSelect');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const selectedVariables = document.getElementById('selectedVariables');

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

    // 页面加载时测试API
    testAPI().then(result => {
        console.log('API connection test:', result.status === 'success' ? 'PASSED' : 'FAILED');
    });
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

// 恢复原始的文件选择逻辑，但修复错误
async function initializeFileList() {
    try {
        const fileSelect = document.getElementById('fileSelect');
        if (!fileSelect) {
            console.error('File select element not found');
            return;
        }

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

        // 清空现有选项
        while (fileSelect.firstChild) {
            fileSelect.removeChild(fileSelect.firstChild);
        }

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Choose a file...';
        fileSelect.appendChild(defaultOption);

        // 添加文件选项
        data.forEach(file => {
            const displayName = file.name.replace(/^\d+_/, '');
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = displayName;
            fileSelect.appendChild(option);
        });

        // 添加文件选择事件
        fileSelect.addEventListener('change', function() {
            const selectedFile = this.value;
            if (selectedFile) {
                processSelectedFile(selectedFile);
            }
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

// 获取变量类型图标
function getVariableTypeIcon(type) {
    switch (type) {
        case 'continuous':
            return '<i class="fas fa-chart-line variable-icon continuous"></i>';
        case 'categorical':
            return '<i class="fas fa-tags variable-icon categorical"></i>';
        case 'text':
            return '<i class="fas fa-font variable-icon text"></i>';
        case 'date':
            return '<i class="fas fa-calendar variable-icon date"></i>';
        default:
            return '<i class="fas fa-question variable-icon"></i>';
    }
}

// 显示变量列表
async function displayVariables(variables) {
    const variablesList = document.getElementById('variablesList');
    variablesList.innerHTML = '';
    
    if (!variables || Object.keys(variables).length === 0) {
        variablesList.innerHTML = '<div class="no-variables">No variables available</div>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'variables-grid';
    
    for (const [varName, varInfo] of Object.entries(variables)) {
        const varItem = document.createElement('div');
        varItem.className = 'variable-item';
        varItem.draggable = true;
        varItem.dataset.variable = varName;
        varItem.dataset.type = varInfo.type;
        
        varItem.innerHTML = `
            <div class="variable-content">
                ${getVariableTypeIcon(varInfo.type)}
                <span>${varName}</span>
            </div>
        `;
        
        // 添加拖拽事件监听器
        varItem.addEventListener('dragstart', handleDragStart);
        varItem.addEventListener('dragend', handleDragEnd);
        
        grid.appendChild(varItem);
    }
    
    variablesList.appendChild(grid);
}

// 初始化拖放功能
function initializeDragAndDrop() {
    const previewArea = document.getElementById('timeSeriesPreview');
    const placeholder = document.getElementById('dataPreviewPlaceholder');
    
    previewArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    previewArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        const variable = e.dataTransfer.getData('text/plain');
        await updateTimeSeriesPreview(variable);
    });
}

// 处理拖拽开始
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.variable);
    e.target.classList.add('dragging');
}

// 处理拖拽结束
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 更新时间序列预览
async function updateTimeSeriesPreview(variableName) {
    const previewArea = document.getElementById('timeSeriesPreview');
    const placeholder = document.getElementById('dataPreviewPlaceholder');
    
    try {
        const response = await fetch(`${API_BASE_URL}/finance/timeseries_plot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_id: currentFileId,
                variable_name: variableName
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            placeholder.classList.add('hidden');
            previewArea.classList.remove('hidden');
            
            // 解析并显示 Plotly 图表
            const plotData = JSON.parse(data.plot_data);
            Plotly.newPlot('timeSeriesPreview', plotData.data, plotData.layout);
        } else {
            throw new Error(data.message || 'Failed to create plot');
        }
    } catch (error) {
        console.error('Error updating time series preview:', error);
        // 显示错误信息
        placeholder.innerHTML = `<span>Error: ${error.message}</span>`;
        placeholder.classList.remove('hidden');
        previewArea.classList.add('hidden');
    }
}

// 处理文件选择
async function processSelectedFile(fileId) {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
            throw new Error('User not authenticated');
        }
        
        const filePath = `${userId}/${fileId}`;
        console.log('Processing file path:', filePath);
        
        // 使用 Railway URL
        const response = await fetch(`${API_BASE_URL}/data_type`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                file_path: filePath,
                user_id: userId 
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            await displayVariables(data.variables);
            initializeDragAndDrop();
        } else {
            throw new Error(data.message || 'Failed to get variable types');
        }
    } catch (error) {
        console.error('Error processing file:', error);
        const variablesList = document.getElementById('variablesList');
        if (variablesList) {
            variablesList.innerHTML = `
                <div class="error-message">
                    Error: ${error.message}
                    <br>
                    <small>Please check the console for more details.</small>
                </div>`;
        }
    }
}

// 添加测试函数，用于验证API是否工作
async function testAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/test`);
        
        // 检查response类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON but got ${contentType}`);
        }
        
        const data = await response.json();
        console.log('API test result:', data);
        return data;
    } catch (error) {
        console.error('API test failed:', error);
        // 失败不影响正常使用
        return { status: 'error', message: error.message };
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 获取URL参数中的模型类型
    const urlParams = new URLSearchParams(window.location.search);
    const modelType = urlParams.get('model');
    if (modelType) {
        showModelDescription(modelType);
    }
    
    // 初始化文件列表
    initializeFileList();
}); 
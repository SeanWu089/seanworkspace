// 将函数移到文件顶部，全局作用域
function showModelDescription(modelType) {
    console.log('showModelDescription called with:', modelType); // 添加调试日志
    
    const modelInfos = {
        auto: document.getElementById('autoDesc'),
        arima: document.getElementById('arimaDesc'),
        garch: document.getElementById('garchDesc'),
        ewma: document.getElementById('ewmaDesc')
    };
    
    const arimaParams = document.getElementById('arimaParams');
    const autoMode = document.getElementById('autoMode');
    
    console.log('Auto mode checked:', autoMode?.checked); // 检查 autoMode 状态
    
    // 先检查元素是否存在
    if (!arimaParams) {
        console.error('arimaParams element not found!');
    }
    
    Object.entries(modelInfos).forEach(([key, element]) => {
        if (!element) {
            console.error(`${key} description element not found!`);
        }
    });
    
    // 隐藏所有模型描述和参数面板
    Object.values(modelInfos).forEach(info => {
        if (info) {
            info.classList.add('hidden');
            console.log(`Hidden ${info.id}`);
        }
    });
    
    if (arimaParams) {
        arimaParams.classList.add('hidden');
        console.log('Hidden arimaParams');
    }
    
    // 根据自动模式状态显示不同内容
    if (autoMode && autoMode.checked) {
        // 自动模式：只显示模型描述
        if (modelType && modelInfos[modelType]) {
            modelInfos[modelType].classList.remove('hidden');
            console.log(`Showing ${modelType} description`);
        }
    } else {
        // 手动模式：只显示参数设置面板，不显示模型描述
        if (modelType === 'arima' && arimaParams) {
            arimaParams.classList.remove('hidden');
            console.log('Showing arimaParams');
        }
        // 这里可以添加其他模型的参数面板
    }
    
    // 强制应用 CSS 更改
    if (arimaParams) {
        arimaParams.style.display = autoMode?.checked ? 'none' : 'flex';
    }
    
    if (modelType && modelInfos[modelType]) {
        modelInfos[modelType].style.display = autoMode?.checked ? 'block' : 'none';
    }
}

// 添加 Railway 的基础 URL
const API_BASE_URL = 'https://seanholisticworkspace-production.up.railway.app';  // 你的 Railway URL

// 添加全局变量
let currentFileId = null;
let currentPlot = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // 获取所有必要的DOM元素
    const radioButtons = document.querySelectorAll('input[name="modelType"]');
    const fileSelect = document.getElementById('fileSelect');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const selectedVariables = document.getElementById('selectedVariables');

    // 获取URL参数中的模型类型
    const urlParams = new URLSearchParams(window.location.search);
    const modelType = urlParams.get('model');

    // 如果URL中包含模型参数，自动选择相应的模型
    if (modelType) {
        const radioButton = document.querySelector(`input[name="modelType"][value="${modelType}"]`);
        if (radioButton) {
            radioButton.checked = true;
            showModelDescription(modelType);
        }
    } else {
        // 默认选中ARIMA
        const defaultRadio = document.getElementById('arimaMode');
        if (defaultRadio) {
            defaultRadio.checked = true;
            showModelDescription('arima');
        }
    }

    // 监听单选按钮变化
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function(e) {
            if (this.checked) {
                const selectedModel = this.value;
                showModelDescription(selectedModel);
                
                // 更新URL，不刷新页面
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('model', selectedModel);
                window.history.pushState({}, '', newUrl);
            }
        });
    });

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

    // 文件选择框交互
    const fileSelectButton = document.getElementById('fileSelect');
    const fileSelectDropdown = document.getElementById('fileSelectDropdown');

    // 点击按钮显示/隐藏下拉菜单
    fileSelectButton.addEventListener('click', () => {
        fileSelectDropdown.classList.toggle('show');
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-file-select')) {
            fileSelectDropdown.classList.remove('show');
        }
    });

    const modelSelectButton = document.getElementById('modelSelect');
    const modelSelectDropdown = document.getElementById('modelSelectDropdown');
    const modelOptions = document.querySelectorAll('.model-option');

    // 点击按钮显示/隐藏下拉菜单
    modelSelectButton.addEventListener('click', () => {
        modelSelectDropdown.classList.toggle('show');
    });

    // 选择模型
    modelOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 更新按钮文本
            const modelSelectButton = document.getElementById('modelSelect');
            if (modelSelectButton) {
                modelSelectButton.querySelector('span').textContent = option.querySelector('span').textContent;
            }
            
            // 隐藏下拉菜单
            const modelSelectDropdown = document.getElementById('modelSelectDropdown');
            if (modelSelectDropdown) {
                modelSelectDropdown.classList.remove('show');
            }
            
            // 更新选中状态
            modelOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // 显示相应的描述或参数面板
            const modelValue = option.dataset.value;
            showModelDescription(modelValue);
        });
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-model-select')) {
            modelSelectDropdown.classList.remove('show');
        }
    });

    // 设置默认自动模式为开启，并触发初始显示
    const autoMode = document.getElementById('autoMode');
    if (autoMode) {
        console.log('Found autoMode checkbox');
        autoMode.checked = true; // 默认开启
        
        // 监听自动模式变化
        autoMode.addEventListener('change', function() {
            console.log('Auto mode changed to:', this.checked);
            const currentModel = document.querySelector('.model-option.selected')?.dataset.value || 'arima';
            showModelDescription(currentModel);
        });
        
        // 确保 CSS 类正确应用
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .hidden { 
                display: none !important; 
            }
        `;
        document.head.appendChild(styleEl);
        
        // 初始化时触发一次显示
        setTimeout(() => {
            const currentModel = document.querySelector('.model-option.selected')?.dataset.value || 'arima';
            console.log('Initial model selection:', currentModel);
            showModelDescription(currentModel);
        }, 100);
    } else {
        console.error('Auto mode checkbox not found!');
    }
    
    // ARIMA 参数滑块控制
    const sliders = document.querySelectorAll('.param-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', function() {
            const valueDisplay = this.closest('.param-group').querySelector('.param-value');
            if (valueDisplay) {
                valueDisplay.textContent = this.value;
            }
        });
    });
    
    // 差分按钮控制
    const diffButtons = document.querySelectorAll('.diff-button');
    diffButtons.forEach(button => {
        button.addEventListener('click', function() {
            diffButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 初始化时显示默认模型的描述
    showModelDescription('arima');
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
        const fileSelectDropdown = document.getElementById('fileSelectDropdown');
        const fileSelectButton = document.getElementById('fileSelect');
        
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

        // 清空下拉菜单
        fileSelectDropdown.innerHTML = '';

        // 添加文件选项
        data.forEach(file => {
            const displayName = file.name.replace(/^\d+_/, '');
            const option = document.createElement('div');
            option.className = 'file-option';
            option.innerHTML = `
                <i class="fas fa-file-csv"></i>
                <span>${displayName}</span>
            `;
            
            // 添加点击事件
            option.addEventListener('click', () => {
                // 更新按钮文本
                fileSelectButton.querySelector('span').textContent = displayName;
                // 处理文件选择
                processSelectedFile(file.name);
                // 隐藏下拉菜单
                fileSelectDropdown.classList.remove('show');
                // 移除其他选项的选中状态
                document.querySelectorAll('.file-option').forEach(opt => opt.classList.remove('selected'));
                // 添加当前选项的选中状态
                option.classList.add('selected');
            });

            fileSelectDropdown.appendChild(option);
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

// 修复显示变量列表函数
async function displayVariables(variables) {
    const variablesList = document.getElementById('variablesList');
    if (!variablesList) return;
    
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
        varItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', varName);
            varItem.classList.add('dragging');
        });
        
        varItem.addEventListener('dragend', () => {
            varItem.classList.remove('dragging');
        });
        
        grid.appendChild(varItem);
    }
    
    variablesList.appendChild(grid);
    
    // 初始化拖放功能
    initializeDragAndDrop();
}

// 修复拖放初始化函数
function initializeDragAndDrop() {
    const previewArea = document.getElementById('dataPreviewPlaceholder');
    const plotArea = document.getElementById('timeSeriesPreview');
    
    [previewArea, plotArea].forEach(area => {
        if (!area) return;
        
        area.addEventListener('dragover', handleDragOver);
        area.addEventListener('dragleave', handleDragLeave);
        area.addEventListener('drop', handleDrop);
    });
}

// 修改处理拖拽悬停函数，移除加号提示，改用背景动画
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // 添加拖拽提示效果
    const dropTarget = e.currentTarget;
    dropTarget.classList.add('drag-over');
    
    // 如果是占位符，隐藏文字并添加动画背景
    if (dropTarget.id === 'dataPreviewPlaceholder') {
        // 隐藏占位符文字
        const placeholderText = dropTarget.querySelector('span');
        if (placeholderText) {
            placeholderText.style.display = 'none';
        }
    }
}

// 修改处理拖拽离开函数
function handleDragLeave(e) {
    e.preventDefault();
    const dropTarget = e.currentTarget;
    dropTarget.classList.remove('drag-over');
    
    // 如果是占位符，恢复文字显示
    if (dropTarget.id === 'dataPreviewPlaceholder') {
        const placeholderText = dropTarget.querySelector('span');
        if (placeholderText) {
            placeholderText.style.display = '';
        }
    }
}

// 处理拖拽放下
async function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.currentTarget;
    
    // 移除拖拽效果
    dropTarget.classList.remove('drag-over');
    
    // 获取变量名
    const variableName = e.dataTransfer.getData('text/plain');
    if (!variableName || !currentFileId) return;
    
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        // 显示加载状态
        showLoading('Generating plot...');
        
        const response = await fetch(`${API_BASE_URL}/finance/timeseries_plot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_path: `${session.user.id}/${currentFileId}`,
                variable_name: variableName,
                user_id: session.user.id
            })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            // 隐藏占位符
            const placeholder = document.getElementById('dataPreviewPlaceholder');
            if (placeholder) {
                placeholder.classList.add('hidden');
            }
            
            // 显示图表区域
            const plotArea = document.getElementById('timeSeriesPreview');
            if (plotArea) {
                plotArea.classList.remove('hidden');
                // 使用 Plotly 显示图表
                const plotData = JSON.parse(result.plot);
                Plotly.newPlot('timeSeriesPreview', plotData.data, plotData.layout);
            }
        }
    } catch (error) {
        console.error('Error plotting variable:', error);
        showError(`Failed to plot: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// 更新样式，移除绿色提示，添加新的动画效果
const dragStyles = `
    #dataPreviewPlaceholder.drag-over,
    #timeSeriesPreview.drag-over {
        border: 2px dashed #2E72C6;
        background: linear-gradient(
            45deg,
            rgba(46, 114, 198, 0.05) 25%,
            rgba(46, 114, 198, 0.1) 25%,
            rgba(46, 114, 198, 0.1) 50%,
            rgba(46, 114, 198, 0.05) 50%,
            rgba(46, 114, 198, 0.05) 75%,
            rgba(46, 114, 198, 0.1) 75%,
            rgba(46, 114, 198, 0.1)
        );
        background-size: 56.57px 56.57px;
        animation: moveStripes 1s linear infinite;
        transition: all 0.3s ease;
    }
    
    @keyframes moveStripes {
        0% {
            background-position: 0 0;
        }
        100% {
            background-position: 56.57px 56.57px;
        }
    }
    
    .dragging {
        opacity: 0.5;
    }
    
    #dataPreviewPlaceholder.drag-over span {
        display: none;
    }
`;

// 更新样式
const dragStyleSheet = document.createElement('style');
dragStyleSheet.textContent = dragStyles;
document.head.appendChild(dragStyleSheet);

// 修改文件选择处理函数
async function processSelectedFile(fileId) {
    try {
        // 保存当前文件ID
        currentFileId = fileId;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
            showError('User not authenticated');
            return;
        }
        
        // 显示加载状态
        showLoading('Processing file...');
        
        const filePath = `${userId}/${fileId}`;
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            await displayVariables(data.variables);
            hideLoading();
        } else {
            throw new Error(data.message || 'Failed to get variable types');
        }
    } catch (error) {
        hideLoading();
        showError(`Error: ${error.message}`);
    }
}

// 添加加载状态组件
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingOverlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loadingOverlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 添加错误提示组件
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// 更新时间序列预览函数
async function updateTimeSeriesPreview(variableName) {
    const previewArea = document.getElementById('timeSeriesPreview');
    const configPanel = document.getElementById('plotConfigPanel');
    
    try {
        if (!currentFileId) {
            throw new Error('No file selected');
        }
        
        showLoading('Generating plot...');
        
        // 获取时间范围配置
        const timeRange = getTimeRangeConfig();
        
        const response = await fetch(`${API_BASE_URL}/finance/timeseries_plot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_id: currentFileId,
                variable_name: variableName,
                start_date: timeRange.startDate,
                end_date: timeRange.endDate
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // 解析并显示 Plotly 图表，添加动画效果
            const plotData = JSON.parse(data.plot);
            currentPlot = await Plotly.newPlot('timeSeriesPreview', 
                plotData.data, 
                {
                    ...plotData.layout,
                    transition: {
                        duration: 500,
                        easing: 'cubic-in-out'
                    }
                }
            );
            
            // 显示配置面板
            showPlotConfigPanel(variableName);
        } else {
            throw new Error(data.message || 'Failed to create plot');
        }
    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// 添加图表配置面板
function showPlotConfigPanel(variableName) {
    const configPanel = document.getElementById('plotConfigPanel');
    if (!configPanel) return;
    
    configPanel.innerHTML = `
        <h3>Plot Configuration</h3>
        <div class="config-group">
            <label>Time Range:</label>
            <input type="date" id="startDate" />
            <input type="date" id="endDate" />
        </div>
        <div class="config-group">
            <label>Plot Type:</label>
            <select id="plotType">
                <option value="line">Line</option>
                <option value="scatter">Scatter</option>
                <option value="candlestick">Candlestick</option>
            </select>
        </div>
        <button onclick="applyPlotConfig()">Apply</button>
    `;
    
    // 设置默认日期范围
    setDefaultDateRange();
}

// 获取时间范围配置
function getTimeRangeConfig() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    return {
        startDate: startDate || null,
        endDate: endDate || null
    };
}

// 应用图表配置
async function applyPlotConfig() {
    const variableName = currentPlot?.data[0]?.name;
    if (variableName) {
        await updateTimeSeriesPreview(variableName);
    }
}

// 添加样式
const styles = `
    #loadingOverlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
    }
    
    .error-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
`;

// 添加样式到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

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
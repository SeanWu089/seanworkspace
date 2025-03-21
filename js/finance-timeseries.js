import { API_BASE_URL, API_ENDPOINTS } from '/js/config.js';

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

    // 文件选择框交互
    const fileSelectButton = document.getElementById('fileSelect');
    const fileSelectDropdown = document.getElementById('fileSelectDropdown');

    if (fileSelectButton && fileSelectDropdown) {
        console.log('Setting up file select dropdown');
        
        // 点击按钮显示/隐藏下拉菜单
        fileSelectButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('File select button clicked');
            fileSelectDropdown.classList.toggle('show');
        });
    }

    // 模型选择下拉菜单处理
    const modelSelectButton = document.getElementById('modelSelect');
    const modelSelectDropdown = document.getElementById('modelSelectDropdown');
    
    if (modelSelectButton && modelSelectDropdown) {
        console.log('Setting up model select dropdown');
        
        // 点击按钮显示/隐藏下拉菜单
        modelSelectButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Model select button clicked');
            modelSelectDropdown.classList.toggle('show');
        });
        
        // 确保下拉菜单中有四个选项
        modelSelectDropdown.innerHTML = `
            <div class="model-option" data-value="prophet">
                <span>Prophet</span>
            </div>
            <div class="model-option" data-value="garch">
                <span>GARCH</span>
            </div>
            <div class="model-option" data-value="lstm">
                <span>LSTM</span>
            </div>
            <div class="model-option" data-value="tree">
                <span>Tree-based</span>
            </div>
        `;
        
        // 为每个选项添加点击事件
        const modelOptions = modelSelectDropdown.querySelectorAll('.model-option');
        modelOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Model option clicked:', this.dataset.value);
                
                // 更新按钮文本
                modelSelectButton.querySelector('span').textContent = 
                    this.querySelector('span').textContent;
                
                // 更新选中状态
                modelOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                // 隐藏下拉菜单
                modelSelectDropdown.classList.remove('show');
                
                // 获取选中的模型类型
                const modelType = this.dataset.value;
                console.log('Selected model:', modelType);
            });
        });
    }

    // 检查所有相关元素是否存在
    const autoMode = document.getElementById('autoMode');
    console.log('Auto Mode element:', autoMode);
    
    const prophetDesc = document.getElementById('prophetDesc');
    console.log('Prophet description element:', prophetDesc);
    
    const prophetParams = document.getElementById('prophetParams');
    console.log('Prophet params element:', prophetParams);
    
    // Auto Mode 开关逻辑
    if (autoMode && prophetDesc && prophetParams) {
        console.log('Setting up Auto Mode toggle');
        
        // 初始状态设置
        const isAutoMode = autoMode.checked;
        console.log('Initial Auto Mode state:', isAutoMode);
        
        if (isAutoMode) {
            prophetDesc.classList.remove('hidden');
            prophetParams.classList.add('hidden');
        } else {
            prophetDesc.classList.add('hidden');
            prophetParams.classList.remove('hidden');
        }
        
        // 监听变化
        autoMode.addEventListener('change', function() {
            console.log('Auto Mode changed:', this.checked);
            
            if (this.checked) {
                prophetDesc.classList.remove('hidden');
                prophetParams.classList.add('hidden');
            } else {
                prophetDesc.classList.add('hidden');
                prophetParams.classList.remove('hidden');
            }
        });
    } else {
        console.error('Auto Mode elements not found:', { 
            autoMode: autoMode ? 'found' : 'not found', 
            prophetDesc: prophetDesc ? 'found' : 'not found', 
            prophetParams: prophetParams ? 'found' : 'not found' 
        });
    }

    // 设置滑块值更新
    setupSliderValueUpdate('changepointScaleSlider', 'changepointScaleValue');
    setupSliderValueUpdate('seasonalityScaleSlider', 'seasonalityScaleValue');
    setupSliderValueUpdate('holidaysScaleSlider', 'holidaysScaleValue');

    // 获取建模按钮
    const startModelingBtn = document.getElementById('startModelingBtn');
    
    // 添加点击事件处理
    if (startModelingBtn) {
        startModelingBtn.addEventListener('click', async function() {
            try {
                // 检查是否有选中的变量
                const timeSeriesPreview = document.getElementById('timeSeriesPreview');
                if (!timeSeriesPreview || !timeSeriesPreview.data || !timeSeriesPreview.data[0]) {
                    showError('Please select a variable first');
                    return;
                }

                // 显示加载状态
                startModelingBtn.disabled = true;
                startModelingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                // 获取选中的变量名
                const variableName = timeSeriesPreview.data[0].name;
                
                // 调用建模函数
                await fitTimeSeriesModel(variableName);
                
            } catch (error) {
                showError(`Modeling failed: ${error.message}`);
            } finally {
                // 恢复按钮状态
                startModelingBtn.disabled = false;
                startModelingBtn.innerHTML = '<i class="fas fa-play"></i> Start Modeling';
            }
        });
    }

    // 初始化文件列表
    initializeFileList();

    // 全局点击事件处理程序来关闭下拉菜单
    document.addEventListener('click', function(e) {
        // 关闭文件选择下拉菜单
        if (!e.target.closest('.custom-file-select')) {
            if (fileSelectDropdown) {
                fileSelectDropdown.classList.remove('show');
            }
        }
        
        // 关闭模型选择下拉菜单
        if (!e.target.closest('.custom-model-select')) {
            if (modelSelectDropdown) {
                modelSelectDropdown.classList.remove('show');
            }
        }
    });

    // 添加预测点数输入验证
    const forecastPointsInput = document.getElementById('forecastPointsInput');
    if (forecastPointsInput) {
        forecastPointsInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (value < 1) {
                this.value = 1;
            } else if (value > 365) {
                this.value = 365;
            }
        });
    }
});

// 切换 Prophet 内容显示
function toggleProphetContent(isAutoMode) {
    console.log('Toggling Prophet content, Auto Mode:', isAutoMode);
    
    const prophetDesc = document.getElementById('prophetDesc');
    const prophetParams = document.getElementById('prophetParams');
    
    if (!prophetDesc || !prophetParams) {
        console.error('Prophet content elements not found');
        return;
    }
    
    if (isAutoMode) {
        // Auto Mode 开启：显示描述，隐藏参数
        prophetDesc.classList.remove('hidden');
        prophetParams.classList.add('hidden');
        console.log('Showing description, hiding params');
    } else {
        // Auto Mode 关闭：隐藏描述，显示参数
        prophetDesc.classList.add('hidden');
        prophetParams.classList.remove('hidden');
        console.log('Hiding description, showing params');
    }
}

// 设置滑块值更新
function setupSliderValueUpdate(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (slider && valueDisplay) {
        // 初始值设置
        valueDisplay.textContent = slider.value;
        
        // 监听滑块变化
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
    }
}

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
        displayDataPreview(variableData);
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
        
        const response = await fetch(API_ENDPOINTS.timeseriesPlot, {
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
        const response = await fetch(API_ENDPOINTS.dataType, {
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

// 修改建模函数
async function fitTimeSeriesModel(variableName) {
    try {
        showLoading('Fitting model...');
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session?.user?.id) {
            throw new Error('User not authenticated');
        }

        if (!currentFileId) {
            throw new Error('Please select a file first');
        }

        // 根据 auto mode 决定使用哪些参数
        const isAutoMode = document.getElementById('autoMode')?.checked ?? true;
        let modelParams = {};
        
        if (!isAutoMode) {
            // 手动模式：获取用户设置的所有参数
            modelParams = {
                yearly_seasonality: document.getElementById('yearlySeasonality')?.checked ?? true,
                weekly_seasonality: document.getElementById('weeklySeasonality')?.checked ?? true,
                daily_seasonality: document.getElementById('dailySeasonality')?.checked ?? false,
                changepoint_prior_scale: parseFloat(document.getElementById('changepointScaleSlider')?.value ?? 0.5),
                seasonality_prior_scale: parseFloat(document.getElementById('seasonalityScaleSlider')?.value ?? 10.0),
                holidays_prior_scale: parseFloat(document.getElementById('holidaysScaleSlider')?.value ?? 10.0)
            };
        }
        
        const filePath = `${session.user.id}/${currentFileId}`;
        
        const forecastPoints = parseInt(document.getElementById('forecastPointsInput').value) || 30;
        
        const response = await fetch(API_ENDPOINTS.timeseriesModel, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_path: filePath,
                variable_name: variableName,
                model_type: 'prophet',
                auto_mode: isAutoMode,
                model_params: modelParams,
                forecast_points: forecastPoints,
                user_id: session.user.id
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
            displayModelResults(result);
        } else {
            throw new Error(result.message || 'Model fitting failed');
        }
    } catch (error) {
        console.error('Modeling error:', error);
        showError(`Modeling failed: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// 修改显示模型结果的函数
function displayModelResults(result) {
    console.log("Received result:", JSON.stringify(result, null, 2));
    
    // 显示评估指标
    document.getElementById('rmseValue').textContent = result.metrics.rmse.toFixed(4);
    document.getElementById('maeValue').textContent = result.metrics.mae.toFixed(4);
    document.getElementById('mapeValue').textContent = result.metrics.mape.toFixed(2) + '%';
    document.getElementById('r2Value').textContent = result.metrics.r2.toFixed(4);

    // 显示预测相关指标
    document.getElementById('changeValue').textContent = result.insights.change.toFixed(2) + '%';
    document.getElementById('uncertaintyValue').textContent = result.insights.uncertainty.toFixed(2) + '%';
    document.getElementById('minForecastValue').textContent = result.insights.min.toFixed(2);
    document.getElementById('maxForecastValue').textContent = result.insights.max.toFixed(2);

    // 显示图表 - 尝试直接使用整个plot对象
    if (result.plot) {
        console.log("Plot data structure:", result.plot);
        
        // 尝试方法1: 直接使用整个plot对象
        try {
            Plotly.newPlot('forecastPlot', result.plot);
            console.log("Method 1 succeeded");
        } catch (e) {
            console.error("Method 1 failed:", e);
            
            // 尝试方法2: 分离data和layout
            try {
                Plotly.newPlot('forecastPlot', result.plot.data, result.plot.layout);
                console.log("Method 2 succeeded");
            } catch (e) {
                console.error("Method 2 failed:", e);
                
                // 尝试方法3: 解析JSON字符串
                try {
                    const plotData = typeof result.plot === 'string' ? 
                        JSON.parse(result.plot) : result.plot;
                    Plotly.newPlot('forecastPlot', plotData.data, plotData.layout);
                    console.log("Method 3 succeeded");
                } catch (e) {
                    console.error("Method 3 failed:", e);
                    document.getElementById('forecastPlot').innerHTML = 
                        '<div class="error-message">Failed to display plot. See console for details.</div>';
                }
            }
        }
    }
}

// 更新格式化函数以处理不同格式的值
function formatMetricValue(value, format) {
    // 如果值已经是字符串（后端可能直接返回格式化的字符串）
    if (typeof value === 'string') {
        return value;
    }
    
    // 数值格式化
    if (format.includes('%')) {
        // 如果值已经是百分比形式（大于1），不需要乘100
        const percentage = Math.abs(value) > 1 ? value : value * 100;
        return `${percentage.toFixed(2)}%`;
    }
    
    const precision = parseInt(format.match(/\.(\d+)f/)[1]);
    return value.toFixed(precision);
}

// 处理图表标签切换
document.querySelectorAll('.plot-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // 移除所有标签和内容的active类
        document.querySelectorAll('.plot-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.plot-item').forEach(p => p.classList.remove('active'));
        
        // 添加active类到当前标签和对应内容
        this.classList.add('active');
        const plotId = this.dataset.plot + 'Plot';
        document.getElementById(plotId).classList.add('active');
    });
});

// 在选择变量时显示预览图
function displayDataPreview(data) {
    // 创建简单的时间序列图
    const trace = {
        x: data.dates,
        y: data.values,
        type: 'scatter',
        mode: 'lines',
        name: 'Historical Data'
    };

    const layout = {
        showlegend: false,
        margin: {l: 40, r: 40, t: 40, b: 20, pad: 0},
        height: 500,
        width: 800
    };

    Plotly.newPlot('timeSeriesPreview', [trace], layout);
} 
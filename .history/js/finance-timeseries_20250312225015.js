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

// 初始化文件列表
async function initializeFileList() {
    try {
        const fileSelect = document.getElementById('fileSelect');
        if (!fileSelect) return;

        // 清空现有选项，只保留默认选项
        fileSelect.innerHTML = '<option value="">Choose a file...</option>';

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

        // 只显示支持的文件类型
        const supportedExtensions = ['.csv', '.xlsx', '.xls'];
        const files = data.filter(file => 
            supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        );

        // 添加文件选项到下拉列表
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = file.name.replace(/^\d+_/, ''); // 移除时间戳前缀
            fileSelect.appendChild(option);
        });

        // 如果没有文件，显示提示信息
        if (files.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No files available";
            option.disabled = true;
            fileSelect.appendChild(option);
        }

        // 添加文件选择事件监听器
        fileSelect.addEventListener('change', async (e) => {
            const fileName = e.target.value;
            if (!fileName) return;

            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                if (!session?.user) {
                    console.error('No user logged in');
                    return;
                }

                const { data, error } = await window.supabaseClient
                    .storage
                    .from('user_files')
                    .download(`${session.user.id}/${fileName}`);

                if (error) throw error;

                // 使用 sidebars.js 中的 processDataFile 处理文件
                const processedData = await processDataFile(data);
                if (processedData) {
                    displayVariables(processedData.headers);
                    updateDataPreview(processedData.rawData);
                }
            } catch (error) {
                console.error('Error loading file:', error);
            }
        });
    } catch (error) {
        console.error('Error initializing file list:', error);
    }
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

// 显示变量列表
function displayVariables(variables) {
    const variablesList = document.getElementById('variablesList');
    variablesList.innerHTML = '';

    variables.forEach(variable => {
        const div = document.createElement('div');
        div.className = 'variable-item';
        div.dataset.variable = variable;
        div.textContent = variable;
        variablesList.appendChild(div);
    });

    initializeDragAndDrop();
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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeFileList();
}); 
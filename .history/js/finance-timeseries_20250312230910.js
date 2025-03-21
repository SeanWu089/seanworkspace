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

// 创建自定义下拉框
function createCustomSelect(originalSelect) {
    if (!originalSelect) return;

    // 创建自定义下拉框容器
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    
    // 创建选中项显示区域
    const selectedOption = document.createElement('div');
    selectedOption.className = 'selected-option';
    selectedOption.innerHTML = `
        <span>${originalSelect.options[originalSelect.selectedIndex]?.textContent || 'Choose a file...'}</span>
        <i class="fas fa-chevron-down"></i>
    `;

    // 创建选项列表
    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';

    // 将原始选项转换为自定义选项
    Array.from(originalSelect.options).forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option-item';
        
        // 根据文件类型设置图标
        const fileExtension = option.textContent.split('.').pop()?.toLowerCase();
        const iconClass = fileExtension === 'csv' ? 'fa-file-csv' : 
                         (fileExtension === 'xlsx' || fileExtension === 'xls') ? 'fa-file-excel' : 
                         'fa-file';

        optionElement.innerHTML = `
            <div class="option-content">
                <i class="fas ${iconClass}"></i>
                <span>${option.textContent}</span>
            </div>
        `;

        if (option.value === originalSelect.value) {
            optionElement.classList.add('selected');
        }

        optionElement.addEventListener('click', async () => {
            // 更新选中状态
            optionsList.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });
            optionElement.classList.add('selected');
            
            // 更新显示的选中项
            selectedOption.querySelector('span').textContent = option.textContent;
            
            // 关闭下拉列表
            customSelect.classList.remove('open');
            
            // 触发原始select的change事件
            originalSelect.value = option.value;
            originalSelect.dispatchEvent(new Event('change'));
        });

        optionsList.appendChild(optionElement);
    });

    // 添加点击事件来显示/隐藏选项列表
    selectedOption.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    // 点击外部区域时关闭下拉列表
    document.addEventListener('click', () => {
        customSelect.classList.remove('open');
    });

    // 组装自定义下拉框
    customSelect.appendChild(selectedOption);
    customSelect.appendChild(optionsList);

    // 替换原始select元素
    originalSelect.style.display = 'none';
    originalSelect.parentNode.insertBefore(customSelect, originalSelect);
}

// 修改初始化文件列表函数
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

        // 只显示支持的文件类型，并去重
        const supportedExtensions = ['.csv', '.xlsx', '.xls'];
        const uniqueFiles = new Map();

        data.forEach(file => {
            if (supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
                const displayName = file.name.replace(/^\d+_/, '');
                if (!uniqueFiles.has(displayName) || 
                    file.name > uniqueFiles.get(displayName).name) {
                    uniqueFiles.set(displayName, file);
                }
            }
        });

        // 添加文件选项到下拉列表
        Array.from(uniqueFiles.entries()).forEach(([displayName, file]) => {
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = displayName;
            fileSelect.appendChild(option);
        });

        // 在添加完所有选项后，创建自定义下拉框
        createCustomSelect(fileSelect);

    } catch (error) {
        console.error('Error initializing file list:', error);
    }
}

// 清空变量列表
function clearVariablesList() {
    const variablesList = document.getElementById('variablesList');
    if (variablesList) {
        variablesList.innerHTML = '';
    }
}

// 显示变量列表
function displayVariables(variables) {
    const variablesList = document.getElementById('variablesList');
    if (!variablesList) return;

    variablesList.innerHTML = '';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = 'Available Variables';
    title.className = 'variables-title';
    variablesList.appendChild(title);

    // 创建变量列表容器
    const listContainer = document.createElement('div');
    listContainer.className = 'variables-grid';

    variables.forEach(variable => {
        const div = document.createElement('div');
        div.className = 'variable-item';
        div.dataset.variable = variable;
        
        // 添加图标和变量名
        div.innerHTML = `
            <i class="fas fa-chart-line"></i>
            <span>${variable}</span>
        `;
        
        // 添加点击事件
        div.addEventListener('click', () => {
            div.classList.toggle('selected');
            updateTimeSeriesPreview(variable);
        });

        listContainer.appendChild(div);
    });

    variablesList.appendChild(listContainer);
    initializeDragAndDrop();
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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeFileList();
}); 
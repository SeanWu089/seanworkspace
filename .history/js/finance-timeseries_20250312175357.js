document.addEventListener('DOMContentLoaded', function() {
    // 获取URL参数中的模型类型
    const urlParams = new URLSearchParams(window.location.search);
    const modelType = urlParams.get('model');

    // 获取必要的DOM元素
    const modelSelect = document.getElementById('modelSelect');
    const modelInfos = {
        arima: document.getElementById('arimaDesc'),
        garch: document.getElementById('garchDesc'),
        ewma: document.getElementById('ewmaDesc')
    };

    // 如果URL中包含模型参数，自动选择相应的模型
    if (modelType) {
        modelSelect.value = modelType;
        showModelDescription(modelType);
    }

    // 监听模型选择变化
    modelSelect.addEventListener('change', function(e) {
        const selectedModel = e.target.value;
        showModelDescription(selectedModel);
        
        // 更新URL，不刷新页面
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('model', selectedModel);
        window.history.pushState({}, '', newUrl);
    });

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

    // 初始化侧边栏
    if (typeof initializeSidebars === 'function') {
        initializeSidebars();
    }
});

// Supabase 客户端初始化
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// 变量搜索和选择功能
async function searchVariables(query) {
    try {
        const { data, error } = await supabase
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

// 搜索输入处理
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const selectedVariables = document.getElementById('selectedVariables');

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

// 显示搜索结果
function displaySearchResults(results) {
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

// 更新数据预览
function updateDataPreview(data) {
    const previewPlaceholder = document.getElementById('dataPreviewPlaceholder');
    const timeSeriesPreview = document.getElementById('timeSeriesPreview');

    if (data && data.length > 0) {
        previewPlaceholder.classList.add('hidden');
        timeSeriesPreview.classList.remove('hidden');
        // 这里可以添加时间序列图表的渲染逻辑
        // 例如使用 Chart.js 或其他图表库
    }
}

// 初始化文件列表
async function initializeFileList() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        // 使用 storage 获取用户文件列表
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(user.id);

        if (error) throw error;

        const fileSelect = document.getElementById('fileSelect');
        data.forEach(file => {
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = file.name;
            fileSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// 文件选择处理
document.getElementById('fileSelect').addEventListener('change', async (e) => {
    const fileName = e.target.value;
    if (!fileName) return;

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .download(`${user.id}/${fileName}`);

        if (error) throw error;

        // 解析文件内容并显示变量
        const variables = await parseFileVariables(data);
        displayVariables(variables);
    } catch (error) {
        console.error('Error loading file:', error);
    }
});

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
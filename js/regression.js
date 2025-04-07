// 导入API配置
import { API_ENDPOINTS } from '/js/config.js';

// Global variables
let currentFileId = null;
let currentVariables = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page: DOM Content Loaded');
    
    if (!window.supabaseClient) {
        console.error('Page: Supabase client not initialized');
        showError('Supabase client not initialized. Please check your configuration.');
        return;
    }
    
    console.log('Supabase Client:', window.supabaseClient);
    
    // Initialize file selector
    setupFileSelector();
    setupEventListeners();
    enhanceNativeSelects();
});

// 增强原生的select元素，添加搜索和过滤功能
function enhanceNativeSelects() {
    // 获取所有需要增强的select元素
    const selects = document.querySelectorAll('.form-select');
    
    selects.forEach(select => {
        // 创建一个包装容器
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        // 隐藏原始select元素，但保持其功能
        select.classList.add('original-select');
        
        // 创建自定义显示的div
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';
        customSelect.innerHTML = `
            <div class="selected-option">
                <span>${select.options[select.selectedIndex]?.text || 'Select option...'}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="search-container">
                <input type="text" class="select-search" placeholder="Search...">
            </div>
            <div class="options-container"></div>
        `;
        wrapper.appendChild(customSelect);
        
        // 创建选项列表
        updateOptions(select, customSelect);
        
        // 绑定事件
        setupCustomSelectEvents(select, customSelect);
    });
    
    // 点击其他地方关闭所有下拉菜单
    document.addEventListener('click', (e) => {
        const wrappers = document.querySelectorAll('.custom-select-wrapper');
        wrappers.forEach(wrapper => {
            if (!wrapper.contains(e.target)) {
                wrapper.querySelector('.custom-select')?.classList.remove('open');
            }
        });
    });
}

// 更新自定义select的选项
function updateOptions(originalSelect, customSelect) {
    const optionsContainer = customSelect.querySelector('.options-container');
    optionsContainer.innerHTML = '';
    
    Array.from(originalSelect.options).forEach(option => {
        if (option.hidden) return; // 跳过隐藏的选项
        
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.dataset.value = option.value;
        optionElement.textContent = option.text;
        
        if (option.selected) {
            optionElement.classList.add('selected');
        }
        
        optionsContainer.appendChild(optionElement);
    });
}

// 设置自定义select的事件
function setupCustomSelectEvents(originalSelect, customSelect) {
    const selectedOption = customSelect.querySelector('.selected-option');
    const searchInput = customSelect.querySelector('.select-search');
    const optionsContainer = customSelect.querySelector('.options-container');
    
    // 点击显示/隐藏选项
    selectedOption.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
        
        if (customSelect.classList.contains('open')) {
            searchInput.focus();
        }
    });
    
    // 搜索过滤
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();
        const options = optionsContainer.querySelectorAll('.option');
        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            option.style.display = text.includes(filter) ? '' : 'none';
        });
    });
    
    // 点击选项
    optionsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.option');
        if (!option) return;
        
        const value = option.dataset.value;
        originalSelect.value = value;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        originalSelect.dispatchEvent(event);
        
        // 更新显示
        selectedOption.querySelector('span').textContent = option.textContent;
        
        // 关闭下拉框
        customSelect.classList.remove('open');
        
        // 更新选中状态
        optionsContainer.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
    });
}

// Set up file selector
function setupFileSelector() {
    const button = document.getElementById('fileSelectBtn');
    const dropdown = document.getElementById('fileDropdown');
    const buttonText = button?.querySelector('.btn-text');

    if (!button || !dropdown || !buttonText) {
        console.error('FileSelector: Required elements not found');
        return;
    }

    button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log('FileSelector: Button clicked');

        const isOpening = !dropdown.classList.contains('show');
        toggleDropdown(dropdown, button, isOpening);

        if (isOpening) {
            await loadFiles(dropdown, buttonText);
        }
    });

    document.addEventListener('click', (event) => {
        if (!button.contains(event.target)) {
            console.log('FileSelector: Clicked outside');
            toggleDropdown(dropdown, button, false);
        }
    });

    console.log('FileSelector: Initialized');
}

// Toggle dropdown visibility
function toggleDropdown(dropdown, button, show) {
    console.log('FileSelector: Toggling dropdown:', show);
    button.classList.toggle('active', show);
    dropdown.classList.toggle('show', show);
}

// Load files from Supabase
async function loadFiles(dropdown, buttonText) {
    try {
        console.log('FileSelector: Loading files');
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        console.log('Session:', session, 'Error:', error);
        
        if (error) {
            throw new Error('Session error: ' + error.message);
        }
        
        if (!session) {
            throw new Error('No active session');
        }
        
        console.log('FileSelector: User ID:', session.user.id);
        
        const { data: files, error: filesError } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(session.user.id);
            
        if (filesError) {
            console.error('Files error:', filesError);
            throw new Error('Files error: ' + filesError.message);
        }
        
        console.log('Files loaded:', files);
        
        renderFiles(files, dropdown, buttonText);
    } catch (error) {
        console.error('FileSelector: Load error:', error);
        showError(error.message);
    }
}

// Render files in the dropdown
function renderFiles(files, dropdown, buttonText) {
    console.log('FileSelector: Rendering files');
    dropdown.innerHTML = '';
    
    if (!files || files.length === 0) {
        const noFiles = document.createElement('div');
        noFiles.className = 'file-option';
        noFiles.textContent = 'No files available';
        dropdown.appendChild(noFiles);
        return;
    }
    
    files.forEach(file => {
        const displayName = file.name.replace(/^\d+_/, '');
        const option = document.createElement('div');
        option.className = 'file-option';
        option.innerHTML = `
            <i class="fas fa-file-csv"></i>
            <span>${displayName}</span>
        `;
        
        option.addEventListener('click', () => {
            console.log('FileSelector: File selected:', displayName);
            selectFile(file, displayName, buttonText, dropdown);
        });
        
        dropdown.appendChild(option);
    });
}

// Select a file
function selectFile(file, displayName, buttonText, dropdown) {
    console.log('File selected:', file, 'Display name:', displayName);
    buttonText.textContent = displayName;
    toggleDropdown(dropdown, buttonText.parentElement, false);
    
    // Update selected state
    const options = dropdown.querySelectorAll('.file-option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Process the selected file
    processSelectedFile(file.name);
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Run model button
    const runModelBtn = document.getElementById('runModel');
    if (runModelBtn) {
        runModelBtn.addEventListener('click', () => {
            if (!currentFileId || !currentVariables) {
                showError('Please select a file and variables first');
                return;
            }
            runRegressionAnalysis();
        });
    }

    // Add interaction button
    const addInteractionBtn = document.querySelector('.add-interaction');
    if (addInteractionBtn) {
        addInteractionBtn.addEventListener('click', () => {
            // 获取原生下拉框的值
            const var1Select = document.querySelector('.interaction-grid select:first-of-type');
            const var2Select = document.querySelector('.interaction-grid select:last-of-type');
            
            if (!var1Select || !var2Select) {
                console.error('Interaction selects not found');
                return;
            }

            const var1 = var1Select.value;
            const var2 = var2Select.value;

            if (!var1 || !var2) {
                showError('Please select both variables for interaction');
                return;
            }

            if (var1 === var2) {
                showError('Please select different variables for interaction');
                return;
            }

            addInteractionEffect(var1, var2);
            
            // 清空下拉框选择
            var1Select.value = '';
            var2Select.value = '';
            
            // 更新自定义下拉框显示
            const customSelect1 = var1Select.closest('.custom-select-wrapper')?.querySelector('.custom-select');
            const customSelect2 = var2Select.closest('.custom-select-wrapper')?.querySelector('.custom-select');
            
            if (customSelect1) {
                customSelect1.querySelector('.selected-option span').textContent = 'Select option...';
            }
            
            if (customSelect2) {
                customSelect2.querySelector('.selected-option span').textContent = 'Select option...';
            }
        });
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // 设置随机斜率选择
    const randomSlopesSelect = document.querySelector('.random-slopes-select');
    if (randomSlopesSelect) {
        randomSlopesSelect.addEventListener('change', () => {
            const value = randomSlopesSelect.value;
            if (!value) return;
            
            // 添加到已选择区域
            addRandomSlope(value);
            
            // 重置选择
            randomSlopesSelect.value = '';
            
            // 更新自定义下拉框显示
            const customSelect = randomSlopesSelect.closest('.custom-select-wrapper')?.querySelector('.custom-select');
            if (customSelect) {
                customSelect.querySelector('.selected-option span').textContent = 'Select option...';
            }
        });
    }
    
    // 主效应选择框
    const mainEffectsSelect = document.querySelector('.main-effects-section select');
    if (mainEffectsSelect) {
        mainEffectsSelect.addEventListener('change', () => {
            const value = mainEffectsSelect.value;
            if (!value) return;
            
            // 添加到已选择区域
            addMainEffect(value);
            
            // 重置选择
            mainEffectsSelect.value = '';
            
            // 更新自定义下拉框显示
            const customSelect = mainEffectsSelect.closest('.custom-select-wrapper')?.querySelector('.custom-select');
            if (customSelect) {
                customSelect.querySelector('.selected-option span').textContent = 'Select option...';
            }
        });
    }
}

// Process selected file
async function processSelectedFile(fileId) {
    try {
        console.log('Processing file:', fileId);
        
        // Check if Supabase client is available
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        currentFileId = fileId;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
            showError('User not authenticated');
            return;
        }
        
        console.log('User ID:', userId);
        showLoading('Processing file...');
        
        const filePath = `${userId}/${fileId}`;
        console.log('Requesting data for file path:', filePath);
        
        const response = await fetch(API_ENDPOINTS.dataType, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
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
        console.log('Received data:', data);
        
        if (data.status === 'success') {
            currentVariables = data.variables;
            console.log('Variables to display:', currentVariables);
            await displayVariables(data.variables);
            updateVariableSelects(data.variables);
            hideLoading();
        } else {
            throw new Error(data.message || 'Failed to get variable types');
        }
    } catch (error) {
        console.error('Error in processSelectedFile:', error);
        hideLoading();
        showError(`Error: ${error.message}`);
    }
}

// Update variable selects with select2
function updateVariableSelects(variables) {
    if (typeof variables === 'string') {
        // Called from drop event
        const variableName = variables;
        const dropTarget = arguments[1];
        
        if (dropTarget.classList.contains('dependent-var-section')) {
            const select = dropTarget.querySelector('select');
            if (select) {
                select.value = variableName;
                // 触发change事件
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
                
                // 更新自定义选择器的显示
                const customSelect = select.parentNode.querySelector('.custom-select');
                if (customSelect) {
                    const selectedText = select.options[select.selectedIndex]?.text || variableName;
                    customSelect.querySelector('.selected-option span').textContent = selectedText;
                    
                    // 更新选项的选中状态
                    const options = customSelect.querySelectorAll('.option');
                    options.forEach(opt => {
                        opt.classList.toggle('selected', opt.dataset.value === variableName);
                    });
                }
            }
        } else if (dropTarget.classList.contains('main-effects-section')) {
            const select = dropTarget.querySelector('select');
            if (select) {
                select.value = variableName;
                // 触发change事件
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
                
                // 更新自定义选择器的显示
                const customSelect = select.parentNode.querySelector('.custom-select');
                if (customSelect) {
                    const selectedText = select.options[select.selectedIndex]?.text || variableName;
                    customSelect.querySelector('.selected-option span').textContent = selectedText;
                    
                    // 更新选项的选中状态
                    const options = customSelect.querySelectorAll('.option');
                    options.forEach(opt => {
                        opt.classList.toggle('selected', opt.dataset.value === variableName);
                    });
                }
                
                addMainEffect(variableName);
            }
        }
    } else {
        // Called with variables object to update all selects
        const selects = [
            '.dependent-var-section select',
            '.main-effects-section select',
            '.interaction-inputs .interaction-select',
            '.random-slopes-select'
        ];

        selects.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(select => {
                if (!select) return;
                
                // 清空现有选项
                while (select.options.length > 0) {
                    select.remove(0);
                }
                
                // 添加占位选项
                const placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.hidden = true;
                placeholderOption.selected = true;
                select.add(placeholderOption);
                
                // 添加变量选项
                Object.entries(variables).forEach(([varName, varInfo]) => {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.text = varName;
                    select.add(option);
                });
                
                // 更新自定义选择器
                const wrapper = select.closest('.custom-select-wrapper');
                if (wrapper) {
                    const customSelect = wrapper.querySelector('.custom-select');
                    if (customSelect) {
                        updateOptions(select, customSelect);
                    }
                }
            });
        });
    }
}

// 修改现有的 displayVariables 函数
async function displayVariables(variables) {
    console.log('Displaying variables:', variables);
    
    const variablesList = document.querySelector('.variables-list');
    const variablesCount = document.querySelector('.variables-count');
    
    if (!variablesList || !variablesCount) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // 清空现有内容
    variablesList.innerHTML = '';
    
    if (!variables || Object.keys(variables).length === 0) {
        console.log('No variables to display');
        variablesList.innerHTML = '<div class="no-variables">No variables available</div>';
        variablesCount.textContent = '(0)';
        return;
    }
    
    // 更新变量计数
    const count = Object.keys(variables).length;
    variablesCount.textContent = `(${count})`;
    
    // 创建变量列表
    Object.entries(variables).forEach(([varName, varInfo]) => {
        console.log('Creating variable item:', varName, varInfo);
        
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
            <span class="variable-type">${varInfo.type}</span>
        `;
        
        // 添加拖拽事件监听器
        varItem.addEventListener('dragstart', (e) => {
            console.log('Drag started:', varName);
            e.dataTransfer.setData('text/plain', varName);
            varItem.classList.add('dragging');
        });
        
        varItem.addEventListener('dragend', () => {
            console.log('Drag ended:', varName);
            varItem.classList.remove('dragging');
        });
        
        variablesList.appendChild(varItem);
    });
    
    // 初始化拖放功能
    initializeDragAndDrop();
    console.log('Variables display completed');
    
    // 更新所有下拉选择框的选项
    updateVariableSelects(variables);
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

// 修改初始化拖放功能
function initializeDragAndDrop() {
    console.log('Initializing drag and drop...');
    
    const scatterPlotContainer = document.getElementById('scatterPlotContainer');
    const dependentVarSelect = document.querySelector('.dependent-var-section select');
    const mainEffectsSelect = document.querySelector('.main-effects-section select');
    
    if (scatterPlotContainer) {
        console.log('Found scatter plot container');
        scatterPlotContainer.addEventListener('dragover', handleDragOver);
        scatterPlotContainer.addEventListener('dragleave', handleDragLeave);
        scatterPlotContainer.addEventListener('drop', handleDrop);
        // 设置默认文本
        scatterPlotContainer.innerHTML = 'Drop variables here to create scatter plot';
    } else {
        console.error('Scatter plot container not found');
    }

    [dependentVarSelect, mainEffectsSelect].forEach(area => {
        if (!area) return;
        area.addEventListener('dragover', handleDragOver);
        area.addEventListener('dragleave', handleDragLeave);
        area.addEventListener('drop', handleDrop);
    });
}

// 修改处理拖拽悬停
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag over event on:', e.currentTarget.id);
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
}

// 修改处理拖拽离开
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag leave event on:', e.currentTarget.id);
    e.currentTarget.classList.remove('drag-over');
}

// 修改处理拖拽放下
async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop event on:', e.currentTarget.id);
    
    const dropTarget = e.currentTarget;
    dropTarget.classList.remove('drag-over');
    
    const variableName = e.dataTransfer.getData('text/plain');
    console.log('Dropped variable:', variableName);
    
    if (!variableName || !currentFileId) {
        console.error('Missing variable name or file ID');
        return;
    }

    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        // 如果是散点图区域
        if (dropTarget.id === 'scatterPlotContainer') {
            console.log('Handling drop in scatter plot container');
            // 检查是否已经有一个变量被拖入
            const existingVariable = dropTarget.dataset.variable;
            
            if (!existingVariable) {
                // 第一个变量 - 设置为 X 轴
                dropTarget.dataset.variable = variableName;
                dropTarget.dataset.axis = 'x';
                const contentDiv = document.createElement('div');
                contentDiv.className = 'scatter-info';
                contentDiv.innerHTML = `
                    <p>X-axis: ${variableName}</p>
                    <p>Drop another variable for Y-axis</p>
                `;
                dropTarget.innerHTML = '';
                dropTarget.appendChild(contentDiv);
            } else {
                // 第二个变量 - 设置为 Y 轴并创建散点图
                showLoading('Generating scatter plot...');
                
                try {
                    console.log('Requesting scatter plot with:', {
                        file_path: currentFileId,
                        x: existingVariable,
                        y: variableName,
                        user_id: session.user.id
                    });
                    
                    const response = await fetch(API_ENDPOINTS.scatter, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            file_path: currentFileId,
                            x_variable: existingVariable,
                            y_variable: variableName,
                            user_id: session.user.id,
                            x_label: existingVariable,
                            y_label: variableName,
                            title: `${existingVariable} vs ${variableName}`
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    console.log('Scatter plot response:', result);

                    if (result.status === 'success') {
                        console.log('Successfully generated scatter plot');
                        
                        // 添加has-image类来移除虚线边框
                        dropTarget.classList.add('has-image');
                        
                        // 创建一个容器来包装图片和重置按钮
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'scatter-plot-content';
                        
                        // 创建图片元素
                        const img = document.createElement('img');
                        img.src = `data:image/png;base64,${result.plot}`;
                        img.alt = 'Scatter Plot';
                        
                        // 创建重置按钮
                        const resetBtn = document.createElement('button');
                        resetBtn.className = 'reset-scatter-btn';
                        resetBtn.innerHTML = '<i class="fas fa-redo"></i> Reset';
                        resetBtn.onclick = () => {
                            dropTarget.innerHTML = 'Drop variables here to create scatter plot';
                            dropTarget.removeAttribute('data-variable');
                            dropTarget.removeAttribute('data-axis');
                            dropTarget.classList.remove('has-image'); // 移除has-image类，恢复虚线边框
                        };
                        
                        // 添加元素到容器
                        contentDiv.appendChild(img);
                        contentDiv.appendChild(resetBtn);
                        
                        // 清空并添加新内容
                        dropTarget.innerHTML = '';
                        dropTarget.appendChild(contentDiv);
                    } else {
                        throw new Error(result.message || 'Failed to create scatter plot');
                    }
                } catch (error) {
                    console.error('Error creating scatter plot:', error);
                    showError(`Failed to create scatter plot: ${error.message}`);
                    // 重置状态
                    dropTarget.innerHTML = 'Drop variables here to create scatter plot';
                    dropTarget.removeAttribute('data-variable');
                    dropTarget.removeAttribute('data-axis');
                }
            }
        } else {
            // 下拉框选择逻辑
            console.log('Handling drop in variable select area');
            updateVariableSelects(variableName, dropTarget);
        }
    } catch (error) {
        console.error('Error handling drop:', error);
        showError(`Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Add main effect
function addMainEffect(variableName) {
    const effectsDisplay = document.querySelector('.selected-effects-display');
    if (!effectsDisplay) return;
    
    // 检查是否已经存在
    const existingItem = Array.from(effectsDisplay.querySelectorAll('.selected-effect-item'))
        .find(item => item.querySelector('span').textContent === variableName);
    
    if (existingItem) return; // 避免重复添加
    
    const effectItem = document.createElement('div');
    effectItem.className = 'selected-effect-item';
    effectItem.innerHTML = `
        <span>${variableName}</span>
        <button class="remove-effect" data-variable="${variableName}">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    effectsDisplay.appendChild(effectItem);
    
    // Add remove event listener
    const removeBtn = effectItem.querySelector('.remove-effect');
    removeBtn.addEventListener('click', () => {
        effectItem.remove();
    });
}

// Add interaction effect
function addInteractionEffect(var1, var2) {
    const interactionsDisplay = document.querySelector('.interactions-list');
    if (!interactionsDisplay) return;
    
    const interactionId = `interaction-${var1}-${var2}`;
    
    // Check if interaction already exists
    if (document.getElementById(interactionId)) {
        showError('This interaction already exists');
        return;
    }
    
    const interactionTag = document.createElement('div');
    interactionTag.className = 'interaction-tag';
    interactionTag.id = interactionId;
    interactionTag.dataset.variables = `${var1},${var2}`;
    interactionTag.innerHTML = `
        <span>${var1} × ${var2}</span>
        <button class="remove-interaction" title="Remove interaction">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add remove event listener
    const removeBtn = interactionTag.querySelector('.remove-interaction');
    removeBtn.addEventListener('click', () => {
        interactionTag.remove();
    });
    
    interactionsDisplay.appendChild(interactionTag);
}

// Run regression analysis
async function runRegressionAnalysis() {
    try {
        // Check if Supabase client is available
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session?.user?.id) {
            throw new Error('User not authenticated');
        }

        showLoading('Running analysis...');

        // Get selected variables and options
        const dependentVar = document.querySelector('.dependent-var-section select').value;
        const mainEffects = Array.from(document.querySelectorAll('.selected-effect-item span'))
            .map(span => span.textContent);
        const interactions = Array.from(document.querySelectorAll('.interaction-tag'))
            .map(tag => tag.dataset.variables.split(','));
        const randomSlopes = Array.from(document.querySelectorAll('.selected-slope-item span'))
            .map(span => span.textContent);
        
        const options = {
            intercept: document.getElementById('intercept').checked,
            covarianceStructure: document.getElementById('covStructure').value,
            estimationMethod: document.getElementById('estimationMethod').value,
            maxIterations: parseInt(document.getElementById('maxIter').value),
            convergenceTolerance: parseFloat(document.getElementById('convTol').value)
        };

        // 验证必要的变量
        if (!dependentVar) {
            throw new Error('Please select a dependent variable');
        }

        if (mainEffects.length === 0) {
            throw new Error('Please select at least one main effect');
        }

        const response = await fetch(API_ENDPOINTS.regressionModel, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_path: `${session.user.id}/${currentFileId}`,
                dependent_variable: dependentVar,
                main_effects: mainEffects,
                interactions: interactions,
                random_slopes: randomSlopes,
                options: options,
                user_id: session.user.id
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
            displayResults(result);
            
            // 切换到结果选项卡
            switchTab('summary');
            
            // 滚动到结果部分
            document.querySelector('.model-results-panel').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            throw new Error(result.message || 'Analysis failed');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Analysis failed: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Display analysis results
function displayResults(result) {
    // Update summary tab
    const summaryContent = document.querySelector('#resultsContent[data-tab="summary"]');
    if (summaryContent) {
        summaryContent.innerHTML = `
            <div class="summary-stats">
                <div class="stat-item">
                    <h4>R-squared</h4>
                    <p>${result.metrics.r_squared.toFixed(4)}</p>
                </div>
                <div class="stat-item">
                    <h4>Adjusted R-squared</h4>
                    <p>${result.metrics.adjusted_r_squared.toFixed(4)}</p>
                </div>
                <div class="stat-item">
                    <h4>F-statistic</h4>
                    <p>${result.metrics.f_statistic.toFixed(4)}</p>
                </div>
                <div class="stat-item">
                    <h4>p-value</h4>
                    <p>${result.metrics.p_value.toFixed(4)}</p>
                </div>
            </div>
        `;
    }

    // Update coefficients tab
    const coefficientsContent = document.querySelector('#resultsContent[data-tab="coefficients"]');
    if (coefficientsContent && result.coefficients) {
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Variable</th>
                <th>Estimate</th>
                <th>Std. Error</th>
                <th>t-value</th>
                <th>p-value</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        Object.entries(result.coefficients).forEach(([varName, coef]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${varName}</td>
                <td>${coef.estimate.toFixed(4)}</td>
                <td>${coef.std_error.toFixed(4)}</td>
                <td>${coef.t_value.toFixed(4)}</td>
                <td>${coef.p_value.toFixed(4)}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        coefficientsContent.innerHTML = '';
        coefficientsContent.appendChild(table);
    }

    // Update diagnostics tab
    const diagnosticsContent = document.querySelector('#resultsContent[data-tab="diagnostics"]');
    if (diagnosticsContent && result.diagnostics) {
        const diagnosticsPlots = document.createElement('div');
        diagnosticsPlots.className = 'diagnostics-plots';
        
        result.diagnostics.plots.forEach(plot => {
            const plotContainer = document.createElement('div');
            plotContainer.className = 'plot-container';
            
            const plotTitle = document.createElement('h4');
            plotTitle.textContent = plot.title;
            plotContainer.appendChild(plotTitle);
            
            const plotDiv = document.createElement('div');
            plotDiv.id = plot.id;
            plotContainer.appendChild(plotDiv);
            
            diagnosticsPlots.appendChild(plotContainer);
            
            // Render diagnostic plot
            const plotData = JSON.parse(plot.data);
            Plotly.newPlot(plot.id, plotData.data, plotData.layout);
        });
        
        diagnosticsContent.innerHTML = '';
        diagnosticsContent.appendChild(diagnosticsPlots);
    }

    // Update visualization tab
    const vizContent = document.querySelector('#vizContent');
    if (vizContent && result.visualizations) {
        const plotData = JSON.parse(result.visualizations.plot);
        Plotly.newPlot('vizContent', plotData.data, plotData.layout);
    }
}

// Switch between tabs
function switchTab(tabId) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.results-content, .viz-content').forEach(content => {
        content.classList.remove('active');
    });

    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const selectedContent = document.querySelector(`#resultsContent[data-tab="${tabId}"], #vizContent[data-tab="${tabId}"]`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

// Show loading overlay
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingOverlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(loadingDiv);
}

// Hide loading overlay
function hideLoading() {
    const loadingDiv = document.getElementById('loadingOverlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Clear variables list
function clearVariablesList() {
    const variablesList = document.querySelector('.variables-list');
    if (variablesList) {
        variablesList.innerHTML = '';
    }
    
    const variablesCount = document.querySelector('.variables-count');
    if (variablesCount) {
        variablesCount.textContent = '(0)';
    }
    
    currentVariables = null;
}

// Add random slope
function addRandomSlope(variableName) {
    const slopesDisplay = document.querySelector('.selected-slopes-display');
    if (!slopesDisplay) return;
    
    // 检查是否已经存在
    const existingItem = Array.from(slopesDisplay.querySelectorAll('.selected-slope-item'))
        .find(item => item.querySelector('span').textContent === variableName);
    
    if (existingItem) return; // 避免重复添加
    
    const slopeItem = document.createElement('div');
    slopeItem.className = 'selected-slope-item';
    slopeItem.innerHTML = `
        <span>${variableName}</span>
        <button class="remove-slope" title="Remove slope">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    slopesDisplay.appendChild(slopeItem);
    
    // 添加删除事件监听器
    const removeBtn = slopeItem.querySelector('.remove-slope');
    removeBtn.addEventListener('click', () => {
        slopeItem.remove();
    });
}
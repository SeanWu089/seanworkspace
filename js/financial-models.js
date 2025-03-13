document.addEventListener('DOMContentLoaded', async function() {
  // 获取用户数据和文件列表
  async function loadUserData() {
    try {
      const session = await checkUserAuth();
      if (!session) {
        window.location.href = 'index.html'; // 重定向到登录页面
        return;
      }

      // 从localStorage获取已处理的数据
      const savedPreview = localStorage.getItem('previewData');
      const rawData = localStorage.getItem('rawData');
      
      if (savedPreview && rawData) {
        // 如果有已处理的数据，更新数据表格
        updateDataTable(JSON.parse(savedPreview), JSON.parse(rawData));
      }

      // 初始化模型选择界面
      initializeModelSelection();
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Failed to load your data. Please try again.');
    }
  }

  // 更新数据表格
  function updateDataTable(previewData, rawData) {
    const dataTableBody = document.getElementById('dataTableBody');
    if (!dataTableBody) return;

    // 创建表格头部
    const headers = previewData.map(col => col.name);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    dataTableBody.appendChild(headerRow);

    // 添加数据行（显示前5行作为预览）
    const previewRows = rawData.slice(0, 5);
    previewRows.forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach((_, index) => {
        const td = document.createElement('td');
        td.textContent = row[index] || '';
        tr.appendChild(td);
      });
      dataTableBody.appendChild(tr);
    });

    // 显示数据类型信息
    const dataTypeInfo = document.createElement('div');
    dataTypeInfo.className = 'data-type-info';
    dataTypeInfo.innerHTML = `
      <h3>Data Structure</h3>
      <ul>
        ${previewData.map(col => `
          <li>${col.name}: ${col.type}</li>
        `).join('')}
      </ul>
    `;
    document.querySelector('.data-selection-section').appendChild(dataTypeInfo);
  }

  // 初始化模型选择界面
  function initializeModelSelection() {
    // 根据数据类型启用/禁用相应的模型
    const dataTypes = JSON.parse(localStorage.getItem('previewData') || '[]')
      .map(col => col.type);
    
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach(card => {
      const modelId = card.getAttribute('data-model');
      const isCompatible = checkModelCompatibility(modelId, dataTypes);
      
      if (!isCompatible) {
        card.classList.add('disabled');
        card.setAttribute('title', 'This model is not compatible with your data type');
      } else {
        card.classList.remove('disabled');
        card.removeAttribute('title');
      }

      // 添加选择事件
      card.addEventListener('click', function() {
        if (!this.classList.contains('disabled')) {
          toggleModelSelection(this);
        }
      });
    });

    // 更新过滤器选项
    updateFilterOptions(dataTypes);
  }

  // 检查模型兼容性
  function checkModelCompatibility(modelId, dataTypes) {
    // 根据模型ID和数据类型判断兼容性
    const modelRequirements = {
      'arima': ['float', 'integer', 'date'],
      'garch': ['float', 'integer'],
      'ewma': ['float', 'integer'],
      'var': ['float', 'integer'],
      'cvar': ['float', 'integer'],
      'monte-carlo': ['float', 'integer'],
      // ... 其他模型的要求
    };

    const requirements = modelRequirements[modelId] || [];
    return requirements.some(req => dataTypes.includes(req));
  }

  // 更新过滤器选项
  function updateFilterOptions(dataTypes) {
    const dataTypeFilter = document.getElementById('dataTypeFilter');
    const uniqueTypes = [...new Set(dataTypes)];
    
    // 更新数据类型过滤器选项
    if (dataTypeFilter) {
      dataTypeFilter.innerHTML = `
        <option value="all">All Types</option>
        ${uniqueTypes.map(type => `
          <option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>
        `).join('')}
      `;
    }
  }

  // 切换模型选择
  function toggleModelSelection(card) {
    card.classList.toggle('selected');
    const modelId = card.getAttribute('data-model');
    
    let selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
    
    if (card.classList.contains('selected')) {
      if (!selectedModels.includes(modelId)) {
        selectedModels.push(modelId);
      }
    } else {
      selectedModels = selectedModels.filter(id => id !== modelId);
    }
    
    localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
    updateGenerateButton(selectedModels.length > 0);
  }

  // 更新生成按钮状态
  function updateGenerateButton(enabled) {
    const generateButton = document.getElementById('generateResults');
    if (generateButton) {
      generateButton.disabled = !enabled;
      generateButton.classList.toggle('active', enabled);
    }
  }

  // 初始化页面
  loadUserData();

  // 添加生成结果按钮事件
  document.getElementById('generateResults')?.addEventListener('click', async function() {
    const selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
    const rawData = JSON.parse(localStorage.getItem('rawData') || 'null');
    
    if (!selectedModels.length || !rawData) {
      alert('Please select data and models for analysis.');
      return;
    }

    try {
      // 这里可以添加加载动画
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

      // 重定向到结果页面
      window.location.href = 'IntegratedModels.html';
    } catch (error) {
      console.error('Error generating results:', error);
      alert('Failed to generate results. Please try again.');
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-magic"></i> Generate Analysis Results';
    }
  });
}); 
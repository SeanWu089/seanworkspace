document.addEventListener('DOMContentLoaded', function() {
  // 获取所有模型卡片
  const modelCards = document.querySelectorAll('.model-card');
  
  // 从本地存储中获取已选择的模型
  let selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
  
  // 为每个卡片添加选择指示器
  modelCards.forEach(card => {
    // 添加选择指示器元素
    const indicator = document.createElement('div');
    indicator.className = 'selection-indicator';
    card.appendChild(indicator);
    
    // 如果模型已经被选中，添加选中样式
    const modelId = card.getAttribute('data-model');
    if (selectedModels.includes(modelId)) {
      card.classList.add('selected');
    }
    
    // 添加点击事件
    card.addEventListener('click', function() {
      const modelId = this.getAttribute('data-model');
      toggleModelSelection(modelId, this);
    });
  });
  
  // 切换模型选择状态
  function toggleModelSelection(modelId, cardElement) {
    const index = selectedModels.indexOf(modelId);
    
    if (index === -1) {
      // 选中模型
      selectedModels.push(modelId);
      cardElement.classList.add('selected');
    } else {
      // 取消选中
      selectedModels.splice(index, 1);
      cardElement.classList.remove('selected');
    }
    
    // 更新本地存储
    localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
    
    // 更新集成模型按钮状态
    updateIntegratedModelsButton();
  }
  
  // 更新集成模型按钮状态
  function updateIntegratedModelsButton() {
    const integratedButton = document.querySelector('.integrated-models-button');
    if (integratedButton) {
      if (selectedModels.length > 0) {
        integratedButton.classList.add('active');
        integratedButton.querySelector('span').textContent = 
          `Explore Integrated Models (${selectedModels.length})`;
      } else {
        integratedButton.classList.remove('active');
        integratedButton.querySelector('span').textContent = 
          'Explore Integrated Models';
      }
    }
  }
  
  // 初始化集成模型按钮状态
  updateIntegratedModelsButton();
  
  // 为集成模型按钮添加点击事件
  const integratedButton = document.querySelector('.integrated-models-button');
  if (integratedButton) {
    integratedButton.addEventListener('click', function(e) {
      if (selectedModels.length === 0) {
        e.preventDefault();
        alert('Please select at least one model to explore integrated models.');
      } else {
        window.location.href = 'IntegratedModels.html';
      }
    });
  }
  
  // 添加类别过滤功能
  const categoryButtons = document.querySelectorAll('.category-filter button');
  if (categoryButtons) {
    categoryButtons.forEach(button => {
      button.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        
        // 更新按钮状态
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // 过滤模型卡片
        modelCards.forEach(card => {
          if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
}); 
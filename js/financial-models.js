document.addEventListener('DOMContentLoaded', function() {
  // 获取所有模型卡片
  const modelCards = document.querySelectorAll('.model-card');
  
  // 为每个卡片添加点击事件
  modelCards.forEach(card => {
    card.addEventListener('click', function() {
      const modelId = this.getAttribute('data-model');
      
      // 保存选中的模型到本地存储，以便在集成模型页面使用
      let selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
      
      // 检查模型是否已经被选中
      const modelIndex = selectedModels.indexOf(modelId);
      
      if (modelIndex === -1) {
        // 如果模型未被选中，添加到选中列表
        selectedModels.push(modelId);
        this.classList.add('selected');
      } else {
        // 如果模型已被选中，从列表中移除
        selectedModels.splice(modelIndex, 1);
        this.classList.remove('selected');
      }
      
      // 更新本地存储
      localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
      
      // 更新选中状态的视觉反馈
      updateSelectedVisuals();
    });
  });
  
  // 初始化时更新选中状态的视觉反馈
  updateSelectedVisuals();
  
  // 更新选中状态的视觉反馈
  function updateSelectedVisuals() {
    const selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
    
    // 更新每个卡片的视觉状态
    modelCards.forEach(card => {
      const modelId = card.getAttribute('data-model');
      
      if (selectedModels.includes(modelId)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
    
    // 更新集成模型按钮的计数
    const integratedButton = document.querySelector('.integrated-models-button span');
    if (integratedButton && selectedModels.length > 0) {
      integratedButton.textContent = `Explore Integrated Models (${selectedModels.length})`;
    } else if (integratedButton) {
      integratedButton.textContent = 'Explore Integrated Models';
    }
  }
  
  // 添加卡片的悬停效果
  modelCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
    });
    
    card.addEventListener('mouseleave', function() {
      if (!this.classList.contains('selected')) {
        this.style.transform = '';
        this.style.boxShadow = '';
      }
    });
  });
  
  // 为集成模型按钮添加点击事件
  const integratedButton = document.querySelector('.integrated-models-button');
  if (integratedButton) {
    integratedButton.addEventListener('click', function(e) {
      const selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
      
      // 如果没有选择任何模型，阻止导航并提示用户
      if (selectedModels.length === 0) {
        e.preventDefault();
        alert('Please select at least one model to explore integrated models.');
      }
    });
  }
}); 
class ModelWorkflow {
  constructor() {
    this.uploadedData = null;
    this.selectedModels = [];
    this.parameters = {};
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // 文件上传处理
    document.getElementById('dataFile').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    // 数据类型筛选
    document.getElementById('dataTypeFilter').addEventListener('change', (e) => {
      this.updateModelRecommendations(e.target.value);
    });

    // 生成结果
    document.getElementById('generateResults').addEventListener('click', () => {
      this.generateResults();
    });
  }

  async handleFileUpload(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // 发送到后端进行处理
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      this.uploadedData = data;
      
      // 显示数据预览
      this.showDataPreview(data);
      
      // 更新模型推荐
      this.updateModelRecommendations(data.dataType);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    }
  }

  async generateResults() {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: this.uploadedData,
          models: this.selectedModels,
          parameters: this.parameters
        })
      });

      const results = await response.json();
      
      // 保存结果并跳转到结果页面
      localStorage.setItem('analysisResults', JSON.stringify(results));
      window.location.href = 'ModelResults.html';
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to generate results. Please try again.');
    }
  }
}

// 初始化工作流
const workflow = new ModelWorkflow(); 
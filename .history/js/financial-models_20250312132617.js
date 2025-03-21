document.addEventListener('DOMContentLoaded', function() {
  // 使用现有的Supabase客户端
  const { supabase } = window;
  
  // 获取用户数据
  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = 'index.html'; // 重定向到登录页面
        return;
      }

      // 获取用户上传的数据文件
      const { data: files, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 渲染数据表格
      renderDataTable(files);
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Failed to load your data. Please try again.');
    }
  }

  // 渲染数据表格
  function renderDataTable(files) {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = files.map(file => `
      <tr>
        <td>${file.filename}</td>
        <td>${new Date(file.created_at).toLocaleDateString()}</td>
        <td>${file.data_type || 'Unknown'}</td>
        <td>
          <span class="status-badge ${file.status.toLowerCase()}">
            ${file.status}
          </span>
        </td>
        <td>
          <button class="select-data-btn" data-file-id="${file.id}">
            Select for Analysis
          </button>
        </td>
      </tr>
    `).join('');

    // 添加数据选择事件监听器
    document.querySelectorAll('.select-data-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const fileId = this.getAttribute('data-file-id');
        selectDataForAnalysis(fileId);
      });
    });
  }

  // 选择数据进行分析
  async function selectDataForAnalysis(fileId) {
    try {
      // 获取文件数据
      const { data: fileData, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      // 存储选中的数据ID
      localStorage.setItem('selectedDataId', fileId);
      
      // 根据数据类型更新推荐模型
      updateModelRecommendations(fileData.data_type);
      
      // 显示模型选择部分
      document.querySelector('.model-selection-section').style.display = 'block';
      
      // 滚动到模型选择部分
      document.querySelector('.model-selection-section').scrollIntoView({
        behavior: 'smooth'
      });
    } catch (error) {
      console.error('Error selecting data:', error);
      alert('Failed to select data for analysis. Please try again.');
    }
  }

  // 更新模型推荐
  function updateModelRecommendations(dataType) {
    // 根据数据类型过滤和显示推荐模型
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach(card => {
      const modelCategories = card.getAttribute('data-categories').split(' ');
      if (dataType === 'all' || modelCategories.includes(dataType)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // 生成分析结果
  async function generateResults() {
    const selectedDataId = localStorage.getItem('selectedDataId');
    const selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');

    if (!selectedDataId || selectedModels.length === 0) {
      alert('Please select both data and models for analysis.');
      return;
    }

    try {
      // 调用后端API进行分析
      const { data: analysisJob, error } = await supabase
        .from('analysis_jobs')
        .insert([{
          data_id: selectedDataId,
          models: selectedModels,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // 重定向到结果页面
      window.location.href = `IntegratedModels.html?job_id=${analysisJob.id}`;
    } catch (error) {
      console.error('Error generating results:', error);
      alert('Failed to start analysis. Please try again.');
    }
  }

  // 初始化页面
  loadUserData();

  // 添加生成结果按钮事件监听器
  document.getElementById('generateResults').addEventListener('click', generateResults);
}); 
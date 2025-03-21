document.addEventListener('DOMContentLoaded', function() {
  // 全局变量
  let charts = {}; // 存储创建的图表实例
  let tickerData = {}; // 存储已加载的股票数据
  
  // -------------------- 侧边栏逻辑 --------------------
  // 左侧边栏
  const leftSidebar = document.getElementById('leftSidebar');
  const leftToggle = document.getElementById('leftToggle');
  if (leftToggle && leftSidebar) {
    leftToggle.addEventListener('click', () => {
      leftSidebar.classList.toggle('show');
      leftToggle.style.transform = leftSidebar.classList.contains('show')
        ? 'rotate(180deg)'
        : 'rotate(0deg)';
      leftToggle.style.left = leftSidebar.classList.contains('show')
        ? '280px'
        : '5px';
    });
  }

  // 右侧边栏
  const rightSidebar = document.getElementById('rightSidebar');
  const rightToggle = document.getElementById('rightToggle');
  if (rightToggle && rightSidebar) {
    rightToggle.addEventListener('click', () => {
      rightSidebar.classList.toggle('show');
      rightToggle.style.transform = rightSidebar.classList.contains('show')
        ? 'rotate(180deg)'
        : 'rotate(0deg)';
      rightToggle.style.right = rightSidebar.classList.contains('show')
        ? '180px'
        : '5px';
    });
  }
  
  // -------------------- 股票选择逻辑 --------------------
  const tickerInput = document.getElementById('tickerInput');
  const addTickerBtn = document.getElementById('addTickerBtn');
  const selectedTickers = document.getElementById('selectedTickers');
  
  // 添加股票代码
  function addTicker(ticker) {
    if (!ticker) return;
    
    // 检查是否已添加
    const existingTickers = Array.from(selectedTickers.children).map(
      tag => tag.dataset.ticker
    );
    
    if (existingTickers.includes(ticker)) {
      // 可以添加一个轻微的抖动动画作为反馈
      const existingTag = Array.from(selectedTickers.children).find(
        tag => tag.dataset.ticker === ticker
      );
      existingTag.classList.add('shake');
      setTimeout(() => existingTag.classList.remove('shake'), 500);
      return;
    }
    
    // 创建标签
    const tickerTag = document.createElement('div');
    tickerTag.className = 'ticker-tag';
    tickerTag.dataset.ticker = ticker;
    
    const tickerText = document.createElement('span');
    tickerText.textContent = ticker;
    
    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-ticker';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      tickerTag.remove();
    });
    
    tickerTag.appendChild(tickerText);
    tickerTag.appendChild(removeBtn);
    selectedTickers.appendChild(tickerTag);
    
    // 清空输入框
    tickerInput.value = '';
  }
  
  // 添加按钮点击事件
  addTickerBtn.addEventListener('click', () => {
    addTicker(tickerInput.value.trim().toUpperCase());
  });
  
  // 输入框回车事件
  tickerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTicker(tickerInput.value.trim().toUpperCase());
    }
  });
  
  // -------------------- 分析按钮逻辑 --------------------
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const placeholderMessage = document.getElementById('placeholderMessage');
  const resultsSection = document.getElementById('resultsSection');
  
  analyzeBtn.addEventListener('click', async () => {
    // 获取所有参数
    const tickers = Array.from(selectedTickers.children).map(tag => tag.dataset.ticker);
    if (tickers.length === 0) {
      alert('Please add at least one ticker symbol');
      return;
    }
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const model = document.querySelector('input[name="volatilityModel"]:checked').value;
    const confidenceLevel = document.getElementById('confidenceLevel').value;
    
    // 显示加载动画
    loadingOverlay.classList.remove('hidden');
    placeholderMessage.classList.add('hidden');
    
    try {
      // 对每个股票进行分析
      const results = {};
      for (const ticker of tickers) {
        results[ticker] = await fetchVolatilityData(ticker, startDate, endDate, model);
      }
      
      // 处理结果
      renderResults(results, confidenceLevel);
      
      // 显示结果区域
      resultsSection.classList.remove('hidden');
      resultsSection.classList.add('visible');
      
      // 滚动到结果区域
      setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze volatility. Please try again.');
    } finally {
      // 隐藏加载动画
      loadingOverlay.classList.add('hidden');
    }
  });
  
  // -------------------- 数据获取函数 --------------------
  async function fetchVolatilityData(ticker, startDate, endDate, model='GARCH') {
    // 这里调用您的API
    const response = await fetch(`/api/volatility?ticker=${ticker}&start=${startDate}&end=${endDate}&model=${model}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${ticker}`);
    }
    
    const data = await response.json();
    return data;
  }
  
  // -------------------- 结果渲染函数 --------------------
  function renderResults(results, confidenceLevel) {
    // 清空图表容器
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = '';
    
    // 创建图表canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'volatilityChart';
    chartContainer.appendChild(canvas);
    
    // 准备图表数据
    const chartData = prepareChartData(results, confidenceLevel);
    
    // 创建图表
    const ctx = canvas.getContext('2d');
    charts.volatility = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: 'Volatility Analysis',
            font: {
              size: 18
            }
          },
          tooltip: {
            enabled: true
          },
          legend: {
            position: 'top',
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'month',
              tooltipFormat: 'MMM dd, yyyy'
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Value'
            }
          }
        }
      }
    });
    
    // 渲染模型参数
    renderModelParameters(results);
    
    // 渲染风险指标
    renderRiskMetrics(results, confidenceLevel);
  }
  
  // 准备图表数据
  function prepareChartData(results, confidenceLevel) {
    const datasets = [];
    const colors = ['#002FA7', '#FF6B6B', '#4CAF50', '#9C27B0', '#FF9800'];
    
    let colorIndex = 0;
    for (const ticker in results) {
      const data = results[ticker];
      const color = colors[colorIndex % colors.length];
      
      // 添加波动率数据
      datasets.push({
        label: `${ticker} Volatility`,
        data: data.varSeries.map(point => ({
          x: new Date(point.date),
          y: point.value
        })),
        borderColor: color,
        backgroundColor: `${color}33`, // 添加透明度
        borderWidth: 2,
        fill: false
      });
      
      // 添加实际收益率数据
      datasets.push({
        label: `${ticker} Returns`,
        data: data.returns.map(point => ({
          x: new Date(point.date),
          y: point.value
        })),
        borderColor: `${color}88`,
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [5, 5],
        fill: false
      });
      
      colorIndex++;
    }
    
    return { datasets };
  }
  
  // 渲染模型参数
  function renderModelParameters(results) {
    const modelParameters = document.getElementById('modelParameters');
    modelParameters.innerHTML = '';
    
    for (const ticker in results) {
      const data = results[ticker];
      
      const tickerHeader = document.createElement('h3');
      tickerHeader.textContent = ticker;
      modelParameters.appendChild(tickerHeader);
      
      const paramsTable = document.createElement('table');
      paramsTable.className = 'params-table';
      
      // 表头
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Parameter', 'Value', 'Std Error', 'P-value'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      paramsTable.appendChild(thead);
      
      // 表体
      const tbody = document.createElement('tbody');
      for (const param in data.modelParams) {
        const row = document.createElement('tr');
        
        const paramCell = document.createElement('td');
        paramCell.textContent = param;
        row.appendChild(paramCell);
        
        const valueCell = document.createElement('td');
        valueCell.textContent = data.modelParams[param].value.toFixed(4);
        row.appendChild(valueCell);
        
        const stdErrCell = document.createElement('td');
        stdErrCell.textContent = data.modelParams[param].stdError.toFixed(4);
        row.appendChild(stdErrCell);
        
        const pValueCell = document.createElement('td');
        const pValue = data.modelParams[param].pValue;
        pValueCell.textContent = pValue < 0.001 ? '<0.001' : pValue.toFixed(4);
        row.appendChild(pValueCell);
        
        tbody.appendChild(row);
      }
      paramsTable.appendChild(tbody);
      
      modelParameters.appendChild(paramsTable);
    }
  }
  
  // 渲染风险指标
  function renderRiskMetrics(results, confidenceLevel) {
    const riskMetrics = document.getElementById('riskMetrics');
    riskMetrics.innerHTML = '';
    
    for (const ticker in results) {
      const data = results[ticker];
      
      const tickerHeader = document.createElement('h3');
      tickerHeader.textContent = ticker;
      riskMetrics.appendChild(tickerHeader);
      
      // VaR 卡片
      const varCard = createMetricCard(
        'Value at Risk (VaR)',
        `${(data.riskMetrics.var * 100).toFixed(2)}%`,
        `${confidenceLevel * 100}% confidence level over 1-day horizon`
      );
      riskMetrics.appendChild(varCard);
      
      // ES 卡片
      const esCard = createMetricCard(
        'Expected Shortfall (ES)',
        `${(data.riskMetrics.es * 100).toFixed(2)}%`,
        'Average loss when VaR is exceeded'
      );
      riskMetrics.appendChild(esCard);
      
      // 波动率卡片
      const volCard = createMetricCard(
        'Current Volatility',
        `${(data.riskMetrics.currentVol * 100).toFixed(2)}%`,
        'Annualized volatility estimate'
      );
      riskMetrics.appendChild(volCard);
    }
    
    // 渲染预测结果
    renderForecast(results);
  }
  
  // 创建指标卡片
  function createMetricCard(title, value, description) {
    const card = document.createElement('div');
    card.className = 'metric-card';
    
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = title;
    
    const cardValue = document.createElement('div');
    cardValue.className = 'metric-value';
    cardValue.textContent = value;
    
    const cardDesc = document.createElement('div');
    cardDesc.className = 'metric-description';
    cardDesc.textContent = description;
    
    card.appendChild(cardTitle);
    card.appendChild(cardValue);
    card.appendChild(cardDesc);
    
    return card;
  }
  
  // 渲染预测结果
  function renderForecast(results) {
    const forecastResults = document.getElementById('forecastResults');
    forecastResults.innerHTML = '';
    
    for (const ticker in results) {
      const data = results[ticker];
      
      const tickerHeader = document.createElement('h3');
      tickerHeader.textContent = `${ticker} - 5-Day Forecast`;
      forecastResults.appendChild(tickerHeader);
      
      // 创建预测表格
      const forecastTable = document.createElement('table');
      forecastTable.className = 'params-table';
      
      // 表头
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Day', 'Predicted Volatility', 'VaR', 'ES'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      forecastTable.appendChild(thead);
      
      // 表体
      const tbody = document.createElement('tbody');
      for (let i = 0; i < data.forecast.length; i++) {
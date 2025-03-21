document.addEventListener('DOMContentLoaded', function() {
  // ==================== 全局变量 ====================
  let charts = {}; // 存储所有图表实例
  let darkMode = false; // 暗色模式状态
  let selectedAssets = []; // 已选择的资产
  
  // ==================== 初始化函数 ====================
  function initializeApp() {
    setupEventListeners();
    setupDarkModeToggle();
    setupTabNavigation();
    setupDateRangePickers();
    setupConfidenceSlider();
    initializePlaceholderCharts();
  }
  
  // ==================== 事件监听器设置 ====================
  function setupEventListeners() {
    // 资产添加按钮
    document.getElementById('addAssetBtn').addEventListener('click', function() {
      const input = document.getElementById('assetInput');
      addAsset(input.value.trim().toUpperCase());
      input.value = '';
      input.focus();
    });
    
    // 资产输入框回车事件
    document.getElementById('assetInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addAsset(this.value.trim().toUpperCase());
        this.value = '';
      }
    });
    
    // 快速日期范围选择
    document.querySelectorAll('.quick-ranges button').forEach(button => {
      button.addEventListener('click', function() {
        setDateRange(this.dataset.range);
        document.querySelectorAll('.quick-ranges button').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
      });
    });
    
    // 运行分析按钮
    document.getElementById('runAnalysisBtn').addEventListener('click', runAnalysis);
    
    // 设置按钮
    document.getElementById('settingsButton').addEventListener('click', function() {
      document.getElementById('settingsModal').style.display = 'flex';
    });
    
    // 关闭设置弹窗
    document.querySelector('.close-button').addEventListener('click', function() {
      document.getElementById('settingsModal').style.display = 'none';
    });
    
    // 导出结果按钮
    document.getElementById('exportResultsBtn').addEventListener('click', exportResults);
    
    // 切换结果面板
    document.getElementById('toggleResultsBtn').addEventListener('click', function() {
      const resultsContent = document.querySelector('.results-content');
      resultsContent.classList.toggle('collapsed');
      
      // 更新图标方向
      const icon = this.querySelector('svg');
      if (resultsContent.classList.contains('collapsed')) {
        icon.innerHTML = '<path d="M7 14l5-5 5 5H7z"/>';
      } else {
        icon.innerHTML = '<path d="M7 10l5 5 5-5H7z"/>';
      }
    });
  }
  
  // ==================== 暗色模式切换 ====================
  function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // 检查用户偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      enableDarkMode();
    }
    
    darkModeToggle.addEventListener('click', function() {
      if (darkMode) {
        disableDarkMode();
      } else {
        enableDarkMode();
      }
    });
  }
  
  function enableDarkMode() {
    document.documentElement.setAttribute('data-theme', 'dark');
    darkMode = true;
    updateChartThemes('dark');
  }
  
  function disableDarkMode() {
    document.documentElement.removeAttribute('data-theme');
    darkMode = false;
    updateChartThemes('light');
  }
  
  function updateChartThemes(theme) {
    // 更新所有图表的主题
    for (const chartId in charts) {
      if (charts[chartId]) {
        const layout = {
          paper_bgcolor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          plot_bgcolor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          font: {
            color: theme === 'dark' ? '#e9ecef' : '#212529'
          },
          xaxis: {
            gridcolor: theme === 'dark' ? '#343a40' : '#e9ecef'
          },
          yaxis: {
            gridcolor: theme === 'dark' ? '#343a40' : '#e9ecef'
          }
        };
        
        Plotly.relayout(chartId, layout);
      }
    }
  }
  
  // ==================== 标签页导航 ====================
  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // 移除所有活动状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // 设置当前标签为活动状态
        this.classList.add('active');
        const tabId = this.dataset.tab + 'Tab';
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
  
  // ==================== 日期范围选择器 ====================
  function setupDateRangePickers() {
    // 设置默认日期
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    document.getElementById('startDate').valueAsDate = oneYearAgo;
    document.getElementById('endDate').valueAsDate = today;
  }
  
  function setDateRange(range) {
    const endDate = new Date();
    let startDate = new Date();
    
    switch(range) {
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '3Y':
        startDate.setFullYear(endDate.getFullYear() - 3);
        break;
      case '5Y':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      case 'YTD':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
    }
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
  }
  
  // ==================== 置信水平滑块 ====================
  function setupConfidenceSlider() {
    const slider = document.getElementById('confidenceSlider');
    const valueDisplay = document.getElementById('confidenceValue');
    
    valueDisplay.textContent = slider.value + '%';
    
    slider.addEventListener('input', function() {
      valueDisplay.textContent = this.value + '%';
    });
  }
  
  // ==================== 资产管理 ====================
  function addAsset(ticker) {
    if (!ticker) return;
    
    // 检查是否已添加
    if (selectedAssets.includes(ticker)) {
      // 提供视觉反馈
      const existingTag = document.querySelector(`.asset-tag[data-ticker="${ticker}"]`);
      if (existingTag) {
        existingTag.classList.add('shake');
        setTimeout(() => existingTag.classList.remove('shake'), 500);
      }
      return;
    }
    
    // 添加到数组
    selectedAssets.push(ticker);
    
    // 创建标签
    const assetTag = document.createElement('div');
    assetTag.className = 'asset-tag';
    assetTag.dataset.ticker = ticker;
    assetTag.innerHTML = `
      <span>${ticker}</span>
      <span class="remove-asset">&times;</span>
    `;
    
    // 添加删除事件
    assetTag.querySelector('.remove-asset').addEventListener('click', function() {
      removeAsset(ticker);
      assetTag.remove();
    });
    
    // 添加到DOM
    document.getElementById('selectedAssets').appendChild(assetTag);
  }
  
  function removeAsset(ticker) {
    const index = selectedAssets.indexOf(ticker);
    if (index > -1) {
      selectedAssets.splice(index, 1);
    }
  }
  
  // ==================== 图表初始化 ====================
  function initializePlaceholderCharts() {
    // 创建占位图表
    const volatilityChartDiv = document.getElementById('volatilityChart');
    const returnsChartDiv = document.getElementById('returnsChart');
    const varChartDiv = document.getElementById('varChart');
    
    // 占位数据
    const x = Array.from({length: 100}, (_, i) => new Date(2022, 0, i + 1));
    const y = Array.from({length: 100}, () => Math.random() * 0.02 + 0.01);
    
    // 波动率图表
    Plotly.newPlot('volatilityChart', [{
      x: x,
      y: y,
      type: 'scatter',
      mode: 'lines',
      name: 'Placeholder',
      line: {
        color: '#cccccc',
        dash: 'dot'
      }
    }], {
      title: 'Select assets and run analysis to view volatility',
      xaxis: {
        title: 'Date',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: 'Volatility',
        showgrid: true,
        zeroline: false
      },
      showlegend: false,
      hovermode: 'closest',
      margin: {
        l: 50,
        r: 20,
        t: 50,
        b: 50
      }
    }, {
      responsive: true
    });
    
    // 存储图表实例
    charts.volatility = volatilityChartDiv;
    charts.returns = returnsChartDiv;
    charts.var = varChartDiv;
    
    // 创建类似的占位图表用于其他标签页
    createPlaceholderChart('returnsChart', 'Returns', 'Return');
    createPlaceholderChart('varChart', 'Value at Risk', 'VaR');
    
    // 诊断图表
    createPlaceholderChart('acfChart', 'ACF', 'Correlation', true);
    createPlaceholderChart('pacfChart', 'PACF', 'Partial Correlation', true);
    createPlaceholderChart('qqChart', 'Q-Q Plot', 'Theoretical Quantiles', true);
    createPlaceholderChart('residualsChart', 'Residuals', 'Residual', true);
  }
  
  function createPlaceholderChart(elementId, title, yAxisTitle, isSmall = false) {
    const x = Array.from({length: 100}, (_, i) => new Date(2022, 0, i + 1));
    const y = Array.from({length: 100}, () => Math.random() * 0.02 - 0.01);
    
    Plotly.newPlot(elementId, [{
      x: isSmall ? Array.from({length: 20}, (_, i) => i) : x,
      y: isSmall ? Array.from({length: 20}, () => Math.random() * 0.5) : y,
      type: isSmall ? 'bar' : 'scatter',
      mode: isSmall ? undefined : 'lines',
      name: 'Placeholder',
      marker: {
        color: '#cccccc'
      }
    }], {
      title: {
        text: title,
        font: {
          size: isSmall ? 14 : 16
        }
      },
      xaxis: {
        title: isSmall ? 'Lag' : 'Date',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: yAxisTitle,
        showgrid: true,
        zeroline: false
      },
      showlegend: false,
      hovermode: 'closest',
      margin: {
        l: isSmall ? 40 : 50,
        r: isSmall ? 10 : 20,
        t: isSmall ? 40 : 50,
        b: isSmall ? 40 : 50
      }
    }, {
      responsive: true
    });
    
    charts[elementId] = document.getElementById(elementId);
  }
  
  // ==================== 分析执行 ====================
  async function runAnalysis() {
    if (selectedAssets.length === 0) {
      alert('Please add at least one asset');
      return;
    }
    
    // 显示加载动画
    document.getElementById('loadingOverlay').classList.remove('hidden');
    
    try {
      // 获取参数
      const params = getAnalysisParameters();
      
      // 模拟API调用
      const results = await simulateApiCall(params);
      
      // 渲染结果
      renderResults(results);
      
      // 显示结果面板
      document.querySelector('.results-content').classList.remove('collapsed');
      
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze volatility: ' + error.message);
    } finally {
      // 隐藏加载动画
      document.getElementById('loadingOverlay').classList.add('hidden');
    }
  }
  
  function getAnalysisParameters() {
    return {
      assets: selectedAssets,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      frequency: document.getElementById('frequency').value,
      modelFamily: document.getElementById('modelFamily').value,
      pOrder: document.getElementById('pOrder').value,
      qOrder: document.getElementById('qOrder').value,
      distribution: document.getElementById('distribution').value,
      estimationMethod: document.getElementById('estimationMethod').value,
      confidenceLevel: document.getElementById('confidenceSlider').value / 100,
      forecastHorizon: document.getElementById('forecastHorizon').value
    };
  }
  
  // 模拟API调用（实际应用中应替换为真实API调用）
  async function simulateApiCall(params) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 为每个资产生成模拟数据
    const results = {};
    
    for (const asset of params.assets) {
      // 生成日期序列
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // 生成收益率序列（模拟正态分布）
      const returns = [];
      let price = 100;
      const dates = [];
      
      for (let i = 0; i <= days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        dates.push(currentDate);
        
        // 模拟每日收益率
        const dailyReturn = (Math.random() * 0.02) - 0.01; // -1% 到 1% 之间
        returns.push(dailyReturn);
        
        // 更新价格
        price = price * (1 + dailyReturn);
      }
      
      // 生成波动率序列（使用GARCH(1,1)模型的简化模拟）
      const volatility = [];
      let vol = 0.01; // 初始波动率
      const omega = 0.000002;
      const alpha = 0.1;
      const beta = 0.85;
      
      for (let i = 0; i < returns.length; i++) {
        volatility.push(vol);
        // 更新波动率 (简化的GARCH(1,1)过程)
        vol = Math.sqrt(omega + alpha * returns[i] * returns[i] + beta * vol * vol);
      }
      
      // 计算VaR
      const varSeries = volatility.map(vol => {
        // 假设正态分布，95%置信水平的VaR
        return vol * 1.645;
      });
      
      // 生成预测
      const forecast = [];
      let lastVol = volatility[volatility.length - 1];
      
      for (let i = 1; i <= params.forecastHorizon; i++) {
        const forecastDate = new Date(endDate);
        forecastDate.setDate(endDate.getDate() + i);
        
        // 预测波动率
        lastVol = Math.sqrt(omega + beta * lastVol * lastVol);
        
        // 计算VaR和ES
        const varValue = lastVol * 1.645;
        const esValue = lastVol * 2.063; // 简化计算
        
        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          volatility: lastVol,
          var: varValue,
          es: esValue
        });
      }
      
      // 模型参数（模拟值）
      const modelParams = {
        omega: {
          value: omega,
          stdError: 0.000001,
          tValue: 2.5,
          pValue: 0.012
        },
        alpha: {
          value: alpha,
          stdError: 0.02,
          tValue: 5.0,
          pValue: 0.000001
        },
        beta: {
          value: beta,
          stdError: 0.03,
          tValue: 28.3,
          pValue: 0.000000
        }
      };
      
      // 拟合统计量
      const fitStats = {
        logLikelihood: -1500.25,
        aic: 3006.5,
        bic: 3020.3,
        hqic: 3011.8,
        rmse: 0.0089,
        ljungBox: {
          statistic: 15.3,
          pValue: 0.12
        },
        archLM: {
          statistic: 0.8,
          pValue: 0.37
        }
      };
      
      // 风险指标
      const riskMetrics = {
        var: varSeries[varSeries.length - 1],
        es: varSeries[varSeries.length - 1] * 1.25, // 简化计算
        currentVol: volatility[volatility.length - 1]
      };
      
      // 组合结果
      results[asset] = {
        dates: dates,
        returns: returns.map((ret, i) => ({ date: dates[i], value: ret })),
        volatility: volatility.map((vol, i) => ({ date: dates[i], value: vol })),
        varSeries: varSeries.map((var_, i) => ({ date: dates[i], value: var_ })),
        forecast: forecast,
        modelParams: modelParams,
        fitStats: fitStats,
        riskMetrics: riskMetrics
      };
    }
    
    return results;
  }
  
  // ==================== 结果渲染 ====================
  function renderResults(results) {
    // 更新图表
    updateCharts(results);
    
    // 渲染模型参数表格
    renderModelParameters(results);
    
    // 渲染拟合统计量
    renderFitStatistics(results);
    
    // 渲染风险指标
    renderRiskMetrics(results);
    
    // 渲染预测结果
    renderForecast(results);
  }
  
  function updateCharts(results) {
    // 准备数据
    const traces = [];
    const colors = ['#3d8bfd', '#ff6b6b', '#20c997', '#fd7e14', '#6f42c1'];
    
    let colorIndex = 0;
    for (const asset in results) {
      const data = results[asset];
      const color = colors[colorIndex % colors.length];
      
      // 波动率图表
      traces.push({
        x: data.dates,
        y: data.volatility.map(v => v.value),
        type: 'scatter',
        mode: 'lines',
        name: `${asset} Volatility`,
        line: {
          color: color,
          width: 2
        }
      });
      
      // 添加预测部分（虚线）
      const forecastDates = data.forecast.map(f => new Date(f.date));
      const forecastVols = data.forecast.map(f => f.volatility);
      
      // 添加最后一个历史点以连接预测
      forecastDates.unshift(data.dates[data.dates.length - 1]);
      forecastVols.unshift(data.volatility[data.volatility.length - 1].value);
      
      traces.push({
        x: forecastDates,
        y: forecastVols,
        type: 'scatter',
        mode: 'lines',
        name: `${asset} Forecast`,
        line: {
          color: color,
          width: 2,
          dash: 'dash'
        }
      });
      
      colorIndex++;
    }
    
    // 更新波动率图表
    Plotly.newPlot('volatilityChart', traces, {
      title: 'Volatility Analysis',
      xaxis: {
        title: 'Date',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: 'Volatility',
        showgrid: true,
        zeroline: false
      },
      legend: {
        orientation: 'h',
        y: 1.1
      },
      hovermode: 'closest',
      margin: {
        l: 50,
        r: 20,
        t: 50,
        b: 50
      },
      paper_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
      plot_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
      font: {
        color: darkMode ? '#e9ecef' : '#212529'
      }
    }, {
      responsive: true
    });
    
    // 更新收益率图表
    const returnTraces = [];
    colorIndex = 0;
    
    for (const asset in results) {
      const data = results[asset];
      const color = colors[colorIndex % colors.length];
      
      returnTraces.push({
        x: data.dates,
        y: data.returns.map(r => r.value),
        type: 'scatter',
        mode: 'lines',
        name: `${asset} Returns`,
        line: {
          color: color,
          width: 1
        }
      });
      
      colorIndex++;
    }
    
    Plotly.newPlot('returnsChart', returnTraces, {
      title: 'Returns',
      xaxis: {
        title: 'Date',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: 'Return',
        showgrid: true,
        zeroline: true
      },
      legend: {
        orientation: 'h',
        y: 1.1
      },
      hovermode: 'closest',
      margin: {
        l: 50,
        r: 20,
        t: 50,
        b: 50
      },
      paper_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
      plot_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
      font: {
        color: darkMode ? '#e9ecef' : '#212529'
      }
    }, {
      responsive: true
    });
    
    // 更新VaR图表
    const varTraces = [];
    colorIndex = 0;
    
    for (const asset in results) {
      const data = results[asset];
      const color = colors[colorIndex % colors.length];
      
      // 添加收益率
      varTraces.push({
        x: data.dates,
        y: data.returns.map(r => r.value),
        type: 'scatter',
        mode: 'lines',
        name: `${asset} Returns`,
        line: {
          color: color,
          width: 1
        }
      });
      
      // 添加VaR（负值，因为VaR通常表示为正数但代表损失）
      varTraces.push({
        x: data.dates,
        y: data.varSeries.map(v => -v.value),
        type: 'scatter',
        mode: 'lines',
        name: `${asset} VaR`,
        line: {
          color: color,
          width: 2,
          dash: 'dot'
        },
        fill: 'tonexty',
        fillcolor: `${color}20`
      });
      
      colorIndex++;
    }
    
    Plotly.newPlot('varChart', varTraces, {
      title: 'Value at Risk',
      xaxis: {
        title: 'Date',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: 'Return / VaR',
        showgrid: true,
        zeroline: true
      },
      legend: {
        orientation: 'h',
        y: 1.1
      },
      hovermode: 'closest',
      margin: {
        l: 50,
        r: 20,
        t: 50,
        b: 50
      },
      paper_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
      plot_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
      font: {
        color: darkMode ? '#e9ecef' : '#212529'
      }
    }, {
      responsive: true
    });
    
    // 更新诊断图表（使用第一个资产的数据）
    if (Object.keys(results).length > 0) {
      const firstAsset = Object.keys(results)[0];
      const data = results[firstAsset];
      
      // 模拟ACF数据
      const acfData = Array.from({length: 20}, () => Math.random() * 0.3 - 0.15);
      acfData[0] = 1; // 自相关在滞后0处始终为1
      
      // 模拟PACF数据
      const pacfData = Array.from({length: 20}, () => Math.random() * 0.2 - 0.1);
      pacfData[0] = 1;
      
      // 更新ACF图表
      Plotly.newPlot('acfChart', [{
        x: Array.from({length: acfData.length}, (_, i) => i),
        y: acfData,
        type: 'bar',
        marker: {
          color: '#3d8bfd'
        }
      }], {
        title: {
          text: 'ACF of Squared Residuals',
          font: {
            size: 14
          }
        },
        xaxis: {
          title: 'Lag',
          showgrid: true,
          zeroline: false
        },
        yaxis: {
          title: 'Correlation',
          showgrid: true,
          zeroline: true,
          range: [-1, 1]
        },
        showlegend: false,
        margin: {
          l: 40,
          r: 10,
          t: 40,
          b: 40
        },
        paper_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
        plot_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
        font: {
          color: darkMode ? '#e9ecef' : '#212529'
        }
      }, {
        responsive: true
      });
      
      // 更新PACF图表
      Plotly.newPlot('pacfChart', [{
        x: Array.from({length: pacfData.length}, (_, i) => i),
        y: pacfData,
        type: 'bar',
        marker: {
          color: '#3d8bfd'
        }
      }], {
        title: {
          text: 'PACF of Squared Residuals',
          font: {
            size: 14
          }
        },
        xaxis: {
          title: 'Lag',
          showgrid: true,
          zeroline: false
        },
        yaxis: {
          title: 'Correlation',
          showgrid: true,
          zeroline: true,
          range: [-1, 1]
        },
        showlegend: false,
        margin: {
          l: 40,
          r: 10,
          t: 40,
          b: 40
        },
        paper_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
        plot_bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
        font: {
          color: darkMode ? '#e9ecef' : '#212529'
        }
      }, {
        responsive: true
      });
    }
  }
  
  function renderModelParameters(results) {
    const parametersTable = document.getElementById('parametersTable');
    if (!parametersTable) return;
    
    const tbody = parametersTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // 对每个资产渲染参数
    for (const asset in results) {
      const data = results[asset];
      
      // 添加资产标题行
      const titleRow = document.createElement('tr');
      titleRow.innerHTML = `
        <td colspan="5" class="asset-title">${asset}</td>
      `;
      tbody.appendChild(titleRow);
      
      // 添加参数行
      for (const param in data.modelParams) {
        const paramData = data.modelParams[param];
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${param}</td>
          <td>${paramData.value.toExponential(4)}</td>
          <td>${paramData.stdError.toExponential(4)}</td>
          <td>${paramData.tValue.toFixed(4)}</td>
          <td>${paramData.pValue < 0.001 ? '<0.001' : paramData.pValue.toFixed(4)}</td>
        `;
        tbody.appendChild(row);
      }
    }
  }
  
  function renderFitStatistics(results) {
    const fitStatistics = document.getElementById('fitStatistics');
    if (!fitStatistics) return;
    
    fitStatistics.innerHTML = '';
    
    // 对每个资产渲染拟合统计量
    for (const asset in results) {
      const data = results[asset];
      const stats = data.fitStats;
      
      const assetStats = document.createElement('div');
      assetStats.className = 'asset-stats';
      
      // 添加资产标题
      assetStats.innerHTML = `<h4>${asset}</h4>`;
      
      // 信息准则
      const icCard = document.createElement('div');
      icCard.className = 'metric-card';
      icCard.innerHTML = `
        <h5>Information Criteria</h5>
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-label">Log-Likelihood</span>
            <span class="stat-value">${stats.logLikelihood.toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">AIC</span>
            <span class="stat-value">${stats.aic.toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">BIC</span>
            <span class="stat-value">${stats.bic.toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">HQIC</span>
            <span class="stat-value">${stats.hqic.toFixed(2)}</span>
          </div>
        </div>
      `;
      
      // 诊断检验
      const diagnosticCard = document.createElement('div');
      diagnosticCard.className = 'metric-card';
      diagnosticCard.innerHTML = `
        <h5>Diagnostic Tests</h5>
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-label">RMSE</span>
            <span class="stat-value">${stats.rmse.toExponential(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ljung-Box Q(10)</span>
            <span class="stat-value">${stats.ljungBox.statistic.toFixed(2)}</span>
            <span class="stat-pvalue">[${stats.ljungBox.pValue.toFixed(3)}]</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">ARCH-LM</span>
            <span class="stat-value">${stats.archLM.statistic.toFixed(2)}</span>
            <span class="stat-pvalue">[${stats.archLM.pValue.toFixed(3)}]</span>
          </div>
        </div>
      `;
      
      assetStats.appendChild(icCard);
      assetStats.appendChild(diagnosticCard);
      fitStatistics.appendChild(assetStats);
    }
  }
  
  function renderRiskMetrics(results) {
    const riskMetrics = document.getElementById('riskMetrics');
    if (!riskMetrics) return;
    
    riskMetrics.innerHTML = '';
    
    // 对每个资产渲染风险指标
    for (const asset in results) {
      const data = results[asset];
      const metrics = data.riskMetrics;
      
      const assetMetrics = document.createElement('div');
      assetMetrics.className = 'asset-metrics';
      
      // 添加资产标题
      assetMetrics.innerHTML = `<h4>${asset}</h4>`;
      
      // VaR卡片
      const varCard = document.createElement('div');
      varCard.className = 'metric-card';
      varCard.innerHTML = `
        <h5>Value at Risk (VaR)</h5>
        <div class="metric-value">${(metrics.var * 100).toFixed(2)}%</div>
        <div class="metric-description">1-day horizon at ${document.getElementById('confidenceSlider').value}% confidence</div>
      `;
      
      // ES卡片
      const esCard = document.createElement('div');
      esCard.className = 'metric-card';
      esCard.innerHTML = `
        <h5>Expected Shortfall (ES)</h5>
        <div class="metric-value">${(metrics.es * 100).toFixed(2)}%</div>
        <div class="metric-description">Average loss beyond VaR</div>
      `;
      
      // 波动率卡片
      const volCard = document.createElement('div');
      volCard.className = 'metric-card';
      volCard.innerHTML = `
        <h5>Current Volatility</h5>
        <div class="metric-value">${(metrics.currentVol * 100).toFixed(2)}%</div>
        <div class="metric-description">Annualized volatility estimate</div>
      `;
      
      assetMetrics.appendChild(varCard);
      assetMetrics.appendChild(esCard);
      assetMetrics.appendChild(volCard);
      riskMetrics.appendChild(assetMetrics);
    }
  }
  
  function renderForecast(results) {
    const forecastResults = document.getElementById('forecastResults');
    if (!forecastResults) return;
    
    forecastResults.innerHTML = '';
    
    // 对每个资产渲染预测结果
    for (const asset in results) {
      const data = results[asset];
      
      const assetForecast = document.createElement('div');
      assetForecast.className = 'asset-forecast';
      
      // 添加资产标题
      assetForecast.innerHTML = `<h4>${asset} - ${data.forecast.length}-Day Forecast</h4>`;
      
      // 创建预测表格
      const table = document.createElement('table');
      table.className = 'data-table';
      
      // 表头
      table.innerHTML = `
        <thead>
          <tr>
            <th>Date</th>
            <th>Volatility</th>
            <th>VaR</th>
            <th>ES</th>
          </tr>
        </thead>
        <tbody>
          ${data.forecast.map(day => `
            <tr>
              <td>${day.date}</td>
              <td>${(day.volatility * 100).toFixed(2)}%</td>
              <td>${(day.var * 100).toFixed(2)}%</td>
              <td>${(day.es * 100).toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      `;
      
      assetForecast.appendChild(table);
      forecastResults.appendChild(assetForecast);
    }
  }

  // 添加导出结果功能
  function exportResults() {
    // 获取当前时间戳作为文件名的一部分
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 创建一个包含所有结果的对象
    const exportData = {
      timestamp: timestamp,
      parameters: getAnalysisParameters(),
      results: {}
    };
    
    // 收集所有图表的数据
    for (const chartId in charts) {
      if (charts[chartId]) {
        exportData.results[chartId] = {
          data: Plotly.getData(chartId),
          layout: Plotly.getLayout(chartId)
        };
      }
    }
    
    // 创建并下载JSON文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volatility-analysis-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 最后，调用初始化函数
  initializeApp();
}); 
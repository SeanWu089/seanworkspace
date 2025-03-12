document.addEventListener('DOMContentLoaded', function() {
  // 模型数据
  const modelData = {
    'arima': { 
      name: 'ARIMA', 
      icon: 'fa-chart-line',
      description: 'Autoregressive Integrated Moving Average',
      category: 'time-series'
    },
    'garch': { 
      name: 'GARCH', 
      icon: 'fa-chart-bar',
      description: 'Generalized Autoregressive Conditional Heteroskedasticity',
      category: 'volatility'
    },
    'ewma': { 
      name: 'EWMA', 
      icon: 'fa-wave-square',
      description: 'Exponentially Weighted Moving Average',
      category: 'volatility'
    },
    'markov': { 
      name: 'Markov Chain', 
      icon: 'fa-project-diagram',
      description: 'State transition modeling',
      category: 'probability'
    },
    'regression': { 
      name: 'Multivariate Regression', 
      icon: 'fa-calculator',
      description: 'Analyze relationships between multiple variables',
      category: 'regression'
    },
    'var': { 
      name: 'VaR', 
      icon: 'fa-exclamation-triangle',
      description: 'Value at Risk',
      category: 'risk'
    },
    'cvar': { 
      name: 'CVaR', 
      icon: 'fa-chart-area',
      description: 'Conditional Value at Risk',
      category: 'risk'
    },
    'monte-carlo': { 
      name: 'Monte Carlo Simulation', 
      icon: 'fa-random',
      description: 'Random sampling for complex financial products',
      category: 'simulation'
    },
    'stress-test': { 
      name: 'Stress Testing', 
      icon: 'fa-bolt',
      description: 'Evaluate potential losses under extreme conditions',
      category: 'risk'
    },
    'copula': { 
      name: 'Copula Functions', 
      icon: 'fa-link',
      description: 'Model dependency structures between variables',
      category: 'dependency'
    },
    'capm': { 
      name: 'CAPM', 
      icon: 'fa-balance-scale',
      description: 'Capital Asset Pricing Model',
      category: 'pricing'
    },
    'apt': { 
      name: 'APT', 
      icon: 'fa-layer-group',
      description: 'Arbitrage Pricing Theory',
      category: 'pricing'
    },
    'black-scholes': { 
      name: 'Black-Scholes Model', 
      icon: 'fa-exchange-alt',
      description: 'Options pricing model',
      category: 'pricing'
    },
    'fama-french': { 
      name: 'Fama-French Models', 
      icon: 'fa-cubes',
      description: 'Three-factor and Five-factor models',
      category: 'pricing'
    },
    'mpt': { 
      name: 'Modern Portfolio Theory', 
      icon: 'fa-briefcase',
      description: 'Optimize risk-return allocation',
      category: 'portfolio'
    },
    'implied-vol': { 
      name: 'Implied Volatility Models', 
      icon: 'fa-tachometer-alt',
      description: 'Extract market expected volatility from option prices',
      category: 'volatility'
    },
    'stochastic-vol': { 
      name: 'Stochastic Volatility Models', 
      icon: 'fa-dice',
      description: 'Models with time-varying volatility',
      category: 'volatility'
    },
    'dcc': { 
      name: 'DCC Models', 
      icon: 'fa-bezier-curve',
      description: 'Dynamic Conditional Correlation',
      category: 'correlation'
    },
    'neural-networks': { 
      name: 'Neural Networks', 
      icon: 'fa-brain',
      description: 'Pattern recognition and non-linear modeling',
      category: 'machine-learning'
    },
    'decision-trees': { 
      name: 'Decision Trees & Random Forests', 
      icon: 'fa-tree',
      description: 'Classification and regression analysis',
      category: 'machine-learning'
    },
    'svm': { 
      name: 'Support Vector Machines', 
      icon: 'fa-vector-square',
      description: 'Classification and regression analysis',
      category: 'machine-learning'
    },
    'reinforcement': { 
      name: 'Reinforcement Learning', 
      icon: 'fa-robot',
      description: 'Optimize trading strategies',
      category: 'machine-learning'
    },
    'structural': { 
      name: 'Structural Models', 
      icon: 'fa-building',
      description: 'Merton model and extensions',
      category: 'credit-risk'
    },
    'reduced-form': { 
      name: 'Reduced-Form Models', 
      icon: 'fa-percentage',
      description: 'Direct probability modeling of default events',
      category: 'credit-risk'
    },
    'kmv': { 
      name: 'KMV Model', 
      icon: 'fa-chart-pie',
      description: 'Estimate distance to default and default probability',
      category: 'credit-risk'
    },
    'creditmetrics': { 
      name: 'CreditMetrics', 
      icon: 'fa-credit-card',
      description: 'Analyze credit asset portfolio risk',
      category: 'credit-risk'
    }
  };

  // 模型集成组合
  const modelIntegrations = [
    {
      name: 'Time Series & Volatility',
      description: 'Combine time series forecasting with volatility modeling',
      models: ['arima', 'garch'],
      synergy: 'high'
    },
    {
      name: 'Comprehensive Risk Assessment',
      description: 'Holistic approach to risk measurement and management',
      models: ['var', 'cvar', 'stress-test'],
      synergy: 'high'
    },
    {
      name: 'Portfolio Construction',
      description: 'Optimize portfolio allocation based on risk-return profile',
      models: ['capm', 'mpt'],
      synergy: 'high'
    },
    {
      name: 'Advanced Risk Simulation',
      description: 'Simulate extreme market conditions and assess impact',
      models: ['monte-carlo', 'stress-test', 'copula'],
      synergy: 'medium'
    },
    {
      name: 'Credit Risk Framework',
      description: 'Comprehensive credit risk assessment and management',
      models: ['structural', 'kmv', 'creditmetrics'],
      synergy: 'medium'
    },
    {
      name: 'Machine Learning for Finance',
      description: 'Apply AI techniques to financial modeling and prediction',
      models: ['neural-networks', 'decision-trees', 'reinforcement'],
      synergy: 'medium'
    },
    {
      name: 'Multi-factor Asset Pricing',
      description: 'Advanced asset pricing beyond traditional CAPM',
      models: ['capm', 'apt', 'fama-french'],
      synergy: 'high'
    },
    {
      name: 'Dynamic Correlation Analysis',
      description: 'Analyze changing relationships between assets over time',
      models: ['dcc', 'copula', 'ewma'],
      synergy: 'medium'
    }
  ];

  // 获取选中的模型
  const selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
  
  // 如果没有选中的模型，重定向回模型选择页面
  if (selectedModels.length === 0) {
    alert('Please select at least one model on the Financial Models page.');
    window.location.href = 'FinancialModels.html';
    return;
  }
  
  // 渲染选中的模型
  renderSelectedModels(selectedModels);
  
  // 渲染推荐的集成模型
  renderRecommendedIntegrations(selectedModels);
  
  // 初始化标签页
  initTabs();
  
  // 初始化图表
  initCharts();
  
  // 渲染选中的模型
  function renderSelectedModels(models) {
    const modelChipsContainer = document.getElementById('selectedModelChips');
    modelChipsContainer.innerHTML = '';
    
    models.forEach(modelId => {
      if (modelData[modelId]) {
        const model = modelData[modelId];
        const chip = document.createElement('div');
        chip.className = 'model-chip';
        chip.innerHTML = `
          <i class="fas ${model.icon}"></i>
          ${model.name}
          <div class="remove-model" data-model="${modelId}">
            <i class="fas fa-times"></i>
          </div>
        `;
        modelChipsContainer.appendChild(chip);
      }
    });
    
    // 添加移除模型的事件监听
    document.querySelectorAll('.remove-model').forEach(button => {
      button.addEventListener('click', function() {
        const modelId = this.getAttribute('data-model');
        removeModel(modelId);
      });
    });
  }
  
  // 移除模型
  function removeModel(modelId) {
    let selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
    const index = selectedModels.indexOf(modelId);
    
    if (index !== -1) {
      selectedModels.splice(index, 1);
      localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
      
      // 如果没有选中的模型，重定向回模型选择页面
      if (selectedModels.length === 0) {
        alert('No models selected. Redirecting to model selection page.');
        window.location.href = 'FinancialModels.html';
        return;
      }
      
      // 重新渲染选中的模型
      renderSelectedModels(selectedModels);
      
      // 重新渲染推荐的集成模型
      renderRecommendedIntegrations(selectedModels);
    }
  }
  
  // 渲染推荐的集成模型
  function renderRecommendedIntegrations(selectedModels) {
    const integrationList = document.getElementById('integrationList');
    integrationList.innerHTML = '';
    
    // 根据选中的模型过滤出相关的集成组合
    const relevantIntegrations = modelIntegrations.filter(integration => {
      // 检查选中的模型是否包含此集成组合中的至少一个模型
      return integration.models.some(model => selectedModels.includes(model));
    });
    
    // 如果没有相关的集成组合，显示提示信息
    if (relevantIntegrations.length === 0) {
      integrationList.innerHTML = `
        <div class="no-integrations">
          <p>No recommended integrations found for your selected models.</p>
          <p>Try selecting different models or creating a custom integration.</p>
        </div>
      `;
      return;
    }
    
    // 渲染相关的集成组合
    relevantIntegrations.forEach((integration, index) => {
      const item = document.createElement('div');
      item.className = 'integration-item';
      if (index === 0) item.classList.add('active');
      
      // 计算匹配度：选中模型中有多少个在此集成组合中
      const matchingModels = integration.models.filter(model => selectedModels.includes(model));
      const matchPercentage = Math.round((matchingModels.length / integration.models.length) * 100);
      
      item.innerHTML = `
        <h3>${integration.name}</h3>
        <p>${integration.description}</p>
        <div class="integration-models">
          ${integration.models.map(model => `
            <span class="integration-model-tag ${selectedModels.includes(model) ? 'selected' : ''}">${modelData[model].name}</span>
          `).join('')}
        </div>
        <div class="integration-match" style="margin-top: 10px; font-size: 0.85rem; color: #475569;">
          <span>Match: ${matchPercentage}%</span>
          <span style="margin-left: 10px; color: ${integration.synergy === 'high' ? '#10b981' : '#f59e0b'};">
            Synergy: ${integration.synergy.charAt(0).toUpperCase() + integration.synergy.slice(1)}
          </span>
        </div>
      `;
      
      integrationList.appendChild(item);
    });
    
    // 添加集成组合的点击事件
    document.querySelectorAll('.integration-item').forEach(item => {
      item.addEventListener('click', function() {
        // 移除所有项的活动状态
        document.querySelectorAll('.integration-item').forEach(i => i.classList.remove('active'));
        // 添加当前项的活动状态
        this.classList.add('active');
      });
    });
  }
  
  // 初始化标签页
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // 移除所有标签按钮的活动状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // 添加当前标签按钮的活动状态
        this.classList.add('active');
        
        // 隐藏所有标签内容
        tabPanes.forEach(pane => pane.classList.remove('active'));
        // 显示当前标签内容
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
  
  // 初始化图表
  function initCharts() {
    // 风险收益图表
    const riskReturnCtx = document.getElementById('riskReturnChart').getContext('2d');
    new Chart(riskReturnCtx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Assets',
          data: [
            { x: 5, y: 3 },
            { x: 10, y: 7 },
            { x: 15, y: 8 },
            { x: 8, y: 5 },
            { x: 12, y: 9 },
            { x: 7, y: 4 },
            { x: 9, y: 6 }
          ],
          backgroundColor: 'rgba(46, 114, 198, 0.6)',
          borderColor: 'rgba(46, 114, 198, 1)',
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8
        }, {
          label: 'Efficient Frontier',
          data: [
            { x: 5, y: 3 },
            { x: 7, y: 5 },
            { x: 9, y: 6.5 },
            { x: 12, y: 9 }
          ],
          type: 'line',
          backgroundColor: 'transparent',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Risk (%)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Return (%)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Risk: ${context.parsed.x}%, Return: ${context.parsed.y}%`;
              }
            }
          }
        }
      }
    });
    
    // 时间序列预测图表
    const timeSeriesCtx = document.getElementById('timeSeriesChart').getContext('2d');
    new Chart(timeSeriesCtx, {
      type: 'line',
      data: {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        datasets: [{
          label: 'Historical',
          data: Array.from({ length: 15 }, () => Math.random() * 10 - 5),
          backgroundColor: 'rgba(107, 114, 128, 0.2)',
          borderColor: 'rgba(107, 114, 128, 1)',
          borderWidth: 2,
          pointRadius: 3
        }, {
          label: 'ARIMA Forecast',
          data: Array.from({ length: 30 }, (_, i) => {
            if (i < 15) return null;
            return Math.random() * 10 - 5;
          }),
          backgroundColor: 'rgba(46, 114, 198, 0.2)',
          borderColor: 'rgba(46, 114, 198, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 3
        }, {
          label: 'GARCH Volatility',
          data: Array.from({ length: 30 }, (_, i) => {
            if (i < 15) return null;
            return Math.abs(Math.random() * 5);
          }),
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Returns (%)'
            }
          },
          y1: {
            position: 'right',
            title: {
              display: true,
              text: 'Volatility (%)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
    
    // VaR分布图表
    const varDistributionCtx = document.getElementById('varDistributionChart').getContext('2d');
    new Chart(varDistributionCtx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 20 }, (_, i) => `${-10 + i}`),
        datasets: [{
          label: 'Return Distribution',
          data: [1, 2, 3, 5, 8, 12, 18, 24, 30, 35, 30, 24, 18, 12, 8, 5, 3, 2, 1, 0.5],
          backgroundColor: 'rgba(46, 114, 198, 0.6)',
          borderColor: 'rgba(46, 114, 198, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Returns (%)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Frequency'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                xMin: -5,
                xMax: -5,
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                label: {
                  content: '95% VaR',
                  enabled: true,
                  position: 'top'
                }
              },
              line2: {
                type: 'line',
                xMin: -7,
                xMax: -7,
                borderColor: 'rgba(185, 28, 28, 1)',
                borderWidth: 2,
                label: {
                  content: '99% VaR',
                  enabled: true,
                  position: 'bottom'
                }
              }
            }
          }
        }
      }
    });
    
    // 相关性矩阵图表
    const correlationCtx = document.getElementById('correlationChart').getContext('2d');
    new Chart(correlationCtx, {
      type: 'heatmap',
      data: {
        labels: ['ARIMA', 'GARCH', 'VaR', 'CVaR', 'Monte Carlo', 'CAPM', 'MPT'],
        datasets: [{
          label: 'Correlation',
          data: [
            { x: 'ARIMA', y: 'ARIMA', v: 1 },
            { x: 'ARIMA', y: 'GARCH', v: 0.7 },
            { x: 'ARIMA', y: 'VaR', v: 0.5 },
            { x: 'ARIMA', y: 'CVaR', v: 0.4 },
            { x: 'ARIMA', y: 'Monte Carlo', v: 0.6 },
            { x: 'ARIMA', y: 'CAPM', v: 0.3 },
            { x: 'ARIMA', y: 'MPT', v: 0.2 },
            
            { x: 'GARCH', y: 'ARIMA', v: 0.7 },
            { x: 'GARCH', y: 'GARCH', v: 1 },
            { x: 'GARCH', y: 'VaR', v: 0.8 },
            { x: 'GARCH', y: 'CVaR', v: 0.7 },
            { x: 'GARCH', y: 'Monte Carlo', v: 0.6 },
            { x: 'GARCH', y: 'CAPM', v: 0.4 },
            { x: 'GARCH', y: 'MPT', v: 0.3 },
            
            { x: 'VaR', y: 'ARIMA', v: 0.5 },
            { x: 'VaR', y: 'GARCH', v: 0.8 },
            { x: 'VaR', y: 'VaR', v: 1 },
            { x: 'VaR', y: 'CVaR', v: 0.9 },
            { x: 'VaR', y: 'Monte Carlo', v: 0.7 },
            { x: 'VaR', y: 'CAPM', v: 0.5 },
            { x: 'VaR', y: 'MPT', v: 0.6 },
            
            { x: 'CVaR', y: 'ARIMA', v: 0.4 },
            { x: 'CVaR', y: 'GARCH', v: 0.7 },
            { x: 'CVaR', y: 'VaR', v: 0.9 },
            { x: 'CVaR', y: 'CVaR', v: 1 },
            { x: 'CVaR', y: 'Monte Carlo', v: 0.8 },
            { x: 'CVaR', y: 'CAPM', v: 0.4 },
            { x: 'CVaR', y: 'MPT', v: 0.5 },
            
            { x: 'Monte Carlo', y: 'ARIMA', v: 0.6 },
            { x: 'Monte Carlo', y: 'GARCH', v: 0.6 },
            { x: 'Monte Carlo', y: 'VaR', v: 0.7 },
            { x: 'Monte Carlo', y: 'CVaR', v: 0.8 },
            { x: 'Monte Carlo', y: 'Monte Carlo', v: 1 },
            { x: 'Monte Carlo', y: 'CAPM', v: 0.3 },
            { x: 'Monte Carlo', y: 'MPT', v: 0.4 },
            
            { x: 'CAPM', y: 'ARIMA', v: 0.3 },
            { x: 'CAPM', y: 'GARCH', v: 0.4 },
            { x: 'CAPM', y: 'VaR', v: 0.5 },
            { x: 'CAPM', y: 'CVaR', v: 0.4 },
            { x: 'CAPM', y: 'Monte Carlo', v: 0.3 },
            { x: 'CAPM', y: 'CAPM', v: 1 },
            { x: 'CAPM', y: 'MPT', v: 0.8 },
            
            { x: 'MPT', y: 'ARIMA', v: 0.2 },
            { x: 'MPT', y: 'GARCH', v: 0.3 },
            { x: 'MPT', y: 'VaR', v: 0.6 },
            { x: 'MPT', y: 'CVaR', v: 0.5 },
            { x: 'MPT', y: 'Monte Carlo', v: 0.4 },
            { x: 'MPT', y: 'CAPM', v: 0.8 },
            { x: 'MPT', y: 'MPT', v: 1 }
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return `${context[0].raw.x} & ${context[0].raw.y}`;
              },
              label: function(context) {
                return `Correlation: ${context.raw.v.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Models'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Models'
            }
          }
        }
      }
    });
  }
  
  // 代码复制功能
  document.querySelector('.code-actions .action-button').addEventListener('click', function() {
    const code = document.querySelector('.code-editor code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  });
  
  // 语言选择功能
  document.querySelector('.language-selector').addEventListener('change', function() {
    // 这里可以根据选择的语言切换代码示例
    alert(`Code language changed to ${this.value}. This would load different code examples in a real application.`);
  });
}); 
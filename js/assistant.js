document.addEventListener('DOMContentLoaded', function () {
  // 获取DOM元素
  const assistantContainer = document.getElementById('assistant-container');
  const assistantIcon = document.querySelector('.assistant-icon');
  const chatWindow = document.querySelector('.chat-window');
  const closeBtn = document.querySelector('.close-btn');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatHistory = document.getElementById('chat-history');
  
  // 记录拖动状态
  let isDragging = false;
  let startX, startY;
  let initialLeft, initialTop;
  let hasMoved = false;
  let mouseDownTime = 0;
  
  // 添加新的变量
  const leverHandle = document.querySelector('.lever-handle');
  const modeLabels = document.querySelectorAll('.mode-label');
  let currentMode = 'chat'; // 默认模式
  let isRagMode = false;
  
  // 模型选择器功能
  const modelToggle = document.querySelector('.model-toggle');
  const modelDropdown = document.querySelector('.model-dropdown');
  const modelOptions = document.querySelectorAll('.model-option');
  let currentModel = 'qwen2.5:7b'; // 默认模型
  
  // 使用新的类名获取元素
  const filesTrigger = document.querySelector('.files-trigger');
  const filesPanel = document.querySelector('.files-panel');
  const filesList = document.querySelector('.files-list');
  const filesDone = document.querySelector('.files-done');
  let selectedFiles = [];
  
  console.log('Files elements:', {
    filesTrigger,
    filesPanel,
    filesList,
    filesDone
  });
  
  // 打开聊天窗口
  function openChatWindow() {
    const iconRect = assistantContainer.getBoundingClientRect();
    assistantContainer.dataset.lastLeft = assistantContainer.style.left;
    assistantContainer.dataset.lastTop = assistantContainer.style.top;
    
    assistantIcon.style.display = 'none';
    assistantContainer.classList.add('active');
    adjustChatWindowPosition();
  }
  
  // 调整聊天窗口位置
  function adjustChatWindowPosition() {
    setTimeout(() => {
      const containerRect = assistantContainer.getBoundingClientRect();
      const chatWindowRect = chatWindow.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newLeft = parseFloat(assistantContainer.style.left) || containerRect.left;
      let newTop = parseFloat(assistantContainer.style.top) || containerRect.top;
      
      if (newLeft + chatWindowRect.width > viewportWidth - 20) {
        newLeft = viewportWidth - chatWindowRect.width - 20;
      }
      if (newTop + chatWindowRect.height > viewportHeight - 20) {
        newTop = viewportHeight - chatWindowRect.height - 20;
      }
      if (newLeft < 20) {
        newLeft = 20;
      }
      if (newTop < 20) {
        newTop = 20;
      }
      
      assistantContainer.style.left = `${newLeft}px`;
      assistantContainer.style.top = `${newTop}px`;
    }, 10);
  }
  
  // 关闭聊天窗口
  function closeChatWindow() {
    assistantContainer.classList.remove('active');
    assistantIcon.style.display = 'block';
    
    const windowWidth = window.innerWidth;
    const iconWidth = assistantIcon.offsetWidth;
    const rect = assistantContainer.getBoundingClientRect();
    const topPosition = rect.top;
    
    let leftPosition;
    let animationStartX;
    
    if (rect.left + rect.width / 2 < windowWidth / 2) {
      leftPosition = 20;
      animationStartX = -100;
    } else {
      leftPosition = windowWidth - iconWidth - 20;
      animationStartX = 100;
    }
    
    assistantContainer.style.transition = 'none';
    assistantContainer.style.left = `${leftPosition}px`;
    assistantContainer.style.top = `${topPosition}px`;
    
    assistantContainer.offsetHeight;
    assistantContainer.style.transition = '';
    
    assistantContainer.animate([
      { transform: `translateX(${animationStartX}px)`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ], {
      duration: 400,
      easing: 'ease-out'
    });
  }

  // 添加消息到聊天历史
  function addMessage(content, sender) {
    if (!chatHistory) {
      console.error('找不到聊天历史元素');
      return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const safeContent = String(content)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    messageDiv.innerHTML = safeContent.replace(/\n/g, '<br>');
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  // 初始化位置
  function initPosition() {
    if (!assistantContainer.style.left && !assistantContainer.style.top) {
      assistantContainer.style.right = '20px';
      assistantContainer.style.top = '80px';
      assistantContainer.style.left = 'auto';
      assistantContainer.style.bottom = 'auto';
    }
  }

  // 启用拖拽功能
  function enableDraggingAndClick() {
    assistantContainer.style.position = 'fixed';
    initPosition();
    
    assistantIcon.addEventListener('mousedown', startPotentialDrag);
    assistantIcon.addEventListener('touchstart', startPotentialDrag);

    const chatHeader = document.querySelector('.chat-header');
    chatHeader.addEventListener('mousedown', startPotentialDrag);
    chatHeader.addEventListener('touchstart', startPotentialDrag);
  }

  // 处理拖拽开始
  function startPotentialDrag(e) {
    e.preventDefault();
    mouseDownTime = new Date().getTime();
    hasMoved = false;
    isDragging = true;
    
    if (e.type === 'mousedown') {
      startX = e.clientX;
      startY = e.clientY;
    } else if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    
    const rect = assistantContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    
    if (!assistantContainer.style.left || assistantContainer.style.left === 'auto') {
      assistantContainer.style.right = 'auto';
      assistantContainer.style.bottom = 'auto';
      assistantContainer.style.left = `${initialLeft}px`;
      assistantContainer.style.top = `${initialTop}px`;
    }
    
    assistantContainer.style.transition = 'none';
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }

  // 处理拖拽过程
  function drag(e) {
    if (!isDragging) return;
    
    let moveX, moveY;
    
    if (e.type === 'mousemove') {
      moveX = e.clientX;
      moveY = e.clientY;
    } else if (e.type === 'touchmove') {
      moveX = e.touches[0].clientX;
      moveY = e.touches[0].clientY;
    }
    
    if (Math.abs(moveX - startX) > 5 || Math.abs(moveY - startY) > 5) {
      hasMoved = true;
    }
    
    const deltaX = moveX - startX;
    const deltaY = moveY - startY;
    
    assistantContainer.style.right = 'auto';
    assistantContainer.style.bottom = 'auto';
    assistantContainer.style.left = `${initialLeft + deltaX}px`;
    assistantContainer.style.top = `${initialTop + deltaY}px`;
  }

  // 处理拖拽结束
  function stopDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    assistantContainer.style.transition = 'all 1s ease';
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
    
    const releaseTime = new Date().getTime();
    const clickDuration = releaseTime - mouseDownTime;
    
    if (!hasMoved && clickDuration < 200) {
      if (!assistantContainer.classList.contains('active') && e.target.closest('.assistant-icon')) {
        openChatWindow();
      }
    } else {
      snapToEdge();
      
      if (assistantContainer.classList.contains('active')) {
        adjustChatWindowPosition();
      }
    }
  }

  // 吸附到边缘
  function snapToEdge() {
    const rect = assistantContainer.getBoundingClientRect();
    const iconWidth = assistantIcon.offsetWidth;
    const windowWidth = window.innerWidth;
    const topPosition = rect.top;
    
    let leftPosition;
    if (rect.left + rect.width / 2 < windowWidth / 2) {
      leftPosition = 20;
    } else {
      leftPosition = windowWidth - iconWidth - 20;
    }
    
    assistantContainer.style.left = `${leftPosition}px`;
    assistantContainer.style.top = `${topPosition}px`;
  }

  // 切换模式时更新文件选择器显示状态
  function switchMode(mode) {
    console.log('Switching mode to:', mode);
    currentMode = mode;
    
    const chatWindow = document.querySelector('.chat-window');
    if (!chatWindow) {
      console.error('Chat window not found');
      return;
    }
    
    if (mode === 'rag') {
      chatWindow.classList.add('rag-mode');
      // 确保触发器可见，面板隐藏
      if (filesTrigger) {
        filesTrigger.classList.remove('hide');
      }
      if (filesPanel) {
        filesPanel.classList.remove('show');
      }
      console.log('RAG mode enabled');
    } else {
      chatWindow.classList.remove('rag-mode');
      selectedFiles = [];
      if (filesPanel) {
        filesPanel.classList.remove('show');
      }
      console.log('RAG mode disabled');
    }
  }

  // 获取用户文件列表
  async function fetchUserFiles() {
    console.log('Fetching user files...');
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (!session?.user) {
        console.log('No user logged in');
        return;
      }

      console.log('User session found:', session.user.id);

      const { data, error } = await window.supabaseClient
        .storage
        .from('user_files')
        .list(session.user.id + '/');

      if (error) {
        console.error('Error fetching files:', error);
        return;
      }

      console.log('Files fetched:', data);
      updateFileList(data);
    } catch (error) {
      console.error('Error in fetchUserFiles:', error);
    }
  }

  // 更新文件列表显示
  function updateFileList(files) {
    console.log('Updating file list with:', files);
    if (!filesList) {
      console.error('File list element not found');
      return;
    }

    filesList.innerHTML = '';
    
    files.forEach(file => {
      const displayName = file.name.replace(/^\d+_/, '');
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <input type="checkbox" value="${file.name}" 
          ${selectedFiles.some(f => f.filename === file.name) ? 'checked' : ''}>
        <span class="file-name">${displayName}</span>
      `;
      
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && selectedFiles.length >= 6) {
          checkbox.checked = false;
          alert('You can select up to 6 files');
          return;
        }
        
        if (checkbox.checked) {
          selectedFiles.push({
            filename: file.name,
            created_at: file.created_at,
            updated_at: file.updated_at
          });
          console.log('File selected:', file.name);
        } else {
          selectedFiles = selectedFiles.filter(f => f.filename !== file.name);
          console.log('File deselected:', file.name);
        }
        console.log('Current selected files:', selectedFiles);
      });
      
      filesList.appendChild(item);
    });
  }

  // 文件选择器点击事件
  if (filesTrigger) {
    filesTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Files trigger clicked');
      
      if (filesPanel) {
        // 隐藏触发器
        filesTrigger.classList.add('hide');
        
        // 显示面板
        filesPanel.classList.add('show');
        
        // 获取文件列表
        fetchUserFiles();
      }
    });
  }

  // 添加错误提示函数
  function showFilesError(message) {
    let errorDiv = filesPanel.querySelector('.files-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'files-error';
      filesPanel.insertBefore(errorDiv, filesPanel.firstChild);
    }
    
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
      errorDiv.classList.remove('show');
    }, 3000);
  }

  // 修改 Done 按钮的事件监听器
  if (filesDone) {
    filesDone.addEventListener('click', () => {
      if (currentMode === 'rag' && selectedFiles.length === 0) {
        showFilesError('Please select at least one file for RAG mode');
        return;
      }

      if (filesPanel) {
        filesPanel.classList.remove('show');
        setTimeout(() => {
          filesTrigger.classList.remove('hide');
        }, 300);
      }
    });
  }

  // 点击外部关闭面板
  document.addEventListener('click', (e) => {
    if (filesPanel && 
        filesPanel.classList.contains('show') && 
        !filesTrigger?.contains(e.target) && 
        !filesPanel?.contains(e.target)) {
      // 隐藏面板
      filesPanel.classList.remove('show');
      
      // 等待面板收起动画完成后显示触发器
      setTimeout(() => {
        filesTrigger.classList.remove('hide');
      }, 300);
    }
  });

  // 修改模型映射关系
  const MODEL_MAPPING = {
    'deepseek-r1:4b': 'deepseek-r1:latest',
    // 'qwen2.5:14b': 'qwen2.5:14b',
    // 'qwen2.5:32b': 'qwen2.5:32b'
  };

  // 修改表单提交处理
  chatForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const message = userInput.value.trim();
    if (!message) return;
    
    // 在 RAG 模式下检查是否选择了文件
    if (currentMode === 'rag' && selectedFiles.length === 0) {
        addMessage('Error: Please select at least one file for RAG mode by clicking the file selector button', 'error');
        return;
    }
    
    addMessage(message, 'user');
    userInput.value = '';
    
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('message', 'assistant', 'loading');
    loadingMessage.textContent = 'Im thinking...';
    chatHistory.appendChild(loadingMessage);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    try {
        // 获取用户会话信息
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session?.user) {
            throw new Error('No user session found');
        }

        // 获取实际使用的模型名称
        const actualModel = MODEL_MAPPING[currentModel] || currentModel;
        
        // 如果是RAG模式，先处理文档
        if (currentMode === 'rag') {
            const processResponse = await fetch('http://localhost:1201/rag/process_documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: session.user.id,
                    files_info: selectedFiles  // 现在发送的是包含完整文件信息的数组
                })
            });

            if (!processResponse.ok) {
                throw new Error('Failed to process documents');
            }
        }

        const apiUrl = currentMode === 'rag' 
            ? 'http://localhost:1201/rag/query'
            : 'http://localhost:1201/chat';
        
        const requestData = currentMode === 'rag'
            ? {
                user_id: session.user.id,
                question: message,
                files_info: selectedFiles,  // 现在发送的是包含完整文件信息的数组
                model: actualModel
            }
            : { 
                message: message,
                model: actualModel
            };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Server returned error status: ${response.status}`);
        }

        const data = await response.json();
        
        // 移除加载消息
        const loadingElement = document.querySelector('.message.loading');
        if (loadingElement) {
            chatHistory.removeChild(loadingElement);
        }
        
        // RAG模式下返回answer，Chat模式下返回response
        const responseText = currentMode === 'rag' ? data.answer : data.response;
        if (responseText) {
            addMessage(responseText, 'assistant');
        } else {
            addMessage('Received invalid response format', 'assistant');
        }
        
    } catch (error) {
        console.error('API request error:', error);
        
        const loadingElement = document.querySelector('.message.loading');
        if (loadingElement) {
            chatHistory.removeChild(loadingElement);
        }
        
        addMessage('Request error: ' + error.message, 'assistant');
    }
  });

  // 初始化
  closeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    closeChatWindow();
  });

  enableDraggingAndClick();

  // 窗口大小变化处理
  window.addEventListener('resize', () => {
    if (assistantContainer.classList.contains('active')) {
      adjustChatWindowPosition();
    } else {
      const rect = assistantContainer.getBoundingClientRect();
      const iconWidth = assistantIcon.offsetWidth;
      const windowWidth = window.innerWidth;
      
      if (rect.right > windowWidth) {
        assistantContainer.style.left = `${windowWidth - iconWidth - 20}px`;
      }
      if (rect.left < 0) {
        assistantContainer.style.left = '20px';
      }
    }
  });

  // 点击页面空白处关闭聊天窗口
  document.addEventListener('click', (event) => {
    if (!assistantContainer.contains(event.target) && 
        assistantContainer.classList.contains('active')) {
      closeChatWindow();
    }
  });

  // 防止拖动过程中文本被选中
  assistantContainer.addEventListener('selectstart', (event) => {
    if (isDragging) {
      event.preventDefault();
    }
  });

  // 添加拉杆事件监听器
  if (leverHandle) {
    leverHandle.addEventListener('mousedown', startLeverDrag);
    leverHandle.addEventListener('touchstart', startLeverDrag);
  }

  function startLeverDrag(e) {
    e.preventDefault();
    const isTouch = e.type === 'touchstart';
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const leverRect = leverHandle.getBoundingClientRect();
    const baseRect = document.querySelector('.lever-base').getBoundingClientRect();
    const maxMove = baseRect.width - leverHandle.offsetWidth;

    function handleDrag(e) {
      const currentX = isTouch ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - startX;
      const newPosition = Math.min(Math.max(0, deltaX), maxMove);
      leverHandle.style.left = `${newPosition}px`;
    }

    function handleDragEnd() {
      const position = parseFloat(leverHandle.style.left) || 0;
      const maxMove = document.querySelector('.lever-base').offsetWidth - leverHandle.offsetWidth;
      
      if (position > maxMove / 2) {
        // 切换到 RAG 模式
        leverHandle.style.left = `${maxMove}px`;
        switchMode('rag');
      } else {
        // 保持/返回到 Chat 模式
        leverHandle.style.left = '0px';
        switchMode('chat');
      }

      leverHandle.style.transition = 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      setTimeout(() => {
        leverHandle.style.transition = '';
      }, 300);

      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('touchend', handleDragEnd);
    }

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('touchend', handleDragEnd);
  }

  function initializeLever() {
    const leverHandle = document.querySelector('.lever-handle');
    if (!leverHandle) return;

    // 创建提示泡泡并添加到chat-window中
    const tooltip = document.createElement('div');
    tooltip.className = 'mode-tooltip';
    tooltip.textContent = 'Chat mode';
    document.querySelector('.chat-window').appendChild(tooltip);

    leverHandle.addEventListener('click', () => {
      isRagMode = !isRagMode;
      
      // 使用类来控制旋转
      leverHandle.classList.toggle('active');
      
      // 显示提示泡泡
      tooltip.textContent = `${isRagMode ? 'RAG' : 'Chat'} mode`;
      tooltip.classList.add('show');
      
      // 1秒后隐藏提示
      setTimeout(() => {
        tooltip.classList.remove('show');
      }, 1000);

      // 更新当前模式
      switchMode(isRagMode ? 'rag' : 'chat');
    });
  }

  // 切换下拉菜单
  modelToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    modelDropdown.classList.toggle('show');
  });

  // 选择模型
  modelOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const selectedModel = e.target.dataset.model;
      currentModel = selectedModel;
      
      // 更新选中状态
      modelOptions.forEach(opt => opt.classList.remove('selected'));
      e.target.classList.add('selected');
      
      // 关闭下拉菜单
      modelDropdown.classList.remove('show');
    });
  });

  // 点击其他地方关闭下拉菜单
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.model-selector')) {
      modelDropdown.classList.remove('show');
    }
  });

  // 在DOMContentLoaded事件监听器中调用初始化
  initializeLever();
});
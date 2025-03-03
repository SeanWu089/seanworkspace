document.addEventListener('DOMContentLoaded', function () {
  // ===================== 原有数据预览和侧边栏逻辑 =====================
  const previewData = localStorage.getItem('previewData');
  if (previewData) {
    const columns = JSON.parse(previewData);
    const tbody = document.querySelector('#preview-table tbody');
    if (tbody) {
      tbody.innerHTML = columns.map(col =>
        `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
      ).join('');
    }
  }

  // 左侧侧边栏
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

  // 右侧侧边栏
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

  // 文件上传
  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv, .xlsx, .txt';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) uploadFileToBackend(file);
        document.body.removeChild(input);
      };
    });
  }

  // ===================== 悬浮助手 =====================
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
  let hasMoved = false; // 用于区分点击和拖拽
  let mouseDownTime = 0; // 记录鼠标按下的时间
  
  // 打开聊天窗口并调整位置确保在视口内
  function openChatWindow() {
    // 记住图标当前位置
    const iconRect = assistantContainer.getBoundingClientRect();
    assistantContainer.dataset.lastLeft = assistantContainer.style.left;
    assistantContainer.dataset.lastTop = assistantContainer.style.top;
    
    // 隐藏图标
    assistantIcon.style.display = 'none';
    
    // 激活聊天窗口
    assistantContainer.classList.add('active');
    
    // 确保聊天窗口在视口内
    adjustChatWindowPosition();
  }
  
  // 调整聊天窗口位置确保在视口内
  function adjustChatWindowPosition() {
    // 等待浏览器渲染聊天窗口
    setTimeout(() => {
      const containerRect = assistantContainer.getBoundingClientRect();
      const chatWindowRect = chatWindow.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newLeft = parseFloat(assistantContainer.style.left) || containerRect.left;
      let newTop = parseFloat(assistantContainer.style.top) || containerRect.top;
      
      // 处理右边界
      if (newLeft + chatWindowRect.width > viewportWidth - 20) {
        newLeft = viewportWidth - chatWindowRect.width - 20;
      }
      
      // 处理底边界
      if (newTop + chatWindowRect.height > viewportHeight - 20) {
        newTop = viewportHeight - chatWindowRect.height - 20;
      }
      
      // 处理左边界
      if (newLeft < 20) {
        newLeft = 20;
      }
      
      // 处理上边界
      if (newTop < 20) {
        newTop = 20;
      }
      
      // 应用新位置
      assistantContainer.style.left = `${newLeft}px`;
      assistantContainer.style.top = `${newTop}px`;
    }, 10); // 短暂延迟确保DOM已更新
  }
  
  // 关闭聊天窗口
  // function closeChatWindow() {
  //   assistantContainer.classList.remove('active');
  //   if (assistantContainer.dataset.lastLeft) {
  //     assistantContainer.style.left = assistantContainer.dataset.lastLeft;
  //   }
  //   if (assistantContainer.dataset.lastTop) {
  //     assistantContainer.style.top = assistantContainer.dataset.lastTop;
  //   }
  //   const windowWidth = window.innerWidth;
  //   assistantContainer.style.left = (windowWidth + 50) + 'px';

  //   assistantIcon.style.display = 'block';
  // }
  
  // 关闭聊天窗口
  function closeChatWindow() {
    // 关闭聊天窗口
    assistantContainer.classList.remove('active');
    
    // 显示图标
    assistantIcon.style.display = 'block';
    
    // 获取窗口宽度和图标宽度
    const windowWidth = window.innerWidth;
    const iconWidth = assistantIcon.offsetWidth;
    const rect = assistantContainer.getBoundingClientRect();
    const topPosition = rect.top;
    
    // 判断是吸附到左边还是右边
    let leftPosition;
    let animationStartX;
    
    if (rect.left + rect.width / 2 < windowWidth / 2) {
      // 更接近左边
      leftPosition = 20; // 距离左边20px
      animationStartX = -100; // 从左侧外面滑入
    } else {
      // 更接近右边
      leftPosition = windowWidth - iconWidth - 20; // 距离右边20px
      animationStartX = 100; // 从右侧外面滑入
    }
    
    // 直接设置最终位置
    assistantContainer.style.transition = 'none';
    assistantContainer.style.left = `${leftPosition}px`;
    assistantContainer.style.top = `${topPosition}px`;
    
    // 强制浏览器重绘
    assistantContainer.offsetHeight;
    
    // 恢复过渡
    assistantContainer.style.transition = '';
    
    // 添加滑动动画，方向根据吸附位置决定
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
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = content;
    chatHistory.appendChild(messageDiv);
    
    // 滚动到底部
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  
  // 处理表单提交

  // 聊天表单提交处理
  chatForm.addEventListener('submit', function(event) {
    event.preventDefault();
    event.stopPropagation(); // 阻止事件冒泡
    
    const message = userInput.value.trim();
    if (!message) return; // 如果消息为空，不处理
    
    // 添加用户消息到聊天区域
    addMessage(message, 'user');
    
    // 清空输入框
    userInput.value = '';
    
    // 显示加载指示器
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('message', 'assistant', 'loading');
    loadingMessage.textContent = '正在思考...';
    chatHistory.appendChild(loadingMessage);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 构建完整API URL
    const apiUrl = 'https://seanholisticworkspace-production.up.railway.app/chat';
    console.log('发送请求到:', apiUrl);
    
    // 发起 POST 请求调用后端 /chat 接口
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ message: message })
    })
    .then(response => {
      console.log('收到响应状态:', response.status);
      if (!response.ok) {
        throw new Error(`服务器返回错误状态码: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('解析响应数据:', data);
      
      // 移除加载指示器
      const loadingElement = document.querySelector('.message.loading');
      if (loadingElement) {
        chatHistory.removeChild(loadingElement);
      }
      
      // 根据后端返回数据添加回复消息
      if (data && data.response) {
        addMessage(data.response, 'assistant');
      } else if (data && data.error) {
        addMessage('错误：' + data.error, 'assistant');
      } else {
        addMessage('收到了无效的响应格式', 'assistant');
        console.error('无效的响应格式:', data);
      }
    })
    .catch(error => {
      console.error('API请求错误:', error);
      console.error('错误详情:', error.message);
      
      // 移除加载指示器
      const loadingElement = document.querySelector('.message.loading');
      if (loadingElement) {
        chatHistory.removeChild(loadingElement);
      }
      
      // 显示错误消息
      addMessage('请求出错：' + error.message, 'assistant');
    });
  });

  // 改进的添加消息函数
  function addMessage(content, sender) {
    // 确保聊天历史元素存在
    if (!chatHistory) {
      console.error('找不到聊天历史元素');
      return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    // 安全处理消息内容
    const safeContent = String(content)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 支持基本的换行
    messageDiv.innerHTML = safeContent.replace(/\n/g, '<br>');
    
    // 添加时间戳
    // const timestamp = document.createElement('div');
    // timestamp.classList.add('timestamp');
    // const now = new Date();
    // timestamp.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    // messageDiv.appendChild(timestamp);
    
    // 添加到聊天历史
    chatHistory.appendChild(messageDiv);
    
    // 滚动到底部
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  // 初始化函数 - 在页面加载完成后检查关键元素
  document.addEventListener('DOMContentLoaded', function() {
    // 检查关键元素是否存在
    if (!chatForm) {
      console.error('找不到聊天表单元素 #chat-form');
    }
    if (!userInput) {
      console.error('找不到用户输入元素 #user-input');
    }
    if (!chatHistory) {
      console.error('找不到聊天历史元素 #chat-history');
    }
    if (!assistantContainer) {
      console.error('找不到助手容器元素 #assistant-container');
    }

    console.log('聊天界面初始化完成');
  });
  
  // 点击关闭按钮关闭聊天窗口
  closeBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // 阻止事件冒泡
    closeChatWindow();
  });
  
  // 初始化位置
  function initPosition() {
    // 如果容器没有明确的位置样式，设置初始位置为右下角
    if (!assistantContainer.style.left && !assistantContainer.style.top) {
      assistantContainer.style.right = '20px';
      assistantContainer.style.top = '50px';
      assistantContainer.style.left = 'auto';
      assistantContainer.style.bottom = 'auto';
    }
  }
  
  // 启用拖拽功能与单击区分 - 改进版本
  function enableDraggingAndClick() {
    assistantContainer.style.position = 'fixed';

    initPosition();
    
    assistantIcon.addEventListener('mousedown', startPotentialDrag);
    assistantIcon.addEventListener('touchstart', startPotentialDrag);

    const chatHeader = document.querySelector('.chat-header');
    chatHeader.addEventListener('mousedown', startPotentialDrag);
    chatHeader.addEventListener('touchstart', startPotentialDrag);
    
    function startPotentialDrag(e) {
      e.preventDefault();
      
      // 记录鼠标按下时间，用于区分点击和拖拽
      mouseDownTime = new Date().getTime();
      hasMoved = false;
      isDragging = true;
      
      // 获取初始位置 - 处理鼠标事件和触摸事件
      if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
      } else if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      
      // 获取容器当前位置
      const rect = assistantContainer.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      // 确保我们有明确的左上角定位
      if (!assistantContainer.style.left || assistantContainer.style.left === 'auto') {
        assistantContainer.style.right = 'auto';
        assistantContainer.style.bottom = 'auto';
        assistantContainer.style.left = `${initialLeft}px`;
        assistantContainer.style.top = `${initialTop}px`;
      }
      
      // 移除过渡效果以实现平滑拖动
      assistantContainer.style.transition = 'none';
      
      // 添加移动和结束事件监听器
      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      let moveX, moveY;
      
      // 处理鼠标事件和触摸事件
      if (e.type === 'mousemove') {
        moveX = e.clientX;
        moveY = e.clientY;
      } else if (e.type === 'touchmove') {
        moveX = e.touches[0].clientX;
        moveY = e.touches[0].clientY;
      }
      
      // 只有移动超过一定距离才算拖拽
      if (Math.abs(moveX - startX) > 5 || Math.abs(moveY - startY) > 5) {
        hasMoved = true;
      }
      
      // 计算位移
      const deltaX = moveX - startX;
      const deltaY = moveY - startY;
      
      // 计算新位置
      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;
      
      // 设置新位置
      assistantContainer.style.right = 'auto';
      assistantContainer.style.bottom = 'auto';
      assistantContainer.style.left = `${newLeft}px`;
      assistantContainer.style.top = `${newTop}px`;
    }
    
    function stopDrag(e) {
      if (!isDragging) return;
      
      isDragging = false;
      
      // 恢复过渡效果
      assistantContainer.style.transition = 'all 1s ease';
      
      // 移除事件监听器
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      
      // 计算释放时间，短时间内点击且没有移动视为单击
      const releaseTime = new Date().getTime();
      const clickDuration = releaseTime - mouseDownTime;
      
      if (!hasMoved && clickDuration < 200) {
        // 这是一个单击操作
        if (!assistantContainer.classList.contains('active') && e.target.closest('.assistant-icon')) {
          // 如果点击的是小图标，且聊天窗口未打开，则打开聊天窗口
          openChatWindow();
        }
      } else {
        // 这是一个拖拽操作，执行吸附逻辑
        snapToEdge();
        
        // 如果聊天窗口已打开，确保它在视口内
        if (assistantContainer.classList.contains('active')) {
          adjustChatWindowPosition();
        }
      }
    }
    
    // 吸附到最近的边缘
    function snapToEdge() {
      const rect = assistantContainer.getBoundingClientRect();
      const iconWidth = assistantIcon.offsetWidth;
      const windowWidth = window.innerWidth;

      const topPosition = rect.top;

      let leftPosition;
      if (rect.left + rect.width / 2 < windowWidth / 2) {
        // 更接近左边
        leftPosition = 20; // 距离左边20px
      } else {
        // 更接近右边
        leftPosition = windowWidth - iconWidth - 20; // 距离右边20px
      }
      
      // 应用吸附效果
      assistantContainer.style.left = `${leftPosition}px`;
      assistantContainer.style.top = `${topPosition}px`;
    }
  }
  
  // 监听窗口大小变化，确保聊天窗口在视口内
  window.addEventListener('resize', () => {
    if (assistantContainer.classList.contains('active')) {
      adjustChatWindowPosition();
    } else {
      // 窗口大小变化时，如果是小图标状态，重新执行吸附
      const rect = assistantContainer.getBoundingClientRect();
      const iconWidth = assistantIcon.offsetWidth;
      const windowWidth = window.innerWidth;
      
      // 确保小图标不超出边界
      if (rect.right > windowWidth) {
        assistantContainer.style.left = `${windowWidth - iconWidth - 20}px`;
      }
      if (rect.left < 0) {
        assistantContainer.style.left = '20px';
      }
    }
  });
  
  // 初始化拖拽和点击功能
  enableDraggingAndClick();
  
  // 点击页面空白处关闭聊天窗口
  document.addEventListener('click', (event) => {
    // 检查点击是否在助手容器外部
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

}); // 结束 DOMContentLoaded 回调

// ===================== 文件上传函数 =====================
function uploadFileToBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  const uploadBtn = document.getElementById('uploadBtn');
  if (!uploadBtn) return;

  uploadBtn.textContent = 'Uploading...';
  uploadBtn.disabled = true;

  fetch('https://seanholisticworkspace-production.up.railway.app/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data?.columns) {
      localStorage.setItem('previewData', JSON.stringify(data.columns));
      const tbody = document.querySelector('#preview-table tbody');
      if (tbody) {
        tbody.innerHTML = data.columns.map(col => 
          `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
        ).join('');
      }
    }
  })
  .catch(console.error)
  .finally(() => {
    uploadBtn.textContent = 'Upload File';
    uploadBtn.disabled = false;
  });
}
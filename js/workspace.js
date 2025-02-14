// ==================== 原始功能代码 ====================

// 上传文件的函数
function uploadFileToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);
  
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.innerText = 'Uploading...';
    uploadBtn.disabled = true;
  
    fetch('https://seanholisticworkspace-production.up.railway.app/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Upload success:', data);
        if (data.columns) {
          localStorage.setItem('previewData', JSON.stringify(data.columns));
          const tbody = document.querySelector('#preview-table tbody');
          tbody.innerHTML = data.columns
            .map(
              (col) =>
                `<tr><td>${col.name || 'Unnamed Column'}</td><td>${col.type}</td></tr>`
            )
            .join('');
          // 更新全局数据变量
          window.dataColumns = data.columns;
        }
      })
      .catch((err) => console.error('Upload failed:', err))
      .finally(() => {
        uploadBtn.innerText = 'Upload File';
        uploadBtn.disabled = false;
      });
}
  
// ==================== DOMContentLoaded 初始化 ====================
document.addEventListener('DOMContentLoaded', function () {
    // 全局变量：存放已建立的连接，格式如 { key, source, target, rule, lineElement }
    let connections = []; 
  
    window.dataColumns = JSON.parse(localStorage.getItem('previewData')) || [];
  
    // -------------------- 初始化数据预览 --------------------
    const initPreviewTable = () => {
      const tbody = document.querySelector('#preview-table tbody');
      if (tbody && window.dataColumns.length) {
        tbody.innerHTML = window.dataColumns
          .map(
            (col) =>
              `<tr><td>${col.name || 'Unnamed Column'}</td><td>${col.type}</td></tr>`
          )
          .join('');
      }
    };
    initPreviewTable();
  
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
  
    // -------------------- 上传逻辑 --------------------
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
  
    // -------------------- 搜索功能（最终修复版） --------------------
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const selectedVariables = document.getElementById('selectedVariables');
  
    // 动态调整已选区域位置
    const updateLayout = () => {
      if (searchResults.classList.contains('active')) {
        const resultsHeight = searchResults.scrollHeight;
        searchResults.style.maxHeight = `${Math.min(resultsHeight, 200)}px`;
        selectedVariables.style.transform = `translateY(${resultsHeight + 5}px)`;
      } else {
        selectedVariables.style.transform = 'translateY(0)';
      }
    };
  
    // 输入事件监听
    searchInput.addEventListener('input', function () {
      const keyword = this.value.trim().toLowerCase();
      searchResults.innerHTML = '';
  
      if (!keyword) {
        searchResults.classList.remove('active');
        updateLayout();
        return;
      }
  
      // 安全过滤逻辑
      const filteredColumns = window.dataColumns.filter((col) => {
        const name = (col?.name || '').toLowerCase();
        return name.includes(keyword);
      });
  
      if (filteredColumns.length) {
        searchResults.classList.add('active');
  
        // 渲染搜索结果
        filteredColumns.forEach((col) => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          resultItem.textContent = col.name || 'Unnamed Column';
  
          // 双击事件处理
          resultItem.addEventListener('dblclick', () => {
            // 防止重复添加
            const itemText = col.name || 'Unnamed Column';
            if (
              [...selectedVariables.children].some(
                (el) => el.querySelector('span').textContent === itemText
              )
            )
              return;
  
            // 添加选中项（带删除按钮）
            const selectedItem = document.createElement('div');
            selectedItem.className = 'selected-variable';
  
            // 文本容器
            const textSpan = document.createElement('span');
            textSpan.textContent = itemText;
            selectedItem.appendChild(textSpan);
            selectedItem.setAttribute('draggable', 'true');
            // 设置拖拽时传递变量名称（用于canvas识别）
            selectedItem.addEventListener('dragstart', function (e) {
              e.dataTransfer.setData('text/plain', itemText);
            });
  
            // 删除按钮
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-variable';
            deleteBtn.innerHTML = '×';
  
            deleteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              selectedItem.remove();
            });
  
            selectedItem.appendChild(deleteBtn);
            selectedVariables.appendChild(selectedItem);
  
            // 视觉反馈
            resultItem.classList.add('selected-feedback');
            void resultItem.offsetWidth;
            setTimeout(() => {
              resultItem.classList.remove('selected-feedback');
            }, 300);
          });
  
          searchResults.appendChild(resultItem);
        });
  
        // 延迟计算确保渲染完成
        requestAnimationFrame(() => {
          updateLayout();
          console.log('搜索结果高度:', searchResults.scrollHeight);
        });
      } else {
        searchResults.classList.remove('active');
        updateLayout();
      }
    });
  
    window.addEventListener('resize', () => {
      requestAnimationFrame(updateLayout);
    });
  
    // 点击外部隐藏搜索区域
    document.addEventListener('mousedown', function (e) {
      if (
        !searchInput.contains(e.target) &&
        !searchResults.contains(e.target) &&
        e.target.id !== 'addNewVarBtn'
      ) {
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        searchInput.value = '';
        updateLayout();
      }
    });
  
    // 初始化检查
    if (window.dataColumns.length) {
      console.log('初始化数据:', window.dataColumns);
    }

    document.getElementById('addNewVarBtn').addEventListener('click', function() {
        // 获取搜索框的内容
        const searchInput = document.getElementById('searchInput');
        const varName = searchInput.value.trim();
        if (varName === "") {
          alert("No variable name provided.");
          return;
        }
        
        // 创建一个新的变量元素，与 .selected-variable 样式一致
        const newVarElem = document.createElement('div');
        newVarElem.className = 'selected-variable';
        
        // 设置新变量的默认属性：例如这里将其属性设置为 "manifest"
        newVarElem.dataset.property = 'manifest';
        // 使用变量名称作为唯一标识
        newVarElem.dataset.id = varName;
        
        // 创建文本容器，将变量名称显示出来
        const span = document.createElement('span');
        span.textContent = varName;
        newVarElem.appendChild(span);
        
        // 设置元素可以拖拽，并绑定拖拽事件（和搜索结果添加时一样）
        newVarElem.setAttribute('draggable', 'true');
        newVarElem.addEventListener('dragstart', function(e) {
          e.dataTransfer.setData('text/plain', varName);
        });
        
        // 创建删除按钮（和已有的选中变量项一致）
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-variable';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          newVarElem.remove();
        });
        newVarElem.appendChild(deleteBtn);
        
        // 将新变量元素添加到 selectedVariables 容器中
        document.getElementById('selectedVariables').appendChild(newVarElem);
        
        // 清空搜索框内容
        searchInput.value = "";
      });
      
      
  
// -------------------- 新增功能：拖拽左侧变量到 canvas 及平移/缩放 --------------------
// 1. 在 id 为 "canvas" 的容器内创建一个子容器 "canvasContent"，所有变量元素与箭头 SVG 均添加在此容器中，
//    以便通过 CSS transform 实现整体平移与缩放（类似地图操作）。
    const canvas = document.getElementById('canvas');
    if (canvas) {
    // 创建 canvasContent（如果不存在）
    let canvasContent = document.getElementById('canvasContent');
    if (!canvasContent) {
        canvasContent = document.createElement('div');
        canvasContent.id = 'canvasContent';
        canvasContent.style.position = 'absolute';
        canvasContent.style.left = '0px';
        canvasContent.style.top = '0px';
        canvasContent.style.width = '100%';
        canvasContent.style.height = '100%';
        // 设置 transform-origin 为左上角
        canvasContent.style.transformOrigin = '0 0';
        canvas.appendChild(canvasContent);
    }

    // 创建 arrowSVG 作为箭头绘制图层（放置在 canvasContent 内，位于所有变量元素的下层）
    let arrowSVG = document.getElementById('arrowSVG');
    if (!arrowSVG) {
        arrowSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrowSVG.setAttribute('id', 'arrowSVG');
        // 为确保箭头能接收鼠标事件（用于双击删除），将 pointer-events 设置为 auto
        arrowSVG.setAttribute(
        'style',
        'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;'
        );
        // 定义箭头 marker（用于 marker-end）
        let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        let marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '10');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        let markerPath = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
        );
        markerPath.setAttribute('d', 'M0,0 L0,7 L10,3.5 z');
        markerPath.setAttribute('fill', 'grey');
        marker.appendChild(markerPath);
        defs.appendChild(marker);
        arrowSVG.appendChild(defs);
        // 将 arrowSVG 插入到 canvasContent 的首位（保证箭头在变量元素下方）
        canvasContent.insertBefore(arrowSVG, canvasContent.firstChild);
    }

    // 辅助函数：获取元素中心
    function getElementCenter(elem) {
        const left = parseFloat(elem.style.left) || 0;
        const top = parseFloat(elem.style.top) || 0;
        const width = elem.offsetWidth;
        const height = elem.offsetHeight;
        return { x: left + width / 2, y: top + height / 2 };
    }
    // 辅助函数：计算两点之间的欧几里得距离
    function distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
    // 新增辅助函数：计算元素边框上最靠近另一元素的点
    function getAnchorPoint(elem, otherCenter) {
        const left = parseFloat(elem.style.left) || 0;
        const top = parseFloat(elem.style.top) || 0;
        const width = elem.offsetWidth;
        const height = elem.offsetHeight;
        const cx = left + width / 2;
        const cy = top + height / 2;
        const dx = otherCenter.x - cx;
        const dy = otherCenter.y - cy;
        const hw = width / 2;
        const hh = height / 2;
        let scaleX = dx !== 0 ? hw / Math.abs(dx) : Infinity;
        let scaleY = dy !== 0 ? hh / Math.abs(dy) : Infinity;
        let scale = Math.min(scaleX, scaleY);
        return { x: cx + dx * scale, y: cy + dy * scale };
    }
    
    // 根据变量属性规则确定箭头方向（返回 source、target 及 rule 信息），不满足条件返回 null
    function getArrowDirection(elemA, elemB) {
        const propA = elemA.dataset.property;
        const propB = elemB.dataset.property;
        // 排除 moderator 参与自动箭头连接
        if (propA === 'moderator' || propB === 'moderator') return null;
        // manifest 指向所有其他变量（但两个 manifest 之间不连接）
        if (propA === 'manifest' && propB !== 'manifest') {
        return { source: elemA, target: elemB, rule: 'manifest' };
        }
        if (propB === 'manifest' && propA !== 'manifest') {
        return { source: elemB, target: elemA, rule: 'manifest' };
        }
        // independent -> dependent
        if (propA === 'independent' && propB === 'dependent') {
        return { source: elemA, target: elemB, rule: 'independent->dependent' };
        }
        if (propB === 'independent' && propA === 'dependent') {
        return { source: elemB, target: elemA, rule: 'independent->dependent' };
        }
        // independent -> mediator
        if (propA === 'independent' && propB === 'mediator') {
        return { source: elemA, target: elemB, rule: 'independent->mediator' };
        }
        if (propB === 'independent' && propA === 'mediator') {
        return { source: elemB, target: elemA, rule: 'independent->mediator' };
        }
        // mediator -> dependent
        if (propA === 'mediator' && propB === 'dependent') {
        return { source: elemA, target: elemB, rule: 'mediator->dependent' };
        }
        if (propB === 'mediator' && propA === 'dependent') {
        return { source: elemB, target: elemA, rule: 'mediator->dependent' };
        }
        return null;
    }
    
    // 全局平移与缩放变量
    let panX = 0,
        panY = 0,
        scale = 1;
    function updateCanvasTransform() {
        canvasContent.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        updateArrows(); // 更新箭头位置（以及 moderator 吸附效果）
    }
    updateCanvasTransform();
    
    // 允许 canvas 接受拖拽（drop 事件挂在外层 canvas 上）
    canvas.addEventListener('dragover', function (e) {
        e.preventDefault();
    });
    
    // 用于跟踪已添加到画布上的变量，确保同一变量只添加一次
    const canvasDroppedVariables = new Set();
    
    // 当从左侧拖拽（或双击添加）时，drop 事件触发于 canvas 上
    canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        const variableName = e.dataTransfer.getData('text/plain');
        if (!variableName) return;
        if (canvasDroppedVariables.has(variableName)) {
        console.log(`变量 "${variableName}" 已存在于canvas上。`);
        return;
        }
        const canvasRect = canvas.getBoundingClientRect();
        // 获取 drop 点相对于 canvas 的坐标
        const dropX = e.clientX - canvasRect.left;
        const dropY = e.clientY - canvasRect.top;
        // 转换到 canvasContent 内部的坐标（反向计算平移与缩放）
        const contentX = (dropX - panX) / scale;
        const contentY = (dropY - panY) / scale;
    
        // 创建新的变量元素
        const newElem = document.createElement('div');
        newElem.textContent = variableName;
        newElem.style.position = 'absolute';
        // 默认样式为自变量 independent（深蓝背景、白色字体）
        newElem.style.backgroundColor = 'darkblue';
        newElem.style.color = 'white';
        newElem.style.padding = '4px 8px';
        newElem.style.border = 'none';
        newElem.style.borderRadius = '4px';
        newElem.style.cursor = 'move';
        newElem.dataset.property = 'independent';
        // 【新增】赋予唯一标识（直接使用变量名称，防止重复添加）
        newElem.dataset.id = variableName;
    
        newElem.style.left = contentX + 'px';
        newElem.style.top = contentY + 'px';
        newElem.classList.add('variable-element');

        // 新增：双击变量元素即可删除它
        newElem.addEventListener('dblclick', function(e) {
            e.stopPropagation();  // 防止冒泡到其它事件
            // 从全局集合中移除该变量，允许以后重新添加
            canvasDroppedVariables.delete(newElem.dataset.id);
            newElem.remove();       // 从 DOM 中删除该元素
            updateArrows();         // 更新箭头连接，移除与该元素相关的箭头
        });
        
  
    
        // ---------------- 新增功能：变量元素拖拽移动（考虑平移与缩放） ----------------
        newElem.addEventListener('mousedown', function (e) {
        // 右键点击用于弹出属性菜单，不进行拖拽
        if (e.button === 2) return;
        e.preventDefault();
        const canvasRect = canvas.getBoundingClientRect();
        // 计算鼠标在 canvasContent 内的坐标（逆转当前平移与缩放）
        const startContentX = (e.clientX - canvasRect.left - panX) / scale;
        const startContentY = (e.clientY - canvasRect.top - panY) / scale;
        const elemLeft = parseFloat(newElem.style.left) || 0;
        const elemTop = parseFloat(newElem.style.top) || 0;
        const shiftX = startContentX - elemLeft;
        const shiftY = startContentY - elemTop;
    
        function onMouseMove(e) {
            const currentContentX = (e.clientX - canvasRect.left - panX) / scale;
            const currentContentY = (e.clientY - canvasRect.top - panY) / scale;
            newElem.style.left = currentContentX - shiftX + 'px';
            newElem.style.top = currentContentY - shiftY + 'px';
            updateArrows();
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', function mouseUpHandler() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', mouseUpHandler);
            updateArrows();
        });
        });
    
        // ---------------- 新增功能：右键弹出属性菜单 ----------------
        newElem.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        currentContextElement = newElem;
        showContextMenu(e.clientX, e.clientY);
        });
    
        canvasContent.appendChild(newElem);
        canvasDroppedVariables.add(variableName);
        updateArrows();
    });
    
    // ---------------- 新增功能：画布平移（地图拖拽） ----------------
    // 当鼠标在 canvasContent 的空白区域按下时启动平移
    canvasContent.addEventListener('mousedown', function (e) {
        if (e.target !== canvasContent) return;
        if (e.button !== 0) return; // 仅响应左键
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startPanX = panX;
        const startPanY = panY;
        function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panX = startPanX + dx;
        panY = startPanY + dy;
        updateCanvasTransform();
        }
        function onMouseUp(e) {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    // ---------------- 新增功能：画布缩放控件 ----------------
    // ---------------- 新增功能：画布缩放控件 ----------------
    const zoomControls = document.createElement('div');
    zoomControls.id = 'zoomControls';
    zoomControls.style.position = 'absolute';
    zoomControls.style.top = '10px';
    zoomControls.style.right = '10px';
    zoomControls.style.zIndex = '1100';
    zoomControls.style.display = 'flex';
    zoomControls.style.flexDirection = 'column';
    zoomControls.style.gap = '5px'; // 间距更大一点

    const zoomIn = document.createElement('button');
    zoomIn.id = 'zoomIn';
    zoomIn.textContent = '+';
    zoomIn.classList.add('zoom-button'); // 给它一个统一的类

    const zoomOut = document.createElement('button');
    zoomOut.id = 'zoomOut';
    zoomOut.textContent = '-';
    zoomOut.classList.add('zoom-button');

    zoomControls.appendChild(zoomIn);
    zoomControls.appendChild(zoomOut);
    canvas.appendChild(zoomControls);

    
    // 设定缩放的最小与最大值
    const minScale = 0.5;
    const maxScale = 2;
    zoomIn.addEventListener('click', () => {
        if (scale < maxScale) {
        scale += 0.1;
        if (scale > maxScale) scale = maxScale;
        updateCanvasTransform();
        }
    });
    zoomOut.addEventListener('click', () => {
        if (scale > minScale) {
        scale -= 0.1;
        if (scale < minScale) scale = minScale;
        updateCanvasTransform();
        }
    });
    } else {
    console.warn('未找到id为"canvas"的元素，无法添加拖拽功能。');
    }
    
    // -------------------- 新增功能：右键属性菜单 ----------------
    // 当前右键操作的元素
    let currentContextElement = null;
    // 创建右键菜单元素（全局只创建一个）
    const contextMenu = document.createElement('div');
    contextMenu.id = 'contextMenu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    contextMenu.style.padding = '5px';
    contextMenu.style.display = 'none';
    contextMenu.style.zIndex = 1000;
    document.body.appendChild(contextMenu);
    
    // 定义不同变量属性对应的样式
    const styleMapping = {
    independent: {
        backgroundColor: 'darkblue',
        color: 'white',
        border: 'none'
    },
    dependent: {
        backgroundColor: 'purple',
        color: 'white',
        border: 'none'
    },
    mediator: {
        backgroundColor: 'peachpuff', // 淡橙色背景
        color: 'black',
        border: 'none'
    },
    moderator: {
        backgroundColor: 'lightgreen', // 淡绿色背景
        color: 'black',
        border: 'none'
    },
    manifest: {
        backgroundColor: 'white',
        color: 'darkblue',
        border: '2px solid darkblue'
    }
    };
    
    // 右键菜单中的选项
    const properties = [
    'independent',
    'dependent',
    'mediator',
    'moderator',
    'manifest'
    ];
    
    // 显示右键菜单的函数
    function showContextMenu(x, y) {
    // 清空菜单内容
    contextMenu.innerHTML = '';
    properties.forEach(function (prop) {
        const item = document.createElement('div');
        item.textContent = prop;
        item.style.padding = '4px 8px';
        item.style.cursor = 'pointer';
        // 简单的悬停效果
        item.addEventListener('mouseover', function () {
        item.style.backgroundColor = '#f0f0f0';
        });
        item.addEventListener('mouseout', function () {
        item.style.backgroundColor = 'white';
        });
        item.addEventListener('click', function (e) {
        if (currentContextElement) {
            const currentProp = currentContextElement.dataset.property;
            if (currentProp !== prop) {
            // 更新 data-property 以及元素的样式
            currentContextElement.dataset.property = prop;
            const styleObj = styleMapping[prop];
            for (let key in styleObj) {
                currentContextElement.style[key] = styleObj[key];
            }
            updateArrows();
            }
        }
        hideContextMenu();
        });
        contextMenu.appendChild(item);
    });
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.style.display = 'block';
    }
    
    // 隐藏右键菜单的函数
    function hideContextMenu() {
    contextMenu.style.display = 'none';
    currentContextElement = null;
    }
    
    // 点击其它区域时隐藏右键菜单
    document.addEventListener('click', function (e) {
    if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
        hideContextMenu();
    }
    });
    
    // 按下 Esc 键时隐藏右键菜单
    document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        hideContextMenu();
    }
    });
    
    // --------------- 新增功能 5 & 6：箭头自动连接与 moderator 吸附 ---------------
    /*
    修改说明：
    1. 一旦建立连接后，无论两个变量距离如何变化，箭头始终更新端点（连接不会自动消失）；
    2. 为每个箭头添加 dblclick 事件，双击箭头即可删除该连接；
    3. 箭头的端点采用 getAnchorPoint() 计算，即从每个元素边框上取最靠近另一元素的点。
    */
    function updateArrows() {
    const arrowSVG = document.getElementById('arrowSVG');
    if (!arrowSVG) return;
    // 获取所有变量元素（通过 class 'variable-element'）
    const varElems = canvasContent.querySelectorAll('.variable-element');
    const elemsArray = Array.from(varElems);
    const arrowThreshold = 150; // 新建连接时采用距离阈值，但已建立连接不会因距离增大而删除
    
    // ① 更新已存在连接的端点（如果源与目标仍在 DOM 中）
    for (let i = connections.length - 1; i >= 0; i--) {
        let conn = connections[i];
        if (!canvasContent.contains(conn.source) || !canvasContent.contains(conn.target)) {
        arrowSVG.removeChild(conn.lineElement);
        connections.splice(i, 1);
        } else {
        // 使用 getAnchorPoint 计算端点
        const sourceAnchor = getAnchorPoint(conn.source, getElementCenter(conn.target));
        const targetAnchor = getAnchorPoint(conn.target, getElementCenter(conn.source));
        conn.lineElement.setAttribute('x1', sourceAnchor.x);
        conn.lineElement.setAttribute('y1', sourceAnchor.y);
        conn.lineElement.setAttribute('x2', targetAnchor.x);
        conn.lineElement.setAttribute('y2', targetAnchor.y);
        }
    }
    
    // ② 遍历所有变量对，若满足新建条件（距离 < arrowThreshold 且箭头规则满足），并且两变量之间尚无连接，则新建连接
    for (let i = 0; i < elemsArray.length; i++) {
        for (let j = i + 1; j < elemsArray.length; j++) {
        const elemA = elemsArray[i];
        const elemB = elemsArray[j];
        // 排除 moderator 变量
        if (elemA.dataset.property === 'moderator' || elemB.dataset.property === 'moderator')
            continue;
        const centerA = getElementCenter(elemA);
        const centerB = getElementCenter(elemB);
        if (distance(centerA, centerB) < arrowThreshold) {
            const arrowInfo = getArrowDirection(elemA, elemB);
            if (arrowInfo) {
            const key = arrowInfo.source.dataset.id + '-' + arrowInfo.target.dataset.id;
            // 如果该连接已存在，则跳过
            let exists = connections.some(conn => conn.key === key);
            if (!exists) {
                const sourceAnchor = getAnchorPoint(arrowInfo.source, getElementCenter(arrowInfo.target));
                const targetAnchor = getAnchorPoint(arrowInfo.target, getElementCenter(arrowInfo.source));
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', sourceAnchor.x);
                line.setAttribute('y1', sourceAnchor.y);
                line.setAttribute('x2', targetAnchor.x);
                line.setAttribute('y2', targetAnchor.y);
                line.setAttribute('stroke', 'grey');
                line.setAttribute('stroke-width', '1');
                line.setAttribute('marker-end', 'url(#arrowhead)');
                line.dataset.rule = arrowInfo.rule;
                // 使该线条能接收鼠标事件（覆盖父级 pointer-events:none）
                line.style.pointerEvents = 'auto';
                // 添加双击事件，双击箭头删除该连接
                line.addEventListener('dblclick', function
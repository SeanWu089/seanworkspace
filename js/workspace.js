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
      } else {
        searchResults.style.maxHeight = '0';
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
  
      const filteredColumns = window.dataColumns.filter((col) => {
        const name = (col?.name || '').toLowerCase();
        return name.includes(keyword);
      });
  
      if (filteredColumns.length) {
        searchResults.classList.add('active');
  
        // 修改搜索结果的渲染方式
        filteredColumns.forEach((col) => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          resultItem.textContent = col.name || 'Unnamed Column';
  
          // 双击事件处理
          resultItem.addEventListener('dblclick', () => {
            const itemText = col.name || 'Unnamed Column';
            if ([...selectedVariables.children].some(
              (el) => el.querySelector('span').textContent === itemText
            )) return;
  
            // 创建并添加新变量
            const selectedItem = document.createElement('div');
            selectedItem.className = 'selected-variable';
            selectedItem.setAttribute('draggable', 'true');
            selectedItem.addEventListener('dragstart', function (e) {
              e.dataTransfer.setData('text/plain', itemText);
            });
  
            const textSpan = document.createElement('span');
            textSpan.textContent = itemText;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-variable';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              selectedItem.remove();
            });
  
            selectedItem.appendChild(textSpan);
            selectedItem.appendChild(deleteBtn);
            selectedVariables.appendChild(selectedItem);
  
            // 添加选中反馈
            resultItem.classList.add('selected-feedback');
            setTimeout(() => {
              resultItem.classList.remove('selected-feedback');
            }, 300);
  
            // 选中后关闭搜索结果
            searchResults.classList.remove('active');
            searchInput.value = '';
            updateLayout();
          });
  
          searchResults.appendChild(resultItem);
        });
  
        requestAnimationFrame(() => {
          updateLayout();
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
        marker.setAttribute('markerWidth', '12');   // 更大的箭头
        marker.setAttribute('markerHeight', '8');
        marker.setAttribute('refX', '12');
        marker.setAttribute('refY', '4');
        marker.setAttribute('orient', 'auto');
        let markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        markerPath.setAttribute('d', 'M0,0 L0,8 L12,4 z');
        markerPath.setAttribute('fill', '#002FA7');  // 主题蓝色箭头
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
        // 修改变量元素的默认样式
        newElem.style.backgroundColor = '#002FA7';  // 使用主题蓝色
        newElem.style.color = 'white';
        newElem.style.padding = '8px 15px';        // 更大的内边距
        newElem.style.borderRadius = '8px';        // 更大的圆角
        newElem.style.cursor = 'move';
        newElem.style.transition = 'all 0.3s ease'; // 平滑过渡效果
        newElem.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)'; // 添加阴影
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
        
        // 暂时移除过渡效果，使移动更加流畅
        newElem.style.transition = 'none';
        
        const canvasRect = canvas.getBoundingClientRect();
        const startContentX = (e.clientX - canvasRect.left - panX) / scale;
        const startContentY = (e.clientY - canvasRect.top - panY) / scale;
        const elemLeft = parseFloat(newElem.style.left) || 0;
        const elemTop = parseFloat(newElem.style.top) || 0;
        const shiftX = startContentX - elemLeft;
        const shiftY = startContentY - elemTop;

        // 使用 requestAnimationFrame 优化性能
        let animationFrameId = null;
        let lastX = null;
        let lastY = null;
    
        function onMouseMove(e) {
            const currentContentX = (e.clientX - canvasRect.left - panX) / scale;
            const currentContentY = (e.clientY - canvasRect.top - panY) / scale;
            
            // 如果位置没有改变，不更新
            if (lastX === currentContentX && lastY === currentContentY) {
    return;
  }

            lastX = currentContentX;
            lastY = currentContentY;

            // 使用 requestAnimationFrame 进行位置更新
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            animationFrameId = requestAnimationFrame(() => {
                newElem.style.left = (currentContentX - shiftX) + 'px';
                newElem.style.top = (currentContentY - shiftY) + 'px';
                updateArrows();
            });
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // 拖拽结束后恢复过渡效果
            newElem.style.transition = 'all 0.3s ease';
            
            // 取消可能未执行的动画帧
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            // 最后更新一次箭头位置
            updateArrows();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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
    contextMenu.style.border = '1px solid #E0E0E0';
    contextMenu.style.borderRadius = '8px';
    contextMenu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    contextMenu.style.padding = '8px 0';
    contextMenu.style.display = 'none';
    contextMenu.style.zIndex = 1000;
    document.body.appendChild(contextMenu);
    
    // 定义不同变量属性对应的样式
    const styleMapping = {
        independent: {
            backgroundColor: '#002FA7',    // 主题蓝色
            color: 'white',
            border: 'none',
            boxShadow: '0 2px 6px rgba(0, 47, 167, 0.2)'
        },
        dependent: {
            backgroundColor: '#FF69B4',    // 粉色
            color: 'white',
            border: 'none',
            boxShadow: '0 2px 6px rgba(255, 105, 180, 0.2)'
        },
        mediator: {
            backgroundColor: '#FFA500',    // 标准橙色
            color: 'white',                
            border: 'none',                
            boxShadow: '0 2px 6px rgba(255, 165, 0, 0.2)'
        },
        moderator: {
            backgroundColor: '#90EE90',    // 淡绿色
            color: 'white',                
            border: 'none',                
            boxShadow: '0 2px 6px rgba(0, 47, 167, 0.1)'
        },
        manifest: {
            backgroundColor: 'white',
            color: '#002FA7',              // 主题蓝色文字
            border: '2px solid #002FA7',
            boxShadow: '0 2px 6px rgba(0, 47, 167, 0.1)'
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
            item.style.padding = '8px 16px';
            item.style.cursor = 'pointer';
            item.style.transition = 'all 0.2s ease';
            item.style.color = '#002FA7';

            // 添加悬停效果
            item.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#F0F7FF';  // 淡蓝色背景
            });

            item.addEventListener('mouseout', function() {
                this.style.backgroundColor = 'white';
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
                line.setAttribute('stroke', '#002FA7');     // 主题蓝色线条
                line.setAttribute('stroke-width', '2');     // 更粗的线条
                line.setAttribute('marker-end', 'url(#arrowhead)');
                line.dataset.rule = arrowInfo.rule;
                // 使该线条能接收鼠标事件（覆盖父级 pointer-events:none）
                line.style.pointerEvents = 'auto';
                // 添加双击事件，双击箭头删除该连接
                line.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                arrowSVG.removeChild(line);
                connections = connections.filter(conn => conn.key !== key);
                });
                arrowSVG.appendChild(line);
                connections.push({
                key: key,
                source: arrowInfo.source,
                target: arrowInfo.target,
                rule: arrowInfo.rule,
                lineElement: line
                });
            }
            }
        }
        }
    }
    
    // ③ 处理 moderator 吸附（规则 6）：对于每个 moderator，
    // 如果其中心离任一非 manifest 箭头的中点小于设定阈值（20px），则自动吸附到该箭头中点
    // ③ 处理 moderator 吸附（规则 6）：对于每个 moderator，
    elemsArray.forEach((elem) => {
        if (elem.dataset.property === 'moderator') {
            const center = getElementCenter(elem);
            let closestLine = null;
            let closestDistance = Infinity;
            let closestMidpoint = null;
            Array.from(arrowSVG.childNodes).forEach((node) => {
                if (node.tagName !== 'line') return;
                if (node.dataset.rule === 'manifest') return; // 不吸附于 manifest 箭头
                const x1 = parseFloat(node.getAttribute('x1'));
                const y1 = parseFloat(node.getAttribute('y1'));
                const x2 = parseFloat(node.getAttribute('x2'));
                const y2 = parseFloat(node.getAttribute('y2'));
                const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
                const d = distance(center, mid);
                if (d < closestDistance) {
                    closestDistance = d;
                    closestLine = node;
                    closestMidpoint = mid;
                }
            });
            const snapThreshold = 20;
            if (closestDistance < snapThreshold && closestMidpoint) {
                const width = elem.offsetWidth;
                const height = elem.offsetHeight;
                const newLeft = closestMidpoint.x - width / 2;
                const newTop = closestMidpoint.y - height / 2;
                elem.style.left = newLeft + 'px';
                elem.style.top = newTop + 'px';
                
                // 查找 closestLine 对应的连接对象，并记录附着信息
                let attachedConnection = null;
                for (let conn of connections) {
                    if (conn.lineElement === closestLine) {
                        attachedConnection = {
                            source: conn.source.dataset.id,
                            target: conn.target.dataset.id
                        };
                        break;
                    }
                }
                if (attachedConnection) {
                    elem.dataset.attachedTo = JSON.stringify(attachedConnection);
                } else {
                    elem.dataset.attachedTo = null;
                }
            } else {
                // 如果 moderator 不靠近任何连线，则清除附着数据
                elem.dataset.attachedTo = null;
            }
        }
    });

    }

    // >>>>>>>>>>> REsult PART!!!! <<<<<<<<<
    document.getElementById('shazamBtn').addEventListener('click', function() {
        // 平滑滚动到 id 为 resultsSection 的区域
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
      });


// >>>>>>>>>>> SEM Data Extraction & Backend Communication 代码 <<<<<<<<<<

// 提取 canvas 上所有变量节点的信息
function extractVariablesFromCanvas() {
    const variables = [];
    // 假设所有在 canvas 上的变量节点都具有 class "variable-element"
    document.querySelectorAll('.variable-element').forEach(elem => {
      variables.push({
        id: elem.dataset.id,              // 变量唯一标识
        property: elem.dataset.property,  // 变量属性，如 independent, dependent, latent, moderator, manifest
        // 如果有 moderator 附着信息，读取 data-attached-to（预期为 JSON 字符串）
        attachedTo: elem.dataset.attachedTo || null
      });
    });
    return variables;
  }
  
  // 提取所有连线（箭头）信息
  function extractConnections() {
    // 这里我们假设全局变量 connections 已经保存了所有连接对象，
    // 每个连接对象形如： { key, source, target, rule, lineElement }
    return connections.map(conn => ({
      source: conn.source.dataset.id,
      target: conn.target.dataset.id,
      rule: conn.rule
    }));
  }
  
  // 根据连线信息，为 latent 变量附加其 manifest 列表
  // 规则说明：若一条连线的 rule 为 "manifest"，且一端是 latent，则另一端视为该 latent 的 manifest 变量
  function attachManifestsToLatents(variables, connections) {
    // 构造变量 id 与变量对象的映射，方便后续查找
    const varMap = {};
    variables.forEach(v => {
      varMap[v.id] = v;
      // 针对 latent 变量，初始化 manifests 数组
      if (v.property === 'latent') {
        v.manifests = [];
      }
    });
    
    connections.forEach(conn => {
      if (conn.rule === 'manifest') {
        const sourceVar = varMap[conn.source];
        const targetVar = varMap[conn.target];
        if (sourceVar && sourceVar.property === 'latent') {
          // 另一端 target 为 manifest 变量
          sourceVar.manifests.push(targetVar.id);
        } else if (targetVar && targetVar.property === 'latent') {
          // 另一端 source 为 manifest 变量
          targetVar.manifests.push(sourceVar.id);
        }
      }
    });
    
    // 返回更新后的变量列表
    return Object.values(varMap);
  }
  
  // 整合所有 SEM 数据：变量信息、连线信息以及 moderator 附着信息（如果有）
  function collectSemData() {
    const variables = extractVariablesFromCanvas();
    const conns = extractConnections();
    // 为 latent 变量附加 manifest 列表
    const updatedVariables = attachManifestsToLatents(variables, conns);
    
    // 可选：单独提取 moderator 信息（这里示例直接在变量中包含 attachedTo 信息）
    const moderators = updatedVariables.filter(v => v.property === 'moderator').map(v => ({
      id: v.id,
      attachedTo: v.attachedTo ? JSON.parse(v.attachedTo) : null
    }));
    
    return {
      variables: updatedVariables,
      connections: conns,
      moderators: moderators
    };
  }
  
  // 示例：将收集到的 SEM 数据发送给后端处理
  function sendSemDataToBackend() {
    const semData = collectSemData();
    const filePath = localStorage.getItem('uploadedFilePath');
    if (!filePath) {
    console.error("没有找到上传文件的路径，请先上传文件！");
    }
    // const filePath = window.uploadedFilePath;
    // if (!filePath) {
    //     console.error("没有找到上传文件的路径，请先上传文件！");
    //     return;
    // }
    const payload = {
        sem_data: semData,
        file_path: filePath
    };
    console.log("Collected SEM Data: ", semData, "File path: ", filePath);
    
    // 修改此处 URL 为你的后端接收数据的接口地址
    fetch('https://seanholisticworkspace-production.up.railway.app/sem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Backend response: ", data);
      
        // 1. 填充"路径结果汇总表"
        const pathTableBody = document.querySelector('#pathResultsTable tbody');
        if (!pathTableBody) return;
        pathTableBody.innerHTML = ''; // 先清空表格内容
      
        if (data.paths && Array.isArray(data.paths)) {
          data.paths.forEach(row => {
            const tr = document.createElement('tr');
      
            // 路径描述
            const tdPath = document.createElement('td');
            tdPath.textContent = row.path_description || '';
            tr.appendChild(tdPath);
      
            // 效应大小
            const tdEstimate = document.createElement('td');
            tdEstimate.textContent = row.estimate !== undefined ? row.estimate.toFixed(3) : '';
            tr.appendChild(tdEstimate);
      
            // p 值
            const tdPValue = document.createElement('td');
            // 若 p_value 为数值，保留三位小数
            if (typeof row.p_value === 'number') {
              tdPValue.textContent = row.p_value.toFixed(3);
            } else {
              // 如果 p_value 是字符串或者 "
              tdPValue.textContent = row.p_value || '';
            }
            tr.appendChild(tdPValue);
      
            // 显著性
            const tdSignificance = document.createElement('td');
            tdSignificance.textContent = row.significance || '';
            tr.appendChild(tdSignificance);
      
            // 备注说明
            const tdNotes = document.createElement('td');
            tdNotes.textContent = row.notes || '';
            tr.appendChild(tdNotes);
      
            pathTableBody.appendChild(tr);
          });
        }
      
        // 2. 填充"模型拟合指标"
        const modelFitDiv = document.getElementById('modelFitIndices');
        if (modelFitDiv) {
          modelFitDiv.innerHTML = ''; // 先清空
      
          // 如果后端返回 data.fit_indices
          if (data.fit_indices && typeof data.fit_indices === 'object') {
            // 这里根据你后端返回的指标结构进行遍历
            for (const key in data.fit_indices) {
              const p = document.createElement('p');
              p.textContent = `${key}: ${data.fit_indices[key]}`;
              modelFitDiv.appendChild(p);
            }
          } else {
            // 如果没有 fit_indices，简单提示或留空
            modelFitDiv.innerHTML = '<p>暂无模型拟合指标</p>';
          }
        }
      
        // 如果有需要，你还可以在这里使用 data.specification 等信息
        // document.getElementById('someSpecDiv').textContent = data.specification || '';
      })
      
    .catch(err => console.error("Error sending SEM data: ", err));
  }
  
  const shazamBtn = document.getElementById('shazamBtn');
  if (shazamBtn) {
    shazamBtn.addEventListener('click', function() {
      // 发送 SEM 数据到后端
      sendSemDataToBackend();
      // 平滑滚动到 id 为 resultsSection 的区域
      document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    console.error("找不到 id 为 'shazamBtn' 的按钮，请检查 HTML 中的按钮 id。");
  }


//  >>>> ================================================ User Feedback <<<<<<<
const feedbackTrigger = document.getElementById('feedbackTrigger');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackContainer = document.querySelector('.feedback-container');

// 点击触发器时执行
feedbackTrigger.addEventListener('click', function (event) {
  event.stopPropagation(); // 阻止事件冒泡，防止触发 document 点击事件
  // 切换面板激活状态（滑出/收回）
  feedbackPanel.classList.toggle('active');

  if (feedbackPanel.classList.contains('active')) {
    // 面板滑出时，将触发器移入面板末尾，并转变样式
    feedbackPanel.appendChild(feedbackTrigger);
    feedbackTrigger.classList.add('active');
  } else {
    // 面板收回时，将触发器放回原位置（插入到反馈容器最前面）
    feedbackContainer.insertBefore(feedbackTrigger, feedbackPanel);
    feedbackTrigger.classList.remove('active');
  }
});

// 点击空白处时，面板收回，触发器恢复到左侧
document.addEventListener('click', function (event) {
  // 如果点击的目标不在反馈容器内
  if (!feedbackContainer.contains(event.target)) {
    if (feedbackPanel.classList.contains('active')) {
      feedbackPanel.classList.remove('active');
      // 等待面板动画结束后再把触发器恢复到原位（这里使用 800ms，与 CSS 过渡时间保持一致）
      setTimeout(() => {
        feedbackContainer.insertBefore(feedbackTrigger, feedbackPanel);
        feedbackTrigger.classList.remove('active');
      }, 800);
    }
  }
});

// 处理点击 submit 按钮后的反馈提交操作
document.getElementById('submitBtn').addEventListener('click', function(event) {
  // 阻止事件冒泡，避免触发 document 点击空白处的逻辑
  event.stopPropagation();

  const feedbackInput = document.getElementById('feedbackInput');
  const statusMessage = document.getElementById('statusMessage');
  const feedback = feedbackInput.value.trim();

  if (!feedback) {
    statusMessage.innerText = "请输入反馈内容";
    return;
  }


  fetch('/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feedback: feedback })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      statusMessage.innerText = "提交失败: " + data.error;
    } else {
      statusMessage.innerText = "感谢反馈! 反馈编号：" + data.feedbackNumber;
      // 清空输入框
      feedbackInput.value = "";
      // 反馈成功后自动收回面板
      if (feedbackPanel.classList.contains('active')) {
        feedbackPanel.classList.remove('active');
        // 等待动画结束后再将触发器恢复到原位
        setTimeout(() => {
          feedbackContainer.insertBefore(feedbackTrigger, feedbackPanel);
          feedbackTrigger.classList.remove('active');
        }, 800);
      }
    }
  })
  .catch(error => {
    statusMessage.innerText = "提交异常: " + error;
  });
});


  
});

// 初始化文件下拉选择器
function initializeFileDropdown() {
    const dropdownHeader = document.getElementById('fileDropdownHeader');
    const dropdownContent = document.getElementById('fileDropdownContent');
    
    // 切换文件列表的显示/隐藏
    dropdownHeader.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        const isVisible = dropdownContent.style.display === 'block';
        dropdownContent.style.display = isVisible ? 'none' : 'block';
    });

    // 点击外部时关闭下拉框
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.file-dropdown')) {
            dropdownContent.style.display = 'none';
        }
    });

    // 阻止下拉内容的点击事件冒泡
    dropdownContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// 文件选择处理函数
async function selectDataFile(element) {
    try {
        // 更新选中状态
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });
        element.classList.add('selected');

        // 获取文件名和路径
        const fileName = element.querySelector('.file-name').textContent;
        const filePath = element.dataset.filePath;
        
        // 更新下拉框显示
        const dropdownHeader = document.getElementById('fileDropdownHeader');
        dropdownHeader.querySelector('span').textContent = fileName;
        
        // 关闭下拉框
        document.getElementById('fileDropdownContent').style.display = 'none';
        
        // 启用搜索输入框
        document.getElementById('searchInput').disabled = false;

        // 存储文件路径到 localStorage（用于后续操作）
        localStorage.setItem('uploadedFilePath', filePath);
        
        // 从 Supabase 加载文件内容
        const { data, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .download(filePath);
            
        if (error) throw error;

        // 处理文件内容
        const fileContent = await data.text();
        processFileContent(fileContent, fileName);
    } catch (error) {
        console.error('Error loading file:', error);
        alert('Failed to load file. Please try again.');
    }
}

// 处理文件内容
function processFileContent(content, fileName) {
    if (fileName.endsWith('.csv')) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // 创建列信息
        const columns = headers.map(name => ({
            name: name,
            type: 'numeric' // 或添加类型检测逻辑
        }));

        // 更新全局数据变量
        window.dataColumns = columns;
        
        // 更新预览表格
        updatePreviewTable(columns);
    }
}

// 更新预览表格函数
function updatePreviewTable(columns) {
    const previewTable = document.querySelector('#preview-table tbody');
    if (!previewTable) return;

    previewTable.innerHTML = columns.map(col => `
        <tr>
            <td>${col.name || 'Unnamed Column'}</td>
            <td>${col.type}</td>
        </tr>
    `).join('');
}

// 加载文件列表
async function loadDataFiles() {
    try {
        // 获取当前用户
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
        
        if (userError || !user) {
            throw new Error('No user found');
        }
        
        // 直接从 Supabase 获取文件列表
        const { data: files, error } = await window.supabaseClient
            .storage
            .from('user_files')
            .list(`${user.id}/`);
            
        if (error) throw error;
        
        const dropdownContent = document.getElementById('fileDropdownContent');
        
        // 如果没有文件，显示提示信息
        if (!files || files.length === 0) {
            dropdownContent.innerHTML = `
                <div class="empty-state">
                    <p>No data files available</p>
                </div>
            `;
            return;
        }
        
        // 过滤支持的文件类型
        const supportedFiles = files.filter(file => 
            file.name.endsWith('.csv') || 
            file.name.endsWith('.xlsx') || 
            file.name.endsWith('.xls')
        );
        
        // 生成文件列表
        dropdownContent.innerHTML = supportedFiles.map(file => {
            const fileIcon = file.name.endsWith('.csv') ? 'fa-file-csv' : 'fa-file-excel';
            const fileSize = formatFileSize(file.metadata?.size || 0);
            const uploadDate = new Date(file.created_at).toLocaleDateString();
            
            return `
                <div class="file-item" data-file-path="${user.id}/${file.name}" onclick="selectDataFile(this)">
                    <i class="file-icon fas ${fileIcon}"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">${fileSize} • ${uploadDate}</div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading data files:', error);
        document.getElementById('fileDropdownContent').innerHTML = `
            <div class="error-message">
                <p>Error loading files</p>
            </div>
        `;
    }
}

// 格式化文件大小的辅助函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // ... 现有的初始化代码 ...
    
    // 初始化文件下拉选择器
    initializeFileDropdown();
    
    // 加载文件列表
    loadDataFiles();
    
    // 初始状态下禁用搜索输入框
    document.getElementById('searchInput').disabled = true;
});


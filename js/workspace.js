// ==================== 原始功能代码 ====================

// ==================== DOMContentLoaded 初始化 ====================
document.addEventListener('DOMContentLoaded', function () {
    // 全局变量：存放已建立的连接，格式如 { key, source, target, rule, lineElement }
    window.connections = []; 
  
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
  
          // 双击事件处理 - 移除了自动关闭搜索结果的逻辑
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
  
            // 添加选中反馈效果
            resultItem.classList.add('selected-feedback');
            setTimeout(() => {
              resultItem.classList.remove('selected-feedback');
            }, 300);
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
        marker.setAttribute('markerWidth', '8');   // 改小箭头
        marker.setAttribute('markerHeight', '6');   // 改小箭头
        marker.setAttribute('refX', '8');          // 调整参考点
        marker.setAttribute('refY', '3');          // 调整参考点
        marker.setAttribute('orient', 'auto');
        let markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        markerPath.setAttribute('d', 'M0,0 L0,6 L8,3 z');  // 调整箭头路径
        markerPath.setAttribute('fill', '#000000');  // 改为黑色
        marker.appendChild(markerPath);
        defs.appendChild(marker);
        arrowSVG.appendChild(defs);
        // 将 arrowSVG 插入到 canvasContent 的首位（保证箭头在变量元素下方）
        canvasContent.insertBefore(arrowSVG, canvasContent.firstChild);
    }

    // 辅助函数：获取元素中心
    function getElementCenter(elem) {
        try {
            if (!elem) {
                throw new Error('Element is null or undefined');
            }
            
            const rect = elem.getBoundingClientRect();
            const containerRect = elem.parentElement.getBoundingClientRect();
            
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
            };
        } catch (error) {
            logError('Failed to get element center', error);
            return { x: 0, y: 0 }; // 返回默认值而不是抛出错误
        }
    }
    // 辅助函数：计算两点之间的欧几里得距离
    function distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
    // 新增辅助函数：计算元素边框上最靠近另一元素的点
    function getAnchorPoint(elem, otherCenter) {
        try {
            if (!elem || !otherCenter) {
                throw new Error('Missing required parameters');
            }
            
            const rect = elem.getBoundingClientRect();
            const containerRect = elem.parentElement.getBoundingClientRect();
            
            // 计算元素中心点（相对于容器）
            const cx = rect.left - containerRect.left + rect.width / 2;
            const cy = rect.top - containerRect.top + rect.height / 2;
            
            // 计算方向向量
            const dx = otherCenter.x - cx;
            const dy = otherCenter.y - cy;
            
            // 防止除以零
            if (dx === 0 && dy === 0) {
                return { x: cx, y: cy };
            }
            
            // 计算与边界的交点
            const angle = Math.atan2(dy, dx);
            const hw = rect.width / 2;
            const hh = rect.height / 2;
            
            // 计算交点
            let x, y;
            const absCosTh = Math.abs(Math.cos(angle));
            const absSinTh = Math.abs(Math.sin(angle));
            
            if (hw * absSinTh <= hh * absCosTh) {
                // 与垂直边界相交
                x = cx + (dx >= 0 ? hw : -hw);
                y = cy + dy * (hw / Math.abs(dx));
            } else {
                // 与水平边界相交
                x = cx + dx * (hh / Math.abs(dy));
                y = cy + (dy >= 0 ? hh : -hh);
            }
            
            return { x, y };
        } catch (error) {
            logError('Failed to get anchor point', error);
            return { x: 0, y: 0 }; // 返回默认值而不是抛出错误
        }
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
                line.setAttribute('stroke', '#000000');     // 改为黑色
                line.setAttribute('stroke-width', '2');     // 保持线宽不变
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
        // 发送 SEM 数据到后端
        sendSemDataToBackend();
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
  async function sendSemDataToBackend() {
    console.log("开始处理SEM数据");
    const semData = collectSemData();
    console.log("收集的SEM数据:", semData);
    
    const filePath = localStorage.getItem('uploadedFilePath');
    if (!filePath) {
    console.error("没有找到上传文件的路径，请先上传文件！");
      alert("请先上传数据文件");
        return;
    }

    try {
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error || !user) {
            console.error("未登录用户", error);
            alert("请先登录");
            return;
        }

    const payload = {
        sem_data: semData,
            file_path: filePath,
            user_id: user.id
    };
    
        console.log("准备发送数据到后端:", payload);
        
        const response = await fetch('http://localhost:1201/sem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
        });

            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }

        const data = await response.json();
        console.log("后端返回的数据:", data);
    
    // 更新路径分析表格
        updatePathTable(data.paths);
        
        // 更新拟合指标
        updateFitIndices(data.fit_indices);
        
        // 更新可视化图表
        updateVisualization(data.paths);

    } catch (err) {
        console.error("Error:", err);
        alert("处理失败: " + err.message);
    }
  }
  
  function updatePathTable(paths) {
    const tbody = document.querySelector('#pathResultsTable tbody');
    if (!tbody) return;
    
    // 修改表格容器样式
    const table = document.querySelector('#pathResultsTable');
    table.style.fontSize = '14px';     // 减小字体
    table.style.width = '90%';         // 稍微收窄表格
    table.style.margin = '10px auto';  // 居中对齐
    
    tbody.innerHTML = paths.map(path => `
        <tr>
            <td style="padding: 6px 10px;">${path.path_description}</td>
            <td style="padding: 6px 10px;">${path.estimate.toFixed(3)}</td>
            <td style="padding: 6px 10px;">${path.p_value.toFixed(3)}</td>
            <td style="padding: 6px 10px;">${path.significance}</td>
            <td style="padding: 6px 10px;">${path.notes || ''}</td>
        </tr>
    `).join('');
  }
  
  function updateFitIndices(indices) {
    const container = document.getElementById('modelFitIndices');
    if (!container) return;
    
    container.style.fontSize = '14px';  // 减小字体
    container.style.padding = '10px';   // 减小内边距
    
    container.innerHTML = Object.entries(indices).map(([key, value]) => `
        <div class="fit-index" style="margin: 5px 0;">
            <div class="fit-index-name" style="display: inline-block; width: 80px;">${key}</div>
            <div class="fit-index-value" style="display: inline-block;">
                ${typeof value === 'number' ? value.toFixed(3) : value}
            </div>
        </div>
    `).join('');
  }
  
  // 添加错误处理和日志记录函数
  function logError(message, error = null) {
      console.error(`[SEM Visualization Error] ${message}`, error);
  }

  function logWarning(message) {
      console.warn(`[SEM Visualization Warning] ${message}`);
  }

  function logInfo(message) {
      console.log(`[SEM Visualization Info] ${message}`);
  }

  // 修改 updateVisualization 函数开头添加错误处理
  function updateVisualization(paths) {
      try {
          const container = document.getElementById('resultVisualization');
          if (!container) {
              throw new Error('Visualization container not found');
          }
          
          logInfo('Starting visualization update');
          container.innerHTML = '';
          container.style.position = 'relative';
          container.style.height = '500px';

          // 获取 canvas 中的元素信息
          const canvasElements = getCanvasElements();
          if (!canvasElements.variables.length) {
              logWarning('No variables found in canvas');
              container.innerHTML = '<div class="empty-state"><p>No variables to visualize</p></div>';
              return;
          }

          logInfo(`Found ${canvasElements.variables.length} variables and ${canvasElements.connections.length} connections`);

          // 创建 SVG 容器
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('id', 'visualizationSVG');
          svg.setAttribute('style', 'position:absolute; top:0; left:0; width:100%; height:100%;');
          container.appendChild(svg);

          // 添加箭头定义
          const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
          marker.setAttribute('id', 'visualization-arrowhead');
          marker.setAttribute('markerWidth', '8');
          marker.setAttribute('markerHeight', '6');
          marker.setAttribute('refX', '8');
          marker.setAttribute('refY', '3');
          marker.setAttribute('orient', 'auto');
          const markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          markerPath.setAttribute('d', 'M0,0 L0,6 L8,3 z');
          markerPath.setAttribute('fill', '#000000');
          marker.appendChild(markerPath);
          defs.appendChild(marker);
          svg.appendChild(defs);

          // 计算布局位置
          const minLeft = Math.min(...canvasElements.variables.map(v => v.position.left || 0));
          const minTop = Math.min(...canvasElements.variables.map(v => v.position.top || 0));
          const padding = 50; // 添加一些内边距

          // 创建节点
          const nodes = new Map(); // 用于存储节点引用
          canvasElements.variables.forEach(variable => {
              const left = (variable.position.left - minLeft) + padding;
              const top = (variable.position.top - minTop) + padding;
              
              const node = document.createElement('div');
              node.className = 'visualization-node';
              node.dataset.id = variable.id;
              node.dataset.property = variable.property;
              node.textContent = variable.id;
              node.style.left = `${left}px`;
              node.style.top = `${top}px`;
              container.appendChild(node);
              nodes.set(variable.id, node); // 存储节点引用
          });

          // 创建连接
          canvasElements.connections.forEach(conn => {
              const sourceNode = nodes.get(conn.sourceId);
              const targetNode = nodes.get(conn.targetId);
              
              if (!sourceNode || !targetNode) {
                  console.warn(`Could not find nodes for connection: ${conn.sourceId} -> ${conn.targetId}`);
                  return;
              }

              // 获取节点位置和尺寸
              const sourceRect = sourceNode.getBoundingClientRect();
              const targetRect = targetNode.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();

              // 计算相对于容器的位置
              const sourceCenter = {
                  x: sourceRect.left - containerRect.left + sourceRect.width / 2,
                  y: sourceRect.top - containerRect.top + sourceRect.height / 2
              };
              const targetCenter = {
                  x: targetRect.left - containerRect.left + targetRect.width / 2,
                  y: targetRect.top - containerRect.top + targetRect.height / 2
              };

              // 计算连接点
              const sourceAnchor = getAnchorPoint(sourceNode, targetCenter);
              const targetAnchor = getAnchorPoint(targetNode, sourceCenter);

              // 创建连接线
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', sourceAnchor.x);
              line.setAttribute('y1', sourceAnchor.y);
              line.setAttribute('x2', targetAnchor.x);
              line.setAttribute('y2', targetAnchor.y);
              line.setAttribute('stroke', '#000000');
              line.setAttribute('stroke-width', '2');
              line.setAttribute('marker-end', 'url(#visualization-arrowhead)');
              svg.appendChild(line);

              // 如果有路径信息，添加系数标签
              if (paths) {
                  const pathInfo = paths.find(p => 
                      p.path_description.includes(conn.sourceId) && 
                      p.path_description.includes(conn.targetId)
                  );
                  
                  if (pathInfo) {
                      // 计算箭头的角度
                      const dx = targetAnchor.x - sourceAnchor.x;
                      const dy = targetAnchor.y - sourceAnchor.y;
                      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                      
                      // 计算垂直偏移量，根据箭头角度动态调整
                      // 当箭头接近水平时使用较小的偏移，当箭头较倾斜时使用较大的偏移
                      const baseOffset = 15;  // 基础偏移量
                      const angleAbs = Math.abs(angle);
                      const dynamicOffset = baseOffset + (angleAbs > 30 ? 10 : 0);  // 当角度大于30度时增加偏移
                      
                      // 计算标签位置，使用动态偏移
                      const labelX = (sourceAnchor.x + targetAnchor.x) / 2;
                      const labelY = (sourceAnchor.y + targetAnchor.y) / 2;
                      
                      // 根据箭头方向计算垂直偏移
                      const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * dynamicOffset;
                      const perpY = dx / Math.sqrt(dx * dx + dy * dy) * dynamicOffset;
                      
                      const label = document.createElement('div');
                      label.className = 'connection-coefficient';
                      label.style.position = 'absolute';
                      label.style.left = `${labelX + perpX}px`;
                      label.style.top = `${labelY + perpY}px`;
                      label.style.transform = 'translate(-50%, -50%)';
                      label.style.backgroundColor = 'transparent';  // 设置背景为透明
                      label.style.padding = '2px 4px';
                      label.style.borderRadius = '3px';
                      label.style.fontSize = '12px';
                      label.style.fontFamily = 'Arial';
                      label.style.whiteSpace = 'nowrap';  // 防止数字换行
                      label.style.textShadow = '1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white';  // 添加白色文字阴影来增加可读性
                      
                      // 添加系数和显著性标记
                      let significance = '';
                      if (pathInfo.p_value < 0.001) significance = '***';
                      else if (pathInfo.p_value < 0.01) significance = '**';
                      else if (pathInfo.p_value < 0.05) significance = '*';
                      
                      label.textContent = `${pathInfo.estimate.toFixed(3)}${significance}`;
                      container.appendChild(label);
                  }
              }
          });
      } catch (error) {
          logError('Failed to update visualization', error);
          const container = document.getElementById('resultVisualization');
          if (container) {
              container.innerHTML = `
                  <div class="error-state">
                      <p>Failed to create visualization</p>
                      <p class="error-details">${error.message}</p>
                  </div>
              `;
          }
      }
  }

  const shazamBtn = document.getElementById('shazamBtn');
  if (shazamBtn) {
    shazamBtn.addEventListener('click', function() {
      // 发送 SEM 数据到后端
      sendSemDataToBackend();
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

// 添加一个测试按钮事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 获取测试按钮
    const testVisualBtn = document.getElementById('testVisualBtn');
    if (testVisualBtn) {
        // 添加点击事件
        testVisualBtn.addEventListener('click', function() {
            console.log('测试按钮被点击');
            
            // 获取可视化容器
            const resultVisualization = document.getElementById('resultVisualization');
            if (resultVisualization) {
                console.log('找到可视化容器，开始渲染测试图表');
                
                // 清空容器
                resultVisualization.innerHTML = '';
                
                // 设置样式
                resultVisualization.style.width = '100%';
                resultVisualization.style.height = '400px';
                resultVisualization.style.border = '3px solid blue';
                resultVisualization.style.background = '#f8f8f8';
                resultVisualization.style.position = 'relative';
                
                // 打印画布信息
                printCanvasElementPositions();
                
                // 获取canvas中的元素信息并转换到可视图
                const canvasElements = getCanvasElements();
                if (canvasElements.variables.length > 0) {
                    // 存在变量元素，使用它们的位置和连接渲染结果
                    renderCanvasElementsToVisualization(canvasElements, resultVisualization);
                } else {
                    // 没有找到变量元素，显示默认测试框
                    resultVisualization.innerHTML = `
                        <div style="padding:20px; width:100%; height:100%; position:relative; text-align:center;">
                            <h3 style="color:red;">没有找到Canvas中的变量元素！</h3>
                            <div style="position:absolute; left:50px; top:100px; width:100px; height:100px; background:red; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">
                                TEST BOX
                            </div>
                            <div style="position:absolute; right:50px; bottom:100px; width:100px; height:100px; background:blue; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">
                                ANOTHER BOX
                            </div>
                        </div>
                    `;
                }
                
                console.log('测试图表渲染完成');
            } else {
                console.error('找不到可视化容器');
                alert('无法找到可视化容器，请检查HTML结构');
            }
        });
        
        console.log('测试按钮事件监听已添加');
    } else {
        console.warn('找不到测试按钮');
    }
});

// 获取Canvas元素信息并返回结构化数据
function getCanvasElements() {
    console.log('获取Canvas元素信息...');
    
    const result = {
        canvas: null,
        canvasContent: null,
        transform: { scale: 1, panX: 0, panY: 0 },
        variables: [],
        connections: []
    };
    
    // 获取canvas元素
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('找不到canvas元素');
        return result;
    }
    result.canvas = canvas;
    
    // 获取canvasContent元素
    const canvasContent = document.getElementById('canvasContent');
    if (canvasContent) {
        result.canvasContent = canvasContent;
        
        // 解析transform
        const transformStyle = canvasContent.style.transform || '';
        console.log('Canvas transform:', transformStyle);
        
        // 提取缩放值
        const scaleMatch = transformStyle.match(/scale\(([^)]+)\)/);
        if (scaleMatch && scaleMatch[1]) {
            result.transform.scale = parseFloat(scaleMatch[1]) || 1;
        }
        
        // 提取平移值
        const translateMatch = transformStyle.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (translateMatch && translateMatch[1] && translateMatch[2]) {
            result.transform.panX = parseFloat(translateMatch[1]) || 0;
            result.transform.panY = parseFloat(translateMatch[2]) || 0;
        }
    }
    
    // 获取变量元素
    const variableElements = document.querySelectorAll('.variable-element');
    if (variableElements.length === 0) {
        console.warn('没有找到变量元素');
    } else {
        console.log(`找到 ${variableElements.length} 个变量元素`);
        
        variableElements.forEach(elem => {
            const elemLeft = parseFloat(elem.style.left) || 0;
            const elemTop = parseFloat(elem.style.top) || 0;
            
            result.variables.push({
                element: elem,
                id: elem.dataset.id || '未命名变量',
                property: elem.dataset.property || 'unknown',
                position: {
                    left: elemLeft,
                    top: elemTop,
                    transformedLeft: (elemLeft * result.transform.scale) + result.transform.panX,
                    transformedTop: (elemTop * result.transform.scale) + result.transform.panY
                }
            });
        });
    }
    
    // 获取连接信息 - 修改这部分代码
    const arrowSVG = document.getElementById('arrowSVG');
    if (arrowSVG) {
        const lines = arrowSVG.querySelectorAll('line');
        console.log(`找到 ${lines.length} 个连接线`);
        
        // 直接使用全局connections数组
        if (window.connections && window.connections.length > 0) {
            window.connections.forEach(conn => {
                result.connections.push({
                    sourceId: conn.source.dataset.id,
                    targetId: conn.target.dataset.id,
                    rule: conn.rule,
                    estimate: conn.lineElement.dataset.estimate
                });
                console.log('添加连接:', {
                    sourceId: conn.source.dataset.id,
                    targetId: conn.target.dataset.id,
                    rule: conn.rule
                });
            });
        } else {
            console.warn('没有找到任何连接信息');
        }
    }
    
    console.log('Canvas元素信息获取完成:', result);
    return result;
}

// 将Canvas元素渲染到可视化区域
function renderCanvasElementsToVisualization(canvasElements, container) {
    console.log('开始将Canvas元素渲染到可视化区域...');
    console.log('传入的连接数据:', canvasElements.connections);
    
    // 计算布局
    let minLeft = Infinity;
    let minTop = Infinity;
    
    canvasElements.variables.forEach(variable => {
        if (variable.position.left < minLeft) minLeft = variable.position.left;
        if (variable.position.top < minTop) minTop = variable.position.top;
    });
    
    console.log(`找到最左侧位置: ${minLeft}, 最顶部位置: ${minTop}`);
    
    // 清空容器
    container.innerHTML = '';
    
    // 设置容器样式
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    // 删除背景和边框样式，统一在CSS中定义
    
    // 节点尺寸设置
    const nodeWidth = 160;
    const nodeHeight = 35;
    
    // 先创建线条 - 确保它们在下层
    canvasElements.connections.forEach((conn, index) => {
        console.log(`准备渲染连接 #${index}: ${conn.sourceId} -> ${conn.targetId}`);
        
        // 查找对应的源和目标变量
        const sourceVar = canvasElements.variables.find(v => v.id === conn.sourceId);
        const targetVar = canvasElements.variables.find(v => v.id === conn.targetId);
        
        if (!sourceVar || !targetVar) {
            console.warn(`找不到变量: 源=${!!sourceVar}, 目标=${!!targetVar}`);
            return;
        }
        
        // 计算节点位置
        const sourceLeft = (sourceVar.position.left - minLeft) + 50;
        const sourceTop = (sourceVar.position.top - minTop) + 50;
        const targetLeft = (targetVar.position.left - minLeft) + 50;
        const targetTop = (targetVar.position.top - minTop) + 50;
        
        // 计算中心点
        const sourceX = sourceLeft + nodeWidth/2;
        const sourceY = sourceTop + nodeHeight/2;
        const targetX = targetLeft + nodeWidth/2;
        const targetY = targetTop + nodeHeight/2;
        
        console.log(`源节点中心: (${sourceX}, ${sourceY}), 目标节点中心: (${targetX}, ${targetY})`);
        
        // 计算方向向量
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        
        // 计算交点（从矩形边缘）
        let startX, startY, endX, endY;
        
        // 源节点交点计算
        if (Math.abs(dx) * nodeHeight > Math.abs(dy) * nodeWidth) {
            startX = sourceX + (dx > 0 ? nodeWidth/2 : -nodeWidth/2);
            startY = sourceY + (dy * nodeWidth/2) / Math.abs(dx);
        } else {
            startX = sourceX + (dx * nodeHeight/2) / Math.abs(dy);
            startY = sourceY + (dy > 0 ? nodeHeight/2 : -nodeHeight/2);
        }
        
        // 目标节点交点计算
        if (Math.abs(dx) * nodeHeight > Math.abs(dy) * nodeWidth) {
            endX = targetX + (dx > 0 ? -nodeWidth/2 - 6 : nodeWidth/2 + 6); // 增加偏移量，让箭头停在边框外
            endY = targetY + (-dy * nodeWidth/2) / Math.abs(dx);
        } else {
            endX = targetX + (-dx * nodeHeight/2) / Math.abs(dy);
            endY = targetY + (dy > 0 ? -nodeHeight/2 - 6 : nodeHeight/2 + 6); // 增加偏移量，让箭头停在边框外
        }
        
        console.log(`连接线 #${index} 计算结果: 起点(${startX}, ${startY}), 终点(${endX}, ${endY})`);
        
        // 计算线长和角度
        const lineDx = endX - startX;
        const lineDy = endY - startY;
        const lineLength = Math.sqrt(lineDx*lineDx + lineDy*lineDy);
        const lineAngle = Math.atan2(lineDy, lineDx) * 180 / Math.PI;
        
        // 创建线条
        const line = document.createElement('div');
        line.className = 'connection-line';
        line.style.position = 'absolute';
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.width = `${lineLength}px`;
        line.style.height = '2px';
        line.style.backgroundColor = 'black';
        line.style.transformOrigin = '0 0';
        line.style.transform = `rotate(${lineAngle}deg)`;
        container.appendChild(line);
        
        // 创建箭头
        const arrowSize = 8;
        const arrow = document.createElement('div');
        arrow.className = 'connection-arrow';
        arrow.style.position = 'absolute';
        arrow.style.left = `${endX - arrowSize * Math.cos(lineAngle * Math.PI / 180)}px`;
        arrow.style.top = `${endY - arrowSize * Math.sin(lineAngle * Math.PI / 180)}px`;
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderTop = `${arrowSize}px solid transparent`;
        arrow.style.borderBottom = `${arrowSize}px solid transparent`;
        arrow.style.borderLeft = `${arrowSize * 1.5}px solid black`;
        arrow.style.transformOrigin = '0 50%';
        arrow.style.transform = `rotate(${lineAngle}deg)`;
        container.appendChild(arrow);
        
        // 如果有系数，添加标签
        if (conn.estimate !== undefined) {
            const labelX = (startX + endX) / 2;
            const labelY = (startY + endY) / 2;
            
            const label = document.createElement('div');
            label.className = 'connection-coefficient';
            label.style.left = `${labelX}px`;
            label.style.top = `${labelY}px`;
            label.style.transform = 'translate(-50%, -50%)';
            label.style.background = 'white';
            label.style.padding = '2px 5px';
            label.style.border = '1px solid #ddd';
            label.style.borderRadius = '2px';
            label.style.fontSize = '12px';
            label.textContent = typeof conn.estimate === 'number' 
                ? conn.estimate.toFixed(3) 
                : conn.estimate;
            container.appendChild(label);
        }
    });
    
    // 然后添加节点
    canvasElements.variables.forEach((variable, index) => {
        const left = (variable.position.left - minLeft) + 50;
        const top = (variable.position.top - minTop) + 50;
        
        console.log(`渲染节点 #${index} ${variable.id} 在位置 (${left}, ${top})`);
        
        const node = document.createElement('div');
        node.className = 'visualization-node';
        node.dataset.id = variable.id;
        node.style.position = 'absolute';
        node.style.left = `${left}px`;
        node.style.top = `${top}px`;
        node.style.width = `${nodeWidth}px`;
        node.style.height = `${nodeHeight}px`;
        node.style.borderRadius = '0';
        node.style.border = '2px solid black';
        node.style.backgroundColor = 'white';
        node.style.display = 'flex';
        node.style.alignItems = 'center';
        node.style.justifyContent = 'center';
        node.style.fontWeight = '400';      // 字体粗细 (100到900)
        node.style.fontSize = '14px';       // 字体大小
        node.style.fontFamily = 'Arial';    // 字体类型
        node.style.padding = '5px';
        node.style.boxSizing = 'border-box';
        node.style.overflow = 'hidden';
        node.style.textOverflow = 'ellipsis';
        node.style.userSelect = 'none';
        node.textContent = variable.id;
        
        container.appendChild(node);
    });
    
    // 执行DOM检查
    setTimeout(() => {
        const nodes = container.querySelectorAll('.visualization-node');
        const lines = container.querySelectorAll('.connection-line');
        const arrows = container.querySelectorAll('.connection-arrow');
        const labels = container.querySelectorAll('.connection-label');
        
        console.log('DOM检查结果:', {
            容器: container,
            节点数量: nodes.length,
            线条数量: lines.length,
            箭头数量: arrows.length,
            标签数量: labels.length
        });
    }, 100);
    
    console.log('可视化渲染完成');

    // 渲染连接线和系数
    canvasElements.connections.forEach(conn => {
        const sourceNode = container.querySelector(`[data-id="${conn.sourceId}"]`);
        const targetNode = container.querySelector(`[data-id="${conn.targetId}"]`);
        
        if (sourceNode && targetNode) {
            // 计算源节点和目标节点的中心点
            const sourceCenter = getElementCenter(sourceNode);
            const targetCenter = getElementCenter(targetNode);
            
            // 计算连接点
            const sourceAnchor = getAnchorPoint(sourceNode, targetCenter);
            const targetAnchor = getAnchorPoint(targetNode, sourceCenter);

            // 创建连接线
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sourceAnchor.x);
            line.setAttribute('y1', sourceAnchor.y);
            line.setAttribute('x2', targetAnchor.x);
            line.setAttribute('y2', targetAnchor.y);
            line.setAttribute('stroke', '#000000');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('marker-end', 'url(#visualization-arrowhead)');
            svg.appendChild(line);

            // 添加系数标签
            if (conn.estimate !== undefined) {
                const labelX = (sourceAnchor.x + targetAnchor.x) / 2;
                const labelY = (sourceAnchor.y + targetAnchor.y) / 2 - 15;
                
                const label = document.createElement('div');
                label.className = 'connection-coefficient';
                label.style.position = 'absolute';
                label.style.left = `${labelX}px`;
                label.style.top = `${labelY}px`;
                label.style.transform = 'translate(-50%, -50%)';
                label.style.backgroundColor = 'white';
                label.style.padding = '2px 4px';
                label.style.borderRadius = '3px';
                label.style.fontSize = '12px';
                label.style.fontFamily = 'Arial';
                
                // 从连接对象中获取系数值
                const estimate = typeof conn.estimate === 'number' 
                    ? conn.estimate.toFixed(3) 
                    : conn.estimate;
                
                // 如果有 p 值，添加显著性标记
                let significance = '';
                if (conn.p_value) {
                    if (conn.p_value < 0.001) significance = '***';
                    else if (conn.p_value < 0.01) significance = '**';
                    else if (conn.p_value < 0.05) significance = '*';
                }
                
                label.textContent = `${estimate}${significance}`;
                container.appendChild(label);
            }
        }
    });
}

// 新增函数：打印canvas中所有元素的位置信息
function printCanvasElementPositions() {
    console.log('--------- Canvas元素位置信息 ---------');
    
    // 获取canvas元素
    const canvas = document.getElementById('canvas');
    
    if (!canvas) {
        console.error('找不到canvas元素');
        return;
    }
    
    // 获取canvas的位置和尺寸
    const canvasRect = canvas.getBoundingClientRect();
    console.log('Canvas位置和尺寸:', {
        left: canvasRect.left,
        top: canvasRect.top,
        width: canvasRect.width,
        height: canvasRect.height
    });
    
    // 获取canvasContent容器（如果存在）
    const canvasContent = document.getElementById('canvasContent');
    let scale = 1;
    let panX = 0;
    let panY = 0;
    
    if (canvasContent) {
        // 尝试从transform样式中提取平移和缩放值
        const transformStyle = canvasContent.style.transform || '';
        console.log('Canvas内容transform样式:', transformStyle);
        
        // 提取缩放值（如果存在）
        const scaleMatch = transformStyle.match(/scale\(([^)]+)\)/);
        if (scaleMatch && scaleMatch[1]) {
            scale = parseFloat(scaleMatch[1]) || 1;
        }
        
        // 提取平移值（如果存在）
        const translateMatch = transformStyle.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (translateMatch && translateMatch[1] && translateMatch[2]) {
            panX = parseFloat(translateMatch[1]) || 0;
            panY = parseFloat(translateMatch[2]) || 0;
        }
        
        console.log('Canvas内容变换参数:', { scale, panX, panY });
    }
    
    // 获取所有变量元素
    const variableElements = document.querySelectorAll('.variable-element');
    
    if (variableElements.length === 0) {
        console.log('没有找到任何变量元素 (.variable-element)');
    } else {
        console.log(`找到 ${variableElements.length} 个变量元素:`);
        
        variableElements.forEach((elem, index) => {
            const elemRect = elem.getBoundingClientRect();
            const elemLeft = parseFloat(elem.style.left) || 0;
            const elemTop = parseFloat(elem.style.top) || 0;
            
            // 计算相对于画布的位置（考虑平移和缩放）
            const canvasRelativeX = (elemLeft * scale) + panX;
            const canvasRelativeY = (elemTop * scale) + panY;
            
            console.log(`变量元素 #${index + 1}:`, {
                id: elem.dataset.id || '未知ID',
                property: elem.dataset.property || '未知类型',
                absolutePosition: {
                    left: elemRect.left,
                    top: elemRect.top,
                    width: elemRect.width,
                    height: elemRect.height
                },
                stylePosition: {
                    left: elemLeft,
                    top: elemTop
                },
                canvasPosition: {
                    x: canvasRelativeX,
                    y: canvasRelativeY
                },
                originalPosition: {
                    x: elemLeft,
                    y: elemTop
                }
            });
        });
    }
    
    // 附加打印连接信息
    if (window.connections && window.connections.length > 0) {
        console.log(`找到 ${window.connections.length} 个连接:`);
        window.connections.forEach((conn, index) => {
            console.log(`连接 #${index + 1}:`, {
                key: conn.key,
                sourceId: conn.source.dataset.id,
                targetId: conn.target.dataset.id,
                rule: conn.rule
            });
        });
    } else {
        console.log('没有找到任何连接');
    }
    
    console.log('--------- 位置信息打印完成 ---------');
}


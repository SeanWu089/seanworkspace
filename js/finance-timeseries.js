document.addEventListener('DOMContentLoaded', function() {
    // 获取URL参数中的模型类型
    const urlParams = new URLSearchParams(window.location.search);
    const modelType = urlParams.get('model');

    // 获取必要的DOM元素
    const modelSelect = document.getElementById('modelSelect');
    const modelInfos = {
        arima: document.getElementById('arimaDesc'),
        garch: document.getElementById('garchDesc'),
        ewma: document.getElementById('ewmaDesc')
    };

    // 如果URL中包含模型参数，自动选择相应的模型
    if (modelType) {
        modelSelect.value = modelType;
        showModelDescription(modelType);
    }

    // 监听模型选择变化
    modelSelect.addEventListener('change', function(e) {
        const selectedModel = e.target.value;
        showModelDescription(selectedModel);
        
        // 更新URL，不刷新页面
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('model', selectedModel);
        window.history.pushState({}, '', newUrl);
    });

    // 显示选中模型的描述
    function showModelDescription(modelType) {
        // 隐藏所有模型描述
        Object.values(modelInfos).forEach(info => {
            if (info) info.classList.add('hidden');
        });

        // 显示选中的模型描述
        if (modelType && modelInfos[modelType]) {
            modelInfos[modelType].classList.remove('hidden');
        }
    }

    // 初始化侧边栏
    if (typeof initializeSidebars === 'function') {
        initializeSidebars();
    }
}); 
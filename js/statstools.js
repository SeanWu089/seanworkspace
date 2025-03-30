document.addEventListener('DOMContentLoaded', function () {
  // 初始化函数 - 在页面加载完成后检查关键元素
  document.addEventListener('DOMContentLoaded', function() {
    console.log('页面初始化完成');
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
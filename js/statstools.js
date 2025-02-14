document.addEventListener('DOMContentLoaded', function () {
  const previewData = localStorage.getItem('previewData');
  if (previewData) {
    const columns = JSON.parse(previewData);
    const rightSidebar = document.getElementById('rightSidebar');
    // rightSidebar.classList.add('show');
    
    // const rightToggle = document.getElementById('rightToggle');
    // rightToggle.style.transform = 'rotate(180deg)';
    // rightToggle.style.right = '190px'; 

    const tbody = document.querySelector('#preview-table tbody');
    tbody.innerHTML = columns.map(col =>
      `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
    ).join('');
  }

  /** ========================== 左侧侧边栏 ========================== */
  const leftSidebar = document.getElementById('leftSidebar');
  const leftToggle = document.getElementById('leftToggle');

  if (leftToggle && leftSidebar) {
    leftToggle.addEventListener('click', () => {
      leftSidebar.classList.toggle('show');

      if (leftSidebar.classList.contains('show')) {
        leftToggle.style.transform = 'rotate(180deg)';
        leftToggle.style.left = '280px'; 
      } else {
        // 边栏收回：复位旋转和位置
        leftToggle.style.transform = 'rotate(0deg)';
        leftToggle.style.left = '5px';
      }
    });
  }

  /** ========================== 右侧侧边栏 ========================== */
  const rightSidebar = document.getElementById('rightSidebar');
  const rightToggle = document.getElementById('rightToggle');

  if (rightToggle && rightSidebar) {
    rightToggle.addEventListener('click', () => {
      rightSidebar.classList.toggle('show');

      if (rightSidebar.classList.contains('show')) {
        rightToggle.style.transform = 'rotate(180deg)';
        rightToggle.style.right = '180px'; // 右侧边栏展开时的位置
      } else {
        // 边栏收回：复位旋转和位置
        rightToggle.style.transform = 'rotate(0deg)';
        rightToggle.style.right = '5px';
      }
    });
  }

  /** ========================== 上传文件 ========================== */
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
});

/** ========================== 上传文件到后端 ========================== */
function uploadFileToBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  const uploadBtn = document.getElementById('uploadBtn');
  uploadBtn.innerText = 'Uploading...';
  uploadBtn.disabled = true;

  fetch('https://seanholisticworkspace-production.up.railway.app/upload', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      console.log('Upload success:', data);
      if (data.columns) {
        // 保存预览数据到 Local Storage
        localStorage.setItem('previewData', JSON.stringify(data.columns));

        const tbody = document.querySelector('#preview-table tbody');
        tbody.innerHTML = data.columns.map(col =>
          `<tr><td>${col.name}</td><td>${col.type}</td></tr>`
        ).join('');
      }
    })
    .catch(err => console.error('Upload failed:', err))
    .finally(() => {
      uploadBtn.innerText = 'Upload File';
      uploadBtn.disabled = false;
    });
}

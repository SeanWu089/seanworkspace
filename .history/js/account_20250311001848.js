/**
 * Account Page JavaScript
 * Manages user account functionality and UI interactions
 */

// Session management
let sessionRefreshTimer;

// DOM Elements cache
const elements = {
  userEmail: document.getElementById('user-email'),
  membershipStatus: document.getElementById('membership-status'),
  logoutBtn: document.getElementById('logout-btn'),
  projectsGrid: document.getElementById('projects-grid'),
  filesList: document.getElementById('files-list')
};

/**
 * Session Management Functions
 */
async function refreshSession() {
  try {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (error || !session) {
      console.error('Session refresh failed:', error);
      redirectToHome();
      return;
    }
    // Schedule next refresh (every 9 minutes to stay within 10-minute limit)
    sessionRefreshTimer = setTimeout(refreshSession, 9 * 60 * 1000);
  } catch (e) {
    console.error('Session refresh exception:', e);
    redirectToHome();
  }
}

async function checkSession() {
  try {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (error || !session) {
      redirectToHome();
      return false;
    }
    return true;
  } catch (e) {
    console.error('Check session exception:', e);
    redirectToHome();
    return false;
  }
}

function redirectToHome() {
  window.location.href = './index.html';
}

/**
 * User Authentication Functions
 */
window.handleLogout = async function() {
  console.log("Logout function called");
  try {
    if (!window.supabaseClient) {
      console.error("Supabase client not initialized");
      alert("System initialization failed, please refresh the page");
      return;
    }
    
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) {
      console.error("Logout API error:", error);
      throw error;
    }
    
    console.log("Logout successful, preparing to redirect");
    // Clear session data from local storage
    localStorage.removeItem('sessionStartTime');
    
    // Redirect to home page after successful logout
    redirectToHome();
  } catch (error) {
    console.error('Logout error:', error);
    alert('Failed to log out. Please try again.');
  }
};

/**
 * UI Update Functions
 */
function updateUserInfo(user) {
  if (elements.userEmail) {
    elements.userEmail.textContent = user.email;
  }
  
  if (elements.membershipStatus) {
    if (user.is_paid_member) {
      elements.membershipStatus.textContent = `Member since: ${new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`;
      elements.membershipStatus.classList.remove('free');
      elements.membershipStatus.classList.add('pro');
    } else {
      elements.membershipStatus.textContent = 'Free Member';
      elements.membershipStatus.classList.add('free');
      elements.membershipStatus.classList.remove('pro');
    }
  }
}

/**
 * Event Handlers and Initializers
 */
function initLogout() {
  console.log("Initializing logout functionality");
  if (elements.logoutBtn) {
    elements.logoutBtn.onclick = window.handleLogout;
    console.log("Logout button event listener added");
  } else {
    console.error("Logout button element not found");
  }
}

/**
 * Project Management Functions
 */
function loadUserProjects() {
  if (!elements.projectsGrid) return;

  const colors = ['blue', 'orange', 'pink', 'purple', 'green', 'red'];
  
  try {
    const projects = [
      { name: 'Data Analysis 1', description: 'Statistical analysis project', date: '2024-01-15' },
      { name: 'Visualization Study', description: 'Data visualization project', date: '2024-01-10' },
      { name: 'Research Project', description: 'Academic research data', date: '2024-01-05' }
    ];

    elements.projectsGrid.innerHTML = projects.map(project => `
      <div class="project-card blue" data-colors='${JSON.stringify(colors)}'>
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <div class="project-date">Last modified: ${project.date}</div>
      </div>
    `).join('');

    // Add click event handlers
    const projectCards = elements.projectsGrid.querySelectorAll('.project-card');
    projectCards.forEach(card => {
      // Single click to toggle color
      card.addEventListener('click', function(e) {
        const colors = JSON.parse(this.dataset.colors);
        const currentColor = colors.find(color => this.classList.contains(color));
        const currentIndex = colors.indexOf(currentColor);
        const nextIndex = (currentIndex + 1) % colors.length;
        
        // Remove current color
        this.classList.remove(currentColor);
        // Add next color
        this.classList.add(colors[nextIndex]);
      });

      // Double click to open project
      card.addEventListener('dblclick', function(e) {
        // TODO: Implement project opening logic
        console.log('Opening project:', this.querySelector('h3').textContent);
      });
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    elements.projectsGrid.innerHTML = '<p>Failed to load projects</p>';
  }
}

/**
 * File Management Functions
 */
async function loadUserFiles() {
  if (!elements.filesList) return;

  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data: files, error } = await window.supabaseClient
      .storage
      .from('user_files')
      .list(user.id);

    if (error) throw error;

    if (!files || files.length === 0) {
      elements.filesList.innerHTML = '<p class="text-center text-gray-500">No files uploaded yet</p>';
      return;
    }

    elements.filesList.innerHTML = files.map(file => {
      // Extract original filename from storage path
      const originalName = file.name.split('_').slice(1).join('_');
      const fileExt = originalName.split('.').pop().toLowerCase();
      
      // Get file icon
      const iconClass = getFileIconClass(fileExt);
      
      return `
        <div class="file-item">
          <div class="file-info">
            <i class="fas ${iconClass} file-icon"></i>
            <div class="file-details">
              <span class="file-name">${originalName}</span>
              <span class="file-meta">
                ${formatFileSize(file.metadata?.size || 0)} • ${formatDate(file.created_at)}
              </span>
            </div>
          </div>
          <div class="file-actions">
            <button class="file-action-btn download" onclick="downloadFile('${user.id}/${file.name}')" title="Download">
              <i class="fas fa-download"></i>
            </button>
            <button class="file-action-btn delete" onclick="deleteFile('${user.id}/${file.name}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading files:', error);
    elements.filesList.innerHTML = '<p class="text-center text-red-500">Failed to load files</p>';
  }
}

/**
 * Utility Functions
 */
function getFileIconClass(ext) {
  const iconMap = {
    'csv': 'fa-file-csv',
    'xlsx': 'fa-file-excel',
    'xls': 'fa-file-excel',
    'pdf': 'fa-file-pdf',
    'docx': 'fa-file-word',
    'doc': 'fa-file-word',
    'pptx': 'fa-file-powerpoint',
    'ppt': 'fa-file-powerpoint',
    'json': 'fa-file-code'
  };
  return iconMap[ext] || 'fa-file';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  // Other cases show specific date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * File Operation Functions
 */
window.downloadFile = async function(path) {
  try {
    const { data, error } = await window.supabaseClient
      .storage
      .from('user_files')
      .download(path);

    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop().split('_').slice(1).join('_'); // Use original filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Failed to download file');
  }
};

window.deleteFile = async function(path) {
  if (!confirm('Are you sure you want to delete this file?')) return;

  try {
    const { error } = await window.supabaseClient
      .storage
      .from('user_files')
      .remove([path]);

    if (error) throw error;

    // Reload file list
    loadUserFiles();
  } catch (error) {
    console.error('Error deleting file:', error);
    alert('Failed to delete file');
  }
};

/**
 * Page Initialization
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log("Page loaded");
  
  // Check if Supabase client is available
  if (!window.supabaseClient) {
    console.error("Supabase client not initialized");
    alert("System initialization failed, please refresh the page");
    return;
  }
  
  console.log("Supabase client initialized");
  
  // First check session status
  if (!await checkSession()) {
    return;
  }

  // Get current user information
  const { data: { user }, error } = await window.supabaseClient.auth.getUser();
  
  if (error || !user) {
    redirectToHome();
    return;
  }

  // Start session refresh mechanism
  refreshSession();

  // Update user information
  updateUserInfo(user);
  
  // Initialize page functionality
  initLogout();
  loadUserProjects();
  loadUserFiles();
}); 
/**
 * Main App Initialization
 * Initialize all managers and setup global event handlers
 */

// App state
const app = {
  initialized: false,
  version: '1.0.0',
  mode: 'production'
};

/**
 * Initialize application
 */
async function initApp() {
  if (app.initialized) return;

  try {
    console.log('🏀 Initializing Hoopin\' Basketball Team Management...');

    // Initialize Firebase
    initializeFirebase();

    // Initialize DB Manager (will init IndexedDB)
    await dbManager.init();

    // Register service worker for offline support
    if ('serviceWorker' in navigator && app.mode === 'production') {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }

    // Setup global error handler
    window.addEventListener('error', (event) => {
      console.error('💥 Global error:', event.error);
      showToast('An error occurred. Please try again.', 'error');
    });

    // Setup unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('💥 Unhandled promise rejection:', event.reason);
      showToast('An error occurred. Please try again.', 'error');
    });

    // Setup beforeunload to warn about unsaved changes
    window.addEventListener('beforeunload', (event) => {
      if (hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    });

    // Setup visibility change handler for sync
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && navigator.onLine) {
        console.log('👀 Page visible - checking for sync...');
        await dbManager.syncPendingChanges();
      }
    });

    // Setup page load performance tracking
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Page load time: ${pageLoadTime}ms`);
      });
    }

    app.initialized = true;
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    showToast('Failed to initialize app. Please refresh the page.', 'error');
  }
}

/**
 * Check if there are unsaved changes
 */
function hasUnsavedChanges() {
  // Check for draft data in session storage
  const draftKeys = ['playerDraft', 'teamDraft'];
  return draftKeys.some(key => session.get(key) !== null);
}

/**
 * Navigate to page with group context
 */
function navigateToPage(page, params = {}) {
  const currentGroup = groupManager.getCurrentGroup();
  
  if (currentGroup && !params.groupId) {
    params.groupId = currentGroup.groupId;
  }

  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${page}?${queryString}` : page;
  
  window.location.href = url;
}

/**
 * Check group access and redirect if needed
 */
function checkGroupAccess(redirectTo = 'index.html') {
  const currentGroup = groupManager.getCurrentGroup();
  
  if (!currentGroup) {
    showToast('Please join or create a group first', 'info');
    navigateToPage(redirectTo);
    return false;
  }
  
  return true;
}

/**
 * Setup common page elements
 */
function setupCommonElements() {
  // Setup back buttons
  const backButtons = document.querySelectorAll('[data-action="back"]');
  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigateToPage('dashboard.html');
      }
    });
  });

  // Setup home buttons
  const homeButtons = document.querySelectorAll('[data-action="home"]');
  homeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToPage('dashboard.html');
    });
  });

  // Setup logout buttons
  const logoutButtons = document.querySelectorAll('[data-action="logout"]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to leave this group?')) {
        groupManager.clearCurrentGroup();
        navigateToPage('index.html');
      }
    });
  });

  // Setup current group display
  const groupDisplays = document.querySelectorAll('[data-display="group-name"]');
  const currentGroup = groupManager.getCurrentGroup();
  if (currentGroup) {
    groupDisplays.forEach(el => {
      el.textContent = currentGroup.groupName;
    });
  }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get relative time string
 */
function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(timestamp);
}

/**
 * Create empty state HTML
 */
function createEmptyState(icon, title, message, actionButton = null) {
  let html = `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
  `;
  
  if (actionButton) {
    html += `<button class="btn btn-primary" onclick="${actionButton.action}">${actionButton.text}</button>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Setup image upload preview
 */
function setupImageUpload(inputId, previewId, callback) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!input || !preview) return;
  
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    
    try {
      showLoading('Compressing image...');
      const compressed = await imageOptimizer.compressImage(file);
      hideLoading();
      
      preview.src = compressed;
      preview.style.display = 'block';
      
      if (callback) {
        callback(compressed);
      }
      
      const size = imageOptimizer.getImageSize(compressed);
      console.log(`📷 Image compressed: ${size}`);
    } catch (error) {
      hideLoading();
      console.error('Image upload error:', error);
      showToast('Failed to process image', 'error');
    }
  });
}

/**
 * Confirm dialog
 */
function confirmDialog(message, onConfirm, onCancel = null) {
  if (confirm(message)) {
    onConfirm();
  } else if (onCancel) {
    onCancel();
  }
}

/**
 * Export data (for backup)
 */
async function exportData() {
  try {
    const groups = await dbManager.getAll('groups');
    const teams = await dbManager.getAll('teams');
    const players = await dbManager.getAll('players');
    
    const data = {
      version: app.version,
      exportDate: Date.now(),
      groups,
      teams,
      players
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoopin-backup-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Failed to export data', 'error');
  }
}

/**
 * Import data (from backup)
 */
async function importData(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.version || !data.groups || !data.teams || !data.players) {
      throw new Error('Invalid backup file format');
    }
    
    if (confirm('This will replace all current data. Continue?')) {
      showLoading('Importing data...');
      
      // Import all data
      for (const group of data.groups) {
        await dbManager.save('groups', group.groupId, group);
      }
      for (const team of data.teams) {
        await dbManager.save('teams', team.teamId, team);
      }
      for (const player of data.players) {
        await dbManager.save('players', player.playerId, player);
      }
      
      hideLoading();
      showToast('Data imported successfully', 'success');
      
      setTimeout(() => window.location.reload(), 1000);
    }
  } catch (error) {
    hideLoading();
    console.error('Import error:', error);
    showToast('Failed to import data', 'error');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Make functions globally available
window.app = app;
window.initApp = initApp;
window.navigateToPage = navigateToPage;
window.checkGroupAccess = checkGroupAccess;
window.setupCommonElements = setupCommonElements;
window.formatNumber = formatNumber;
window.getRelativeTime = getRelativeTime;
window.createEmptyState = createEmptyState;
window.setupImageUpload = setupImageUpload;
window.confirmDialog = confirmDialog;
window.exportData = exportData;
window.importData = importData;

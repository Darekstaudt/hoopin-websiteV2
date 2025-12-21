/**
 * Utility Functions
 * Helper functions used across the application
 */

// Generate unique IDs with timestamp and random string
function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${random}`;
}

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Format date to readable string
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Debounce function for auto-save
function debounce(func, wait = 1000) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Show loading spinner
function showLoading(message = 'Loading...') {
  const existingLoader = document.querySelector('.loading-overlay');
  if (existingLoader) return;

  const loader = document.createElement('div');
  loader.className = 'loading-overlay';
  loader.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(loader);
}

// Hide loading spinner
function hideLoading() {
  const loader = document.querySelector('.loading-overlay');
  if (loader) {
    loader.remove();
  }
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Validate required fields
function validateForm(formData, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
      errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Deep clone object
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

// Safe JSON parse
function safeJSONParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
}

// Get query parameters
function getQueryParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

// Set query parameter
function setQueryParam(key, value) {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.pushState({}, '', url);
}

// Remove query parameter
function removeQueryParam(key) {
  const url = new URL(window.location);
  url.searchParams.delete(key);
  window.history.pushState({}, '', url);
}

// Check if device is mobile
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if device is iOS
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy', 'error');
    return false;
  }
}

// Share data using Web Share API
async function shareData(data) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
      }
      return false;
    }
  } else {
    // Fallback to copy
    if (data.url) {
      return await copyToClipboard(data.url);
    } else if (data.text) {
      return await copyToClipboard(data.text);
    }
    return false;
  }
}

// Local storage helpers with error handling
const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('localStorage set error:', e);
      return false;
    }
  },
  
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error('localStorage get error:', e);
      return fallback;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('localStorage remove error:', e);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('localStorage clear error:', e);
      return false;
    }
  }
};

// Session storage helpers
const session = {
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('sessionStorage set error:', e);
      return false;
    }
  },
  
  get(key, fallback = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error('sessionStorage get error:', e);
      return fallback;
    }
  },
  
  remove(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('sessionStorage remove error:', e);
      return false;
    }
  }
};

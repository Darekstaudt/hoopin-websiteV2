/**
 * Utility Functions
 * Helper functions used throughout the application
 */

const Utils = {
  /**
   * Generate unique ID with timestamp and random component
   * @param {string} prefix - Prefix for the ID (e.g., 'group', 'team', 'player')
   * @returns {string} Unique ID
   */
  generateId(prefix = 'id') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${random}`;
  },

  /**
   * Format date to readable string
   * @param {number|string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const d = new Date(date);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return d.toLocaleDateString('en-US', options);
  },

  /**
   * Format date to short string (date only)
   * @param {number|string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDateShort(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  },

  /**
   * Debounce function to limit execution rate
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 1000) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Hash password using SHA-256
   * @param {string} password - Password to hash
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result with isValid and message
   */
  validatePassword(password) {
    if (!password || password.length < 4) {
      return { isValid: false, message: 'Password must be at least 4 characters' };
    }
    return { isValid: true, message: 'Password is valid' };
  },

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, info, warning)
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      max-width: 90%;
      text-align: center;
      transition: transform 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Remove after duration
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show loading spinner
   * @param {string} message - Loading message
   * @returns {HTMLElement} Spinner element
   */
  showLoading(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(11, 30, 45, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;
    
    document.body.appendChild(loader);
    return loader;
  },

  /**
   * Hide loading spinner
   */
  hideLoading() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
      loader.remove();
    }
  },

  /**
   * Get query parameter from URL
   * @param {string} param - Parameter name
   * @returns {string|null} Parameter value
   */
  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Set query parameter in URL without reload
   * @param {string} param - Parameter name
   * @param {string} value - Parameter value
   */
  setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },

  /**
   * Navigate to page
   * @param {string} page - Page URL
   * @param {object} params - Query parameters
   */
  navigate(page, params = {}) {
    const url = new URL(page, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    window.location.href = url.toString();
  },

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Deep clone object
   * @param {object} obj - Object to clone
   * @returns {object} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Check if device is mobile
   * @returns {boolean} Is mobile device
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Check if app is online
   * @returns {boolean} Is online
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
};

// Make Utils available globally
window.Utils = Utils;

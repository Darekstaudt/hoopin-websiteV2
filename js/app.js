/**
 * Main Application Initialization
 * Initializes the Hoopin' Basketball Team Management App
 */

const App = {
  /**
   * App version
   */
  version: '1.0.0',

  /**
   * Initialize the application
   */
  async init() {
    console.log(`🏀 Hoopin' App v${this.version} - Initializing...`);

    try {
      // Initialize database manager
      await DBManager.init();

      // Register service worker for offline support
      this.registerServiceWorker();

      // Setup global error handler
      this.setupErrorHandler();

      // Log performance metrics
      Performance.logPerformanceMetrics();

      // Check online status
      this.updateOnlineStatus();

      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      Utils.showToast('App initialization failed', 'error');
    }
  },

  /**
   * Register service worker
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('✅ Service Worker registered:', registration.scope);
          })
          .catch(error => {
            console.warn('⚠️ Service Worker registration failed:', error);
          });
      });
    } else {
      console.warn('⚠️ Service Worker not supported');
    }
  },

  /**
   * Setup global error handler
   */
  setupErrorHandler() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  },

  /**
   * Update online status indicator
   */
  updateOnlineStatus() {
    const updateStatus = () => {
      const isOnline = Utils.isOnline();
      document.body.classList.toggle('offline', !isOnline);
      
      // Update any status indicators
      const statusIndicators = document.querySelectorAll('.online-status');
      statusIndicators.forEach(indicator => {
        indicator.textContent = isOnline ? '🌐 Online' : '📴 Offline';
        indicator.classList.toggle('online', isOnline);
        indicator.classList.toggle('offline', !isOnline);
      });
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  },

  /**
   * Check if user is authenticated (has group)
   * @returns {boolean} Is authenticated
   */
  isAuthenticated() {
    const groupId = Groups.getCurrentGroupId();
    return groupId !== null;
  },

  /**
   * Require authentication (redirect if not authenticated)
   * @param {string} redirectUrl - URL to redirect to if not authenticated
   */
  requireAuth(redirectUrl = 'index.html') {
    if (!this.isAuthenticated()) {
      Utils.navigate(redirectUrl);
      return false;
    }
    return true;
  },

  /**
   * Logout (clear current group)
   */
  logout() {
    Groups.clearCurrentGroup();
    Teams.clearCurrentTeam();
    Utils.navigate('index.html');
  },

  /**
   * Setup common page elements
   */
  setupCommonElements() {
    // Setup back buttons
    const backButtons = document.querySelectorAll('[data-back]');
    backButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const target = button.dataset.back;
        if (target === 'history') {
          window.history.back();
        } else {
          Utils.navigate(target);
        }
      });
    });

    // Setup logout buttons
    const logoutButtons = document.querySelectorAll('[data-logout]');
    logoutButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          this.logout();
        }
      });
    });

    // Setup group name display
    this.updateGroupNameDisplay();
  },

  /**
   * Update group name in header
   */
  async updateGroupNameDisplay() {
    const groupNameElements = document.querySelectorAll('[data-group-name]');
    
    if (groupNameElements.length > 0) {
      const group = await Groups.getCurrentGroup();
      if (group) {
        groupNameElements.forEach(element => {
          element.textContent = group.groupName;
        });
      }
    }
  },

  /**
   * Setup form validation
   * @param {HTMLFormElement} form - Form element
   * @param {Function} onSubmit - Submit handler
   */
  setupForm(form, onSubmit) {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Disable submit button
      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
      }

      try {
        await onSubmit(data);
      } catch (error) {
        console.error('Form submission error:', error);
        Utils.showToast(error.message || 'An error occurred', 'error');
      } finally {
        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText;
        }
      }
    });
  },

  /**
   * Setup auto-save for form
   * @param {HTMLFormElement} form - Form element
   * @param {string} draftKey - Draft key for storage
   */
  setupAutoSave(form, draftKey) {
    if (!form) return;

    // Load draft on page load
    const draft = Players.loadDraft(draftKey);
    if (draft && confirm('Resume previous draft?')) {
      Object.keys(draft).forEach(key => {
        const input = form.elements[key];
        if (input && draft[key] !== undefined) {
          input.value = draft[key];
          
          // Trigger change event to update any dependent UI
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    // Save draft on input changes (debounced)
    const saveDraft = Utils.debounce(() => {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      Players.saveDraft(draftKey, data);
    }, 1000);

    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);

    // Clear draft on successful submit
    form.addEventListener('submit', () => {
      setTimeout(() => {
        Players.clearDraft(draftKey);
      }, 100);
    });
  },

  /**
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @returns {boolean} User confirmed
   */
  confirm(message) {
    return window.confirm(message);
  },

  /**
   * Get app info
   * @returns {object} App information
   */
  getInfo() {
    return {
      name: 'Hoopin\' Basketball Team Management',
      version: this.version,
      online: Utils.isOnline(),
      authenticated: this.isAuthenticated(),
      currentGroup: Groups.getCurrentGroupId(),
      currentTeam: Teams.getCurrentTeamId()
    };
  },

  /**
   * Debug info (for development)
   */
  async debug() {
    console.log('🐛 Debug Info:');
    console.log('App Info:', this.getInfo());
    console.log('Groups:', await Groups.getAll());
    console.log('Teams:', await Teams.getAll());
    console.log('Players:', await Players.getAll());
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    // Setup common elements if on a page with them
    if (document.querySelector('[data-back]') || 
        document.querySelector('[data-logout]') || 
        document.querySelector('[data-group-name]')) {
      App.setupCommonElements();
    }
  });
} else {
  App.init();
  App.setupCommonElements();
}

// Make App available globally
window.App = App;

// Export for debugging
window.debug = () => App.debug();

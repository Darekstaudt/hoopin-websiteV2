/**
 * Performance Optimization Utilities
 * Tools for improving app performance
 */

const Performance = {
  /**
   * Create skeleton loading screen
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of skeleton items
   * @param {string} type - Type of skeleton (card, list, form)
   */
  showSkeleton(container, count = 3, type = 'card') {
    if (!container) return;

    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type}`;
      
      if (type === 'card') {
        skeleton.innerHTML = `
          <div class="skeleton-image"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        `;
      } else if (type === 'list') {
        skeleton.innerHTML = `
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        `;
      } else if (type === 'form') {
        skeleton.innerHTML = `
          <div class="skeleton-label"></div>
          <div class="skeleton-input"></div>
        `;
      }
      
      container.appendChild(skeleton);
    }
  },

  /**
   * Lazy load images
   * @param {string} selector - CSS selector for images
   */
  lazyLoadImages(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach(img => {
        img.src = img.dataset.src;
      });
    }
  },

  /**
   * Preload critical resources
   * @param {Array<string>} urls - URLs to preload
   */
  preloadResources(urls) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (url.endsWith('.css')) {
        link.as = 'style';
      } else if (url.endsWith('.js')) {
        link.as = 'script';
      } else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        link.as = 'image';
      }
      
      link.href = url;
      document.head.appendChild(link);
    });
  },

  /**
   * Measure performance timing
   * @param {string} name - Performance mark name
   */
  mark(name) {
    if ('performance' in window && window.performance.mark) {
      window.performance.mark(name);
    }
  },

  /**
   * Measure time between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure(name, startMark, endMark) {
    if ('performance' in window && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    return null;
  },

  /**
   * Request animation frame with fallback
   * @param {Function} callback - Callback function
   */
  raf(callback) {
    if ('requestAnimationFrame' in window) {
      return window.requestAnimationFrame(callback);
    }
    return setTimeout(callback, 16); // ~60fps
  },

  /**
   * Cancel animation frame with fallback
   * @param {number} id - Animation frame ID
   */
  cancelRaf(id) {
    if ('cancelAnimationFrame' in window) {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  },

  /**
   * Batch DOM updates
   * @param {Function} callback - Callback with DOM updates
   */
  batchDOMUpdates(callback) {
    this.raf(() => {
      callback();
    });
  },

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Add smooth scroll behavior
   * @param {string} selector - Selector for scroll containers
   */
  enableSmoothScroll(selector = '.scroll-container') {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
      container.style.scrollBehavior = 'smooth';
      container.style.webkitOverflowScrolling = 'touch'; // iOS momentum scrolling
    });
  },

  /**
   * Add snap scrolling
   * @param {string} selector - Selector for scroll containers
   */
  enableSnapScroll(selector = '.snap-scroll') {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
      container.style.scrollSnapType = 'x mandatory';
      
      const children = container.children;
      Array.from(children).forEach(child => {
        child.style.scrollSnapAlign = 'start';
      });
    });
  },

  /**
   * Monitor and log performance metrics
   */
  logPerformanceMetrics() {
    if ('performance' in window && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
          const firstPaint = timing.responseEnd - timing.requestStart;

          console.log(`📊 Performance Metrics:`);
          console.log(`   Page Load: ${loadTime}ms`);
          console.log(`   DOM Ready: ${domReady}ms`);
          console.log(`   First Paint: ${firstPaint}ms`);
        }, 0);
      });
    }
  },

  /**
   * Enable hardware acceleration for element
   * @param {HTMLElement} element - Element to accelerate
   */
  enableHardwareAcceleration(element) {
    if (!element) return;
    
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform';
  },

  /**
   * Disable hardware acceleration
   * @param {HTMLElement} element - Element
   */
  disableHardwareAcceleration(element) {
    if (!element) return;
    
    element.style.transform = '';
    element.style.willChange = '';
  }
};

// Initialize performance monitoring
Performance.logPerformanceMetrics();

// Make Performance available globally
window.Performance = Performance;

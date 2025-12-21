/**
 * Performance Optimization Utilities
 * GPU-accelerated animations, lazy loading, and performance monitoring
 */

class PerformanceManager {
  constructor() {
    this.observers = {};
    this.metrics = {};
    this.init();
  }

  init() {
    // Monitor performance metrics
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }

    // Setup intersection observer for lazy loading
    this.setupIntersectionObserver();
  }

  /**
   * Setup performance observer for monitoring
   */
  setupPerformanceObserver() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics[entry.name] = entry.duration;
        }
      });
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (e) {
      console.warn('Performance observer not supported');
    }
  }

  /**
   * Setup intersection observer for lazy loading images
   */
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers
      this.loadAllImages();
      return;
    }

    this.observers.images = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observers.images.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }

  /**
   * Lazy load image
   */
  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    }
  }

  /**
   * Observe images for lazy loading
   */
  observeImages(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    images.forEach((img) => {
      if (this.observers.images) {
        this.observers.images.observe(img);
      } else {
        this.loadImage(img);
      }
    });
  }

  /**
   * Load all images immediately (fallback)
   */
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => this.loadImage(img));
  }

  /**
   * Request animation frame with fallback
   */
  requestAnimFrame(callback) {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      }
    )(callback);
  }

  /**
   * Enable GPU acceleration for element
   */
  enableGPUAcceleration(element) {
    if (element) {
      element.style.transform = 'translateZ(0)';
      element.style.willChange = 'transform';
    }
  }

  /**
   * Disable GPU acceleration
   */
  disableGPUAcceleration(element) {
    if (element) {
      element.style.transform = '';
      element.style.willChange = '';
    }
  }

  /**
   * Smooth scroll to element
   */
  smoothScrollTo(element, offset = 0) {
    if (!element) return;

    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Create skeleton loader
   */
  createSkeletonLoader(container, count = 3) {
    if (!container) return;

    container.innerHTML = '';
    container.classList.add('skeleton-container');

    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-card';
      skeleton.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      `;
      container.appendChild(skeleton);
    }
  }

  /**
   * Remove skeleton loaders
   */
  removeSkeletonLoader(container) {
    if (!container) return;
    container.classList.remove('skeleton-container');
    const skeletons = container.querySelectorAll('.skeleton-card');
    skeletons.forEach((skeleton) => skeleton.remove());
  }

  /**
   * Prefetch resource
   */
  prefetch(url, as = 'fetch') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = as;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Preload resource
   */
  preload(url, as = 'fetch') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Measure function execution time
   */
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    this.metrics[name] = duration;
    
    return result;
  }

  /**
   * Async measure performance
   */
  async measurePerformanceAsync(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    this.metrics[name] = duration;
    
    return result;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics = {};
  }

  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Apply animation with reduced motion check
   */
  applyAnimation(element, animationClass, duration = 300) {
    if (!element) return;

    if (this.prefersReducedMotion()) {
      // Skip animation
      return;
    }

    element.classList.add(animationClass);
    
    setTimeout(() => {
      element.classList.remove(animationClass);
    }, duration);
  }

  /**
   * Virtual scroll helper for large lists
   */
  setupVirtualScroll(container, items, renderItem, itemHeight = 100) {
    if (!container || !items.length) return;

    const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    let scrollTop = 0;

    const render = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems, items.length);

      container.innerHTML = '';
      container.style.height = `${items.length * itemHeight}px`;
      container.style.position = 'relative';

      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        item.style.position = 'absolute';
        item.style.top = `${i * itemHeight}px`;
        item.style.height = `${itemHeight}px`;
        container.appendChild(item);
      }
    };

    container.addEventListener('scroll', throttle(() => {
      scrollTop = container.scrollTop;
      render();
    }, 100));

    render();
  }

  /**
   * Batch DOM updates
   */
  batchDOMUpdates(updates) {
    requestAnimationFrame(() => {
      updates.forEach((update) => update());
    });
  }

  /**
   * Optimize touch events
   */
  optimizeTouchEvents() {
    // Add passive event listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

  /**
   * Check connection speed
   */
  getConnectionSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
    }
    return 'unknown';
  }

  /**
   * Check if device has good connection
   */
  hasGoodConnection() {
    const speed = this.getConnectionSpeed();
    return speed === '4g' || speed === 'unknown';
  }
}

// Create global instance
const performanceManager = new PerformanceManager();

// Optimize touch events on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    performanceManager.optimizeTouchEvents();
  });
} else {
  performanceManager.optimizeTouchEvents();
}

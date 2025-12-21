/**
 * Image Optimizer
 * Compresses images to reduce file size while maintaining quality
 * Target: ~70% compression, max 500KB
 */

const ImageOptimizer = {
  /**
   * Maximum file size in bytes (500KB)
   */
  MAX_SIZE: 500 * 1024,

  /**
   * Target compression quality (0.7 = 70%)
   */
  QUALITY: 0.7,

  /**
   * Maximum dimensions for images
   */
  MAX_WIDTH: 800,
  MAX_HEIGHT: 800,

  /**
   * Compress image file
   * @param {File} file - Image file to compress
   * @returns {Promise<string>} Base64 encoded compressed image
   */
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Calculate new dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
              const ratio = Math.min(this.MAX_WIDTH / width, this.MAX_HEIGHT / height);
              width = Math.floor(width * ratio);
              height = Math.floor(height * ratio);
            }

            // Create canvas for compression
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            
            // Use image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with compression
            let quality = this.QUALITY;
            let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            
            // If still too large, reduce quality further
            while (this.getBase64Size(compressedBase64) > this.MAX_SIZE && quality > 0.1) {
              quality -= 0.1;
              compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            }

            console.log(`📷 Image compressed: ${Utils.formatFileSize(file.size)} → ${Utils.formatFileSize(this.getBase64Size(compressedBase64))}`);
            
            resolve(compressedBase64);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  },

  /**
   * Get size of base64 string in bytes
   * @param {string} base64 - Base64 string
   * @returns {number} Size in bytes
   */
  getBase64Size(base64) {
    const padding = (base64.match(/=/g) || []).length;
    return Math.floor((base64.length * 3) / 4) - padding;
  },

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {object} Validation result
   */
  validateImage(file) {
    if (!file) {
      return { isValid: false, message: 'No file selected' };
    }

    if (!file.type.startsWith('image/')) {
      return { isValid: false, message: 'File must be an image' };
    }

    const maxUploadSize = 10 * 1024 * 1024; // 10MB max upload
    if (file.size > maxUploadSize) {
      return { isValid: false, message: 'Image must be less than 10MB' };
    }

    return { isValid: true, message: 'Image is valid' };
  },

  /**
   * Create image preview
   * @param {string} base64 - Base64 image data
   * @param {HTMLElement} container - Container element
   * @param {string} altText - Alt text for image
   */
  createPreview(base64, container, altText = 'Preview') {
    container.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = base64;
    img.alt = altText;
    img.style.cssText = `
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    
    container.appendChild(img);
  },

  /**
   * Handle image input change
   * @param {Event} event - Change event
   * @param {Function} callback - Callback with compressed image
   */
  async handleImageInput(event, callback) {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    const validation = this.validateImage(file);
    if (!validation.isValid) {
      Utils.showToast(validation.message, 'error');
      return;
    }

    try {
      Utils.showLoading('Compressing image...');
      const compressed = await this.compressImage(file);
      Utils.hideLoading();
      
      Utils.showToast('Image compressed successfully', 'success');
      callback(compressed);
    } catch (error) {
      Utils.hideLoading();
      console.error('Image compression error:', error);
      Utils.showToast('Failed to compress image', 'error');
    }
  }
};

// Make ImageOptimizer available globally
window.ImageOptimizer = ImageOptimizer;

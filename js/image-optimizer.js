/**
 * Image Optimizer
 * Compresses images to reduce file size while maintaining quality
 * Target: ~70% size reduction, max 500KB
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 800;
    this.maxHeight = options.maxHeight || 800;
    this.quality = options.quality || 0.7;
    this.maxSizeKB = options.maxSizeKB || 500;
  }

  /**
   * Compress and optimize image file
   * @param {File} file - Image file to compress
   * @returns {Promise<string>} Base64 compressed image
   */
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Invalid image file'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            const compressed = this._resizeAndCompress(img);
            resolve(compressed);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress base64 image
   * @param {string} base64 - Base64 image string
   * @returns {Promise<string>} Compressed base64 image
   */
  async compressBase64(base64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const compressed = this._resizeAndCompress(img);
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    });
  }

  /**
   * Resize and compress image
   * @private
   */
  _resizeAndCompress(img) {
    // Calculate new dimensions maintaining aspect ratio
    let { width, height } = this._calculateDimensions(img.width, img.height);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Try different quality levels to meet size requirement
    let quality = this.quality;
    let compressed = canvas.toDataURL('image/jpeg', quality);
    let attempts = 0;
    const maxAttempts = 5;
    
    while (this._getBase64Size(compressed) > this.maxSizeKB * 1024 && attempts < maxAttempts) {
      quality -= 0.1;
      if (quality < 0.3) quality = 0.3; // Don't go below 30% quality
      compressed = canvas.toDataURL('image/jpeg', quality);
      attempts++;
    }
    
    return compressed;
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   * @private
   */
  _calculateDimensions(width, height) {
    if (width <= this.maxWidth && height <= this.maxHeight) {
      return { width, height };
    }

    const aspectRatio = width / height;

    if (width > height) {
      width = this.maxWidth;
      height = Math.round(width / aspectRatio);
    } else {
      height = this.maxHeight;
      width = Math.round(height * aspectRatio);
    }

    return { width, height };
  }

  /**
   * Get size of base64 string in bytes
   * @private
   */
  _getBase64Size(base64) {
    const base64Length = base64.length - (base64.indexOf(',') + 1);
    const padding = (base64.charAt(base64.length - 2) === '=') ? 2 : 
                   (base64.charAt(base64.length - 1) === '=') ? 1 : 0;
    return (base64Length * 0.75) - padding;
  }

  /**
   * Get human-readable size of base64 image
   */
  getImageSize(base64) {
    const bytes = this._getBase64Size(base64);
    return formatFileSize(bytes);
  }

  /**
   * Create thumbnail from image
   */
  async createThumbnail(file, size = 150) {
    const originalMaxWidth = this.maxWidth;
    const originalMaxHeight = this.maxHeight;
    
    this.maxWidth = size;
    this.maxHeight = size;
    
    const thumbnail = await this.compressImage(file);
    
    this.maxWidth = originalMaxWidth;
    this.maxHeight = originalMaxHeight;
    
    return thumbnail;
  }

  /**
   * Validate image dimensions
   */
  validateImageDimensions(img, minWidth = 100, minHeight = 100) {
    if (img.width < minWidth || img.height < minHeight) {
      throw new Error(`Image must be at least ${minWidth}x${minHeight} pixels`);
    }
    return true;
  }

  /**
   * Convert blob to base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 to blob
   */
  base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; i++) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }
}

// Create global instance
const imageOptimizer = new ImageOptimizer({
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.7,
  maxSizeKB: 500
});

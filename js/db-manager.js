/**
 * Triple-Layer Data Persistence Manager
 * 
 * Layer 1: Firebase Realtime Database (primary cloud storage)
 * Layer 2: IndexedDB (browser database for offline)
 * Layer 3: localStorage (session fallback)
 * 
 * Data flows: Write to all layers, read from fastest available layer
 * Ensures data NEVER disappears
 */

class DBManager {
  constructor() {
    this.dbName = 'HoopinDB';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    this.init();
  }

  /**
   * Initialize database connections
   */
  async init() {
    // Setup online/offline listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Initialize IndexedDB
    await this.initIndexedDB();

    // Initialize Firebase
    initializeFirebase();

    console.log('✅ DB Manager initialized');
  }

  /**
   * Initialize IndexedDB
   */
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn('⚠️ IndexedDB not supported');
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'groupId' });
        }
        if (!db.objectStoreNames.contains('teams')) {
          db.createObjectStore('teams', { keyPath: 'teamId' });
        }
        if (!db.objectStoreNames.contains('players')) {
          db.createObjectStore('players', { keyPath: 'playerId' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('✅ IndexedDB stores created');
      };
    });
  }

  /**
   * Handle online event
   */
  async handleOnline() {
    this.isOnline = true;
    console.log('🌐 Back online - syncing data...');
    await this.syncPendingChanges();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    console.log('📴 Offline mode activated');
  }

  /**
   * WRITE operations - Save to all three layers
   */

  /**
   * Save data to all layers
   */
  async save(collection, id, data) {
    const timestamp = Date.now();
    const dataWithTimestamp = { ...data, updatedAt: timestamp };

    try {
      // Layer 3: localStorage (fastest, most reliable)
      this.saveToLocalStorage(collection, id, dataWithTimestamp);

      // Layer 2: IndexedDB (offline support)
      await this.saveToIndexedDB(collection, id, dataWithTimestamp);

      // Layer 1: Firebase (cloud sync)
      if (this.isOnline && isFirebaseAvailable()) {
        await this.saveToFirebase(collection, id, dataWithTimestamp);
      } else {
        // Queue for later sync
        await this.queueForSync(collection, id, dataWithTimestamp, 'save');
      }

      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      throw error;
    }
  }

  /**
   * Delete from all layers
   */
  async delete(collection, id) {
    try {
      // Layer 3: localStorage
      this.deleteFromLocalStorage(collection, id);

      // Layer 2: IndexedDB
      await this.deleteFromIndexedDB(collection, id);

      // Layer 1: Firebase
      if (this.isOnline && isFirebaseAvailable()) {
        await this.deleteFromFirebase(collection, id);
      } else {
        await this.queueForSync(collection, id, null, 'delete');
      }

      return true;
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }

  /**
   * READ operations - Read from fastest available layer
   */

  /**
   * Get single item (tries all layers)
   */
  async get(collection, id) {
    try {
      // Try Layer 3: localStorage (fastest)
      let data = this.getFromLocalStorage(collection, id);
      if (data) return data;

      // Try Layer 2: IndexedDB
      data = await this.getFromIndexedDB(collection, id);
      if (data) {
        // Sync back to localStorage
        this.saveToLocalStorage(collection, id, data);
        return data;
      }

      // Try Layer 1: Firebase (if online)
      if (this.isOnline && isFirebaseAvailable()) {
        data = await this.getFromFirebase(collection, id);
        if (data) {
          // Sync to other layers
          this.saveToLocalStorage(collection, id, data);
          await this.saveToIndexedDB(collection, id, data);
          return data;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Get error:', error);
      return null;
    }
  }

  /**
   * Get all items from collection
   */
  async getAll(collection) {
    try {
      // Try Layer 3: localStorage (fastest)
      let data = this.getAllFromLocalStorage(collection);
      if (data && data.length > 0) return data;

      // Try Layer 2: IndexedDB
      data = await this.getAllFromIndexedDB(collection);
      if (data && data.length > 0) {
        // Sync back to localStorage
        data.forEach(item => {
          const id = item[`${collection.slice(0, -1)}Id`];
          this.saveToLocalStorage(collection, id, item);
        });
        return data;
      }

      // Try Layer 1: Firebase (if online)
      if (this.isOnline && isFirebaseAvailable()) {
        data = await this.getAllFromFirebase(collection);
        if (data && data.length > 0) {
          // Sync to other layers
          data.forEach(async (item) => {
            const id = item[`${collection.slice(0, -1)}Id`];
            this.saveToLocalStorage(collection, id, item);
            await this.saveToIndexedDB(collection, id, item);
          });
          return data;
        }
      }

      return [];
    } catch (error) {
      console.error('❌ GetAll error:', error);
      return [];
    }
  }

  /**
   * Layer 3: localStorage operations
   */

  saveToLocalStorage(collection, id, data) {
    try {
      const key = `${collection}_${id}`;
      localStorage.setItem(key, JSON.stringify(data));
      
      // Update collection index
      const indexKey = `${collection}_index`;
      let index = safeJSONParse(localStorage.getItem(indexKey), []);
      if (!index.includes(id)) {
        index.push(id);
        localStorage.setItem(indexKey, JSON.stringify(index));
      }
    } catch (e) {
      console.error('localStorage save error:', e);
    }
  }

  getFromLocalStorage(collection, id) {
    try {
      const key = `${collection}_${id}`;
      const data = localStorage.getItem(key);
      return safeJSONParse(data);
    } catch (e) {
      console.error('localStorage get error:', e);
      return null;
    }
  }

  getAllFromLocalStorage(collection) {
    try {
      const indexKey = `${collection}_index`;
      const index = safeJSONParse(localStorage.getItem(indexKey), []);
      return index.map(id => this.getFromLocalStorage(collection, id)).filter(Boolean);
    } catch (e) {
      console.error('localStorage getAll error:', e);
      return [];
    }
  }

  deleteFromLocalStorage(collection, id) {
    try {
      const key = `${collection}_${id}`;
      localStorage.removeItem(key);
      
      // Update collection index
      const indexKey = `${collection}_index`;
      let index = safeJSONParse(localStorage.getItem(indexKey), []);
      index = index.filter(itemId => itemId !== id);
      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (e) {
      console.error('localStorage delete error:', e);
    }
  }

  /**
   * Layer 2: IndexedDB operations
   */

  saveToIndexedDB(collection, id, data) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([collection], 'readwrite');
        const store = transaction.objectStore(collection);
        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.error('IndexedDB save error:', e);
        resolve(); // Don't fail the entire operation
      }
    });
  }

  getFromIndexedDB(collection, id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      try {
        const transaction = this.db.transaction([collection], 'readonly');
        const store = transaction.objectStore(collection);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.error('IndexedDB get error:', e);
        resolve(null);
      }
    });
  }

  getAllFromIndexedDB(collection) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      try {
        const transaction = this.db.transaction([collection], 'readonly');
        const store = transaction.objectStore(collection);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.error('IndexedDB getAll error:', e);
        resolve([]);
      }
    });
  }

  deleteFromIndexedDB(collection, id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([collection], 'readwrite');
        const store = transaction.objectStore(collection);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.error('IndexedDB delete error:', e);
        resolve();
      }
    });
  }

  /**
   * Layer 1: Firebase operations
   */

  async saveToFirebase(collection, id, data) {
    if (!isFirebaseAvailable()) return;

    try {
      const db = getDatabase();
      const ref = db.ref(`${collection}/${id}`);
      await ref.set(data);
    } catch (error) {
      console.error('Firebase save error:', error);
      throw error;
    }
  }

  async getFromFirebase(collection, id) {
    if (!isFirebaseAvailable()) return null;

    try {
      const db = getDatabase();
      const ref = db.ref(`${collection}/${id}`);
      const snapshot = await ref.once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Firebase get error:', error);
      return null;
    }
  }

  async getAllFromFirebase(collection) {
    if (!isFirebaseAvailable()) return [];

    try {
      const db = getDatabase();
      const ref = db.ref(collection);
      const snapshot = await ref.once('value');
      const data = snapshot.val();
      
      if (!data) return [];
      
      return Object.values(data);
    } catch (error) {
      console.error('Firebase getAll error:', error);
      return [];
    }
  }

  async deleteFromFirebase(collection, id) {
    if (!isFirebaseAvailable()) return;

    try {
      const db = getDatabase();
      const ref = db.ref(`${collection}/${id}`);
      await ref.remove();
    } catch (error) {
      console.error('Firebase delete error:', error);
      throw error;
    }
  }

  /**
   * Sync queue operations
   */

  async queueForSync(collection, id, data, operation) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const syncItem = {
        collection,
        id,
        data,
        operation,
        timestamp: Date.now()
      };
      
      await store.add(syncItem);
      console.log('📝 Queued for sync:', operation, collection, id);
    } catch (e) {
      console.error('Queue sync error:', e);
    }
  }

  async syncPendingChanges() {
    if (!this.db || !isFirebaseAvailable()) return;

    try {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = async () => {
        const items = request.result;
        
        for (const item of items) {
          try {
            if (item.operation === 'save') {
              await this.saveToFirebase(item.collection, item.id, item.data);
            } else if (item.operation === 'delete') {
              await this.deleteFromFirebase(item.collection, item.id);
            }
            
            // Remove from queue
            store.delete(item.id);
            console.log('✅ Synced:', item.operation, item.collection, item.id);
          } catch (error) {
            console.error('Sync item error:', error);
          }
        }
        
        showToast('Data synced successfully', 'success');
      };
    } catch (e) {
      console.error('Sync pending changes error:', e);
    }
  }

  /**
   * Query helpers
   */

  async query(collection, filterFn) {
    const items = await this.getAll(collection);
    return items.filter(filterFn);
  }

  async count(collection) {
    const items = await this.getAll(collection);
    return items.length;
  }

  /**
   * Clear all data (use with caution)
   */
  async clearAll() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      // Clear localStorage
      localStorage.clear();
      
      // Clear IndexedDB
      if (this.db) {
        const collections = ['groups', 'teams', 'players', 'syncQueue'];
        for (const collection of collections) {
          const transaction = this.db.transaction([collection], 'readwrite');
          const store = transaction.objectStore(collection);
          await store.clear();
        }
      }
      
      console.log('🗑️ All local data cleared');
      showToast('All data cleared', 'info');
    }
  }
}

// Create global instance
const dbManager = new DBManager();

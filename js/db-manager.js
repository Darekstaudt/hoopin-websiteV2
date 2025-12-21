/**
 * Triple-Layer Data Persistence Manager
 * Manages data across Firebase, IndexedDB, and localStorage
 * Ensures data is never lost with automatic syncing
 */

const DBManager = {
  /**
   * IndexedDB database name and version
   */
  DB_NAME: 'HoopinDB',
  DB_VERSION: 1,
  
  /**
   * Store names
   */
  STORES: {
    GROUPS: 'groups',
    TEAMS: 'teams',
    PLAYERS: 'players'
  },

  /**
   * IndexedDB instance
   */
  db: null,

  /**
   * Initialize database
   */
  async init() {
    try {
      await this.initIndexedDB();
      this.setupOnlineOfflineHandlers();
      console.log('✅ DBManager initialized');
    } catch (error) {
      console.error('❌ DBManager initialization error:', error);
    }
  },

  /**
   * Initialize IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores if they don't exist
        Object.values(this.STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            console.log(`✅ Created store: ${storeName}`);
          }
        });
      };
    });
  },

  /**
   * Setup online/offline event handlers
   */
  setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - syncing data...');
      this.syncOfflineData();
      Utils.showToast('Back online - syncing data', 'success');
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline mode activated');
      Utils.showToast('Working offline', 'info');
    });
  },

  /**
   * Save data to all layers
   * @param {string} store - Store name
   * @param {string} id - Record ID
   * @param {object} data - Data to save
   */
  async save(store, id, data) {
    const record = {
      ...data,
      id,
      updatedAt: Date.now(),
      _synced: false
    };

    // Layer 3: localStorage (fastest, for quick access)
    try {
      localStorage.setItem(`${store}_${id}`, JSON.stringify(record));
    } catch (error) {
      console.warn('localStorage save failed:', error);
    }

    // Layer 2: IndexedDB (reliable offline storage)
    try {
      await this.saveToIndexedDB(store, record);
    } catch (error) {
      console.warn('IndexedDB save failed:', error);
    }

    // Layer 1: Firebase (cloud sync)
    if (Utils.isOnline() && window.firebaseDB) {
      try {
        await this.saveToFirebase(store, id, record);
        record._synced = true;
      } catch (error) {
        console.warn('Firebase save failed:', error);
      }
    }

    return record;
  },

  /**
   * Save to IndexedDB
   */
  async saveToIndexedDB(store, data) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Save to Firebase
   */
  async saveToFirebase(store, id, data) {
    if (!window.firebaseDB) {
      throw new Error('Firebase not initialized');
    }

    const cleanData = { ...data };
    delete cleanData._synced; // Remove sync flag before saving to Firebase

    return window.firebaseDB.ref(`${store}/${id}`).set(cleanData);
  },

  /**
   * Get data from all layers (tries each in order)
   * @param {string} store - Store name
   * @param {string} id - Record ID
   */
  async get(store, id) {
    // Try Layer 3: localStorage first (fastest)
    try {
      const localData = localStorage.getItem(`${store}_${id}`);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.warn('localStorage get failed:', error);
    }

    // Try Layer 2: IndexedDB
    try {
      const indexedData = await this.getFromIndexedDB(store, id);
      if (indexedData) {
        return indexedData;
      }
    } catch (error) {
      console.warn('IndexedDB get failed:', error);
    }

    // Try Layer 1: Firebase
    if (Utils.isOnline() && window.firebaseDB) {
      try {
        const firebaseData = await this.getFromFirebase(store, id);
        if (firebaseData) {
          // Cache in other layers
          this.save(store, id, firebaseData);
          return firebaseData;
        }
      } catch (error) {
        console.warn('Firebase get failed:', error);
      }
    }

    return null;
  },

  /**
   * Get from IndexedDB
   */
  async getFromIndexedDB(store, id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get from Firebase
   */
  async getFromFirebase(store, id) {
    if (!window.firebaseDB) {
      throw new Error('Firebase not initialized');
    }

    const snapshot = await window.firebaseDB.ref(`${store}/${id}`).once('value');
    return snapshot.val();
  },

  /**
   * Get all records from store
   * @param {string} store - Store name
   */
  async getAll(store) {
    const records = new Map();

    // Get from IndexedDB first
    try {
      const indexedRecords = await this.getAllFromIndexedDB(store);
      indexedRecords.forEach(record => records.set(record.id, record));
    } catch (error) {
      console.warn('IndexedDB getAll failed:', error);
    }

    // Merge with Firebase data
    if (Utils.isOnline() && window.firebaseDB) {
      try {
        const firebaseRecords = await this.getAllFromFirebase(store);
        firebaseRecords.forEach(record => {
          const existing = records.get(record.id);
          if (!existing || record.updatedAt > existing.updatedAt) {
            records.set(record.id, record);
          }
        });
      } catch (error) {
        console.warn('Firebase getAll failed:', error);
      }
    }

    return Array.from(records.values());
  },

  /**
   * Get all from IndexedDB
   */
  async getAllFromIndexedDB(store) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all from Firebase
   */
  async getAllFromFirebase(store) {
    if (!window.firebaseDB) {
      throw new Error('Firebase not initialized');
    }

    const snapshot = await window.firebaseDB.ref(store).once('value');
    const data = snapshot.val();
    
    if (!data) return [];
    
    return Object.values(data);
  },

  /**
   * Delete record from all layers
   * @param {string} store - Store name
   * @param {string} id - Record ID
   */
  async delete(store, id) {
    // Delete from localStorage
    try {
      localStorage.removeItem(`${store}_${id}`);
    } catch (error) {
      console.warn('localStorage delete failed:', error);
    }

    // Delete from IndexedDB
    try {
      await this.deleteFromIndexedDB(store, id);
    } catch (error) {
      console.warn('IndexedDB delete failed:', error);
    }

    // Delete from Firebase
    if (Utils.isOnline() && window.firebaseDB) {
      try {
        await this.deleteFromFirebase(store, id);
      } catch (error) {
        console.warn('Firebase delete failed:', error);
      }
    }
  },

  /**
   * Delete from IndexedDB
   */
  async deleteFromIndexedDB(store, id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete from Firebase
   */
  async deleteFromFirebase(store, id) {
    if (!window.firebaseDB) {
      throw new Error('Firebase not initialized');
    }

    return window.firebaseDB.ref(`${store}/${id}`).remove();
  },

  /**
   * Sync offline data to Firebase
   */
  async syncOfflineData() {
    if (!Utils.isOnline() || !window.firebaseDB) {
      return;
    }

    console.log('🔄 Syncing offline data...');

    for (const store of Object.values(this.STORES)) {
      try {
        const records = await this.getAllFromIndexedDB(store);
        const unsyncedRecords = records.filter(r => !r._synced);

        for (const record of unsyncedRecords) {
          try {
            await this.saveToFirebase(store, record.id, record);
            record._synced = true;
            await this.saveToIndexedDB(store, record);
            console.log(`✅ Synced ${store}/${record.id}`);
          } catch (error) {
            console.error(`Failed to sync ${store}/${record.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Failed to sync ${store}:`, error);
      }
    }

    console.log('✅ Sync complete');
  },

  /**
   * Query records by field
   * @param {string} store - Store name
   * @param {string} field - Field name
   * @param {*} value - Field value
   */
  async query(store, field, value) {
    const allRecords = await this.getAll(store);
    return allRecords.filter(record => record[field] === value);
  },

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('groups_') || key.startsWith('teams_') || key.startsWith('players_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear IndexedDB
    if (this.db) {
      for (const store of Object.values(this.STORES)) {
        try {
          await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([store], 'readwrite');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        } catch (error) {
          console.error(`Failed to clear ${store}:`, error);
        }
      }
    }

    console.log('🗑️ All data cleared');
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DBManager.init());
} else {
  DBManager.init();
}

// Make DBManager available globally
window.DBManager = DBManager;

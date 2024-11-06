const DB_NAME = 'offlineDB';
const DB_VERSION = 1;

export class IndexedDB {
  static async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        const store = db.createObjectStore('items', { keyPath: 'id' });
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        
        store.createIndex('timestamp', 'timestamp');
        syncStore.createIndex('type', 'type');
      }
    });
  }
} 
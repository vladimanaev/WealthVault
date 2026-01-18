import { StockHolding } from '../types';

/**
 * WealthVault Database Service
 * 
 * CURRENT STATUS: Local-only via browser IndexedDB.
 * TO UPGRADE TO REMOTE: Replace the 'saveHoldings' and 'getHoldings' logic 
 * with calls to a backend (e.g., Supabase, Firebase, or a REST API).
 */

const DB_NAME = 'WealthVaultDB';
const DB_VERSION = 1;
const HOLDINGS_STORE = 'holdings';

export class VaultDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(HOLDINGS_STORE)) {
          const store = db.createObjectStore(HOLDINGS_STORE, { keyPath: 'userId' });
          store.createIndex('userId', 'userId', { unique: true });
        }
      };
    });
  }

  async saveHoldings(userId: string, holdings: StockHolding[]): Promise<void> {
    // 1. SAVE LOCALLY (IndexedDB)
    if (!this.db) await this.init();
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([HOLDINGS_STORE], 'readwrite');
      const store = transaction.objectStore(HOLDINGS_STORE);
      const request = store.put({ userId, holdings, lastUpdated: new Date().toISOString() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // 2. REMOTE SYNC (Optional Future Path)
    /*
    try {
      await fetch('https://your-api.com/sync', {
        method: 'POST',
        body: JSON.stringify({ userId, holdings })
      });
    } catch (e) {
      console.log("Queueing for remote sync when back online...");
    }
    */
  }

  async getHoldings(userId: string): Promise<StockHolding[]> {
    if (!this.db) await this.init();
    
    // Check local storage first
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HOLDINGS_STORE], 'readonly');
      const store = transaction.objectStore(HOLDINGS_STORE);
      const request = store.get(userId);

      request.onsuccess = () => {
        resolve(request.result ? request.result.holdings : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteHoldings(userId: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([HOLDINGS_STORE], 'readwrite');
    transaction.objectStore(HOLDINGS_STORE).delete(userId);
  }
}

export const db = new VaultDatabase();
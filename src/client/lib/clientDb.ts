export interface ClientSettings {
  cameraTheta: number;
  cameraPhi: number;
  cameraDistance: number;
  uiTab: 'inventory' | 'skills' | 'equipment';
  chatVisible: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: ClientSettings = {
  cameraTheta: Math.PI / 4,
  cameraPhi: Math.PI / 4,
  cameraDistance: 15,
  uiTab: 'inventory',
  chatVisible: true,
  soundEnabled: true,
};

const DB_NAME = 'openscape_client';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'username' });
      }
    };
  });
}

export async function loadSettings(username: string): Promise<ClientSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(username);

      request.onsuccess = () => {
        if (request.result) {
          resolve({ ...DEFAULT_SETTINGS, ...request.result.settings });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };

      request.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(username: string, settings: Partial<ClientSettings>): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const existingRequest = store.get(username);
      
      existingRequest.onsuccess = () => {
        const existing = existingRequest.result || { username };
        const updated = {
          ...existing,
          settings: { ...DEFAULT_SETTINGS, ...existing.settings, ...settings },
        };
        
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function getDefaultSettings(): ClientSettings {
  return { ...DEFAULT_SETTINGS };
}

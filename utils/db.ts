

import { LLMProvider } from '../types';

export interface SavedProject {
  id: string; // repoUrl
  name: string; // owner/repo
  owner: string;
  repo: string;
  description: string;
  stars: number;
  language: string;
  userId: string; // Clerk user ID
  createdAt: number;
  updatedAt: number;
}

export interface SavedReport {
  id: string;
  projectId: string; // links to SavedProject.id
  userId: string; // Clerk user ID
  title: string;
  type: 'guide' | 'diagram' | 'prd' | 'chat';
  content: string; // MD content or Mermaid code
  createdAt: number;
}

const DB_NAME = 'GitOnDB';
const DB_VERSION = 3; // Increment version for userId index
const STORE_PROJECTS = 'projects';
const STORE_REPORTS = 'reports';
const STORE_CUSTOM_LLM_MODELS = 'customLLMModels'; // New store

class DB {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Projects Store
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
          projectStore.createIndex('userId', 'userId', { unique: false });
        } else {
          const tx = (event.target as IDBOpenDBRequest).transaction!;
          const projectStore = tx.objectStore(STORE_PROJECTS);
          if (!projectStore.indexNames.contains('userId')) {
            projectStore.createIndex('userId', 'userId', { unique: false });
          }
        }

        // Reports Store
        if (!db.objectStoreNames.contains(STORE_REPORTS)) {
          const reportStore = db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
          reportStore.createIndex('projectId', 'projectId', { unique: false });
          reportStore.createIndex('userId', 'userId', { unique: false });
        } else {
          const tx = (event.target as IDBOpenDBRequest).transaction!;
          const reportStore = tx.objectStore(STORE_REPORTS);
          if (!reportStore.indexNames.contains('userId')) {
            reportStore.createIndex('userId', 'userId', { unique: false });
          }
        }

        // Custom LLM Models Store (NEW)
        if (!db.objectStoreNames.contains(STORE_CUSTOM_LLM_MODELS)) {
          db.createObjectStore(STORE_CUSTOM_LLM_MODELS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // --- Project Methods ---

  async saveProject(project: SavedProject): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getProject(id: string): Promise<SavedProject | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }


  async getProjects(userId?: string): Promise<SavedProject[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      
      if (userId) {
        const index = store.index('userId');
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  async deleteProject(id: string): Promise<void> {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
          const tx = db.transaction([STORE_PROJECTS, STORE_REPORTS], 'readwrite');
          const projectStore = tx.objectStore(STORE_PROJECTS);
          const reportStore = tx.objectStore(STORE_REPORTS);
          const reportIndex = reportStore.index('projectId');

          projectStore.delete(id);

          // Cascade delete reports
          const request = reportIndex.getAllKeys(id);
          request.onsuccess = () => {
              const keys = request.result;
              keys.forEach(key => reportStore.delete(key));
          };
          
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }


  // --- Report Methods ---

  async saveReport(report: SavedReport): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readwrite');
      const store = tx.objectStore(STORE_REPORTS);
      const request = store.put(report);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProjectReports(projectId: string): Promise<SavedReport[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readonly');
      const store = tx.objectStore(STORE_REPORTS);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getReportCount(projectId: string): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_REPORTS, 'readonly');
        const store = transaction.objectStore(STORE_REPORTS);
        const index = store.index('projectId');
        const request = index.count(projectId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  }

  async deleteReport(id: string): Promise<void> {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_REPORTS, 'readwrite');
          const store = tx.objectStore(STORE_REPORTS);
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  }

  async getAllReports(userId?: string): Promise<SavedReport[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readonly');
      const store = tx.objectStore(STORE_REPORTS);
      
      if (userId) {
        const index = store.index('userId');
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  // --- Custom LLM Models Methods (NEW) ---

  async saveCustomLLMModel(provider: LLMProvider): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CUSTOM_LLM_MODELS, 'readwrite');
      const store = tx.objectStore(STORE_CUSTOM_LLM_MODELS);
      const request = store.put(provider);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomLLMModels(): Promise<LLMProvider[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CUSTOM_LLM_MODELS, 'readonly');
      const store = tx.objectStore(STORE_CUSTOM_LLM_MODELS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCustomLLMModel(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CUSTOM_LLM_MODELS, 'readwrite');
      const store = tx.objectStore(STORE_CUSTOM_LLM_MODELS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DB();

// Export/Import helpers
export const exportData = async () => {
  const projects = await db.getProjects();
  const reports = await db.getAllReports();
  return { version: '1.0', exportDate: new Date().toISOString(), projects, reports };
};

export const importData = async (data: { projects: SavedProject[], reports: SavedReport[] }) => {
  for (const proj of data.projects) await db.saveProject(proj);
  for (const report of data.reports) await db.saveReport(report);
};
const DB_NAME = 'drone-pathfinder-vault';
const DB_VERSION = 1;
const STORE_MISSIONS = 'missions';
const STORE_CACHE = 'cache';

export async function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_MISSIONS)) {
        const missionStore = db.createObjectStore(STORE_MISSIONS, { keyPath: 'id' });
        missionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };
  });
}

export interface VaultMission {
  id: string;
  versions: {
    version: number;
    mission: any;
    savedAt: string;
    note?: string;
  }[];
}

export async function saveMissionToVault(
  mission: any,
  note?: string
): Promise<void> {
  const db = await openVaultDB();
  const transaction = db.transaction(STORE_MISSIONS, 'readwrite');
  const store = transaction.objectStore(STORE_MISSIONS);
  
  const existing = await new Promise<VaultMission | undefined>((resolve) => {
    const request = store.get(mission.id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(undefined);
  });
  
  const newVersion = existing ? existing.versions.length + 1 : 1;
  const versionData = {
    version: newVersion,
    mission,
    savedAt: new Date().toISOString(),
    note,
  };
  
  const vaultMission: VaultMission = existing || { id: mission.id, versions: [] };
  vaultMission.versions.push(versionData);
  
  await new Promise<void>((resolve, reject) => {
    const request = store.put(vaultMission);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMissionVersions(missionId: string): Promise<VaultMission['versions']> {
  const db = await openVaultDB();
  const transaction = db.transaction(STORE_MISSIONS, 'readonly');
  const store = transaction.objectStore(STORE_MISSIONS);
  
  return new Promise((resolve) => {
    const request = store.get(missionId);
    request.onsuccess = () => resolve(request.result?.versions || []);
    request.onerror = () => resolve([]);
  });
}

export interface MissionDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

export function compareMissions(v1: any, v2: any): MissionDiff[] {
  const diffs: MissionDiff[] = [];
  
  if (v1.config?.altitude !== v2.config?.altitude) {
    diffs.push({
      field: 'Altitude',
      oldValue: v1.config?.altitude,
      newValue: v2.config?.altitude,
    });
  }
  
  if (v1.config?.speed !== v2.config?.speed) {
    diffs.push({
      field: 'Speed',
      oldValue: v1.config?.speed,
      newValue: v2.config?.speed,
    });
  }
  
  if (v1.waypoints?.length !== v2.waypoints?.length) {
    diffs.push({
      field: 'Waypoint Count',
      oldValue: v1.waypoints?.length,
      newValue: v2.waypoints?.length,
    });
  }
  
  return diffs;
}

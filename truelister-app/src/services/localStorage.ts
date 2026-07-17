import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';
import { shallowEqual } from './utils';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
  LEGACY_APPS_SCRIPT_URL: 'settings_apps_script_url',
  LEGACY_DRIVE_FOLDER_ID: 'settings_drive_folder_id',
  LEGACY_SPREADSHEET_ID: 'settings_spreadsheet_id',
};

// Memory caches to avoid redundant bridge traffic and parsing
let cachedDrafts: CatalogItem[] | null = null;
let cachedSettings: AppSettings | null = null;
let cachedPendingUploads: PendingUpload[] | null = null;

// Module-level promise chain to guarantee sequential read-modify-write operations
let enqueueUpdate = Promise.resolve<any>(undefined);

function runAtomic<T>(op: () => Promise<T>): Promise<T> {
  const result = enqueueUpdate.then(op);
  enqueueUpdate = result.then(() => undefined, () => undefined);
  return result;
}

/**
 * App settings persistence
 */
export interface AppSettings {
  defaultWhiteBalance: string;
  defaultMarketplace: string;
  autoCompress: boolean;
  uploadOriginals: boolean;
  appsScriptUrl: string;
  driveFolderId: string;
  spreadsheetId: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultWhiteBalance: 'auto',
  defaultMarketplace: '',
  autoCompress: true,
  uploadOriginals: true,
  appsScriptUrl: '',
  driveFolderId: '',
  spreadsheetId: '',
};

/**
 * Track pending photo uploads (originals waiting to go to Drive)
 */
export interface PendingUpload {
  itemNumber: string;
  localUri: string;
  fileName: string;
  timestamp: number;
  fieldName?: string; // which variant 3 photo field this belongs to
}

// ── Settings ─────────────────────────────────────────────────────────────────

async function getRawSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }

    // One-time migration: check legacy standalone keys
    const [legacyUrl, legacyFolder, legacySpreadsheet] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.LEGACY_APPS_SCRIPT_URL),
      AsyncStorage.getItem(STORAGE_KEYS.LEGACY_DRIVE_FOLDER_ID),
      AsyncStorage.getItem(STORAGE_KEYS.LEGACY_SPREADSHEET_ID),
    ]);

    const migratedSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      appsScriptUrl: legacyUrl || '',
      driveFolderId: legacyFolder || '',
      spreadsheetId: legacySpreadsheet || '',
    };

    // Save migrated settings
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(migratedSettings));
    return migratedSettings;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function getSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;
  return runAtomic(async () => {
    if (cachedSettings) return cachedSettings;
    cachedSettings = await getRawSettings();
    return cachedSettings!;
  });
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  await runAtomic(async () => {
    const current = await getRawSettings();
    const updated = { ...current, ...settings };
    if (cachedSettings && shallowEqual(cachedSettings, updated)) {
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    // Sync to legacy keys for backward compatibility with older services
    if (settings.appsScriptUrl !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_APPS_SCRIPT_URL, settings.appsScriptUrl);
    }
    if (settings.driveFolderId !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_DRIVE_FOLDER_ID, settings.driveFolderId);
    }
    if (settings.spreadsheetId !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_SPREADSHEET_ID, settings.spreadsheetId);
    }

    cachedSettings = updated;
  });
}

// ── Centralized Accessors ────────────────────────────────────────────────────

export async function getAppsScriptUrl(): Promise<string> {
  const settings = await getSettings();
  return settings.appsScriptUrl;
}

export async function getSpreadsheetId(): Promise<string> {
  const settings = await getSettings();
  return settings.spreadsheetId;
}

export async function getDriveFolderId(): Promise<string> {
  const settings = await getSettings();
  return settings.driveFolderId;
}

export async function saveLegacySetting(key: string, value: string): Promise<void> {
  const fieldMap: Record<string, keyof AppSettings> = {
    'settings_apps_script_url': 'appsScriptUrl',
    'settings_drive_folder_id': 'driveFolderId',
    'settings_spreadsheet_id': 'spreadsheetId',
  };
  const field = fieldMap[key];
  if (field) {
    await saveSettings({ [field]: value });
  }
}

// ── Draft Items ──────────────────────────────────────────────────────────────

async function getRawDraftItems(): Promise<CatalogItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getDraftItems(): Promise<CatalogItem[]> {
  if (cachedDrafts) return cachedDrafts;
  return runAtomic(async () => {
    if (cachedDrafts) return cachedDrafts;
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_ITEMS);
      cachedDrafts = data ? JSON.parse(data) : [];
      return cachedDrafts!;
    } catch (error) {
      console.error('Error reading drafts:', error);
      return [];
    }
  });
}

export async function saveDraftItem(item: CatalogItem): Promise<void> {
  await runAtomic(async () => {
    const existing = cachedDrafts || (await getRawDraftItems());
    const index = existing.findIndex(i => i.itemNumber === item.itemNumber);

    if (index !== -1) {
      // If item is identical to existing draft, skip write
      if (shallowEqual(existing[index], item)) {
        cachedDrafts = existing;
        return;
      }

      const updated = [...existing];
      updated[index] = item;
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
      cachedDrafts = updated;
    } else {
      const updated = [...existing, item];
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
      cachedDrafts = updated;
    }
  });
}

export async function removeDraftItem(itemNumber: string): Promise<void> {
  await runAtomic(async () => {
    const existing = cachedDrafts || (await getRawDraftItems());
    const filtered = existing.filter(item => item.itemNumber !== itemNumber);

    if (filtered.length === existing.length) {
      cachedDrafts = existing;
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(filtered));
    cachedDrafts = filtered;
  });
}

export async function clearDrafts(): Promise<void> {
  await runAtomic(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_ITEMS);
    cachedDrafts = [];
  });
}

export const getDrafts = getDraftItems;
export const deleteDraft = removeDraftItem;

// ── Pending Uploads ──────────────────────────────────────────────────────────

async function getRawPendingUploads(): Promise<PendingUpload[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getPendingUploads(): Promise<PendingUpload[]> {
  if (cachedPendingUploads) return cachedPendingUploads;
  return runAtomic(async () => {
    if (cachedPendingUploads) return cachedPendingUploads;
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
      cachedPendingUploads = data ? JSON.parse(data) : [];
      return cachedPendingUploads!;
    } catch (error) {
      console.error('Error reading pending uploads:', error);
      return [];
    }
  });
}

export async function addPendingUpload(upload: PendingUpload): Promise<void> {
  await runAtomic(async () => {
    const existing = cachedPendingUploads || (await getRawPendingUploads());
    const index = existing.findIndex(u =>
      u.itemNumber === upload.itemNumber && u.fieldName === upload.fieldName
    );

    if (index !== -1) {
      if (existing[index].localUri === upload.localUri) {
        cachedPendingUploads = existing;
        return;
      }
      const updated = [...existing];
      updated[index] = upload;
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
      cachedPendingUploads = updated;
    } else {
      const updated = [...existing, upload];
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
      cachedPendingUploads = updated;
    }
  });
}

export async function removePendingUpload(itemNumber: string): Promise<void> {
  await runAtomic(async () => {
    const existing = cachedPendingUploads || (await getRawPendingUploads());
    const filtered = existing.filter(u => u.itemNumber !== itemNumber);

    if (filtered.length === existing.length) {
      cachedPendingUploads = existing;
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(filtered));
    cachedPendingUploads = filtered;
  });
}

// ── Cache Invalidation ───────────────────────────────────────────────────────

export function invalidateAllCaches(): void {
  cachedDrafts = null;
  cachedSettings = null;
  cachedPendingUploads = null;
}

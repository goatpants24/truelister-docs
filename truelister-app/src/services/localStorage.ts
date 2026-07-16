import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';
import { shallowEqual } from './utils';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
};

// Memory cache to avoid redundant bridge traffic and parsing
let cachedDrafts: CatalogItem[] | null = null;
let cachedSettings: AppSettings | null = null;
let cachedPendingUploads: PendingUpload[] | null = null;

/**
 * Atomic update queue to prevent race conditions during concurrent writes.
 * Bolt: Using a promise chain ensures that "read-modify-write" operations
 * are executed sequentially even when triggered via Promise.all.
 */
let updateQueue: Promise<any> = Promise.resolve();

async function enqueueUpdate<T>(updateFn: () => Promise<T>): Promise<T> {
  const result = updateQueue.then(updateFn);
  updateQueue = result.catch(() => {}); // Continue queue even if one update fails
  return result;
}

/**
 * Save a draft item locally (for offline use or before sync).
 * Bolt: Implements true "upsert" logic to prevent duplicate entries and
 * skips redundant AsyncStorage writes if the item is unchanged.
 */
export async function saveDraftItem(item: CatalogItem): Promise<void> {
  return enqueueUpdate(async () => {
    try {
      const existing = await getDraftItems();
      const index = existing.findIndex(i => i.itemNumber === item.itemNumber);

      if (index !== -1) {
        // If item is identical to existing draft, skip the write
        if (shallowEqual(existing[index], item)) return;

        const updated = [...existing];
        updated[index] = item;
        await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
        cachedDrafts = updated;
      } else {
        const updated = [...existing, item];
        await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
        cachedDrafts = updated;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  });
}

export async function getDraftItems(): Promise<CatalogItem[]> {
  if (cachedDrafts) return cachedDrafts;
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_ITEMS);
    cachedDrafts = data ? JSON.parse(data) : [];
    return cachedDrafts!;
  } catch (error) {
    console.error('Error reading drafts:', error);
    return [];
  }
}

/**
 * Bolt: Skips AsyncStorage write if the item is not found in the current state.
 */
export async function removeDraftItem(itemNumber: string): Promise<void> {
  return enqueueUpdate(async () => {
    try {
      const existing = await getDraftItems();
      const filtered = existing.filter(item => item.itemNumber !== itemNumber);

      if (filtered.length === existing.length) return;

      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(filtered));
      cachedDrafts = filtered;
    } catch (error) {
      console.error('Error removing draft:', error);
    }
  });
}

export async function clearDrafts(): Promise<void> {
  return enqueueUpdate(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_ITEMS);
    cachedDrafts = [];
  });
}

/** Alias for getDraftItems — used by DraftsScreen */
export const getDrafts = getDraftItems;

/** Delete a single draft by item number */
export const deleteDraft = removeDraftItem;

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

/**
 * Bolt: Implements deduplication by itemNumber and fieldName.
 * Skips write if the exact same upload (item + field + uri) is already pending.
 */
export async function addPendingUpload(upload: PendingUpload): Promise<void> {
  return enqueueUpdate(async () => {
    try {
      const existing = await getPendingUploads();
      const index = existing.findIndex(u =>
        u.itemNumber === upload.itemNumber && u.fieldName === upload.fieldName
      );

      if (index !== -1) {
        if (shallowEqual(existing[index], upload)) return;
        const updated = [...existing];
        updated[index] = upload;
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
        cachedPendingUploads = updated;
      } else {
        const updated = [...existing, upload];
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
        cachedPendingUploads = updated;
      }
    } catch (error) {
      console.error('Error saving pending upload:', error);
    }
  });
}

export async function getPendingUploads(): Promise<PendingUpload[]> {
  if (cachedPendingUploads) return cachedPendingUploads;
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
    cachedPendingUploads = data ? JSON.parse(data) : [];
    return cachedPendingUploads!;
  } catch (error) {
    console.error('Error reading pending uploads:', error);
    return [];
  }
}

/**
 * Bolt: Skips AsyncStorage write if the item is not found in the current state.
 */
export async function removePendingUpload(itemNumber: string): Promise<void> {
  return enqueueUpdate(async () => {
    try {
      const existing = await getPendingUploads();
      const filtered = existing.filter(u => u.itemNumber !== itemNumber);

      if (filtered.length === existing.length) return;

      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(filtered));
      cachedPendingUploads = filtered;
    } catch (error) {
      console.error('Error removing pending upload:', error);
    }
  });
}

/**
 * App settings persistence
 */
export interface AppSettings {
  defaultWhiteBalance: string;
  defaultMarketplace: string;
  autoCompress: boolean;
  uploadOriginals: boolean;
  // Connectivity settings
  appsScriptUrl: string;
  spreadsheetId: string;
  driveFolderId: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultWhiteBalance: 'auto',
  defaultMarketplace: '',
  autoCompress: true,
  uploadOriginals: true,
  appsScriptUrl: '',
  spreadsheetId: '',
  driveFolderId: '',
};

/**
 * Internal helper to read settings from storage without triggering migration.
 * Prevents infinite recursion between getSettings and saveSettings.
 */
async function getRawSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      return cachedSettings!;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function getSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      return cachedSettings!;
    }

    // Bolt: Migration logic for legacy individual settings keys.
    // This ensures existing users don't lose their Apps Script URL or Folder ID.
    const [legacyUrl, legacySheetId, legacyFolderId] = await Promise.all([
      AsyncStorage.getItem('settings_apps_script_url'),
      AsyncStorage.getItem('settings_spreadsheet_id'),
      AsyncStorage.getItem('settings_drive_folder_id'),
    ]);

    if (legacyUrl || legacySheetId || legacyFolderId) {
      const migrated = {
        ...DEFAULT_SETTINGS,
        appsScriptUrl: legacyUrl || '',
        spreadsheetId: legacySheetId || '',
        driveFolderId: legacyFolderId || '',
      };
      // Perform an atomic save to consolidate the settings
      // We use saveSettings here which will enqueue the update correctly
      await saveSettings(migrated);
      return migrated;
    }

    cachedSettings = DEFAULT_SETTINGS;
    return cachedSettings;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  return enqueueUpdate(async () => {
    try {
      // Use getRawSettings to avoid migration loop
      const current = await getRawSettings();
      const updated = { ...current, ...settings };

      if (shallowEqual(current, updated)) return;

      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      cachedSettings = updated;
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  });
}

/**
 * Legacy compatibility helper to save individual settings keys.
 * Bolt: Skips write if the value is already in memory cache.
 */
export async function saveLegacySetting(key: string, value: string): Promise<void> {
  const settings = await getSettings();
  let field: keyof AppSettings | null = null;

  if (key === 'settings_apps_script_url') field = 'appsScriptUrl';
  else if (key === 'settings_spreadsheet_id') field = 'spreadsheetId';
  else if (key === 'settings_drive_folder_id') field = 'driveFolderId';

  if (field && settings[field] === value) return;

  if (field) {
    await saveSettings({ [field]: value });
  } else {
    // Fallback for non-consolidated keys
    await AsyncStorage.setItem(key, value);
  }
}

/**
 * Cached accessors for connectivity settings to eliminate AsyncStorage bridge traffic.
 */
export async function getAppsScriptUrl(): Promise<string> {
  return (await getSettings()).appsScriptUrl;
}

export async function getSpreadsheetId(): Promise<string> {
  const settings = await getSettings();
  // Note: we don't have access to GOOGLE_SHEETS_CONFIG here to avoid circular imports,
  // so we rely on the caller or default value.
  return settings.spreadsheetId;
}

export async function getDriveFolderId(): Promise<string> {
  return (await getSettings()).driveFolderId;
}

/**
 * Invalidate all memory caches.
 */
export function invalidateAllCaches(): void {
  cachedDrafts = null;
  cachedSettings = null;
  cachedPendingUploads = null;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';
import { shallowEqual } from './utils';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
  // Individual connectivity keys - kept for compatibility with legacy getters
  APPS_SCRIPT_URL: 'settings_apps_script_url',
  SPREADSHEET_ID: 'settings_spreadsheet_id',
  DRIVE_FOLDER_ID: 'settings_drive_folder_id',
};

// Memory cache to avoid redundant bridge traffic and parsing
let cachedDrafts: CatalogItem[] | null = null;
let cachedSettings: AppSettings | null = null;
let cachedPendingUploads: PendingUpload[] | null = null;

// Hot-path connectivity caches
let cachedAppsScriptUrl: string | null = null;
let cachedSpreadsheetId: string | null = null;
let cachedDriveFolderId: string | null = null;

/**
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Centralized Connectivity Accessors
 * These provide instantaneous, cached access to configuration strings used
 * in network hot-paths (Sheets API, Drive Uploads).
 */
export async function getAppsScriptUrl(): Promise<string> {
  if (cachedAppsScriptUrl !== null) return cachedAppsScriptUrl;
  const val = await AsyncStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL);
  cachedAppsScriptUrl = val || '';
  return cachedAppsScriptUrl;
}

export async function getSpreadsheetId(): Promise<string> {
  if (cachedSpreadsheetId !== null) return cachedSpreadsheetId;
  const val = await AsyncStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID);
  cachedSpreadsheetId = val || '';
  return cachedSpreadsheetId;
}

export async function getDriveFolderId(): Promise<string> {
  if (cachedDriveFolderId !== null) return cachedDriveFolderId;
  const val = await AsyncStorage.getItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
  cachedDriveFolderId = val || '';
  return cachedDriveFolderId;
}

/**
 * Save individual connectivity settings while maintaining cache integrity.
 */
export async function saveLegacySetting(key: 'APPS_SCRIPT_URL' | 'SPREADSHEET_ID' | 'DRIVE_FOLDER_ID', value: string): Promise<void> {
  const storageKey = STORAGE_KEYS[key];
  const trimmed = value.trim();

  // ⚡ Bolt: Bail early using memory cache check instead of storage bridge call.
  if (key === 'APPS_SCRIPT_URL' && cachedAppsScriptUrl === trimmed) return;
  if (key === 'SPREADSHEET_ID' && cachedSpreadsheetId === trimmed) return;
  if (key === 'DRIVE_FOLDER_ID' && cachedDriveFolderId === trimmed) return;

  await AsyncStorage.setItem(storageKey, trimmed);

  if (key === 'APPS_SCRIPT_URL') cachedAppsScriptUrl = trimmed;
  if (key === 'SPREADSHEET_ID') cachedSpreadsheetId = trimmed;
  if (key === 'DRIVE_FOLDER_ID') cachedDriveFolderId = trimmed;
}

/**
 * Save a draft item locally (for offline use or before sync).
 * Bolt: Implements true "upsert" logic to prevent duplicate entries and
 * skips redundant AsyncStorage writes if the item is unchanged.
 */
export async function saveDraftItem(item: CatalogItem): Promise<void> {
  try {
    const existing = await getDraftItems();
    const index = existing.findIndex(i => i.itemNumber === item.itemNumber);

    if (index !== -1) {
      // ⚡ Bolt: If item is identical to existing draft, skip the write
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
  try {
    const existing = await getDraftItems();
    const filtered = existing.filter(item => item.itemNumber !== itemNumber);

    if (filtered.length === existing.length) return;

    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(filtered));
    cachedDrafts = filtered;
  } catch (error) {
    console.error('Error removing draft:', error);
  }
}

export async function clearDrafts(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_ITEMS);
  cachedDrafts = [];
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
  try {
    const existing = await getPendingUploads();
    const index = existing.findIndex(u =>
      u.itemNumber === upload.itemNumber && u.fieldName === upload.fieldName
    );

    if (index !== -1) {
      // ⚡ Bolt: Skip redundant write if URI is identical
      if (existing[index].localUri === upload.localUri) return;

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
  try {
    const existing = await getPendingUploads();
    const filtered = existing.filter(u => u.itemNumber !== itemNumber);

    if (filtered.length === existing.length) return;

    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(filtered));
    cachedPendingUploads = filtered;
  } catch (error) {
    console.error('Error removing pending upload:', error);
  }
}

/**
 * App settings persistence
 */
export interface AppSettings {
  defaultWhiteBalance: string;
  defaultMarketplace: string;
  autoCompress: boolean;
  uploadOriginals: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultWhiteBalance: 'auto',
  defaultMarketplace: '',
  autoCompress: true,
  uploadOriginals: true,
};

export async function getSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    cachedSettings = data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    return cachedSettings!;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };

    // ⚡ Bolt: Bail early if the settings are identical.
    // Prevents unnecessary bridge traffic and disk I/O.
    if (shallowEqual(current, updated)) return;

    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    cachedSettings = updated;
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

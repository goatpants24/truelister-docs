import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { shallowEqual } from './utils';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
  // Connectivity legacy keys (deprecated but kept for compatibility)
  LEGACY_APPS_SCRIPT_URL: 'settings_apps_script_url',
  LEGACY_SPREADSHEET_ID: 'settings_spreadsheet_id',
  LEGACY_DRIVE_FOLDER_ID: 'settings_drive_folder_id',
};

// Memory cache to avoid redundant bridge traffic and parsing
let cachedDrafts: CatalogItem[] | null = null;
let cachedPendingUploads: PendingUpload[] | null = null;
let cachedSettings: AppSettings | null = null;

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

    let updated: PendingUpload[];
    if (index !== -1) {
      if (shallowEqual(existing[index], upload)) return;
      updated = [...existing];
      updated[index] = upload;
    } else {
      updated = [...existing, upload];
    }
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
    cachedPendingUploads = updated;
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

    if (shallowEqual(current, updated)) return;

    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    cachedSettings = updated;
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Optimized Connectivity Accessors
 * Bolt: These functions provide cached access to global connectivity settings,
 * eliminating redundant AsyncStorage bridge traffic across services.
 */

let cachedAppsScriptUrl: string | null = null;
let cachedSpreadsheetId: string | null = null;
let cachedDriveFolderId: string | null = null;

export async function getAppsScriptUrl(): Promise<string> {
  if (cachedAppsScriptUrl !== null) return cachedAppsScriptUrl;
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_APPS_SCRIPT_URL);
  cachedAppsScriptUrl = stored?.trim() ?? '';
  return cachedAppsScriptUrl;
}

export async function getSpreadsheetId(): Promise<string> {
  if (cachedSpreadsheetId !== null) return cachedSpreadsheetId;
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_SPREADSHEET_ID);
  cachedSpreadsheetId = stored?.trim() || GOOGLE_SHEETS_CONFIG.DEFAULT_SPREADSHEET_ID;
  return cachedSpreadsheetId;
}

export async function getDriveFolderId(): Promise<string> {
  if (cachedDriveFolderId !== null) return cachedDriveFolderId;
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_DRIVE_FOLDER_ID);
  cachedDriveFolderId = stored?.trim() ?? '';
  return cachedDriveFolderId;
}

/**
 * Legacy support for saving individual connectivity keys.
 * Also synchronizes the memory cache.
 */
export async function saveLegacySetting(key: 'apps_script' | 'spreadsheet' | 'drive', value: string): Promise<void> {
  const storageKey = key === 'apps_script' ? STORAGE_KEYS.LEGACY_APPS_SCRIPT_URL
    : key === 'spreadsheet' ? STORAGE_KEYS.LEGACY_SPREADSHEET_ID
    : STORAGE_KEYS.LEGACY_DRIVE_FOLDER_ID;

  await AsyncStorage.setItem(storageKey, value);

  if (key === 'apps_script') cachedAppsScriptUrl = value;
  else if (key === 'spreadsheet') {
    cachedSpreadsheetId = value;
    // Important: Invalidate inventory/dropdown caches when spreadsheet ID changes
    // sheets.ts will need to handle this via its own clearCache method
  }
  else if (key === 'drive') cachedDriveFolderId = value;
}

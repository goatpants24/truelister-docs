import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';
import { shallowEqual } from './utils';
import { GOOGLE_SHEETS_CONFIG, GOOGLE_DRIVE_CONFIG } from '../config';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
  APPS_SCRIPT_URL: 'settings_apps_script_url',
  SPREADSHEET_ID: 'settings_spreadsheet_id',
  DRIVE_FOLDER_ID: 'settings_drive_folder_id',
};

// --- Memory Cache ---
// Bolt Performance Optimization: Module-level memory caching minimizes bridge
// traffic and JSON parsing overhead for high-frequency accessors.
let cachedDrafts: CatalogItem[] | null = null;
let cachedSettings: AppSettings | null = null;
let cachedPendingUploads: PendingUpload[] | null = null;
let cachedAppsScriptUrl: string | null = null;
let cachedSpreadsheetId: string | null = null;
let cachedDriveFolderId: string | null = null;

// --- Draft Items ---

/**
 * Save a draft item locally.
 * Bolt: Implements "upsert" logic and skips redundant writes via shallowEqual.
 */
export async function saveDraftItem(item: CatalogItem): Promise<void> {
  try {
    const existing = await getDraftItems();
    const index = existing.findIndex(i => i.itemNumber === item.itemNumber);

    if (index !== -1) {
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

export const getDrafts = getDraftItems;
export const deleteDraft = removeDraftItem;

// --- Pending Uploads ---

export interface PendingUpload {
  itemNumber: string;
  localUri: string;
  fileName: string;
  timestamp: number;
  fieldName?: string;
}

/**
 * Bolt: Optimized write guard with deduplication by itemNumber and fieldName.
 */
export async function addPendingUpload(upload: PendingUpload): Promise<void> {
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

// --- App Settings ---

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

// --- Connectivity Accessors (Optimized) ---

/**
 * Bolt Performance Optimization: Centralized and cached connectivity accessors.
 * These eliminate redundant AsyncStorage reads and fallback logic across services.
 */

export async function getAppsScriptUrl(): Promise<string> {
  if (cachedAppsScriptUrl !== null) return cachedAppsScriptUrl;
  const url = await AsyncStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL);
  cachedAppsScriptUrl = (url ?? '').trim();
  return cachedAppsScriptUrl;
}

export async function getSpreadsheetId(): Promise<string> {
  if (cachedSpreadsheetId !== null) return cachedSpreadsheetId;
  const id = await AsyncStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID);
  cachedSpreadsheetId = (id || GOOGLE_SHEETS_CONFIG.DEFAULT_SPREADSHEET_ID).trim();
  return cachedSpreadsheetId!;
}

export async function getDriveFolderId(): Promise<string> {
  if (cachedDriveFolderId !== null) return cachedDriveFolderId;
  const id = await AsyncStorage.getItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
  cachedDriveFolderId = (id || GOOGLE_DRIVE_CONFIG.PHOTOS_FOLDER_ID || '').trim();
  return cachedDriveFolderId;
}

/**
 * Update a specific connectivity setting and invalidate its cache.
 * Bolt: Used to centralize legacy individual key updates from SettingsScreen.
 */
export async function saveLegacySetting(key: 'APPS_SCRIPT_URL' | 'SPREADSHEET_ID' | 'DRIVE_FOLDER_ID', value: string): Promise<void> {
  const storageKey = STORAGE_KEYS[key];
  const trimmedValue = value.trim();

  // Bail if value is unchanged to save bridge traffic
  if (key === 'APPS_SCRIPT_URL' && cachedAppsScriptUrl === trimmedValue) return;
  if (key === 'SPREADSHEET_ID' && cachedSpreadsheetId === trimmedValue) return;
  if (key === 'DRIVE_FOLDER_ID' && cachedDriveFolderId === trimmedValue) return;

  await AsyncStorage.setItem(storageKey, trimmedValue);

  // Invalidate specific cache
  if (key === 'APPS_SCRIPT_URL') cachedAppsScriptUrl = trimmedValue;
  else if (key === 'SPREADSHEET_ID') cachedSpreadsheetId = trimmedValue;
  else if (key === 'DRIVE_FOLDER_ID') cachedDriveFolderId = trimmedValue;
}

/** Invalidate all memory caches (e.g. on global clear) */
export function invalidateAllCaches() {
  cachedDrafts = null;
  cachedSettings = null;
  cachedPendingUploads = null;
  cachedAppsScriptUrl = null;
  cachedSpreadsheetId = null;
  cachedDriveFolderId = null;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
};

// Memory cache to avoid redundant bridge traffic and parsing
let cachedDrafts: CatalogItem[] | null = null;

/**
 * Save a draft item locally (for offline use or before sync)
 */
/**
 * Save or update a draft item locally.
 * Bolt: Optimized to perform an "upsert" (update if exists) to prevent duplicate
 * entries for the same item number, reducing storage bloat and sync confusion.
 */
export async function saveDraftItem(item: CatalogItem): Promise<void> {
  try {
    const existing = await getDraftItems();
    const index = existing.findIndex(d => d.itemNumber === item.itemNumber);
    const updated = index >= 0
      ? [...existing.slice(0, index), item, ...existing.slice(index + 1)]
      : [...existing, item];

    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
    cachedDrafts = updated;
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
 * Delete a single draft by item number.
 */
export async function deleteDraft(itemNumber: string): Promise<void> {
  try {
    const existing = await getDraftItems();
    const updated = existing.filter(item => item.itemNumber !== itemNumber);
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
    cachedDrafts = updated;
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

export async function addPendingUpload(upload: PendingUpload): Promise<void> {
  try {
    const existing = await getPendingUploads();
    const updated = [...existing, upload];
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving pending upload:', error);
  }
}

export async function getPendingUploads(): Promise<PendingUpload[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading pending uploads:', error);
    return [];
  }
}

export async function removePendingUpload(itemNumber: string): Promise<void> {
  try {
    const existing = await getPendingUploads();
    const updated = existing.filter(u => u.itemNumber !== itemNumber);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
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
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

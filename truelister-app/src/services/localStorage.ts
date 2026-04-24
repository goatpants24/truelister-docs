import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
};

/**
 * Save a draft item locally (for offline use or before sync)
 */
export async function saveDraftItem(item: CatalogItem): Promise<void> {
  try {
    const existing = await getDraftItems();
    const updated = [...existing, item];
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving draft:', error);
  }
}

export async function getDraftItems(): Promise<CatalogItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading drafts:', error);
    return [];
  }
}

export async function removeDraftItem(itemNumber: string): Promise<void> {
  try {
    const existing = await getDraftItems();
    const updated = existing.filter(item => item.itemNumber !== itemNumber);
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ITEMS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing draft:', error);
  }
}

export async function clearDrafts(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_ITEMS);
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

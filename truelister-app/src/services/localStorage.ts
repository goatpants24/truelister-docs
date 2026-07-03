import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem } from '../types';

const STORAGE_KEYS = {
  DRAFT_ITEMS: 'truelister_draft_items',
  PENDING_UPLOADS: 'truelister_pending_uploads',
  SETTINGS: 'truelister_settings',
};

// Memory cache to avoid redundant bridge traffic and parsing
let cachedDrafts: CatalogItem[] | null = null;
let cachedPendingUploads: PendingUpload[] | null = null;

/**
 * Optimized shallow equality check for CatalogItem.
 * Bolt: Faster than JSON.stringify for detecting redundant storage writes.
 */
function isItemEqual(a: CatalogItem, b: CatalogItem): boolean {
  return (
    a.itemNumber === b.itemNumber &&
    a.title === b.title &&
    a.designerBrand === b.designerBrand &&
    a.category === b.category &&
    a.size === b.size &&
    a.condition === b.condition &&
    a.fabricMaterial === b.fabricMaterial &&
    a.measurements === b.measurements &&
    a.color === b.color &&
    a.saleStatus === b.saleStatus &&
    a.price === b.price &&
    a.photoUrl === b.photoUrl &&
    a.marketplace === b.marketplace &&
    a.dateListed === b.dateListed &&
    a.notes === b.notes &&
    a.photoUrlCard === b.photoUrlCard &&
    a.photoUrlFront === b.photoUrlFront &&
    a.photoUrlBack === b.photoUrlBack &&
    a.photoUrlDetail === b.photoUrlDetail &&
    a.photoUrlTabletopWide === b.photoUrlTabletopWide &&
    a.photoUrlTabletopDetail === b.photoUrlTabletopDetail &&
    a.photoUrlTabletopMeasure1 === b.photoUrlTabletopMeasure1 &&
    a.photoUrlTabletopMeasure2 === b.photoUrlTabletopMeasure2
  );
}

/**
 * Save a draft item locally (for offline use or before sync)
 * Bolt Performance Optimization: Upsert-and-Bail logic.
 * Detects if the item is identical to an existing draft to avoid O(N) stringification
 * and expensive AsyncStorage writes.
 */
export async function saveDraftItem(item: CatalogItem): Promise<void> {
  try {
    const existing = await getDraftItems();
    const index = existing.findIndex(d => d.itemNumber === item.itemNumber);

    let updated: CatalogItem[];
    if (index >= 0) {
      // Bail if the item is identical to what's already saved
      if (isItemEqual(existing[index], item)) return;
      updated = [...existing];
      updated[index] = item;
    } else {
      updated = [...existing, item];
    }

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

export async function removeDraftItem(itemNumber: string): Promise<void> {
  try {
    const existing = await getDraftItems();
    const updated = existing.filter(item => item.itemNumber !== itemNumber);

    // Bail if the item wasn't in drafts to avoid redundant storage writes
    if (updated.length === existing.length) return;

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

export async function addPendingUpload(upload: PendingUpload): Promise<void> {
  try {
    const existing = await getPendingUploads();
    // Use both itemNumber and fieldName for unique identification
    const index = existing.findIndex(u => u.itemNumber === upload.itemNumber && u.fieldName === upload.fieldName);

    let updated: PendingUpload[];
    if (index >= 0) {
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

export async function removePendingUpload(itemNumber: string, fieldName?: string): Promise<void> {
  try {
    const existing = await getPendingUploads();
    const updated = existing.filter(u =>
      fieldName ? (u.itemNumber !== itemNumber || u.fieldName !== fieldName) : u.itemNumber !== itemNumber
    );

    // Bail if no items were removed to avoid redundant storage writes
    if (updated.length === existing.length) return;

    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(updated));
    cachedPendingUploads = updated;
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

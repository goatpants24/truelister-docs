import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * In-memory cache for credentials to avoid redundant AsyncStorage reads/writes.
 * Maps raw storage keys (e.g., 'marketplace_creds_ebay_userToken') to their saved values.
 */
const credentialsCache = new Map<string, string>();

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 *
 * Bolt Performance Optimization: Write-Guard
 * Compares incoming credential values with cached values, executing AsyncStorage.multiSet
 * only for changed values to eliminate redundant bridge I/O.
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const toUpdate: [string, string][] = [];

  for (const [field, value] of Object.entries(credentials)) {
    const key = `${KEY_PREFIX}${marketplaceId}_${field}`;
    const currentValue = credentialsCache.get(key);

    // Only update if value changed or is not present in cache
    if (currentValue !== value) {
      toUpdate.push([key, value]);
    }
  }

  if (toUpdate.length === 0) {
    // Write avoided! Cache was already up to date.
    return;
  }

  // Persist only modified pairs
  await AsyncStorage.multiSet(toUpdate);

  // Synchronize cache
  for (const [key, value] of toUpdate) {
    credentialsCache.set(key, value);
  }
}

/**
 * Load credentials for a specific marketplace.
 *
 * Bolt Performance Optimization: Cache-First Lookup
 * Resolves credential fields directly from memory cache when available.
 * If any requested fields are missing, fetches only those from AsyncStorage and caches them,
 * drastically reducing bridge traffic.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const result: MarketplaceCredentials = {};
  const missingKeys: string[] = [];

  for (const fieldKey of fieldKeys) {
    const key = `${KEY_PREFIX}${marketplaceId}_${fieldKey}`;
    if (credentialsCache.has(key)) {
      result[fieldKey] = credentialsCache.get(key) ?? '';
    } else {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    const pairs = await AsyncStorage.multiGet(missingKeys);
    pairs.forEach(([storageKey, value]) => {
      const field = storageKey.replace(`${KEY_PREFIX}${marketplaceId}_`, '');
      const finalValue = value ?? '';
      result[field] = finalValue;
      credentialsCache.set(storageKey, finalValue);
    });
  }

  return result;
}

/**
 * Check whether a marketplace has at least one non-empty credential saved.
 */
export async function isMarketplaceConfigured(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<boolean> {
  const creds = await loadCredentials(marketplaceId, fieldKeys);
  return Object.values(creds).some(v => v.trim().length > 0);
}

/**
 * Clear all credentials for a specific marketplace.
 */
export async function clearCredentials(marketplaceId: MarketplaceId): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const prefix = `${KEY_PREFIX}${marketplaceId}_`;
  const toRemove = allKeys.filter(k => k.startsWith(prefix));

  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }

  // Evict from cache
  for (const key of credentialsCache.keys()) {
    if (key.startsWith(prefix)) {
      credentialsCache.delete(key);
    }
  }
}

/**
 * Invalidate all cached marketplace credentials.
 * Used during settings reset/logout.
 */
export function invalidateCredentialsCache(): void {
  credentialsCache.clear();
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * Bolt: Memory cache to avoid redundant AsyncStorage bridge traffic and reading/parsing.
 * Maps a fully-formed storageKey (e.g., 'marketplace_creds_ebay_clientId') to its saved string value.
 */
const credentialsCache = new Map<string, string>();

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 * Bolt: Implements a write-guard that skips redundant AsyncStorage.multiSet calls if values are identical.
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const pairs: [string, string][] = [];

  for (const [field, value] of Object.entries(credentials)) {
    const storageKey = `${KEY_PREFIX}${marketplaceId}_${field}`;
    const cleanValue = value ?? '';

    // Skip write if the value is already cached and identical
    if (credentialsCache.get(storageKey) === cleanValue) {
      continue;
    }

    pairs.push([storageKey, cleanValue]);
    credentialsCache.set(storageKey, cleanValue);
  }

  if (pairs.length > 0) {
    await AsyncStorage.multiSet(pairs);
  }
}

/**
 * Load credentials for a specific marketplace.
 * Bolt: Retrieves values from memory cache first. Calls AsyncStorage.multiGet only for missing keys.
 * Reduces native bridge traffic and keeps retrieval O(1) in the hot rendering path.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const result: MarketplaceCredentials = {};
  const missingKeys: string[] = [];

  for (const k of fieldKeys) {
    const storageKey = `${KEY_PREFIX}${marketplaceId}_${k}`;
    if (credentialsCache.has(storageKey)) {
      result[k] = credentialsCache.get(storageKey) ?? '';
    } else {
      missingKeys.push(storageKey);
    }
  }

  if (missingKeys.length > 0) {
    const pairs = await AsyncStorage.multiGet(missingKeys);
    pairs.forEach(([storageKey, value]) => {
      const field = storageKey.replace(`${KEY_PREFIX}${marketplaceId}_`, '');
      const val = value ?? '';
      credentialsCache.set(storageKey, val);
      result[field] = val;
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
  // Clear matching keys from cache
  const prefix = `${KEY_PREFIX}${marketplaceId}_`;
  for (const key of Array.from(credentialsCache.keys())) {
    if (key.startsWith(prefix)) {
      credentialsCache.delete(key);
    }
  }

  const allKeys = await AsyncStorage.getAllKeys();
  const toRemove = allKeys.filter(k => k.startsWith(prefix));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
}

/**
 * Bolt: Completely flush the memory cache.
 * Typically called during standard "Clear All Data" operations.
 */
export function invalidateCredentialsCache(): void {
  credentialsCache.clear();
}

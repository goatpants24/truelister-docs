import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';
import { shallowEqual } from '../utils';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: In-Memory Credentials Cache
 * Caches loaded credentials to eliminate redundant AsyncStorage bridge traffic on hot UI paths.
 */
const credentialsCache = new Map<MarketplaceId, MarketplaceCredentials>();

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 *
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Write-Guard
 * Skips AsyncStorage.multiSet write if the new credentials are identical to the cached ones.
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const current = credentialsCache.get(marketplaceId) || {};
  const updated = { ...current, ...credentials };

  // Skip AsyncStorage write if current cached credentials are equal to the new ones
  if (shallowEqual(current, updated)) {
    return;
  }

  const pairs: [string, string][] = Object.entries(credentials).map(
    ([field, value]) => [`${KEY_PREFIX}${marketplaceId}_${field}`, value]
  );
  await AsyncStorage.multiSet(pairs);

  // Update in-memory cache
  credentialsCache.set(marketplaceId, updated);
}

/**
 * Load credentials for a specific marketplace.
 *
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Read Caching Fast Path
 * Bypasses AsyncStorage and returns cached credentials if already loaded and contains requested keys.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const cached = credentialsCache.get(marketplaceId);

  if (cached) {
    let hasAllKeys = true;
    for (let i = 0; i < fieldKeys.length; i++) {
      if (!(fieldKeys[i] in cached)) {
        hasAllKeys = false;
        break;
      }
    }
    if (hasAllKeys) {
      const result: MarketplaceCredentials = {};
      for (let i = 0; i < fieldKeys.length; i++) {
        const k = fieldKeys[i];
        result[k] = cached[k] ?? '';
      }
      return result;
    }
  }

  const prefix = `${KEY_PREFIX}${marketplaceId}_`;
  const prefixLen = prefix.length;
  const storageKeys: string[] = new Array(fieldKeys.length);
  for (let i = 0; i < fieldKeys.length; i++) {
    storageKeys[i] = `${prefix}${fieldKeys[i]}`;
  }

  const pairs = await AsyncStorage.multiGet(storageKeys);
  const result: MarketplaceCredentials = {};
  for (let i = 0; i < pairs.length; i++) {
    const [storageKey, value] = pairs[i];
    const field = storageKey.slice(prefixLen);
    result[field] = value ?? '';
  }

  // Update cache with loaded keys
  const currentCache = credentialsCache.get(marketplaceId) || {};
  credentialsCache.set(marketplaceId, { ...currentCache, ...result });

  return result;
}

/**
 * Check whether a marketplace has at least one non-empty credential saved.
 *
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Fast-Exit `for...in` Loop
 * Uses a fast-exiting `for...in` loop to return true on the first non-empty credential field,
 * eliminating array allocations from `Object.values()` and `.some()` callback closures.
 */
export async function isMarketplaceConfigured(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<boolean> {
  const creds = await loadCredentials(marketplaceId, fieldKeys);
  for (const k in creds) {
    if (creds[k] && creds[k].trim().length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Clear all credentials for a specific marketplace.
 * Also synchronizes by removing from the in-memory cache.
 *
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Single-Pass Key Filter Loop
 * Replaces `.filter()` callback allocation with a single-pass `for` loop.
 */
export async function clearCredentials(marketplaceId: MarketplaceId): Promise<void> {
  const prefix = `${KEY_PREFIX}${marketplaceId}_`;
  const allKeys = await AsyncStorage.getAllKeys();
  const toRemove: string[] = [];
  for (let i = 0; i < allKeys.length; i++) {
    if (allKeys[i].startsWith(prefix)) {
      toRemove.push(allKeys[i]);
    }
  }
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }

  // Clear from in-memory cache
  credentialsCache.delete(marketplaceId);
}

/**
 * Invalidate the entire credentials cache.
 */
export function invalidateCredentialsCache(): void {
  credentialsCache.clear();
}

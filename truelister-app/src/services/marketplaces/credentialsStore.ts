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
    const hasAllKeys = fieldKeys.every(k => k in cached!);
    if (hasAllKeys) {
      const result: MarketplaceCredentials = {};
      fieldKeys.forEach(k => {
        result[k] = cached![k] ?? '';
      });
      return result;
    }
  }

  const storageKeys = fieldKeys.map(k => `${KEY_PREFIX}${marketplaceId}_${k}`);
  const pairs = await AsyncStorage.multiGet(storageKeys);
  const result: MarketplaceCredentials = {};
  pairs.forEach(([storageKey, value]) => {
    const field = storageKey.replace(`${KEY_PREFIX}${marketplaceId}_`, '');
    result[field] = value ?? '';
  });

  // Update cache with loaded keys
  const currentCache = credentialsCache.get(marketplaceId) || {};
  credentialsCache.set(marketplaceId, { ...currentCache, ...result });

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
 * Also synchronizes by removing from the in-memory cache.
 */
export async function clearCredentials(marketplaceId: MarketplaceId): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const toRemove = allKeys.filter(k => k.startsWith(`${KEY_PREFIX}${marketplaceId}_`));
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

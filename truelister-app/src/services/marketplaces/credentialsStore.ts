import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * In-memory cache to avoid redundant AsyncStorage bridge traffic on hot UI paths.
 * Maps AsyncStorage key -> decrypted/saved value.
 */
const credentialsCache = new Map<string, string>();

/**
 * Invalidate the in-memory cache.
 * Exposing this allows UI screens (like SettingsScreen during full resets) to clear memory state.
 */
export function invalidateCredentialsCache(): void {
  credentialsCache.clear();
}

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 *
 * Bolt: Implements a write-guard that skips write operations if the updated
 * credentials are identical to the cached values.
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const pairs: [string, string][] = [];
  let hasChanges = false;

  for (const [field, value] of Object.entries(credentials)) {
    const key = `${KEY_PREFIX}${marketplaceId}_${field}`;
    const cachedValue = credentialsCache.get(key);

    // Check if the value is different from what's in cache or if it's missing
    if (cachedValue !== value) {
      hasChanges = true;
    }

    pairs.push([key, value]);
  }

  // Bolt Write Guard: If everything matches the current cache, bail early.
  if (!hasChanges) {
    return;
  }

  // Save to AsyncStorage
  await AsyncStorage.multiSet(pairs);

  // Update memory cache
  for (const [key, value] of pairs) {
    credentialsCache.set(key, value);
  }
}

/**
 * Load credentials for a specific marketplace.
 *
 * Bolt: Leverages the local memory cache. If all keys are already present
 * in the cache, returns immediately without any AsyncStorage bridge overhead.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const result: MarketplaceCredentials = {};
  const missingKeys: string[] = [];

  for (const field of fieldKeys) {
    const key = `${KEY_PREFIX}${marketplaceId}_${field}`;
    if (credentialsCache.has(key)) {
      result[field] = credentialsCache.get(key) ?? '';
    } else {
      missingKeys.push(key);
    }
  }

  // If some or all keys are missing, fetch them from AsyncStorage
  if (missingKeys.length > 0) {
    const pairs = await AsyncStorage.multiGet(missingKeys);
    pairs.forEach(([storageKey, value]) => {
      const val = value ?? '';
      // Cache the fetched value
      credentialsCache.set(storageKey, val);
      // Map to the return result
      const field = storageKey.replace(`${KEY_PREFIX}${marketplaceId}_`, '');
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
  const allKeys = await AsyncStorage.getAllKeys();
  const toRemove = allKeys.filter(k => k.startsWith(`${KEY_PREFIX}${marketplaceId}_`));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
  // Clear from memory cache
  const prefix = `${KEY_PREFIX}${marketplaceId}_`;
  for (const key of Array.from(credentialsCache.keys())) {
    if (key.startsWith(prefix)) {
      credentialsCache.delete(key);
    }
  }
}

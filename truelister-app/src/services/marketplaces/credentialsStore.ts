import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: In-Memory Credentials Cache
 * Caching loaded credentials in a Map eliminates redundant AsyncStorage.multiGet bridging overhead
 * during screen transitions and hot paths (like checking platform setup before publishing).
 */
const credentialsCache = new Map<string, string>();

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 * Bolt: Includes a write-guard to only write changed values to AsyncStorage, saving I/O.
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const pairsToWrite: [string, string][] = [];

  Object.entries(credentials).forEach(([field, value]) => {
    const key = `${KEY_PREFIX}${marketplaceId}_${field}`;
    const currentValue = credentialsCache.get(key);

    if (currentValue !== value) {
      pairsToWrite.push([key, value]);
      credentialsCache.set(key, value);
    }
  });

  if (pairsToWrite.length > 0) {
    await AsyncStorage.multiSet(pairsToWrite);
  }
}

/**
 * Load credentials for a specific marketplace.
 * Bolt: Reads from the in-memory cache when possible, avoiding AsyncStorage bridge traffic.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const result: MarketplaceCredentials = {};
  const missingKeys: string[] = [];
  const storageKeys: string[] = [];

  fieldKeys.forEach(k => {
    const key = `${KEY_PREFIX}${marketplaceId}_${k}`;
    if (credentialsCache.has(key)) {
      result[k] = credentialsCache.get(key) ?? '';
    } else {
      missingKeys.push(k);
      storageKeys.push(key);
    }
  });

  if (missingKeys.length > 0) {
    const pairs = await AsyncStorage.multiGet(storageKeys);
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
  const allKeys = await AsyncStorage.getAllKeys();
  const toRemove = allKeys.filter(k => k.startsWith(`${KEY_PREFIX}${marketplaceId}_`));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
    toRemove.forEach(k => credentialsCache.delete(k));
  }
}

/**
 * Invalidates the credentials cache. Called when resetting or clearing data.
 */
export function invalidateCredentialsCache(): void {
  credentialsCache.clear();
}

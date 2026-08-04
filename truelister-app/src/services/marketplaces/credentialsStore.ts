import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Credentials Memory Cache
 * An in-memory cache to eliminate redundant AsyncStorage.multiGet bridge traffic
 * on hot UI paths.
 */
const credentialsCache = new Map<string, string>();

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 * Bolt: Includes a write-guard to skip redundant AsyncStorage updates.
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const pairsToSet: [string, string][] = [];

  for (const [field, value] of Object.entries(credentials)) {
    const key = `${KEY_PREFIX}${marketplaceId}_${field}`;
    const currentValue = credentialsCache.get(key);

    if (currentValue !== value) {
      pairsToSet.push([key, value]);
      credentialsCache.set(key, value);
    }
  }

  if (pairsToSet.length > 0) {
    await AsyncStorage.multiSet(pairsToSet);
  }
}

/**
 * Load credentials for a specific marketplace.
 * Bolt: Checks memory cache first. Only queries AsyncStorage for missing keys.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const missingKeys: string[] = [];
  const result: MarketplaceCredentials = {};

  for (const k of fieldKeys) {
    const key = `${KEY_PREFIX}${marketplaceId}_${k}`;
    if (credentialsCache.has(key)) {
      result[k] = credentialsCache.get(key)!;
    } else {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    const pairs = await AsyncStorage.multiGet(missingKeys);
    pairs.forEach(([storageKey, value]) => {
      const field = storageKey.replace(`${KEY_PREFIX}${marketplaceId}_`, '');
      const finalValue = value ?? '';
      credentialsCache.set(storageKey, finalValue);
      result[field] = finalValue;
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
    toRemove.forEach(key => credentialsCache.delete(key));
  }
}

/**
 * Invalidate the credentials memory cache.
 */
export function invalidateCredentialsCache(): void {
  credentialsCache.clear();
}

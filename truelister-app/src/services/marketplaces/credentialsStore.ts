import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * Memory cache to avoid repeated multiGet and multiSet AsyncStorage calls.
 * Map key format: `${marketplaceId}_${field}`
 */
const credentialsCache = new Map<string, string>();

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 * Bolt: Implements a write-guard that skips redundant writes if values are identical.
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const pairs: [string, string][] = [];
  for (const [field, value] of Object.entries(credentials)) {
    const cacheKey = `${marketplaceId}_${field}`;
    const currentValue = credentialsCache.get(cacheKey);
    const val = value ?? '';
    if (currentValue !== val) {
      pairs.push([`${KEY_PREFIX}${marketplaceId}_${field}`, val]);
      credentialsCache.set(cacheKey, val);
    }
  }
  if (pairs.length > 0) {
    await AsyncStorage.multiSet(pairs);
  }
}

/**
 * Load credentials for a specific marketplace.
 * Bolt: Retrieves credentials from in-memory cache if available to prevent bridge traffic.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const result: MarketplaceCredentials = {};
  const missingKeys: string[] = [];

  for (const k of fieldKeys) {
    const cacheKey = `${marketplaceId}_${k}`;
    if (credentialsCache.has(cacheKey)) {
      result[k] = credentialsCache.get(cacheKey)!;
    } else {
      missingKeys.push(k);
    }
  }

  if (missingKeys.length > 0) {
    const storageKeys = missingKeys.map(k => `${KEY_PREFIX}${marketplaceId}_${k}`);
    const pairs = await AsyncStorage.multiGet(storageKeys);
    pairs.forEach(([storageKey, value]) => {
      const field = storageKey.replace(`${KEY_PREFIX}${marketplaceId}_`, '');
      const val = value ?? '';
      credentialsCache.set(`${marketplaceId}_${field}`, val);
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
  // Clear matching keys from memory cache
  for (const cacheKey of Array.from(credentialsCache.keys())) {
    if (cacheKey.startsWith(`${marketplaceId}_`)) {
      credentialsCache.delete(cacheKey);
    }
  }
}

/**
 * Clear the entire memory cache.
 */
export function invalidateCredentialsCache(): void {
  credentialsCache.clear();
}

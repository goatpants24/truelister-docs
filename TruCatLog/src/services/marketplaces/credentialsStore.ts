import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceId, MarketplaceCredentials } from './types';

const KEY_PREFIX = 'marketplace_creds_';

/**
 * Save credentials for a specific marketplace.
 * Each field is stored as a flat key: marketplace_creds_{id}_{fieldKey}
 */
export async function saveCredentials(
  marketplaceId: MarketplaceId,
  credentials: MarketplaceCredentials
): Promise<void> {
  const pairs: [string, string][] = Object.entries(credentials).map(
    ([field, value]) => [`${KEY_PREFIX}${marketplaceId}_${field}`, value]
  );
  await AsyncStorage.multiSet(pairs);
}

/**
 * Load credentials for a specific marketplace.
 */
export async function loadCredentials(
  marketplaceId: MarketplaceId,
  fieldKeys: string[]
): Promise<MarketplaceCredentials> {
  const storageKeys = fieldKeys.map(k => `${KEY_PREFIX}${marketplaceId}_${k}`);
  const pairs = await AsyncStorage.multiGet(storageKeys);
  const result: MarketplaceCredentials = {};
  pairs.forEach(([storageKey, value]) => {
    const field = storageKey.replace(`${KEY_PREFIX}${marketplaceId}_`, '');
    result[field] = value ?? '';
  });
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
  if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
}

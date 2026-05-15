import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { CatalogItem, DropdownOptions } from '../types';

const { DEFAULT_SPREADSHEET_ID, SHEET_NAME, DROPDOWNS_SHEET } = GOOGLE_SHEETS_CONFIG;

// AsyncStorage keys — must stay in sync with SettingsScreen
const SETTINGS_KEYS = {
  APPS_SCRIPT_URL: 'settings_apps_script_url',
  SPREADSHEET_ID: 'settings_spreadsheet_id',
};

// Memory cache for spreadsheet ID and data to avoid redundant reads/fetches
let cachedSpreadsheetId: string | null = null;

const INVENTORY_CACHE_TTL = 60 * 1000; // 1 minute
const DROPDOWNS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let inventoryCache: { data: CatalogItem[]; timestamp: number } | null = null;
let dropdownsCache: { data: DropdownOptions; timestamp: number } | null = null;

/**
 * Optimized helper to get spreadsheet ID with memory caching.
 * Reduces asynchronous overhead on every inventory/dropdown fetch.
 */
export async function getSpreadsheetId(): Promise<string> {
  if (cachedSpreadsheetId) return cachedSpreadsheetId;
  const storedId = await AsyncStorage.getItem(SETTINGS_KEYS.SPREADSHEET_ID);
  cachedSpreadsheetId = storedId || DEFAULT_SPREADSHEET_ID;
  return cachedSpreadsheetId;
}

/** Clear memory cache - used when settings change */
export function clearSpreadsheetIdCache() {
  cachedSpreadsheetId = null;
  inventoryCache = null;
  dropdownsCache = null;
}

// Public CSV export URL
const SHEETS_CSV_URL = (spreadsheetId: string, sheet: string) =>
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csv: string): string[][] {
  const lines = csv.split('\n').filter(line => line.trim());
  return lines.map(parseCSVRow);
}

function rowToItem(row: string[]): CatalogItem {
  return {
    itemNumber: row[0] || '',
    title: row[1] || '',
    designerBrand: row[2] || '',
    category: row[3] || '',
    size: row[4] || '',
    condition: row[5] || '',
    fabricMaterial: row[6] || '',
    measurements: row[7] || '',
    color: row[8] || '',
    saleStatus: row[9] || '',
    price: row[10] || '',
    photoUrl: row[11] || '',
    marketplace: row[12] || '',
    dateListed: row[13] || '',
    notes: row[14] || '',
  };
}

function itemToRow(item: CatalogItem): string[] {
  return [
    item.itemNumber,
    item.title,
    item.designerBrand,
    item.category,
    item.size,
    item.condition,
    item.fabricMaterial,
    item.measurements,
    item.color,
    item.saleStatus,
    item.price,
    item.photoUrl,
    item.marketplace,
    item.dateListed,
    item.notes,
  ];
}

export async function fetchInventory(): Promise<CatalogItem[]> {
  // Return cached data if still valid
  const now = Date.now();
  if (inventoryCache && (now - inventoryCache.timestamp < INVENTORY_CACHE_TTL)) {
    return inventoryCache.data;
  }

  const id = await getSpreadsheetId();
  const url = SHEETS_CSV_URL(id, SHEET_NAME);
  console.log(`[Sheets] Fetching inventory from: ${url}`);
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[Sheets] Inventory fetch failed with status ${response.status}: ${response.statusText}`);
      if (response.status === 404) {
        console.error('[Sheets] 404 Error: Please check your SPREADSHEET_ID in config/index.ts and ensure the sheet is "Published to the Web".');
      }
      return [];
    }

    const csv = await response.text();
    const rows = parseCSV(csv);
    // Skip header row
    const items = rows.slice(1).map(rowToItem).filter(item => item.itemNumber || item.title);

    // Update cache
    inventoryCache = { data: items, timestamp: Date.now() };

    return items;
  } catch (error) {
    console.error('[Sheets] Network error fetching inventory:', error);
    return [];
  }
}

export async function fetchDropdowns(): Promise<DropdownOptions> {
  // Return cached data if still valid
  const now = Date.now();
  if (dropdownsCache && (now - dropdownsCache.timestamp < DROPDOWNS_CACHE_TTL)) {
    return dropdownsCache.data;
  }

  const id = await getSpreadsheetId();
  const url = SHEETS_CSV_URL(id, DROPDOWNS_SHEET);
  console.log(`[Sheets] Fetching dropdowns from: ${url}`);
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[Sheets] Dropdowns fetch failed with status ${response.status}: ${response.statusText}`);
      return {
        categories: [],
        conditions: [],
        saleStatuses: [],
        marketplaces: [],
        colors: [],
        sizes: [],
      };
    }

    const csv = await response.text();
    const rows = parseCSV(csv);
    // Skip header row, transpose columns
    const dataRows = rows.slice(1);
    const dropdowns = {
      categories: dataRows.map(r => r[0]).filter(Boolean),
      conditions: dataRows.map(r => r[1]).filter(Boolean),
      saleStatuses: dataRows.map(r => r[2]).filter(Boolean),
      marketplaces: dataRows.map(r => r[3]).filter(Boolean),
      colors: dataRows.map(r => r[4]).filter(Boolean),
      sizes: dataRows.map(r => r[5]).filter(Boolean),
    };

    // Update cache
    dropdownsCache = { data: dropdowns, timestamp: Date.now() };

    return dropdowns;
  } catch (error) {
    console.error('Error fetching dropdowns:', error);
    return { categories: [], conditions: [], saleStatuses: [], marketplaces: [], colors: [], sizes: [] };
  }
}

export async function testConnection(type: 'sheet' | 'script'): Promise<{ success: boolean; error?: string }> {
  if (type === 'sheet') {
    try {
      const id = await getSpreadsheetId();
      const response = await fetch(SHEETS_CSV_URL(id, SHEET_NAME));
      if (response.ok) return { success: true };
      if (response.status === 404) return { success: false, error: 'Sheet not found. Ensure it is "Published to web" as CSV.' };
      return { success: false, error: `Error ${response.status}: ${response.statusText}` };
    } catch (e) {
      return { success: false, error: 'Network error. Check your internet connection.' };
    }
  } else {
    try {
      const url = await AsyncStorage.getItem('settings_apps_script_url') || '';
      if (!url) return { success: false, error: 'Apps Script URL not configured in Settings.' };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      });

      if (response.ok) return { success: true };
      return { success: false, error: `Error ${response.status}: Ensure the script is deployed as a Web App for "Anyone".` };
    } catch (e) {
      return { success: false, error: 'Network error. Ensure the URL is correct and valid.' };
    }
  }
}

export async function appendItem(item: CatalogItem): Promise<boolean> {
  // Read the Apps Script URL from AsyncStorage — set by the user in the Settings tab.
  // This means no code change is needed; the user just pastes their URL in-app.
  const appsScriptUrl = (await AsyncStorage.getItem(SETTINGS_KEYS.APPS_SCRIPT_URL))?.trim() ?? '';

  if (!appsScriptUrl) {
    console.warn('Apps Script URL not configured. Open the Settings tab to add it.');
    return false;
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'append', data: itemToRow(item) }),
    });
    const result = await response.json();
    if (result.success === true) {
      // Invalidate inventory cache on success so the next fetch gets the new item
      inventoryCache = null;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error appending item to sheet:', error);
    return false;
  }
}

export function generateItemNumber(existingItems: CatalogItem[]): string {
  const maxNum = existingItems.reduce((max, item) => {
    const match = item.itemNumber.match(/TL-(\d+)/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `TL-${String(maxNum + 1).padStart(3, '0')}`;
}

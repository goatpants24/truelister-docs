import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { CatalogItem, DropdownOptions } from '../types';

const { SPREADSHEET_ID, SHEET_NAME, DROPDOWNS_SHEET } = GOOGLE_SHEETS_CONFIG;

// AsyncStorage keys — must stay in sync with SettingsScreen
const SETTINGS_KEYS = {
  APPS_SCRIPT_URL: 'settings_apps_script_url',
};

// Public CSV export URL (no API key needed for sheets shared with "anyone with link")
const SHEETS_CSV_URL = (sheet: string) =>
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

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
  try {
    const response = await fetch(SHEETS_CSV_URL(SHEET_NAME));
    const csv = await response.text();
    const rows = parseCSV(csv);
    // Skip header row
    return rows.slice(1).map(rowToItem).filter(item => item.itemNumber || item.title);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

export async function fetchDropdowns(): Promise<DropdownOptions> {
  try {
    const response = await fetch(SHEETS_CSV_URL(DROPDOWNS_SHEET));
    const csv = await response.text();
    const rows = parseCSV(csv);
    // Skip header row, transpose columns
    const dataRows = rows.slice(1);
    return {
      categories: dataRows.map(r => r[0]).filter(Boolean),
      conditions: dataRows.map(r => r[1]).filter(Boolean),
      saleStatuses: dataRows.map(r => r[2]).filter(Boolean),
      marketplaces: dataRows.map(r => r[3]).filter(Boolean),
      colors: dataRows.map(r => r[4]).filter(Boolean),
      sizes: dataRows.map(r => r[5]).filter(Boolean),
    };
  } catch (error) {
    console.error('Error fetching dropdowns:', error);
    return { categories: [], conditions: [], saleStatuses: [], marketplaces: [], colors: [], sizes: [] };
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
    return result.success === true;
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

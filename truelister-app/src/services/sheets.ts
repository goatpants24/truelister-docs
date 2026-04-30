import { GOOGLE_SHEETS_CONFIG } from '../config';
import { CatalogItem, DropdownOptions } from '../types';

const { SPREADSHEET_ID, SHEET_NAME, DROPDOWNS_SHEET } = GOOGLE_SHEETS_CONFIG;

// Public CSV export URL (no API key needed for sheets shared with "anyone with link")
const SHEETS_CSV_URL = (sheet: string) =>
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

// Google Sheets API v4 URL (needs API key for read, OAuth for write)
const SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

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
  const url = SHEETS_CSV_URL(SHEET_NAME);
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
    return rows.slice(1).map(rowToItem).filter(item => item.itemNumber || item.title);
  } catch (error) {
    console.error('[Sheets] Network error fetching inventory:', error);
    return [];
  }
}

export async function fetchDropdowns(): Promise<DropdownOptions> {
  const url = SHEETS_CSV_URL(DROPDOWNS_SHEET);
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
    return {
      categories: [],
      conditions: [],
      saleStatuses: [],
      marketplaces: [],
      colors: [],
      sizes: [],
    };
  }
}

export async function appendItem(item: CatalogItem): Promise<boolean> {
  // For write operations, we use the Google Apps Script web app endpoint
  // This avoids needing OAuth in the mobile app
  // See README for how to deploy the Apps Script
  const APPS_SCRIPT_URL = ''; // Set after deploying Apps Script

  if (!APPS_SCRIPT_URL) {
    console.warn('Apps Script URL not configured. Saving locally only.');
    return false;
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'append', data: itemToRow(item) }),
    });
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error appending item:', error);
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

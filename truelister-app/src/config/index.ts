// TrueLister Configuration
// Google Sheets API (public read via Sheets API v4, no auth needed for published sheets)
export const GOOGLE_SHEETS_CONFIG = {
  DEFAULT_SPREADSHEET_ID: '1QHrXKkuh-6bNUyeYgp8jZrdP3t8MzBSyx-8k-GjFOcI',
  SHEET_NAME: 'Inventory',
  DROPDOWNS_SHEET: 'Dropdowns',
  // Using Google Sheets API v4 with API key for read access
  // For write access, you'll need OAuth2 — see README for setup
  API_KEY: '', // Add your Google API key here for read-only access
};

// Google Drive folder for original photos
export const GOOGLE_DRIVE_CONFIG = {
  PHOTOS_FOLDER_ID: '', // Create a folder in Drive and paste its ID here
};

// Image compression settings
export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 2,
  MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
  TARGET_SIZE_BYTES: 1.5 * 1024 * 1024, // 1.5MB target (leaves headroom)
  COMPRESS_QUALITY: 0.8, // Start at 80% quality
  MIN_QUALITY: 0.3, // Never go below 30%
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
};

// White balance presets
export const WHITE_BALANCE_PRESETS = {
  AUTO: 'auto',
  DAYLIGHT: 'daylight',
  CLOUDY: 'cloudy',
  FLUORESCENT: 'fluorescent',
  INCANDESCENT: 'incandescent',
  CUSTOM: 'custom',
} as const;

export type WhiteBalancePreset = typeof WHITE_BALANCE_PRESETS[keyof typeof WHITE_BALANCE_PRESETS];

// Catalog field definitions
export const CATALOG_FIELDS = [
  'Item #',
  'Title',
  'Designer/Brand',
  'Category',
  'Size',
  'Condition',
  'Fabric/Material',
  'Measurements',
  'Color',
  'Sale Status',
  'Price',
  'Photo URL',
  'Marketplace',
  'Date Listed',
  'Notes',
] as const;

export interface CatalogItem {
  itemNumber: string;
  title: string;
  designerBrand: string;
  category: string;
  size: string;
  condition: string;
  fabricMaterial: string;
  measurements: string;
  color: string;
  saleStatus: string;
  price: string;
  photoUrl: string;
  marketplace: string;
  dateListed: string;
  notes: string;
}

export interface DropdownOptions {
  categories: string[];
  conditions: string[];
  saleStatuses: string[];
  marketplaces: string[];
  colors: string[];
  sizes: string[];
}

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
  base64?: string;
}

export type WhiteBalanceMode = 'auto' | 'daylight' | 'cloudy' | 'fluorescent' | 'incandescent' | 'custom';

export interface WhiteBalanceSettings {
  mode: WhiteBalanceMode;
  temperature?: number; // Kelvin, for custom mode
  tint?: number; // Green-Magenta shift
}

import TextRecognition from '@react-native-ml-kit/text-recognition';
import { CatalogItem } from '../types';

/**
 * OCR Service for clothing tag reading.
 *
 * Uses @react-native-ml-kit/text-recognition — Google ML Kit bundled on-device.
 * - 100% FREE: no API key, no billing account, no network call required
 * - Works offline
 * - Runs entirely on the device (iOS Core ML / Android ML Kit)
 * - No base64 encoding — passes the file URI directly
 */

// ── OCR Text Extraction ──────────────────────────────────────────────────────

/**
 * Extract text from an image using on-device ML Kit text recognition.
 * Accepts a local file URI — no encoding, no network, no cost.
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    // Join all detected text blocks into a single string
    return result.blocks.map(block => block.text).join('\n');
  } catch (error) {
    console.error('On-device OCR error:', error);
    return '';
  }
}

// ── Smart Field Parsing ──────────────────────────────────────────────────────

const FABRIC_KEYWORDS = [
  'cotton', 'polyester', 'nylon', 'silk', 'wool', 'linen', 'rayon',
  'spandex', 'elastane', 'lycra', 'cashmere', 'acrylic', 'viscose',
  'modal', 'tencel', 'bamboo', 'hemp', 'leather', 'suede', 'denim',
  'chiffon', 'satin', 'velvet', 'fleece', 'jersey', 'tweed', 'organza',
];

const SIZE_PATTERNS = [
  /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/i,
  /\b(size\s*)?(\d{1,2})\b/i,
  /\b(\d{2})\s*[xX×]\s*(\d{2})\b/,
  /\b(EU|EUR)\s*(\d{2})\b/i,
];

// Bolt: Updatable brand mapping for accurate formatting and fast lookups
const BRAND_CONFIG: Record<string, string> = {
  nike: 'Nike',
  adidas: 'Adidas',
  gucci: 'Gucci',
  prada: 'Prada',
  zara: 'Zara',
  'h&m': 'H&M',
  uniqlo: 'Uniqlo',
  'ralph lauren': 'Ralph Lauren',
  polo: 'Polo',
  'tommy hilfiger': 'Tommy Hilfiger',
  'calvin klein': 'Calvin Klein',
  gap: 'GAP',
  'banana republic': 'Banana Republic',
  'j.crew': 'J.Crew',
  'j crew': 'J.Crew',
  'brooks brothers': 'Brooks Brothers',
  levi: "Levi's",
  levis: "Levi's",
  "levi's": "Levi's",
  wrangler: 'Wrangler',
  lee: 'Lee',
  diesel: 'Diesel',
  coach: 'Coach',
  'michael kors': 'Michael Kors',
  'kate spade': 'Kate Spade',
  'tory burch': 'Tory Burch',
  burberry: 'Burberry',
  'louis vuitton': 'Louis Vuitton',
  chanel: 'Chanel',
  hermes: 'Hermès',
  'hermès': 'Hermès',
  versace: 'Versace',
  armani: 'Armani',
  dolce: 'Dolce & Gabbana',
  fendi: 'Fendi',
  balenciaga: 'Balenciaga',
  givenchy: 'Givenchy',
  'saint laurent': 'Saint Laurent',
  ysl: 'YSL',
  valentino: 'Valentino',
  'alexander mcqueen': 'Alexander McQueen',
  equipment: 'Equipment',
  theory: 'Theory',
  vince: 'Vince',
  'eileen fisher': 'Eileen Fisher',
  'free people': 'Free People',
  anthropologie: 'Anthropologie',
  madewell: 'Madewell',
  everlane: 'Everlane',
  reformation: 'Reformation',
  patagonia: 'Patagonia',
  'north face': 'The North Face',
  columbia: 'Columbia',
  "arc'teryx": "Arc'teryx",
  lululemon: 'Lululemon',
  athleta: 'Athleta',
  'under armour': 'Under Armour',
  'new balance': 'New Balance',
};

const KNOWN_BRANDS = Object.keys(BRAND_CONFIG);

const PERCENT_PATTERN = /(\d{1,3})\s*%\s*([a-zA-Z]+)/g;
const MADE_IN_PATTERN = /made\s+in\s+([A-Za-z\s]+)/i;
const CARE_KEYWORDS = ['machine wash', 'hand wash', 'dry clean', 'tumble dry', 'hang dry',
  'do not bleach', 'iron low', 'iron medium', 'cold water', 'warm water'];

/**
 * Parse OCR text from a clothing tag and extract structured fields.
 * Bolt: Optimized with pre-computed maps and static constants to minimize allocation/CPU cycles in hot path.
 */
export function parseTagText(rawText: string): Partial<CatalogItem> {
  const text = rawText.trim();
  if (!text) return {};

  const lowerText = text.toLowerCase();
  const result: Partial<CatalogItem> = {};

  // ── Brand Detection ──
  // Bolt: Instant Title Case via BRAND_CONFIG map avoids expensive .split().map().join()
  for (let i = 0; i < KNOWN_BRANDS.length; i++) {
    const brand = KNOWN_BRANDS[i];
    if (lowerText.indexOf(brand) !== -1) {
      result.designerBrand = BRAND_CONFIG[brand];
      break;
    }
  }

  // ── Size Detection ──
  for (let i = 0; i < SIZE_PATTERNS.length; i++) {
    const match = text.match(SIZE_PATTERNS[i]);
    if (match) {
      if (match[0].indexOf('x') !== -1 || match[0].indexOf('X') !== -1 || match[0].indexOf('×') !== -1) {
        result.size = match[0].toUpperCase();
      } else {
        result.size = (match[2] || match[1] || match[0]).toUpperCase();
      }
      break;
    }
  }

  // ── Fabric/Material Detection ──
  const fabricMatches: string[] = [];
  let percentMatch;
  // Reset lastIndex for global regex
  PERCENT_PATTERN.lastIndex = 0;
  while ((percentMatch = PERCENT_PATTERN.exec(text)) !== null) {
    fabricMatches.push(`${percentMatch[1]}% ${percentMatch[2]}`);
  }

  if (fabricMatches.length > 0) {
    result.fabricMaterial = fabricMatches.join(', ');
  } else {
    // Bolt: Use simple for loop for filtering to avoid overhead
    const found: string[] = [];
    for (let i = 0; i < FABRIC_KEYWORDS.length; i++) {
      if (lowerText.indexOf(FABRIC_KEYWORDS[i]) !== -1) {
        const f = FABRIC_KEYWORDS[i];
        found.push(f.charAt(0).toUpperCase() + f.slice(1));
      }
    }
    if (found.length > 0) {
      result.fabricMaterial = found.join(', ');
    }
  }

  // ── Country of Origin ──
  const madeInMatch = text.match(MADE_IN_PATTERN);
  if (madeInMatch) {
    result.notes = `Made in ${madeInMatch[1].trim()}`;
  }

  // ── Care Instructions ──
  // Bolt: CARE_KEYWORDS moved to static constant
  const careFound: string[] = [];
  for (let i = 0; i < CARE_KEYWORDS.length; i++) {
    if (lowerText.indexOf(CARE_KEYWORDS[i]) !== -1) {
      careFound.push(CARE_KEYWORDS[i]);
    }
  }

  if (careFound.length > 0) {
    const careNote = `Care: ${careFound.join(', ')}`;
    result.notes = result.notes ? `${result.notes}. ${careNote}` : careNote;
  }

  return result;
}

/**
 * Full OCR pipeline: pass image URI → on-device text extraction → parse fields.
 * No API key. No network. No cost.
 */
export async function scanTag(imageUri: string): Promise<{
  rawText: string;
  parsedFields: Partial<CatalogItem>;
  confidence: 'high' | 'medium' | 'low';
}> {
  const rawText = await extractTextFromImage(imageUri);

  if (!rawText) {
    return { rawText: '', parsedFields: {}, confidence: 'low' };
  }

  const parsedFields = parseTagText(rawText);
  const fieldCount = Object.keys(parsedFields).filter(
    k => parsedFields[k as keyof typeof parsedFields]
  ).length;

  const confidence = fieldCount >= 3 ? 'high' : fieldCount >= 1 ? 'medium' : 'low';

  return { rawText, parsedFields, confidence };
}

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

const KNOWN_BRANDS = [
  'nike', 'adidas', 'gucci', 'prada', 'zara', 'h&m', 'uniqlo',
  'ralph lauren', 'polo', 'tommy hilfiger', 'calvin klein', 'gap',
  'banana republic', 'j.crew', 'j crew', 'brooks brothers',
  'levi', 'levis', "levi's", 'wrangler', 'lee', 'diesel',
  'coach', 'michael kors', 'kate spade', 'tory burch', 'burberry',
  'louis vuitton', 'chanel', 'hermes', 'hermès', 'versace',
  'armani', 'dolce', 'fendi', 'balenciaga', 'givenchy',
  'saint laurent', 'ysl', 'valentino', 'alexander mcqueen',
  'equipment', 'theory', 'vince', 'eileen fisher', 'free people',
  'anthropologie', 'madewell', 'everlane', 'reformation',
  'patagonia', 'north face', 'columbia', "arc'teryx",
  'lululemon', 'athleta', 'under armour', 'new balance',
];

/**
 * Parse OCR text from a clothing tag and extract structured fields.
 */
export function parseTagText(rawText: string): Partial<CatalogItem> {
  const text = rawText.trim();
  const lowerText = text.toLowerCase();
  const result: Partial<CatalogItem> = {};

  // ── Brand Detection ──
  for (const brand of KNOWN_BRANDS) {
    if (lowerText.includes(brand.toLowerCase())) {
      result.designerBrand = brand
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      break;
    }
  }

  // ── Size Detection ──
  for (const pattern of SIZE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].includes('x') || match[0].includes('X') || match[0].includes('×')) {
        result.size = match[0].toUpperCase();
      } else {
        result.size = (match[2] || match[1] || match[0]).toUpperCase();
      }
      break;
    }
  }

  // ── Fabric/Material Detection ──
  const fabricMatches: string[] = [];
  const percentPattern = /(\d{1,3})\s*%\s*([a-zA-Z]+)/g;
  let percentMatch;
  while ((percentMatch = percentPattern.exec(text)) !== null) {
    fabricMatches.push(`${percentMatch[1]}% ${percentMatch[2]}`);
  }

  if (fabricMatches.length > 0) {
    result.fabricMaterial = fabricMatches.join(', ');
  } else {
    const found = FABRIC_KEYWORDS.filter(f => lowerText.includes(f));
    if (found.length > 0) {
      result.fabricMaterial = found.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ');
    }
  }

  // ── Country of Origin ──
  const madeInMatch = text.match(/made\s+in\s+([A-Za-z\s]+)/i);
  if (madeInMatch) {
    result.notes = `Made in ${madeInMatch[1].trim()}`;
  }

  // ── Care Instructions ──
  const careKeywords = ['machine wash', 'hand wash', 'dry clean', 'tumble dry', 'hang dry',
    'do not bleach', 'iron low', 'iron medium', 'cold water', 'warm water'];
  const careFound = careKeywords.filter(c => lowerText.includes(c));
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

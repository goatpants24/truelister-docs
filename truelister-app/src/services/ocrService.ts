import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { CatalogItem } from '../types';

/**
 * OCR Service for clothing tag reading.
 * 
 * Uses Google Cloud Vision API (free tier: 1,000 requests/month)
 * for text detection. The Vision API requires base64 in its JSON payload —
 * this is the one unavoidable place, and we only send the already-compressed
 * catalog image (1-2MB), not the original.
 * 
 * For on-device OCR without API calls, swap in expo-text-extractor
 * or @react-native-ml-kit/text-recognition (requires EAS build).
 */

// Google Cloud Vision API key (free tier: 1,000 OCR/month)
let VISION_API_KEY = '';

export function setVisionApiKey(key: string) {
  VISION_API_KEY = key;
}

// ── OCR Text Extraction ──────────────────────────────────────────

/**
 * Extract text from an image using Google Cloud Vision API.
 * Vision API requires base64 in the JSON payload — unavoidable per API spec.
 * We only send the already-compressed (1-2MB) version, not the original.
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  if (!VISION_API_KEY) {
    console.warn('Vision API key not set. OCR unavailable.');
    return '';
  }

  try {
    const imageBase64 = await readAsStringAsync(imageUri, {
      encoding: EncodingType.Base64,
    });

    const body = {
      requests: [
        {
          image: { content: imageBase64 },
          features: [
            { type: 'TEXT_DETECTION', maxResults: 1 },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();
    const annotation = result.responses?.[0]?.fullTextAnnotation;
    return annotation?.text || '';
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

// ── Smart Field Parsing ──────────────────────────────────────────

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
  'patagonia', 'north face', 'columbia', 'arc\'teryx',
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
 * Full OCR pipeline: capture tag image → extract text → parse fields.
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

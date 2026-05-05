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
 * Extract text and logos from an image using Google Cloud Vision API.
 */
export async function annotateImage(imageUri: string): Promise<any> {
  if (!VISION_API_KEY) {
    console.warn('Vision API key not set. OCR unavailable.');
    return null;
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
            { type: 'LOGO_DETECTION', maxResults: 5 },
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
    return result.responses?.[0] || null;
  } catch (error) {
    console.error('OCR error:', error);
    return null;
  }
}

/** Legacy helper */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  const data = await annotateImage(imageUri);
  return data?.fullTextAnnotation?.text || '';
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
/**
 * Detect text from graphics/logos on the front or back of items.
 * Focuses on prominent phrases and brand names.
 */
export async function scanGraphic(imageUri: string): Promise<{
  detectedText: string;
  suggestedTitle?: string;
  foundBrand?: string;
  logos?: string[];
}> {
  const data = await annotateImage(imageUri);
  if (!data) return { detectedText: '' };

  const rawText = data.fullTextAnnotation?.text || '';
  const lines = rawText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 3);

  // 1. Brand Detection (Text based)
  let foundBrand = '';
  const lowerText = rawText.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lowerText.includes(brand.toLowerCase())) {
      foundBrand = brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // 2. Logo Detection
  const logos = data.logoAnnotations?.map((l: any) => l.description) || [];
  if (logos.length > 0 && !foundBrand) {
    foundBrand = logos[0];
  }

  // 3. Suggest a title based on the most prominent lines (usually the first few)
  const suggestedTitle = lines.slice(0, 3).join(' ');

  return {
    detectedText: rawText,
    suggestedTitle: suggestedTitle.length > 5 ? suggestedTitle : undefined,
    foundBrand,
    logos
  };
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

/**
 * AI Title & Price Suggestion (Integration Path)
 *
 * Template for LLM integration (Vertex AI / OpenAI / Anthropic).
 * This function should be called by the "AI Suggest" button in the form.
 */
export async function getAISuggestions(item: CatalogItem): Promise<{
  suggestedTitle: string;
  suggestedPrice: string;
  rationale: string;
}> {
  // Placeholder: In production, this would call an LLM with the item's
  // current fields and detected graphic text.

  const query = `Suggest a marketplace title and price for a ${item.designerBrand} ${item.category} in ${item.condition} condition.`;
  console.log('[AI] LLM Prompt Query:', query);

  // Simulated AI response
  return {
    suggestedTitle: item.designerBrand ? `${item.designerBrand} ${item.title}` : item.title,
    suggestedPrice: item.price || '29.99',
    rationale: "Based on brand historical sales and item condition."
  };
}

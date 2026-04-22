import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { IMAGE_CONFIG } from '../config';
import { ImageResult, WhiteBalanceSettings } from '../types';

const { MAX_SIZE_BYTES, TARGET_SIZE_BYTES, COMPRESS_QUALITY, MIN_QUALITY, MAX_WIDTH, MAX_HEIGHT } = IMAGE_CONFIG;

/**
 * White balance correction multipliers by preset.
 * Applied at capture time via the camera component's whiteBalance prop.
 * These values are stored as metadata for post-processing reference.
 */
export function getWhiteBalanceMultipliers(settings: WhiteBalanceSettings): {
  red: number;
  green: number;
  blue: number;
} {
  const presets: Record<string, { red: number; green: number; blue: number }> = {
    auto: { red: 1.0, green: 1.0, blue: 1.0 },
    daylight: { red: 1.0, green: 1.0, blue: 0.95 },
    cloudy: { red: 1.05, green: 1.0, blue: 0.9 },
    fluorescent: { red: 0.95, green: 1.0, blue: 1.1 },
    incandescent: { red: 0.85, green: 0.95, blue: 1.2 },
    custom: { red: 1.0, green: 1.0, blue: 1.0 },
  };

  if (settings.mode === 'custom' && settings.temperature) {
    const temp = settings.temperature;
    const red = temp < 6600 ? 1.0 : Math.min(1.3, 329.698727446 * Math.pow((temp / 100 - 60), -0.1332047592) / 255);
    const green = temp < 6600
      ? Math.min(1.2, 99.4708025861 * Math.log(temp / 100) - 161.1195681661) / 255
      : Math.min(1.2, 288.1221695283 * Math.pow((temp / 100 - 60), -0.0755148492) / 255);
    const blue = temp > 6600 ? 1.0 : Math.min(1.3, (138.5177312231 * Math.log(temp / 100 - 10) - 305.0447927307) / 255);
    return { red, green, blue };
  }

  return presets[settings.mode] || presets.auto;
}

/**
 * Get file size from URI without reading into memory.
 */
async function getFileSize(uri: string): Promise<number> {
  try {
    const file = new File(uri);
    return file.size || 0;
  } catch {
    return 0;
  }
}

/**
 * Compress an image to fit within 1-2MB.
 * Works entirely with file URIs — never loads full image into JS memory as base64.
 * Uses iterative JPEG quality reduction, then dimension scaling as fallback.
 */
export async function compressImage(uri: string): Promise<ImageResult> {
  const originalSize = await getFileSize(uri);

  // Already under target — just ensure dimensions are capped
  if (originalSize > 0 && originalSize <= TARGET_SIZE_BYTES) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
      { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileSize: await getFileSize(result.uri),
    };
  }

  // Iterative quality reduction
  let quality = COMPRESS_QUALITY;
  let result: ImageManipulator.ImageResult;
  let resultSize: number;

  do {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
      { compress: Math.max(quality, MIN_QUALITY), format: ImageManipulator.SaveFormat.JPEG }
    );
    resultSize = await getFileSize(result.uri);
    quality -= 0.1;
  } while (resultSize > MAX_SIZE_BYTES && quality >= MIN_QUALITY);

  // Fallback: scale dimensions down if quality alone wasn't enough
  if (resultSize > MAX_SIZE_BYTES) {
    const scaleFactor = Math.sqrt(TARGET_SIZE_BYTES / resultSize);
    const newWidth = Math.round(MAX_WIDTH * scaleFactor);
    const newHeight = Math.round(MAX_HEIGHT * scaleFactor);

    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: newWidth, height: newHeight } }],
      { compress: MIN_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );
    resultSize = await getFileSize(result.uri);
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    fileSize: resultSize,
  };
}

/**
 * Full image pipeline: white balance is applied at capture time by the camera,
 * then we compress the result. Returns file URIs only — no base64 anywhere.
 */
export async function processImage(
  uri: string,
  _whiteBalance: WhiteBalanceSettings
): Promise<{ compressed: ImageResult; originalUri: string }> {
  // Original URI preserved for Google Drive upload (binary stream)
  const originalUri = uri;

  // Compress for catalog/marketplace use (stays as file URI)
  const compressed = await compressImage(uri);

  return { compressed, originalUri };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

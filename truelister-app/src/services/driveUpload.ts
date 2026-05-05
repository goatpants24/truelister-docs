import {
  uploadAsync,
  FileSystemUploadType,
} from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import { GOOGLE_DRIVE_CONFIG } from '../config';

/**
 * Upload original photo to Google Drive.
 *
 * Uses multipart/form-data with binary file streams — no base64 encoding.
 * This avoids the ~33% size bloat that base64 adds.
 *
 * Two approaches available:
 * 1. Direct Google Drive API with resumable upload (binary, requires OAuth2 token)
 * 2. Google Apps Script web app with uploadAsync (binary multipart)
 */

// Apps Script endpoint for file upload (set after deploying the script)
let UPLOAD_ENDPOINT = '';

export function setUploadEndpoint(url: string) {
  UPLOAD_ENDPOINT = url;
}

/**
 * Upload a file to Google Drive via Apps Script web app.
 * Uses uploadAsync for binary multipart — no base64 bloat.
 */
export async function uploadToDrive(
  fileUri: string,
  fileName: string,
  itemNumber: string
): Promise<{ success: boolean; driveUrl?: string; error?: string }> {
  if (!UPLOAD_ENDPOINT) {
    return {
      success: false,
      error: 'Drive upload not configured. Original saved locally. See README to set up Google Apps Script.',
    };
  }

  try {
    const fullFileName = `${itemNumber}_${fileName}`;

    // Binary multipart upload — no base64 conversion
    const uploadResult = await uploadAsync(UPLOAD_ENDPOINT, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      parameters: {
        fileName: fullFileName,
        mimeType: 'image/jpeg',
        folderId: GOOGLE_DRIVE_CONFIG.PHOTOS_FOLDER_ID || '',
        itemNumber,
      },
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      const result = JSON.parse(uploadResult.body);
      return {
        success: true,
        driveUrl: result.fileUrl || result.webViewLink,
      };
    }

    return { success: false, error: `Upload returned status ${uploadResult.status}` };
  } catch (error) {
    return {
      success: false,
      error: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Upload using direct Google Drive API with resumable upload (binary stream).
 * This is the most efficient method — sends raw bytes, no encoding overhead.
 * Requires OAuth2 access token.
 */
export async function uploadToDriveAPI(
  fileUri: string,
  fileName: string,
  accessToken: string,
  folderId?: string
): Promise<{ success: boolean; driveUrl?: string; fileId?: string; error?: string }> {
  try {
    // Step 1: Initiate resumable upload session
    const metadata = {
      name: fileName,
      mimeType: 'image/jpeg',
      parents: folderId ? [folderId] : undefined,
    };

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(metadata),
      }
    );

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      return { success: false, error: 'Failed to initiate resumable upload' };
    }

    // Step 2: Upload the binary file directly via uploadAsync
    // This streams the raw file bytes — zero encoding overhead
    const uploadResult = await uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'PUT',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      const result = JSON.parse(uploadResult.body);
      return {
        success: true,
        fileId: result.id,
        driveUrl: `https://drive.google.com/file/d/${result.id}/view`,
      };
    }

    return { success: false, error: `Upload returned status ${uploadResult.status}` };
  } catch (error) {
    return {
      success: false,
      error: `API upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get file size without reading the entire file into memory
 */
export async function getFileSize(uri: string): Promise<number> {
  try {
    const file = new File(uri);
    return file.size || 0;
  } catch {
    return 0;
  }
}

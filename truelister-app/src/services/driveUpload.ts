import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  uploadAsync,
  FileSystemUploadType,
} from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import { GOOGLE_DRIVE_CONFIG } from '../config';
import { isValidAppsScriptUrl } from './sheets';

// AsyncStorage keys — must stay in sync with SettingsScreen
const SETTINGS_KEYS = {
  APPS_SCRIPT_URL: 'settings_apps_script_url',
  DRIVE_FOLDER_ID: 'settings_drive_folder_id',
};

/**
 * Upload original photo to Google Drive via Apps Script web app.
 *
 * Uses multipart/form-data with binary file streams — no base64 encoding.
 * This avoids the ~33% size bloat that base64 adds.
 *
 * Both the endpoint URL and Drive folder ID are read from AsyncStorage at
 * call time, so the user can configure them in the Settings tab without
 * needing to rebuild or restart the app.
 */
export async function uploadToDrive(
  fileUri: string,
  fileName: string,
  itemNumber: string
): Promise<{ success: boolean; driveUrl?: string; error?: string }> {
  // Read both values from AsyncStorage at call time — no restart needed after settings change
  const uploadEndpoint = (await AsyncStorage.getItem(SETTINGS_KEYS.APPS_SCRIPT_URL))?.trim() ?? '';
  const folderId =
    (await AsyncStorage.getItem(SETTINGS_KEYS.DRIVE_FOLDER_ID))?.trim() ||
    GOOGLE_DRIVE_CONFIG.PHOTOS_FOLDER_ID ||
    '';

  if (!uploadEndpoint) {
    return {
      success: false,
      error: 'Drive upload not configured. Open the Settings tab and add your Apps Script URL.',
    };
  }

  if (!isValidAppsScriptUrl(uploadEndpoint)) {
    return {
      success: false,
      error: 'Security Error: Invalid Apps Script URL domain.',
    };
  }

  try {
    const fullFileName = `${itemNumber}_${fileName}`;

    // Binary multipart upload — no base64 conversion
    const uploadResult = await uploadAsync(uploadEndpoint, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      parameters: {
        fileName: fullFileName,
        mimeType: 'image/jpeg',
        folderId,
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
 * Requires OAuth2 access token (advanced use case).
 */
export async function uploadToDriveAPI(
  fileUri: string,
  fileName: string,
  accessToken: string,
  folderId?: string
): Promise<{ success: boolean; driveUrl?: string; fileId?: string; error?: string }> {
  try {
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

    // Streams raw file bytes — zero encoding overhead
    const uploadResult = await uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'PUT',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Content-Type': 'image/jpeg' },
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

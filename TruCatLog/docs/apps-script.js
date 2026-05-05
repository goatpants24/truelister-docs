/**
 * TrueLister — Google Apps Script Web App
 * 
 * Deploy this as a web app to enable the mobile app to:
 *   1. Append new items to the Google Sheet
 *   2. Upload original photos to Google Drive (binary multipart)
 * 
 * SETUP:
 *   1. Open Google Apps Script: https://script.google.com
 *   2. Create a new project, paste this code
 *   3. Update SPREADSHEET_ID and DRIVE_FOLDER_ID below
 *   4. Deploy > New deployment > Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Copy the deployment URL into the app's config
 */

const SPREADSHEET_ID = '1QHrXKkuh-6bNUyeYgp8jZrdP3t8MzBSyx-8k-GjFOcI';
const SHEET_NAME = 'Inventory';
const DRIVE_FOLDER_ID = ''; // Create a folder in Drive and paste its ID here

function doPost(e) {
  try {
    const contentType = e.postData?.type || '';

    // Handle multipart file uploads (binary — no base64 bloat)
    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(e);
    }

    // Handle JSON requests (append item, etc.)
    const payload = JSON.parse(e.postData.contents);

    switch (payload.action) {
      case 'ping':
        return jsonResponse({ success: true, message: 'pong' });
      case 'append':
        return appendRow(payload.data);
      case 'uploadPhoto':
        // Fallback JSON upload for environments that can't do multipart
        return uploadPhotoFromJson(payload);
      default:
        return jsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'TrueLister API is running' });
}

/**
 * Append a row to the Inventory sheet
 */
function appendRow(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  sheet.appendRow(data);
  return jsonResponse({ success: true, row: sheet.getLastRow() });
}

/**
 * Handle binary multipart file upload to Google Drive.
 * The mobile app sends the file as multipart/form-data — raw bytes, no base64.
 */
function handleFileUpload(e) {
  const blobs = e.parameter;
  const fileBlob = e.postData?.contents
    ? Utilities.newBlob(e.postData.contents, e.postData.type)
    : null;

  if (!fileBlob) {
    return jsonResponse({ success: false, error: 'No file data received' });
  }

  const fileName = blobs.fileName || 'photo.jpg';
  const itemNumber = blobs.itemNumber || '';
  const folderId = blobs.folderId || DRIVE_FOLDER_ID;

  // Get or create item subfolder
  const parentFolder = folderId
    ? DriveApp.getFolderById(folderId)
    : DriveApp.getRootFolder();

  let itemFolder;
  if (itemNumber) {
    const folders = parentFolder.getFoldersByName(itemNumber);
    itemFolder = folders.hasNext() ? folders.next() : parentFolder.createFolder(itemNumber);
  } else {
    itemFolder = parentFolder;
  }

  fileBlob.setName(fileName);
  const file = itemFolder.createFile(fileBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonResponse({
    success: true,
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    webViewLink: `https://drive.google.com/file/d/${file.getId()}/view`,
    downloadLink: `https://drive.google.com/uc?id=${file.getId()}&export=download`,
  });
}

/**
 * Fallback: upload photo from JSON payload (for environments that can't do multipart).
 * This is the ONLY place base64 is used, and only as a last resort.
 */
function uploadPhotoFromJson(payload) {
  const { fileName, mimeType, data, folderId, itemNumber } = payload;

  if (!data) {
    return jsonResponse({ success: false, error: 'No image data' });
  }

  const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType || 'image/jpeg', fileName);
  const parentFolder = (folderId || DRIVE_FOLDER_ID)
    ? DriveApp.getFolderById(folderId || DRIVE_FOLDER_ID)
    : DriveApp.getRootFolder();

  let itemFolder;
  if (itemNumber) {
    const folders = parentFolder.getFoldersByName(itemNumber);
    itemFolder = folders.hasNext() ? folders.next() : parentFolder.createFolder(itemNumber);
  } else {
    itemFolder = parentFolder;
  }

  const file = itemFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonResponse({
    success: true,
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    webViewLink: `https://drive.google.com/file/d/${file.getId()}/view`,
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

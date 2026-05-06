# TrueLister Scope Audit & Handshake Map

This report details the results of a rapid scope audit performed on the TrueLister Expo application, alongside a complete mapping of the system's external handshakes (data flow between the app and external services).

## 1. Scope Audit Results

During the audit of the application's source files, we checked for scope drift, broken wiring, and hardcoded placeholders that would block functionality. 

**Finding:** One instance of scope drift/broken wiring was identified and immediately patched.
**The Issue:** The `SettingsScreen` was correctly saving the user's Google Apps Script URL and Google Drive Folder ID to local device storage (`AsyncStorage`). However, the actual service files (`sheets.ts` and `driveUpload.ts`) were not wired to read from that storage at runtime. Instead, they were still using hardcoded empty strings (`''`). This meant that even if a user entered their configuration in the Settings tab, the app would fail to upload photos or save items.
**The Fix:** Both `sheets.ts` and `driveUpload.ts` were rewritten to asynchronously read the configuration keys from `AsyncStorage` at the exact moment an upload or save is triggered. This ensures the app respects the user's settings without requiring an app restart. The fix was committed and pushed to the repository.

The TypeScript compiler (`tsc --noEmit`) confirmed zero type errors across the entire project after these changes.

---

## 2. System Handshake Map

TrueLister operates as a "serverless" mobile application. It does not have a traditional backend database (like PostgreSQL or MongoDB) or a custom Node/Python API. Instead, it uses Google's ecosystem (Sheets, Drive, and Cloud Vision) as its backend. 

Here is exactly how the app shakes hands with these external services to function:

### A. Reading the Catalog (Google Sheets API v4)
When the user opens the **Inventory** tab, the app needs to download the current catalog.
* **Handshake:** The app makes an HTTP GET request to the public Google Sheets CSV export URL.
* **Auth:** No authentication is required because the Google Sheet is set to "Anyone with the link can view".
* **Flow:** `HomeScreen` → calls `fetchInventory()` in `sheets.ts` → downloads CSV → parses rows into `CatalogItem` objects → displays the list.
* **Dropdowns:** The same process is used to fetch the reference values (categories, sizes, conditions) from the "Dropdowns" tab of the sheet.

### B. Writing a New Item (Google Apps Script)
When the user fills out a new item and taps **Save**, the app needs to append a row to the Google Sheet. Mobile apps cannot securely hold Google OAuth credentials for write access without a complex login flow.
* **Handshake:** The app makes an HTTP POST request to a Google Apps Script Web App URL (configured in the app's Settings tab).
* **Auth:** The Apps Script is deployed to execute as the Google account owner, bypassing the need for the mobile app to authenticate.
* **Flow:** `ItemFormScreen` → calls `appendItem()` in `sheets.ts` → sends JSON payload to Apps Script → Apps Script appends the row to the sheet → returns success to the app.

### C. Uploading Original Photos (Google Drive via Apps Script)
When the user takes a photo, the app compresses it for the catalog but also needs to save the high-resolution original to a Google Drive folder.
* **Handshake:** The app uses Expo's `FileSystem.uploadAsync` to send a binary multipart stream to the same Google Apps Script Web App.
* **Auth:** Again, handled by the Apps Script executing as the owner.
* **Flow:** `CameraScreen` captures photo → `ItemFormScreen` saves item → calls `uploadToDrive()` in `driveUpload.ts` → streams raw bytes (no base64 bloat) to Apps Script → Apps Script creates a subfolder for the item number and saves the JPEG → returns the Drive URL.
* **Offline Fallback:** If the upload fails (e.g., no internet), the app saves the local file path to `AsyncStorage` as a "pending upload" to be retried later.

### D. Scanning Clothing Tags (Google Cloud Vision API)
When the user taps "Scan Tag" and photographs a clothing label, the app needs to read the text and parse out the brand, size, and fabric.
* **Handshake:** The app makes an HTTP POST request to the Google Cloud Vision `images:annotate` endpoint.
* **Auth:** Authenticated via a Google Cloud API Key (configured in the app's Settings tab).
* **Flow:** `TagScanner` captures photo → compresses it to reduce payload size → converts to base64 (required by Vision API) → calls `scanTag()` in `ocrService.ts` → sends to Google → receives raw text → runs local Regex patterns to extract size, brand, and fabric → populates the form fields.

### E. Local State (AsyncStorage)
When the app is offline, or when storing user preferences, it shakes hands with the device's local storage.
* **Handshake:** The app reads/writes JSON strings to the device's secure local storage via `@react-native-async-storage/async-storage`.
* **Flow:** Used for saving Draft items (`DraftsScreen`), queuing pending Drive uploads, and persisting user configurations from the `SettingsScreen`.

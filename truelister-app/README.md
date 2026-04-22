# TrueLister

Cross-platform catalog and inventory management app for marketplace sellers. Built with Expo (React Native), backed by Google Sheets and Google Drive.

**Runs on iOS, Android, and can be developed on iMac/PC.**

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Catalog Form | Ready | Full item entry with 15 fields, dropdowns from Google Sheet |
| Camera Capture | Ready | Photograph items with white balance adjustment |
| Image Compression | Ready | Auto-compress to 1-2 MB max, iterative quality + dimension scaling |
| Tag OCR | Ready | Scan clothing tags to auto-fill brand, size, fabric, care instructions |
| Google Sheets Sync | Ready (read) | Reads inventory and dropdown values from the shared Google Sheet |
| Google Drive Upload | Ready | Upload originals via binary multipart (no base64 bloat) |
| Offline Drafts | Ready | Save items locally when offline, sync later |
| Write to Sheet | Needs Apps Script | Requires deploying the included Google Apps Script |

---

## Quick Start

### 1. Install Expo Go on your phone

- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 2. Clone and run

```bash
git clone https://github.com/goatpants24/truelister-docs.git
cd truelister-app
yarn install
npx expo start
```

Scan the QR code with Expo Go on your phone. The app loads instantly.

### 3. Developing on iMac

Open the project in VS Code or any editor. Changes hot-reload on your phone via Expo Go. No Xcode or Android Studio needed for development.

---

## Google Sheet

The catalog data lives in a Google Sheet that's already set up:

**[TrueLister Catalog](https://docs.google.com/spreadsheets/d/1QHrXKkuh-6bNUyeYgp8jZrdP3t8MzBSyx-8k-GjFOcI/edit)**

The app reads from this sheet automatically (shared with "anyone with link"). The **Inventory** sheet has these columns:

| Column | Field | Type |
|--------|-------|------|
| A | Item # | Auto-generated (TL-001, TL-002...) |
| B | Title | Text |
| C | Designer/Brand | Text (OCR-detected from tags) |
| D | Category | Dropdown |
| E | Size | Text (OCR-detected from tags) |
| F | Condition | Dropdown |
| G | Fabric/Material | Text (OCR-detected from tags) |
| H | Measurements | Text |
| I | Color | Dropdown |
| J | Sale Status | Dropdown |
| K | Price | Number |
| L | Photo URL | Google Drive link |
| M | Marketplace | Dropdown |
| N | Date Listed | Date |
| O | Notes | Text (includes care instructions from OCR) |

The **Dropdowns** sheet provides the picker values (Category, Condition, Sale Status, Marketplace, Color, Size). Edit that sheet to customize your options.

---

## Enable Write Access (Google Apps Script)

The app reads from the sheet by default. To enable **writing** new items and **uploading** photos to Drive:

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Paste the contents of `docs/apps-script.js`
4. Update `DRIVE_FOLDER_ID` with your Google Drive folder ID
5. Deploy as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the deployment URL
7. Paste it into `src/config/index.ts` (or the Apps Script URL field in the services)

---

## Enable Tag OCR

The tag scanner uses Google Cloud Vision API for text recognition:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Cloud Vision API**
3. Create an API key (restrict to Vision API only)
4. Add the key to `src/services/ocrService.ts` via `setVisionApiKey()`

**Free tier**: 1,000 OCR requests per month.

For on-device OCR (no API key, no network needed), install `expo-text-extractor` and use an EAS build. See the commented code in `ocrService.ts`.

---

## Image Handling

All image operations use **file URIs and binary streams** — no base64 encoding anywhere in the pipeline (except the Vision OCR API which requires it in its spec, and only receives the already-compressed 1-2MB version).

| Stage | Method | Size |
|-------|--------|------|
| Capture | Full quality from camera | Original (5-12 MB) |
| White Balance | Applied at capture time via camera preset | Same |
| Compression | Iterative JPEG quality reduction + dimension scaling | 1-2 MB max |
| Drive Upload | Binary multipart via `FileSystem.uploadAsync` | Original size |
| Sheet Reference | Google Drive URL stored in Photo URL column | N/A |

The original full-quality photo goes to Google Drive. The compressed version is used for catalog display.

---

## Project Structure

```
truelister-app/
├── App.tsx                          # Root component with screen navigation
├── src/
│   ├── config/index.ts              # Google Sheets/Drive IDs, image settings
│   ├── types/index.ts               # TypeScript interfaces
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Inventory list with pull-to-refresh
│   │   ├── ItemFormScreen.tsx       # Item entry form with camera + OCR
│   │   └── CameraScreen.tsx         # Camera with white balance controls
│   ├── components/
│   │   ├── WhiteBalancePicker.tsx   # WB preset selector (Auto/Sun/Cloud/Fluor/Bulb)
│   │   └── TagScanner.tsx           # OCR tag scanning with field parsing
│   └── services/
│       ├── sheets.ts                # Google Sheets read/write via CSV + API
│       ├── driveUpload.ts           # Binary multipart upload to Google Drive
│       ├── imageProcessor.ts        # Compression pipeline (no base64)
│       ├── ocrService.ts            # Cloud Vision OCR + smart tag parsing
│       └── localStorage.ts          # AsyncStorage for drafts + pending uploads
├── docs/
│   └── apps-script.js              # Google Apps Script for write access
└── assets/                          # App icons and splash screen
```

---

## Next Steps

These features are planned for upcoming iterations:

1. **Voice Input** — Dictate item titles and descriptions using Expo Speech
2. **Batch Photo Mode** — Photograph multiple items in sequence
3. **Marketplace Auto-List** — Push listings to eBay/Poshmark/Mercari APIs
4. **Barcode/UPC Scanner** — Look up items by barcode
5. **Analytics Dashboard** — Sales tracking and inventory stats
6. **Multi-user Support** — Share catalogs between team members

---

## Tech Stack

- **Expo SDK 54** — Cross-platform React Native framework
- **TypeScript** — Type safety throughout
- **Google Sheets API** — Catalog data backend (free)
- **Google Drive API** — Original photo storage (free, 15 GB)
- **Google Cloud Vision** — OCR for tag reading (free tier: 1,000/month)
- **AsyncStorage** — Offline draft persistence
- **expo-camera** — Camera with white balance presets
- **expo-image-manipulator** — JPEG compression pipeline
- **expo-file-system** — Binary file operations (no base64)

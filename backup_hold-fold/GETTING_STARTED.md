# TrueLister — Getting Started

Everything you need to run TrueLister on your iPhone, Android device, and develop on your iMac.

---

## What's Been Built

| Component | Status | Location |
|-----------|--------|----------|
| Expo React Native App | ✅ Ready | `truelister-app/` in this repo |
| Google Sheet (Catalog) | ✅ Live | [Open Sheet](https://docs.google.com/spreadsheets/d/1QHrXKkuh-6bNUyeYgp8jZrdP3t8MzBSyx-8k-GjFOcI/edit) |
| Camera + White Balance | ✅ Built | Auto / Daylight / Cloudy / Fluorescent / Incandescent |
| Image Compression | ✅ Built | 1–2 MB max, binary streams (no base64 bloat) |
| Tag OCR | ✅ Built | Scans brand, size, fabric, care instructions from tags |
| Google Drive Upload | ✅ Built | Binary multipart — originals stored per item folder |
| Offline Drafts | ✅ Built | Saves locally when offline, syncs when connected |
| Write to Sheet | ⚙️ Needs 5-min setup | Deploy the included Apps Script (instructions below) |

---

## Step 1 — Run on Your iPhone or Android Right Now

### Install Expo Go
- **iPhone**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Clone and start the app (on your iMac or any computer)

```bash
# Clone the repo
git clone https://github.com/goatpants24/truelister-docs.git
cd truelister-docs/truelister-app

# Install dependencies
yarn install

# Start the dev server
npx expo start
```

A QR code will appear in your terminal. Open Expo Go on your phone and scan it. The app loads instantly — no build required.

### If you don't have a computer handy right now
You can open the project directly in a cloud IDE like [StackBlitz](https://stackblitz.com) or [Gitpod](https://gitpod.io) by pointing it at `https://github.com/goatpants24/truelister-docs` — then scan the QR from there.

---

## Step 2 — Enable Writing to the Google Sheet (5 minutes)

The app reads from the sheet automatically. To **save new items** from the app into the sheet, deploy the included Google Apps Script:

1. Go to [script.google.com](https://script.google.com) and click **New project**
2. Delete the default code and paste the contents of `truelister-app/docs/apps-script.js`
3. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and copy the URL it gives you
5. Open `truelister-app/src/services/sheets.ts` and paste the URL into the `APPS_SCRIPT_URL` constant

That's it — new items entered in the app will now appear in your Google Sheet.

---

## Step 3 — Enable Original Photo Storage in Google Drive (5 minutes)

1. Create a folder in your [Google Drive](https://drive.google.com) called **TrueLister Photos**
2. Open the folder, copy the folder ID from the URL:
   `https://drive.google.com/drive/folders/`**`THIS_PART_IS_THE_ID`**
3. Paste the ID into two places:
   - `truelister-app/src/config/index.ts` → `GOOGLE_DRIVE_CONFIG.PHOTOS_FOLDER_ID`
   - `truelister-app/docs/apps-script.js` → `DRIVE_FOLDER_ID`

Photos will be organized automatically into subfolders by item number (e.g., `TL-001/`, `TL-002/`).

---

## Step 4 — Enable Tag OCR (Optional, Free Tier)

The tag scanner is built and ready — it just needs a Google Cloud Vision API key:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Cloud Vision API**
3. Go to **APIs & Services → Credentials → Create API Key**
4. Restrict the key to **Cloud Vision API** only
5. Open `truelister-app/src/services/ocrService.ts` and set:
   ```ts
   setVisionApiKey('YOUR_KEY_HERE');
   ```
   Or call `setVisionApiKey()` from `App.tsx` on startup.

**Free tier**: 1,000 tag scans per month at no cost.

---

## Developing on Your iMac

The project is standard TypeScript + React Native. Open `truelister-app/` in VS Code or any editor. Changes hot-reload on your phone via Expo Go — no Xcode or Android Studio required for development.

```bash
# Run with hot reload
npx expo start

# Type-check the entire project
npx tsc --noEmit

# Run on iOS Simulator (requires Xcode on Mac)
npx expo start --ios

# Run on Android Emulator (requires Android Studio)
npx expo start --android
```

---

## App Features at a Glance

### Home Screen
- Lists all catalog items pulled live from Google Sheet
- Pull down to refresh
- Color-coded status badges (Draft / Active / Sold / Reserved)
- Tap **+** to add a new item

### New Item Form
- Auto-generated item number (TL-001, TL-002...)
- **📷 Take Photo** — opens camera with white balance controls
- **🏷 Scan Tag** — OCR reads brand, size, fabric, care instructions and pre-fills the form (green highlight shows OCR-filled fields)
- All dropdowns (Category, Condition, Color, Marketplace, Sale Status) pull from the Dropdowns sheet — edit that sheet to customize your options
- Saves locally as draft if offline

### Camera Screen
- White balance presets: **Auto · Sun · Cloud · Fluor · Bulb**
- Full-quality capture → auto-compress to **1–2 MB**
- Preview shows compressed size and dimensions before confirming
- Pick from photo library as alternative

### Tag Scanner
- Dashed guide frame for alignment
- Confidence indicator (High / Medium / Low)
- Shows raw OCR text alongside parsed fields
- Detected fields merge into the form without overwriting anything you've already typed

---

## Project File Map

```
truelister-app/
├── App.tsx                          Root — screen navigation
├── src/
│   ├── config/index.ts              Sheet ID, Drive folder, image limits
│   ├── types/index.ts               TypeScript interfaces
│   ├── screens/
│   │   ├── HomeScreen.tsx           Inventory list
│   │   ├── ItemFormScreen.tsx       Item entry with camera + OCR
│   │   └── CameraScreen.tsx         Camera + white balance
│   ├── components/
│   │   ├── WhiteBalancePicker.tsx   WB preset bar
│   │   └── TagScanner.tsx           OCR tag scan + results
│   └── services/
│       ├── sheets.ts                Read/write Google Sheets (CSV + Apps Script)
│       ├── driveUpload.ts           Binary multipart upload to Drive
│       ├── imageProcessor.ts        Compression pipeline (file URIs only)
│       ├── ocrService.ts            Cloud Vision OCR + tag field parser
│       └── localStorage.ts          Offline drafts + pending upload queue
└── docs/
    └── apps-script.js              Deploy this for write access
```

---

## What's Next

These are the next features planned for TrueLister:

1. **Voice Input** — Dictate titles and descriptions hands-free
2. **Batch Photo Mode** — Photograph multiple items in sequence without re-entering the form
3. **Marketplace Auto-List** — Push listings to eBay, Poshmark, Mercari via their APIs
4. **Barcode / UPC Scanner** — Auto-fill item details from product barcode
5. **Analytics Dashboard** — Sales velocity, inventory value, days-to-sell
6. **Multi-user / Team Mode** — Share a catalog between multiple sellers

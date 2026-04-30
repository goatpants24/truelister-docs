# TruCatLog

Cross-platform catalog and inventory management app for marketplace sellers. Built with Expo (React Native), backed by Google Sheets and Google Drive. Formerly known as TrueLister.

**Runs on iOS, Android, and Web.**

---

## Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Smart Catalog Form** | Ready | Comprehensive item entry with 15+ fields and intelligent defaults. |
| **Multi-Photo Support** | Ready | Capture 8+ specific views (Card, Front, Back, Detail, Tabletop, Measure) for consistent listings. |
| **Market Research** | Ready | Integrated links to eBay Sold listings and Google Image search for price and label verification. |
| **Multi-Marketplace** | Ready | Track listings across multiple platforms (eBay, Mercari, Poshmark, etc.) simultaneously. |
| **Sold Signaling** | Ready | Prominent "Mark Sold" action with automatic reminders to remove listings from other markets. |
| **White Balance Lock** | Ready | Camera controls with explicit white balance locking to ensure color accuracy across photos. |
| **Tag OCR** | Ready | Scan clothing tags to auto-fill brand, size, fabric, and care instructions via AI. |
| **Data Export** | Ready | Generate CSV, HTML, and Marketplace templates for easy external use. |
| **Offline First** | Ready | Save items locally as drafts when offline; sync with Google Sheets when back online. |

---

## Quick Start

### 1. Install Expo Go on your phone

- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 2. Clone and run

```bash
git clone https://github.com/goatpants24/truelister-docs.git
cd truelister-app
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press **w** to open in your web browser.

---

## Integrated Research & AI

TruCatLog helps you stay in the right ballpark for pricing and labeling:

- **Market Sold**: Instantly check what similar items actually sold for on eBay.
- **Label Research**: Visual search for brand labels to confirm authenticity and dating.
- **AI Suggest (Beta)**: UI-ready for advanced LLM integrations to suggest titles and descriptions based on your photos.

---

## Image Handling & Color Space

All image operations are optimized for professional sellers:

- **Consistency**: All uploads are consistently formatted as high-quality JPEGs.
- **Color Accuracy**: Use the White Balance toggle to lock in the correct color space for your lighting environment.
- **No Bloat**: Original full-res photos go to Google Drive; optimized versions are used for the in-app catalog.

---

## Project Structure

```
truelister-app/
├── App.tsx                          # Root component with TruCatLog navigation
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Dashboard with List/Grid/Table views and Export
│   │   ├── ItemFormScreen.tsx       # Advanced form with multi-market and research
│   │   └── CameraScreen.tsx         # Pro camera with WB Locking
│   ├── components/
│   │   ├── WhiteBalancePicker.tsx   # Color space locking UI
│   │   ├── UndoRedoBar.tsx          # Form state history management
│   │   └── TagScanner.tsx           # AI-powered tag reading
│   └── services/
│       ├── sheets.ts                # Cloud data sync (Inventory & Dropdowns)
│       ├── ocrService.ts            # Vision AI integration
│       └── imageProcessor.ts        # Performance-tuned image pipeline
└── docs/
    └── apps-script.js              # Backend logic for Google Sheets/Drive
```

---

## Tech Stack

- **Expo SDK 54** — Modern React Native workflow
- **TypeScript** — Absolute type safety
- **Google Cloud Vision** — AI Text Detection
- **Google Workspace** — Sheets as a database, Drive as media storage
- **React Navigation** — Smooth, native-feeling transitions

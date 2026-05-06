# TruCatLog

**TruCatLog** is a professional-grade, cross-platform catalog and inventory management application designed specifically for marketplace sellers. It streamlines the process of item entry, photo documentation, and market research.

---

## 📱 For End Users

### Key Features
- **Smart Cataloging**: 15+ specialized fields for detailed item tracking.
- **Pro Photo Workflow**: Guided capture of 8+ essential views including specialized tabletop and measurement shots.
- **Color Consistency**: Built-in White Balance locking to ensure accurate color representation across your inventory.
- **Research Tools**: One-touch access to eBay Sold listings and Google Image search to verify pricing and labels.
- **Multi-Marketplace Management**: Track your listings across eBay, Mercari, Poshmark, and more.
- **AI-Powered Scanning**: Built-in OCR for reading clothing tags and auto-filling item details.

### Getting Started
1. **Open the App**: Use Expo Go on your mobile device.
2. **Connect your Catalog**: Enter your Google Sheet URL in the onboarding wizard.
3. **Configure Settings**: Follow the "Connectivity Health Check" to ensure your backend (Google Apps Script) is properly deployed.

---

## 🛠 For Developers

### Tech Stack
- **Framework**: Expo SDK 54 (React Native)
- **Language**: TypeScript
- **Backend**: Google Sheets API & Google Drive API
- **AI Services**: Google Cloud Vision (OCR)

### Project Structure
- `/src/screens`: Main application views (Camera, Form, Dashboard, etc.)
- `/src/components`: Reusable UI elements (TagScanner, UndoRedoBar)
- `/src/services`: Business logic for sync, image processing, and marketplace publishing.
- `/docs/apps-script.js`: The backend code to be deployed as a Google Apps Script Web App.

### Local Development
1. **Clone & Install**:
   ```bash
   git clone [repository-url]
   cd TruCatLog
   npm install
   ```
2. **Start Development Server**:
   ```bash
   npx expo start
   ```
3. **Environment Setup**:
   Ensure you have an EAS account if you plan to build standalone binaries. Project-specific IDs can be configured in `app.json`.

---

## 📜 Backend Deployment

The application relies on a Google Apps Script middle-layer.
1. Create a new Apps Script project at [script.google.com](https://script.google.com).
2. Copy the contents of `docs/apps-script.js` into the editor.
3. Deploy as a **Web App** with access set to "Anyone".
4. Copy the Web App URL into the TruCatLog app settings.

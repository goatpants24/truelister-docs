# TruCatLog: Usage & Integration Guide

Welcome to **TruCatLog**, your pro-grade cataloging and inventory management system. This guide covers how to use the app's advanced features and how to make them communicate with your existing seller ecosystems.

---

## 1. Quick Start (The Turnkey Setup)
TruCatLog is designed to work immediately.
- **Run**: Open the app in Expo Go.
- **Demo Mode**: If you're just exploring, tap **"Use default demo sheet"** on the first screen.
- **Connect**: To use your own data, paste your **Google Sheet URL** into the Onboarding Wizard. The app will automatically extract the ID and sync your inventory.

---

## 2. Advanced AI & Cataloging
### Graphic OCR & Logo Detection
When capturing the **Front** or **Back** of an item (e.g., a Graphic T-shirt):
- The AI automatically scans for text and logos.
- A **Confirmation Banner** will appear if data is found.
- Tap **"Confirm & Add"** to auto-fill the Brand and Title fields.

### Multi-Photo Support
Capture up to 8 specific views (Card, Front, Back, Detail, Tabletop, Measure). The "Card" photo is automatically used as the main thumbnail on your Home Grid.

### White Balance Locking
Tap the **WB** icon in the Camera UI to switch from **AUTO** to **LOCKED**. This ensures consistent colors across all photos for a single item, regardless of changes in room lighting.

---

## 3. Communication with APIs & Systems
### Google Sheets (The Source of Truth)
TruCatLog communicates with Google via two methods:
1. **Public CSV (Read)**: Uses the standard Google "Publish to Web" feature. Ensure your sheet is published as CSV for the Home Screen to load.
2. **Apps Script (Write)**: A custom API that appends new items and uploads photos to Drive.
   - **Configure**: Paste your deployment URL into **Settings > Write to Sheet**.
   - **Validate**: Use the **"Test Script Connection"** button in Settings to verify it's working.

### Nifty.ai Integration
TruCatLog works seamlessly with Nifty.ai via the **CSV Workflow**:
1. In the app, tap the **"⚙️ Export / Templates"** button on the Home Screen.
2. Select **"CSV"**.
3. Save or share the CSV file.
4. Upload this CSV directly into **Nifty.ai** or **List Perfectly** to blast your items across Poshmark, eBay, and Mercari.
5. *Tip*: Since TruCatLog already captures specialized views (Front, Back, Detail), your Nifty.ai listings will require significantly less manual adjustment.

---

## 4. Maintenance & Health
### Connection Health Checks
If you see an "Account" or "404" error:
- Go to **Settings**.
- Tap **"Test Connection"** on the Google Sheet section.
- The app will tell you if the sheet is private, missing, or improperly shared.

### Local Drafts
If you are in a warehouse with poor signal:
- Capture items as usual.
- The app will save them as **Local Drafts**.
- Once you're back on Wi-Fi, tap the **Drafts** tab to sync them all to Google Sheets at once.

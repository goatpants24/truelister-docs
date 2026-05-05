# TrueLister: Same-Day Deployment Guide

You can run TrueLister today on your iMac for development and on your iPhone for real-world cataloging. Because TrueLister is built with Expo, you don't need a paid Apple Developer account or Xcode to test it on your phone.

Here is the exact step-by-step process to get it running on both devices right now.

---

## Part 1: The iMac Setup (The Host)

Your iMac will act as the development host. It will run the bundler and serve the app to your iPhone over your local Wi-Fi network.

### 1. Install Prerequisites
Open the **Terminal** app on your iMac and ensure you have Node.js and Yarn installed. If you don't have them, the easiest way is via Homebrew:
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node and Yarn
brew install node yarn
```

### 2. Clone the Repository
Download the code from your GitHub repository to your iMac:
```bash
# Clone the repo to your Documents folder (or wherever you prefer)
cd ~/Documents
git clone https://github.com/goatpants24/truelister-docs.git

# Move into the app directory
cd truelister-docs/truelister-app
```

### 3. Install Dependencies & Start
Install the required packages and start the Expo development server:
```bash
yarn install
npx expo start
```
*When the server starts, you will see a large QR code printed directly in your Terminal window.*

---

## Part 2: The iPhone Setup (The Client)

Your iPhone will run the app by connecting to the Expo server running on your iMac.

### 1. Get Expo Go
1. Open the **App Store** on your iPhone.
2. Search for and install the free **Expo Go** app.

### 2. Connect to the iMac
1. Ensure your iPhone and your iMac are connected to the **exact same Wi-Fi network**.
2. Open the native **Camera** app on your iPhone.
3. Point the camera at the QR code displayed in your iMac's Terminal.
4. Tap the yellow **"Open in Expo Go"** banner that appears on your screen.

*The app will bundle (this takes about 30 seconds the first time) and then launch natively on your iPhone.*

---

## Part 3: The Google Handshake (Required for Saving)

Right now, the app can read your catalog, but if you tap "Save" on a new item, it will only save as an offline draft. To enable saving to your Google Sheet and uploading photos to Google Drive, you must deploy the Google Apps Script bridge.

### 1. Deploy the Apps Script
1. On your iMac, go to [script.google.com](https://script.google.com) and click **New Project**.
2. Name the project "TrueLister API".
3. Open the `truelister-docs/truelister-app/docs/apps-script.js` file from your cloned repo. Copy all the code inside it.
4. Paste the code into the Apps Script editor, replacing the default `myFunction()`.
5. At the top of the code, you will see a `DRIVE_FOLDER_ID` variable. 
   - Open Google Drive in a new tab.
   - Create a folder named "TrueLister Photos".
   - Open the folder and copy the ID from the URL (the long string of letters and numbers after `/folders/`).
   - Paste that ID into the `DRIVE_FOLDER_ID` variable in the script.
6. Click the **Save** icon (floppy disk).

### 2. Publish as a Web App
1. In the top right of the Apps Script editor, click **Deploy** → **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set the following options:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. (Google will ask you to authorize access to your Drive/Sheets. Click "Review permissions", choose your account, click "Advanced", and click "Go to TrueLister API (unsafe)" to grant access).
5. Copy the **Web app URL** provided on the final screen.

### 3. Connect the App
1. Open TrueLister on your iPhone (via Expo Go).
2. Tap the **Settings** tab (⚙️) at the bottom right.
3. Paste the **Web app URL** you just copied into the "Write to Sheet" field.
4. Tap **Save Settings**.

You are now fully deployed. You can take photos, scan tags, and save items directly from your iPhone to your Google Sheet and Drive.

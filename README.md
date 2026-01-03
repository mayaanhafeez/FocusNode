# FocusNode

A Chrome extension that helps you stay focused by blocking distracting websites. Built with React and Vite.

**FocusNode** is a pun on Node.js and "focus mode" - because staying focused should be as essential as Node.js is to modern development! 😄

## Features

- 🎯 **Toggle Focus Mode** - Quick on/off switch from the extension popup
- 🚫 **Block Distracting Sites** - Add websites to your block list in the settings
- 🔄 **Smart Redirects** - When you turn off focus mode on a blocked page, you're automatically redirected back to the original site
- 🎨 **Beautiful UI** - Modern, dark-themed interface built with React
- ⚡ **Fast & Lightweight** - Built with Vite for optimal performance

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Chromium-based browser (Chrome, Edge, Brave, etc.)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd FocusNode
```

### Step 2: Install Dependencies

```bash
cd focus-react
npm install
```

### Step 3: Build the React Application

The extension UI is built with React. You need to build it before loading the extension:

```bash
npm run build
```

This will compile the React app and place the built files in `../FocusModeWebsiteBlocker/dist/`.

### Step 4: Load the Extension in Chrome

1. Open your Chromium-based browser (Chrome, Edge, Brave, etc.)

2. Navigate to the extensions page:
   - **Chrome/Edge**: Go to `chrome://extensions/` or `edge://extensions/`
   - **Brave**: Go to `brave://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **"Load unpacked"** or **"Load extension"**

5. Navigate to and select the `FocusModeWebsiteBlocker` folder:
   ```
   FocusNode/FocusModeWebsiteBlocker
   ```

6. The extension should now appear in your extensions list!

### Step 5: Pin the Extension (Optional)

1. Click the puzzle piece icon (extensions icon) in your browser toolbar
2. Find "Focus Mode Blocker" in the list
3. Click the pin icon to keep it visible in your toolbar

## Usage

### Turning Focus Mode On/Off

1. Click the extension icon in your browser toolbar
2. Click the toggle button to turn Focus Mode ON or OFF
3. When ON, all sites in your block list will be blocked
4. When OFF, all sites will be accessible

### Adding Sites to Block

1. Click the extension icon and select **"Open settings"** (or go to `chrome://extensions` and click "Options" under the extension)
2. Enter a website domain (e.g., `youtube.com` or `reddit.com`)
3. Click **"Add"**
4. The site will now be blocked when Focus Mode is ON

### Removing Sites

1. Go to the settings page
2. Click **"Remove"** next to any site in your block list
3. Or click **"Clear All"** to remove all blocked sites at once

### On a Blocked Page

When you try to visit a blocked site with Focus Mode ON:

1. You'll see a blocked page message
2. You can:
   - Click **"Turn off Focus Mode"** to disable focus mode and automatically return to the site
   - Click **"Go back"** to return to the previous page
   - Click **"Open Focus Settings"** to manage your block list

## Development

### Project Structure

```
FocusNode/
├── focus-react/          # React application source code
│   ├── src/
│   │   ├── PopupApp.jsx  # Extension popup component
│   │   ├── OptionsApp.jsx # Options/settings page component
│   │   └── storage.js    # Chrome storage utilities
│   └── vite.config.js    # Vite build configuration
└── FocusModeWebsiteBlocker/  # Chrome extension files
    ├── manifest.json     # Extension manifest
    ├── sw.js            # Service worker (background script)
    ├── blocked.html     # Blocked page template
    ├── blocked.js       # Blocked page logic
    └── dist/            # Built React app (generated)
```

### Building for Development

To build the extension with watch mode (auto-rebuild on changes):

```bash
cd focus-react
npm run dev
```

Then in another terminal, you'll need to manually rebuild when you make changes, or set up a watch script.

### Building for Production

```bash
cd focus-react
npm run build
```

After building, reload the extension in Chrome:
1. Go to `chrome://extensions/`
2. Click the reload icon on the extension card

### Making Changes

1. Edit the React components in `focus-react/src/`
2. Run `npm run build` from the `focus-react` directory
3. Reload the extension in Chrome
4. Test your changes

## Permissions

The extension requires the following permissions:

- **Storage** - To save your focus mode settings and blocked sites list
- **Tabs** - To check and block websites, and reload tabs when toggling focus mode
- **Host Permissions** - To intercept and block website requests

## Troubleshooting

### Extension Not Loading

- Make sure you've run `npm run build` in the `focus-react` directory first
- Ensure you're loading the `FocusModeWebsiteBlocker` folder, not `focus-react`
- Check the browser console (`chrome://extensions` → Developer mode → "Errors" button) for any error messages

### Sites Not Being Blocked

- Make sure Focus Mode is turned ON (check the popup - it should say "ON")
- Verify the site is in your blocked list (go to settings)
- Try reloading the tab after adding a site to the block list
- Check that the site domain matches exactly (e.g., `youtube.com` not `www.youtube.com`)

### Build Errors

- Make sure you have Node.js v16 or higher installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check that all dependencies are installed correctly

## License

This project is open source and available for personal and commercial use.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

**Stay focused! 🎯**


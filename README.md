# Popup & Redirect Blocker

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)

A lightweight Chrome extension that blocks unwanted pop-ups, redirects, and intrusive ads. Protect your browsing experience with minimal performance impact.

## ✨ Features

- 🛡️ **Block Unauthorized Popups** - Prevents `window.open()` and other popup techniques
- 🔗 **Block Suspicious Redirects** - Stops redirect to ad/tracking domains
- 🚫 **Block Hidden Ads** - Removes ad scripts and hidden iframes automatically
- 📊 **Real-time Statistics** - Track how many popups/redirects blocked
- 🔔 **Customizable Notifications** - Choose between prompt mode or silent mode
- ⚡ **Lightweight** - Minimal resource usage, no impact on browsing speed
- 🎨 **Clean UI** - Modern, user-friendly popup interface

## 📸 Screenshots

![Extension Popup](screenshots/popup.png)
*Main popup interface showing statistics and settings*

## 🚀 Installation

### From Chrome Web Store
*Coming soon - Extension is currently under review*

### Manual Installation (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/KhoaPham151/Extension-Popup-Redirect-Blocker.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the extension folder

6. The extension icon will appear in your toolbar - click it to configure settings

## 🎯 How It Works

The extension uses multiple techniques to block unwanted content:

1. **Network-Level Blocking**: Uses declarativeNetRequest API to block requests to known ad/popup domains
2. **Script Injection**: Overrides `window.open()` and other browser APIs to prevent popup creation
3. **DOM Monitoring**: Watches for and removes suspicious scripts/iframes added to pages
4. **Redirect Prevention**: Blocks unauthorized history manipulation and location changes

## ⚙️ Settings

- **Protection Status**: Enable/disable the extension
- **Prompt Notifications**: Get asked before blocking (with Allow/Deny options)
- **Silent Mode**: Block silently without any notifications

## 🔒 Privacy

This extension **does not collect any data**. All settings and statistics are stored locally on your device.

See our full [Privacy Policy](PRIVACY_POLICY.md) for details.

## 📋 Permissions Explained

- **declarativeNetRequest**: Block network requests to ad/popup domains
- **storage**: Save your preferences locally
- **notifications**: Show optional notifications when blocking
- **host_permissions**: Required to run blocking scripts on all websites

## 🛠️ Development

### Project Structure

```
extension_block_popup/
├── manifest.json        # Extension configuration
├── background.js        # Background service worker
├── content.js          # Content script (runs on web pages)
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── rules.json          # Network blocking rules
├── icons/              # Extension icons
└── PRIVACY_POLICY.md   # Privacy policy
```

### Building

The extension is ready to use as-is. To create a distribution package:

```bash
# Create ZIP file for Chrome Web Store
zip -r popup-blocker-v1.1.0.zip * -x "*.git*" "*.zip" "node_modules/*"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**KhoaPham (Danny)**

- GitHub: [@KhoaPham151](https://github.com/KhoaPham151)

## 🐛 Bug Reports

Found a bug? Please open an issue on [GitHub Issues](https://github.com/KhoaPham151/Extension-Popup-Redirect-Blocker/issues).

## ⭐ Support

If you find this extension helpful, please consider giving it a star on GitHub!

---

**Disclaimer**: This extension is provided "as is" without warranty of any kind. Use at your own risk.

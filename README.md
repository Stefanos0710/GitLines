# GitLines
A simple Firefox extension that displays the total lines of code in any GitHub repository directly on the repository page.

> **Note:** This extension will be available on the Firefox Add-ons Store soon and is currently under review. For now, please follow the manual installation steps below.

## 📋 System Requirements
- Firefox 109 or higher
- Internet connection for GitHub access
- GitHub Personal Access Token (required)

## 🚀 Step-by-Step Setup Guide

### Step 1: Install the Extension
1. **Download the repository:**
   ```bash
   git clone https://github.com/[username]/GitLines.git
   ```
   or download the ZIP file and extract it.

2. **Install Firefox Developer Edition (recommended):**
   - Download Firefox

3. **Load the extension:**
   - Open Firefox
   - Navigate to `about:debugging` in the address bar
   - Click on "This Firefox"
   - Click "Load Temporary Add-on..."
   - Navigate to the GitLines folder and select the `manifest.json` file

### Step 2: Add Extension to Menu Bar
1. **Pin the extension to toolbar:**
   - Look for the GitLines icon in the Firefox toolbar
   - If not visible, click the puzzle piece icon (Extensions) in the toolbar
   - Find "GitLines" and click the pin icon to add it to your toolbar
   - The GitLines icon should now be visible in your menu bar

### Step 3: Get Your GitHub API Token
1. **Sign in to GitHub:**
   - Go to [github.com](https://github.com) and sign in to your account

2. **Access Developer Settings:**
   - Click on your profile picture (top right)
   - Select "Settings"
   - Scroll down and click "Developer settings" (left sidebar)

3. **Generate Personal Access Token:**
   - Click "Personal access tokens" → "Tokens (classic)"
   - Click "Generate new token" → "Generate new token (classic)"
   - Give your token a descriptive name (e.g., "GitLines Extension")

4. **Configure Token Permissions:**
   - **Expiration:** Set to "No expiration" or choose your preferred duration
   - **Select scopes:** Check the following permissions:
     - ✅ `public_repo` - Access public repositories
     - ✅ `repo:status` - Access commit status
     - ✅ `repo_deployment` - Access deployment status
   
   *Note: For private repositories, you'll need the full `repo` scope*

5. **Copy the Token:**
   - Click "Generate token"
   - **Important:** Copy the token immediately - you won't be able to see it again!

### Step 4: Configure Your API Token
1. **Open GitLines Settings:**
   - Click the GitLines icon in your Firefox toolbar
   - The popup window will open
   - Click on "Settings" or the gear icon

2. **Enter Your Token:**
   - Paste your GitHub Personal Access Token in the "API Token" field
   - Click "Save" to store your configuration


**Important:** Make sure to save your settings after making any changes!

## 🔧 Usage

Once everything is set up:

1. **Visit any GitHub Repository:**
   - Navigate to any GitHub repository
   - The extension will automatically detect the page and start analyzing

2. **View Code Lines:**
   - Code line information will appear directly on the repository page
   - Click the GitLines toolbar icon for detailed statistics

3. **Detailed Information:**
   - Use the popup to see breakdowns by programming language
   - View total lines, code lines, comments, and blank lines

## ⚙️ Features
- Automatic GitHub repository detection
- Real-time display of code lines
- Support for various programming languages
- User-friendly popup interface
- Fast and efficient processing

## 🛠️ Development

### Prerequisites
- Firefox Developer Edition
- Basic knowledge of JavaScript, HTML, and CSS

### Developer Setup
1. Clone the repository
2. Make changes to the files
3. Reload in Firefox via `about:debugging`
4. Test on various GitHub repositories

### File Structure
```
GitLines/
├── manifest.json          # Extension manifest
├── gitlines.js           # Main JavaScript file
├── popup/
│   ├── popup.html        # Popup HTML
│   ├── popup.js          # Popup JavaScript
│   └── style.css         # Popup styling
├── icons/                # Extension icons
└── README.md            # This file
```

## 🐛 Troubleshooting

### Extension doesn't load
- Check that all files are present
- Ensure `manifest.json` is valid
- Use Firefox Developer Edition for testing

### Code lines not displaying
- Refresh the GitHub page
- Check browser console for error messages
- Make sure JavaScript is enabled

### Popup doesn't open
- Check if the extension is enabled
- Click directly on the GitLines icon
- Reload the extension in `about:debugging`

## 📄 License
See [LICENSE](LICENSE) file for details.

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support
For issues or questions, please create an issue on GitHub.

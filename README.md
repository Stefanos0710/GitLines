# GitLines

<div align="center">
  <img src="icons/icon_3.png" alt="GitLines Logo" width="120">
  <h3>Code Statistics for GitHub</h3>
  <p>A browser extension that displays detailed lines of code statistics for any GitHub repository</p>
</div>

## 🔍 Overview

GitLines seamlessly integrates with GitHub's interface to provide instant code statistics directly on repository pages. With a sleek, interactive visualization, you can quickly see:

- Total lines of code in the repository
- Breakdown by programming language
- Visual distribution with an interactive donut chart
- Direct links to explore specific file types

<img width="417" height="254" alt="GitLines Chart Example" src="https://github.com/user-attachments/assets/714a4b97-58ec-4f5a-9bc1-5b0c6d65aa82" />

## ✨ Features

- **Real-time Analysis**: Instantly analyze repositories as you browse GitHub
- **Language Breakdown**: See code distribution across different programming languages
- **Interactive Chart**: Hover over segments to see detailed statistics
- **Branch Selection**: Analyze specific branches or all branches
- **Configurable Performance**: Adjust concurrent file processing for optimal speed
- **GitHub API Integration**: Uses official GitHub API for accurate results
- **Wide Language Support**: Detects over 30 programming languages

## 🛠️ Installation & Setup

### Step 1: Install the Extension

#### Option A: -- COMMING SOON! -- Install from Firefox Add-ons Store (Recommended)
1. Visit the [GitLines Add-on page](https://addons.mozilla.org/firefox/addon/gitlines/)
2. Click "Add to Firefox"
3. Follow the prompts to complete installation
4. Click the puzzle icon in the toolbar
5. Find "GitLines" and click the gear icon
6. Select "Pin to Toolbar" to make the extension easily accessible

#### Option B: Manual Installation (for Development)
1. Download the repository:
   ```bash
   git clone https://github.com/Stefanos0710/GitLines.git
   ```
   or download the ZIP file and extract it.
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on..."
5. Navigate to the GitLines folder and select `manifest.json`
6. Pin the extension to your toolbar as described above

### Step 2: Generate GitHub API Token

A personal access token is required to access GitHub's API:

1. Sign in to [GitHub](https://github.com)
2. Click your profile picture → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token** → **Generate new token (classic)**
4. Give your token a descriptive name (e.g., "GitLines Extension")
5. Set the expiration as desired
6. Select the following permissions:
   - `public_repo` - For public repositories
   - `repo` - For private repositories (if needed)
7. Click **Generate token**
8. **IMPORTANT**: Copy the token immediately - you won't see it again!

### Step 3: Configure the Extension

1. Click the GitLines icon in your browser toolbar
2. Enter your GitHub API token in the designated field
3. Adjust settings as desired:
   - **Concurrent Files**: Number of files to process simultaneously (3-10 recommended)
   - **Branch Selection**: Specify which branch(es) to analyze
4. Click **Save**

<img width="366" height="497" alt="GitLines Settings" src="https://github.com/user-attachments/assets/d65a7c13-31fa-4054-bf3e-5d0763acce90" />

## 🚀 How to Use GitLines

Once installation and setup are complete:

1. **Visit any GitHub Repository**: 
   - The extension will automatically detect GitHub repository pages

2. **View Statistics**:
   - Look for the "Lines of Code" section in the repository sidebar
   - See total lines and breakdown by language
   - Interact with the chart for more details

3. **Customization**:
   - Click the GitLines icon to adjust settings
   - Modify concurrent processing for speed/resource balance
   - Select specific branches to analyze

## ❓ Troubleshooting

### Extension Not Working
- Verify that the extension is enabled in the popup
- Check that you've entered a valid GitHub API token
- Ensure you have sufficient API rate limits remaining

### Slow Performance
- Decrease the "Concurrent Files" setting
- Analyze specific branches instead of all branches
- Check your network connection

### API Limits
- GitHub API has rate limits that may affect usage
- Consider authenticating with a token that has higher rate limits
- Wait for rate limits to reset if you've reached them

## 🧩 Development

### Prerequisites
- Basic knowledge of JavaScript, HTML, and CSS
- Firefox for testing

### Project Structure
```
GitLines/
├── manifest.json          # Extension manifest
├── gitlines.js           # Main content script
├── popup/
│   ├── popup.html        # Popup interface
│   ├── popup.js          # Popup functionality
│   └── style.css         # Popup styling
├── icons/                # Extension icons
└── README.md            # Documentation
```

### Building and Testing
1. Clone the repository
2. Make your changes
3. Test using Firefox's `about:debugging` page
4. Load as a temporary add-on

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:
- Open an [issue](https://github.com/Stefanos0710/GitLines/issues) on GitHub
- Provide details about your browser, OS, and the problem you're experiencing

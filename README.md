# AI Web Content Enhancer - Browser Extension

A powerful browser extension that uses AI to enhance web content by adding context, validating facts, and generating well-formatted PDFs with enriched information.

## 🚀 Features

- **Content Extraction**: Intelligently extracts main content from web pages, filtering out ads, navigation, and other noise
- **AI-Powered Enhancement**: 
  - Generate concise, well-structured summaries
  - Add relevant context and background information
  - Validate claims with reasoning (optional)
- **Professional PDF Generation**: Create beautifully formatted PDFs with enhanced content
- **Modern UI/UX**: Clean, intuitive interface with smooth animations and responsive design
- **Privacy-Focused**: Your API key is stored locally and never sent to third parties

## 🛠️ Installation

### Prerequisites
- Chrome or Chromium-based browser (Edge, Brave, etc.)
- OpenAI API key (get one at [OpenAI API Keys](https://platform.openai.com/api-keys))

### Setup Instructions

1. **Download the Extension**
   - Download or clone this repository to your local machine
   - Extract the files if downloaded as a zip

2. **Install in Browser**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the extension folder
   - The extension icon should appear in your browser toolbar

3. **Configure API Key**
   - Click the extension icon in your browser toolbar
   - Enter your OpenAI API key in the settings section
   - Click "Save" to store the key locally

4. **Generate Icons** (Optional)
   - Open `create-icons.html` in your browser
   - The page will automatically generate proper PNG icons
   - Replace the placeholder icon files in the `icons/` folder

## 📖 Usage

1. **Navigate to any webpage** with content you want to enhance
2. **Click the extension icon** in your browser toolbar
3. **Configure enhancement options**:
   - ✅ Summarize Content - Generate a concise summary
   - ✅ Add Context & Background - Include relevant additional information
   - ✅ Validate Claims - Fact-check important assertions (optional)
4. **Select your AI model** (GPT-4 recommended for best results)
5. **Click "Enhance Content"** to process the page
6. **Review the enhanced content** in the preview section
7. **Click "Generate PDF"** to create and download your enhanced document

## 🔧 Technical Details

### Architecture
- **Content Script** (`content.js`): Extracts and analyzes web page content
- **Popup Interface** (`popup.html/js/css`): User interface and controls
- **Background Script** (`background.js`): Handles AI API calls and coordination
- **PDF Generator** (`pdf-generator.html/js`): Creates professional PDF documents

### Content Extraction
The extension uses advanced techniques to identify and extract the main content:
- Removes navigation, ads, sidebars, and other noise
- Preserves article structure and formatting
- Extracts metadata (author, publish date, etc.)
- Identifies and catalogs headings, links, and images

### AI Enhancement
- Uses OpenAI's GPT models for content analysis
- Structured prompts ensure consistent, high-quality output
- JSON-formatted responses for reliable parsing
- Configurable enhancement options

### PDF Generation
- Professional formatting with consistent styling
- Color-coded fact validation results
- Responsive layout that works on any page size
- Includes source metadata and generation timestamp

## 🎨 Customization

### Modifying Enhancement Options
Edit `popup.html` to add new enhancement options, then update the corresponding logic in `background.js`.

### Styling Changes
Modify `popup.css` to customize the extension's appearance. The design uses CSS Grid and Flexbox for responsive layouts.

### AI Prompt Tuning
Adjust the system prompts in `background.js` to fine-tune AI behavior for your specific use cases.

## 🔒 Privacy & Security

- **Local Storage**: Your API key is stored locally in your browser and never transmitted to third parties
- **Direct API Calls**: Communication goes directly from your browser to OpenAI's API
- **No Data Collection**: The extension doesn't collect, store, or transmit your browsing data
- **Open Source**: All code is available for inspection and modification

## 🐛 Troubleshooting

### Common Issues

**Extension doesn't appear after installation**
- Make sure Developer Mode is enabled in Chrome extensions
- Refresh the extensions page and try again

**"No content found" error**
- Refresh the webpage and try again
- Some sites may block content extraction - try a different page

**AI processing fails**
- Verify your OpenAI API key is correct and has sufficient credits
- Check your internet connection
- Try switching to GPT-3.5 Turbo if GPT-4 fails

**PDF generation issues**
- Make sure your browser allows pop-ups from the extension
- Try disabling ad blockers temporarily
- Clear browser cache and try again

### Debug Mode
Open browser Developer Tools (F12) and check the Console tab for detailed error messages.

## 🚀 Development

### Project Structure
```
AI WEB PDF/
├── manifest.json          # Extension manifest
├── popup.html/js/css      # Main UI components
├── content.js             # Content extraction script
├── background.js          # Background processing
├── pdf-generator.html/js  # PDF generation
├── icons/                 # Extension icons
└── README.md             # Documentation
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Building Icons
Run `create-icons.html` in your browser to generate proper PNG icons from the SVG source.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Support

If you encounter issues or have suggestions:
1. Check the troubleshooting section above
2. Search existing issues on the project repository
3. Create a new issue with detailed information about your problem

## 🎯 Roadmap

- [ ] Support for more AI providers (Anthropic, Google, etc.)
- [ ] Batch processing of multiple pages
- [ ] Custom prompt templates
- [ ] Export to other formats (Word, Markdown)
- [ ] Advanced content filtering options
- [ ] Collaboration features
- [ ] Mobile browser support

---

**Made with ❤️ for better web content consumption**

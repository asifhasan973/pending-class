# 📚 Pending Classes Tracker

A modern, full-stack web application for managing your pending YouTube lecture videos with automatic subject categorization and global backend synchronization.

## ✨ Features

- 🎥 **YouTube Video Management** - Add videos by pasting YouTube links
- 🏷️ **Auto Subject Detection** - Automatically categorizes videos by course codes (e.g., CSE210, DNS101)
- 🔄 **Global Sync** - Backend API with Netlify Functions for data persistence
- 📱 **Responsive Design** - Works on desktop and mobile
- 🌐 **Universal Access** - Access your classes from anywhere, any device
- 📊 **Smart Sorting** - Sort by upload date or added date
- 💾 **Import/Export** - Backup and restore your data
- 🎨 **Dark Theme** - Modern, easy-on-the-eyes interface

## 🚀 Quick Start

### Deploy to Netlify (Recommended)

1. **Go to [netlify.com](https://netlify.com)** and sign up (free)
2. **Deploy manually**: 
   - Click "Add new site" → "Deploy manually"
   - Drag and drop this entire project folder
   - Click "Deploy site"
3. **That's it!** Your app will be live with full backend functionality

### Local Development

1. **Clone this repository**
2. **Serve the files** (any method):
   ```bash
   # Python
   python3 -m http.server 8000
   
   # Node.js
   npx serve .
   
   # Or just open index.html in your browser
   ```
3. **Open** `http://localhost:8000`

## 🎯 How to Use

1. **Add Videos**: Paste YouTube links in the input field
2. **Organize**: Videos are automatically categorized by subject
3. **Filter**: Click subject tabs to filter videos
4. **Sort**: Use the dropdown to change sorting
5. **Access Anywhere**: Your classes sync globally - access from any device
6. **Backup**: Use Import/Export for data backup

## 🏗️ Project Structure

```
pending-classes-netlify/
├── index.html              # Main application (single file)
├── netlify/
│   └── functions/          # Backend API (Netlify Functions)
│       ├── health.js       # Health check
│       ├── videos.js       # Video CRUD operations
│       ├── videos-id.js    # Individual video operations
│       ├── add.js          # Add video function
│       ├── list.js         # List videos function
│       ├── remove.js       # Remove video function
│       ├── export.js       # Export data function
│       ├── import.js       # Import data function
│       └── merge.js        # Merge data function
├── netlify.toml           # Netlify configuration
└── README.md              # This file
```

## 🔧 API Endpoints

- `GET /api/health` - Health check
- `GET /api/videos` - List videos
- `POST /api/videos` - Add video
- `DELETE /api/videos/:id` - Remove video
- `GET /api/export` - Export data
- `POST /api/import` - Import data
- `POST /api/merge` - Merge data

## 🎨 Customization

### Subject Detection
The app automatically detects course codes from video titles using patterns like:
- `CSE210`, `DNS101`, `MATH301`
- `2514-DNS101-Module14-25August25` → `DNS101`

### Global Access
Your classes are stored globally and accessible from anywhere:
- No login required
- Access from any device
- Real-time synchronization
- Universal sharing

## 🛠️ Technical Details

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Backend**: Netlify Functions (serverless)
- **Database**: Netlify Blobs (key-value storage)
- **Deployment**: Netlify (automatic HTTPS, CDN)
- **YouTube API**: Uses oEmbed (no API key required)

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## 🔒 Privacy

- All data stored in Netlify Blobs
- No external tracking
- YouTube data fetched via oEmbed API
- Global data is public (anyone with the link can access)

## 🆘 Troubleshooting

- **404 Error**: Make sure `index.html` is in the root directory
- **Functions not working**: Check Netlify Functions tab for errors
- **Data not saving**: Ensure Netlify Blobs is enabled
- **YouTube links not working**: The app uses oEmbed (no API key needed)

## 📄 License

MIT License - feel free to use and modify!

---

**Made with ❤️ for students and lifelong learners**
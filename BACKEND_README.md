# 🚀 Pending Classes Backend

A simple Node.js/Express backend for the Pending Classes application.

## ✨ Features

- **YouTube Video Management**: Add, remove, and manage YouTube videos
- **Bulk Operations**: Add multiple videos at once
- **Persistent Storage**: Videos are saved to a JSON file
- **CORS Enabled**: Works with frontend applications
- **Debug Endpoint**: Check storage state and troubleshoot issues

## 🛠️ Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   # or
   ./start.sh
   ```

3. **Development Mode** (with auto-restart):
   ```bash
   npm run dev
   ```

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Videos
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Add single video
- `POST /api/videos/bulk` - Add multiple videos
- `DELETE /api/videos/:id` - Delete specific video
- `DELETE /api/videos` - Delete all videos

### Data Management
- `GET /api/export` - Export all videos
- `POST /api/import` - Import videos (replace all)
- `POST /api/merge` - Merge videos (upsert)

### Debug
- `GET /api/debug` - Debug information and storage state

## 📁 Storage

Videos are stored in `videos-storage.json` in the project root. The file is automatically created and updated when videos are added, removed, or modified.

## 🔧 Configuration

- **Port**: Set via `PORT` environment variable (default: 3000)
- **Storage File**: `./videos-storage.json`
- **CORS**: Enabled for all origins

## 🚀 Usage

1. Start the backend server
2. Open `http://localhost:3000` in your browser
3. Add YouTube videos using the web interface
4. All operations are automatically saved to the storage file

## 🐛 Debugging

- Check the console logs for detailed operation information
- Visit `/api/debug` to see current storage state
- All API operations are logged with timestamps

## 📦 Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **body-parser**: Request body parsing

## 🔄 Migration from Netlify

This backend replaces the Netlify functions with a more reliable solution:
- ✅ Persistent storage that actually works
- ✅ Better error handling and logging
- ✅ Easier debugging and development
- ✅ No function cold starts or timeouts
- ✅ Full control over the server environment

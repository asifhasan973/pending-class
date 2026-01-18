# Pending Classes

A full-stack application for managing YouTube video collections with React frontend and Express.js backend using MongoDB Atlas.

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start development servers (frontend + backend)
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 📁 Project Structure

```
pending-classes-netlify/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # UI components (Toast, VideoCard)
│   │   ├── hooks/         # Custom hooks (useAPI)
│   │   └── utils/         # YouTube utilities
│   ├── index.html
│   └── package.json
├── server/            # Express.js + MongoDB backend
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   └── utils/             # Server utilities
├── api/               # Vercel serverless function
└── package.json       # Monorepo scripts
```

## 🔧 Environment Setup

### MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and set up a database user
3. Allow network access (0.0.0.0/0 for development)
4. Get your connection string

### Configure Environment

```bash
# Copy the example file
cp server/.env.example server/.env

# Edit with your MongoDB URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pending-classes
PORT=5000
NODE_ENV=development
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/videos` | Get all videos |
| POST | `/api/videos` | Add single video |
| POST | `/api/videos/bulk` | Add multiple videos |
| DELETE | `/api/videos/:id` | Delete specific video |
| DELETE | `/api/videos` | Clear all videos |
| GET | `/api/export` | Export all videos |
| POST | `/api/import` | Import videos (replace all) |
| POST | `/api/merge` | Merge videos (upsert) |

## ✨ Features

- ✅ Add YouTube videos by URL
- ✅ Bulk upload multiple videos
- ✅ Subject-based filtering
- ✅ Sort by upload date or added date
- ✅ Export/Import functionality
- ✅ Merge data from multiple sources
- ✅ Responsive dark theme UI
- ✅ Real-time connection status

## 🚀 Deployment (Vercel)

The app is configured for Vercel deployment:

```bash
# Deploy to Vercel
vercel --prod
```

Set `MONGODB_URI` in Vercel environment variables.

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build for production |
| `npm run install:all` | Install all dependencies |

## 📄 License

MIT
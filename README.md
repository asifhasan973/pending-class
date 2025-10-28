# Pending Classes - Monolith Application

A full-stack application for managing YouTube video collections with React frontend and Express.js backend using MongoDB Atlas.

## Project Structure

```
pending-classes-netlify/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
├── server/            # Express.js + MongoDB backend
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── package.json
└── package.json       # Root package.json for monolith management
```

## Getting MongoDB Atlas Credentials

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (choose the free M0 tier)

### Step 2: Set Up Database Access
1. In Atlas dashboard, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Set privileges to "Read and write to any database"

### Step 3: Set Up Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0) for development
4. Or add your specific IP address

### Step 4: Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" and version 4.1 or later
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with your database name (e.g., "pending-classes")

### Step 5: Set Environment Variables
1. Copy `server/env.example` to `server/.env`
2. Replace the MONGODB_URI with your actual connection string:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/pending-classes?retryWrites=true&w=majority
```

## Development Setup

### Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install:all
```

### Start Development Servers
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

## Environment Variables

Create `server/.env` with:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5000
NODE_ENV=development
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Add single video
- `POST /api/videos/bulk` - Add multiple videos
- `DELETE /api/videos/:id` - Delete specific video
- `DELETE /api/videos` - Clear all videos
- `GET /api/export` - Export all videos
- `POST /api/import` - Import videos (replace all)
- `POST /api/merge` - Merge videos (upsert)

## Deployment

The application is configured for Vercel deployment with both frontend and backend in a single repository.

### Vercel Configuration
- Frontend builds to `frontend/dist`
- Backend runs as serverless functions
- MongoDB Atlas handles database persistence

## Features

- ✅ Add YouTube videos by URL
- ✅ Bulk upload multiple videos
- ✅ Subject-based filtering
- ✅ Sort by upload date or added date
- ✅ Export/Import functionality
- ✅ Merge data from multiple sources
- ✅ Responsive dark theme UI
- ✅ Real-time connection status
- ✅ MongoDB Atlas persistence
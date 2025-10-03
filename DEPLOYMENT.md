# 🚀 Deployment Guide - Pending Classes Backend

This guide covers multiple deployment options for your Node.js/Express backend.

## 🌟 Recommended Platforms

### 1. **Vercel** (Recommended - Easiest)
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ Built-in CDN
- ✅ Serverless functions support

### 2. **Railway** (Great for Full-Stack)
- ✅ Free tier available
- ✅ Persistent storage
- ✅ Easy database integration
- ✅ Simple deployment

### 3. **Heroku** (Classic Choice)
- ✅ Reliable and stable
- ✅ Good free tier (with limitations)
- ✅ Easy to use

### 4. **Render** (Modern Alternative)
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Good performance

## 🚀 Option 1: Vercel Deployment (Recommended)

### Step 1: Prepare for Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### Step 2: Create Vercel Configuration
Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### Step 3: Deploy
```bash
# Deploy to Vercel
vercel

# For production deployment
vercel --prod
```

### Step 4: Set Environment Variables (if needed)
In Vercel dashboard, go to your project → Settings → Environment Variables

## 🚀 Option 2: Railway Deployment

### Step 1: Create Railway Configuration
Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will automatically detect it's a Node.js app
4. Deploy!

## 🚀 Option 3: Heroku Deployment

### Step 1: Create Heroku Configuration
Create `Procfile`:
```
web: node server.js
```

### Step 2: Deploy to Heroku
```bash
# Install Heroku CLI
# Then login and create app
heroku login
heroku create your-app-name

# Deploy
git add .
git commit -m "Deploy backend"
git push heroku main
```

## 🚀 Option 4: Render Deployment

### Step 1: Create Render Configuration
Create `render.yaml`:

```yaml
services:
  - type: web
    name: pending-classes-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Select "Web Service"
4. Render will auto-detect the configuration

## 🔧 Environment Variables

Set these in your deployment platform:

```bash
NODE_ENV=production
PORT=3000
```

## 📁 File Structure for Deployment

Make sure your project has:
```
├── server.js
├── package.json
├── index.html
├── vercel.json (for Vercel)
├── railway.json (for Railway)
├── Procfile (for Heroku)
├── render.yaml (for Render)
└── videos-storage.json (will be created automatically)
```

## 🐛 Troubleshooting

### Common Issues:

1. **Port Configuration**:
   - Make sure your server uses `process.env.PORT || 3000`
   - ✅ Already configured in server.js

2. **File Storage**:
   - Some platforms don't support file storage
   - Consider using a database for production

3. **CORS Issues**:
   - Make sure CORS is enabled
   - ✅ Already configured in server.js

## 🎯 Quick Start (Vercel - Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Access your app**:
   - Vercel will give you a URL like `https://your-app.vercel.app`
   - Your backend will be live!

## 🔄 Continuous Deployment

All platforms support automatic deployments:
- Push to your main branch
- Platform automatically deploys
- No manual intervention needed

## 📊 Monitoring

Most platforms provide:
- ✅ Logs and monitoring
- ✅ Health checks
- ✅ Performance metrics
- ✅ Error tracking

Choose the platform that best fits your needs!

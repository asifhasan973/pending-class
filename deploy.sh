#!/bin/bash

echo "🚀 Pending Classes Backend Deployment Script"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Make sure you're in the project directory."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found."
    exit 1
fi

echo "✅ Project files found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test the server
echo "🧪 Testing server startup..."
timeout 5s npm start &
SERVER_PID=$!
sleep 3

# Test health endpoint
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server test successful"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Server test failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎯 Choose your deployment platform:"
echo "1. Vercel (Recommended - Easiest)"
echo "2. Railway (Great for full-stack)"
echo "3. Heroku (Classic choice)"
echo "4. Render (Modern alternative)"
echo "5. Manual deployment instructions"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not installed. Install it with: npm install -g vercel"
            echo "Then run: vercel --prod"
        fi
        ;;
    2)
        echo "🚀 Deploying to Railway..."
        echo "1. Go to https://railway.app"
        echo "2. Connect your GitHub repository"
        echo "3. Railway will auto-detect your Node.js app"
        echo "4. Deploy!"
        ;;
    3)
        echo "🚀 Deploying to Heroku..."
        if command -v heroku &> /dev/null; then
            echo "Creating Heroku app..."
            heroku create
            echo "Deploying..."
            git add .
            git commit -m "Deploy backend"
            git push heroku main
        else
            echo "❌ Heroku CLI not installed. Install it first."
            echo "Then run: heroku create && git push heroku main"
        fi
        ;;
    4)
        echo "🚀 Deploying to Render..."
        echo "1. Go to https://render.com"
        echo "2. Connect your GitHub repository"
        echo "3. Select 'Web Service'"
        echo "4. Render will auto-detect your configuration"
        echo "5. Deploy!"
        ;;
    5)
        echo "📋 Manual Deployment Instructions:"
        echo "1. Push your code to GitHub"
        echo "2. Choose a platform from the DEPLOYMENT.md guide"
        echo "3. Connect your repository"
        echo "4. Deploy!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "Check the DEPLOYMENT.md file for detailed instructions."

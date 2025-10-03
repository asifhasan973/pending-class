#!/bin/bash

echo "🚀 Starting Pending Classes Backend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔧 Starting server..."
npm start

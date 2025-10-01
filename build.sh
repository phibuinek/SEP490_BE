#!/bin/bash

# Build script for Render deployment
echo "🚀 Starting build process..."

# Set Node.js memory limit for build
export NODE_OPTIONS="--max-old-space-size=1024"

# Install dependencies (including dev for build)
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

#!/bin/bash

# Build script for Render deployment with memory optimization
echo "🚀 Starting build process..."

# Set Node.js memory limit for build
export NODE_OPTIONS="--max-old-space-size=400"

# Install dependencies with production flag
echo "📦 Installing dependencies..."
npm ci --only=production

# Check if nest CLI is available
if ! command -v nest &> /dev/null; then
    echo "🔧 Installing @nestjs/cli globally..."
    npm install -g @nestjs/cli --max-old-space-size=400
fi

# Build the application with memory limit
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

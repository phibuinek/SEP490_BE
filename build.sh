#!/bin/bash

# Build script for Render deployment
echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Check if nest CLI is available
if ! command -v nest &> /dev/null; then
    echo "🔧 Installing @nestjs/cli globally..."
    npm install -g @nestjs/cli
fi

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

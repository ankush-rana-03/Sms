#!/bin/bash

# Deploy to Netlify
# Usage: ./deploy-to-netlify.sh [NETLIFY_TOKEN]

echo "🚀 Deploying to Netlify..."

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "❌ Build directory not found. Running build first..."
    npm run build
fi

# Deploy to Netlify
if [ -n "$1" ]; then
    # Use provided token
    echo "Using provided Netlify token..."
    netlify deploy --prod --dir=build --auth="$1"
else
    # Try to deploy without token (will prompt for login)
    echo "No token provided. You'll need to authenticate..."
    echo "Please visit: https://app.netlify.com/authorize"
    netlify deploy --prod --dir=build
fi

echo "✅ Deployment complete!"
echo "Your site should be live at the URL provided above."
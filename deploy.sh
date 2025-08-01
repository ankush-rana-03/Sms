#!/bin/bash

echo "🚀 School Management System - Deployment Helper"
echo "=============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found. Please ensure the deployment configuration exists."
    exit 1
fi

echo "✅ Git repository found"
echo "✅ render.yaml configuration found"

echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo "1. ✅ Code is in a Git repository"
echo "2. ✅ render.yaml configuration ready"
echo "3. ⏳ Set up MongoDB Atlas (free tier)"
echo "4. ⏳ Set up Cloudinary account (free tier)"
echo "5. ⏳ Create Render.com account"
echo "6. ⏳ Configure environment variables"
echo ""

echo "🔗 Quick Links:"
echo "==============="
echo "• MongoDB Atlas: https://www.mongodb.com/atlas"
echo "• Cloudinary: https://cloudinary.com/"
echo "• Render.com: https://render.com"
echo ""

echo "📝 Next Steps:"
echo "=============="
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add deployment configuration'"
echo "   git push"
echo ""
echo "2. Go to Render.com and create a new Blueprint"
echo "3. Connect your GitHub repository"
echo "4. Set up environment variables (see DEPLOYMENT.md)"
echo "5. Deploy!"
echo ""

echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes:"
    git status --short
    echo ""
    echo "💡 Consider committing these changes before deploying:"
    echo "   git add ."
    echo "   git commit -m 'Update before deployment'"
    echo "   git push"
fi

echo "🎉 Ready to deploy! Good luck!"
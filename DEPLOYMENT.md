# School Management System - Free Deployment Guide

## Overview
This guide will help you deploy your MERN stack school management system for free using Render.com.

## Prerequisites
1. A GitHub account
2. A Render.com account (free)
3. A MongoDB Atlas account (free tier available)
4. A Cloudinary account (free tier available)

## Step 1: Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Create a database user with read/write permissions
5. Get your connection string
6. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

## Step 2: File Storage Setup (Cloudinary)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your Cloud Name, API Key, and API Secret from the dashboard

## Step 3: Email Setup (Optional)

For email functionality, you can use:
- Gmail SMTP (free)
- SendGrid (free tier available)
- Or any other SMTP service

## Step 4: Deploy to Render.com

### Option A: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render.com](https://render.com)
3. Sign up with your GitHub account
4. Click "New +" and select "Blueprint"
5. Connect your GitHub repository
6. Render will automatically detect the `render.yaml` file
7. Set up your environment variables in the Render dashboard

### Option B: Manual Deployment

#### Backend Deployment:
1. Go to Render.com dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: school-management-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

#### Frontend Deployment:
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: school-management-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: Free

## Step 5: Environment Variables

Set these environment variables in your Render dashboard:

### Backend Environment Variables:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/school_management
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
FRONTEND_URL=https://your-frontend-app.onrender.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FROM_NAME=School Management System
FROM_EMAIL=your-email@gmail.com
```

### Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
```

## Step 6: Update CORS Settings

The backend is already configured to accept requests from the frontend URL. Make sure to update the `FRONTEND_URL` environment variable with your actual frontend URL.

## Step 7: Test Your Deployment

1. Visit your frontend URL
2. Test the login functionality
3. Test file uploads (if using Cloudinary)
4. Test email functionality (if configured)

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check the build logs in Render dashboard
2. **Database Connection**: Ensure MongoDB Atlas IP whitelist includes Render's IPs
3. **CORS Errors**: Verify FRONTEND_URL is set correctly
4. **Environment Variables**: Double-check all variables are set correctly

### Performance Tips:

1. Enable compression (already configured in backend)
2. Use CDN for static assets
3. Optimize images before upload
4. Consider caching strategies

## Free Tier Limitations

### Render.com Free Tier:
- 750 hours/month (enough for 24/7 usage)
- 512MB RAM
- Shared CPU
- Automatic sleep after 15 minutes of inactivity
- 100GB bandwidth/month

### MongoDB Atlas Free Tier:
- 512MB storage
- Shared RAM
- 500 connections

### Cloudinary Free Tier:
- 25GB storage
- 25GB bandwidth/month
- 25,000 transformations/month

## Support

If you encounter issues:
1. Check Render.com logs
2. Verify all environment variables
3. Test locally first
4. Check MongoDB Atlas connection
5. Verify Cloudinary credentials

## Security Notes

1. Never commit sensitive environment variables
2. Use strong JWT secrets
3. Enable HTTPS (automatic with Render)
4. Regularly update dependencies
5. Monitor for security vulnerabilities
# Deploying to Netlify

Your React application is ready to be deployed to Netlify! Here are several ways to do it:

## Option 1: Manual Deployment (Recommended)

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up or log in**
3. **Click "Add new site" → "Deploy manually"**
4. **Drag and drop the `build` folder** from this directory
5. **Your site will be live instantly!**

## Option 2: Using Netlify CLI

### Prerequisites:
- Netlify account
- Netlify CLI installed (`npm install -g netlify-cli`)

### Steps:
1. **Login to Netlify:**
   ```bash
   netlify login
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod --dir=build
   ```

## Option 3: Using Access Token

1. **Get your Netlify access token:**
   - Go to [Netlify User Settings](https://app.netlify.com/user/settings/tokens)
   - Create a new access token

2. **Deploy with token:**
   ```bash
   netlify deploy --prod --dir=build --auth=YOUR_TOKEN_HERE
   ```

## Option 4: Using the Deployment Script

Run the provided script:
```bash
./deploy-to-netlify.sh [YOUR_NETLIFY_TOKEN]
```

## Build Information

- **Build directory:** `build/`
- **Build command:** `npm run build`
- **Framework:** React with TypeScript
- **UI Library:** Material-UI v5

## Configuration

The `netlify.toml` file is already configured with:
- Build settings
- SPA redirects (for React Router)
- Node.js version

## Troubleshooting

If you encounter issues:
1. Make sure the build completed successfully
2. Check that the `build` directory exists
3. Verify your Netlify account has proper permissions
4. Try the manual deployment method if CLI fails
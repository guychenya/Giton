# Deployment Guide

## 🚀 Deploy to Netlify - Step by Step

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and authorize
   - Select your repository

3. **Configure Build Settings**
   - Build command: `echo "Static site - no build needed"`
   - Publish directory: `.` (root)
   - Click "Deploy site"

4. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add: `GEMINI_API_KEY` = `your_api_key_here`

5. **Custom Domain (Optional)**
   - Go to Domain settings
   - Add your custom domain
   - Configure DNS

### Option 2: Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=.
   ```

### Option 3: Manual Upload

1. **Zip your project**
   ```bash
   zip -r gitexplore-ai.zip . -x "node_modules/*" ".git/*"
   ```

2. **Upload to Netlify**
   - Go to netlify.com
   - Drag and drop the zip file
   - Configure environment variables

## 🔧 Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] Environment variables are set
- [ ] GitHub API calls work
- [ ] Gemini AI integration works
- [ ] Voice features work (HTTPS required)
- [ ] All routes redirect properly

## 🌐 Your Site URL

After deployment, your site will be available at:
`https://your-site-name.netlify.app`

## 🔒 Security Notes

- Never commit API keys to Git
- Use environment variables for sensitive data
- HTTPS is automatically provided by Netlify
- CSP headers are configured in netlify.toml

## 📊 Performance Tips

- Static files are cached for 1 year
- HTML files are not cached for fresh updates
- Gzip compression is enabled by default
- CDN distribution worldwide
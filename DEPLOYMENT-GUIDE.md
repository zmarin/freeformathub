# GitHub Pages Deployment Guide

This guide explains how to deploy FreeFormatHub to GitHub Pages using GitHub Actions.

## 🚀 Quick Setup

### 1. Repository Setup

1. **Create GitHub Repository**
   - Go to [GitHub.com](https://github.com) and create a new repository
   - Name it `freeformathub` or your preferred name
   - Make it public (required for free GitHub Pages)

2. **Push Your Code**
   ```bash
   git remote add origin https://github.com/yourusername/freeformathub.git
   git branch -M main
   git push -u origin main
   ```

### 2. Enable GitHub Pages

1. **Go to Repository Settings**
   - Navigate to your repository on GitHub
   - Click on "Settings" tab
   - Scroll down to "Pages" section

2. **Configure Pages Settings**
   - **Source**: Select "GitHub Actions"
   - **Branch**: Keep default (gh-pages will be created automatically)

### 3. Update Configuration

1. **Update Repository URL in astro.config.mjs**
   - Replace `yourusername` with your actual GitHub username:
   ```javascript
   site: process.env.NODE_ENV === 'production'
     ? 'https://yourusername.github.io/freeformathub'
     : undefined,
   ```

2. **Push Changes**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages deployment"
   git push
   ```

### 4. Monitor Deployment

1. **Check Actions Tab**
   - Go to the "Actions" tab in your GitHub repository
   - You should see the "Deploy to GitHub Pages" workflow running

2. **Check Pages Status**
   - Go to Settings → Pages
   - You should see your deployment URL: `https://yourusername.github.io/freeformathub`

## 🔧 Configuration Files Created

### GitHub Actions Workflows

**`.github/workflows/deploy.yml`** - Main deployment workflow
- Triggers on push to main/master branch
- Builds the Astro project
- Deploys to GitHub Pages

**`.github/workflows/pages.yml`** - Alternative deployment workflow
- More detailed build and deploy steps
- Includes artifact upload/download
- Creates `.nojekyll` file for proper static site serving

### Astro Configuration

**`astro.config.mjs`** - Updated with GitHub Pages settings
- `site`: Sets the production URL
- `base`: Sets the base path for GitHub Pages (repository name)

## 🛠 Troubleshooting

### Common Issues

1. **404 Errors on Subpages**
   - **Solution**: Ensure `base: '/freeformathub'` is set in astro.config.mjs
   - **Check**: Verify repository name matches the base path

2. **Build Failures**
   - **Check Node.js version**: GitHub Actions uses Node 18
   - **Verify dependencies**: Run `npm ci` locally first
   - **Check build logs**: Look at the "Actions" tab for detailed errors

3. **Pages Not Updating**
   - **Clear browser cache**: Hard refresh (Ctrl+F5)
   - **Check deployment status**: Settings → Pages should show "Active"
   - **Verify workflow completion**: Actions tab should show green checkmark

### Manual Build Testing

```bash
# Test build locally
npm run build

# Preview build
npm run preview

# Check dist/ directory
ls -la dist/
```

## 📊 Deployment Status

### Workflow Status Badges

Add these badges to your README.md:

```markdown
[![Deploy to GitHub Pages](https://github.com/yourusername/freeformathub/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/freeformathub/actions/workflows/deploy.yml)

[![pages-build-deployment](https://github.com/yourusername/freeformathub/actions/workflows/pages.yml/badge.svg)](https://github.com/yourusername/freeformathub/actions/workflows/pages.yml)
```

### Environment Variables

The deployment uses these environment variables:
- `NODE_ENV=production` - Set during build
- GitHub automatically provides repository information

## 🚀 Alternative Deployment Options

### Netlify (Alternative)

1. **Create netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = "dist"
  environment = { NODE_VERSION = "18" }
```

2. **Deploy to Netlify**
   - Connect your GitHub repository
   - Netlify will automatically detect the configuration

### Vercel (Alternative)

1. **Create vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

2. **Deploy to Vercel**
   - Connect your GitHub repository
   - Vercel will handle the rest

## 📝 Notes

- **Free Tier Limits**: GitHub Pages has generous free limits
- **Custom Domain**: You can add a custom domain later
- **HTTPS**: Automatically enabled for GitHub Pages
- **CDN**: Global CDN included
- **Build Minutes**: Included in GitHub's free tier

## 🆘 Support

If you encounter issues:

1. **Check the Actions logs** for detailed error messages
2. **Verify your repository settings** match this guide
3. **Test the build locally** before pushing
4. **Check GitHub Pages status** at [githubstatus.com](https://www.githubstatus.com/)

---

**Happy deploying! 🚀**

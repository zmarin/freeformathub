#!/bin/bash

# GitHub Pages Deployment Script for FreeFormatHub
# Usage: ./scripts/github-deploy.sh [repository-name] [username]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
REPO_NAME=${1:-"freeformathub"}
USERNAME=${2:-""}

echo -e "${BLUE}🚀 FreeFormatHub GitHub Pages Deployment Setup${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if git is initialized
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo -e "${YELLOW}Please run 'git init' first${NC}"
    exit 1
fi

# Check if remote origin exists
if git remote get-url origin > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Git remote 'origin' already exists${NC}"
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${BLUE}Current remote: ${NC}$REMOTE_URL"
else
    # Get GitHub username if not provided
    if [ -z "$USERNAME" ]; then
        echo -e "${YELLOW}Please enter your GitHub username:${NC}"
        read -r USERNAME
    fi

    if [ -z "$USERNAME" ]; then
        echo -e "${RED}❌ Error: GitHub username is required${NC}"
        exit 1
    fi

    REMOTE_URL="https://github.com/${USERNAME}/${REPO_NAME}.git"
    echo -e "${BLUE}Setting up remote origin: ${NC}$REMOTE_URL"
    git remote add origin "$REMOTE_URL"
fi

# Check if main branch exists, if not create it
if ! git show-ref --verify --quiet refs/heads/main; then
    if git show-ref --verify --quiet refs/heads/master; then
        echo -e "${BLUE}Renaming master branch to main...${NC}"
        git branch -m master main
    else
        echo -e "${BLUE}Creating main branch...${NC}"
        git checkout -b main
    fi
fi

# Add all files
echo -e "${BLUE}Adding files to git...${NC}"
git add .

# Commit changes
echo -e "${BLUE}Committing changes...${NC}"
git commit -m "Configure FreeFormatHub for GitHub Pages deployment

- Add GitHub Actions workflows for automated deployment
- Update Astro config for GitHub Pages
- Add deployment guide and configuration files" || echo -e "${YELLOW}No changes to commit${NC}"

# Push to GitHub
echo -e "${BLUE}Pushing to GitHub...${NC}"
if git push -u origin main; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Push failed. This might be expected if the repository doesn't exist yet.${NC}"
fi

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Go to: ${BLUE}https://github.com/${USERNAME}/${REPO_NAME}${NC}"
echo -e "2. Enable GitHub Pages in Settings → Pages"
echo -e "3. Set source to 'GitHub Actions'"
echo -e "4. Your site will be available at: ${BLUE}https://${USERNAME}.github.io/${REPO_NAME}${NC}"
echo -e ""
echo -e "${YELLOW}Monitor deployment:${NC}"
echo -e "- Check Actions tab for build status"
echo -e "- Check Settings → Pages for deployment URL"
echo -e ""
echo -e "${BLUE}================================================${NC}"

# Test build locally
echo -e "${BLUE}Testing local build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Local build successful${NC}"
    echo -e "${BLUE}You can preview the build with: ${NC}npm run preview"
else
    echo -e "${RED}❌ Local build failed${NC}"
    echo -e "${YELLOW}Please check your build configuration${NC}"
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Happy deploying! 🚀${NC}"

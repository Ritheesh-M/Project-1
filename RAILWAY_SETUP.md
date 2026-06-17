# Railway Deployment Guide

## Quick Steps:
1. Go to https://railway.app
2. Sign in with GitHub
3. Create new project → Deploy from GitHub
4. Select: Ritheesh-M/Project-1
5. Select deploy folder: Front end/Back end
6. Wait for deployment
7. Copy the production URL from Railway dashboard

## After Getting URL:
1. Update .env.production with the URL
2. Example: `VITE_API_URL=https://production-xxxxx.railway.app`
3. Push changes to GitHub
4. Netlify will auto-redeploy

## Important:
- Backend must accept CORS from Netlify domain
- Update CORS origin if needed (currently allows all)

# 🚀 Deployment Guide: Sensa Learn Advanced Features

## Overview

This guide covers deploying all 10 phases of the Sensa Learn Advanced Features to production.

## ✅ Pre-Deployment Checklist

### 1. Environment Setup

Create `.env.local` file with required variables:

```env
# ElevenLabs Audio Narration
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_ELEVENLABS_VOICE_ID=your_voice_id_here

# Brain.fm Focus Music
VITE_BRAINFM_WIDGET_URL=https://brain.fm/widget?token=your_token_here

# Backend API
VITE_API_URL=https://your-api-domain.com

# Optional: Feature Flags
VITE_ENABLE_AUDIO_NARRATION=true
VITE_ENABLE_FOCUS_MUSIC=true
VITE_ENABLE_BADGES=true
```

### 2. Dependencies Installation

```bash
# Install required dependencies
npm install idb dompurify

# Verify all dependencies
npm install
```

### 3. TypeScript Verification

```bash
# Check for TypeScript errors
npm run type-check

# Expected output: No errors found
```

### 4. Build Verification

```bash
# Create production build
npm run build

# Verify build output
ls -la dist/
```

## 🧪 Testing Before Deployment

### Manual Testing Checklist

#### Phase 1-2: Audio Narration
```bash
# Start dev server
npm run dev

# Test:
1. Navigate to Sensa Learn portal
2. Open any analogy card
3. Click "Listen" button
4. Verify audio plays
5. Test pause/resume
6. Verify caching (replay should be instant)
7. Test error handling (disconnect network)
```

#### Phase 3: Focus Music
```bash
# Test:
1. Navigate to Sensa Learn portal
2. Verify floating music button appears (bottom-right)
3. Click to expand player
4. Verify Brain.fm widget loads
5. Navigate between pages
6. Verify music continues playing
7. Test minimize/expand
8. Verify player doesn't appear in PBL portal
```

#### Phase 4-7: Progress & Gamification
```bash
# Test:
1. Navigate to /progress
2. Verify progress circle animates
3. Check streak display with flame icon
4. Verify badge showcase loads
5. Click on badges for details
6. Check chapter progress list
7. Click chapters to navigate
8. Verify all stats display correctly
```

#### Phase 8: Exam Relevance (PBL)
```bash
# Test:
1. Navigate to PBL concept map
2. Verify high relevance nodes glow
3. Toggle "Show High Relevance Only"
4. Verify filter works
5. Check legend display
6. Hover over high relevance nodes
7. Verify glow intensifies
```

#### Phase 9: Conflict Resolution (PBL)
```bash
# Test:
1. Find concept with conflicts
2. Click conflict badge
3. Verify modal opens
4. Compare both sources
5. View AI recommendation
6. Select a source
7. Submit resolution
8. Verify success message
9. Test navigation between conflicts
```

#### Phase 10: Feedback (PBL)
```bash
# Test:
1. View concept detail
2. Click "Flag as Incorrect"
3. Submit feedback
4. Verify success message
5. Check "Feedback Submitted" indicator
6. Test "Suggest Edit"
7. Test "Add Related Concept"
8. Verify all modals work
9. Check character limits
```

### Automated Testing

```bash
# Run linter
npm run lint

# Run type checker
npm run type-check

# Run tests (if implemented)
npm run test
```

## 📦 Deployment Steps

### Option 1: Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Settings > Environment Variables
```

### Option 2: Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
# Site settings > Environment variables
```

### Option 3: AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Option 4: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build image
docker build -t sensa-learn-app .

# Run container
docker run -p 80:80 sensa-learn-app
```

## 🔧 Post-Deployment Configuration

### 1. Backend API Setup

Ensure your backend API has the following endpoints:

```
# Audio
POST /api/audio/generate

# Progress
GET /api/users/:userId/progress
POST /api/users/:userId/progress
GET /api/chapters/:chapterId/progress

# Streaks
GET /api/users/:userId/streak
POST /api/users/:userId/activity

# Badges
GET /api/users/:userId/badges
POST /api/badges/:badgeId/unlock

# Conflicts (PBL)
GET /api/concepts/:conceptId/conflicts
POST /api/conflicts/:conflictId/resolve

# Feedback (PBL)
POST /api/feedback
GET /api/concepts/:conceptId/feedback/status
```

### 2. Database Migrations

Run any required database migrations:

```sql
-- Add exam_relevance column if not exists
ALTER TABLE concepts 
ADD COLUMN IF NOT EXISTS exam_relevance VARCHAR(10) DEFAULT 'low';

-- Add conflict tracking
CREATE TABLE IF NOT EXISTS concept_conflicts (
  conflict_id UUID PRIMARY KEY,
  concept_id UUID REFERENCES concepts(id),
  source1_doc_id UUID,
  source2_doc_id UUID,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add feedback tracking
CREATE TABLE IF NOT EXISTS user_feedback (
  feedback_id UUID PRIMARY KEY,
  user_id UUID,
  concept_id UUID,
  feedback_type VARCHAR(50),
  content JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. CDN Configuration

Configure CDN for static assets:

```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location / {
  try_files $uri $uri/ /index.html;
}
```

### 4. Security Headers

Add security headers:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

## 📊 Monitoring & Analytics

### 1. Error Tracking

Integrate Sentry for error tracking:

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### 2. Analytics

Add analytics tracking:

```typescript
// Track feature usage
analytics.track('audio_narration_played', {
  conceptId: concept.id,
  duration: audioDuration,
});

analytics.track('badge_unlocked', {
  badgeId: badge.id,
  userId: user.id,
});

analytics.track('conflict_resolved', {
  conflictId: conflict.id,
  selectedSource: resolution.source,
});
```

### 3. Performance Monitoring

Monitor key metrics:

- Audio loading time
- Progress dashboard load time
- Badge animation performance
- Concept map rendering time
- API response times

## 🔍 Troubleshooting

### Common Issues

#### Audio Not Playing

```bash
# Check:
1. ElevenLabs API key is valid
2. Voice ID is correct
3. Network connectivity
4. Browser audio permissions
5. IndexedDB is enabled
```

#### Music Player Not Appearing

```bash
# Check:
1. Brain.fm widget URL is valid
2. User is in Sensa Learn portal (not PBL)
3. MusicPlayerContext is properly wrapped
4. No console errors
```

#### Progress Not Updating

```bash
# Check:
1. API endpoint is accessible
2. User ID is valid
3. React Query cache is working
4. Network tab for API calls
5. Console for errors
```

#### Badges Not Unlocking

```bash
# Check:
1. Badge service is running
2. Progress thresholds are met
3. API returns badge data
4. React Query invalidation works
```

## 📈 Performance Optimization

### 1. Code Splitting

```typescript
// Lazy load heavy components
const ProgressDashboard = lazy(() => import('./pages/progress/ProgressDashboardPage'));
const ConflictResolutionModal = lazy(() => import('./components/pbl/ConflictResolutionModal'));
```

### 2. Image Optimization

```bash
# Optimize images
npm install -D vite-plugin-imagemin

# Add to vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

plugins: [
  viteImagemin({
    gifsicle: { optimizationLevel: 7 },
    optipng: { optimizationLevel: 7 },
    mozjpeg: { quality: 80 },
    svgo: { plugins: [{ removeViewBox: false }] },
  }),
]
```

### 3. Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for large dependencies
npm install -g source-map-explorer
source-map-explorer dist/assets/*.js
```

## ✅ Post-Deployment Verification

### 1. Smoke Tests

```bash
# Run smoke tests
curl https://your-domain.com/health
curl https://your-domain.com/api/health

# Check key pages
curl -I https://your-domain.com/
curl -I https://your-domain.com/progress
curl -I https://your-domain.com/sensa
curl -I https://your-domain.com/pbl
```

### 2. User Acceptance Testing

Create test accounts and verify:
- [ ] Audio narration works
- [ ] Music player functions
- [ ] Progress tracks correctly
- [ ] Streaks update daily
- [ ] Badges unlock properly
- [ ] Exam relevance displays
- [ ] Conflicts can be resolved
- [ ] Feedback can be submitted

### 3. Performance Checks

```bash
# Run Lighthouse audit
npm install -g lighthouse

lighthouse https://your-domain.com \
  --output html \
  --output-path ./lighthouse-report.html

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
# SEO: > 90
```

## 🎉 Success Criteria

Deployment is successful when:

- ✅ All pages load without errors
- ✅ All features function as expected
- ✅ Performance metrics meet targets
- ✅ No console errors
- ✅ Accessibility score > 95
- ✅ Mobile responsive
- ✅ Dark mode works
- ✅ API integration works
- ✅ Error tracking active
- ✅ Analytics tracking

## 📞 Support

For issues or questions:

1. Check console for errors
2. Review network tab for failed requests
3. Verify environment variables
4. Check API endpoint status
5. Review error tracking dashboard

## 🔄 Rollback Plan

If issues occur:

```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# AWS
aws s3 sync s3://backup-bucket/ s3://your-bucket-name/
aws cloudfront create-invalidation --distribution-id ID --paths "/*"

# Docker
docker pull your-registry/sensa-learn-app:previous-tag
docker stop current-container
docker run -d your-registry/sensa-learn-app:previous-tag
```

---

**Deployment Complete!** 🚀

Your Sensa Learn Advanced Features are now live and ready for users!

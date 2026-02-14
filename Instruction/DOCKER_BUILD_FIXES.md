`# Docker Build Prerender Fixes

## Problem Statement
After migrating from a Standard Monorepo architecture to a Containerized Micro-Frontend Architecture, the Docker build was failing with prerendering errors on role-based dashboard pages, specifically:
- `/dashboard/student/analytics`
- `/dashboard/teacher/student-progress`

## Root Causes
1. **Client Components Without Dynamic Declaration**: Pages marked as `"use client"` were being statically prerendered during Docker build, but they require runtime context (authentication, state, etc.)
2. **Missing Role-Based Page**: The `/dashboard/student/page.tsx` didn't exist, causing routing issues
3. **Build-Time Database Access**: The build process tried to connect to MongoDB during prerendering, which wasn't available in the Docker builder stage

## Solutions Implemented

### 1. Added Dynamic Route Declarations
Added `export const dynamic = 'force-dynamic';` to all client-side dashboard pages that cannot be statically prerendered:

**Student Pages:**
- ✅ `app/dashboard/student/analytics/page.tsx`
- ✅ `app/dashboard/student/my-classes/page.tsx`
- ✅ `app/dashboard/student/grades/page.tsx`
- ✅ `app/dashboard/student/progress/page.tsx`
- ✅ `app/dashboard/student/resources/page.tsx`
- ✅ `app/dashboard/student/messages/page.tsx`
- ✅ `app/dashboard/student/schedule/page.tsx`
- ✅ `app/dashboard/student/assignments/page.tsx`
- ✅ `app/dashboard/student/profile/page.tsx`

**Teacher Pages:**
- ✅ `app/dashboard/teacher/student-progress/page.tsx`
- ✅ `app/dashboard/teacher/classes/[classId]/assignments/page.tsx`

### 2. Created Missing Student Dashboard Page
Created `app/dashboard/student/page.tsx` with role verification and proper layout:
```tsx
"use client"
export const dynamic = 'force-dynamic';
// Includes role verification and DashboardLayout wrapper
```

### 3. Enhanced next.config.mjs
Added configuration to prevent static prerendering issues:
- `staticPageGenerationTimeout: 0` - Prevents timeout during prerendering
- `onDemandEntries` configuration - Better handling of dynamic routes

### 4. Updated Dockerfile
- Added `NODE_ENV=production` during build
- Added verbose build logging for debugging: `npm run build 2>&1 | tee build.log`

## How It Works

### Dynamic Routes in Next.js 15
```typescript
export const dynamic = 'force-dynamic';
```
This tells Next.js to skip static generation and render the page on-demand at request time. This is essential for:
- Pages requiring authentication
- Pages accessing localStorage/sessionStorage
- Pages with client-only state management
- Pages that call external APIs at render time

### Correct Pattern for Role-Based Pages
```typescript
"use client"

export const dynamic = 'force-dynamic';

// Rest of component code...
import { useState } from 'react'
```

## Testing the Fix

### Local Build Test
```bash
cd frontend
npm run build
```

Expected output:
- No prerendering errors
- `.next` folder created successfully

### Docker Build Test
```bash
docker-compose up --build frontend
```

Watch for:
- ✅ Successful npm build in builder stage
- ✅ No prerendering errors
- ✅ Container starts on port 3000
- ✅ Pages load without 500 errors

### Verify in Browser
```
http://localhost:3000/dashboard/student/analytics
http://localhost:3000/dashboard/teacher/student-progress
```

Both should load without errors.

## Architecture Notes

### Why Force-Dynamic is Needed
The micro-frontend architecture uses role-based route groups that:
1. Require user context (role, userId from localStorage)
2. Have state-dependent rendering
3. May fetch real-time data from MongoDB
4. Use middleware for access control

These characteristics make static prerendering impossible, so dynamic rendering is the correct approach.

### Performance Impact
- **Pre-migration**: Pages could be prerendered as static assets (faster)
- **Post-migration**: Pages render on-demand (slightly slower, but necessary for security)
- **Mitigation**: Implement caching strategies at the middleware/API level if needed

## Future Optimizations

### If Performance Becomes an Issue
1. **Implement SWR/React Query** for client-side caching
2. **Add API caching** for frequently accessed data
3. **Use Incremental Static Regeneration (ISR)** for public pages
4. **Implement server-side pagination** for data-heavy pages

## Verification Checklist

Before deploying to production:
- [ ] `npm run build` completes without errors
- [ ] `docker-compose up --build` succeeds
- [ ] All student dashboard pages load
- [ ] All teacher dashboard pages load
- [ ] Admin/Center portals still work
- [ ] No console errors in browser DevTools
- [ ] Middleware correctly enforces role-based routing

## Related Files Modified
- `frontend/next.config.mjs` - Added prerender timeout config
- `frontend/Dockerfile` - Enhanced logging and NODE_ENV
- `frontend/app/dashboard/student/analytics/page.tsx`
- `frontend/app/dashboard/student/my-classes/page.tsx`
- `frontend/app/dashboard/student/grades/page.tsx`
- `frontend/app/dashboard/student/progress/page.tsx`
- `frontend/app/dashboard/student/resources/page.tsx`
- `frontend/app/dashboard/student/messages/page.tsx`
- `frontend/app/dashboard/student/schedule/page.tsx`
- `frontend/app/dashboard/student/assignments/page.tsx`
- `frontend/app/dashboard/student/profile/page.tsx`
- `frontend/app/dashboard/student/page.tsx` (created)
- `frontend/app/dashboard/teacher/student-progress/page.tsx`
- `frontend/app/dashboard/teacher/classes/[classId]/assignments/page.tsx`

## References
- [Next.js Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Docker Best Practices](https://nextjs.org/docs/deployment/docker)

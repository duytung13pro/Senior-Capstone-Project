# Auth Provider (NextAuth.js / Auth.js)

This project now uses **NextAuth.js (Auth.js)** with a **Credentials provider** as the primary auth provider.

This guide contains:

1. What was implemented in this codebase.
2. Why each piece exists.
3. Step-by-step instructions so you can build/migrate the same setup yourself later.

## Current Architecture

### Version Compatibility (Important)

- This repo currently uses **`next-auth` v4** (`frontend/package.json`).
- Use **v4 route/config pattern** in this codebase.
- Do **not** use v5/Auth.js destructured exports like:
  - `export const { handlers, auth, signIn, signOut } = NextAuth(...)`
  - `export const { GET, POST } = handlers`
- That v5-style code causes build failure at `/api/auth/[...nextauth]` in this project.

### 1) Authentication Provider

- **Provider**: Credentials (`next-auth/providers/credentials`)
- **Source of truth**: MongoDB `User` model
- **Password verification**: `bcrypt.compare`
- **Session strategy**: JWT

Main file: `frontend/auth.ts`

### 2) API Route Handler

- NextAuth route is exposed via App Router at:
  - `frontend/app/api/auth/[...nextauth]/route.ts`

### 3) Client Session Context

- App is wrapped with `SessionProvider` through:
  - `frontend/components/auth-session-provider.tsx`
  - wired in `frontend/app/layout.tsx`

### 4) Role in Token/Session

- Role is attached in callbacks:
  - `jwt` callback adds `token.role` and `token.id`
  - `session` callback adds `session.user.role` and `session.user.id`

### 5) Route Protection

- Dashboard routes are protected by NextAuth token middleware in:
  - `frontend/middleware.ts`
- Redirect behavior:
  - `student` -> `/dashboard/student`
  - `instructor|teacher` -> `/dashboard/teacher`
  - `admin` -> `/dashboard/admin`

---

## What was implemented (full change summary)

### 1) Added NextAuth core configuration

- File: `frontend/auth.ts`
- Implemented `Credentials` provider with Mongo lookup and bcrypt verification.
- Enabled JWT session strategy.
- Added callbacks to inject `id` and `role` into JWT/session.

### 2) Added App Router auth endpoint

- File: `frontend/app/api/auth/[...nextauth]/route.ts`
- Exported v4 handler aliases (`handler as GET`, `handler as POST`).

### 3) Added client session provider

- File: `frontend/components/auth-session-provider.tsx`
- Wrapped app in `SessionProvider`.

### 4) Wired provider and toast in app root

- File: `frontend/app/layout.tsx`
- Added `AuthSessionProvider` around app.
- Added `Toaster` so global toast-based UX works.

### 5) Added typed session/token augmentation

- File: `frontend/types/next-auth.d.ts`
- Extended types for `session.user.id`, `session.user.role`, and JWT fields.

### 6) Migrated route protection to NextAuth tokens

- File: `frontend/middleware.ts`
- Replaced old cookie-role checks with `getToken()` from NextAuth JWT.
- Added role-aware redirect enforcement for dashboard route groups.

### 7) Migrated login/register UI to NextAuth sign-in flow

- Files:
  - `frontend/app/auth/login/page.tsx`
  - `frontend/app/auth/register/page.tsx`
- Login now calls `signIn("credentials")` + `getSession()` for role redirects.
- Register creates user first (server action), then auto-signs in with NextAuth.

### 8) Cleaned legacy auth actions

- File: `frontend/app/actions/auth.ts`
- Kept `registerUser` for account creation.
- Removed legacy cookie session write/read/logout logic.

### 9) Updated API usage to session identity where needed

- Example updated: `frontend/app/api/student/dashboard-preview/route.ts`
- Prefers `auth()` session user ID over old cookie extraction.

---

## Step-by-step: implement AuthProvider yourself

Follow these steps in order.

### Step 1: Install package

In `frontend`:

```bash
npm install next-auth
```

### Step 2: Create central auth config

Create `frontend/auth.ts`:

1. Import `getServerSession`, `NextAuthOptions`, `Credentials`, `bcryptjs`, DB connector, User model.
2. Configure JWT session strategy.
3. In `authorize()`, validate credentials against Mongo user + bcrypt hash.
4. Return user payload `{ id, email, name, role }`.
5. In callbacks, push `id` and `role` into token and session.
6. Export `authOptions` and a helper:

```ts
export async function auth() {
  return getServerSession(authOptions);
}
```

### Step 3: Expose API route

Create `frontend/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Step 4: Add session types

Create `frontend/types/next-auth.d.ts`:

1. Extend `Session.user` with `id` and `role`.
2. Extend `JWT` with `id` and `role`.

### Step 5: Add app-wide session provider

1. Create `frontend/components/auth-session-provider.tsx`.
2. Wrap root app in provider inside `frontend/app/layout.tsx`.

### Step 6: Migrate middleware guard

In `frontend/middleware.ts`:

1. Read token via `getToken({ req, secret })`.
2. If no token, redirect to `/auth/login`.
3. If role/path mismatch, redirect to role-appropriate dashboard.
4. Allow `/auth/*`, `/api/*`, and static routes to pass.

### Step 7: Migrate login page

In login page:

1. Replace old custom login action with `signIn("credentials", { redirect: false })`.
2. Read `getSession()` after successful sign-in.
3. Redirect user by role.

### Step 8: Migrate register page

1. Keep `registerUser` server action for creating account.
2. After successful creation, call `signIn("credentials")`.
3. Fetch session and role-redirect immediately.

### Step 9: Remove legacy cookie-based session logic

1. Delete custom `cookies().set/delete` auth session flow.
2. Keep business actions (like register) but let NextAuth own sessions.

### Step 10: Use `auth()` in server-side secure paths

For protected routes/actions/API handlers:

1. Read session with `auth()`.
2. Use `session.user.id` as server-trusted identity.
3. Avoid relying on localStorage for authorization.

---

## Environment setup

Required for production:

- `NEXTAUTH_SECRET=<strong-random-secret>`

Recommended in local:

- `NEXTAUTH_URL=http://localhost:3000`

---

## Verification checklist

- [ ] Invalid credentials fail login.
- [ ] Valid credentials create NextAuth session.
- [ ] Session contains `user.id` and `user.role`.
- [ ] Middleware redirects to correct dashboard by role.
- [ ] Student cannot stay on teacher routes.
- [ ] Teacher cannot stay on student routes.
- [ ] Register auto-signs in and redirects correctly.
- [ ] Server endpoints can read user identity via `auth()`.

---

## Troubleshooting notes

1. **`session.user.role` undefined**

- Usually missing role assignment in `jwt` and `session` callbacks.

2. **User always redirected to login**

- Check `NEXTAUTH_SECRET` mismatch between auth config and middleware token check.

3. **Credentials login always fails**

- Ensure password was hashed with bcrypt at registration and selected with `+password`.

4. **Role redirects wrong**

- Normalize role strings (`instructor` vs `teacher`) before comparing.

5. **UI still depends on localStorage role for auth decisions**

- Move authorization logic to server/middleware token checks; keep localStorage only for non-security convenience.

6. **Build fails at `/api/auth/[...nextauth]` with `GET` undefined**

- Cause: mixed v4 package with v5-style `handlers` export pattern.
- Fix: use v4 `authOptions` + `NextAuth(authOptions)` handler alias route pattern shown above.

## Implementation status in this repo

Completed:

- Migrated middleware protection to NextAuth token.
- Removed legacy cookie-session auth flow from server actions.
- Kept registration as a business server action and delegated session handling to NextAuth.
- Updated login/register UX to use NextAuth sign-in + role redirects.

Note:

- `localStorage` (`userId`, `role`) still exists in some client flows for convenience.
- Security decisions should rely on NextAuth session/token, not localStorage.

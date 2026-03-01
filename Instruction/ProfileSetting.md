# Profile & Settings Implementation Guide

This document explains exactly what was implemented for Student/Teacher Profile & Settings, why it was done this way, and how to build the same feature yourself from scratch.

---

## 1) What was implemented

### Goal

Replace static profile pages with a fully dynamic, authenticated, database-backed settings system.

### Completed work

1. Added shared Zod validation schemas for all profile/settings forms.
2. Extended the Mongo `User` model with profile/settings fields.
3. Added authenticated server actions (read + update + change password).
4. Built one reusable client UI component for both Student and Teacher.
5. Wired Student and Teacher routes to fetch server data and render the same component.
6. Added global toast renderer so save/error feedback appears in UI.

### Key files

- `frontend/lib/validations/profile.ts`
- `frontend/lib/models/User.ts`
- `frontend/app/actions/profile.ts`
- `frontend/components/profile-settings-page.tsx`
- `frontend/app/dashboard/student/profile/page.tsx`
- `frontend/app/dashboard/teacher/profile/page.tsx`
- `frontend/app/layout.tsx`

---

## 2) Architecture (how the pieces connect)

1. User opens `/dashboard/student/profile` or `/dashboard/teacher/profile`.
2. Route is server-rendered and calls `getCurrentUserProfileSettings()`.
3. Server action uses `auth()` to get current session user.
4. Server action fetches user document from Mongo and normalizes defaults.
5. Data is passed into `ProfileSettingsPage` as `initialData`.
6. User edits forms (RHF + Zod validation).
7. Submit triggers server action (`update...` / `changeCurrentUserPassword`).
8. Server action validates input, writes Mongo, revalidates profile routes.
9. Client shows toast success/error and resets form with latest values.

---

## 3) Data model changes

### Added `User` fields

- `phone?: string`
- `location?: string`
- `studentId?: string`
- `teacherId?: string`
- `notifications` object:
  - `emailAssignments`, `emailGrades`, `emailMessages`, `emailAnnouncements`
  - `pushAssignments`, `pushGrades`, `pushMessages`, `pushReminders`
- `preferences` object:
  - `language` (`en | vi | zh`)
  - `timezone`
  - `theme` (`light | dark | system`)
  - `accessibility.largeText`, `highContrast`, `reducedMotion`

### Why defaults matter

Existing users may not have new fields. Defaults prevent crashes and avoid null/undefined UI issues.

---

## 4) Validation strategy

All validation is centralized in:

- `frontend/lib/validations/profile.ts`

Schemas:

1. `profileInfoSchema`
2. `notificationSettingsSchema`
3. `preferenceSettingsSchema`
4. `changePasswordSchema` (with confirm password refinement)

This gives one source of truth for both server and client.

---

## 5) Server action implementation

File: `frontend/app/actions/profile.ts`

### Core patterns used

1. `auth()` for session identity.
2. `dbConnect()` before all DB operations.
3. `getAuthedUserOrThrow()` helper to reduce duplicate auth/lookup logic.
4. `normalizeProfile()` helper to ensure stable response shape.
5. `revalidatePath()` to refresh route cache after updates.

### Actions provided

1. `getCurrentUserProfileSettings()`
2. `updateCurrentUserProfile(data)`
3. `updateCurrentUserNotifications(data)`
4. `updateCurrentUserPreferences(data)`
5. `changeCurrentUserPassword(data)`

### Password change flow

1. Validate payload with Zod.
2. Load user with `+password` selected.
3. Verify current password with `bcrypt.compare`.
4. Hash new password with `bcrypt.hash`.
5. Save updated hash.

---

## 6) UI implementation details

File: `frontend/components/profile-settings-page.tsx`

### Tabs implemented

1. Profile
2. Notifications
3. Preferences
4. Security

### Form stack

- `react-hook-form`
- `@hookform/resolvers/zod`
- shared Zod schemas

### UX behavior

1. Loading state per section using `useTransition()`.
2. Success/error toasts via `useToast()`.
3. Read-only email field (cannot be edited here).
4. Role-aware ID display:
   - Student shows `studentId`
   - Teacher shows `teacherId`
   - fallback to `N/A`

---

## 7) Route wiring

### Student page

`frontend/app/dashboard/student/profile/page.tsx`

- server component
- `export const dynamic = "force-dynamic"`
- fetches profile via server action
- renders `ProfileSettingsPage`

### Teacher page

`frontend/app/dashboard/teacher/profile/page.tsx`

- server component
- `export const dynamic = "force-dynamic"`
- wrapped in `DashboardLayout`
- fetches profile via same server action
- renders same `ProfileSettingsPage`

Result: one shared implementation across roles.

---

## 8) Step-by-step: build this yourself

Follow this order exactly.

### Step 1: Add dependencies

Ensure you have:

- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `bcryptjs`

### Step 2: Create validation schemas

Create `frontend/lib/validations/profile.ts` with:

1. profile info schema
2. notification schema
3. preference schema
4. password schema (+ confirm check)

### Step 3: Expand your user model

In `frontend/lib/models/User.ts`:

1. Add interface fields.
2. Add schema fields.
3. Set safe defaults for nested objects.

### Step 4: Build server actions

Create `frontend/app/actions/profile.ts`:

1. Add `auth()` check helper.
2. Add profile normalizer helper.
3. Add read action for current user.
4. Add update actions for each section.
5. Add password change action with hash verify/update.
6. Revalidate profile routes after writes.

### Step 5: Build reusable UI component

Create `frontend/components/profile-settings-page.tsx`:

1. Build tabs (profile/notifications/preferences/security).
2. Create one RHF form per tab section.
3. Use Zod resolvers for each form.
4. On submit, call corresponding server action.
5. Show toasts and loading states.

### Step 6: Wire student and teacher routes

1. Student route: fetch and render shared component.
2. Teacher route: fetch and render shared component (inside teacher layout).
3. Mark both routes as dynamic.

### Step 7: Ensure toast provider exists

In root layout, mount `Toaster` so notifications display.

### Step 8: Test manually

1. Login as Student.
2. Update each tab and refresh page.
3. Confirm values persist from Mongo.
4. Test wrong current password.
5. Test role-specific ID display and fallback.
6. Login as Teacher and repeat.

---

## 9) Common pitfalls

1. **Forgot `auth()` guard**: users can update wrong profile if no session check.
2. **No defaults for nested objects**: old users break the UI.
3. **Client-only fetch for secure data**: avoid this; use server actions.
4. **No `+password` select**: password verification fails silently.
5. **No revalidation**: UI may show stale values after save.

---

## 10) Optional improvements (next phase)

1. Add avatar upload to S3 (replace URL input).
2. Add phone format validation by locale.
3. Add audit log for profile/security updates.
4. Add 2FA settings to Security tab.
5. Add admin-managed auto-generation for `studentId`/`teacherId`.

---

## 11) Quick verification checklist

- [ ] Student profile loads from DB.
- [ ] Teacher profile loads from DB.
- [ ] Profile updates persist.
- [ ] Notification toggles persist.
- [ ] Preferences persist.
- [ ] Password change validates current password.
- [ ] Success/error toasts appear.
- [ ] No static dummy data remains on profile pages.

---

## 12) Verify directly in MongoDB (copy/paste)

Use this whenever you want to prove profile/settings updates are persisted.

### A) Quick check for one user by email

Run from repo root:

```bash
docker compose exec mongo mongosh \
  -u admin -p admin --authenticationDatabase admin \
  senior_project \
  --eval 'db.users.findOne({ email: "student1.demo@rewood.local" }, { name: 1, phone: 1, location: 1, bio: 1, notifications: 1, preferences: 1, updatedAt: 1 })'
```

If profile/settings are saved, you will see changed values and a recent `updatedAt`.

### B) Check latest updated users

```bash
docker compose exec mongo mongosh \
  -u admin -p admin --authenticationDatabase admin \
  senior_project \
  --eval 'db.users.find({}, { email: 1, role: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).limit(5).toArray()'
```

This helps confirm your save operation touched the expected account.

### C) Verify password changed (hashed value changed)

The app stores hashed passwords, never plaintext.

```bash
docker compose exec mongo mongosh \
  -u admin -p admin --authenticationDatabase admin \
  senior_project \
  --eval 'db.users.findOne({ email: "student1.demo@rewood.local" }, { password: 1, updatedAt: 1 })'
```

After changing password, the hash string and `updatedAt` should change.

### D) If you use a different account

Replace `student1.demo@rewood.local` with your real login email in the commands above.

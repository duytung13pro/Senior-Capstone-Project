# Copilot Instructions for Project Rewood

## Project Overview
**Project Rewood** is a full-stack Chinese language learning platform with role-based portals (Student, Teacher, Admin, Center) built with Next.js 15 frontend and Spring Boot backend, using MongoDB for persistence.

## Architecture

### Frontend (Next.js 15)
- **Location**: `/frontend`
- **Tech Stack**: Next.js 15, React 19, TypeScript, TailwindCSS, Radix UI, Recharts
- **Structure**: App router with role-based route groups (`/dashboard/(teacher)`, `/dashboard/(student)`, etc.)
- **Key Pattern**: Route groups using parentheses create invisible organizational boundaries; URLs are identical regardless of role
- **Authentication**: Email/password via Spring Boot `/api/login`, role stored in `localStorage`, middleware enforces role-based routing

### Backend (Spring Boot 3.4.4)
- **Location**: `/backend`
- **Tech Stack**: Spring Boot, MongoDB, Lombok, CORS-enabled
- **Port**: `8080` (Docker: `8008`)
- **Key Controllers**: 
  - `AuthController.java` - Register/Login endpoints at `POST /api/register`, `POST /api/login`
  - `UserController.java` - User profile CRUD at `/api/users/{id}`
  - Additional endpoints for courses, enrollments

### Database
- **MongoDB** running on port `27018` (Docker)
- Collections: users, courses, enrollments, and more
- **Frontend Models**: Mongoose schemas in `/frontend/lib/models/` (User.ts, Course.ts, etc.)
- **Backend Models**: Spring documents in `/backend/src/main/java/com/main/backend/model/`

### Deployment
- **Docker Compose** orchestrates all services (MongoDB, Backend, Frontend)
- Build targets: `backend` and `frontend` in Dockerfiles
- Monorepo structure allows unified `docker-compose up`

## Critical Workflows

### Local Development
```bash
# Backend (Maven)
cd backend && mvn spring-boot:run  # Starts on http://localhost:8080

# Frontend (Next.js)
cd frontend && npm run dev         # Starts on http://localhost:3000
```

### Docker Deployment
```bash
docker-compose up --build  # Builds and runs all services
```

### Frontend Tasks (already configured)
- **"Build Frontend"**: Runs `npm run build` in `/frontend`
- **"Run Frontend-Tutor"**: `npm run dev` for teacher portal (depends on Build)
- **"Run Frontend-Student"**: `npm run dev` for student portal (depends on Build)

## Key Patterns & Conventions

### Role-Based Access (Middleware + Cookies)
1. User logs in at `/auth/login` → calls `POST http://localhost:8080/api/login`
2. Backend returns `{ id, email, role: "TEACHER"|"STUDENT"|"ADMIN"|"CENTER" }`
3. Frontend stores role in `localStorage` and redirects to role-specific dashboard
4. `middleware.ts` enforces routing: reads `userRole` cookie, redirects if accessing wrong role's path
5. **Key file**: [middleware.ts](middleware.ts) - validates all dashboard routes
6. **Example**: Teacher accessing `/dashboard` automatically redirects to `/dashboard/teacher`

### Server Actions (Frontend → Mongoose)
- **Location**: `/frontend/app/actions/` (e.g., [course.ts](frontend/app/actions/course.ts))
- Pattern: `"use server"` directive enables server-side execution
- RBAC via `requireRole()` utility from `/frontend/lib/auth/rbac`
- Direct MongoDB queries using Mongoose models in `/frontend/lib/models/`
- **Example**: `createCourse()` requires userId, checks `requireRole(user, "Instructor", "Admin")`

### Component Structure
- **UI Components**: `/frontend/components/ui/` - Radix UI primitives (button, card, select, etc.)
- **Page Components**: `/frontend/app/dashboard/{role}/` - Role-specific pages
- **Shared Components**: `/frontend/components/` - dashboard-layout.tsx, sidebar.tsx, etc.
- **Analytics**: [page.tsx](frontend/app/dashboard/student/analytics/page.tsx) demonstrates Recharts integration for visualizations

### Database Connection Pattern
**Frontend**: Uses pooled Mongoose connection in `/frontend/lib/mongodb.ts`
```typescript
// Cached global connection to prevent exhausting pools
let cached = (global as any).mongoose = { conn: null, promise: null }
```
**Backend**: Spring Data MongoDB auto-configured via properties

## Important Files to Reference

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Full directory structure & feature list |
| [ROUTING_ARCHITECTURE.md](ROUTING_ARCHITECTURE.md) | How role-based route groups work |
| [frontend/lib/auth/rbac.ts](frontend/lib/auth/rbac.ts) | `requireRole()` access control utility |
| [frontend/middleware.ts](middleware.ts) | Route protection & role enforcement |
| [frontend/app/actions/](frontend/app/actions/) | Server actions for DB operations |
| [backend/src/main/java/com/main/backend/controller/AuthController.java](backend/src/main/java/com/main/backend/controller/AuthController.java) | Login/Register endpoints |

## Development Conventions

### When Adding Features
1. **Role-specific UI**: Create new page in `/frontend/app/dashboard/{role}/feature/page.tsx`
2. **Server logic**: Add server action in `/frontend/app/actions/feature.ts` with `requireRole()` check
3. **Components**: Reuse Radix UI + TailwindCSS from `/components/ui/`
4. **Data models**: Update `/frontend/lib/models/` (frontend) and backend models simultaneously

### When Modifying Auth
- Update `middleware.ts` for routing rules
- Update `/frontend/app/auth/login/page.tsx` for login flow
- Update `AuthController.java` for backend validation
- **Do NOT** manually modify role cookies - middleware handles auto-redirect after login

### Language & Localization
- UI text in Vietnamese (Tiếng Việt) throughout login & dashboards
- Internationalization setup exists at `/frontend/i18n/` with `en.ts`, `vi.ts`
- Use `useLanguage()` hook for language switching

## Common Integration Points

### Frontend → Backend Communication
1. Server Actions (preferred for confidential operations like auth)
2. Direct fetch to `http://localhost:8080/api/*` endpoints
3. **CORS enabled** in AuthController with `@CrossOrigin(origins = "http://localhost:3000")`

### Adding New Endpoints
- **Backend**: Create controller in `/backend/src/main/java/com/main/backend/controller/`
- **Frontend**: Either use server actions + Mongoose OR call REST endpoint via fetch
- **Pattern**: Backend responds with DTOs (e.g., `LoginResponse`), frontend consumes as JSON

## Notes
- No JWT tokens implemented yet; auth relies on role cookies + localStorage
- Password stored plaintext in `User.java` - **needs hashing before production** (e.g., bcrypt)
- Admin and Center portals marked as `[TODO]` in ARCHITECTURE.md
- Project uses ES modules and TypeScript strict mode frontend-wide

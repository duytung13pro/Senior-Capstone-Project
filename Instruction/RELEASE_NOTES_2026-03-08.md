# Release Notes — 2026-03-08

## Scope

This release delivered a large integrated update across backend APIs, frontend teacher/student workflows, Docker/dev connectivity, and project documentation.

## Backend Highlights

- Expanded assignment and submission DTOs for:
  - assignment list views with `submittedCount`
  - submission overviews by class/assignment
  - grade request/response payloads
- Added repository support for assignment-submission lookups and counting.
- Hardened class management endpoints (add/remove student, enrollment-related request handling).
- Improved lesson plan and user controller behavior for current frontend workflows.
- Updated model/repository contracts (`User`, `LessonPlan`, `ClassRepository`, `AssignmentRepository`).

## Frontend Highlights

- Added resilient API access via shared helpers and backend proxy route:
  - `frontend/lib/api.ts`
  - `frontend/app/backend-api/[...path]/route.ts`
- Added/expanded teacher flows:
  - assignment overview + grading dashboard
  - lesson plan list + detailed lesson plan page
  - profile/settings integration
- Added/expanded student flows:
  - available classes listing and detail/enrollment pages
  - improved enrolled classes data refresh behavior
- Updated dashboard widgets and supporting components:
  - upcoming assignments, recent classes/messages, messages persistence, class management dialogs

## DevOps & Environment

- Updated Docker compose service wiring and health checks for Mongo/backend/frontend.
- Updated frontend Dockerfile and dependency lock alignment.
- Added diagnostic and utility scripts:
  - `scripts/check_mongo_reachability.sh`
  - `frontend/scripts/test-lesson-plans.mjs`

## Documentation

- Added implementation notes for class student management fixes.
- Added MongoDB connectivity guide for local/WSL/Compass troubleshooting.

## Follow-up Recommendation

For the next increment, split future delivery into smaller commits by domain:

1. backend API/model changes
2. frontend feature UX changes
3. docs/scripts/devops

This keeps review and rollback paths cleaner while preserving release speed.

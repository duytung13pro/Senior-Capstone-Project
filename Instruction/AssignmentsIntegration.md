# Assignments Integration Guide

This document explains what was implemented for Teacher Assignments, how the frontend route/data flow connects to backend APIs + MongoDB, and which Java backend files are used.

---

## 1) What was implemented

### Frontend (Teacher Assignments page)

Updated file:

- `frontend/components/assignments-page.tsx`

Changes made:

1. Removed hard-coded mock assignments list.
2. Added live loading of teacher classes from backend using `teacherId` from `localStorage`.
3. Added live loading of assignments for each teacher class and merged into one teacher-level overview list.
4. Added create assignment flow using backend API.
5. Updated detail view routing to teacher dashboard URL query format.
6. Kept existing table/detail UX, but data is now backend-driven.
7. Added computed assignment status from deadline (`Open`, `Due Soon`, `Past Due`).

---

## 2) Frontend ↔ Backend routing/data flow

### Page route (teacher portal)

- UI route: `/dashboard/teacher/assignments`
- Page file: `frontend/app/dashboard/teacher/assignments/page.tsx`
- Component used: `AssignmentsPage`

### API endpoints used by frontend

1. Load teacher classes

- `GET /api/classes/my?teacherId=<teacherId>`
- Used to populate class dropdown/filter and map `classId -> className`.

2. Load assignments by class

- `GET /api/classes/{classId}/assignments`
- Called for each class returned by step 1.
- Frontend merges all class assignment arrays into one list.

3. Create assignment

- `POST /api/classes/{classId}/create-assignment`
- Body includes `title`, `description`, `deadline`, `maxScore`.

### Detail query behavior

- Clicking an assignment row pushes:
  - `/dashboard/teacher/assignments?id=<assignmentId>`
- Detail pane reads `id` from URL query via `useSearchParams()`.

---

## 3) Backend Java files involved

Assignments integration uses existing class/assignment backend APIs under `ClassController`.

### Main controller used

- `backend/src/main/java/com/main/backend/controller/ClassController.java`

Methods used by frontend:

- `getMyClasses(@RequestParam String teacherId)`
  - route: `GET /api/classes/my`
- `createAssignment(@PathVariable String classId, @RequestBody CreateAssignmentRequest req)`
  - route: `POST /api/classes/{classId}/create-assignment`
- `getAssignments(@PathVariable String classId)`
  - route: `GET /api/classes/{classId}/assignments`

### Supporting Java files used by these routes

- `backend/src/main/java/com/main/backend/model/Assignment.java`
- `backend/src/main/java/com/main/backend/dto/CreateAssignmentRequest.java`
- `backend/src/main/java/com/main/backend/dto/CreateAssignmentRespond.java`
- `backend/src/main/java/com/main/backend/repository/AssignmentRepository.java`
- `backend/src/main/java/com/main/backend/repository/ClassRepository.java`

---

## 4) Notes about current backend scope

Current backend supports:

- class-scoped assignment create/list

Current backend does not yet provide (for teacher overview page):

- assignment update endpoint
- assignment delete endpoint
- submission tracking endpoints for assignment detail table

Because those endpoints are not available yet, the teacher overview page currently shows informational placeholders in Submissions/Schedule tabs.

---

## 5) Quick verification checklist

1. Login as teacher.
2. Open `/dashboard/teacher/assignments`.
3. Confirm assignments load from backend (not mock data).
4. Create an assignment and confirm it appears immediately in the list.
5. Filter by class and status.
6. Click a row and confirm URL query updates with `?id=<assignmentId>` and detail pane loads.

---

## 6) Related files touched

Frontend:

- `frontend/components/assignments-page.tsx`

Backend used (existing):

- `backend/src/main/java/com/main/backend/controller/ClassController.java`
- `backend/src/main/java/com/main/backend/model/Assignment.java`
- `backend/src/main/java/com/main/backend/dto/CreateAssignmentRequest.java`
- `backend/src/main/java/com/main/backend/dto/CreateAssignmentRespond.java`
- `backend/src/main/java/com/main/backend/repository/AssignmentRepository.java`

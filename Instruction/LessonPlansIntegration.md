# Lesson Plans Integration Guide

This document explains what was implemented for Lesson Plans, how the frontend routes/data flow connect to backend APIs + MongoDB, and how to create the Java backend files.

---

## 1) What was implemented

### Frontend (Teacher Lesson Plans page)

Updated file:

- `frontend/components/lesson-plans-page.tsx`

Changes made:

1. Removed hard-coded mock `lessonPlans` array.
2. Added live load from backend using `teacherId` from `localStorage`.
3. Added class lookup from backend so class names are shown from real class data.
4. Added create lesson plan action (POST).
5. Added duplicate lesson plan action (POST).
6. Added delete lesson plan action (DELETE).
7. Kept existing UI layout and filtering UX, but now all list data is from backend.

### Backend (Lesson Plans API + persistence)

New Java files:

- `backend/src/main/java/com/main/backend/model/LessonPlan.java`
- `backend/src/main/java/com/main/backend/repository/LessonPlanRepository.java`
- `backend/src/main/java/com/main/backend/dto/CreateLessonPlanRequest.java`
- `backend/src/main/java/com/main/backend/controller/LessonPlanController.java`

What these do:

- `LessonPlan.java`: Mongo document model (`lesson_plans` collection).
- `LessonPlanRepository.java`: Spring Data Mongo repository with teacher-scoped query.
- `CreateLessonPlanRequest.java`: request payload DTO for create endpoint.
- `LessonPlanController.java`: REST endpoints for list/create/delete/duplicate.

---

## 2) Frontend ↔ Backend routing/data flow

### Page route (teacher portal)

- UI route: `/dashboard/teacher/lesson-plans`
- Page file: `frontend/app/dashboard/teacher/lesson-plans/page.tsx`
- Component used: `LessonPlansPage`

### API endpoints used by frontend

1. Load teacher classes

- `GET /api/classes/my?teacherId=<teacherId>`
- Used to build class filter options and map `classId -> className`.

2. Load lesson plans

- `GET /api/lesson-plans?teacherId=<teacherId>`
- Returns all lesson plans for current teacher.

3. Create lesson plan

- `POST /api/lesson-plans`
- Body includes `teacherId`, `classId`, `title`, `date`, `status`, `objectives`, `activities`, `materials`, `assessment`, `template`.

4. Delete lesson plan

- `DELETE /api/lesson-plans/{lessonPlanId}?teacherId=<teacherId>`

5. Duplicate lesson plan

- `POST /api/lesson-plans/{lessonPlanId}/duplicate?teacherId=<teacherId>`

---

## 3) Java file creation steps (exact structure)

Use this pattern for future backend resources.

### Step A: Create model

Path:

- `backend/src/main/java/com/main/backend/model/LessonPlan.java`

Key points:

- Package must match folder: `package com.main.backend.model;`
- Add `@Document(collection = "lesson_plans")`
- Add `@Id` for `id`
- Include fields needed by frontend and timestamps

### Step B: Create repository

Path:

- `backend/src/main/java/com/main/backend/repository/LessonPlanRepository.java`

Key points:

- Package: `com.main.backend.repository`
- Extend `MongoRepository<LessonPlan, String>`
- Add query method:
  - `List<LessonPlan> findByTeacherIdOrderByDateAsc(String teacherId);`

### Step C: Create DTO for request payload

Path:

- `backend/src/main/java/com/main/backend/dto/CreateLessonPlanRequest.java`

Key points:

- Package: `com.main.backend.dto`
- Add fields matching frontend create request body
- Add getters/setters for Spring JSON binding

### Step D: Create controller

Path:

- `backend/src/main/java/com/main/backend/controller/LessonPlanController.java`

Key points:

- Package: `com.main.backend.controller`
- Annotate class:
  - `@RestController`
  - `@RequestMapping("/api/lesson-plans")`
  - `@CrossOrigin(origins = "http://localhost:3000")`
- Inject `LessonPlanRepository` via constructor
- Implement endpoints:
  - `GET /api/lesson-plans`
  - `POST /api/lesson-plans`
  - `DELETE /api/lesson-plans/{lessonPlanId}`
  - `POST /api/lesson-plans/{lessonPlanId}/duplicate`

### Step E: Hook up and run

- Spring Boot auto-detects `@RestController`, model and repository in package scan.
- No manual route registration needed.

---

## 4) Notes on status/date behavior

- Date is parsed in backend with:
  - `Instant.parse(...)` for ISO datetime.
  - fallback to `LocalDate.parse(...)` for date-only input.
- Status defaults to:
  - `Template` when `template=true`
  - `Draft` otherwise (if client does not send status).

---

## 5) Quick verification checklist

1. Login as teacher.
2. Open `/dashboard/teacher/lesson-plans`.
3. Confirm cards load from DB (not mock).
4. Create lesson plan and verify it appears immediately.
5. Duplicate lesson plan and verify `(Copy)` appears.
6. Delete lesson plan and verify it is removed from UI + DB.

---

## 6) Related files touched

Frontend:

- `frontend/components/lesson-plans-page.tsx`

Backend:

- `backend/src/main/java/com/main/backend/model/LessonPlan.java`
- `backend/src/main/java/com/main/backend/repository/LessonPlanRepository.java`
- `backend/src/main/java/com/main/backend/dto/CreateLessonPlanRequest.java`
- `backend/src/main/java/com/main/backend/controller/LessonPlanController.java`

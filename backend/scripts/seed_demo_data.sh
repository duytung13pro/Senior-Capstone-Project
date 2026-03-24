#!/usr/bin/env bash
set -euo pipefail

BACKEND_BASIC_AUTH="${BACKEND_BASIC_AUTH:-}"
BASE_URL="${BASE_URL:-http://localhost:8081}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MONGODB_URI="${MONGODB_URI:-mongodb://admin:admin@localhost:27017/senior_database?authSource=admin}"
SEED_FRONTEND_ANALYTICS="${SEED_FRONTEND_ANALYTICS:-true}"

TEACHER_A_EMAIL="${TEACHER_A_EMAIL:-teacher.ai.demo@rewood.local}"
TEACHER_B_EMAIL="${TEACHER_B_EMAIL:-teacher.mandarin.demo@rewood.local}"
TEACHER_PASSWORD="${TEACHER_PASSWORD:-password123}"
STUDENT_PASSWORD="${STUDENT_PASSWORD:-password123}"

STUDENT_1_EMAIL="${STUDENT_1_EMAIL:-student1.demo@rewood.local}"
STUDENT_2_EMAIL="${STUDENT_2_EMAIL:-student2.demo@rewood.local}"
STUDENT_3_EMAIL="${STUDENT_3_EMAIL:-student3.demo@rewood.local}"

api_request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  if [[ -n "${BACKEND_BASIC_AUTH}" ]]; then
    if [[ -n "${body}" ]]; then
      curl -sS -X "${method}" "${BASE_URL}${path}" \
        -u "${BACKEND_BASIC_AUTH}" \
        -H "Content-Type: application/json" \
        -d "${body}"
      return
    fi

    curl -sS -X "${method}" "${BASE_URL}${path}" \
      -u "${BACKEND_BASIC_AUTH}" \
      -H "Content-Type: application/json"
    return
  fi

  if [[ -n "${body}" ]]; then
    curl -sS -X "${method}" "${BASE_URL}${path}" \
      -H "Content-Type: application/json" \
      -d "${body}"
    return
  fi

  curl -sS -X "${method}" "${BASE_URL}${path}" \
    -H "Content-Type: application/json"
}

check_backend() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/login" || true)

  if [[ "${code}" == "000" ]]; then
    echo "Backend is not reachable at ${BASE_URL}."
    echo "If running from devcontainer, use one of:"
    echo "  BASE_URL=http://backend:8081"
    echo "  BASE_URL=http://host.docker.internal:8008"
    exit 1
  fi
}

post_json() {
  api_request "POST" "$1" "$2"
}

put_json() {
  api_request "PUT" "$1" "$2"
}

get_json() {
  api_request "GET" "$1"
}

json_field() {
  local field="$1"
  python3 -c "import json,sys; raw=sys.stdin.read().strip(); data=(json.loads(raw) if raw else {}); print(data.get('${field}','') if isinstance(data, dict) else '')"
}

json_find_class_id_by_name() {
  local class_name="$1"
  python3 -c "import json,sys; name='''${class_name}'''; raw=sys.stdin.read().strip(); data=(json.loads(raw) if raw else []);\
items=data if isinstance(data,list) else [];\
print(next((str(i.get('id','')) for i in items if isinstance(i,dict) and str(i.get('name','')).strip()==name),''))"
}

json_find_assignment_id_by_title() {
  local assignment_title="$1"
  python3 -c "import json,sys; title='''${assignment_title}'''; raw=sys.stdin.read().strip(); data=(json.loads(raw) if raw else []);\
items=data if isinstance(data,list) else [];\
print(next((str(i.get('id','')) for i in items if isinstance(i,dict) and str(i.get('title','')).strip()==title),''))"
}

json_array_has_title() {
  local title="$1"
  python3 -c "import json,sys; t='''${title}'''; raw=sys.stdin.read().strip(); data=(json.loads(raw) if raw else []);\
items=data if isinstance(data,list) else [];\
print('1' if any(isinstance(i,dict) and str(i.get('title','')).strip()==t for i in items) else '')"
}

ensure_user() {
  local first_name="$1"
  local last_name="$2"
  local phone="$3"
  local email="$4"
  local password="$5"
  local role="$6"

  post_json "/api/register" "{
    \"firstName\": \"${first_name}\",
    \"lastName\": \"${last_name}\",
    \"phone\": \"${phone}\",
    \"email\": \"${email}\",
    \"password\": \"${password}\",
    \"role\": \"${role}\"
  }" >/dev/null || true
}

login_user_id() {
  local email="$1"
  local password="$2"

  local login_response
  login_response=$(post_json "/api/login" "{\"email\":\"${email}\",\"password\":\"${password}\"}")

  if [[ -z "${login_response}" ]]; then
    local status_code
    if [[ -n "${BACKEND_BASIC_AUTH}" ]]; then
      status_code=$(curl -s -o /dev/null -w "%{http_code}" -u "${BACKEND_BASIC_AUTH}" -X POST "${BASE_URL}/api/login" -H "Content-Type: application/json" -d "{\"email\":\"${email}\",\"password\":\"${password}\"}" || true)
    else
      status_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/login" -H "Content-Type: application/json" -d "{\"email\":\"${email}\",\"password\":\"${password}\"}" || true)
    fi

    if [[ "${status_code}" == "402" ]]; then
      if [[ -n "${BACKEND_BASIC_AUTH}" ]]; then
        echo "Backend rejected Basic Auth credentials (HTTP 402)." >&2
        echo "Provided BACKEND_BASIC_AUTH is not valid for this backend." >&2
      else
        echo "Backend rejected unauthenticated API calls (HTTP 402)." >&2
        echo "Your backend has HTTP Basic auth enabled." >&2
        echo "Set BACKEND_BASIC_AUTH=user:password when running the script." >&2
      fi
      return 1
    fi
  fi

  echo "${login_response}" | json_field "id"
}

ensure_class() {
  local teacher_id="$1"
  local class_name="$2"
  local level="$3"
  local time="$4"
  local days="$5"
  local description="$6"
  local room="$7"
  local max_students="$8"

  local existing
  existing=$(get_json "/api/classes/my?teacherId=${teacher_id}" | json_find_class_id_by_name "${class_name}")
  if [[ -n "${existing}" ]]; then
    echo "${existing}"
    return
  fi

  local created
  created=$(post_json "/api/classes/create" "{
    \"name\": \"${class_name}\",
    \"level\": \"${level}\",
    \"time\": \"${time}\",
    \"days\": \"${days}\",
    \"description\": \"${description}\",
    \"room\": \"${room}\",
    \"maxStudents\": ${max_students},
    \"startDate\": \"2026-03-01\",
    \"endDate\": \"2026-07-30\",
    \"teacherId\": \"${teacher_id}\"
  }")

  local class_id
  class_id=$(echo "${created}" | json_field "id")
  if [[ -z "${class_id}" ]]; then
    echo "Failed to create class '${class_name}'. Response: ${created}" >&2
    exit 1
  fi

  echo "${class_id}"
}

enroll_student() {
  local class_id="$1"
  local student_email="$2"
  post_json "/api/classes/add-student" "{
    \"classId\": \"${class_id}\",
    \"studentEmail\": \"${student_email}\"
  }" >/dev/null || true
}

ensure_module() {
  local class_id="$1"
  local title="$2"

  local existing
  existing=$(get_json "/api/classes/${class_id}/modules" | json_array_has_title "${title}")
  if [[ -n "${existing}" ]]; then
    return
  fi

  post_json "/api/classes/${class_id}/modules" "{\"title\":\"${title}\"}" >/dev/null
}

ensure_resource() {
  local class_id="$1"
  local title="$2"
  local url="$3"

  local existing
  existing=$(get_json "/api/classes/${class_id}/resources" | json_array_has_title "${title}")
  if [[ -n "${existing}" ]]; then
    return
  fi

  post_json "/api/classes/${class_id}/resources" "{
    \"title\": \"${title}\",
    \"url\": \"${url}\"
  }" >/dev/null
}

ensure_announcement() {
  local teacher_id="$1"
  local class_id="$2"
  local title="$3"
  local content="$4"

  local existing
  existing=$(get_json "/api/classes/${class_id}/announcements" | json_array_has_title "${title}")
  if [[ -n "${existing}" ]]; then
    return
  fi

  post_json "/api/classes/announcements" "{
    \"teacherId\": \"${teacher_id}\",
    \"targetClassId\": \"${class_id}\",
    \"title\": \"${title}\",
    \"content\": \"${content}\",
    \"status\": \"Published\",
    \"pinned\": true
  }" >/dev/null
}

ensure_assignment() {
  local class_id="$1"
  local title="$2"
  local description="$3"
  local deadline="$4"
  local max_score="$5"

  local existing
  existing=$(get_json "/api/classes/${class_id}/assignments" | json_find_assignment_id_by_title "${title}")
  if [[ -n "${existing}" ]]; then
    echo "${existing}"
    return
  fi

  local created
  created=$(post_json "/api/classes/${class_id}/create-assignment" "{
    \"title\": \"${title}\",
    \"description\": \"${description}\",
    \"deadline\": \"${deadline}\",
    \"maxScore\": ${max_score}
  }")

  local assignment_id
  assignment_id=$(echo "${created}" | json_field "id")
  if [[ -z "${assignment_id}" ]]; then
    echo "Failed to create assignment '${title}'. Response: ${created}" >&2
    exit 1
  fi

  echo "${assignment_id}"
}

submit_and_grade() {
  local class_id="$1"
  local assignment_id="$2"
  local student_id="$3"
  local score="$4"
  local feedback="$5"

  post_json "/api/classes/${class_id}/assignments/${assignment_id}/submit" "{
    \"studentId\": \"${student_id}\"
  }" >/dev/null

  put_json "/api/classes/${class_id}/assignments/${assignment_id}/submissions/${student_id}/grade" "{
    \"score\": ${score},
    \"feedback\": \"${feedback}\"
  }" >/dev/null
}

seed_frontend_analytics() {
  local teacher_a_id="$1"
  local teacher_b_id="$2"
  local student_1_id="$3"
  local student_2_id="$4"
  local student_3_id="$5"

  if [[ "${SEED_FRONTEND_ANALYTICS}" != "true" ]]; then
    echo "Skipping frontend analytics seed (SEED_FRONTEND_ANALYTICS=${SEED_FRONTEND_ANALYTICS})."
    return
  fi

  if [[ ! -d "${PROJECT_ROOT}/frontend" ]]; then
    echo "Frontend directory not found at ${PROJECT_ROOT}/frontend; skipping frontend analytics seed." >&2
    return
  fi

  echo "Seeding frontend analytics collections (courses/enrollments/assignments/submissions/study_analytics)..."

  (
    cd "${PROJECT_ROOT}/frontend"
    MONGODB_URI="${MONGODB_URI}" \
    TEACHER_A_ID="${teacher_a_id}" \
    TEACHER_B_ID="${teacher_b_id}" \
    STUDENT_1_ID="${student_1_id}" \
    STUDENT_2_ID="${student_2_id}" \
    STUDENT_3_ID="${student_3_id}" \
    node - <<'NODE'
const mongoose = require("mongoose");

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

const getWeekStartUtc = (date) => {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diffToMonday);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const atUtcHour = (base, dayOffset, hour) => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI for frontend analytics seed");
  }

  const teacherAId = process.env.TEACHER_A_ID;
  const teacherBId = process.env.TEACHER_B_ID;
  const student1Id = process.env.STUDENT_1_ID;
  const student2Id = process.env.STUDENT_2_ID;
  const student3Id = process.env.STUDENT_3_ID;

  if (!teacherAId || !teacherBId || !student1Id || !student2Id || !student3Id) {
    throw new Error("Missing required seeded user IDs");
  }

  await mongoose.connect(mongoUri, { bufferCommands: false });
  const db = mongoose.connection.db;

  const courses = db.collection("courses");
  const enrollments = db.collection("enrollments");
  const assignments = db.collection("assignments");
  const submissions = db.collection("submissions");
  const studyAnalytics = db.collection("studyanalytics");
  const weeklyStudy = db.collection("studentweeklystudies");
  const studentStats = db.collection("studentstats");
  const messages = db.collection("messages");

  const now = new Date();
  const weekStart = getWeekStartUtc(now);

  const upsertCourse = async ({ title, description, instructorId, level, duration }) => {
    const filter = { title, instructor: toObjectId(instructorId) };
    const update = {
      $set: {
        title,
        description,
        instructor: toObjectId(instructorId),
        level,
        duration,
        price: 0,
        enrollmentCount: 0,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    };

    const res = await courses.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: "after",
    });

    return res.value;
  };

  const csCourse = await upsertCourse({
    title: "CS 402: Intro to AI",
    description: "AI foundations, ethics, and practical projects.",
    instructorId: teacherAId,
    level: "Advanced",
    duration: 2400,
  });

  const mandarinCourse = await upsertCourse({
    title: "Beginner Mandarin",
    description: "Core Mandarin speaking and listening for beginners.",
    instructorId: teacherBId,
    level: "Beginner",
    duration: 1800,
  });

  const upsertEnrollment = async (studentId, courseId, progress) => {
    await enrollments.updateOne(
      {
        student: toObjectId(studentId),
        course: courseId,
      },
      {
        $set: {
          student: toObjectId(studentId),
          course: courseId,
          progress,
          completedModules: [],
          completedAt: null,
          updatedAt: now,
        },
        $setOnInsert: {
          enrolledAt: now,
          createdAt: now,
        },
      },
      { upsert: true },
    );
  };

  await upsertEnrollment(student1Id, csCourse._id, 82);
  await upsertEnrollment(student1Id, mandarinCourse._id, 76);
  await upsertEnrollment(student2Id, csCourse._id, 54);
  await upsertEnrollment(student3Id, csCourse._id, 31);

  await courses.updateOne(
    { _id: csCourse._id },
    { $set: { enrollmentCount: 3, updatedAt: now } },
  );

  await courses.updateOne(
    { _id: mandarinCourse._id },
    { $set: { enrollmentCount: 1, updatedAt: now } },
  );

  const upsertAssignment = async ({ courseId, title, description, type, dueDate, totalPoints, createdBy }) => {
    const filter = { course: courseId, title };
    const update = {
      $set: {
        course: courseId,
        title,
        description,
        type,
        dueDate,
        totalPoints,
        attachments: [],
        createdBy: toObjectId(createdBy),
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    };

    const res = await assignments.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: "after",
    });

    return res.value;
  };

  const aiEthics = await upsertAssignment({
    courseId: csCourse._id,
    title: "AI Ethics Reflection",
    description: "Reflect on fairness and bias in modern AI systems.",
    type: "essay",
    dueDate: atUtcHour(weekStart, 2, 18),
    totalPoints: 100,
    createdBy: teacherAId,
  });

  const nnQuiz = await upsertAssignment({
    courseId: csCourse._id,
    title: "Neural Networks Quiz 1",
    description: "Quiz on perceptrons and backpropagation.",
    type: "quiz",
    dueDate: atUtcHour(weekStart, 3, 19),
    totalPoints: 100,
    createdBy: teacherAId,
  });

  const livePending = await upsertAssignment({
    courseId: csCourse._id,
    title: "Live Demo: AI Discussion Prompt",
    description: "Submit a short response on an AI ethics scenario.",
    type: "homework",
    dueDate: atUtcHour(weekStart, 5, 20),
    totalPoints: 100,
    createdBy: teacherAId,
  });

  const mandarinRecording = await upsertAssignment({
    courseId: mandarinCourse._id,
    title: "Pinyin Practice Recording",
    description: "Upload a 2-minute pronunciation recording.",
    type: "project",
    dueDate: atUtcHour(weekStart, 4, 18),
    totalPoints: 100,
    createdBy: teacherBId,
  });

  const upsertSubmission = async ({ assignmentId, studentId, submittedAt, status }) => {
    await submissions.updateOne(
      {
        assignmentId: assignmentId.toString(),
        studentId: studentId.toString(),
      },
      {
        $set: {
          assignmentId: assignmentId.toString(),
          assignment: assignmentId,
          studentId: studentId.toString(),
          student: toObjectId(studentId),
          submitted: true,
          isSubmitted: true,
          status,
          submittedAt,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  };

  await upsertSubmission({
    assignmentId: aiEthics._id,
    studentId: student1Id,
    submittedAt: atUtcHour(weekStart, 1, 12),
    status: "graded",
  });

  await upsertSubmission({
    assignmentId: nnQuiz._id,
    studentId: student1Id,
    submittedAt: atUtcHour(weekStart, 2, 15),
    status: "submitted",
  });

  await upsertSubmission({
    assignmentId: mandarinRecording._id,
    studentId: student1Id,
    submittedAt: atUtcHour(weekStart, 3, 11),
    status: "submitted",
  });

  await upsertSubmission({
    assignmentId: aiEthics._id,
    studentId: student2Id,
    submittedAt: atUtcHour(weekStart, 3, 10),
    status: "submitted",
  });

  const upsertStudentStats = async (studentId, stats) => {
    await studentStats.updateOne(
      {
        studentId: String(studentId),
      },
      {
        $set: {
          studentId: String(studentId),
          currentStreak: Number(stats.currentStreak || 0),
          longestStreak: Number(stats.longestStreak || 0),
          totalActiveDays: Number(stats.totalActiveDays || 0),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  };

  const upsertStudyDay = async ({
    studentId,
    courseId,
    date,
    minutes,
    quizScore,
    assignmentsSubmitted,
    practiceMinutes,
    videosWatched,
    exercisesCompleted,
    forumPosts,
    resourcesDownloaded,
  }) => {
    await studyAnalytics.updateOne(
      {
        student: toObjectId(studentId),
        course: courseId,
        date,
      },
      {
        $set: {
          student: toObjectId(studentId),
          course: courseId,
          date,
          studyMinutes: minutes,
          practiceMinutes,
          modulesCompleted: minutes > 0 ? 1 : 0,
          quizzesTaken: quizScore > 0 ? 1 : 0,
          averageQuizScore: quizScore,
          assignmentsSubmitted,
          videosWatched,
          exercisesCompleted,
          forumPosts,
          resourcesDownloaded,
          resourcesViewed: minutes > 0 ? 2 : 0,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  };

  const dayMs = 24 * 60 * 60 * 1000;
  const streakStartCutoff = new Date(now.getTime() - 11 * dayMs);

  const deterministicNoise = (weekIndex, dayIndex, salt) => {
    const raw = Math.sin((weekIndex + 1) * 13.17 + (dayIndex + 1) * 7.91 + salt * 3.77);
    return Math.round(raw * 1000) / 1000;
  };

  console.log("Seeding historical 8-week analytics data...");

  for (let weekOffset = -7; weekOffset <= 0; weekOffset += 1) {
    const offsetWeekStart = new Date(weekStart);
    offsetWeekStart.setUTCDate(offsetWeekStart.getUTCDate() + weekOffset * 7);
    const weekIndex = weekOffset + 7;
    const trend = weekIndex / 7;

    for (let dayIndex = 0; dayIndex <= 6; dayIndex += 1) {
      const date = atUtcHour(offsetWeekStart, dayIndex, 9);
      const isRecentStreakDay = date >= streakStartCutoff && date <= now;

      let studyMinutes = Math.round(35 + trend * 45 + deterministicNoise(weekIndex, dayIndex, 1) * 10);
      if (!isRecentStreakDay && dayIndex === 6 && weekIndex < 3) {
        studyMinutes = Math.max(0, studyMinutes - 25);
      }
      if (isRecentStreakDay) {
        studyMinutes = Math.max(50, studyMinutes);
      }
      studyMinutes = Math.max(0, studyMinutes);

      const practiceMinutes = studyMinutes > 0
        ? Math.max(5, Math.round(studyMinutes * (0.35 + 0.1 * Math.max(0, deterministicNoise(weekIndex, dayIndex, 2)))))
        : 0;

      const quizScore = studyMinutes > 0
        ? Math.max(60, Math.min(99, Math.round(68 + trend * 24 + deterministicNoise(weekIndex, dayIndex, 3) * 5)))
        : 0;

      const videosWatched = studyMinutes > 0
        ? Math.max(0, Math.round(1 + trend * 2 + deterministicNoise(weekIndex, dayIndex, 4) * 1.2))
        : 0;

      const exercisesCompleted = studyMinutes > 0
        ? Math.max(0, Math.round(2 + trend * 4 + deterministicNoise(weekIndex, dayIndex, 5) * 2))
        : 0;

      const forumPosts = studyMinutes > 0 && dayIndex % 3 === 0
        ? Math.max(0, Math.round(0.5 + trend * 1.5 + deterministicNoise(weekIndex, dayIndex, 6)))
        : 0;

      const resourcesDownloaded = studyMinutes > 0
        ? Math.max(0, Math.round(1 + trend * 2 + deterministicNoise(weekIndex, dayIndex, 7) * 1.1))
        : 0;

      const assignmentsSubmitted = (studyMinutes > 0 && dayIndex === 2 && weekIndex % 2 === 0) ? 1 : 0;
      const courseId = dayIndex % 2 === 0 ? csCourse._id : mandarinCourse._id;

      await upsertStudyDay({
        studentId: student1Id,
        courseId,
        date,
        minutes: studyMinutes,
        quizScore,
        assignmentsSubmitted,
        practiceMinutes,
        videosWatched,
        exercisesCompleted,
        forumPosts,
        resourcesDownloaded,
      });
    }
  }

  const upsertLowEngagementStudy = async (studentId, entries) => {
    for (const entry of entries) {
      const date = atUtcHour(weekStart, entry.dayOffset, 9);
      await upsertStudyDay({
        studentId,
        courseId: csCourse._id,
        date,
        minutes: entry.minutes,
        quizScore: entry.quizScore,
        assignmentsSubmitted: entry.assignmentsSubmitted,
        practiceMinutes: entry.practiceMinutes,
        videosWatched: entry.videosWatched,
        exercisesCompleted: entry.exercisesCompleted,
        forumPosts: entry.forumPosts,
        resourcesDownloaded: entry.resourcesDownloaded,
      });
    }
  };

  await upsertLowEngagementStudy(student2Id, [
    { dayOffset: 1, minutes: 45, quizScore: 74, assignmentsSubmitted: 1, practiceMinutes: 18, videosWatched: 1, exercisesCompleted: 3, forumPosts: 0, resourcesDownloaded: 1 },
    { dayOffset: 3, minutes: 35, quizScore: 71, assignmentsSubmitted: 0, practiceMinutes: 14, videosWatched: 1, exercisesCompleted: 2, forumPosts: 0, resourcesDownloaded: 1 },
    { dayOffset: 5, minutes: 20, quizScore: 69, assignmentsSubmitted: 0, practiceMinutes: 8, videosWatched: 0, exercisesCompleted: 1, forumPosts: 0, resourcesDownloaded: 0 },
  ]);

  await upsertLowEngagementStudy(student3Id, [
    { dayOffset: 0, minutes: 10, quizScore: 58, assignmentsSubmitted: 0, practiceMinutes: 4, videosWatched: 0, exercisesCompleted: 1, forumPosts: 0, resourcesDownloaded: 0 },
    { dayOffset: 4, minutes: 12, quizScore: 61, assignmentsSubmitted: 0, practiceMinutes: 5, videosWatched: 0, exercisesCompleted: 1, forumPosts: 0, resourcesDownloaded: 0 },
  ]);

  await upsertStudentStats(student1Id, {
    currentStreak: 12,
    longestStreak: 21,
    totalActiveDays: 89,
  });

  await upsertStudentStats(student2Id, {
    currentStreak: 3,
    longestStreak: 8,
    totalActiveDays: 36,
  });

  await upsertStudentStats(student3Id, {
    currentStreak: 1,
    longestStreak: 4,
    totalActiveDays: 17,
  });

  await weeklyStudy.updateOne(
    {
      student: toObjectId(student1Id),
      weekStart,
    },
    {
      $set: {
        student: toObjectId(student1Id),
        weekStart,
        trackedMinutes: 120,
        lastHeartbeatAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  await messages.updateOne(
    {
      recipient: toObjectId(student1Id),
      sender: toObjectId(teacherAId),
      subject: "CS 402 feedback follow-up",
    },
    {
      $set: {
        recipient: toObjectId(student1Id),
        sender: toObjectId(teacherAId),
        course: csCourse._id,
        subject: "CS 402 feedback follow-up",
        content: "Great progress this week. Please revise your discussion response.",
        read: false,
        starred: false,
        archived: false,
        attachments: [],
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log("Frontend analytics seed complete.");
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
NODE
  )
}

echo "Seeding presentation demo data..."
check_backend

echo "Ensuring users..."
ensure_user "Ari" "Tran" "0900000010" "${TEACHER_A_EMAIL}" "${TEACHER_PASSWORD}" "TEACHER"
ensure_user "Bao" "Le" "0900000011" "${TEACHER_B_EMAIL}" "${TEACHER_PASSWORD}" "TEACHER"
ensure_user "An" "Student" "0900000002" "${STUDENT_1_EMAIL}" "${STUDENT_PASSWORD}" "STUDENT"
ensure_user "Binh" "Student" "0900000003" "${STUDENT_2_EMAIL}" "${STUDENT_PASSWORD}" "STUDENT"
ensure_user "Chi" "Student" "0900000004" "${STUDENT_3_EMAIL}" "${STUDENT_PASSWORD}" "STUDENT"

TEACHER_A_ID=$(login_user_id "${TEACHER_A_EMAIL}" "${TEACHER_PASSWORD}")
TEACHER_B_ID=$(login_user_id "${TEACHER_B_EMAIL}" "${TEACHER_PASSWORD}")
STUDENT_1_ID=$(login_user_id "${STUDENT_1_EMAIL}" "${STUDENT_PASSWORD}")
STUDENT_2_ID=$(login_user_id "${STUDENT_2_EMAIL}" "${STUDENT_PASSWORD}")
STUDENT_3_ID=$(login_user_id "${STUDENT_3_EMAIL}" "${STUDENT_PASSWORD}")

if [[ -z "${TEACHER_A_ID}" || -z "${TEACHER_B_ID}" || -z "${STUDENT_1_ID}" || -z "${STUDENT_2_ID}" || -z "${STUDENT_3_ID}" ]]; then
  echo "Failed to resolve one or more user IDs via /api/login" >&2
  exit 1
fi

echo "Ensuring classes..."
CS402_CLASS_ID=$(ensure_class "${TEACHER_A_ID}" "CS 402: Intro to AI" "ADVANCED" "09:00" "Tue,Thu" "AI foundations, ethics, and practical projects." "A-301" "40")
MANDARIN_CLASS_ID=$(ensure_class "${TEACHER_B_ID}" "Beginner Mandarin" "BEGINNER" "18:30" "Mon,Wed" "Core Mandarin speaking and listening for beginners." "B-102" "35")

echo "Enrolling students..."
enroll_student "${CS402_CLASS_ID}" "${STUDENT_1_EMAIL}"
enroll_student "${CS402_CLASS_ID}" "${STUDENT_2_EMAIL}"
enroll_student "${CS402_CLASS_ID}" "${STUDENT_3_EMAIL}"
enroll_student "${MANDARIN_CLASS_ID}" "${STUDENT_1_EMAIL}"

echo "Adding modules/resources/announcements..."
ensure_module "${CS402_CLASS_ID}" "Module 1: AI Fundamentals"
ensure_module "${CS402_CLASS_ID}" "Module 2: Neural Networks"
ensure_module "${CS402_CLASS_ID}" "Module 3: Responsible AI"
ensure_resource "${CS402_CLASS_ID}" "Course Syllabus" "https://example.com/cs402-syllabus"
ensure_resource "${CS402_CLASS_ID}" "Neural Network Primer" "https://example.com/neural-network-primer"
ensure_announcement "${TEACHER_A_ID}" "${CS402_CLASS_ID}" "Welcome to CS 402" "Please review the syllabus and complete the first reflection assignment."

ensure_module "${MANDARIN_CLASS_ID}" "Module 1: Pinyin & Tones"
ensure_module "${MANDARIN_CLASS_ID}" "Module 2: Self-Introduction"
ensure_resource "${MANDARIN_CLASS_ID}" "Pinyin Chart" "https://example.com/pinyin-chart"
ensure_resource "${MANDARIN_CLASS_ID}" "Beginner Vocabulary List" "https://example.com/mandarin-vocab"
ensure_announcement "${TEACHER_B_ID}" "${MANDARIN_CLASS_ID}" "First Week Checklist" "Practice tones daily and upload your pronunciation recording by Sunday."

echo "Ensuring assignments..."
CS_A1_ID=$(ensure_assignment "${CS402_CLASS_ID}" "AI Ethics Reflection" "Write a short reflection on fairness and bias in AI systems." "2026-04-10T23:59:00" "100")
CS_A2_ID=$(ensure_assignment "${CS402_CLASS_ID}" "Neural Networks Quiz 1" "Complete the quiz on perceptrons and backpropagation." "2026-04-17T23:59:00" "100")
CS_A3_ID=$(ensure_assignment "${CS402_CLASS_ID}" "Final Project Proposal" "Submit a one-page proposal for your AI capstone project." "2026-04-24T23:59:00" "100")
CS_A4_ID=$(ensure_assignment "${CS402_CLASS_ID}" "Live Demo: AI Discussion Prompt" "Submit a short response on an AI ethics scenario for the in-class demo." "2026-04-28T23:59:00" "100")

MA_A1_ID=$(ensure_assignment "${MANDARIN_CLASS_ID}" "Pinyin Practice Recording" "Record and submit a 2-minute pronunciation practice audio." "2026-04-12T23:59:00" "100")
MA_A2_ID=$(ensure_assignment "${MANDARIN_CLASS_ID}" "Self Introduction Video" "Submit a short Mandarin self-introduction video with subtitles." "2026-04-19T23:59:00" "100")

echo "Submitting and grading demo work..."
submit_and_grade "${CS402_CLASS_ID}" "${CS_A1_ID}" "${STUDENT_1_ID}" "95" "Excellent insight and clear ethical argument."
submit_and_grade "${CS402_CLASS_ID}" "${CS_A1_ID}" "${STUDENT_2_ID}" "78" "Solid start; add stronger real-world examples."

submit_and_grade "${CS402_CLASS_ID}" "${CS_A2_ID}" "${STUDENT_1_ID}" "92" "Great command of backpropagation basics."
submit_and_grade "${CS402_CLASS_ID}" "${CS_A2_ID}" "${STUDENT_3_ID}" "64" "Needs more practice with gradient calculations."

submit_and_grade "${CS402_CLASS_ID}" "${CS_A3_ID}" "${STUDENT_1_ID}" "97" "Strong proposal with clear project scope."
submit_and_grade "${CS402_CLASS_ID}" "${CS_A3_ID}" "${STUDENT_2_ID}" "73" "Proposal is on track; tighten the objective statement."

submit_and_grade "${MANDARIN_CLASS_ID}" "${MA_A1_ID}" "${STUDENT_1_ID}" "96" "Clear tones and strong pronunciation."

# Keep one assignment pending for Student 1 for live demo submission flow.
# Student 1 does not submit CS_A4 on purpose.

seed_frontend_analytics "${TEACHER_A_ID}" "${TEACHER_B_ID}" "${STUDENT_1_ID}" "${STUDENT_2_ID}" "${STUDENT_3_ID}"

echo "Seed complete."
echo "Teacher A login: ${TEACHER_A_EMAIL} / ${TEACHER_PASSWORD}"
echo "Teacher B login: ${TEACHER_B_EMAIL} / ${TEACHER_PASSWORD}"
echo "Student 1 login: ${STUDENT_1_EMAIL} / ${STUDENT_PASSWORD}"
echo "Student 2 login: ${STUDENT_2_EMAIL} / ${STUDENT_PASSWORD}"
echo "Student 3 login: ${STUDENT_3_EMAIL} / ${STUDENT_PASSWORD}"
echo "CS 402 class id: ${CS402_CLASS_ID}"
echo "Beginner Mandarin class id: ${MANDARIN_CLASS_ID}"
echo "Live-demo pending assignment (Student 1): Live Demo: AI Discussion Prompt"
echo "Mongo URI used for frontend analytics seed: ${MONGODB_URI}"

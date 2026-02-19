# Run this script to seed demo data into the application. 
# It creates a teacher, several students, a class, and some assignments for testing purposes.
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
BACKEND_BASIC_AUTH="${BACKEND_BASIC_AUTH:-}"

check_backend() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/login" || true)

  if [[ "${code}" == "000" ]]; then
    echo "Backend is not reachable at ${BASE_URL}."
    echo "If running from devcontainer, use one of:"
    echo "  BASE_URL=http://backend:8080"
    echo "  BASE_URL=http://host.docker.internal:8008"
    exit 1
  fi
}

post_json() {
  local path="$1"
  local body="$2"

  if [[ -n "${BACKEND_BASIC_AUTH}" ]]; then
    curl -sS -X POST "${BASE_URL}${path}" \
      -u "${BACKEND_BASIC_AUTH}" \
      -H "Content-Type: application/json" \
      -d "${body}"
    return
  fi

  curl -sS -X POST "${BASE_URL}${path}" \
    -H "Content-Type: application/json" \
    -d "${body}"
}

json_field() {
  local field="$1"
  python3 -c "import json,sys; raw=sys.stdin.read().strip(); print((json.loads(raw).get('${field}','') if raw else ''))"
}

json_nested_field() {
  local field_a="$1"
  local field_b="$2"
  python3 -c "import json,sys; raw=sys.stdin.read().strip(); data=(json.loads(raw) if raw else {}); print(((data.get('${field_a}',{}) or {}).get('${field_b}','') if isinstance(data, dict) else ''))"
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

    if [[ "${status_code}" == "401" ]]; then
      if [[ -n "${BACKEND_BASIC_AUTH}" ]]; then
        echo "Backend rejected Basic Auth credentials (HTTP 401)." >&2
        echo "Provided BACKEND_BASIC_AUTH is not valid for this backend." >&2
      else
        echo "Backend rejected unauthenticated API calls (HTTP 401)." >&2
        echo "Your backend has HTTP Basic auth enabled." >&2
        echo "Set BACKEND_BASIC_AUTH=user:password when running the script." >&2
      fi
      return 1
    fi
  fi

  echo "${login_response}" | json_field "id"
}

echo "Seeding demo users..."
check_backend
ensure_user "Linh" "Teacher" "0900000001" "teacher.demo@rewood.local" "password123" "TEACHER"
ensure_user "An" "Student" "0900000002" "student1.demo@rewood.local" "password123" "STUDENT"
ensure_user "Binh" "Student" "0900000003" "student2.demo@rewood.local" "password123" "STUDENT"
ensure_user "Chi" "Student" "0900000004" "student3.demo@rewood.local" "password123" "STUDENT"

TEACHER_ID=$(login_user_id "teacher.demo@rewood.local" "password123")
if [[ -z "${TEACHER_ID}" ]]; then
  echo "Failed to login teacher user at ${BASE_URL}/api/login"
  if [[ -z "${BACKEND_BASIC_AUTH}" ]]; then
    echo "Tip: try BACKEND_BASIC_AUTH=user:<your-password>" >&2
  fi
  exit 1
fi

echo "Creating class for teacher ${TEACHER_ID}..."
CLASS_RESPONSE=$(post_json "/api/classes/create" "{
  \"name\": \"Beginner Mandarin A1\",
  \"level\": \"BEGINNER\",
  \"time\": \"18:30\",
  \"days\": \"Mon,Wed\",
  \"description\": \"Core Mandarin for beginner students\",
  \"teacherId\": \"${TEACHER_ID}\"
}")

CLASS_ID=$(echo "${CLASS_RESPONSE}" | json_field "id")
if [[ -z "${CLASS_ID}" ]]; then
  echo "Failed to create class. Response: ${CLASS_RESPONSE}"
  exit 1
fi

echo "Enrolling students into class ${CLASS_ID}..."
for student_email in \
  "student1.demo@rewood.local" \
  "student2.demo@rewood.local" \
  "student3.demo@rewood.local"
do
  post_json "/api/classes/add-student" "{
    \"classId\": \"${CLASS_ID}\",
    \"studentEmail\": \"${student_email}\"
  }" >/dev/null || true
done

echo "Creating assignments..."
post_json "/api/classes/${CLASS_ID}/create-assignment" "{
  \"title\": \"Pronunciation Practice 01\",
  \"description\": \"Submit a 2-minute recording introducing yourself in Mandarin.\",
  \"deadline\": \"2026-03-01T23:59:00\",
  \"maxScore\": 100
}" >/dev/null

post_json "/api/classes/${CLASS_ID}/create-assignment" "{
  \"title\": \"Vocabulary Quiz Unit 1\",
  \"description\": \"Complete unit 1 quiz with at least 80 percent.\",
  \"deadline\": \"2026-03-05T23:59:00\",
  \"maxScore\": 100
}" >/dev/null

echo "Seed complete."
echo "Teacher login: teacher.demo@rewood.local / password123"
echo "Student login: student1.demo@rewood.local / password123"
echo "Class created with id: ${CLASS_ID}"

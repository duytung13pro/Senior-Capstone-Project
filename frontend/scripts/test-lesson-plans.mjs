#!/usr/bin/env node

const BASE_URL = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "")
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || ""
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || ""

function fail(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function info(message) {
  console.log(`ℹ️  ${message}`)
}

function pass(message) {
  console.log(`✅ ${message}`)
}

async function request(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  })

  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  return { res, body }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function normalizeStatus(status, template) {
  if (template || status === "Template") return "Template"
  if (status === "Upcoming") return "Ready / Scheduled"
  if (status === "Completed") return "Completed / Taught"
  return status
}

function isUpcoming(plan) {
  if (normalizeStatus(plan.status, plan.template) === "Template") return false
  const date = new Date(plan.date)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return date.getTime() >= todayStart.getTime()
}

async function main() {
  if (!TEACHER_EMAIL || !TEACHER_PASSWORD) {
    fail("Set TEACHER_EMAIL and TEACHER_PASSWORD env vars before running this script.")
  }

  const createdIds = []
  const now = Date.now()

  try {
    info(`Using backend: ${BASE_URL}`)

    const login = await request("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: TEACHER_EMAIL,
        password: TEACHER_PASSWORD,
      }),
    })

    assert(login.res.ok, `Login failed with ${login.res.status}`)
    assert(login.body?.id, "Login response missing teacher id")
    const teacherId = login.body.id
    pass(`Logged in as ${TEACHER_EMAIL}`)

    const classesRes = await request(`/api/classes/my?teacherId=${encodeURIComponent(teacherId)}`)
    assert(classesRes.res.ok, `Fetching classes failed with ${classesRes.res.status}`)
    const classes = Array.isArray(classesRes.body) ? classesRes.body : []
    assert(classes.length > 0, "No classes found for teacher. Seed or create at least one class first.")

    const classId = classes[0].id
    assert(classId, "First class is missing id")
    pass(`Using class: ${classId}`)

    const statusesToCreate = [
      { status: "Draft", template: false, dayOffset: 1 },
      { status: "Ready / Scheduled", template: false, dayOffset: 2 },
      { status: "Published", template: false, dayOffset: 3 },
      { status: "Completed / Taught", template: false, dayOffset: -1 },
      { status: "Template", template: true, dayOffset: 0 },
    ]

    for (const [index, item] of statusesToCreate.entries()) {
      const date = new Date(now + item.dayOffset * 24 * 60 * 60 * 1000)
      const createRes = await request("/api/lesson-plans", {
        method: "POST",
        body: JSON.stringify({
          teacherId,
          classId: item.template ? "" : classId,
          title: `E2E Lesson Plan ${index + 1} - ${item.status}`,
          date: date.toISOString(),
          status: item.status,
          objectives: "Students will be able to explain the concept.",
          activities: "Hook -> I Do -> We Do -> You Do -> Closure",
          materials: "Slides, worksheet, rubric",
          assessment: "Exit ticket",
          template: item.template,
        }),
      })

      assert(createRes.res.ok, `Create ${item.status} failed with ${createRes.res.status}`)
      assert(createRes.body?.id, `Create ${item.status} returned no id`)
      createdIds.push(createRes.body.id)
    }
    pass("Created lesson plans across all lifecycle statuses")

    const listRes = await request(`/api/lesson-plans?teacherId=${encodeURIComponent(teacherId)}`)
    assert(listRes.res.ok, `List lesson plans failed with ${listRes.res.status}`)
    const lessonPlans = Array.isArray(listRes.body) ? listRes.body : []
    assert(lessonPlans.length >= statusesToCreate.length, "Unexpected lesson plan count after create")

    const createdPlans = lessonPlans.filter((p) => createdIds.includes(p.id))
    assert(createdPlans.length === statusesToCreate.length, "Not all created plans were returned by list")

    const lifecycleSet = new Set(createdPlans.map((p) => normalizeStatus(p.status, p.template)))
    for (const expected of [
      "Draft",
      "Ready / Scheduled",
      "Published",
      "Completed / Taught",
      "Template",
    ]) {
      assert(lifecycleSet.has(expected), `Missing status in listed plans: ${expected}`)
    }
    pass("Lifecycle statuses verified in listing")

    const upcomingCount = createdPlans.filter((plan) => isUpcoming(plan)).length
    assert(upcomingCount >= 2, "Upcoming (time-based) calculation check failed")
    pass("Upcoming time-based filtering logic verified")

    const toDuplicate = createdPlans.find((p) => normalizeStatus(p.status, p.template) === "Draft")
    assert(toDuplicate?.id, "No draft plan available for duplication")

    const duplicateRes = await request(
      `/api/lesson-plans/${toDuplicate.id}/duplicate?teacherId=${encodeURIComponent(teacherId)}`,
      { method: "POST" },
    )
    assert(duplicateRes.res.ok, `Duplicate failed with ${duplicateRes.res.status}`)
    assert(duplicateRes.body?.id, "Duplicate response missing id")
    createdIds.push(duplicateRes.body.id)
    pass("Duplicate lesson plan flow verified")

    pass("Lesson plans functionality test script completed successfully")
  } catch (error) {
    console.error(error)
    fail(error instanceof Error ? error.message : "Unknown test failure")
  } finally {
    if (createdIds.length > 0) {
      info(`Cleaning up ${createdIds.length} created lesson plans...`)

      const login = await request("/api/login", {
        method: "POST",
        body: JSON.stringify({ email: TEACHER_EMAIL, password: TEACHER_PASSWORD }),
      })

      if (login.res.ok && login.body?.id) {
        const teacherId = login.body.id
        for (const id of createdIds) {
          try {
            await request(`/api/lesson-plans/${id}?teacherId=${encodeURIComponent(teacherId)}`, {
              method: "DELETE",
            })
          } catch {
            // ignore cleanup failures
          }
        }
      }
    }
  }
}

main()

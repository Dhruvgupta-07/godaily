// ================= BACKEND CONFIG =================
const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://REPLACE_WITH_BACKEND_URL"

// REAL auth token
const AUTH_TOKEN = localStorage.getItem("godaily_token")

/**
 * GoDaily - Productivity & Habit Tracking App
 * Main JavaScript file with enhanced functionality
 */

// ============================================
// DATA STORAGE
// ============================================

// 🔴 BACKEND IS SOURCE OF TRUTH
let tasks = []

let currentFilter = "all"

// ============================================
// UI HELPERS
// ============================================

function updateSyncTime() {
  const el = document.getElementById("last-sync-time")
  if (el) {
    el.textContent = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function createTaskElement(task) {
  const div = document.createElement("div")
  div.className = `task-item ${task.completed ? "completed" : ""}`

  const title = document.createElement("span")
  title.className = "task-title"
  title.textContent = task.title

  const btn = document.createElement("button")
  btn.textContent = task.completed ? "Undo" : "Done"

  btn.addEventListener("click", async () => {
    btn.disabled = true
    btn.textContent = "..."

    const success = await toggleTaskInBackend(task.id)

    if (!success) {
      btn.disabled = false
      btn.textContent = task.completed ? "Undo" : "Done"
    }
  })

  div.appendChild(title)
  div.appendChild(btn)

  return div
}

function renderAllTasks() {
  const container = document.getElementById("all-tasks")
  if (!container) return

  container.innerHTML = ""

  if (tasks.length === 0) {
    container.innerHTML = `<div class="no-tasks">No tasks yet.</div>`
    return
  }

  tasks.forEach((task) => {
    container.appendChild(createTaskElement(task))
  })
}

// ============================================
// BACKEND TASK API
// ============================================

async function fetchTasksFromBackend() {
  const res = await fetch(`${API_BASE}/tasks`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  })

  if (res.status === 401 || res.status === 403) {
    logout()
    return
  }

  if (!res.ok) {
    alert("Failed to fetch tasks")
    return
  }

  const data = await res.json()

  tasks = data.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.is_completed
  }))

  renderAllTasks()
  renderDashboard()
}

async function addTaskToBackend(title) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({ title }),
  })

  if (res.status === 401 || res.status === 403) {
    logout()
    return
  }

  if (!res.ok) {
    alert("Failed to add task")
    return
  }

  await fetchTasksFromBackend()
}

async function toggleTaskInBackend(taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  })

  if (res.status === 401 || res.status === 403) {
    logout()
    return false
  }

  if (!res.ok) {
    alert("Failed to update task")
    return false
  }

  await fetchTasksFromBackend()
  return true
}

// ============================================
// PAGE INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  if (!AUTH_TOKEN) {
    window.location.href = "/login.html"
    return
  }

  updateSyncTime()
  fetchTasksFromBackend()

  const form = document.getElementById("add-task-form")
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      const input = document.getElementById("task-input")
      if (input.value.trim()) {
        addTaskToBackend(input.value.trim())
        input.value = ""
      }
    })
  }
})

/* =================================================
   DASHBOARD
================================================= */

function renderDashboard() {
  if (tasks.length === 0) return

  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const pending = total - completed
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const totalEl = document.getElementById("total-tasks")
  const completedEl = document.getElementById("completed-tasks")
  const pendingEl = document.getElementById("pending-tasks")
  const runningEl = document.getElementById("running-tasks")

  if (totalEl) totalEl.textContent = total
  if (completedEl) completedEl.textContent = completed
  if (pendingEl) pendingEl.textContent = pending
  if (runningEl) runningEl.textContent = pending

  const progressPercent = document.getElementById("progress-percent")
  const progressGauge = document.getElementById("progress-gauge")

  if (progressPercent && progressGauge) {
    progressPercent.textContent = `${percentage}%`
    const offset = 220 - (percentage / 100) * 220
    progressGauge.style.strokeDashoffset = offset
  }
}

// ============================================
// LOGOUT
// ============================================

function logout() {
  localStorage.removeItem("godaily_token")
  localStorage.removeItem("godaily_profile_name")
  localStorage.removeItem("godaily_profile_email")
  window.location.href = "/login.html"
}

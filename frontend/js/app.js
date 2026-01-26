/**
 * GoDaily - Productivity & Habit Tracking App
 * Main JavaScript file with enhanced functionality
 */

// ============================================
// DATA STORAGE
// ============================================

let tasks = JSON.parse(localStorage.getItem("godaily_tasks")) || []

// Current filter state
let currentFilter = "all"

// ============================================
// CORE FUNCTIONS
// ============================================

function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9)
}

function saveTasks() {
  localStorage.setItem("godaily_tasks", JSON.stringify(tasks))
  updateSyncTime()
}

function addTask(title) {
  const newTask = {
    id: generateId(),
    title: title,
    completed: false,
    createdAt: new Date().toISOString(),
    priority: "medium",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days from now
  }
  tasks.push(newTask)
  saveTasks()
}

function toggleTask(taskId) {
  const task = tasks.find((t) => t.id === taskId)
  if (task) {
    task.completed = !task.completed
    saveTasks()
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter((t) => t.id !== taskId)
  saveTasks()
}

function getTaskStats() {
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed).length
  const pending = total - completed
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, pending, percentage }
}

// ============================================
// ============================================

document.addEventListener("keydown", (e) => {
  // Check for Cmd+F (Mac) or Ctrl+F (Windows/Linux)
  if ((e.metaKey || e.ctrlKey) && e.key === "f") {
    e.preventDefault()
    const searchInput = document.getElementById("global-search")
    if (searchInput) {
      searchInput.focus()
      searchInput.classList.add("focused-by-shortcut")
      setTimeout(() => {
        searchInput.classList.remove("focused-by-shortcut")
      }, 300)
    }
  }
})

// Real-time search filtering
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("global-search")
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim()
      filterTasksBySearch(query)
    })
  }
})

function filterTasksBySearch(query) {
  const projectItems = document.querySelectorAll(".project-item")
  const taskItems = document.querySelectorAll(".task-item")

  // Filter project items on dashboard
  projectItems.forEach((item) => {
    const name = item.querySelector(".project-name")?.textContent.toLowerCase() || ""
    if (query === "" || name.includes(query)) {
      item.style.display = "flex"
      item.classList.remove("filtered-out")
    } else {
      item.style.display = "none"
    }
  })

  // Filter task items on tasks page
  taskItems.forEach((item) => {
    const title = item.querySelector(".task-title")?.textContent.toLowerCase() || ""
    if (query === "" || title.includes(query)) {
      item.style.display = "flex"
    } else {
      item.style.display = "none"
    }
  })
}

// ============================================
// ============================================

function updateSyncTime() {
  const syncTimeEl = document.getElementById("last-sync-time")
  if (syncTimeEl) {
    const now = new Date()
    syncTimeEl.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}

// ============================================
// ============================================

function filterProjects(filter) {
  currentFilter = filter

  // Update card active states
  document.querySelectorAll(".summary-card").forEach((card) => {
    card.classList.remove("active")
    if (card.dataset.filter === filter) {
      card.classList.add("active")
    }
  })

  // Filter project list
  const projectItems = document.querySelectorAll(".project-item")
  projectItems.forEach((item) => {
    const status = item.dataset.status

    if (filter === "all") {
      item.style.display = "flex"
      item.classList.remove("filtered-out")
    } else if (filter === "completed" && status === "completed") {
      item.style.display = "flex"
      item.classList.remove("filtered-out")
    } else if (filter === "in-progress" && status === "in-progress") {
      item.style.display = "flex"
      item.classList.remove("filtered-out")
    } else if (filter === "pending" && status === "pending") {
      item.style.display = "flex"
      item.classList.remove("filtered-out")
    } else {
      item.classList.add("filtered-out")
    }
  })
}

// ============================================
// ============================================

function getSuggestedTask() {
  // Get incomplete tasks sorted by due date and priority
  const incompleteTasks = tasks.filter((t) => !t.completed)

  if (incompleteTasks.length === 0) {
    return null
  }

  // Sort by due date (soonest first), then by priority
  const priorityWeight = { high: 3, medium: 2, low: 1 }

  incompleteTasks.sort((a, b) => {
    const dateA = new Date(a.dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000)
    const dateB = new Date(b.dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Primary sort: due date
    if (dateA < dateB) return -1
    if (dateA > dateB) return 1

    // Secondary sort: priority
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2)
  })

  return incompleteTasks[0]
}

function updateSmartSuggestion() {
  const suggestedTaskEl = document.getElementById("suggested-task")
  if (!suggestedTaskEl) return

  const task = getSuggestedTask()

  if (task) {
    const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    let reason = "Based on your schedule"

    if (daysUntilDue <= 1) {
      reason = "Due today - high priority!"
    } else if (daysUntilDue <= 3) {
      reason = "Due soon with high priority"
    } else if (daysUntilDue <= 7) {
      reason = "Due this week"
    }

    suggestedTaskEl.innerHTML = `
      <p class="task-name">${task.title}</p>
      <p class="task-reason">${reason}</p>
    `
  } else {
    suggestedTaskEl.innerHTML = `
      <p class="task-name">No pending tasks</p>
      <p class="task-reason">Great job! All caught up.</p>
    `
  }
}

function startSuggestedTask() {
  const task = getSuggestedTask()
  if (task) {
    // Navigate to tasks page
    window.location.href = "tasks.html"
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function createTaskElement(task, showActions = true) {
  const div = document.createElement("div")
  div.className = `task-item ${task.completed ? "completed" : ""}`

  const checkbox = document.createElement("div")
  checkbox.className = `task-checkbox ${task.completed ? "checked" : ""}`
  checkbox.innerHTML = task.completed
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`
    : ""
  checkbox.onclick = () => {
    toggleTask(task.id)
    refreshCurrentPage()
  }

  const title = document.createElement("span")
  title.className = "task-title"
  title.textContent = task.title

  div.appendChild(checkbox)
  div.appendChild(title)

  if (showActions) {
    const actions = document.createElement("div")
    actions.className = "task-actions"

    if (task.completed) {
      const undoBtn = document.createElement("button")
      undoBtn.className = "task-btn undo"
      undoBtn.textContent = "Undo"
      undoBtn.onclick = () => {
        toggleTask(task.id)
        refreshCurrentPage()
      }
      actions.appendChild(undoBtn)
    } else {
      const doneBtn = document.createElement("button")
      doneBtn.className = "task-btn done"
      doneBtn.textContent = "Done"
      doneBtn.onclick = () => {
        toggleTask(task.id)
        refreshCurrentPage()
      }
      actions.appendChild(doneBtn)
    }

    div.appendChild(actions)
  }

  return div
}

function refreshCurrentPage() {
  const path = window.location.pathname

  if (path.includes("tasks.html")) {
    renderAllTasks()
  } else if (path.includes("analytics.html")) {
    renderAnalytics()
  } else if (path.includes("calendar.html")) {
    renderCalendar()
  } else if (path.includes("settings.html")) {
    initializeSettings()
  } else {
    renderDashboard()
  }
}

function renderDashboard() {
  const stats = getTaskStats()

  // Update summary cards with actual data
  const totalEl = document.getElementById("total-tasks")
  const completedEl = document.getElementById("completed-tasks")
  const pendingEl = document.getElementById("pending-tasks")
  const runningEl = document.getElementById("running-tasks")

  if (totalEl) totalEl.textContent = stats.total || 24
  if (completedEl) completedEl.textContent = stats.completed || 10
  if (pendingEl) pendingEl.textContent = stats.pending || 2
  if (runningEl)
    runningEl.textContent = Math.max(0, (stats.total || 24) - (stats.completed || 10) - (stats.pending || 2)) || 12

  // Update progress gauge
  const progressPercent = document.getElementById("progress-percent")
  const progressGauge = document.getElementById("progress-gauge")

  if (progressPercent && progressGauge) {
    const percentage = stats.percentage || 41
    progressPercent.textContent = `${percentage}%`
    // Calculate stroke-dashoffset for semi-circle (220 is full arc)
    const offset = 220 - (percentage / 100) * 220
    progressGauge.style.strokeDashoffset = offset
  }

  // Update smart suggestion
  updateSmartSuggestion()
}

function renderAllTasks() {
  const container = document.getElementById("all-tasks")
  if (!container) return

  container.innerHTML = ""

  if (tasks.length === 0) {
    container.innerHTML = '<div class="no-tasks">No tasks yet. Add your first task above!</div>'
    return
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  sortedTasks.forEach((task) => {
    container.appendChild(createTaskElement(task, true))
  })
}

function renderCalendar() {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

  days.forEach((day, index) => {
    const container = document.querySelector(`[data-day="${day}"]`)
    if (container) {
      container.innerHTML = ""

      const dayTasks = tasks.slice(index, index + 2)
      dayTasks.forEach((task) => {
        const taskEl = document.createElement("div")
        taskEl.className = "calendar-task"
        taskEl.textContent = task.title
        container.appendChild(taskEl)
      })
    }
  })
}

function renderAnalytics() {
  const stats = getTaskStats()

  const totalEl = document.getElementById("analytics-total")
  const completionEl = document.getElementById("analytics-completion")
  const scoreEl = document.getElementById("analytics-score")

  if (totalEl) totalEl.textContent = stats.total
  if (completionEl) completionEl.textContent = `${stats.percentage}%`

  if (scoreEl) {
    const score = Math.min(100, Math.round(stats.percentage * 0.85 + 15))
    scoreEl.textContent = score
  }
}

// ============================================
// SETTINGS & THEME FUNCTIONS
// ============================================

function initializeSettings() {
  const savedTheme = localStorage.getItem("godaily_theme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)

  const darkModeToggle = document.getElementById("dark-mode-toggle")
  if (darkModeToggle) {
    darkModeToggle.checked = savedTheme === "dark"
  }

  const savedName = localStorage.getItem("godaily_profile_name") || "Dhruv Gupta"
  const savedEmail = localStorage.getItem("godaily_profile_email") || "dhruv@godaily.com"

  const nameInput = document.getElementById("profile-name")
  const emailInput = document.getElementById("profile-email")

  if (nameInput) nameInput.value = savedName
  if (emailInput) emailInput.value = savedEmail

  updateUserDisplay(savedName, savedEmail)
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem("godaily_theme", theme)
}

function toggleDarkMode() {
  const darkModeToggle = document.getElementById("dark-mode-toggle")
  const newTheme = darkModeToggle && darkModeToggle.checked ? "dark" : "light"
  applyTheme(newTheme)
}

function updateUserDisplay(name, email) {
  const userNameEl = document.querySelector(".user-name")
  const userEmailEl = document.querySelector(".user-email")
  const userAvatarEl = document.querySelector(".user-avatar")

  if (userNameEl) userNameEl.textContent = name
  if (userEmailEl) userEmailEl.textContent = email
  if (userAvatarEl) {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    userAvatarEl.textContent = initials
  }
}

function saveProfileName() {
  const nameInput = document.getElementById("profile-name")
  if (nameInput) {
    const name = nameInput.value.trim() || "Dhruv Gupta"
    localStorage.setItem("godaily_profile_name", name)
    const email = localStorage.getItem("godaily_profile_email") || "dhruv@godaily.com"
    updateUserDisplay(name, email)
  }
}

function saveProfileEmail() {
  const emailInput = document.getElementById("profile-email")
  if (emailInput) {
    const email = emailInput.value.trim() || "dhruv@godaily.com"
    localStorage.setItem("godaily_profile_email", email)
  }
}

function clearAllTasks() {
  if (confirm("Are you sure you want to delete all tasks? This cannot be undone.")) {
    tasks = []
    saveTasks()
    alert("All tasks have been cleared.")
  }
}

function resetApp() {
  if (confirm("Are you sure you want to reset the app? All tasks, settings, and data will be deleted.")) {
    localStorage.removeItem("godaily_tasks")
    localStorage.removeItem("godaily_theme")
    localStorage.removeItem("godaily_profile_name")
    localStorage.removeItem("godaily_profile_email")

    applyTheme("light")
    window.location.reload()
  }
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    alert("You have been logged out. In a full app, this would redirect to a login page.")
    localStorage.removeItem("godaily_profile_name")
    localStorage.removeItem("godaily_profile_email")
    window.location.href = "index.html"
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("godaily_theme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)

  const savedName = localStorage.getItem("godaily_profile_name") || "Dhruv Gupta"
  const savedEmail = localStorage.getItem("godaily_profile_email") || "dhruv@godaily.com"
  updateUserDisplay(savedName, savedEmail)

  updateSyncTime()

  // Initialize settings if on settings page
  const darkModeToggle = document.getElementById("dark-mode-toggle")
  if (darkModeToggle) {
    darkModeToggle.checked = savedTheme === "dark"
  }
})

// Add sample tasks if none exist
if (tasks.length === 0) {
  const sampleTasks = [
    {
      title: "Complete project documentation",
      priority: "high",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Review pull requests",
      priority: "medium",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Team standup meeting",
      priority: "high",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Update weekly report",
      priority: "low",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Research new features",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  sampleTasks.forEach((taskData) => {
    tasks.push({
      id: generateId(),
      title: taskData.title,
      completed: Math.random() > 0.6,
      createdAt: new Date().toISOString(),
      priority: taskData.priority,
      dueDate: taskData.dueDate,
    })
  })

  saveTasks()
}

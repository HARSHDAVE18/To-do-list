// ============================================
// To-Do List — App Logic
// ============================================

const STORAGE_KEY = "todo-list-tasks-v1";

const addForm = document.getElementById("addForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const itemsLeftEl = document.getElementById("itemsLeft");
const clearCompletedBtn = document.getElementById("clearCompleted");
const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));

let tasks = loadTasks();
let currentFilter = "all";

// ---------- Storage ----------
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ---------- Helpers ----------
function makeId() {
  return (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFilteredTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

// ---------- Rendering ----------
function render() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = "";

  filtered.forEach((task) => {
    taskList.appendChild(buildTaskEl(task));
  });

  const noneAtAll = tasks.length === 0;
  const noneInFilter = filtered.length === 0;
  emptyState.classList.toggle("show", noneAtAll || noneInFilter);
  emptyState.textContent = noneAtAll
    ? "Nothing here yet — add your first task above."
    : "No tasks in this view.";

  const remaining = tasks.filter((t) => !t.completed).length;
  itemsLeftEl.textContent = `${remaining} item${remaining === 1 ? "" : "s"} left`;

  clearCompletedBtn.style.visibility = tasks.some((t) => t.completed) ? "visible" : "hidden";
}

function buildTaskEl(task) {
  const li = document.createElement("li");
  li.className = "task entering" + (task.completed ? " completed" : "");
  li.dataset.id = task.id;

  li.innerHTML = `
    <button class="check" role="checkbox" aria-checked="${task.completed}" aria-label="Mark task complete">
      <svg class="check-icon" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>
    </button>
    <span class="task-text" tabindex="0">${escapeHtml(task.text)}</span>
    <button class="delete-btn" aria-label="Delete task">×</button>
  `;

  li.querySelector(".check").addEventListener("click", () => toggleTask(task.id));
  li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

  const textEl = li.querySelector(".task-text");
  textEl.addEventListener("dblclick", () => beginEdit(textEl, task.id));
  textEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && textEl.isContentEditable) {
      e.preventDefault();
      textEl.blur();
    }
    if (e.key === "Escape" && textEl.isContentEditable) {
      textEl.textContent = task.text;
      textEl.blur();
    }
  });

  return li;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Actions ----------
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  tasks.unshift({ id: makeId(), text: trimmed, completed: false });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.add("leaving");
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    }, 180);
  } else {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }
}

function beginEdit(textEl, id) {
  textEl.setAttribute("contenteditable", "true");
  textEl.focus();
  document.execCommand("selectAll", false, null);

  const finish = () => {
    textEl.removeAttribute("contenteditable");
    const newText = textEl.textContent.trim();
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.text = newText || task.text;
      saveTasks();
      render();
    }
    textEl.removeEventListener("blur", finish);
  };

  textEl.addEventListener("blur", finish);
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  render();
}

// ---------- Events ----------
addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

clearCompletedBtn.addEventListener("click", clearCompleted);

// ---------- Init ----------
render();

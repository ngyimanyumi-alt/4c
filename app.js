import { classDataApi, subscribeToChanges } from "./supabase-data.js";

const dutySlots = ["早會", "黑板", "地面"];
const dutySlotInput = document.getElementById("dutySlotInput");
dutySlots.forEach((slot) => {
  const option = document.createElement("option");
  option.value = slot;
  option.textContent = slot;
  dutySlotInput.append(option);
});

const state = {
  students: [],
  dutyOverrides: [],
  todos: [],
  links: [],
  isTeacher: false,
  loading: false
};

const els = {
  status: document.getElementById("status"),
  modeText: document.getElementById("modeText"),
  teacherPassword: document.getElementById("teacherPassword"),
  teacherModeBtn: document.getElementById("teacherModeBtn"),
  studentModeBtn: document.getElementById("studentModeBtn"),
  studentForm: document.getElementById("studentForm"),
  studentNoInput: document.getElementById("studentNoInput"),
  studentNameInput: document.getElementById("studentNameInput"),
  studentList: document.getElementById("studentList"),
  todayLabel: document.getElementById("todayLabel"),
  dutyTodayList: document.getElementById("dutyTodayList"),
  dutyOverrideForm: document.getElementById("dutyOverrideForm"),
  dutyDateInput: document.getElementById("dutyDateInput"),
  dutySlotInput,
  dutyOffsetInput: document.getElementById("dutyOffsetInput"),
  dutyOverrideList: document.getElementById("dutyOverrideList"),
  todoForm: document.getElementById("todoForm"),
  todoTextInput: document.getElementById("todoTextInput"),
  todoCategoryInput: document.getElementById("todoCategoryInput"),
  todoList: document.getElementById("todoList"),
  linkForm: document.getElementById("linkForm"),
  linkTitleInput: document.getElementById("linkTitleInput"),
  linkUrlInput: document.getElementById("linkUrlInput"),
  linkIconInput: document.getElementById("linkIconInput"),
  linkList: document.getElementById("linkList")
};

function setStatus(type, text) {
  els.status.className = type;
  els.status.textContent = text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "#";
  }
  return "#";
}

function updateModeUi() {
  els.modeText.textContent = state.isTeacher ? "老師模式" : "學生模式";
  const disabled = !state.isTeacher;

  [
    "studentNoInput",
    "studentNameInput",
    "addStudentBtn",
    "dutyDateInput",
    "dutySlotInput",
    "dutyOffsetInput",
    "todoTextInput",
    "todoCategoryInput",
    "linkTitleInput",
    "linkUrlInput",
    "linkIconInput"
  ].forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.disabled = disabled;
    }
  });

  [els.studentForm, els.dutyOverrideForm, els.todoForm, els.linkForm].forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = disabled;
    }
  });
}

function ensureTeacherOrWarn() {
  if (state.isTeacher) {
    return true;
  }
  setStatus("error", "目前是學生模式，不能修改資料。請先切換老師模式。");
  return false;
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDutyStudent(slot, dateStr) {
  if (!state.students.length) {
    return "（未有學生）";
  }
  const slotIndex = dutySlots.indexOf(slot);
  const referenceDate = new Date("2026-01-01T00:00:00");
  const currentDate = new Date(`${dateStr}T00:00:00`);
  const dayOffset = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));

  const override = state.dutyOverrides.find(
    (item) => item.duty_date === dateStr && item.duty_slot === slot
  );
  const customOffset = override ? Number(override.duty_offset) : 0;
  const studentIndex =
    ((dayOffset + slotIndex + customOffset) % state.students.length + state.students.length) %
    state.students.length;

  return state.students[studentIndex].name;
}

function renderStudents() {
  if (!state.students.length) {
    els.studentList.innerHTML = '<li class="muted">目前沒有學生資料。</li>';
    return;
  }

  els.studentList.innerHTML = "";
  state.students.forEach((student) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(student.student_number)}號 ${escapeHtml(student.name)}（缺席 ${escapeHtml(
      student.absent_days
    )} 天）</span>
      <span class="row">
        <button type="button" data-act="absent-minus" data-id="${student.id}" ${
          !state.isTeacher ? "disabled" : ""
        }>-1</button>
        <button type="button" data-act="absent-plus" data-id="${student.id}" ${
          !state.isTeacher ? "disabled" : ""
        }>+1</button>
        <button class="danger" type="button" data-act="student-delete" data-id="${student.id}" ${
          !state.isTeacher ? "disabled" : ""
        }>刪除</button>
      </span>
    `;
    els.studentList.append(li);
  });
}

function renderDuty() {
  const today = formatDate();
  els.todayLabel.textContent = `${today}（班別：${classDataApi.classId}）`;
  els.dutyTodayList.innerHTML = "";

  dutySlots.forEach((slot) => {
    const li = document.createElement("li");
    li.textContent = `${slot}：${getDutyStudent(slot, today)}`;
    els.dutyTodayList.append(li);
  });

  if (!state.dutyOverrides.length) {
    els.dutyOverrideList.innerHTML = '<li class="muted">目前沒有偏移設定。</li>';
    return;
  }

  els.dutyOverrideList.innerHTML = "";
  state.dutyOverrides.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(item.duty_date)}｜${escapeHtml(item.duty_slot)}｜偏移 ${escapeHtml(
      item.duty_offset
    )}</span>
      <button class="danger" type="button" data-act="duty-delete" data-id="${item.id}" ${
        !state.isTeacher ? "disabled" : ""
      }>刪除</button>
    `;
    els.dutyOverrideList.append(li);
  });
}

function renderTodos() {
  if (!state.todos.length) {
    els.todoList.innerHTML = '<li class="muted">目前沒有待辦事項。</li>';
    return;
  }

  els.todoList.innerHTML = "";
  state.todos.forEach((todo) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="${todo.completed ? "done" : ""}">${escapeHtml(todo.text)}（${escapeHtml(
      todo.category || "一般"
    )}）</span>
      <span class="row">
        <label>
          <input type="checkbox" data-act="todo-toggle" data-id="${todo.id}" ${todo.completed ? "checked" : ""} ${
      !state.isTeacher ? "disabled" : ""
    } /> 完成
        </label>
        <button class="danger" type="button" data-act="todo-delete" data-id="${todo.id}" ${
          !state.isTeacher ? "disabled" : ""
        }>刪除</button>
      </span>
    `;
    els.todoList.append(li);
  });
}

function renderLinks() {
  if (!state.links.length) {
    els.linkList.innerHTML = '<li class="muted">目前沒有自訂連結。</li>';
    return;
  }

  els.linkList.innerHTML = "";
  state.links.forEach((link) => {
    const url = safeUrl(link.url);
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(link.icon || "🔗")} <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(link.title)}</a></span>
      <button class="danger" type="button" data-act="link-delete" data-id="${link.id}" ${
        !state.isTeacher ? "disabled" : ""
      }>刪除</button>
    `;
    els.linkList.append(li);
  });
}

function renderAll() {
  updateModeUi();
  renderStudents();
  renderDuty();
  renderTodos();
  renderLinks();
}

async function refreshAll(showReady = false) {
  state.loading = true;
  setStatus("info", "同步資料中...");
  try {
    const [students, dutyOverrides, todos, links] = await Promise.all([
      classDataApi.listStudents(),
      classDataApi.listDutyOverrides(),
      classDataApi.listTodos(),
      classDataApi.listLinks()
    ]);

    state.students = students || [];
    state.dutyOverrides = dutyOverrides || [];
    state.todos = todos || [];
    state.links = links || [];
    renderAll();

    if (showReady) {
      setStatus("ok", "已同步最新資料。其他使用者的更新也會自動顯示。");
    }
  } catch (error) {
    setStatus("error", `載入失敗：${error.message}`);
  } finally {
    state.loading = false;
  }
}

els.teacherModeBtn.addEventListener("click", () => {
  const configuredPassword = (window.APP_CONFIG && window.APP_CONFIG.TEACHER_PASSWORD) || "";
  if (!configuredPassword) {
    setStatus("error", "尚未設定老師模式密碼（config.js）。");
    return;
  }

  if (els.teacherPassword.value === configuredPassword) {
    state.isTeacher = true;
    els.teacherPassword.value = "";
    renderAll();
    setStatus("ok", "已切換到老師模式。請留意：此密碼在前端並不安全。 ");
    return;
  }

  setStatus("error", "老師密碼錯誤。");
});

els.studentModeBtn.addEventListener("click", () => {
  state.isTeacher = false;
  renderAll();
  setStatus("info", "已切換到學生模式。");
});

els.studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const studentNo = Number(els.studentNoInput.value);
  const studentName = els.studentNameInput.value.trim();
  if (!studentNo || !studentName) return;

  try {
    await classDataApi.addStudent(studentNo, studentName);
    els.studentForm.reset();
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

els.studentList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button || !ensureTeacherOrWarn()) return;
  const studentId = Number(button.dataset.id);
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return;

  try {
    if (button.dataset.act === "student-delete") {
      await classDataApi.deleteStudent(studentId);
    } else if (button.dataset.act === "absent-plus") {
      await classDataApi.updateStudentAbsentDays(studentId, Number(student.absent_days) + 1);
    } else if (button.dataset.act === "absent-minus") {
      await classDataApi.updateStudentAbsentDays(studentId, Math.max(0, Number(student.absent_days) - 1));
    }
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

els.dutyOverrideForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const dutyDate = els.dutyDateInput.value;
  const dutySlot = els.dutySlotInput.value;
  const dutyOffset = Number(els.dutyOffsetInput.value);
  if (!dutyDate || !dutySlot || Number.isNaN(dutyOffset)) return;

  try {
    await classDataApi.upsertDutyOverride(dutyDate, dutySlot, dutyOffset);
    els.dutyOverrideForm.reset();
    els.dutyOffsetInput.value = "0";
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

els.dutyOverrideList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act='duty-delete']");
  if (!button || !ensureTeacherOrWarn()) return;

  try {
    await classDataApi.deleteDutyOverride(Number(button.dataset.id));
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

els.todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const text = els.todoTextInput.value.trim();
  const category = els.todoCategoryInput.value.trim();
  if (!text) return;

  try {
    await classDataApi.addTodo(text, category);
    els.todoForm.reset();
    els.todoCategoryInput.value = "一般";
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

els.todoList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("button[data-act='todo-delete']");
  if (deleteButton) {
    if (!ensureTeacherOrWarn()) return;
    try {
      await classDataApi.deleteTodo(Number(deleteButton.dataset.id));
      await refreshAll(true);
    } catch (error) {
      setStatus("error", error.message);
    }
  }
});

els.todoList.addEventListener("change", async (event) => {
  const checkbox = event.target.closest("input[data-act='todo-toggle']");
  if (!checkbox) return;
  if (!ensureTeacherOrWarn()) {
    checkbox.checked = !checkbox.checked;
    return;
  }

  try {
    await classDataApi.updateTodo(Number(checkbox.dataset.id), checkbox.checked);
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

els.linkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const title = els.linkTitleInput.value.trim();
  const url = els.linkUrlInput.value.trim();
  const icon = els.linkIconInput.value.trim();
  if (!title || !url) return;

  try {
    await classDataApi.addLink(title, url, icon);
    els.linkForm.reset();
    els.linkIconInput.value = "🔗";
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

els.linkList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act='link-delete']");
  if (!button || !ensureTeacherOrWarn()) return;

  try {
    await classDataApi.deleteLink(Number(button.dataset.id));
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message);
  }
});

window.addEventListener("offline", () => {
  setStatus("error", "目前離線，無法同步雲端資料。請檢查網路。 ");
});

window.addEventListener("online", () => {
  setStatus("info", "網路已恢復，正在重新同步資料...");
  refreshAll(true);
});

let refreshTimer = null;
subscribeToChanges(() => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    refreshAll(true);
  }, 300);
});

els.dutyDateInput.value = formatDate();
refreshAll(true);

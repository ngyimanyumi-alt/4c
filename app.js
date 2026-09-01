import { classDataApi, subscribeToChanges } from "./supabase-data.js";

const dutySlots = [
  { key: "早會", icon: "fa-sun", description: "早上問好、點名與班務提示" },
  { key: "黑板", icon: "fa-chalkboard", description: "檢查黑板、粉筆與板擦" },
  { key: "地面", icon: "fa-broom", description: "留意地面整潔與座位周邊" }
];

const themes = {
  pink: {
    primary: "236 72 153",
    secondary: "244 114 182",
    accent: "251 207 232",
    soft: "253 242 248",
    strong: "157 23 77"
  },
  sky: {
    primary: "14 165 233",
    secondary: "56 189 248",
    accent: "186 230 253",
    soft: "240 249 255",
    strong: "12 74 110"
  },
  violet: {
    primary: "139 92 246",
    secondary: "167 139 250",
    accent: "221 214 254",
    soft: "245 243 255",
    strong: "76 29 149"
  },
  emerald: {
    primary: "16 185 129",
    secondary: "52 211 153",
    accent: "167 243 208",
    soft: "236 253 245",
    strong: "6 95 70"
  }
};

const hongKongHolidays = {
  "2025-01-01": "元旦",
  "2025-01-29": "農曆年初一",
  "2025-01-30": "農曆年初二",
  "2025-01-31": "農曆年初三",
  "2025-04-04": "清明節",
  "2025-04-18": "耶穌受難節",
  "2025-04-19": "耶穌受難節翌日",
  "2025-04-21": "復活節星期一",
  "2025-05-01": "勞動節",
  "2025-05-05": "佛誕",
  "2025-05-31": "端午節",
  "2025-07-01": "香港特別行政區成立紀念日",
  "2025-10-01": "國慶日",
  "2025-10-07": "中秋節翌日",
  "2025-10-29": "重陽節",
  "2025-12-25": "聖誕節",
  "2025-12-26": "聖誕節後第一個工作天",
  "2026-01-01": "元旦",
  "2026-02-17": "農曆年初一",
  "2026-02-18": "農曆年初二",
  "2026-02-19": "農曆年初三",
  "2026-04-03": "耶穌受難節",
  "2026-04-04": "耶穌受難節翌日",
  "2026-04-06": "清明節翌日",
  "2026-04-07": "復活節星期一翌日",
  "2026-05-01": "勞動節",
  "2026-05-25": "佛誕翌日",
  "2026-06-19": "端午節",
  "2026-07-01": "香港特別行政區成立紀念日",
  "2026-09-26": "中秋節翌日",
  "2026-10-01": "國慶日",
  "2026-10-19": "重陽節翌日",
  "2026-12-25": "聖誕節",
  "2026-12-26": "聖誕節後第一個工作天",
  "2027-01-01": "元旦",
  "2027-02-08": "農曆年初三",
  "2027-02-09": "農曆年初四",
  "2027-03-26": "耶穌受難節",
  "2027-03-27": "耶穌受難節翌日",
  "2027-03-29": "復活節星期一",
  "2027-04-05": "清明節",
  "2027-05-03": "勞動節翌日",
  "2027-05-13": "佛誕",
  "2027-06-09": "端午節",
  "2027-07-01": "香港特別行政區成立紀念日",
  "2027-09-16": "中秋節翌日",
  "2027-10-01": "國慶日",
  "2027-10-08": "重陽節",
  "2027-12-27": "聖誕節後第一個工作天"
};

const state = {
  theme: "pink",
  selectedDate: formatDateValue(new Date()),
  studentList: [],
  manualOffsets: [],
  todos: [],
  customLinks: [],
  isTeacher: false,
  teacherAuthBusy: false,
  loading: false,
  provider: classDataApi.getProviderInfo()
};

const els = {
  connectionNotice: document.getElementById("connectionNotice"),
  status: document.getElementById("status"),
  modeText: document.getElementById("modeText"),
  teacherPassword: document.getElementById("teacherPassword"),
  teacherModeBtn: document.getElementById("teacherModeBtn"),
  studentModeBtn: document.getElementById("studentModeBtn"),
  teacherModeState: document.getElementById("teacherModeState"),
  themeSwitcher: document.getElementById("themeSwitcher"),
  dateDisplay: document.getElementById("dateDisplay"),
  dateTag: document.getElementById("dateTag"),
  classTag: document.getElementById("classTag"),
  dateHint: document.getElementById("dateHint"),
  prevDayBtn: document.getElementById("prevDayBtn"),
  todayBtn: document.getElementById("todayBtn"),
  nextDayBtn: document.getElementById("nextDayBtn"),
  dutyCardGrid: document.getElementById("dutyCardGrid"),
  dutyOverrideForm: document.getElementById("dutyOverrideForm"),
  dutyDateInput: document.getElementById("dutyDateInput"),
  dutySlotInput: document.getElementById("dutySlotInput"),
  dutyOffsetInput: document.getElementById("dutyOffsetInput"),
  dutyOverrideList: document.getElementById("dutyOverrideList"),
  studentStats: document.getElementById("studentStats"),
  studentForm: document.getElementById("studentForm"),
  studentNoInput: document.getElementById("studentNoInput"),
  studentNameInput: document.getElementById("studentNameInput"),
  addStudentBtn: document.getElementById("addStudentBtn"),
  studentList: document.getElementById("studentList"),
  bulkImportForm: document.getElementById("bulkImportForm"),
  bulkStudentInput: document.getElementById("bulkStudentInput"),
  bulkImportFeedback: document.getElementById("bulkImportFeedback"),
  todoForm: document.getElementById("todoForm"),
  todoTextInput: document.getElementById("todoTextInput"),
  todoCategoryInput: document.getElementById("todoCategoryInput"),
  todoList: document.getElementById("todoList"),
  linkForm: document.getElementById("linkForm"),
  linkTitleInput: document.getElementById("linkTitleInput"),
  linkUrlInput: document.getElementById("linkUrlInput"),
  linkIconInput: document.getElementById("linkIconInput"),
  linkList: document.getElementById("linkList"),
  leaveLetterForm: document.getElementById("leaveLetterForm"),
  leaveStudentInput: document.getElementById("leaveStudentInput"),
  leaveStartInput: document.getElementById("leaveStartInput"),
  leaveEndInput: document.getElementById("leaveEndInput"),
  leaveReasonInput: document.getElementById("leaveReasonInput"),
  leaveLetterOutput: document.getElementById("leaveLetterOutput"),
  leavePdfInput: document.getElementById("leavePdfInput"),
  useUploadedPdfBtn: document.getElementById("useUploadedPdfBtn"),
  forceGenerateLetter: document.getElementById("forceGenerateLetter"),
  leaveLetterSource: document.getElementById("leaveLetterSource")
};

dutySlots.forEach((slot) => {
  const option = document.createElement("option");
  option.value = slot.key;
  option.textContent = slot.key;
  els.dutySlotInput.append(option);
});

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateValue(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value, days) {
  const date = parseDateValue(value);
  date.setDate(date.getDate() + days);
  return formatDateValue(date);
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

function setStatus(type, text) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-700",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-700"
  };
  els.status.className = `mb-6 rounded-2xl border px-4 py-3 text-sm shadow-sm ${styles[type] || styles.info}`;
  els.status.textContent = text;
}

function applyTheme(themeName) {
  const theme = themes[themeName] || themes.pink;
  state.theme = themeName in themes ? themeName : "pink";
  document.documentElement.style.setProperty("--theme-primary", theme.primary);
  document.documentElement.style.setProperty("--theme-secondary", theme.secondary);
  document.documentElement.style.setProperty("--theme-accent", theme.accent);
  document.documentElement.style.setProperty("--theme-soft", theme.soft);
  document.documentElement.style.setProperty("--theme-strong", theme.strong);

  els.themeSwitcher.querySelectorAll("[data-theme]").forEach((button) => {
    const isActive = button.dataset.theme === state.theme;
    button.classList.toggle("active", isActive);
    button.classList.toggle("bg-white/20", !isActive);
    button.classList.toggle("text-white", !isActive);
    button.classList.toggle("bg-white/90", isActive);
    button.classList.toggle("text-slate-800", isActive);
  });
}

function getDayInfo(dateValue) {
  const date = parseDateValue(dateValue);
  const weekday = date.toLocaleDateString("zh-HK", { weekday: "long" });
  const holiday = hongKongHolidays[dateValue];
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const labels = [];

  if (holiday) {
    labels.push(`香港假期：${holiday}`);
  }
  if (isWeekend) {
    labels.push(day === 6 ? "星期六" : "星期日");
  }

  return {
    fullLabel: date.toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    }),
    weekday,
    holiday,
    isWeekend,
    tag: holiday || (isWeekend ? "週末" : "上課日"),
    hint:
      labels.length > 0
        ? `${labels.join("・")}，請留意是否需要調整值日或提交告假。`
        : "今天不是香港公眾假期，按一般上課日安排值日即可。"
  };
}

function getOverride(dateValue, slot) {
  return state.manualOffsets.find((item) => item.date === dateValue && item.slot === slot) || null;
}

function getDutyStudent(slot, dateValue) {
  if (!state.studentList.length) {
    return "（未有學生）";
  }

  const slotIndex = dutySlots.findIndex((item) => item.key === slot);
  const currentDate = parseDateValue(dateValue);
  const referenceDate = new Date(2026, 0, 1);
  const dayOffset = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
  const override = getOverride(dateValue, slot);
  const customOffset = override ? Number(override.offset) : 0;
  const index =
    ((dayOffset + slotIndex + customOffset) % state.studentList.length + state.studentList.length) %
    state.studentList.length;

  return state.studentList[index].name;
}

function ensureTeacherOrWarn() {
  if (state.isTeacher) {
    return true;
  }
  setStatus("error", "目前是學生模式，不能修改共享資料。請先通過老師模式驗證。");
  setTeacherModeState("error", "目前仍是學生模式，請先完成老師模式驗證。");
  return false;
}

function setTeacherModeState(type, text) {
  const styles = {
    info: "border-white/25 bg-white/10 text-white",
    ok: "border-emerald-200/70 bg-emerald-50 text-emerald-800",
    error: "border-rose-200/80 bg-rose-50 text-rose-800",
    warn: "border-amber-200/80 bg-amber-50 text-amber-900"
  };
  els.teacherModeState.className = `rounded-xl border px-3 py-2 text-sm font-medium ${styles[type] || styles.info}`;
  els.teacherModeState.textContent = text;
}

function updateModeUi() {
  els.modeText.textContent = state.isTeacher ? "老師模式" : "學生模式";
  const authReady = classDataApi.isTeacherAuthConfigured;
  const authBusy = state.teacherAuthBusy;

  els.teacherPassword.disabled = !authReady || state.isTeacher || authBusy;
  els.teacherModeBtn.disabled = !authReady || state.isTeacher || authBusy;
  els.studentModeBtn.disabled = !state.isTeacher || authBusy;
  els.teacherModeBtn.classList.toggle("opacity-60", !authReady || state.isTeacher || authBusy);
  els.teacherModeBtn.classList.toggle("cursor-not-allowed", !authReady || state.isTeacher || authBusy);
  els.studentModeBtn.classList.toggle("opacity-60", !state.isTeacher || authBusy);
  els.studentModeBtn.classList.toggle("cursor-not-allowed", !state.isTeacher || authBusy);
  els.teacherModeBtn.innerHTML = authBusy
    ? '<i class="fa-solid fa-spinner mr-2 animate-spin"></i>驗證中…'
    : state.isTeacher
      ? '<i class="fa-solid fa-circle-check mr-2"></i>老師模式已啟用'
      : '<i class="fa-solid fa-user-tie mr-2"></i>啟用老師模式';

  if (!authReady) {
    setTeacherModeState("warn", "老師模式密碼尚未在部署 secret 設定，暫時只可用學生模式。");
  } else if (authBusy) {
    setTeacherModeState("info", "正在驗證老師模式，請稍候…");
  } else if (state.isTeacher) {
    setTeacherModeState("ok", "已啟用老師模式，老師專用功能現已開放。");
  } else {
    setTeacherModeState("info", "尚未驗證老師模式，老師專用功能會維持鎖定。");
  }

  if (!authReady) {
    els.teacherPassword.value = "";
  }

  [
    els.studentNoInput,
    els.studentNameInput,
    els.dutyDateInput,
    els.dutySlotInput,
    els.dutyOffsetInput,
    els.bulkStudentInput,
    els.todoTextInput,
    els.todoCategoryInput,
    els.linkTitleInput,
    els.linkUrlInput,
    els.linkIconInput
  ].forEach((element) => {
    element.disabled = !state.isTeacher;
  });

  [
    els.addStudentBtn,
    els.bulkImportForm.querySelector('button[type="submit"]'),
    els.dutyOverrideForm.querySelector('button[type="submit"]'),
    els.todoForm.querySelector('button[type="submit"]'),
    els.linkForm.querySelector('button[type="submit"]')
  ].forEach((button) => {
    button.disabled = !state.isTeacher;
    button.classList.toggle("opacity-60", !state.isTeacher);
    button.classList.toggle("cursor-not-allowed", !state.isTeacher);
  });
}

function renderConnectionNotice() {
  const provider = state.provider;
  const badgeClass = provider.shared
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";
  const title = provider.shared ? "Supabase 共享模式" : "示範資料模式";
  const extra = provider.shared
    ? "任何人都可看到相同資料；現時 demo RLS 亦代表任何訪客都可能修改資料。"
    : "此模式不會使用 localStorage / sessionStorage / IndexedDB，重新整理後會回復預設示範內容。";
  const authBadge = provider.teacherAuthConfigured
    ? '<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">老師驗證：已啟用</span>'
    : '<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">老師驗證：未設定（僅學生模式）</span>';
  const authHint = provider.teacherAuthConfigured
    ? "老師密碼僅以環境秘密雜湊驗證，不會顯示於頁面或回應內容。"
    : "尚未設定老師模式驗證秘密；如需啟用，請在部署環境設定老師密碼 secret。";

  els.connectionNotice.innerHTML = `
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full px-3 py-1 text-xs font-bold ${badgeClass}">${title}</span>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
            班別：${escapeHtml(provider.classId)}
          </span>
          ${authBadge}
        </div>
        <p class="mt-3 leading-6 text-slate-700">${escapeHtml(provider.message)}</p>
        <p class="mt-2 text-xs leading-5 text-slate-500">${escapeHtml(extra)} ${escapeHtml(authHint)}</p>
      </div>
    </div>
  `;
}

function renderDatePanel() {
  const info = getDayInfo(state.selectedDate);
  els.dateDisplay.textContent = info.fullLabel;
  els.dateTag.textContent = info.tag;
  els.classTag.textContent = `班別：${classDataApi.classId}`;
  els.dateHint.textContent = info.hint;
  els.dutyDateInput.value = state.selectedDate;
}

function renderDutyCards() {
  els.dutyCardGrid.innerHTML = "";

  dutySlots.forEach((slot) => {
    const override = getOverride(state.selectedDate, slot.key);
    const studentName = getDutyStudent(slot.key, state.selectedDate);
    const article = document.createElement("article");
    article.className = "duty-card rounded-[1.5rem] p-5 shadow-sm";
    article.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl accent-bg text-xl">
          <i class="fa-solid ${slot.icon}"></i>
        </span>
        <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
          ${escapeHtml(slot.key)}
        </span>
      </div>
      <h3 class="mt-4 text-xl font-black text-slate-900">${escapeHtml(studentName)}</h3>
      <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(slot.description)}</p>
      <p class="mt-4 text-xs leading-5 text-slate-500">
        ${override ? `已套用手動偏移：${escapeHtml(override.offset)}` : "未設定手動偏移，使用自動輪值。"}
      </p>
    `;
    els.dutyCardGrid.append(article);
  });
}

function renderDutyOverrides() {
  if (!state.manualOffsets.length) {
    els.dutyOverrideList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">目前未設定任何值日偏移。</li>';
    return;
  }

  els.dutyOverrideList.innerHTML = "";
  state.manualOffsets.forEach((item) => {
    const li = document.createElement("li");
    li.className =
      "flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between";
    li.innerHTML = `
      <div>
        <p class="font-semibold text-slate-800">${escapeHtml(item.date)} · ${escapeHtml(item.slot)}</p>
        <p class="text-sm text-slate-500">手動偏移：${escapeHtml(item.offset)}</p>
      </div>
      <button
        type="button"
        data-act="duty-delete"
        data-id="${item.id}"
        class="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        ${!state.isTeacher ? "disabled" : ""}
      >
        刪除
      </button>
    `;
    els.dutyOverrideList.append(li);
  });
}

function renderStudentStats() {
  const totalStudents = state.studentList.length;
  const totalAbsentDays = state.studentList.reduce((sum, item) => sum + Number(item.absentDays || 0), 0);
  const highestAbsent =
    state.studentList.reduce(
      (current, item) => (Number(item.absentDays || 0) > Number(current.absentDays || 0) ? item : current),
      { name: "暫無", absentDays: 0 }
    ) || { name: "暫無", absentDays: 0 };

  const cards = [
    { label: "學生人數", value: `${totalStudents} 位` },
    { label: "累計缺席", value: `${totalAbsentDays} 天` },
    { label: "最高缺席", value: `${highestAbsent.name} · ${highestAbsent.absentDays} 天` }
  ];

  els.studentStats.innerHTML = cards
    .map(
      (card) => `
        <div class="rounded-[1.25rem] border border-slate-100 bg-white px-4 py-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">${escapeHtml(card.label)}</p>
          <p class="mt-2 text-base font-black text-slate-900">${escapeHtml(card.value)}</p>
        </div>
      `
    )
    .join("");
}

function renderStudents() {
  if (!state.studentList.length) {
    els.studentList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">目前沒有學生資料，可在老師模式新增或批量匯入。</li>';
    return;
  }

  els.studentList.innerHTML = "";
  state.studentList.forEach((student) => {
    const li = document.createElement("li");
    li.className =
      "flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between";
    li.innerHTML = `
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full accent-bg px-3 py-1 text-xs font-bold">#${escapeHtml(
            student.studentNumber
          )}</span>
          <h3 class="text-lg font-bold text-slate-900">${escapeHtml(student.name)}</h3>
        </div>
        <p class="mt-2 text-sm text-slate-500">缺席統計：${escapeHtml(student.absentDays)} 天</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          data-act="absent-minus"
          data-id="${student.id}"
          class="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          ${!state.isTeacher ? "disabled" : ""}
        >
          -1
        </button>
        <button
          type="button"
          data-act="absent-plus"
          data-id="${student.id}"
          class="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          ${!state.isTeacher ? "disabled" : ""}
        >
          +1
        </button>
        <button
          type="button"
          data-act="student-delete"
          data-id="${student.id}"
          class="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          ${!state.isTeacher ? "disabled" : ""}
        >
          刪除
        </button>
      </div>
    `;
    els.studentList.append(li);
  });
}

function renderTodos() {
  if (!state.todos.length) {
    els.todoList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">目前沒有提醒事項。</li>';
    return;
  }

  els.todoList.innerHTML = "";
  state.todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "rounded-[1.5rem] border border-slate-100 bg-white px-4 py-4 shadow-sm";
    li.innerHTML = `
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full accent-bg px-3 py-1 text-xs font-bold">${escapeHtml(
              todo.category || "一般"
            )}</span>
            <span class="text-sm ${todo.completed ? "text-slate-400 line-through" : "text-slate-800"}">${escapeHtml(
              todo.text
            )}</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label class="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              data-act="todo-toggle"
              data-id="${todo.id}"
              class="h-4 w-4 rounded border-slate-300"
              ${todo.completed ? "checked" : ""}
              ${!state.isTeacher ? "disabled" : ""}
            />
            完成
          </label>
          <button
            type="button"
            data-act="todo-delete"
            data-id="${todo.id}"
            class="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            ${!state.isTeacher ? "disabled" : ""}
          >
            刪除
          </button>
        </div>
      </div>
    `;
    els.todoList.append(li);
  });
}

function renderLinks() {
  if (!state.customLinks.length) {
    els.linkList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">目前沒有常用連結。</li>';
    return;
  }

  els.linkList.innerHTML = "";
  state.customLinks.forEach((link) => {
    const li = document.createElement("li");
    li.className =
      "flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between";
    li.innerHTML = `
      <a
        href="${escapeHtml(safeUrl(link.url))}"
        target="_blank"
        rel="noreferrer noopener"
        class="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
      >
        <div class="flex items-center gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl accent-bg text-lg">
            ${escapeHtml(link.icon || "🔗")}
          </span>
          <div class="min-w-0">
            <p class="truncate font-bold text-slate-900">${escapeHtml(link.title)}</p>
            <p class="truncate text-sm text-slate-500">${escapeHtml(link.url)}</p>
          </div>
        </div>
      </a>
      <button
        type="button"
        data-act="link-delete"
        data-id="${link.id}"
        class="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        ${!state.isTeacher ? "disabled" : ""}
      >
        刪除
      </button>
    `;
    els.linkList.append(li);
  });
}

function renderAll() {
  renderConnectionNotice();
  updateModeUi();
  renderDatePanel();
  renderDutyCards();
  renderDutyOverrides();
  renderStudentStats();
  renderStudents();
  renderTodos();
  renderLinks();
}

async function refreshAll(showReady = false) {
  state.loading = true;
  setStatus("info", "正在同步資料…");
  try {
    const [studentList, manualOffsets, todos, customLinks] = await Promise.all([
      classDataApi.listStudents(),
      classDataApi.listDutyOverrides(),
      classDataApi.listTodos(),
      classDataApi.listLinks()
    ]);

    state.provider = classDataApi.getProviderInfo();
    state.studentList = studentList || [];
    state.manualOffsets = manualOffsets || [];
    state.todos = todos || [];
    state.customLinks = customLinks || [];
    renderAll();

    if (showReady) {
      setStatus(
        "ok",
        state.provider.shared
          ? "已同步最新 Supabase 共享資料，其他訪客重新載入或透過 realtime 亦可看到更新。"
          : "現正顯示完整示範資料；設定 Supabase 後會自動切換到共享模式。"
      );
    }
  } catch (error) {
    state.provider = classDataApi.getProviderInfo();
    renderAll();
    setStatus("error", error.message || "載入資料時發生未知錯誤。");
  } finally {
    state.loading = false;
  }
}

function fillLeaveLetterStudent() {
  if (!els.leaveStudentInput.value && state.studentList.length > 0) {
    els.leaveStudentInput.value = state.studentList[0].name;
  }
}

function getUploadedLeavePdf() {
  return els.leavePdfInput.files && els.leavePdfInput.files.length > 0 ? els.leavePdfInput.files[0] : null;
}

function setLeaveLetterSource(text) {
  if (!text) {
    els.leaveLetterSource.hidden = true;
    els.leaveLetterSource.textContent = "";
    return;
  }
  els.leaveLetterSource.hidden = false;
  els.leaveLetterSource.textContent = text;
}

function buildLeaveLetter(studentName, startDate, endDate, reason) {
  const startText = parseDateValue(startDate).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const endText = parseDateValue(endDate).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return `敬啟者：\n\n本人為 ${studentName} 的家長／監護人，現特此為學生申請於 ${startText} 至 ${endText} 期間告假。\n告假原因：${reason}。\n\n敬請批准，並協助通知有關老師及補回課業安排。\n\n此致\n4C 班主任\n\n家長／監護人：________________\n日期：${formatDateValue(new Date())}`;
}

function parseBulkStudents(input) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s*[,，\t ]+\s*(.+)$/);
      if (!match) {
        return { error: `格式不正確：${line}` };
      }
      return {
        studentNumber: Number(match[1]),
        name: match[2].trim()
      };
    });
}

els.themeSwitcher.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme]");
  if (!button) {
    return;
  }
  applyTheme(button.dataset.theme);
});

els.teacherModeBtn.addEventListener("click", async () => {
  if (state.teacherAuthBusy) {
    return;
  }
  if (!classDataApi.isTeacherAuthConfigured) {
    setStatus("error", "老師模式驗證未設定，暫時不能切換老師模式。");
    setTeacherModeState("warn", "尚未設定老師模式 secret，請在部署平台完成設定後再試。");
    return;
  }
  const candidatePassword = els.teacherPassword.value.trim();
  if (!candidatePassword) {
    setStatus("error", "請先輸入老師模式密碼。");
    setTeacherModeState("error", "未輸入老師模式密碼，請先輸入後再驗證。");
    return;
  }

  state.teacherAuthBusy = true;
  updateModeUi();
  try {
    if (await classDataApi.verifyTeacherPassword(candidatePassword)) {
      state.isTeacher = true;
      els.teacherPassword.value = "";
      state.teacherAuthBusy = false;
      renderAll();
      setStatus("ok", "已切換到老師模式。");
      return;
    }
    state.isTeacher = false;
    setStatus("error", "老師模式驗證失敗，請再次確認後重試。");
    setTeacherModeState("error", "驗證失敗，請再試一次。");
  } catch {
    state.isTeacher = false;
    setStatus("error", "老師模式暫時無法驗證，請稍後重試。");
    setTeacherModeState("error", "驗證服務暫時不可用，請稍後再試。");
  } finally {
    state.teacherAuthBusy = false;
    if (!state.isTeacher) {
      updateModeUi();
    }
  }
});

els.studentModeBtn.addEventListener("click", () => {
  if (state.teacherAuthBusy || !state.isTeacher) {
    return;
  }
  state.isTeacher = false;
  renderAll();
  setStatus("info", "已切換回學生模式。");
});

els.teacherPassword.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  els.teacherModeBtn.click();
});

els.prevDayBtn.addEventListener("click", () => {
  state.selectedDate = addDays(state.selectedDate, -1);
  renderDatePanel();
  renderDutyCards();
});

els.todayBtn.addEventListener("click", () => {
  state.selectedDate = formatDateValue(new Date());
  renderDatePanel();
  renderDutyCards();
});

els.nextDayBtn.addEventListener("click", () => {
  state.selectedDate = addDays(state.selectedDate, 1);
  renderDatePanel();
  renderDutyCards();
});

els.studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const studentNumber = Number(els.studentNoInput.value);
  const name = els.studentNameInput.value.trim();
  if (!studentNumber || !name) {
    setStatus("error", "請輸入有效的學號和姓名。");
    return;
  }

  try {
    await classDataApi.addStudent(studentNumber, name);
    els.studentForm.reset();
    await refreshAll(true);
    fillLeaveLetterStudent();
  } catch (error) {
    setStatus("error", error.message || "新增學生失敗。");
  }
});

els.bulkImportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const rows = parseBulkStudents(els.bulkStudentInput.value);
  const invalidRows = rows.filter((item) => item.error);
  if (invalidRows.length > 0) {
    els.bulkImportFeedback.textContent = invalidRows.map((item) => item.error).join("；");
    setStatus("error", "批量匯入失敗，請先修正格式。");
    return;
  }

  let importedCount = 0;
  const skipped = [];
  for (const row of rows) {
    if (state.studentList.some((item) => item.studentNumber === row.studentNumber)) {
      skipped.push(`${row.studentNumber} ${row.name}`);
      continue;
    }
    try {
      await classDataApi.addStudent(row.studentNumber, row.name);
      importedCount += 1;
    } catch (error) {
      skipped.push(`${row.studentNumber} ${row.name}（${error.message}）`);
    }
  }

  els.bulkStudentInput.value = "";
  els.bulkImportFeedback.textContent =
    importedCount > 0
      ? `成功匯入 ${importedCount} 位學生。${skipped.length ? `略過：${skipped.join("、")}` : ""}`
      : skipped.length
        ? `未有匯入新學生，略過：${skipped.join("、")}`
        : "沒有可匯入的內容。";
  await refreshAll(true);
  fillLeaveLetterStudent();
});

els.studentList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button || !ensureTeacherOrWarn()) return;

  const studentId = Number(button.dataset.id);
  const student = state.studentList.find((item) => item.id === studentId);
  if (!student) {
    setStatus("error", "找不到學生資料。");
    return;
  }

  try {
    if (button.dataset.act === "student-delete") {
      await classDataApi.deleteStudent(studentId);
    } else if (button.dataset.act === "absent-plus") {
      await classDataApi.updateStudentAbsentDays(studentId, Number(student.absentDays) + 1);
    } else if (button.dataset.act === "absent-minus") {
      await classDataApi.updateStudentAbsentDays(studentId, Math.max(0, Number(student.absentDays) - 1));
    }
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message || "更新學生資料失敗。");
  }
});

els.dutyOverrideForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const date = els.dutyDateInput.value;
  const slot = els.dutySlotInput.value;
  const offset = Number(els.dutyOffsetInput.value);
  if (!date || !slot || Number.isNaN(offset)) {
    setStatus("error", "請輸入有效的值日偏移資料。");
    return;
  }

  try {
    await classDataApi.upsertDutyOverride(date, slot, offset);
    els.dutyOffsetInput.value = "0";
    state.selectedDate = date;
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message || "儲存值日偏移失敗。");
  }
});

els.dutyOverrideList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act='duty-delete']");
  if (!button || !ensureTeacherOrWarn()) return;

  try {
    await classDataApi.deleteDutyOverride(Number(button.dataset.id));
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message || "刪除值日偏移失敗。");
  }
});

els.todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const text = els.todoTextInput.value.trim();
  const category = els.todoCategoryInput.value.trim();
  if (!text) {
    setStatus("error", "請輸入提醒事項。");
    return;
  }

  try {
    await classDataApi.addTodo(text, category);
    els.todoForm.reset();
    els.todoCategoryInput.value = "一般";
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message || "新增提醒事項失敗。");
  }
});

els.todoList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act='todo-delete']");
  if (!button || !ensureTeacherOrWarn()) return;

  try {
    await classDataApi.deleteTodo(Number(button.dataset.id));
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message || "刪除提醒事項失敗。");
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
    setStatus("error", error.message || "更新提醒事項失敗。");
  }
});

els.linkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureTeacherOrWarn()) return;

  const title = els.linkTitleInput.value.trim();
  const url = els.linkUrlInput.value.trim();
  const icon = els.linkIconInput.value.trim();
  if (!title || !url) {
    setStatus("error", "請輸入完整的連結標題與網址。");
    return;
  }

  try {
    await classDataApi.addLink(title, url, icon);
    els.linkForm.reset();
    els.linkIconInput.value = "🔗";
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message || "新增常用連結失敗。");
  }
});

els.linkList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act='link-delete']");
  if (!button || !ensureTeacherOrWarn()) return;

  try {
    await classDataApi.deleteLink(Number(button.dataset.id));
    await refreshAll(true);
  } catch (error) {
    setStatus("error", error.message || "刪除常用連結失敗。");
  }
});

els.leaveLetterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const uploadedPdf = getUploadedLeavePdf();
  const shouldGenerateNewLetter = Boolean(els.forceGenerateLetter.checked);
  if (uploadedPdf && !shouldGenerateNewLetter) {
    els.leaveLetterOutput.hidden = true;
    els.leaveLetterOutput.value = "";
    setLeaveLetterSource(`來源：你上傳的 PDF（${uploadedPdf.name}），系統未自動生成第二份告假信。`);
    setStatus("ok", "已優先使用你上傳的 PDF；如需新文字版本，請勾選「仍然生成新文字告假信」。");
    return;
  }

  const studentName = els.leaveStudentInput.value.trim();
  const startDate = els.leaveStartInput.value;
  const endDate = els.leaveEndInput.value;
  const reason = els.leaveReasonInput.value.trim();

  if (!studentName || !startDate || !endDate || !reason) {
    setStatus("error", "請完整填寫告假信資料。");
    return;
  }

  if (parseDateValue(endDate) < parseDateValue(startDate)) {
    setStatus("error", "結束日期不能早於開始日期。");
    return;
  }

  els.leaveLetterOutput.hidden = false;
  els.leaveLetterOutput.value = buildLeaveLetter(studentName, startDate, endDate, reason);
  setLeaveLetterSource("來源：系統即時生成文字告假信（由你明確觸發）。");
  setStatus("ok", "已生成告假信，可直接複製使用。");
});

els.useUploadedPdfBtn.addEventListener("click", () => {
  const uploadedPdf = getUploadedLeavePdf();
  if (!uploadedPdf) {
    setStatus("error", "請先上傳 PDF 檔案。");
    return;
  }
  els.leaveLetterOutput.hidden = true;
  els.leaveLetterOutput.value = "";
  setLeaveLetterSource(`來源：你上傳的 PDF（${uploadedPdf.name}）。`);
  setStatus("ok", "已選擇使用你上傳的 PDF，系統不會自動生成第二份告假信。");
});

els.leavePdfInput.addEventListener("change", () => {
  const uploadedPdf = getUploadedLeavePdf();
  if (!uploadedPdf) {
    setLeaveLetterSource("");
    return;
  }
  if (uploadedPdf.type && uploadedPdf.type !== "application/pdf") {
    els.leavePdfInput.value = "";
    setLeaveLetterSource("");
    setStatus("error", "請上傳 PDF 檔案。");
    return;
  }
  els.leaveLetterOutput.hidden = true;
  els.leaveLetterOutput.value = "";
  setLeaveLetterSource(`來源：你上傳的 PDF（${uploadedPdf.name}）。預設會優先使用此檔案。`);
});

window.addEventListener("offline", () => {
  setStatus("error", "目前離線，若使用 Supabase 共享模式將無法同步資料。");
});

window.addEventListener("online", async () => {
  setStatus("info", "網路已恢復，正在重新同步資料…");
  await refreshAll(true);
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

applyTheme("pink");
els.dutyDateInput.value = state.selectedDate;
els.leaveStartInput.value = state.selectedDate;
els.leaveEndInput.value = state.selectedDate;
refreshAll(true).then(fillLeaveLetterStudent);

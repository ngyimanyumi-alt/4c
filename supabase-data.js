const DEFAULT_CLASS_ID = "4C";
const rawConfig = window.APP_CONFIG || {};
const DEMO_TEACHER_PASSWORD =
  typeof rawConfig.TEACHER_PASSWORD === "string" && rawConfig.TEACHER_PASSWORD.trim()
    ? rawConfig.TEACHER_PASSWORD.trim()
    : "23896299";
const candidateClassId = typeof rawConfig.CLASS_ID === "string" ? rawConfig.CLASS_ID.trim() : "";
const safeClassId = /^[A-Za-z0-9_-]{1,32}$/.test(candidateClassId)
  ? candidateClassId
  : DEFAULT_CLASS_ID;
const SUPABASE_URL = typeof rawConfig.SUPABASE_URL === "string" ? rawConfig.SUPABASE_URL.trim() : "";
const SUPABASE_ANON_KEY =
  typeof rawConfig.SUPABASE_ANON_KEY === "string" ? rawConfig.SUPABASE_ANON_KEY.trim() : "";

const DEFAULT_DATA = Object.freeze({
  studentList: [
    { id: 1, studentNumber: 1, name: "陳大文", absentDays: 0 },
    { id: 2, studentNumber: 2, name: "李小美", absentDays: 1 },
    { id: 3, studentNumber: 3, name: "王俊傑", absentDays: 0 },
    { id: 4, studentNumber: 4, name: "何詠欣", absentDays: 2 },
    { id: 5, studentNumber: 5, name: "張曉晴", absentDays: 0 },
    { id: 6, studentNumber: 6, name: "林子軒", absentDays: 1 }
  ],
  todos: [
    { id: 1, text: "交數學作業", category: "功課", completed: false },
    { id: 2, text: "明天帶體育服", category: "提醒", completed: false },
    { id: 3, text: "班會前整理壁報", category: "班務", completed: true }
  ],
  customLinks: [
    { id: 1, title: "學校網站", url: "https://www.edb.gov.hk/", icon: "🏫" },
    { id: 2, title: "Google Classroom", url: "https://classroom.google.com/", icon: "📚" },
    { id: 3, title: "Zoom", url: "https://zoom.us/", icon: "💻" }
  ],
  manualOffsets: [{ id: 1, date: "2026-09-02", slot: "黑板", offset: 1 }]
});

function cloneDefaults() {
  return {
    studentList: DEFAULT_DATA.studentList.map((item) => ({ ...item })),
    todos: DEFAULT_DATA.todos.map((item) => ({ ...item })),
    customLinks: DEFAULT_DATA.customLinks.map((item) => ({ ...item })),
    manualOffsets: DEFAULT_DATA.manualOffsets.map((item) => ({ ...item }))
  };
}

function toSafeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function mapStudentRow(row) {
  return {
    id: toSafeNumber(row.id),
    studentNumber: toSafeNumber(row.student_number),
    name: row.name || "",
    absentDays: Math.max(0, toSafeNumber(row.absent_days))
  };
}

function mapTodoRow(row) {
  return {
    id: toSafeNumber(row.id),
    text: row.text || "",
    category: row.category || "一般",
    completed: Boolean(row.completed)
  };
}

function mapLinkRow(row) {
  return {
    id: toSafeNumber(row.id),
    title: row.title || "",
    url: row.url || "",
    icon: row.icon || "🔗"
  };
}

function mapDutyOverrideRow(row) {
  return {
    id: toSafeNumber(row.id),
    date: row.duty_date || "",
    slot: row.duty_slot || "",
    offset: toSafeNumber(row.duty_offset)
  };
}

const providerInfo = {
  mode: "demo",
  classId: safeClassId,
  teacherPassword: DEMO_TEACHER_PASSWORD,
  message:
    "未設定 Supabase，現正顯示完整示範資料。設定好 GitHub Actions Variables / Secrets 並重新部署後，網站會自動改用共享雲端資料。",
  configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  shared: false
};

let supabaseClient = null;
if (providerInfo.configured && window.supabase && typeof window.supabase.createClient === "function") {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
  providerInfo.mode = "supabase";
  providerInfo.shared = true;
  providerInfo.message = `已連接 Supabase 共享資料（班別：${safeClassId}）。所有訪客會看到相同內容。`;
} else if (providerInfo.configured) {
  providerInfo.message =
    "已提供 Supabase 設定，但未能載入 Supabase SDK，因此暫時顯示示範資料。請重新整理頁面後再試。";
}

const CLASS_FILTER = { class_id: safeClassId };
const demoStore = cloneDefaults();
const demoCounters = {
  student: demoStore.studentList.length + 1,
  todo: demoStore.todos.length + 1,
  link: demoStore.customLinks.length + 1,
  offset: demoStore.manualOffsets.length + 1
};

function nextDemoId(type) {
  const value = demoCounters[type];
  demoCounters[type] += 1;
  return value;
}

function sortStudents(list) {
  return [...list].sort((a, b) => a.studentNumber - b.studentNumber);
}

function sortTodos(list) {
  return [...list].sort((a, b) => a.id - b.id);
}

function sortLinks(list) {
  return [...list].sort((a, b) => a.id - b.id);
}

function sortOffsets(list) {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));
}

async function run(queryFactory, errorPrefix) {
  const { data, error } = await queryFactory();
  if (error) {
    throw new Error(`${errorPrefix}：${error.message}`);
  }
  return data;
}

async function listStudents() {
  if (!supabaseClient) {
    return sortStudents(demoStore.studentList);
  }
  const data = await run(
    () =>
      supabaseClient
        .from("students")
        .select("id, student_number, name, absent_days")
        .match(CLASS_FILTER)
        .order("student_number", { ascending: true }),
    "載入學生資料失敗"
  );
  return data.map(mapStudentRow);
}

async function addStudent(studentNumber, name) {
  const safeStudentNumber = toSafeNumber(studentNumber);
  const safeName = String(name || "").trim();
  if (!safeStudentNumber || !safeName) {
    throw new Error("請輸入有效的學號和姓名。");
  }

  if (!supabaseClient) {
    if (demoStore.studentList.some((item) => item.studentNumber === safeStudentNumber)) {
      throw new Error(`學號 ${safeStudentNumber} 已存在。`);
    }
    const record = {
      id: nextDemoId("student"),
      studentNumber: safeStudentNumber,
      name: safeName,
      absentDays: 0
    };
    demoStore.studentList.push(record);
    return record;
  }

  return run(
    () =>
      supabaseClient
        .from("students")
        .insert([{ ...CLASS_FILTER, student_number: safeStudentNumber, name: safeName }])
        .select("id")
        .single(),
    "新增學生失敗"
  );
}

async function updateStudentAbsentDays(id, absentDays) {
  const safeId = toSafeNumber(id);
  const safeAbsentDays = Math.max(0, toSafeNumber(absentDays));
  if (!supabaseClient) {
    const student = demoStore.studentList.find((item) => item.id === safeId);
    if (!student) {
      throw new Error("找不到學生資料。");
    }
    student.absentDays = safeAbsentDays;
    return student;
  }

  return run(
    () =>
      supabaseClient
        .from("students")
        .update({ absent_days: safeAbsentDays })
        .match({ ...CLASS_FILTER, id: safeId }),
    "更新缺席天數失敗"
  );
}

async function deleteStudent(id) {
  const safeId = toSafeNumber(id);
  if (!supabaseClient) {
    const index = demoStore.studentList.findIndex((item) => item.id === safeId);
    if (index < 0) {
      throw new Error("找不到學生資料。");
    }
    demoStore.studentList.splice(index, 1);
    return;
  }

  return run(
    () => supabaseClient.from("students").delete().match({ ...CLASS_FILTER, id: safeId }),
    "刪除學生失敗"
  );
}

async function listDutyOverrides() {
  if (!supabaseClient) {
    return sortOffsets(demoStore.manualOffsets);
  }
  const data = await run(
    () =>
      supabaseClient
        .from("duty_overrides")
        .select("id, duty_date, duty_slot, duty_offset")
        .match(CLASS_FILTER)
        .order("duty_date", { ascending: true })
        .order("duty_slot", { ascending: true }),
    "載入值日偏移失敗"
  );
  return data.map(mapDutyOverrideRow);
}

async function upsertDutyOverride(date, slot, offset) {
  const safeDate = String(date || "").trim();
  const safeSlot = String(slot || "").trim();
  const safeOffset = toSafeNumber(offset);
  if (!safeDate || !safeSlot) {
    throw new Error("請輸入有效的值日偏移資料。");
  }

  if (!supabaseClient) {
    const existing = demoStore.manualOffsets.find(
      (item) => item.date === safeDate && item.slot === safeSlot
    );
    if (existing) {
      existing.offset = safeOffset;
      return existing;
    }
    const record = { id: nextDemoId("offset"), date: safeDate, slot: safeSlot, offset: safeOffset };
    demoStore.manualOffsets.push(record);
    return record;
  }

  return run(
    () =>
      supabaseClient.from("duty_overrides").upsert(
        [{ ...CLASS_FILTER, duty_date: safeDate, duty_slot: safeSlot, duty_offset: safeOffset }],
        { onConflict: "class_id,duty_date,duty_slot" }
      ),
    "儲存值日偏移失敗"
  );
}

async function deleteDutyOverride(id) {
  const safeId = toSafeNumber(id);
  if (!supabaseClient) {
    const index = demoStore.manualOffsets.findIndex((item) => item.id === safeId);
    if (index < 0) {
      throw new Error("找不到值日偏移設定。");
    }
    demoStore.manualOffsets.splice(index, 1);
    return;
  }

  return run(
    () => supabaseClient.from("duty_overrides").delete().match({ ...CLASS_FILTER, id: safeId }),
    "刪除值日偏移失敗"
  );
}

async function listTodos() {
  if (!supabaseClient) {
    return sortTodos(demoStore.todos);
  }
  const data = await run(
    () =>
      supabaseClient
        .from("todos")
        .select("id, text, category, completed")
        .match(CLASS_FILTER)
        .order("id", { ascending: true }),
    "載入提醒事項失敗"
  );
  return data.map(mapTodoRow);
}

async function addTodo(text, category) {
  const safeText = String(text || "").trim();
  const safeCategory = String(category || "").trim() || "一般";
  if (!safeText) {
    throw new Error("請輸入提醒內容。");
  }

  if (!supabaseClient) {
    const record = {
      id: nextDemoId("todo"),
      text: safeText,
      category: safeCategory,
      completed: false
    };
    demoStore.todos.push(record);
    return record;
  }

  return run(
    () => supabaseClient.from("todos").insert([{ ...CLASS_FILTER, text: safeText, category: safeCategory }]),
    "新增提醒事項失敗"
  );
}

async function updateTodo(id, completed) {
  const safeId = toSafeNumber(id);
  const safeCompleted = Boolean(completed);
  if (!supabaseClient) {
    const todo = demoStore.todos.find((item) => item.id === safeId);
    if (!todo) {
      throw new Error("找不到提醒事項。");
    }
    todo.completed = safeCompleted;
    return todo;
  }

  return run(
    () =>
      supabaseClient
        .from("todos")
        .update({ completed: safeCompleted })
        .match({ ...CLASS_FILTER, id: safeId }),
    "更新提醒事項失敗"
  );
}

async function deleteTodo(id) {
  const safeId = toSafeNumber(id);
  if (!supabaseClient) {
    const index = demoStore.todos.findIndex((item) => item.id === safeId);
    if (index < 0) {
      throw new Error("找不到提醒事項。");
    }
    demoStore.todos.splice(index, 1);
    return;
  }

  return run(
    () => supabaseClient.from("todos").delete().match({ ...CLASS_FILTER, id: safeId }),
    "刪除提醒事項失敗"
  );
}

async function listLinks() {
  if (!supabaseClient) {
    return sortLinks(demoStore.customLinks);
  }
  const data = await run(
    () =>
      supabaseClient
        .from("custom_links")
        .select("id, title, url, icon")
        .match(CLASS_FILTER)
        .order("id", { ascending: true }),
    "載入常用連結失敗"
  );
  return data.map(mapLinkRow);
}

async function addLink(title, url, icon) {
  const safeTitle = String(title || "").trim();
  const safeUrl = String(url || "").trim();
  const safeIcon = String(icon || "").trim() || "🔗";
  if (!safeTitle || !safeUrl) {
    throw new Error("請輸入完整的連結標題與網址。");
  }

  if (!supabaseClient) {
    const record = {
      id: nextDemoId("link"),
      title: safeTitle,
      url: safeUrl,
      icon: safeIcon
    };
    demoStore.customLinks.push(record);
    return record;
  }

  return run(
    () =>
      supabaseClient
        .from("custom_links")
        .insert([{ ...CLASS_FILTER, title: safeTitle, url: safeUrl, icon: safeIcon }]),
    "新增常用連結失敗"
  );
}

async function deleteLink(id) {
  const safeId = toSafeNumber(id);
  if (!supabaseClient) {
    const index = demoStore.customLinks.findIndex((item) => item.id === safeId);
    if (index < 0) {
      throw new Error("找不到常用連結。");
    }
    demoStore.customLinks.splice(index, 1);
    return;
  }

  return run(
    () => supabaseClient.from("custom_links").delete().match({ ...CLASS_FILTER, id: safeId }),
    "刪除常用連結失敗"
  );
}

export const classDataApi = {
  classId: safeClassId,
  teacherPassword: DEMO_TEACHER_PASSWORD,
  getProviderInfo() {
    return { ...providerInfo };
  },
  listStudents,
  addStudent,
  updateStudentAbsentDays,
  deleteStudent,
  listDutyOverrides,
  upsertDutyOverride,
  deleteDutyOverride,
  listTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  listLinks,
  addLink,
  deleteLink
};

export function subscribeToChanges(onChange) {
  if (!supabaseClient) {
    return () => {};
  }

  const filter = `class_id=eq.${safeClassId}`;
  const channel = supabaseClient.channel(`class-${safeClassId}-shared-data`);

  ["students", "duty_overrides", "todos", "custom_links"].forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter },
      () => onChange(table)
    );
  });

  channel.subscribe();
  return () => {
    supabaseClient.removeChannel(channel);
  };
}

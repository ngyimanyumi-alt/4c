const { SUPABASE_URL, SUPABASE_ANON_KEY, CLASS_ID } = window.APP_CONFIG || {};
const configError =
  !SUPABASE_URL || !SUPABASE_ANON_KEY
    ? "尚未設定 Supabase，請先編輯 config.js 的 SUPABASE_URL 與 SUPABASE_ANON_KEY。"
    : "";

const supabaseClient =
  !configError &&
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

const CLASS_FILTER = { class_id: CLASS_ID || "4C" };

async function run(queryPromise, errorPrefix) {
  if (configError) {
    throw new Error(configError);
  }
  const { data, error } = await queryPromise;
  if (error) {
    throw new Error(`${errorPrefix}：${error.message}`);
  }
  return data;
}

export const classDataApi = {
  classId: CLASS_FILTER.class_id,
  async listStudents() {
    return run(
      supabaseClient
        .from("students")
        .select("id, student_number, name, absent_days")
        .match(CLASS_FILTER)
        .order("student_number", { ascending: true }),
      "載入學生資料失敗"
    );
  },
  async addStudent(student_number, name) {
    return run(
      supabaseClient
        .from("students")
        .insert([{ ...CLASS_FILTER, student_number, name }])
        .select("id")
        .single(),
      "新增學生失敗"
    );
  },
  async updateStudentAbsentDays(id, absent_days) {
    return run(
      supabaseClient
        .from("students")
        .update({ absent_days })
        .match({ ...CLASS_FILTER, id }),
      "更新缺席天數失敗"
    );
  },
  async deleteStudent(id) {
    return run(
      supabaseClient.from("students").delete().match({ ...CLASS_FILTER, id }),
      "刪除學生失敗"
    );
  },

  async listDutyOverrides() {
    return run(
      supabaseClient
        .from("duty_overrides")
        .select("id, duty_date, duty_slot, duty_offset")
        .match(CLASS_FILTER)
        .order("duty_date", { ascending: false })
        .order("duty_slot", { ascending: true }),
      "載入值日偏移失敗"
    );
  },
  async upsertDutyOverride(duty_date, duty_slot, duty_offset) {
    return run(
      supabaseClient
        .from("duty_overrides")
        .upsert([{ ...CLASS_FILTER, duty_date, duty_slot, duty_offset }], {
          onConflict: "class_id,duty_date,duty_slot"
        }),
      "儲存值日偏移失敗"
    );
  },
  async deleteDutyOverride(id) {
    return run(
      supabaseClient.from("duty_overrides").delete().match({ ...CLASS_FILTER, id }),
      "刪除值日偏移失敗"
    );
  },

  async listTodos() {
    return run(
      supabaseClient
        .from("todos")
        .select("id, text, category, completed")
        .match(CLASS_FILTER)
        .order("id", { ascending: true }),
      "載入待辦失敗"
    );
  },
  async addTodo(text, category) {
    return run(
      supabaseClient
        .from("todos")
        .insert([{ ...CLASS_FILTER, text, category: category || "一般" }]),
      "新增待辦失敗"
    );
  },
  async updateTodo(id, completed) {
    return run(
      supabaseClient
        .from("todos")
        .update({ completed })
        .match({ ...CLASS_FILTER, id }),
      "更新待辦失敗"
    );
  },
  async deleteTodo(id) {
    return run(
      supabaseClient.from("todos").delete().match({ ...CLASS_FILTER, id }),
      "刪除待辦失敗"
    );
  },

  async listLinks() {
    return run(
      supabaseClient
        .from("custom_links")
        .select("id, title, url, icon")
        .match(CLASS_FILTER)
        .order("id", { ascending: true }),
      "載入連結失敗"
    );
  },
  async addLink(title, url, icon) {
    return run(
      supabaseClient
        .from("custom_links")
        .insert([{ ...CLASS_FILTER, title, url, icon: icon || "🔗" }]),
      "新增連結失敗"
    );
  },
  async deleteLink(id) {
    return run(
      supabaseClient.from("custom_links").delete().match({ ...CLASS_FILTER, id }),
      "刪除連結失敗"
    );
  }
};

export function subscribeToChanges(onChange) {
  if (!supabaseClient) {
    return () => {};
  }
  const filter = `class_id=eq.${CLASS_FILTER.class_id}`;
  const channel = supabaseClient.channel("class-4c-updates");

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

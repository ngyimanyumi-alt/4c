export const DUTY_STUDENTS_PER_SLOT = 2;

export const dutySlots = [
  {
    key: "早會",
    icon: "fa-sun",
    description: "保留原有早會輪值位，現會顯示兩位值日生與放學分工。",
    taskGroups: [
      ["扔垃圾", "檢查櫃桶"],
      ["檢查枱凳泊好"]
    ]
  },
  {
    key: "黑板",
    icon: "fa-chalkboard",
    description: "保留黑板輪值位，放學時分工處理白板與課室巡查。",
    taskGroups: [["擦白板"], ["協助檢查白板區"]]
  },
  {
    key: "地面",
    icon: "fa-broom",
    description: "保留地面輪值位，放學時負責地面清潔與收尾。",
    taskGroups: [["掃地"], ["協助檢查地面整潔"]]
  }
];

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

function normalizeIndex(value, length) {
  return ((value % length) + length) % length;
}

function getReferenceStartIndex(dateValue, slotIndex, customOffset, totalStudents) {
  const currentDate = parseDateValue(dateValue || formatDateValue(new Date()));
  const referenceDate = new Date(2026, 0, 1);
  const dayOffset = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
  return normalizeIndex(dayOffset + slotIndex * DUTY_STUDENTS_PER_SLOT + customOffset, totalStudents);
}

function getNormalizedAbsentDays(student) {
  return Math.max(0, Number(student?.absentDays) || 0);
}

function isAvailableForDuty(student) {
  return getNormalizedAbsentDays(student) === 0;
}

function findNextEligibleStudentIndex(studentList, startIndex, excludedIds = new Set()) {
  if (!studentList.length) {
    return -1;
  }

  for (let step = 0; step < studentList.length; step += 1) {
    const index = normalizeIndex(startIndex + step, studentList.length);
    const student = studentList[index];
    if (!isAvailableForDuty(student) || excludedIds.has(student.id)) {
      continue;
    }
    return index;
  }

  return -1;
}

function listAvailableStudents(studentList) {
  return studentList.filter(isAvailableForDuty);
}

export function buildDutyAssignments(studentList, manualOffsets, dateValue, slots = dutySlots) {
  if (!Array.isArray(slots) || slots.length === 0) {
    return [];
  }

  if (!Array.isArray(studentList) || studentList.length === 0) {
    return slots.map((slot) => ({ ...slot, students: [], overrideOffset: 0 }));
  }

  const usedAcrossDay = new Set();
  const availableStudents = listAvailableStudents(studentList);

  return slots.map((slot, slotIndex) => {
    const override =
      manualOffsets.find((item) => item.date === dateValue && item.slot === slot.key) || null;
    const overrideOffset = override ? Number(override.offset) || 0 : 0;
    const baseStartIndex = getReferenceStartIndex(
      dateValue,
      slotIndex,
      overrideOffset,
      studentList.length
    );
    const selectedStudents = [];
    const localIds = new Set();
    let searchStartIndex = baseStartIndex;

    while (selectedStudents.length < DUTY_STUDENTS_PER_SLOT) {
      const preferredExclusions = new Set([...usedAcrossDay, ...localIds]);
      let nextIndex = findNextEligibleStudentIndex(studentList, searchStartIndex, preferredExclusions);

      if (nextIndex < 0) {
        nextIndex = findNextEligibleStudentIndex(studentList, searchStartIndex, localIds);
      }

      if (nextIndex < 0) {
        break;
      }

      const nextStudent = studentList[nextIndex];
      selectedStudents.push(nextStudent);
      localIds.add(nextStudent.id);
      usedAcrossDay.add(nextStudent.id);
      searchStartIndex = nextIndex + 1;
    }

    if (selectedStudents.length === 1 && availableStudents.length < DUTY_STUDENTS_PER_SLOT) {
      selectedStudents.push(selectedStudents[0]);
    }

    return {
      ...slot,
      students: selectedStudents,
      overrideOffset
    };
  });
}

export function buildStudentVisibilityModel(studentList, isTeacher) {
  const normalizedStudents = Array.isArray(studentList) ? studentList : [];

  if (isTeacher) {
    return {
      mode: "teacher",
      students: normalizedStudents.map((student) => ({
        ...student,
        absentDays: getNormalizedAbsentDays(student)
      }))
    };
  }

  return {
    mode: "student",
    students: normalizedStudents
      .filter((student) => getNormalizedAbsentDays(student) > 0)
      .map((student) => ({
        id: student.id,
        name: student.name || "",
        absentDays: getNormalizedAbsentDays(student)
      }))
  };
}

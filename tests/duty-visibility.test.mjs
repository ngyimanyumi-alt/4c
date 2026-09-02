import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DUTY_STUDENTS_PER_SLOT,
  buildDutyAssignments,
  buildStudentVisibilityModel
} from '../duty-utils.js';

const students = [
  { id: 1, studentNumber: 1, name: '陳大文', absentDays: 0 },
  { id: 2, studentNumber: 2, name: '李小美', absentDays: 0 },
  { id: 3, studentNumber: 3, name: '王俊傑', absentDays: 0 },
  { id: 4, studentNumber: 4, name: '何詠欣', absentDays: 0 },
  { id: 5, studentNumber: 5, name: '張曉晴', absentDays: 0 },
  { id: 6, studentNumber: 6, name: '林子軒', absentDays: 0 }
];

test('student mode only exposes absent-student summary while teacher mode keeps full directory', () => {
  const source = [
    { id: 1, studentNumber: 1, name: '陳大文', absentDays: 0 },
    { id: 2, studentNumber: 2, name: '李小美', absentDays: 2 },
    { id: 3, studentNumber: 3, name: '王俊傑', absentDays: 1 }
  ];

  const studentView = buildStudentVisibilityModel(source, false);
  assert.equal(studentView.mode, 'student');
  assert.deepEqual(studentView.students, [
    { id: 2, name: '李小美', absentDays: 2 },
    { id: 3, name: '王俊傑', absentDays: 1 }
  ]);
  assert.equal('studentNumber' in studentView.students[0], false);

  const teacherView = buildStudentVisibilityModel(source, true);
  assert.equal(teacherView.mode, 'teacher');
  assert.equal(teacherView.students.length, 3);
  assert.equal(teacherView.students[0].studentNumber, 1);
});

test('duty assignments render two students per slot and include all five after-school tasks', () => {
  const assignments = buildDutyAssignments(students, [], '2026-01-01');

  assert.equal(assignments.length, 3);
  assignments.forEach((assignment) => {
    assert.equal(assignment.students.length, DUTY_STUDENTS_PER_SLOT);
    assert.equal(
      new Set(assignment.students.map((student) => student.id)).size,
      DUTY_STUDENTS_PER_SLOT
    );
  });

  assert.deepEqual(
    assignments.map((assignment) => assignment.students.map((student) => student.name)),
    [
      ['陳大文', '李小美'],
      ['王俊傑', '何詠欣'],
      ['張曉晴', '林子軒']
    ]
  );

  const visibleTasks = assignments.flatMap((assignment) => assignment.taskGroups.flat());
  assert.deepEqual(
    visibleTasks.filter((task) =>
      ['扔垃圾', '掃地', '擦白板', '檢查櫃桶', '檢查枱凳泊好'].includes(task)
    ),
    ['扔垃圾', '檢查櫃桶', '檢查枱凳泊好', '擦白板', '掃地']
  );
});

test('absent duty students are automatically skipped and manual offsets still apply', () => {
  const absentStudents = students.map((student) =>
    student.id === 1 ? { ...student, absentDays: 1 } : student
  );

  const assignments = buildDutyAssignments(absentStudents, [], '2026-01-01');
  assert.deepEqual(assignments[0].students.map((student) => student.name), ['李小美', '王俊傑']);
  assert.equal(assignments[0].students.some((student) => student.id === 1), false);

  const offsetAssignments = buildDutyAssignments(
    absentStudents,
    [{ id: 1, date: '2026-01-01', slot: '早會', offset: 2 }],
    '2026-01-01'
  );
  assert.deepEqual(offsetAssignments[0].students.map((student) => student.name), ['王俊傑', '何詠欣']);
});

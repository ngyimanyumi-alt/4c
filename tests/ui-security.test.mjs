import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

test('teacher password is not hardcoded or exposed in frontend-visible files', () => {
  const files = [
    'index.html',
    'app.js',
    'supabase-data.js',
    'README.md',
    'config.example.js',
    '.env.example',
    '.github/workflows/deploy-pages.yml'
  ];

  for (const file of files) {
    const content = read(file);
    assert.equal(
      content.includes('23896299'),
      false,
      `unexpected legacy plaintext password found in ${file}`
    );
  }

  const workflow = read('.github/workflows/deploy-pages.yml');
  assert.match(workflow, /TEACHER_MODE_PASSWORD/);
  assert.match(workflow, /TEACHER_PASSWORD_HASH/);
  assert.doesNotMatch(workflow, /TEACHER_PASSWORD"\s*:/);
});

test('teacher auth flow verifies success/failure by hash and provider info does not leak password data', async () => {
  const password = 'safe-teacher-password';
  const hash = createHash('sha256').update(password).digest('hex');

  global.window = {
    APP_CONFIG: {
      TEACHER_PASSWORD_HASH: hash,
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      CLASS_ID: '4C'
    },
    supabase: undefined,
    crypto: webcrypto,
    TextEncoder
  };

  const moduleUrl = `${pathToFileURL(join(root, 'supabase-data.js')).href}?t=${Date.now()}`;
  const { classDataApi } = await import(moduleUrl);

  assert.equal(classDataApi.isTeacherAuthConfigured, true);
  assert.equal(await classDataApi.verifyTeacherPassword(password), true);
  assert.equal(await classDataApi.verifyTeacherPassword('wrong-password'), false);
  assert.equal(await classDataApi.verifyTeacherPassword(''), false);
  const provider = classDataApi.getProviderInfo();
  assert.equal('teacherPassword' in provider, false);
  assert.equal('TEACHER_PASSWORD_HASH' in provider, false);
  delete global.window;

  const dataModule = read('supabase-data.js');
  assert.match(dataModule, /TEACHER_PASSWORD_HASH/);
  assert.match(dataModule, /verifyTeacherPassword/);
  assert.doesNotMatch(dataModule, /teacherPassword\s*:/);
  assert.doesNotMatch(dataModule, /DEMO_TEACHER_PASSWORD/);
});

test('teacher mode UI flow keeps success/failure states explicit without sensitive error leakage', () => {
  const app = read('app.js');
  const html = read('index.html');

  assert.match(html, /id="teacherModeState"/);
  assert.match(app, /setTeacherModeState/);
  assert.match(app, /candidatePassword = els\.teacherPassword\.value\.trim\(\)/);
  assert.match(app, /state\.teacherAuthBusy = true/);
  assert.match(app, /state\.isTeacher = true/);
  assert.match(app, /state\.isTeacher = false/);
  assert.match(app, /老師模式驗證失敗，請再次確認後重試。/);
  assert.doesNotMatch(app, /setStatus\("error", error\.message \|\| "老師模式驗證失敗。"\)/);
});

test('leave letter flow prefers uploaded PDF unless user explicitly requests generation', () => {
  const app = read('app.js');
  const html = read('index.html');

  assert.match(html, /id="leavePdfInput"/);
  assert.match(html, /id="forceGenerateLetter"/);
  assert.match(html, /id="useUploadedPdfBtn"/);
  assert.match(html, /id="leaveLetterSource"/);

  assert.match(app, /uploadedPdf\s*&&\s*!shouldGenerateNewLetter/);
  assert.match(app, /明確觸發/);
});

test('mobile-first readability and layout guardrails are present', () => {
  const html = read('index.html');

  assert.match(html, /max-w-6xl/);
  assert.match(html, /overflow-x:\s*clip/);
  assert.match(html, /overflow-wrap:\s*break-word/);
  assert.match(html, /word-break:\s*normal/);
  assert.match(html, /-webkit-font-smoothing:\s*antialiased/);
  assert.match(html, /lg:max-w-\[30rem\]/);
  assert.match(html, /grid items-start gap-6/);
});

test('duty section keeps a wider horizontal layout while remaining responsive', () => {
  const html = read('index.html');

  assert.match(html, /mt-5 flex flex-wrap items-start gap-4 2xl:flex-nowrap/);
  assert.match(html, /id="dateDisplay" class="mt-3 whitespace-nowrap text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"/);
  assert.match(html, /id="dutyOverrideForm" class="theme-card accent-ring w-full flex-1 rounded-\[1\.5rem\] p-5 md:min-w-\[18rem\] xl:max-w-\[24rem\] 2xl:max-w-none"/);
  assert.match(html, /id="dutyCardGrid" class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3"/);
  assert.match(html, /橫向快速查看三個值日崗位與已套用偏移。/);
  assert.match(html, /會按螢幕闊度自動換行/);
});

test('header theme controls and mode card keep dark text on light surfaces', () => {
  const app = read('app.js');
  const html = read('index.html');

  assert.match(app, /button\.classList\.toggle\("text-slate-900", !isActive\)/);
  assert.doesNotMatch(app, /button\.classList\.toggle\("text-white", !isActive\)/);
  assert.match(app, /info:\s*"border-slate-200\/80 bg-white\/75 text-slate-700"/);
  assert.match(html, /text-xs font-bold uppercase tracking-\[0\.3em\] text-slate-600/);
  assert.match(html, /text-sm font-medium leading-6 text-slate-700/);
  assert.match(html, /id="teacherModeState"[\s\S]*text-slate-700/);
});

test('student and duty quick actions expose teacher-only controls with visible student numbers', () => {
  const app = read('app.js');

  assert.match(app, /學號 \${escapeHtml\(/);
  assert.match(app, /DEL \/ 刪除/);
  assert.match(app, /data-act="absent-minus"/);
  assert.match(app, /data-act="absent-plus"/);
  assert.match(app, /僅限老師模式調整缺席天數/);
  assert.match(app, /缺席統計已經是 0 天/);
  assert.match(app, /cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400/);
});

test('demo data provider preserves student numbers and persists absence and duty offset updates', async () => {
  global.window = {
    APP_CONFIG: {
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      CLASS_ID: '4C'
    },
    supabase: undefined,
    crypto: webcrypto,
    TextEncoder
  };

  try {
    const moduleUrl = `${pathToFileURL(join(root, 'supabase-data.js')).href}?t=${Date.now()}`;
    const { classDataApi } = await import(moduleUrl);

    const initialStudents = await classDataApi.listStudents();
    assert.equal(initialStudents.every((student) => Number(student.studentNumber) > 0), true);

    const addedStudent = await classDataApi.addStudent(99, '測試學生');
    assert.equal(addedStudent.studentNumber, 99);

    await classDataApi.updateStudentAbsentDays(addedStudent.id, -3);
    let students = await classDataApi.listStudents();
    assert.equal(students.find((student) => student.id === addedStudent.id)?.absentDays, 0);

    await classDataApi.updateStudentAbsentDays(addedStudent.id, 4);
    students = await classDataApi.listStudents();
    assert.equal(students.find((student) => student.id === addedStudent.id)?.absentDays, 4);

    await classDataApi.upsertDutyOverride('2026-09-05', '早會', 2);
    let offsets = await classDataApi.listDutyOverrides();
    const createdOffset = offsets.find((item) => item.date === '2026-09-05' && item.slot === '早會');
    assert.ok(createdOffset);
    assert.equal(createdOffset.offset, 2);

    await classDataApi.deleteDutyOverride(createdOffset.id);
    offsets = await classDataApi.listDutyOverrides();
    assert.equal(offsets.some((item) => item.date === '2026-09-05' && item.slot === '早會'), false);
  } finally {
    delete global.window;
  }
});

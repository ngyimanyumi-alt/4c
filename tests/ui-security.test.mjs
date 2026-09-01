import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
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
  const hash = '9f5ac80ca0db21415a13f4ed10675e919d3b86a13474444449bc7e84bdf20c09';

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
  assert.match(html, /overflow-wrap:\s*anywhere/);
  assert.match(html, /-webkit-font-smoothing:\s*antialiased/);
  assert.match(html, /lg:max-w-\[30rem\]/);
  assert.match(html, /grid items-start gap-6/);
});

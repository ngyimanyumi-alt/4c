import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

test('teacher auth flow uses hash verification and avoids password in provider info', () => {
  const dataModule = read('supabase-data.js');
  assert.match(dataModule, /TEACHER_PASSWORD_HASH/);
  assert.match(dataModule, /verifyTeacherPassword/);
  assert.doesNotMatch(dataModule, /teacherPassword\s*:/);
  assert.doesNotMatch(dataModule, /DEMO_TEACHER_PASSWORD/);
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
  assert.match(html, /overflow-wrap:\s*anywhere/);
  assert.match(html, /-webkit-font-smoothing:\s*antialiased/);
  assert.match(html, /w-full gap-3 sm:grid-cols-3 lg:max-w-\[28rem\]/);
});

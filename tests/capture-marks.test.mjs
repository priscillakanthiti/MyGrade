import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';

async function load(path, replacements = []) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of replacements) source = source.replace(from, to);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const { geminiMarkResult } = await load('../src/ocr/geminiResult.js');
globalThis.__localValidation = geminiMarkResult;
const { localMarkResult } = await load('../src/ocr/local.js', [
  ["import { NativeModules, Platform } from 'react-native';", "const NativeModules = {}, Platform = { OS: 'web' };"],
  ["import { geminiMarkResult } from './geminiResult';", 'const geminiMarkResult = globalThis.__localValidation;'],
]);
const { readPageBatch } = await load('../src/ocr/batch.js');
const { fitPhoto, moveCrop, photoCrop } = await load('../src/ocr/cropGeometry.js');
const { loadScriptAssignment, saveScriptTotal } = await load('../src/ocr/assignment.js');

test('crop coordinates follow the displayed portrait or rotated landscape image', () => {
  assert.deepEqual(fitPhoto(1200, 1600, 300, 500), { x: 0, y: 50, width: 300, height: 400 });
  assert.deepEqual(fitPhoto(1600, 1200, 300, 500), { x: 0, y: 137.5, width: 300, height: 225 });
  const rect = { x: .25, y: .25, width: .5, height: .5 };
  assert.deepEqual(photoCrop(rect, 1200, 1600), { originX: 300, originY: 400, width: 600, height: 800 });
  assert.deepEqual(photoCrop(rect, 1600, 1200), { originX: 400, originY: 300, width: 800, height: 600 });
  assert.deepEqual(moveCrop({ x: 0, y: 0, width: 1, height: 1 }, .2, .1, 'topLeft'),
    { x: .2, y: .1, width: .8, height: .9 });
  for (const handle of ['move', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']) {
    for (const [dx, dy] of [[-10, -10], [10, 10], [-10, 10]]) {
      const moved = moveCrop(rect, dx, dy, handle);
      assert.ok(moved.x >= 0 && moved.y >= 0 && moved.width > 0 && moved.height > 0);
      assert.ok(moved.x + moved.width <= 1 && moved.y + moved.height <= 1);
    }
  }
});

test('photo normalization never rotates implicitly; explicit rotation is saved before cropping', async () => {
  const calls = [];
  globalThis.__photoEdit = { manipulate: uri => {
    calls.push(['open', uri]);
    return { rotate: degrees => calls.push(['rotate', degrees]), crop: rect => calls.push(['crop', rect]),
      release: () => calls.push(['releaseContext']),
      renderAsync: async () => ({ width: 1600, height: 1200, release: () => calls.push(['releaseImage']),
        saveAsync: async () => ({ uri: 'normalized.jpg' }) }),
    };
  } };
  const { editMarkImage } = await load('../src/ocr/image.js', [
    ["import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';", "const ImageManipulator = globalThis.__photoEdit, SaveFormat = { JPEG: 'jpeg' };"],
    ["import { File } from 'expo-file-system';", 'const File = null;'],
    ["import { Platform } from 'react-native';", "const Platform = { OS: 'android' };"],
  ]);
  const normalized = await editMarkImage({ uri: 'camera.jpg' });
  assert.deepEqual(normalized, { uri: 'normalized.jpg', width: 1600, height: 1200 });
  assert.ok(!calls.some(([op]) => op === 'rotate' || op === 'crop'));
  calls.length = 0;
  const crop = { originX: 100, originY: 200, width: 600, height: 800 };
  await editMarkImage(normalized, { rotation: 90, crop });
  assert.deepEqual(calls.slice(0, 3), [['open', 'normalized.jpg'], ['rotate', 90], ['crop', crop]]);
  assert.deepEqual(calls.slice(-2), [['releaseImage'], ['releaseContext']]);
});

test('fast local reader preserves decimals, zero, fractions and labelled totals', () => {
  for (const [text, value] of [['.5', .5], ['0', 0], ['100', 100], ['7,5', 7.5], ['8 / 10', 8], ['Page total: 15', 15], ['TOTAL\n12', 12]]) {
    const result = localMarkResult(text, 100);
    assert.equal(result.ok, true, text);
    assert.equal(result.value, value, text);
    assert.equal(result.flagged, true, 'even local suggestions need teacher review');
  }
  for (const text of ['-5', '5 10', '8/0', '11/10', '101', '1O', '15A', 'Q1: 7', 'Answer 12', '', '7. 5']) {
    assert.equal(localMarkResult(text, 100).ok, false, text);
  }
});

test('batch overlaps two readers, preserves page identity and survives a failed page', async () => {
  let running = 0, peak = 0;
  const updates = [];
  await readPageBatch([{ id: 'slow' }, { id: 'fast' }, { id: 'failed' }, { id: 'last' }], async (page) => {
    running++; peak = Math.max(peak, running);
    await new Promise(resolve => setTimeout(resolve, page.id === 'slow' ? 30 : 1));
    running--;
    if (page.id === 'failed') throw Error('offline');
    return { marks: [{ value: page.id }] };
  }, (page, result, completed) => updates.push({ id: page.id, result, completed }));
  assert.equal(peak, 2);
  assert.equal(updates[0].id, 'fast');
  assert.deepEqual(updates.map(update => update.completed), [1, 2, 3, 4]);
  assert.deepEqual(updates.find(update => update.id === 'failed').result.marks, []);
  assert.equal(updates.find(update => update.id === 'slow').result.marks[0].value, 'slow');
});

test('leaving a capture session stops queued reads and discards late results', async () => {
  let active = true, calls = 0, updates = 0;
  await readPageBatch([1, 2, 3, 4], async () => { calls++; await Promise.resolve(); active = false; return { marks: [] }; }, () => updates++, () => active);
  assert.equal(calls, 2);
  assert.equal(updates, 0);
});

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`
    CREATE TABLE classes (id INTEGER PRIMARY KEY, teacher_id INTEGER, name TEXT);
    CREATE TABLE students (id INTEGER PRIMARY KEY, class_id INTEGER, name TEXT);
    CREATE TABLE subjects (id INTEGER PRIMARY KEY, class_id INTEGER, name TEXT, max_score INTEGER);
    CREATE TABLE terms (id INTEGER PRIMARY KEY, class_id INTEGER, is_current INTEGER);
    CREATE TABLE scores (student_id INTEGER, subject_id INTEGER, term_id INTEGER, score REAL, UNIQUE(student_id,subject_id,term_id));
    INSERT INTO classes VALUES (1,1,'Class A'),(2,2,'Class B');
    INSERT INTO students VALUES (1,1,'Alex'),(2,1,'Alex'),(3,2,'Other class');
    INSERT INTO subjects VALUES (1,1,'Maths',100),(2,2,'Maths',100);
    INSERT INTO terms VALUES (1,1,1),(2,2,1);
  `);
  return {
    sqlite,
    getFirstAsync: async (sql, ...args) => sqlite.prepare(sql).get(...args),
    runAsync: async (sql, ...args) => sqlite.prepare(sql).run(...args),
  };
}
const selected = { classId: 1, studentId: 2, subjectId: 1, teacherId: 1 };

test('saves to selected student ID even when two students share a name', async () => {
  const db = database();
  try {
    const assignment = await loadScriptAssignment(db, selected);
    await saveScriptTotal(db, assignment, 15.5);
    await saveScriptTotal(db, assignment, 16);
    assert.deepEqual(db.sqlite.prepare('SELECT * FROM scores').all().map(row => ({ ...row })), [
      { student_id: 2, subject_id: 1, term_id: 1, score: 16 },
    ]);
  } finally { db.sqlite.close(); }
});

test('rejects student, subject or class belonging to another class or teacher', async () => {
  const db = database();
  try {
    for (const wrong of [{ studentId: 3 }, { subjectId: 2 }, { teacherId: 2 }, { classId: 2 }, { studentId: NaN }]) {
      await assert.rejects(loadScriptAssignment(db, { ...selected, ...wrong }));
    }
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM scores').get().n, 0);
  } finally { db.sqlite.close(); }
});

test('atomic save refuses changed term, moved student, changed teacher and reduced score limit', async () => {
  for (const change of [
    'UPDATE terms SET is_current = 0 WHERE id = 1',
    'UPDATE students SET class_id = 2 WHERE id = 2',
    'UPDATE classes SET teacher_id = 2 WHERE id = 1',
    'UPDATE subjects SET class_id = 2 WHERE id = 1',
    'UPDATE subjects SET max_score = 10 WHERE id = 1',
  ]) {
    const db = database();
    try {
      const assignment = await loadScriptAssignment(db, selected);
      db.sqlite.exec(change);
      await assert.rejects(saveScriptTotal(db, assignment, 15));
      assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM scores').get().n, 0);
    } finally { db.sqlite.close(); }
  }
});

test('photographed marks use image recognition even when text OCR might report a different digit', async () => {
  let uploads = 0, encodes = 0, releases = 0;
  globalThis.__fastScanner = {
    read: async () => { throw Error('Plain text OCR must not bypass handwriting recognition'); },
    prepare: async asset => ({ uri: asset.uri, encode: async () => { encodes++; return 'small-jpeg'; }, release: () => releases++ }),
    cloud: async (image, options) => { uploads++; assert.equal(image, 'small-jpeg'); assert.equal(options.mimeType, 'image/jpeg'); return { mark: { status: 'read', value: 8, raw: '8' } }; },
    validate: geminiMarkResult,
  };
  const { readMarkPage } = await load('../src/ocr/scanner.js', [
    ["import * as ImagePicker from 'expo-image-picker';", 'const ImagePicker = {};'],
    ["import { readWithGemini } from './gemini';", 'const readWithGemini = globalThis.__fastScanner.cloud;'],
    ["import { geminiMarkResult } from './geminiResult';", 'const geminiMarkResult = globalThis.__fastScanner.validate;'],
    ["import { readOnDevice } from './local';", 'const readOnDevice = globalThis.__fastScanner.read;'],
    ["import { prepareMarkImage } from './image';", 'const prepareMarkImage = globalThis.__fastScanner.prepare;'],
  ]);
  const result = await readMarkPage({ uri: 'circled-on-lined-paper.jpg' }, 100);
  assert.equal(result.via, 'gemini');
  assert.equal(result.marks[0].value, 8);
  assert.equal(uploads, 1); assert.equal(encodes, 1); assert.equal(releases, 1);
});

test('image processing caps the long edge without upscaling and encodes only on demand', async () => {
  const resized = [], saves = [];
  let released = 0;
  globalThis.__imageTest = {
    manipulate: () => ({
      resize: size => resized.push(size), release: () => released++,
      renderAsync: async () => ({ release: () => released++, saveAsync: async options => { saves.push(options); return { uri: 'small.jpg', base64: options.base64 ? 'jpeg' : undefined }; } }),
    }),
  };
  const { prepareMarkImage } = await load('../src/ocr/image.js', [
    ["import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';", "const ImageManipulator = globalThis.__imageTest, SaveFormat = { JPEG: 'jpeg' };"],
    ["import { File } from 'expo-file-system';", "class File { constructor(uri) { assertUri(uri); } async base64() { return 'jpeg'; } } function assertUri(uri) { if (uri !== 'small.jpg') throw Error('Must encode resized image'); }"],
    ["import { Platform } from 'react-native';", "const Platform = { OS: 'android' };"],
  ]);
  const landscape = await prepareMarkImage({ uri: 'a.jpg', width: 4000, height: 3000 });
  assert.deepEqual(resized, [{ width: 1280 }]);
  assert.equal(saves[0].base64, undefined);
  assert.equal(await landscape.encode(), 'jpeg');
  assert.equal(saves.length, 1, 'native upload must reuse the JPEG instead of compressing twice');
  landscape.release();
  const portrait = await prepareMarkImage({ uri: 'b.jpg', width: 2000, height: 4000 }); portrait.release();
  const small = await prepareMarkImage({ uri: 'c.jpg', width: 300, height: 300 }); small.release();
  assert.deepEqual(resized, [{ width: 1280 }, { height: 1280 }]);
  assert.equal(released, 6);
});

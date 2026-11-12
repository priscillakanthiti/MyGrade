import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function load(path, replacements = []) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  if (path.endsWith('/scanner.js')) {
    replacements = [...replacements,
      ["import { readOnDevice } from './local';", 'const readOnDevice = async () => ({ ok: false });'],
      ["import { prepareMarkImage } from './image';", 'const prepareMarkImage = async (asset) => ({ uri: asset.uri, encode: async () => asset.base64, release() {} });'],
    ];
  }
  for (const [from, to] of replacements) source = source.replace(from, to);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const { readGeminiMark, validateMark, validateVisionMark } = await load('../supabase/functions/read-mark/gemini.js');
const { geminiMarkResult } = await load('../src/ocr/geminiResult.js');
const { createPictureSession } = await load('../src/ocr/session.js');
const params = { apiKey: 'test-key', model: 'test-model', image: 'base64-image', mimeType: 'image/png', maxScore: 100 };
const reply = (mark, finishReason = 'STOP') => ({ ok: true, json: async () => ({
  candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(mark) }] } }],
}) });

test('separate circled marks cannot be concatenated into a page total', () => {
  assert.deepEqual(validateVisionMark({ status: 'read', raw: '80', value: 80,
    regions: [{ raw: '8', value: 8 }, { raw: '0', value: 0 }] }, 100),
  { status: 'multiple', raw: '', value: null });
  assert.deepEqual(validateVisionMark({ status: 'read', raw: '80', value: 80,
    regions: [{ raw: '80', value: 80 }] }, 100), { status: 'read', raw: '80', value: 80 });
  assert.equal(validateVisionMark({ status: 'read', raw: '8', value: 8, regions: [] }, 100), null);
});

test('valid marks retain decimals, zero, 100 and fraction numerator', async () => {
  for (const [raw, value] of [['0', 0], ['.5', 0.5], ['7,5', 7.5], ['100', 100], ['8 / 10', 8]]) {
    const mark = { status: 'read', raw, value };
    const response = await readGeminiMark(params, async () => reply(mark));
    assert.deepEqual(response.mark, mark);
    assert.equal(geminiMarkResult(response.mark, 100).value, value);
    assert.equal(geminiMarkResult(response.mark, 100).flagged, true);
  }
});

test('rejects inconsistent transcription, signs, invalid types and score limits', () => {
  for (const [raw, value] of [['.5', 5], ['-5', 5], ['101', 101], ['8/0', 8], ['11/10', 11], ['12', '12'], ['12', NaN], ['12', Infinity]]) {
    const mark = { status: 'read', raw, value };
    assert.equal(validateMark(mark, 100), null);
    assert.equal(geminiMarkResult(mark, 100).ok, false);
  }
});

test('unclear, multiple and absent marks never produce a numeric suggestion', async () => {
  for (const status of ['unclear', 'multiple', 'no_mark']) {
    const result = await readGeminiMark(params, async () => reply({ status, raw: '', value: null }));
    assert.equal(geminiMarkResult(result.mark, 100).ok, false);
    assert.equal(validateMark({ status, raw: '', value: 10 }, 100), null);
  }
});

test('provider request includes image MIME, schema and secret header', async () => {
  await readGeminiMark(params, async (url, options) => {
    assert.ok(url.endsWith('/test-model:generateContent'));
    assert.ok(!url.includes(params.apiKey));
    assert.equal(options.headers['x-goog-api-key'], params.apiKey);
    const body = JSON.parse(options.body);
    assert.deepEqual(body.contents[0].parts[0].inlineData, { mimeType: 'image/png', data: params.image });
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    assert.ok(body.generationConfig.responseJsonSchema.required.includes('value'));
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'medium');
    assert.equal(body.generationConfig.maxOutputTokens, 2048);
    assert.ok(options.signal instanceof AbortSignal);
    return reply({ status: 'read', value: 12, raw: '12' });
  });
});

test('experimental region output is opt-in and retains the existing app response contract', async () => {
  const result = await readGeminiMark({ ...params, detectRegions: true }, async (url, options) => {
    assert.ok(JSON.parse(options.body).generationConfig.responseJsonSchema.required.includes('regions'));
    return reply({ status: 'read', raw: '80', value: 80, regions: [{ raw: '8', value: 8 }, { raw: '0', value: 0 }] });
  });
  assert.deepEqual(result.mark, { status: 'multiple', raw: '', value: null });
});

test('quota, network, malformed, blocked and truncated responses fail safely', async () => {
  const providers = [
    async () => ({ ok: false, status: 429 }),
    async () => { throw Error('offline'); },
    async () => ({ ok: true, json: async () => ({}) }),
    async () => reply({ status: 'read', value: 12, raw: '12' }, 'MAX_TOKENS'),
    async () => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{bad' }] } }] }) }),
  ];
  for (const provider of providers) assert.ok((await readGeminiMark(params, provider)).error);
});

test('unclear handwriting receives a stronger independent visual review', async () => {
  const calls = [];
  const result = await readGeminiMark(params, async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body });
    return calls.length === 1
      ? reply({ status: 'unclear', raw: '', value: null })
      : reply({ status: 'read', raw: '8', value: 8 });
  });
  assert.equal(result.mark.value, 8);
  assert.equal(calls.length, 2);
  assert.ok(calls[1].url.endsWith('/gemini-3.5-flash:generateContent'));
  assert.deepEqual(calls[1].body.contents[0].parts[0].inlineData, calls[0].body.contents[0].parts[0].inlineData);
  assert.equal(calls[1].body.generationConfig.thinkingConfig.thinkingLevel, 'medium');
  assert.equal(calls[1].body.generationConfig.maxOutputTokens, 3072);
});

test('handwriting review preserves uncertainty and cannot override validation', async () => {
  const unclear = { status: 'unclear', raw: '', value: null };
  for (const second of [
    async () => reply(unclear),
    async () => reply({ status: 'read', raw: '8', value: 80 }),
    async () => ({ ok: false, status: 403 }),
    async () => { throw Error('network unavailable'); },
  ]) {
    let calls = 0;
    const result = await readGeminiMark(params, async (...args) => ++calls === 1 ? reply(unclear) : second(...args));
    assert.deepEqual(result.mark, unclear);
    assert.equal(calls, 2);
  }
});

test('clear, absent and multiple marks do not trigger handwriting review', async () => {
  for (const mark of [
    { status: 'read', raw: '7.5', value: 7.5 },
    { status: 'multiple', raw: '', value: null },
    { status: 'no_mark', raw: '', value: null },
  ]) {
    let calls = 0;
    const result = await readGeminiMark(params, async () => { calls++; return reply(mark); });
    assert.equal(calls, 1);
    assert.deepEqual(result.mark, mark);
  }
});

async function cloudClient(mock) {
  globalThis.__markTestSupabase = mock;
  globalThis.__markTestCreateSession = createPictureSession;
  return load('../src/ocr/gemini.js', [
    ["import { pictureSupabase } from './supabase';", 'const pictureSupabase = globalThis.__markTestSupabase;'],
    ["import { createPictureSession } from './session';", 'const createPictureSession = globalThis.__markTestCreateSession;'],
  ]);
}

test('picture reader automatically authorizes without a backup login and explains failures', async () => {
  let called = false;
  let anonymousSignIns = 0;
  let session = null;
  const mock = {
    auth: {
      getSession: async () => ({ data: { session } }),
      signInAnonymously: async () => {
        anonymousSignIns++;
        session = { access_token: 'picture-reader-token' };
        return { data: { session } };
      },
    },
    functions: { invoke: async () => {
      called = true;
      return { data: { mark: { status: 'read', value: 12, raw: '12' } } };
    } },
  };
  const { readWithGemini } = await cloudClient(mock);
  assert.equal((await readWithGemini('image', params)).mark.value, 12);
  assert.equal(called, true);
  assert.equal(anonymousSignIns, 1);
  await readWithGemini('image', params);
  assert.equal(anonymousSignIns, 1);
  mock.functions.invoke = async (name, options) => {
    assert.equal(name, 'read-mark');
    assert.equal(options.body.maxScore, 100);
    assert.equal(options.body.mimeType, 'image/png');
    return { error: { context: new Response(JSON.stringify({ error: 'not_configured' })) } };
  };
  assert.match((await readWithGemini('image', params)).message, /not been set up/);
  mock.functions.invoke = async () => ({ data: { words: [] } });
  assert.equal((await readWithGemini('image', params)).unavailable, true);

  session = null;
  called = false;
  mock.auth.signInAnonymously = async () => ({ error: { code: 'anonymous_provider_disabled' } });
  mock.functions.invoke = async () => { called = true; };
  assert.match((await readWithGemini('image', params)).message, /not been set up/);
  assert.equal(called, false);
  mock.auth.signInAnonymously = async () => { throw new Error('Network request failed'); };
  assert.match((await readWithGemini('image', params)).message, /internet/);
});

test('concurrent first scans share one anonymous session and retry after failure', async () => {
  let calls = 0;
  let fail = true;
  let session = null;
  const ensure = createPictureSession({ auth: {
    getSession: async () => ({ data: { session } }),
    signInAnonymously: async () => {
      calls++;
      if (fail) return { error: new Error('offline') };
      session = { access_token: 'device-token' };
      return { data: { session } };
    },
  } });
  const failed = await Promise.allSettled([ensure(), ensure()]);
  assert.ok(failed.every((result) => result.status === 'rejected'));
  assert.equal(calls, 1);
  fail = false;
  const sessions = await Promise.all([ensure(), ensure()]);
  assert.equal(calls, 2);
  assert.equal(sessions[0], sessions[1]);
  await ensure();
  assert.equal(calls, 2);
});

test('picture auth uses a separate persistent storage key from backup auth', async () => {
  const options = [];
  globalThis.__pictureCreateClient = (url, key, config) => { options.push(config); return {}; };
  const substitutions = [
    ["import 'react-native-url-polyfill/auto';", ''],
    ["import AsyncStorage from '@react-native-async-storage/async-storage';", 'const AsyncStorage = {};'],
    ["import { createClient } from '@supabase/supabase-js';", 'const createClient = globalThis.__pictureCreateClient;'],
  ];
  const config = "const SUPABASE_URL = 'https://test.supabase.co', SUPABASE_ANON_KEY = 'public'; const isConfigured = () => true;";
  await load('../src/ocr/supabase.js', [...substitutions, ["import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from '../cloud/config';", config]]);
  await load('../src/cloud/supabase.js', [...substitutions, ["import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config';", config]]);
  assert.equal(options[0].auth.storageKey, 'mygrade-picture-reader-auth');
  assert.notEqual(options[0].auth.storageKey, options[1].auth.storageKey);
  assert.equal(options[0].auth.persistSession, true);
});

test('scanner retains photo for manual entry, handles cancellation, and returns a suggestion', async () => {
  const imagePicker = {
    requestCameraPermissionsAsync: async () => ({ granted: true }),
    launchCameraAsync: async () => ({ assets: [{ uri: 'photo.jpg', base64: 'image', mimeType: 'image/jpeg' }] }),
    launchImageLibraryAsync: async () => ({ canceled: true }),
  };
  let response = { unavailable: true, message: 'Picture reader unavailable.' };
  globalThis.__markScannerTest = { imagePicker, read: async () => response, geminiMarkResult };
  const { scanMarks } = await load('../src/ocr/scanner.js', [
    ["import * as ImagePicker from 'expo-image-picker';", 'const ImagePicker = globalThis.__markScannerTest.imagePicker;'],
    ["import { readWithGemini } from './gemini';", 'const readWithGemini = globalThis.__markScannerTest.read;'],
    ["import { geminiMarkResult } from './geminiResult';", 'const geminiMarkResult = globalThis.__markScannerTest.geminiMarkResult;'],
  ]);
  const manual = await scanMarks({ source: 'camera', maxScore: 100 });
  assert.equal(manual.uri, 'photo.jpg');
  assert.deepEqual(manual.marks, []);
  assert.equal(manual.scannerNote, 'Picture reader unavailable.');
  assert.deepEqual(await scanMarks({ source: 'library', maxScore: 100 }), { cancelled: true });
  response = { mark: { status: 'read', raw: '.5', value: 0.5 } };
  assert.equal((await scanMarks({ source: 'camera', maxScore: 100 })).marks[0].value, 0.5);
  response = { mark: { status: 'multiple', raw: '', value: null } };
  assert.equal((await scanMarks({ source: 'camera', maxScore: 100 })).problem.code, 'multiple');
});

test('collects multiple page photos before reading and totals their marks exactly', async () => {
  let captures = 0;
  let reads = 0;
  globalThis.__multiPageScannerTest = {
    picker: {
      requestCameraPermissionsAsync: async () => ({ granted: true }),
      launchCameraAsync: async (options) => {
        assert.equal(options.base64, false, 'queued photos should not retain upload data');
        captures++;
        return { assets: [{ uri: `page-${captures}.jpg`, base64: `page-${captures}` }] };
      },
    },
    read: async (image) => {
      reads++;
      const value = { 'page-1': 8, 'page-2': 7.5, 'page-3': 0 }[image];
      return { mark: { status: 'read', value, raw: String(value) } };
    },
    geminiMarkResult,
  };
  const { captureMarkPage, readMarkPage } = await load('../src/ocr/scanner.js', [
    ["import * as ImagePicker from 'expo-image-picker';", 'const ImagePicker = globalThis.__multiPageScannerTest.picker;'],
    ["import { readWithGemini } from './gemini';", 'const readWithGemini = globalThis.__multiPageScannerTest.read;'],
    ["import { geminiMarkResult } from './geminiResult';", 'const geminiMarkResult = globalThis.__multiPageScannerTest.geminiMarkResult;'],
  ]);
  const pages = [];
  for (let i = 0; i < 3; i++) pages.push((await captureMarkPage('camera')).asset);
  assert.equal(reads, 0, 'taking page photos must not wait on picture reading');
  assert.deepEqual(pages.map((page) => page.uri), ['page-1.jpg', 'page-2.jpg', 'page-3.jpg']);
  const results = [];
  for (const page of pages) results.push(await readMarkPage(page, 100));
  const { sumMarks } = await load('../src/ocr/parseMarks.js');
  assert.equal(sumMarks(results.map((page) => page.marks[0].value)), 15.5);
  assert.equal(reads, 3);
});

test('one failed page retains its photo and does not stop reading later pages', async () => {
  globalThis.__batchFailureScannerTest = {
    read: async (image) => {
      if (image === 'bad') throw new Error('Network request failed');
      return { mark: { status: 'read', value: 12, raw: '12' } };
    },
    geminiMarkResult,
  };
  const { readMarkPage } = await load('../src/ocr/scanner.js', [
    ["import * as ImagePicker from 'expo-image-picker';", 'const ImagePicker = {};'],
    ["import { readWithGemini } from './gemini';", 'const readWithGemini = globalThis.__batchFailureScannerTest.read;'],
    ["import { geminiMarkResult } from './geminiResult';", 'const geminiMarkResult = globalThis.__batchFailureScannerTest.geminiMarkResult;'],
  ]);
  const failed = await readMarkPage({ uri: 'failed.jpg', base64: 'bad' }, 100);
  assert.equal(failed.uri, 'failed.jpg');
  assert.deepEqual(failed.marks, []);
  assert.match(failed.scannerNote, /Type its mark/);
  const next = await readMarkPage({ uri: 'next.jpg', base64: 'good' }, 100);
  assert.equal(next.marks[0].value, 12);
});

test('provider failures distinguish setup errors without exposing upstream messages or credentials', async () => {
  for (const [status, reason, expected] of [
    [400, 'API_KEY_INVALID', 'reader_key_invalid'],
    [403, 'SERVICE_DISABLED', 'reader_api_disabled'],
    [403, 'API_KEY_SERVICE_BLOCKED', 'reader_key_restricted'],
    [403, 'BILLING_DISABLED', 'reader_billing_required'],
    [404, null, 'reader_model_unavailable'],
    [400, null, 'reader_request_invalid'],
    [403, null, 'reader_access_denied'],
    [429, null, 'rate_limited'],
    [503, 'UNKNOWN_REASON_WITH_SECRET', 'reader_unavailable'],
  ]) {
    const result = await readGeminiMark(params, async () => ({ ok: false, status, json: async () => ({
      error: { message: 'private-key-and-project-details', details: reason ? [{ reason }] : [] },
    }) }));
    assert.equal(result.error, expected);
    assert.equal(result.providerStatus, status);
    assert.equal(result.status, status === 429 ? 429 : 502);
    assert.ok(!JSON.stringify(result).includes('private-key'));
    assert.ok(!JSON.stringify(result).includes('UNKNOWN_REASON_WITH_SECRET'));
  }
});

test('retries a temporary provider outage once and returns the real mark', async () => {
  let calls = 0;
  const result = await readGeminiMark(params, async () => {
    calls++;
    return calls === 1 ? { ok: false, status: 503 } : reply({ status: 'read', raw: '7.5', value: 7.5 });
  });
  assert.equal(calls, 2);
  assert.equal(result.mark.value, 7.5);
});

test('quota diagnostics expose only the time window and retry duration', async () => {
  const result = await readGeminiMark(params, async () => ({ ok: false, status: 429, json: async () => ({ error: {
    message: 'private project and key', details: [
      { violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaDimensions: { project: 'private-project' } }] },
      { retryDelay: '32.7s' },
    ],
  } }) }));
  assert.equal(result.rateLimitWindow, 'day');
  assert.equal(result.retryAfterSeconds, 33);
  assert.ok(!JSON.stringify(result).includes('private'));
});

test('a stalled provider request is aborted and retried within the scan deadline', async () => {
  let calls = 0;
  const result = await readGeminiMark({ ...params, requestTimeoutMs: 5 }, async (url, options) => {
    if (++calls === 1) return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('timed out', 'AbortError')), { once: true });
    });
    return reply({ status: 'read', raw: '.5', value: .5 });
  });
  assert.equal(calls, 2);
  assert.equal(result.mark.value, .5);
});

test('the total scan deadline stops a stalled request without starting another retry', async () => {
  let calls = 0;
  const result = await readGeminiMark({ ...params, totalTimeoutMs: 10, requestTimeoutMs: 1000 }, async (url, options) => {
    calls++;
    return new Promise((resolve, reject) => options.signal.addEventListener('abort',
      () => reject(new DOMException('deadline', 'AbortError')), { once: true }));
  });
  assert.equal(calls, 1);
  assert.equal(result.error, 'reader_timeout');
});

test('retries are bounded and never repeat permanent errors or quota failures', async () => {
  for (const status of [400, 401, 403, 404, 429, 503]) {
    let calls = 0;
    const result = await readGeminiMark(params, async () => { calls++; return { ok: false, status }; });
    assert.equal(calls, status === 503 ? 2 : 1);
    assert.ok(result.error);
  }
});

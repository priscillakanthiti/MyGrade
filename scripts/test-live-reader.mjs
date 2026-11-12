// Explicit live smoke test: creates a temporary anonymous session and makes five
// Gemini requests using synthetic images. Never sends student data or saves scores.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

async function loadSource(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadSource('../src/cloud/config.js');
const { sumMarks } = await loadSource('../src/ocr/parseMarks.js');
const endpoint = `${SUPABASE_URL}/functions/v1/read-mark`;
const paperMode = process.argv.includes('--paper');
const paced = process.argv.includes('--paced');
const only = process.argv.find(value => value.startsWith('--case='))?.slice(7);
let failures = 0;
const readingDurations = [];
async function check(label, options, expectedStatus, validate = () => {}) {
  const start = performance.now();
  let result;
  try {
    const response = await fetch(endpoint, { ...options, signal: AbortSignal.timeout(65000) });
    const text = await response.text();
    let body = text;
    try { body = JSON.parse(text); } catch { /* preflight has no body */ }
    result = { status: response.status, body };
    assert.equal(response.status, expectedStatus);
    validate(body);
    if (body?.mark) readingDurations.push(Math.round(performance.now() - start));
    console.log(JSON.stringify({ label, passed: true, ...result, durationMs: Math.round(performance.now() - start) }));
    return body;
  } catch (error) {
    failures++;
    console.log(JSON.stringify({ label, passed: false, ...result, durationMs: Math.round(performance.now() - start), message: error.message }));
    return null;
  }
}

await check('CORS preflight', { method: 'OPTIONS' }, 200);
await check('Missing authentication rejected', { method: 'POST' }, 401);
await check('Unsupported method rejected', { method: 'GET' }, 405);

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const { data, error } = await client.auth.signInAnonymously();
if (error || !data.session) {
  console.error(JSON.stringify({ label: 'Anonymous authentication', passed: false, code: error?.code, message: error?.message }));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ label: 'Anonymous authentication', passed: true }));
  try {
    const headers = { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY };
    const post = (payload) => ({ method: 'POST', headers, body: JSON.stringify(payload) });
    const fixture = async (name) => (await readFile(new URL(`../tests/fixtures/marks/${name}.png`, import.meta.url))).toString('base64');
    await check('Invalid image rejected', post({ image: 'invalid', mimeType: 'image/png', maxScore: 100 }), 400);
    await check('Unsupported image type rejected', post({ image: await fixture('decimal'), mimeType: 'text/plain', maxScore: 100 }), 400);
    const values = [];
    const allExamples = paperMode
      ? [['circled-eight-lined', 8], ['circled-eight-lined-rotated', 8], ['circled-zero-lined', 0], ['circled-decimal-lined', 7.5]]
      : [['decimal', 7.5], ['zero', 0], ['leading-decimal', .5], ['fraction', 8]];
    const examples = only ? allExamples.filter(([name]) => name === only) : allExamples;
    assert.ok(examples.length, 'Unknown test case');
    for (const [name, expected] of examples) {
      if (paced) await new Promise(resolve => setTimeout(resolve, 15000));
      const result = await check(`Read ${name}: ${expected}`, post({ image: await fixture(name), mimeType: 'image/png', maxScore: 100 }), 200, (body) => {
        assert.equal(body?.mark?.status, 'read');
        assert.equal(body.mark.value, expected);
      });
      if (result?.mark?.status === 'read') values.push(result.mark.value);
    }
    if (!only && paced) await new Promise(resolve => setTimeout(resolve, 15000));
    if (!only) await check('Multiple marks require manual review', post({ image: await fixture(paperMode ? 'circled-multiple-lined' : 'multiple'), mimeType: 'image/png', maxScore: 100 }), 200, (body) => {
      assert.equal(body?.mark?.status, 'multiple');
      assert.equal(body.mark.value, null);
    });
    if (!only && paced) await new Promise(resolve => setTimeout(resolve, 15000));
    if (paperMode && !only) await check('Paper lines alone are not marks', post({ image: await fixture('lined-no-mark'), mimeType: 'image/png', maxScore: 100 }), 200, (body) => {
      assert.equal(body?.mark?.status, 'no_mark');
      assert.equal(body.mark.value, null);
    });
    const expectedTotal = sumMarks(examples.map(([, value]) => value));
    if (values.length === examples.length && sumMarks(values) === expectedTotal) {
      console.log(JSON.stringify({ label: 'Combined page total', passed: true, total: expectedTotal }));
    } else {
      failures++;
      console.log(JSON.stringify({ label: 'Combined page total', passed: false, values }));
    }
  } finally {
    await client.auth.signOut();
  }
  console.log(JSON.stringify({ failures }));
  if (readingDurations.length) {
    const sorted = [...readingDurations].sort((a, b) => a - b);
    console.log(JSON.stringify({ label: 'Successful read latency', samples: sorted.length,
      medianMs: sorted[Math.floor(sorted.length / 2)], minMs: sorted[0], maxMs: sorted.at(-1) }));
  }
  if (failures) process.exitCode = 1;
}

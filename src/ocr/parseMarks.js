
const LOOKALIKE = {
  O: '0', o: '0', Q: '0',
  I: '1', l: '1', i: '1', '|': '1',
  Z: '2', z: '2',
  S: '5', s: '5',
  G: '6',
  B: '8',
  g: '9', q: '9',
};

// Normalises one OCR token. Returns { value, flagged } or null if it is not a mark.
export function normaliseToken(raw, maxScore) {
  let s = String(raw || '').trim();
  if (!s) return null;
  let flagged = false;

  // "8/10" means 8 out of 10: keep the 8 but ask the teacher to check it.
  if (/^[^/\s]+\/[^/\s]+$/.test(s)) {
    s = s.split('/')[0];
    flagged = true;
  }

  // Remove surrounding brackets, circles, colons, equals signs etc.
  s = s.replace(/^[^0-9A-Za-z|]+/, '').replace(/[^0-9A-Za-z|]+$/, '');
  if (!s) return null;

  // Only try to repair tokens that already contain a real digit, so ordinary
  // words ("IS", "SO", "BIG") are never turned into numbers.
  if (/[A-Za-z|]/.test(s)) {
    if (!/[0-9]/.test(s)) return null;
    const fixed = s.split('').map((ch) => (LOOKALIKE[ch] !== undefined ? LOOKALIKE[ch] : ch)).join('');
    if (fixed !== s) flagged = true;
    s = fixed;
  }

  s = s.replace(',', '.');
  if (!/^\d{1,3}(\.\d)?$/.test(s)) return null;

  const value = parseFloat(s);
  if (isNaN(value) || value < 0) return null;
  if (typeof maxScore === 'number' && value > maxScore) return null;
  // Half marks (7.5) are normal. Other decimals are suspicious.
  if (value % 1 !== 0 && value % 1 !== 0.5) flagged = true;
  return { value, flagged };
}

function topOf(frame) {
  return frame && typeof frame.top === 'number' ? frame.top : null;
}
function leftOf(frame) {
  return frame && typeof frame.left === 'number' ? frame.left : 0;
}

// Collects words (with positions) from an OCR result.
function collectTokens(ocr) {
  const tokens = [];
  const blocks = (ocr && ocr.blocks) || [];
  for (const b of blocks) {
    for (const line of b.lines || []) {
      if (line.elements && line.elements.length) {
        for (const el of line.elements) tokens.push({ text: el.text, frame: el.frame || line.frame });
      } else {
        for (const w of String(line.text || '').split(/\s+/)) tokens.push({ text: w, frame: line.frame });
      }
    }
  }
  // Some results only carry plain text
  if (tokens.length === 0 && ocr && ocr.text) {
    for (const w of String(ocr.text).split(/\s+/)) tokens.push({ text: w, frame: null });
  }
  return tokens;
}

// Main entry: returns { marks: [{ id, value, flagged, raw }], ignored }
export function extractMarks(ocr, { maxScore } = {}) {
  const tokens = collectTokens(ocr);

  // Reading order: top to bottom, then left to right (only if positions exist)
  const allHavePositions = tokens.length > 0 && tokens.every((t) => topOf(t.frame) !== null);
  if (allHavePositions) {
    tokens.sort((a, b) => topOf(a.frame) - topOf(b.frame) || leftOf(a.frame) - leftOf(b.frame));
  }

  const marks = [];
  let ignored = 0;
  tokens.forEach((t) => {
    const n = normaliseToken(t.text, maxScore);
    if (n) {
      marks.push({ id: `ocr-${marks.length}`, value: n.value, flagged: n.flagged, raw: t.text });
    } else if (String(t.text || '').trim()) {
      ignored += 1;
    }
  });
  return { marks, ignored };
}

// Adds numbers exactly (no 0.1 + 0.2 style rounding errors).
export function sumMarks(values) {
  const total = values.reduce((a, b) => a + Math.round(b * 100), 0);
  return total / 100;
}

// Reads ONE page mark from the words found in a photo.
// Works with words from Google Cloud Vision or from the on-phone reader (ML Kit).
//
//   readMark(words, { maxScore })
//     words: [{ text: '12', confidence: 0.93 }]   (confidence is optional, 0 to 1)
//     returns { ok: true, value, flagged, raw, note }
//          or { ok: false, code, message }       <- message is shown to the teacher

export const MIN_MARK = 0;   // a page can score zero. Change to 1 if you never want 0.
export const MAX_MARK = 99;  // a page mark is at most 2 digits
const LOW_CONFIDENCE = 0.6;  // below this, the teacher is asked to check the mark

export const PROBLEM = {
  NO_TEXT: 'NO_TEXT',
  NO_NUMBER: 'NO_NUMBER',
  LETTERS_ONLY: 'LETTERS_ONLY',
  TOO_MANY_DIGITS: 'TOO_MANY_DIGITS',
  MULTIPLE_NUMBERS: 'MULTIPLE_NUMBERS',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
};

// Characters that readers often mix up with digits
const LOOKALIKE = {
  O: '0', o: '0', Q: '0',
  I: '1', l: '1', i: '1', '|': '1',
  Z: '2', z: '2',
  S: '5', s: '5',
  G: '6',
  B: '8',
  g: '9', q: '9',
};

function fail(code, message) {
  return { ok: false, code, message };
}

function listOf(items, max = 5) {
  const shown = items.slice(0, max).join(', ');
  return items.length > max ? `${shown} ...` : shown;
}

// Decides what one OCR word is: a number, letters, or noise.
function classify(word) {
  const raw = String((word && word.text) || '').trim();
  if (!raw) return null;
  const confidence = word && typeof word.confidence === 'number' ? word.confidence : null;
  const reasons = [];

  let s = raw;

  // "8/10" means 8 out of 10: keep the 8 but ask the teacher to check it.
  const frac = s.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (frac) {
    s = frac[1];
    reasons.push(`the "/${frac[2]}" part was ignored`);
  }

  // A minus sign is dropped below, so mention it
  if (/^[-\u2013\u2014]\s*\d/.test(s)) reasons.push('a minus sign was ignored');

  // Remove brackets, circles, colons, equals signs etc. from both ends
  s = s.replace(/^[^0-9A-Za-z|]+/, '').replace(/[^0-9A-Za-z|]+$/, '');
  if (!s) return { kind: 'noise', raw };

  const hasDigit = /[0-9]/.test(s);
  const hasLetter = /[A-Za-z|]/.test(s);

  // No digit at all: it is a word / letters, never turned into a number
  if (!hasDigit) return hasLetter ? { kind: 'letters', raw, text: s } : { kind: 'noise', raw };

  let text = s;
  if (hasLetter) {
    // First try: every letter is a digit lookalike ("l0" -> "10")
    const repaired = s.split('').map((ch) => (LOOKALIKE[ch] !== undefined ? LOOKALIKE[ch] : ch)).join('');
    if (/^[0-9]+([.,][0-9])?$/.test(repaired)) {
      text = repaired;
      reasons.push(`"${s}" was read as ${repaired}`);
    } else {
      // Second try: one clear number with letters stuck to it ("15A" -> 15)
      const runs = s.match(/[0-9]+([.,][0-9])?/g) || [];
      if (runs.length !== 1) return { kind: 'noise', raw };
      text = runs[0];
      reasons.push(`the letters in "${s}" were ignored`);
    }
  }

  text = text.replace(',', '.');
  const m = text.match(/^(\d+)(?:\.(\d))?$/);
  if (!m) return { kind: 'noise', raw };

  const intPart = m[1];
  if (intPart.length > 1 && intPart[0] === '0') reasons.push('it starts with a zero');

  const value = parseFloat(text);
  // Half marks (7.5) are normal. Other decimals are suspicious.
  if (value % 1 !== 0 && value % 1 !== 0.5) reasons.push('the decimal looks unusual');
  if (confidence !== null && confidence < LOW_CONFIDENCE) reasons.push('the reader was not very sure');

  return { kind: 'number', raw, text, digits: intPart.length, value, reasons };
}

export function readMark(words, { maxScore } = {}) {
  const items = (words || []).map(classify).filter(Boolean);

  if (items.length === 0) {
    return fail(
      PROBLEM.NO_TEXT,
      'No writing was found in the photo. Make sure the mark is inside the picture, the page is well lit and the camera is in focus, then try again.'
    );
  }

  const numbers = items.filter((i) => i.kind === 'number');
  const letters = items.filter((i) => i.kind === 'letters');

  if (numbers.length === 0) {
    if (letters.length > 3) {
      // Lots of words: this is the student's writing, so do not list it
      return fail(
        PROBLEM.NO_NUMBER,
        'The photo shows writing but no page mark could be found. The mark may be too faint, or hidden under other writing. Crop closer to the mark, or type it in the box.'
      );
    }
    if (letters.length > 0) {
      return fail(
        PROBLEM.LETTERS_ONLY,
        `Only letters were found (${listOf(letters.map((l) => l.text), 3)}) and no number. If the mark is written in letters, type it in the box.`
      );
    }
    return fail(
      PROBLEM.NO_NUMBER,
      'Writing was found, but no number could be made out. Crop so the page mark fills the picture, or type it in the box.'
    );
  }

  if (numbers.length > 1) {
    return fail(
      PROBLEM.MULTIPLE_NUMBERS,
      `More than one number was found (${listOf(numbers.map((n) => n.text))}). The photo should show only one page mark. Crop closer to the mark and try again.`
    );
  }

  const n = numbers[0];

  if (n.digits > 2) {
    return fail(
      PROBLEM.TOO_MANY_DIGITS,
      `The photo shows "${n.text}", which has ${n.digits} digits. A page mark has 1 or 2 digits (up to ${MAX_MARK}). The crop probably includes other writing, or the digits are running together. Crop closer to the mark and try again.`
    );
  }

  if (typeof maxScore === 'number' && n.value > maxScore) {
    return fail(
      PROBLEM.OUT_OF_RANGE,
      `The photo shows ${n.text}, but a page mark for this subject cannot be more than ${maxScore}. Check the photo, or type the correct mark.`
    );
  }
  if (n.value > MAX_MARK || n.value < MIN_MARK) {
    return fail(
      PROBLEM.OUT_OF_RANGE,
      `The photo shows ${n.text}, but a page mark must be from ${MIN_MARK} to ${MAX_MARK}. Check the photo, or type the correct mark.`
    );
  }

  const flagged = n.reasons.length > 0;
  const note = flagged
    ? `Read ${n.value} (${n.reasons.join('; ')}). Please check it against the photo.`
    : '';
  return { ok: true, value: n.value, flagged, raw: n.raw, note };
}

// Turns an ML Kit result (blocks > lines > elements) into a plain word list.
export function wordsFromMlKit(ocr) {
  const words = [];
  for (const b of (ocr && ocr.blocks) || []) {
    for (const line of b.lines || []) {
      if (line.elements && line.elements.length) {
        for (const el of line.elements) words.push({ text: el.text });
      } else {
        for (const w of String(line.text || '').split(/\s+/)) words.push({ text: w });
      }
    }
  }
  if (words.length === 0 && ocr && ocr.text) {
    for (const w of String(ocr.text).split(/\s+/)) words.push({ text: w });
  }
  return words;
}

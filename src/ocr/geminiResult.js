// Validate again before any model-proposed value enters the form.
export function geminiMarkResult(mark, maxScore) {
  const problems = {
    unclear: 'The mark is unclear. Take a sharper photo or type the mark shown.',
    multiple: 'Several marks were found. Crop around one awarded mark, then try again.',
    no_mark: 'No awarded mark was found. Crop closer to the teacher’s mark or type it below.',
  };
  if (mark && problems[mark.status]) return { ok: false, code: mark.status, message: problems[mark.status] };
  const raw = typeof mark?.raw === 'string' ? mark.raw.trim().replace(',', '.') : '';
  const match = raw.match(/^(\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*(\d+(?:\.\d+)?|\.\d+))?$/);
  if (mark?.status !== 'read' || typeof mark.value !== 'number' || !Number.isFinite(mark.value) ||
      !Number.isFinite(maxScore) || maxScore <= 0 || mark.value < 0 || mark.value > maxScore ||
      !match || Number(match[1]) !== mark.value ||
      (match[2] && (Number(match[2]) <= 0 || mark.value > Number(match[2])))) {
    return { ok: false, code: 'invalid', message: 'The mark could not be read reliably. Check the photo and type the correct mark.' };
  }
  return { ok: true, value: mark.value, raw: mark.raw, flagged: true,
    note: 'Check the suggested mark against the photo before confirming. Picture reading can make mistakes.' };
}

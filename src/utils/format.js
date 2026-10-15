// Short badge text for a class, e.g. "Standard 5A" -> "S5A"
export function badgeText(name) {
  const w = name.trim().split(/\s+/);
  const s = (w[0] ? w[0][0] : '') + w.slice(1).join('');
  return s.toUpperCase().slice(0, 4) || 'C';
}

export function resultStatus(row) {
  if (row.missing > 0) return 'Incomplete';
  return row.passed ? 'Pass' : 'Fail';
}
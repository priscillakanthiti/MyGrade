export const GRADE_SCALE = [
  { value: 4, label: 'Excellent', range: '80-100%' },
  { value: 3, label: 'Good', range: '60-79%' },
  { value: 2, label: 'Average', range: '40-59%' },
  { value: 1, label: 'Need support', range: '0-39%' },
];

export function gradeFromPercentage(pct) {
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  if (pct >= 40) return 2;
  return 1;
}

// Grade of one subject mark (null if no mark has been entered)
export function gradeForMark(mark, max) {
  if (mark === null || mark === undefined || !max) return null;
  return gradeFromPercentage((mark / max) * 100);
}

export function gradeLabel(value) {
  const g = GRADE_SCALE.find((x) => x.value === value);
  return g ? g.label : '';
}
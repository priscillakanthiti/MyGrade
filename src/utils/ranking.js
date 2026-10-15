// Total = all marks added together.
// Maximum = number of subjects x their total marks (e.g. 9 x 100 = 900).
// Pass mark = half of the maximum. A total below half is a fail.
export function computeResults(students, subjects, scores) {
  const lookup = new Map();
  scores.forEach((s) => {
    if (s.score !== null) lookup.set(`${s.student_id}-${s.subject_id}`, s.score);
  });

  const maxTotal = subjects.reduce((sum, s) => sum + s.max_score, 0);
  const passMark = maxTotal / 2;

  const rows = students.map((st) => {
    const marks = subjects.map((sub) => {
      const v = lookup.get(`${st.id}-${sub.id}`);
      return v === undefined ? null : v;
    });
    const total = marks.reduce((sum, m) => sum + (m === null ? 0 : m), 0);
    return {
      studentId: st.id,
      name: st.name,
      gender: st.gender,
      marks,
      total,
      percentage: maxTotal > 0 ? (total / maxTotal) * 100 : 0,
      missing: marks.filter((m) => m === null).length,
      passed: total >= passMark,
      rank: 0,
    };
  });

  // Highest total first; same total -> alphabetical so the order is stable
  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  // Tied totals share a position: 1, 2, 2, 4
  rows.forEach((r, i) => {
    r.rank = i > 0 && r.total === rows[i - 1].total ? rows[i - 1].rank : i + 1;
  });

  return { rows, maxTotal, passMark };
}
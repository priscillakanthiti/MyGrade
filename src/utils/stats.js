import { computeResults } from './ranking';

// Percentage based only on the marks that have been entered
// (so a student with 2 of 5 subjects entered is not punished for the 3 missing).
export function enteredPercentage(row, subjects) {
  let got = 0;
  let max = 0;
  row.marks.forEach((m, i) => {
    if (m !== null && subjects[i]) {
      got += m;
      max += subjects[i].max_score;
    }
  });
  return max > 0 ? (got / max) * 100 : null;
}

function mean(list) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
}

// Overall figures for the whole class
export function overview(rows, subjects) {
  const pcts = rows.map((r) => enteredPercentage(r, subjects)).filter((p) => p !== null);
  const complete = rows.filter((r) => r.missing === 0);
  const passed = complete.filter((r) => r.passed).length;
  return {
    students: rows.length,
    average: mean(pcts),
    passRate: complete.length ? (passed / complete.length) * 100 : null,
    completeCount: complete.length,
  };
}

// Boys and girls compared
export function genderStats(rows, subjects) {
  function make(g) {
    const list = rows.filter((r) => r.gender === g);
    const pcts = list.map((r) => enteredPercentage(r, subjects)).filter((p) => p !== null);
    const complete = list.filter((r) => r.missing === 0);
    const passed = complete.filter((r) => r.passed).length;
    return {
      count: list.length,
      average: mean(pcts),
      passRate: complete.length ? (passed / complete.length) * 100 : null,
    };
  }
  return { M: make('M'), F: make('F') };
}

// Highest, lowest and average mark for every subject
export function subjectStats(rows, subjects) {
  return subjects.map((s, j) => {
    const entries = rows
      .filter((r) => r.marks[j] !== null)
      .map((r) => ({ name: r.name, gender: r.gender, mark: r.marks[j] }));

    if (entries.length === 0) {
      return { subject: s, entered: 0 };
    }

    const marks = entries.map((e) => e.mark);
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    const average = mean(marks);
    const pctFor = (list) => {
      const m = mean(list.map((e) => e.mark));
      return m === null ? null : (m / s.max_score) * 100;
    };

    return {
      subject: s,
      entered: entries.length,
      average,
      averagePct: (average / s.max_score) * 100,
      highest,
      highestNames: entries.filter((e) => e.mark === highest).map((e) => e.name),
      lowest,
      lowestNames: entries.filter((e) => e.mark === lowest).map((e) => e.name),
      boysPct: pctFor(entries.filter((e) => e.gender === 'M')),
      girlsPct: pctFor(entries.filter((e) => e.gender === 'F')),
    };
  });
}

// One student's percentage in each term, next to the class average.
// scoresByTerm: { [termId]: scoreRows[] }, terms must be in order (oldest first).
export function studentProgress(terms, scoresByTerm, students, subjects, studentId) {
  return terms.map((t) => {
    const result = computeResults(students, subjects, scoresByTerm[t.id] || []);
    const row = result.rows.find((r) => r.studentId === studentId);
    const pct = row ? enteredPercentage(row, subjects) : null;
    const classPcts = result.rows
      .map((r) => enteredPercentage(r, subjects))
      .filter((p) => p !== null);
    return {
      termId: t.id,
      label: t.name,
      pct,
      classAverage: mean(classPcts),
      rank: pct !== null && row ? row.rank : null,
      classSize: result.rows.length,
    };
  });
}

// Is the student improving, declining or steady?
export function trendOf(points) {
  const withMarks = points.filter((p) => p.pct !== null);
  if (withMarks.length < 2) return null;
  const last = withMarks[withMarks.length - 1];
  const prev = withMarks[withMarks.length - 2];
  const first = withMarks[0];
  const change = last.pct - prev.pct;
  const overall = last.pct - first.pct;
  let direction = 'steady';
  if (change >= 2) direction = 'improving';
  else if (change <= -2) direction = 'declining';
  return { direction, change, overall, last, prev, first, count: withMarks.length };
}

export function fmt(value, digits = 1) {
  return value === null || value === undefined ? '-' : value.toFixed(digits);
}

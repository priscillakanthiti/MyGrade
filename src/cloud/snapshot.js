// Pure database logic for cloud backup (no network here).
// buildSnapshot: reads one teacher's data into a plain object.
// restoreSnapshot: writes that object into the local database, giving every
// row a fresh id, so it never clashes with data already on the phone.

export const SNAPSHOT_VERSION = 1;

const TEACHER_COLS = [
  'name', 'username', 'salt', 'password_hash',
  'security_question', 'answer_salt', 'answer_hash', 'school_name',
];

export async function buildSnapshot(db, teacherId) {
  const t = await db.getFirstAsync('SELECT * FROM teachers WHERE id = ?', teacherId);
  if (!t) throw new Error('Account not found.');

  const teacher = {};
  TEACHER_COLS.forEach((c) => { teacher[c] = t[c] === undefined ? null : t[c]; });

  const classes = await db.getAllAsync(
    'SELECT * FROM classes WHERE teacher_id = ? ORDER BY id', teacherId
  );
  const terms = await db.getAllAsync(
    `SELECT t.* FROM terms t JOIN classes c ON c.id = t.class_id
     WHERE c.teacher_id = ? ORDER BY t.id`, teacherId
  );
  const subjects = await db.getAllAsync(
    `SELECT s.* FROM subjects s JOIN classes c ON c.id = s.class_id
     WHERE c.teacher_id = ? ORDER BY s.id`, teacherId
  );
  const students = await db.getAllAsync(
    `SELECT s.* FROM students s JOIN classes c ON c.id = s.class_id
     WHERE c.teacher_id = ? ORDER BY s.id`, teacherId
  );
  const scores = await db.getAllAsync(
    `SELECT sc.* FROM scores sc
     JOIN students s ON s.id = sc.student_id
     JOIN classes c ON c.id = s.class_id
     WHERE c.teacher_id = ? ORDER BY sc.id`, teacherId
  );

  const comments = await db.getAllAsync(
    `SELECT rc.* FROM report_comments rc
     JOIN students s ON s.id = rc.student_id
     JOIN classes c ON c.id = s.class_id
     WHERE c.teacher_id = ? ORDER BY rc.id`, teacherId
  );

  return { version: SNAPSHOT_VERSION, teacher, classes, terms, subjects, students, scores, comments };
}

export function summarize(snap) {
  return {
    teacherName: snap.teacher.name,
    username: snap.teacher.username,
    classes: snap.classes.length,
    students: snap.students.length,
    subjects: snap.subjects.length,
    terms: snap.terms.length,
  };
}

const v = (x) => (x === undefined ? null : x);

export async function restoreSnapshot(db, snap) {
  if (!snap || snap.version !== SNAPSHOT_VERSION || !snap.teacher) {
    return { error: 'This backup is not in a format this version of the app understands.' };
  }

  const exists = await db.getFirstAsync(
    'SELECT id FROM teachers WHERE username = ?', snap.teacher.username
  );
  if (exists) {
    return {
      error: `An account with the username "${snap.teacher.username}" already exists on this phone. Sign in with it instead of restoring.`,
    };
  }

  let teacherId = null;
  await db.withTransactionAsync(async () => {
    const T = snap.teacher;
    const tr = await db.runAsync(
      `INSERT INTO teachers (name, username, salt, password_hash, security_question,
        answer_salt, answer_hash, school_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      v(T.name), v(T.username), v(T.salt), v(T.password_hash), v(T.security_question),
      v(T.answer_salt), v(T.answer_hash), v(T.school_name)
    );
    teacherId = tr.lastInsertRowId;

    const classMap = {};
    for (const c of snap.classes) {
      const r = await db.runAsync(
        'INSERT INTO classes (teacher_id, name, term, year) VALUES (?, ?, ?, ?)',
        teacherId, v(c.name), v(c.term), v(c.year)
      );
      classMap[c.id] = r.lastInsertRowId;
    }

    const termMap = {};
    for (const t of snap.terms) {
      if (!classMap[t.class_id]) continue;
      const r = await db.runAsync(
        'INSERT INTO terms (class_id, name, year, is_current) VALUES (?, ?, ?, ?)',
        classMap[t.class_id], v(t.name), v(t.year), t.is_current ? 1 : 0
      );
      termMap[t.id] = r.lastInsertRowId;
    }

    const subjectMap = {};
    for (const s of snap.subjects) {
      if (!classMap[s.class_id]) continue;
      const r = await db.runAsync(
        'INSERT INTO subjects (class_id, name, max_score) VALUES (?, ?, ?)',
        classMap[s.class_id], v(s.name), v(s.max_score)
      );
      subjectMap[s.id] = r.lastInsertRowId;
    }

    const studentMap = {};
    for (const s of snap.students) {
      if (!classMap[s.class_id]) continue;
      const r = await db.runAsync(
        `INSERT INTO students (class_id, name, gender, admission_no, date_of_birth,
          guardian_name, guardian_phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        classMap[s.class_id], v(s.name), v(s.gender), v(s.admission_no), v(s.date_of_birth),
        v(s.guardian_name), v(s.guardian_phone), v(s.address)
      );
      studentMap[s.id] = r.lastInsertRowId;
    }

    for (const sc of snap.scores) {
      if (!studentMap[sc.student_id] || !subjectMap[sc.subject_id] || !termMap[sc.term_id]) continue;
      await db.runAsync(
        'INSERT INTO scores (student_id, subject_id, term_id, score) VALUES (?, ?, ?, ?)',
        studentMap[sc.student_id], subjectMap[sc.subject_id], termMap[sc.term_id], v(sc.score)
      );
    }

    // Teacher comments (older backups do not have this list)
    for (const cm of snap.comments || []) {
      if (!studentMap[cm.student_id] || !termMap[cm.term_id]) continue;
      await db.runAsync(
        'INSERT INTO report_comments (student_id, term_id, comment) VALUES (?, ?, ?)',
        studentMap[cm.student_id], termMap[cm.term_id], v(cm.comment) === null ? '' : cm.comment
      );
    }
  });

  return { teacherId };
}

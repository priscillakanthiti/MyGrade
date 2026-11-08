export async function loadScriptAssignment(db, { classId, studentId, subjectId, teacherId }) {
  if (![classId, studentId, subjectId, teacherId].every((id) => Number.isSafeInteger(id) && id > 0)) {
    throw new Error('Choose a student and subject from your class before capturing marks.');
  }
  const classroom = await db.getFirstAsync('SELECT * FROM classes WHERE id = ? AND teacher_id = ?', classId, teacherId);
  const student = await db.getFirstAsync('SELECT * FROM students WHERE id = ? AND class_id = ?', studentId, classId);
  const subject = await db.getFirstAsync('SELECT * FROM subjects WHERE id = ? AND class_id = ?', subjectId, classId);
  const term = await db.getFirstAsync('SELECT * FROM terms WHERE class_id = ? AND is_current = 1', classId);
  if (!classroom || !student || !subject || !term) {
    throw new Error('The student, subject and current term must belong to your selected class. Return to the class and try again.');
  }
  return { classroom, student, subject, term };
}

export async function saveScriptTotal(db, assignment, total) {
  const { student, subject, term, classroom } = assignment;
  if (!Number.isFinite(total) || total < 0 || total > subject.max_score) throw new Error('Check the page marks before saving.');
  // Validate ownership and the pinned term in the same statement as the write.
  // A changed current term must never redirect this script to a different term.
  const result = await db.runAsync(
    `INSERT INTO scores (student_id, subject_id, term_id, score)
     SELECT st.id, su.id, t.id, ? FROM students st
     JOIN classes c ON c.id = st.class_id
     JOIN subjects su ON su.class_id = c.id
     JOIN terms t ON t.class_id = c.id
     WHERE st.id = ? AND su.id = ? AND c.id = ? AND c.teacher_id = ?
       AND t.id = ? AND t.is_current = 1 AND su.max_score >= ?
     ON CONFLICT(student_id, subject_id, term_id) DO UPDATE SET score = excluded.score`,
    total, student.id, subject.id, classroom.id, classroom.teacher_id, term.id, total
  );
  if (result.changes !== 1) throw new Error('The student, subject or current term has changed. Return to the class before saving this script.');
}

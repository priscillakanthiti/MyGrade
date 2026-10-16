export async function migrateDb(db) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync('PRAGMA user_version');
  let version = row ? row.user_version : 0;

  // Version 1: the base tables
  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        salt TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        term TEXT,
        year TEXT
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        max_score INTEGER NOT NULL DEFAULT 100
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        gender TEXT NOT NULL CHECK (gender IN ('M', 'F'))
      );

      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        score REAL,
        UNIQUE(student_id, subject_id)
      );
    `);
    await db.execAsync('PRAGMA user_version = 1');
    version = 1;
  }

  // Version 2: recovery question for forgotten PINs
  if (version < 2) {
    await db.execAsync(`
      ALTER TABLE teachers ADD COLUMN security_question TEXT;
      ALTER TABLE teachers ADD COLUMN answer_salt TEXT;
      ALTER TABLE teachers ADD COLUMN answer_hash TEXT;
    `);
    await db.execAsync('PRAGMA user_version = 2');
    version = 2;
  }

  // Version 3: terms, so results from previous terms are kept
  if (version < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS terms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          year TEXT,
          is_current INTEGER NOT NULL DEFAULT 1
        );

        INSERT INTO terms (class_id, name, year, is_current)
        SELECT id, COALESCE(NULLIF(term, ''), 'Term 1'), year, 1 FROM classes;

        CREATE TABLE scores_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
          score REAL,
          UNIQUE(student_id, subject_id, term_id)
        );

        INSERT INTO scores_new (student_id, subject_id, term_id, score)
        SELECT sc.student_id, sc.subject_id, t.id, sc.score
        FROM scores sc
        JOIN students st ON st.id = sc.student_id
        JOIN terms t ON t.class_id = st.class_id;

        DROP TABLE scores;
        ALTER TABLE scores_new RENAME TO scores;
      `);
    });
    await db.execAsync('PRAGMA user_version = 3');
    version = 3;
  }
}
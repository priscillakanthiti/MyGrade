import { useCallback, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import Notice from '../components/Notice';
import styles from '../styles/marks.styles';
import { colors } from '../theme';

export default function Marks() {
  const db = useSQLiteContext();
  const { classId, subjectId } = useLocalSearchParams();
  const cid = Number(classId);
  const sid = Number(subjectId);

  const [subject, setSubject] = useState(null);
  const [term, setTerm] = useState(null);
  const [students, setStudents] = useState([]);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setSubject(await db.getFirstAsync('SELECT * FROM subjects WHERE id = ?', sid));
    const t = await db.getFirstAsync(
      'SELECT * FROM terms WHERE class_id = ? AND is_current = 1', cid
    );
    setTerm(t);
    setStudents(
      await db.getAllAsync(
        'SELECT * FROM students WHERE class_id = ? ORDER BY name COLLATE NOCASE', cid
      )
    );
    const scores = t
      ? await db.getAllAsync('SELECT * FROM scores WHERE subject_id = ? AND term_id = ?', sid, t.id)
      : [];
    const map = {};
    scores.forEach((s) => {
      if (s.score !== null) map[s.student_id] = String(s.score);
    });
    setValues(map);
    setErrors({});
  }, [db, cid, sid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Saves the moment the teacher leaves a box
  async function saveScore(studentId) {
    if (!subject || !term) return;
    const text = (values[studentId] || '').trim();

    if (text === '') {
      await db.runAsync(
        'DELETE FROM scores WHERE student_id = ? AND subject_id = ? AND term_id = ?',
        studentId, sid, term.id
      );
      setErrors((e) => ({ ...e, [studentId]: false }));
      return;
    }

    const n = Number(text.replace(',', '.'));
    if (isNaN(n) || n < 0 || n > subject.max_score) {
      setErrors((e) => ({ ...e, [studentId]: true }));
      return;
    }

    await db.runAsync(
      `INSERT INTO scores (student_id, subject_id, term_id, score) VALUES (?, ?, ?, ?)
       ON CONFLICT(student_id, subject_id, term_id) DO UPDATE SET score = excluded.score`,
      studentId, sid, term.id, n
    );
    setErrors((e) => ({ ...e, [studentId]: false }));
  }

  const entered = students.filter(
    (s) => (values[s.id] || '').trim() !== '' && !errors[s.id]
  ).length;
  const progress = students.length ? entered / students.length : 0;
  const title = subject ? `${subject.name} marks` : 'Enter marks';
  const termLabel = term ? [term.name, term.year].filter(Boolean).join(' ') : '';
  const maxLabel = subject ? subject.max_score : '';

  if (students.length === 0) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title }} />
        <Text style={styles.msg}>Add students to this class before entering marks.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />

      <FlatList
        data={students}
        keyExtractor={(s) => String(s.id)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.heading}>{subject ? subject.name : ''}</Text>
            <Text style={styles.sub}>{termLabel}  |  Out of {maxLabel}</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Marks entered</Text>
              <Text style={styles.progressValue}>{entered} of {students.length}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.num}>{index + 1}</Text>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <TextInput
              style={[styles.scoreInput, errors[item.id] && styles.scoreErr]}
              keyboardType="decimal-pad"
              placeholder="-"
              placeholderTextColor={colors.placeholder}
              value={values[item.id] || ''}
              onChangeText={(t) => setValues((v) => ({ ...v, [item.id]: t }))}
              onEndEditing={() => saveScore(item.id)}
              onBlur={() => saveScore(item.id)}
              selectTextOnFocus
            />
            <Text style={styles.max}>/ {maxLabel}</Text>
          </View>
        )}
      />

      {Object.values(errors).some(Boolean) && (
        <View style={styles.errWrap}>
          <Notice tone="danger">
            Boxes marked in red are not saved. Marks must be a number from 0 to {maxLabel}.
          </Notice>
        </View>
      )}
    </View>
  );
}

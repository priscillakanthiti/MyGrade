import { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { theme } from '../theme';

export default function Marks() {
  const db = useSQLiteContext();
  const { classId, subjectId } = useLocalSearchParams();
  const cid = Number(classId);
  const sid = Number(subjectId);

  const [subject, setSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setSubject(await db.getFirstAsync('SELECT * FROM subjects WHERE id = ?', sid));
    setStudents(
      await db.getAllAsync(
        'SELECT * FROM students WHERE class_id = ? ORDER BY name COLLATE NOCASE', cid
      )
    );
    const scores = await db.getAllAsync('SELECT * FROM scores WHERE subject_id = ?', sid);
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
    if (!subject) return;
    const text = (values[studentId] || '').trim();

    if (text === '') {
      await db.runAsync('DELETE FROM scores WHERE student_id = ? AND subject_id = ?', studentId, sid);
      setErrors((e) => ({ ...e, [studentId]: false }));
      return;
    }

    const n = Number(text.replace(',', '.'));
    if (isNaN(n) || n < 0 || n > subject.max_score) {
      setErrors((e) => ({ ...e, [studentId]: true }));
      return;
    }

    await db.runAsync(
      `INSERT INTO scores (student_id, subject_id, score) VALUES (?, ?, ?)
       ON CONFLICT(student_id, subject_id) DO UPDATE SET score = excluded.score`,
      studentId, sid, n
    );
    setErrors((e) => ({ ...e, [studentId]: false }));
  }

  const entered = students.filter(
    (s) => (values[s.id] || '').trim() !== '' && !errors[s.id]
  ).length;
  const progress = students.length ? entered / students.length : 0;
  const title = subject ? `${subject.name} marks` : 'Enter marks';

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

      <View style={styles.summary}>
        <Text style={styles.heading}>{subject ? subject.name : ''}</Text>
        <Text style={styles.sub}>Out of {subject ? subject.max_score : ''}</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.sub}>Entered {entered} of {students.length}</Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(s) => String(s.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40, gap: 8 }}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.num}>{index + 1}</Text>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <TextInput
              style={[styles.scoreInput, errors[item.id] && styles.scoreErr]}
              keyboardType="decimal-pad"
              placeholder="-"
              value={values[item.id] || ''}
              onChangeText={(t) => setValues((v) => ({ ...v, [item.id]: t }))}
              onEndEditing={() => saveScore(item.id)}
              onBlur={() => saveScore(item.id)}
              selectTextOnFocus
            />
            <Text style={styles.max}>/ {subject ? subject.max_score : ''}</Text>
          </View>
        )}
      />

      {Object.values(errors).some(Boolean) && (
        <Text style={styles.errText}>
          Red boxes are not saved. Marks must be a number from 0 to {subject ? subject.max_score : ''}.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, gap: 10 },
  centerMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  msg: { textAlign: 'center', fontSize: 16, color: theme.muted },
  summary: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 6, alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', color: theme.text },
  sub: { color: theme.muted },
  barBg: { width: '100%', height: 10, borderRadius: 5, backgroundColor: '#DDEBFA', overflow: 'hidden', marginTop: 4 },
  barFill: { height: 10, backgroundColor: theme.greenDark },
  row: {
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  num: { width: 26, color: theme.muted, textAlign: 'right' },
  name: { flex: 1, fontSize: 16, color: theme.text },
  scoreInput: {
    width: 72, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    padding: 9, textAlign: 'center', backgroundColor: '#F7FAFE', fontSize: 16,
  },
  scoreErr: { borderColor: theme.danger, backgroundColor: '#FDECEA' },
  max: { width: 50, color: theme.muted },
  errText: { color: theme.danger, textAlign: 'center' },
});
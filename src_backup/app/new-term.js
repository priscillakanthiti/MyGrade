import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../theme';

export default function NewTerm() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const cid = Number(classId);

  const [cls, setCls] = useState(null);
  const [current, setCurrent] = useState(null);
  const [name, setName] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    (async () => {
      setCls(await db.getFirstAsync('SELECT * FROM classes WHERE id = ?', cid));
      const cur = await db.getFirstAsync(
        'SELECT * FROM terms WHERE class_id = ? AND is_current = 1', cid
      );
      setCurrent(cur);
      if (cur && cur.year) setYear(cur.year);
    })();
  }, [db, cid]);

  function confirm() {
    if (!name.trim()) {
      Alert.alert('Check input', 'Enter the new term name, for example Term 2.');
      return;
    }
    Alert.alert(
      'Start new term?',
      `${current ? current.name : 'The current term'} results will be saved and kept. New marks will go to ${name.trim()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: start },
      ]
    );
  }

  async function start() {
    const termName = name.trim();
    const termYear = year.trim();
    await db.withTransactionAsync(async () => {
      await db.runAsync('UPDATE terms SET is_current = 0 WHERE class_id = ?', cid);
      await db.runAsync(
        'INSERT INTO terms (class_id, name, year, is_current) VALUES (?, ?, ?, 1)',
        cid, termName, termYear
      );
      await db.runAsync('UPDATE classes SET term = ?, year = ? WHERE id = ?', termName, termYear, cid);
    });
    router.navigate({
      pathname: '/results',
      params: { classId: String(cid), t: String(Date.now()) },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.box}>
        <Text style={styles.title}>{cls ? cls.name : ''}</Text>
        <Text style={styles.sub}>
          Current term: {current ? [current.name, current.year].filter(Boolean).join(' ') : '-'}
        </Text>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Starting a new term keeps all the marks and results of the current term. Students and subjects stay
            the same, and the new term starts with no marks.
          </Text>
        </View>

        <Text style={styles.label}>New term name</Text>
        <TextInput style={styles.input} placeholder="e.g. Term 2" value={name} onChangeText={setName} />

        <Text style={styles.label}>Year</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2026"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
        />

        <Pressable style={styles.button} onPress={confirm}>
          <Text style={styles.buttonText}>Start new term</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  box: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 8,
    width: '100%', maxWidth: 480, alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  sub: { color: theme.muted, textAlign: 'center' },
  note: { backgroundColor: '#DDEBFA', borderRadius: 12, padding: 12, marginVertical: 6 },
  noteText: { color: theme.text, textAlign: 'center' },
  label: { fontWeight: 'bold', color: theme.text, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: '#F7FAFE',
  },
  button: { backgroundColor: theme.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});
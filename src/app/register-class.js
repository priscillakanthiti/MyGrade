import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useSelectedClass } from '../state/ClassContext';
import { theme } from '../theme';

export default function RegisterClass() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { teacherId } = useAuth();
  const { setSelectedClassId } = useSelectedClass();
  const [name, setName] = useState('');
  const [term, setTerm] = useState('');
  const [year, setYear] = useState('');

  async function save() {
    if (!name.trim()) {
      Alert.alert('Check input', 'Enter the class name, for example Standard 5A.');
      return;
    }
    const res = await db.runAsync(
      'INSERT INTO classes (teacher_id, name, term, year) VALUES (?, ?, ?, ?)',
      teacherId, name.trim(), term.trim(), year.trim()
    );
    setSelectedClassId(res.lastInsertRowId);
    router.replace('/');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.box}>
        <Text style={styles.label}>Class name</Text>
        <TextInput style={styles.input} placeholder="e.g. Standard 5A" value={name} onChangeText={setName} />

        <Text style={styles.label}>Term</Text>
        <TextInput style={styles.input} placeholder="e.g. Term 1" value={term} onChangeText={setTerm} />

        <Text style={styles.label}>Year</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2026"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
        />

        <Pressable style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Register Class</Text>
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
  label: { fontWeight: 'bold', color: theme.text, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: '#F7FAFE',
  },
  button: { backgroundColor: theme.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});
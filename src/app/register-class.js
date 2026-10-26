import { useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useSelectedClass } from '../state/ClassContext';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import styles from '../styles/forms.styles';

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
    const termName = term.trim() || 'Term 1';

    const res = await db.runAsync(
      'INSERT INTO classes (teacher_id, name, term, year) VALUES (?, ?, ?, ?)',
      teacherId, name.trim(), termName, year.trim()
    );
    // Every class starts with one current term that holds its marks
    await db.runAsync(
      'INSERT INTO terms (class_id, name, year, is_current) VALUES (?, ?, ?, 1)',
      res.lastInsertRowId, termName, year.trim()
    );

    setSelectedClassId(res.lastInsertRowId);
    router.replace('/');
  }

  return (
    <Page>
      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Class details</Text>
          <Text style={styles.cardSub}>Enter the details of the class you teach.</Text>
        </View>

        <AppInput
          label="Class name"
          icon="school-outline"
          placeholder="e.g. Standard 5A"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.twoCols}>
          <AppInput
            containerStyle={styles.col}
            label="Term"
            placeholder="e.g. Term 1"
            value={term}
            onChangeText={setTerm}
          />
          <AppInput
            containerStyle={styles.col}
            label="Year"
            placeholder="e.g. 2026"
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
          />
        </View>

        <AppButton title="Register Class" icon="checkmark" onPress={save} />
      </View>
    </Page>
  );
}

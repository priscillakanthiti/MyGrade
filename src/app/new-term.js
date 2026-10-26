import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import styles from '../styles/forms.styles';

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
    <Page>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>{cls ? cls.name : ''}</Text>
        <Text style={styles.headingSub}>
          Current term: {current ? [current.name, current.year].filter(Boolean).join(' ') : '-'}
        </Text>
      </View>

      <Notice tone="info" title="Your results are kept">
        Starting a new term keeps all marks and results of the current term. Students and subjects stay
        the same, and the new term starts with no marks.
      </Notice>

      <View style={styles.card}>
        <AppInput
          label="New term name"
          icon="calendar-outline"
          placeholder="e.g. Term 2"
          value={name}
          onChangeText={setName}
        />
        <AppInput
          label="Year"
          icon="time-outline"
          placeholder="e.g. 2026"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
        />
        <AppButton title="Start new term" icon="arrow-forward" iconRight onPress={confirm} />
      </View>
    </Page>
  );
}

import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter, Stack } from 'expo-router';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import { scanMarks } from '../ocr/scanner';
import { sumMarks } from '../ocr/parseMarks';
import styles from '../styles/script.styles';
import { colors } from '../theme';

// Adds up the marks written on the pages of a pupil's script.
// Flow: photograph each page (as many as needed) -> the teacher checks the mark
// shown next to each photo -> confirms -> the app adds them up -> teacher saves.

// Reads one text box: returns { empty }, { bad } or { value }
function readBox(text, max) {
  const t = String(text).trim().replace(',', '.');
  if (t === '') return { empty: true };
  const n = Number(t);
  if (isNaN(n) || n < 0 || (max !== null && n > max)) return { bad: true };
  return { value: n };
}

export default function ScriptMarks() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId, studentId, subjectId } = useLocalSearchParams();
  const cid = Number(classId);
  const stid = Number(studentId);
  const sid = Number(subjectId);

  const [student, setStudent] = useState(null);
  const [subject, setSubject] = useState(null);
  const [term, setTerm] = useState(null);
  const [existing, setExisting] = useState(null);

  const [rows, setRows] = useState([]);          // [{ id, text, flagged, uri }]
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState(null);    // { tone, text }
  const nextId = useRef(1);

  const load = useCallback(async () => {
    setStudent(await db.getFirstAsync('SELECT * FROM students WHERE id = ?', stid));
    setSubject(await db.getFirstAsync('SELECT * FROM subjects WHERE id = ?', sid));
    const t = await db.getFirstAsync('SELECT * FROM terms WHERE class_id = ? AND is_current = 1', cid);
    setTerm(t);
    if (t) {
      setExisting(
        await db.getFirstAsync(
          'SELECT score FROM scores WHERE student_id = ? AND subject_id = ? AND term_id = ?',
          stid, sid, t.id
        )
      );
    }
  }, [db, cid, stid, sid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const max = subject ? subject.max_score : null;
  const reads = rows.map((r) => readBox(r.text, max));
  const allValid = rows.length > 0 && reads.every((r) => r.value !== undefined);
  const total = sumMarks(reads.filter((r) => r.value !== undefined).map((r) => r.value));
  const percent = max ? (total / max) * 100 : null;
  const over = max !== null && total > max;

  function changed(next) {
    setRows(next);
    setConfirmed(false); // any change means the teacher must confirm again
  }

  function setText(id, text) {
    changed(rows.map((r) => (r.id === id ? { ...r, text, flagged: false } : r)));
  }

  function removeRow(id) {
    changed(rows.filter((r) => r.id !== id));
  }

  function addTyped() {
    const r = readBox(input, max);
    if (r.empty) { setInputError('Enter a mark such as 8 or 7.5.'); return; }
    if (r.bad) { setInputError(`A page mark must be a number from 0 to ${max}.`); return; }
    setInputError('');
    changed([...rows, { id: `r-${nextId.current++}`, text: String(r.value), flagged: false, uri: null }]);
    setInput('');
  }

  async function scan(source) {
    setNotice(null);
    setScanning(true);
    const r = await scanMarks({ source, maxScore: max === null ? undefined : max });
    setScanning(false);

    if (r.cancelled) return;
    if (r.error) { setNotice({ tone: 'danger', text: r.error }); return; }

    let added;
    if (r.marks.length === 0) {
      // Nothing read: keep the photo and let the teacher type the mark
      added = [{ id: `r-${nextId.current++}`, text: '', flagged: false, uri: r.uri }];
      setNotice({
        tone: 'warning',
        text: (r.problem && r.problem.message)
          || r.scannerNote
          || 'The mark on this page could not be read automatically. Look at the photo and type the mark in the box.',
      });
    } else {
      added = r.marks.map((m) => ({
        id: `r-${nextId.current++}`, text: String(m.value), flagged: m.flagged, uri: r.uri,
      }));
      const needsCheck = r.marks.some((m) => m.flagged);
      setNotice({
        tone: needsCheck ? 'warning' : 'info',
        text: needsCheck && r.note
          ? r.note
          : 'Page added. Check the figure against the photo, then add the next page.',
      });
    }
    changed([...rows, ...added]);
  }

  async function save() {
    if (!term || !subject) return;
    if (over) {
      Alert.alert('Total is too high', `The total (${total}) is more than the ${max} marks for ${subject.name}. Check the figures.`);
      return;
    }
    await db.runAsync(
      `INSERT INTO scores (student_id, subject_id, term_id, score) VALUES (?, ?, ?, ?)
       ON CONFLICT(student_id, subject_id, term_id) DO UPDATE SET score = excluded.score`,
      stid, sid, term.id, total
    );
    Alert.alert('Saved', `${student ? student.name : 'Student'}: ${total} out of ${max} saved for ${subject.name}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  function clearAll() {
    Alert.alert('Clear all pages?', 'This removes every page mark entered on this screen.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { changed([]); setNotice(null); } },
    ]);
  }

  if (!student || !subject) {
    return <Page><Text style={styles.hint}>Loading...</Text></Page>;
  }

  return (
    <Page>
      <Stack.Screen options={{ title: 'Add up script marks' }} />

      <View style={styles.hero}>
        <Text style={styles.heroName}>{student.name}</Text>
        <Text style={styles.heroSub}>
          {subject.name}  |  Out of {subject.max_score}
          {term ? `  |  ${term.name}` : ''}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Photograph the pages</Text>
        <Text style={styles.hint}>
          Take one photo per page, as many pages as the script has, then check them below. Crop tightly around the mark. The app tries to read each mark, and you always check it.
        </Text>
        <View style={styles.buttonRow}>
          <View style={styles.grow}>
            <AppButton icon="camera-outline" title="Add page" onPress={() => scan('camera')} loading={scanning} />
          </View>
          <View style={styles.grow}>
            <AppButton variant="soft" icon="images-outline" title="From gallery" onPress={() => scan('library')} loading={scanning} />
          </View>
        </View>
        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Check each page mark</Text>

        {rows.length === 0 ? (
          <Text style={styles.hint}>No pages yet. Add a page photo above, or type a mark below.</Text>
        ) : (
          rows.map((r, i) => {
            const rd = reads[i];
            return (
              <View
                key={r.id}
                style={[styles.pageRow, r.flagged && styles.pageRowFlagged, rd.bad && styles.pageRowBad]}
              >
                {r.uri ? (
                  <Image source={{ uri: r.uri }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbEmpty}>
                    <Ionicons name="create-outline" size={26} color={colors.primary} />
                  </View>
                )}
                <View style={styles.pageBody}>
                  <Text style={styles.pageLabel}>
                    Page {i + 1}{r.flagged ? '  |  check this one' : ''}{rd.bad ? '  |  not valid' : ''}
                  </Text>
                  <TextInput
                    style={styles.pageInput}
                    value={r.text}
                    onChangeText={(t) => setText(r.id, t)}
                    keyboardType="decimal-pad"
                    placeholder="Type mark"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
                <Pressable style={styles.deleteBtn} onPress={() => removeRow(r.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            );
          })
        )}

        <View style={styles.addRow}>
          <AppInput
            containerStyle={styles.addInput}
            label="Or type a page mark"
            icon="create-outline"
            placeholder="e.g. 15"
            keyboardType="decimal-pad"
            value={input}
            onChangeText={(t) => { setInput(t); setInputError(''); }}
            onSubmitEditing={addTyped}
            error={inputError}
          />
          <View style={{ width: 96 }}>
            <AppButton icon="add" title="Add" onPress={addTyped} />
          </View>
        </View>

        {rows.length > 0 ? (
          <AppButton variant="ghost" size="sm" title="Clear all pages" onPress={clearAll} />
        ) : null}

        <AppButton
          variant="success"
          icon="checkmark-done-outline"
          title={confirmed ? 'Figures confirmed' : 'These figures are correct'}
          disabled={!allValid || confirmed}
          onPress={() => setConfirmed(true)}
        />
        {rows.length > 0 && !allValid ? (
          <Text style={styles.hint}>Every page needs a valid mark before you can confirm.</Text>
        ) : null}
      </View>

      {confirmed ? (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total for {subject.name}</Text>
          <Text style={styles.totalValue}>{total}</Text>
          <Text style={styles.totalSub}>
            out of {max}  |  {percent.toFixed(1)}%
          </Text>
        </View>
      ) : (
        <View style={styles.totalPending}>
          <Text style={styles.totalPendingText}>
            The total is calculated after you confirm that the figures are correct.
          </Text>
        </View>
      )}

      {confirmed && over ? (
        <Notice tone="danger">The total is more than {max}. Change the figures before saving.</Notice>
      ) : null}
      {existing && existing.score !== null && existing.score !== undefined ? (
        <Notice tone="info">
          This pupil already has {existing.score} for {subject.name}. Saving will replace it.
        </Notice>
      ) : null}

      <AppButton icon="save-outline" title="Save total" disabled={!confirmed || over} onPress={save} />
    </Page>
  );
}

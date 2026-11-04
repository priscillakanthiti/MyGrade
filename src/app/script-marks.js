import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter, Stack } from 'expo-router';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import { scanMarks } from '../ocr/scanner';
import { sumMarks } from '../ocr/parseMarks';
import styles from '../styles/script.styles';

// Adds up the marks written on the pages of a pupil's script.
// Flow: scan or type the page marks -> teacher checks every figure ->
// teacher confirms -> the app adds them up -> teacher saves.
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

  const [items, setItems] = useState([]);       // [{ id, value, flagged }]
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState(null);   // { tone, text }
  const [rawText, setRawText] = useState('');
  const [showRaw, setShowRaw] = useState(false);
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
  const total = sumMarks(items.map((i) => i.value));
  const percent = max ? (total / max) * 100 : null;
  const over = max !== null && total > max;

  function changed(next) {
    setItems(next);
    setConfirmed(false); // any change means the teacher must confirm again
  }

  function parseInput() {
    const n = Number(String(input).trim().replace(',', '.'));
    if (input.trim() === '' || isNaN(n) || n < 0) return { error: 'Enter a mark such as 8 or 7.5.' };
    if (max !== null && n > max) return { error: `A page mark cannot be more than ${max}.` };
    return { value: n };
  }

  function addMark() {
    const p = parseInput();
    if (p.error) { setInputError(p.error); return; }
    setInputError('');
    changed([...items, { id: `m-${nextId.current++}`, value: p.value, flagged: false }]);
    setInput('');
  }

  function selectChip(chip) {
    setEditingId(chip.id);
    setInput(String(chip.value));
    setInputError('');
  }

  function updateMark() {
    const p = parseInput();
    if (p.error) { setInputError(p.error); return; }
    changed(items.map((i) => (i.id === editingId ? { ...i, value: p.value, flagged: false } : i)));
    cancelEdit();
  }

  function deleteMark() {
    changed(items.filter((i) => i.id !== editingId));
    cancelEdit();
  }

  function cancelEdit() {
    setEditingId(null);
    setInput('');
    setInputError('');
  }

  async function scan(source) {
    setNotice(null);
    setScanning(true);
    const r = await scanMarks({ source, maxScore: max === null ? undefined : max });
    setScanning(false);

    if (r.cancelled) return;
    if (r.error) { setNotice({ tone: 'danger', text: r.error }); return; }

    setRawText(r.rawText);
    if (r.marks.length === 0) {
      setNotice({
        tone: 'warning',
        text: 'No marks were found. Crop tightly around the marks, keep the photo steady and well lit, or type the marks instead.',
      });
      return;
    }
    const added = r.marks.map((m) => ({ id: `m-${nextId.current++}`, value: m.value, flagged: m.flagged }));
    changed([...items, ...added]);
    const flaggedCount = added.filter((a) => a.flagged).length;
    setNotice({
      tone: 'info',
      text: `Found ${added.length} number${added.length > 1 ? 's' : ''}${
        flaggedCount ? `, ${flaggedCount} marked in amber that need a closer look` : ''
      }. Check every figure against the paper before confirming.`,
    });
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
    Alert.alert('Saved', `${student ? student.name : 'Student'}: ${total} out of ${max} saved for ${subject ? subject.name : ''}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  function clearAll() {
    Alert.alert('Clear all marks?', 'This removes every page mark entered on this screen.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { changed([]); cancelEdit(); setNotice(null); } },
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
        <Text style={styles.cardTitle}>1. Scan the marks on a page</Text>
        <Text style={styles.hint}>
          Photograph one page at a time and crop tightly around the mark written at the top or edge. Scanning works on the phone, with no internet.
        </Text>
        <View style={styles.buttonRow}>
          <View style={styles.grow}>
            <AppButton icon="camera-outline" title="Camera" onPress={() => scan('camera')} loading={scanning} />
          </View>
          <View style={styles.grow}>
            <AppButton variant="soft" icon="images-outline" title="Photo" onPress={() => scan('library')} loading={scanning} />
          </View>
        </View>
        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        {rawText ? (
          <>
            <Pressable onPress={() => setShowRaw(!showRaw)}>
              <Text style={styles.link}>{showRaw ? 'Hide' : 'Show'} what the scanner read</Text>
            </Pressable>
            {showRaw ? (
              <View style={styles.rawBox}><Text style={styles.rawText}>{rawText}</Text></View>
            ) : null}
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Check and correct the figures</Text>
        <View style={styles.addRow}>
          <AppInput
            containerStyle={styles.addInput}
            label={editingId ? 'Change this mark' : 'Type a page mark'}
            icon="create-outline"
            placeholder="e.g. 15"
            keyboardType="decimal-pad"
            value={input}
            onChangeText={(t) => { setInput(t); setInputError(''); }}
            onSubmitEditing={editingId ? updateMark : addMark}
            error={inputError}
          />
          {!editingId ? (
            <View style={{ width: 96 }}>
              <AppButton icon="add" title="Add" onPress={addMark} />
            </View>
          ) : null}
        </View>

        {editingId ? (
          <View style={styles.editBar}>
            <AppButton icon="checkmark" title="Update this mark" onPress={updateMark} />
            <View style={styles.buttonRow}>
              <View style={styles.grow}><AppButton variant="dangerOutline" title="Delete" onPress={deleteMark} /></View>
              <View style={styles.grow}><AppButton variant="secondary" title="Cancel" onPress={cancelEdit} /></View>
            </View>
          </View>
        ) : null}

        {items.length === 0 ? (
          <Text style={styles.hint}>No marks yet. Scan a page or type the marks above.</Text>
        ) : (
          <>
            <View style={styles.chips}>
              {items.map((i) => (
                <Pressable
                  key={i.id}
                  onPress={() => selectChip(i)}
                  style={[styles.chip, i.flagged && styles.chipFlagged, editingId === i.id && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, i.flagged && styles.chipTextFlagged]}>{i.value}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.legend}>
              Tap a mark to change or delete it. Amber marks were uncertain, so check them closely.
            </Text>
            <View style={styles.buttonRow}>
              <View style={styles.grow}>
                <AppButton variant="ghost" size="sm" title="Clear all" onPress={clearAll} />
              </View>
            </View>
          </>
        )}

        <AppButton
          variant="success"
          icon="checkmark-done-outline"
          title={confirmed ? 'Figures confirmed' : 'These figures are correct'}
          disabled={items.length === 0 || confirmed}
          onPress={() => setConfirmed(true)}
        />
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

      <AppButton
        icon="save-outline"
        title="Save total"
        disabled={!confirmed || over}
        onPress={save}
      />
    </Page>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import MarkPhotoEditor from '../components/MarkPhotoEditor';
import { captureMarkPage, readMarkPage } from '../ocr/scanner';
import { sumMarks } from '../ocr/parseMarks';
import { readPageBatch } from '../ocr/batch';
import { loadScriptAssignment, saveScriptTotal } from '../ocr/assignment';
import { useAuth } from '../auth/AuthContext';
import styles from '../styles/script.styles';
import { colors } from '../theme';

// Adds up the marks written on the pages of a pupil's script.
// Flow: collect page photos -> read their marks -> the teacher checks each mark
// shown next to each photo -> confirms -> the app adds them up -> teacher saves.

// Reads one text box: returns { empty }, { bad } or { value }
function readBox(text, max) {
  const t = String(text).trim().replace(',', '.');
  if (t === '') return { empty: true };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || (max !== null && n > max)) return { bad: true };
  return { value: n };
}

export default function ScriptMarks() {
  const { classId, studentId, subjectId } = useLocalSearchParams();
  const { teacherId } = useAuth();
  // A different student/subject/account always gets fresh photos and marks.
  return <ScriptCapture key={`${teacherId}:${classId}:${studentId}:${subjectId}`}
    cid={Number(classId)} stid={Number(studentId)} sid={Number(subjectId)} teacherId={teacherId} />;
}

function ScriptCapture({ cid, stid, sid, teacherId }) {
  const db = useSQLiteContext();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [subject, setSubject] = useState(null);
  const [term, setTerm] = useState(null);
  const [existing, setExisting] = useState(null);

  const [rows, setRows] = useState([]);          // [{ id, text, flagged, uri, asset?, problem? }]
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cropAsset, setCropAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);    // { tone, text }
  const nextId = useRef(1);
  const busy = useRef(false);
  const [reading, setReading] = useState(false);
  const [readProgress, setReadProgress] = useState('');
  const [assignment, setAssignment] = useState(null);
  const [loadError, setLoadError] = useState('');
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    let cancelled = false;
    async function load() {
      try {
        const selected = await loadScriptAssignment(db, { classId: cid, studentId: stid, subjectId: sid, teacherId });
        const score = await db.getFirstAsync(
          'SELECT score FROM scores WHERE student_id = ? AND subject_id = ? AND term_id = ?',
          stid, sid, selected.term.id
        );
        if (cancelled) return;
        setAssignment(selected);
        setStudent(selected.student);
        setSubject(selected.subject);
        setTerm(selected.term);
        setExisting(score);
      } catch (error) {
        if (!cancelled) setLoadError(error.message || 'The student could not be loaded. Return to the class and try again.');
      }
    }
    load();
    return () => { cancelled = true; active.current = false; };
  }, [db, cid, stid, sid, teacherId]);

  const max = subject ? subject.max_score : null;
  const reads = rows.map((r) => readBox(r.text, max));
  const pending = rows.filter((r) => r.asset);
  const working = scanning || reading || saving || Boolean(cropAsset);
  const allValid = rows.length > 0 && pending.length === 0 && reads.every((r) => r.value !== undefined);
  const total = sumMarks(reads.filter((r) => r.value !== undefined).map((r) => r.value));
  const percent = max ? (total / max) * 100 : null;
  const over = max !== null && total > max;

  function changed(next) {
    setRows(next);
    setConfirmed(false); // any change means the teacher must confirm again
  }

  function setText(id, text) {
    changed((current) => current.map((r) => (r.id === id ? { ...r, text, flagged: false, asset: null, problem: null } : r)));
  }

  function removeRow(id) {
    changed((current) => current.filter((r) => r.id !== id));
  }

  function addTyped() {
    if (busy.current || working) return;
    const r = readBox(input, max);
    if (r.empty) { setInputError('Enter a mark such as 8 or 7.5.'); return; }
    if (r.bad) { setInputError(`A page mark must be a number from 0 to ${max}.`); return; }
    setInputError('');
    const row = { id: `r-${nextId.current++}`, text: String(r.value), flagged: false, uri: null };
    changed((current) => [...current, row]);
    setInput('');
  }

  async function scan(source) {
    if (busy.current || working) return;
    busy.current = true;
    setNotice(null);
    setScanning(true);
    try {
      const result = await captureMarkPage(source);
      if (!active.current) return;
      if (result.cancelled) return;
      if (result.error) { setNotice({ tone: 'danger', text: result.error }); return; }
      setCropAsset(result.asset);
    } finally {
      busy.current = false;
      setScanning(false);
    }
  }

  function addCroppedPage(asset) {
    setCropAsset(null);
    changed(current => [...current, {
      id: `r-${nextId.current++}`, text: '', flagged: false, uri: asset.uri, asset,
    }]);
    setNotice({ tone: 'info', text: 'Page added. Take the next page photo, or read the page marks when you have finished.' });
  }

  async function readPages() {
    if (busy.current || working || pending.length === 0) return;
    busy.current = true;
    setReading(true);
    setConfirmed(false);
    setNotice(null);
    let unread = 0;
    try {
      setReadProgress(`Read 0 of ${pending.length} pages…`);
      await readPageBatch(pending, (page) => readMarkPage(page.asset, max), (page, result, completed) => {
        setReadProgress(`Read ${completed} of ${pending.length} pages…`);
        const mark = result.marks[0];
        if (!mark) unread++;
        changed((current) => current.map((r) => r.id === page.id ? {
          ...r, asset: null, text: mark ? String(mark.value) : '',
          flagged: Boolean(mark), via: result.via,
          problem: mark ? null : (result.problem?.message || result.scannerNote),
        } : r));
      }, () => active.current);
      if (!active.current) return;
      setNotice({
        tone: unread ? 'warning' : 'info',
        text: unread
          ? `${unread} page(s) could not be read. Type their marks, then check all pages before calculating the total.`
          : 'Page marks are ready. Check each figure against its photo, then calculate the total.',
      });
    } finally {
      busy.current = false;
      setReading(false);
      setReadProgress('');
    }
  }

  async function save() {
    if (busy.current || working || !confirmed || !allValid) return;
    if (!term || !subject) {
      setNotice({ tone: 'danger', text: 'A current term and subject are required before saving marks.' });
      return;
    }
    if (over) {
      Alert.alert('Total is too high', `The total (${total}) is more than the ${max} marks for ${subject.name}. Check the figures.`);
      return;
    }
    setSaving(true);
    busy.current = true;
    try {
      await saveScriptTotal(db, assignment, total);
      if (!active.current) return;
      Alert.alert('Saved', `${student ? student.name : 'Student'}: ${total} out of ${max} saved for ${subject.name}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      setNotice({ tone: 'danger', text: error.message || 'The mark could not be saved. Your page marks are still here; please try again.' });
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function clearAll() {
    if (busy.current || working) return;
    Alert.alert('Clear all pages?', 'This removes every page mark entered on this screen.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { changed([]); setNotice(null); } },
    ]);
  }

  if (loadError) {
    return <Page><Notice tone="danger">{loadError}</Notice><AppButton title="Back to class" onPress={() => router.back()} /></Page>;
  }
  if (!student || !subject) {
    return <Page><Text style={styles.hint}>Loading...</Text></Page>;
  }

  return (
    <Page>
      <Stack.Screen options={{ title: 'Add up script marks' }} />
      {cropAsset ? <MarkPhotoEditor asset={cropAsset} onCancel={() => setCropAsset(null)} onConfirm={addCroppedPage} /> : null}

      <View style={styles.hero}>
        <Text style={styles.heroName}>{student.name}</Text>
        <Text style={styles.heroSub}>{assignment.classroom.name}  |  Student #{student.id}</Text>
        <Text style={styles.heroSub}>
          {subject.name}  |  Out of {subject.max_score}
          {term ? `  |  ${term.name}` : ''}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Photograph the pages</Text>
        <Text style={styles.hint}>
          These pages will be saved for {student.name}. Crop around one awarded page total, including its circle if present. Lined paper and handwritten marks are supported. Add all pages, then tap Read page marks. Photos are sent to Google using internet. Check every suggested mark.
        </Text>
        <View style={styles.buttonRow}>
          <View style={styles.grow}>
            <AppButton icon="camera-outline" title={rows.length ? 'Add next page' : 'Take page photo'} disabled={working} onPress={() => scan('camera')} loading={scanning} />
          </View>
          <View style={styles.grow}>
            <AppButton variant="soft" icon="images-outline" title="From gallery" disabled={working} onPress={() => scan('library')} loading={scanning} />
          </View>
        </View>
        <Text style={styles.hint}>{rows.length} page{rows.length === 1 ? '' : 's'} added</Text>
        {pending.length > 0 || reading ? (
          <AppButton
            icon="scan-outline"
            title={`Read page marks (${pending.length})`}
            onPress={readPages}
            loading={reading}
            disabled={working}
          />
        ) : null}
        {reading ? <Text style={styles.hint} accessibilityLiveRegion="polite">{readProgress}</Text> : null}
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
                    Page {i + 1}{r.flagged ? '  |  check this one' : ''}{rd.bad ? '  |  not valid' : ''}{r.asset ? '  |  awaiting reading' : ''}
                  </Text>
                  {r.via ? <Text style={styles.hint}>{r.via === 'device' ? 'Read on phone' : 'Read with Gemini'}</Text> : null}
                  <TextInput
                    style={styles.pageInput}
                    value={r.text}
                    onChangeText={(t) => setText(r.id, t)}
                    editable={!working}
                    accessibilityLabel={`Mark for page ${i + 1}`}
                    keyboardType="decimal-pad"
                    placeholder="Type mark"
                    placeholderTextColor={colors.placeholder}
                  />
                  {r.problem ? <Text style={styles.hint}>{r.problem}</Text> : null}
                </View>
                <Pressable disabled={working} accessibilityLabel={`Remove page ${i + 1}`} style={styles.deleteBtn} onPress={() => removeRow(r.id)} hitSlop={8}>
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
            editable={!working}
            value={input}
            onChangeText={(t) => { setInput(t); setInputError(''); }}
            onSubmitEditing={addTyped}
            error={inputError}
          />
          <View style={{ width: 96 }}>
            <AppButton icon="add" title="Add" disabled={working} onPress={addTyped} />
          </View>
        </View>

        {rows.length > 0 ? (
          <AppButton variant="ghost" size="sm" title="Clear all pages" disabled={working} onPress={clearAll} />
        ) : null}

        <AppButton
          variant="success"
          icon="checkmark-done-outline"
          title={confirmed ? 'Total calculated' : 'Confirm marks & get total'}
          disabled={!allValid || confirmed || working}
          onPress={() => setConfirmed(true)}
        />
        {rows.length > 0 && !allValid ? (
          <Text style={styles.hint}>Every page needs a valid mark before you can confirm.</Text>
        ) : null}
      </View>

      {confirmed ? (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{student.name} · {subject.name}</Text>
          <Text style={styles.totalValue}>{total}</Text>
          <Text style={styles.totalSub}>
            {rows.length} page{rows.length === 1 ? '' : 's'}  |  out of {max}  |  {percent === null ? '—' : percent.toFixed(1)}%
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

      <AppButton icon="save-outline" title={`Save total for ${student.name}`} loading={saving} disabled={!confirmed || !allValid || over || working || !term} onPress={save} />
    </Page>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter, Stack } from 'expo-router';
import { computeResults } from '../utils/ranking';
import { resultStatus } from '../utils/format';
import { GRADE_SCALE, gradeForMark } from '../utils/grading';
import { classReportHtml, sharePdf } from '../utils/reports';
import { theme } from '../theme';

export default function Results() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId, t } = useLocalSearchParams();
  const cid = Number(classId);

  const [cls, setCls] = useState(null);
  const [terms, setTerms] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  const [viewTermId, setViewTermId] = useState(null);
  const [view, setView] = useState('totals');
  const [subjects, setSubjects] = useState([]);
  const [rows, setRows] = useState([]);
  const [maxTotal, setMaxTotal] = useState(0);
  const [passMark, setPassMark] = useState(0);
  const [busy, setBusy] = useState(false);

  // After starting a new term, show the new current term
  useEffect(() => { setViewTermId(null); }, [t]);

  const load = useCallback(async () => {
    const c = await db.getFirstAsync('SELECT * FROM classes WHERE id = ?', cid);
    const termList = await db.getAllAsync('SELECT * FROM terms WHERE class_id = ? ORDER BY id DESC', cid);
    const active =
      termList.find((x) => x.id === viewTermId) ||
      termList.find((x) => x.is_current === 1) ||
      termList[0] ||
      null;

    const subs = await db.getAllAsync('SELECT * FROM subjects WHERE class_id = ? ORDER BY id', cid);
    const studs = await db.getAllAsync('SELECT * FROM students WHERE class_id = ?', cid);
    const scores = active
      ? await db.getAllAsync('SELECT * FROM scores WHERE term_id = ?', active.id)
      : [];

    const result = computeResults(studs, subs, scores);
    setCls(c);
    setTerms(termList);
    setActiveTerm(active);
    setSubjects(subs);
    setRows(result.rows);
    setMaxTotal(result.maxTotal);
    setPassMark(result.passMark);
  }, [db, cid, viewTermId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const complete = rows.filter((r) => r.missing === 0);
  const passedCount = complete.filter((r) => r.passed).length;
  const failedCount = complete.filter((r) => !r.passed).length;
  const incompleteCount = rows.length - complete.length;

  async function exportPdf() {
    if (!cls) return;
    setBusy(true);
    const html = classReportHtml({ cls, term: activeTerm, subjects, rows, maxTotal, passMark });
    const termName = activeTerm ? activeTerm.name : 'results';
    await sharePdf(
      html,
      `${cls.name}_${termName}_class_report`,
      `${cls.name} class report`,
      subjects.length > 4 ? { width: 842, height: 595 } : undefined
    );
    setBusy(false);
  }

  function openStudent(studentId) {
    router.push({
      pathname: '/student-report',
      params: {
        classId: String(cid),
        studentId: String(studentId),
        termId: activeTerm ? String(activeTerm.id) : '',
      },
    });
  }

  function statusStyle(status) {
    if (status === 'Pass') return { color: theme.greenDark };
    if (status === 'Fail') return { color: theme.danger };
    return { color: '#8A6100' };
  }

  if (subjects.length === 0 || rows.length === 0) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title: 'Results' }} />
        <Text style={styles.msg}>Add subjects and students, then enter marks, to see the results.</Text>
      </View>
    );
  }

  const termLabel = activeTerm ? [activeTerm.name, activeTerm.year].filter(Boolean).join(' ') : '';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Results' }} />

      <View style={styles.header}>
        <Text style={styles.title}>{cls ? cls.name : ''}</Text>
        <Text style={styles.sub}>{termLabel}{activeTerm && activeTerm.is_current === 1 ? '  (current term)' : '  (past term)'}</Text>
        <Text style={styles.sub}>
          {rows.length} students  •  {subjects.length} subjects  •  Total {maxTotal}  •  Pass mark {passMark}
        </Text>
      </View>

      {terms.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {terms.map((x) => (
            <Pressable
              key={x.id}
              style={[styles.chip, activeTerm && x.id === activeTerm.id && styles.chipOn]}
              onPress={() => setViewTermId(x.id)}
            >
              <Text style={[styles.chipText, activeTerm && x.id === activeTerm.id && styles.chipTextOn]}>
                {[x.name, x.year].filter(Boolean).join(' ')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: theme.green }]}>
          <Text style={[styles.statNum, { color: theme.greenDark }]}>{passedCount}</Text>
          <Text style={styles.statLabel}>Passed</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: '#FDECEA' }]}>
          <Text style={[styles.statNum, { color: theme.danger }]}>{failedCount}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
        {incompleteCount > 0 && (
          <View style={[styles.stat, { backgroundColor: '#FFF4D6' }]}>
            <Text style={[styles.statNum, { color: '#8A6100' }]}>{incompleteCount}</Text>
            <Text style={styles.statLabel}>Incomplete</Text>
          </View>
        )}
      </View>

      <Pressable style={[styles.pdfBtn, busy && { opacity: 0.6 }]} onPress={exportPdf} disabled={busy}>
        <Ionicons name="share-outline" size={22} color="#fff" />
        <Text style={styles.pdfText}>{busy ? 'Creating PDF...' : 'Share class report (PDF)'}</Text>
      </Pressable>

      {incompleteCount > 0 && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            {incompleteCount} student{incompleteCount > 1 ? 's have' : ' has'} missing marks. A missing mark counts
            as 0, and Pass/Fail shows once all marks are entered.
          </Text>
        </View>
      )}

      <View style={styles.toggle}>
        <Pressable style={[styles.toggleBtn, view === 'totals' && styles.toggleOn]} onPress={() => setView('totals')}>
          <Text style={[styles.toggleText, view === 'totals' && styles.toggleTextOn]}>Totals</Text>
        </Pressable>
        <Pressable style={[styles.toggleBtn, view === 'full' && styles.toggleOn]} onPress={() => setView('full')}>
          <Text style={[styles.toggleText, view === 'full' && styles.toggleTextOn]}>Full report</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>Tap a student to open their individual report.</Text>

      {view === 'totals' ? (
        <View style={styles.table}>
          <View style={[styles.row, styles.headRow]}>
            <Text style={[styles.cell, styles.pos, styles.headText]}>Pos</Text>
            <Text style={[styles.cell, styles.nameCol, styles.headText]}>Name</Text>
            <Text style={[styles.cell, styles.gen, styles.headText]}>Sex</Text>
            <Text style={[styles.cell, styles.totalCol, styles.headText]}>Total</Text>
            <Text style={[styles.cell, styles.resultCol, styles.headText]}>Result</Text>
          </View>
          {rows.map((r, i) => {
            const status = resultStatus(r);
            return (
              <Pressable
                key={r.studentId}
                style={[styles.row, i % 2 === 1 && styles.altRow]}
                onPress={() => openStudent(r.studentId)}
              >
                <Text style={[styles.cell, styles.pos, styles.bold]}>{r.rank}</Text>
                <Text style={[styles.cell, styles.nameCol]} numberOfLines={2}>{r.name}</Text>
                <Text style={[styles.cell, styles.gen]}>{r.gender}</Text>
                <Text style={[styles.cell, styles.totalCol, styles.bold]}>{r.total}/{maxTotal}</Text>
                <Text style={[styles.cell, styles.resultCol, styles.bold, statusStyle(status)]}>{status}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator style={styles.table}>
          <View>
            <View style={[styles.row, styles.headRow]}>
              <Text style={[styles.cell, styles.pos, styles.headText]}>Pos</Text>
              <Text style={[styles.cell, styles.fullName, styles.headText]}>Name</Text>
              {subjects.map((s) => (
                <Text key={s.id} style={[styles.cell, styles.markCol, styles.headText]} numberOfLines={2}>
                  {s.name}{'\n'}/{s.max_score}
                </Text>
              ))}
              <Text style={[styles.cell, styles.fullTotal, styles.headText]}>Total</Text>
              <Text style={[styles.cell, styles.pctCol, styles.headText]}>%</Text>
              <Text style={[styles.cell, styles.gradeCol, styles.headText]}>Grade</Text>
              <Text style={[styles.cell, styles.fullResult, styles.headText]}>Result</Text>
            </View>
            {rows.map((r, i) => {
              const status = resultStatus(r);
              return (
                <Pressable
                  key={r.studentId}
                  style={[styles.row, i % 2 === 1 && styles.altRow]}
                  onPress={() => openStudent(r.studentId)}
                >
                  <Text style={[styles.cell, styles.pos, styles.bold]}>{r.rank}</Text>
                  <Text style={[styles.cell, styles.fullName]} numberOfLines={2}>{r.name}</Text>
                  {subjects.map((s, j) => {
                    const m = r.marks[j];
                    return (
                      <Text key={s.id} style={[styles.cell, styles.markCol, m === null && { color: theme.danger }]}>
                        {m === null ? '-' : `${m} (${gradeForMark(m, s.max_score)})`}
                      </Text>
                    );
                  })}
                  <Text style={[styles.cell, styles.fullTotal, styles.bold]}>{r.total}/{maxTotal}</Text>
                  <Text style={[styles.cell, styles.pctCol]}>{r.percentage.toFixed(1)}</Text>
                  <Text style={[styles.cell, styles.gradeCol, styles.bold]}>{r.grade}</Text>
                  <Text style={[styles.cell, styles.fullResult, styles.bold, statusStyle(status)]}>{status}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View style={styles.keyCard}>
        <Text style={styles.keyTitle}>Grade key</Text>
        {GRADE_SCALE.map((g) => (
          <Text key={g.value} style={styles.keyLine}>
            Grade {g.value}  •  {g.label}  •  {g.range}
          </Text>
        ))}
      </View>

      <Pressable
        style={styles.newTermBtn}
        onPress={() => router.push({ pathname: '/new-term', params: { classId: String(cid) } })}
      >
        <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
        <Text style={styles.newTermText}>Start new term</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  centerMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  msg: { textAlign: 'center', fontSize: 16, color: theme.muted },
  header: { backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', gap: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: theme.text },
  sub: { color: theme.muted, textAlign: 'center' },
  chips: { gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#DDEBFA' },
  chipOn: { backgroundColor: theme.primary },
  chipText: { fontWeight: 'bold', color: theme.text },
  chipTextOn: { color: '#fff' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: theme.text, fontWeight: '600' },
  pdfBtn: {
    backgroundColor: theme.purpleDark, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  pdfText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  warn: { backgroundColor: '#FFF4D6', padding: 10, borderRadius: 10 },
  warnText: { color: '#8A6100', textAlign: 'center' },
  toggle: { flexDirection: 'row', backgroundColor: '#DDEBFA', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleOn: { backgroundColor: theme.primary },
  toggleText: { fontWeight: 'bold', color: theme.text },
  toggleTextOn: { color: '#fff' },
  hint: { textAlign: 'center', color: theme.muted, fontSize: 13 },
  table: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  headRow: { backgroundColor: theme.header },
  altRow: { backgroundColor: '#F2F8FE' },
  cell: { paddingVertical: 11, paddingHorizontal: 4, textAlign: 'center', color: theme.text },
  headText: { color: '#fff', fontWeight: 'bold' },
  pos: { width: 40 },
  nameCol: { flex: 1, textAlign: 'left' },
  gen: { width: 34 },
  totalCol: { width: 82 },
  resultCol: { width: 82 },
  fullName: { width: 150, textAlign: 'left' },
  markCol: { width: 78 },
  fullTotal: { width: 82 },
  pctCol: { width: 58 },
  gradeCol: { width: 56 },
  fullResult: { width: 90 },
  bold: { fontWeight: 'bold' },
  keyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  keyTitle: { fontWeight: 'bold', color: theme.text, marginBottom: 2 },
  keyLine: { color: theme.text },
  newTermBtn: {
    borderWidth: 1.5, borderColor: theme.primary, borderRadius: 12, padding: 14, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  newTermText: { color: theme.primary, fontWeight: 'bold', fontSize: 16 },
});
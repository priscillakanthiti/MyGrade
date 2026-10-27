import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter, Stack } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { computeResults } from '../utils/ranking';
import { resultStatus } from '../utils/format';
import { gradeForMark } from '../utils/grading';
import { classReportHtml, sharePdf, printReport } from '../utils/reports';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import Notice from '../components/Notice';
import Segmented from '../components/Segmented';
import StatTile from '../components/StatTile';
import GradeKey from '../components/GradeKey';
import styles from '../styles/results.styles';
import { colors } from '../theme';

const VIEWS = [
  { label: 'Totals', value: 'totals' },
  { label: 'Full report', value: 'full' },
];

function statusColor(status) {
  if (status === 'Pass') return colors.success;
  if (status === 'Fail') return colors.danger;
  return colors.warning;
}

export default function Results() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId, t } = useLocalSearchParams();
  const { schoolName, teacherName } = useAuth();
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
    const html = classReportHtml({
      cls, term: activeTerm, subjects, rows, maxTotal, passMark, schoolName, teacherName,
    });
    const termName = activeTerm ? activeTerm.name : 'results';
    await sharePdf(
      html,
      `${cls.name}_${termName}_class_report`,
      `${cls.name} class report`,
      subjects.length > 4 ? { width: 842, height: 595 } : undefined
    );
    setBusy(false);
  }

  async function printClass() {
    if (!cls) return;
    await printReport(
      classReportHtml({
        cls, term: activeTerm, subjects, rows, maxTotal, passMark, schoolName, teacherName,
      })
    );
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

  if (subjects.length === 0 || rows.length === 0) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title: 'Results' }} />
        <Text style={styles.msg}>Add subjects and students, then enter marks, to see the results.</Text>
      </View>
    );
  }

  const termLabel = activeTerm ? [activeTerm.name, activeTerm.year].filter(Boolean).join(' ') : '';
  const isCurrent = !!activeTerm && activeTerm.is_current === 1;
  const termOptions = terms.map((x) => ({
    label: [x.name, x.year].filter(Boolean).join(' '),
    value: x.id,
  }));

  return (
    <Page>
      <Stack.Screen options={{ title: 'Results' }} />

      <View style={styles.header}>
        <Text style={styles.title}>{cls ? cls.name : ''}</Text>
        <Text style={styles.sub}>{termLabel}</Text>
        <View
          style={[
            styles.termTag,
            { backgroundColor: isCurrent ? colors.successSoft : colors.primarySoft },
          ]}
        >
          <Text
            style={[
              styles.termTagText,
              { color: isCurrent ? colors.success : colors.primaryDark },
            ]}
          >
            {isCurrent ? 'CURRENT TERM' : 'PAST TERM'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{rows.length}</Text>
            <Text style={styles.metaLabel}>Students</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{subjects.length}</Text>
            <Text style={styles.metaLabel}>Subjects</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{maxTotal}</Text>
            <Text style={styles.metaLabel}>Total</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{passMark}</Text>
            <Text style={styles.metaLabel}>Pass mark</Text>
          </View>
        </View>
      </View>

      {terms.length > 1 && (
        <Segmented
          scroll
          options={termOptions}
          value={activeTerm ? activeTerm.id : null}
          onChange={setViewTermId}
        />
      )}

      <View style={styles.statsRow}>
        <StatTile value={passedCount} label="Passed" tone="success" />
        <StatTile value={failedCount} label="Failed" tone="danger" />
        {incompleteCount > 0 && (
          <StatTile value={incompleteCount} label="Incomplete" tone="warning" />
        )}
      </View>

      <AppButton
        icon="analytics-outline"
        title="Class statistics and charts"
        onPress={() =>
          router.push({
            pathname: '/class-stats',
            params: { classId: String(cid), termId: activeTerm ? String(activeTerm.id) : '' },
          })
        }
      />

      <AppButton
        variant="navy"
        icon="share-outline"
        title={busy ? 'Creating PDF...' : 'Share class report (PDF)'}
        onPress={exportPdf}
        loading={busy}
      />
      <AppButton variant="secondary" icon="print-outline" title="Print class report" onPress={printClass} />

      {incompleteCount > 0 && (
        <Notice tone="warning">
          {incompleteCount} student{incompleteCount > 1 ? 's have' : ' has'} missing marks. A missing mark counts
          as 0, and Pass/Fail shows once all marks are entered.
        </Notice>
      )}

      <Segmented options={VIEWS} value={view} onChange={setView} />

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
                style={({ pressed }) => [styles.row, i % 2 === 1 && styles.altRow, pressed && styles.pressed]}
                onPress={() => openStudent(r.studentId)}
              >
                <Text style={[styles.cell, styles.pos, styles.bold]}>{r.rank}</Text>
                <Text style={[styles.cell, styles.nameCol]} numberOfLines={2}>{r.name}</Text>
                <Text style={[styles.cell, styles.gen]}>{r.gender}</Text>
                <Text style={[styles.cell, styles.totalCol, styles.bold]}>{r.total}/{maxTotal}</Text>
                <Text style={[styles.cell, styles.resultCol, styles.bold, { color: statusColor(status) }]}>
                  {status}
                </Text>
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
                  style={({ pressed }) => [styles.row, i % 2 === 1 && styles.altRow, pressed && styles.pressed]}
                  onPress={() => openStudent(r.studentId)}
                >
                  <Text style={[styles.cell, styles.pos, styles.bold]}>{r.rank}</Text>
                  <Text style={[styles.cell, styles.fullName]} numberOfLines={2}>{r.name}</Text>
                  {subjects.map((s, j) => {
                    const m = r.marks[j];
                    return (
                      <Text key={s.id} style={[styles.cell, styles.markCol, m === null && styles.missing]}>
                        {m === null ? '-' : `${m} (${gradeForMark(m, s.max_score)})`}
                      </Text>
                    );
                  })}
                  <Text style={[styles.cell, styles.fullTotal, styles.bold]}>{r.total}/{maxTotal}</Text>
                  <Text style={[styles.cell, styles.pctCol]}>{r.percentage.toFixed(1)}</Text>
                  <Text style={[styles.cell, styles.gradeCol, styles.bold]}>{r.grade}</Text>
                  <Text style={[styles.cell, styles.fullResult, styles.bold, { color: statusColor(status) }]}>
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      <GradeKey />

      <AppButton
        variant="secondary"
        icon="add-circle-outline"
        title="Start new term"
        onPress={() => router.push({ pathname: '/new-term', params: { classId: String(cid) } })}
      />
    </Page>
  );
}

import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { computeResults } from '../utils/ranking';
import { resultStatus } from '../utils/format';
import { gradeForMark, gradeLabel } from '../utils/grading';
import { studentReportHtml, sharePdf } from '../utils/reports';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import Notice from '../components/Notice';
import StatTile from '../components/StatTile';
import GradeKey from '../components/GradeKey';
import styles from '../styles/results.styles';

export default function StudentReport() {
  const db = useSQLiteContext();
  const { classId, studentId, termId } = useLocalSearchParams();
  const cid = Number(classId);
  const stid = Number(studentId);
  const tid = termId ? Number(termId) : null;

  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const cls = await db.getFirstAsync('SELECT * FROM classes WHERE id = ?', cid);
    const term = tid
      ? await db.getFirstAsync('SELECT * FROM terms WHERE id = ?', tid)
      : await db.getFirstAsync('SELECT * FROM terms WHERE class_id = ? AND is_current = 1', cid);
    const subjects = await db.getAllAsync('SELECT * FROM subjects WHERE class_id = ? ORDER BY id', cid);
    const students = await db.getAllAsync('SELECT * FROM students WHERE class_id = ?', cid);
    const scores = term
      ? await db.getAllAsync('SELECT * FROM scores WHERE term_id = ?', term.id)
      : [];
    const result = computeResults(students, subjects, scores);
    const row = result.rows.find((r) => r.studentId === stid);
    setData({
      cls, term, subjects, row,
      classSize: result.rows.length,
      maxTotal: result.maxTotal,
      passMark: result.passMark,
    });
  }, [db, cid, stid, tid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function exportPdf() {
    if (!data || !data.row) return;
    setBusy(true);
    await sharePdf(
      studentReportHtml(data),
      `${data.row.name}_report`,
      `${data.row.name} report`
    );
    setBusy(false);
  }

  if (!data || !data.row) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title: 'Student Report' }} />
        <Text style={styles.msg}>Loading...</Text>
      </View>
    );
  }

  const { cls, term, subjects, row, classSize, maxTotal, passMark } = data;
  const status = resultStatus(row);
  const statusTone = status === 'Pass' ? 'success' : status === 'Fail' ? 'danger' : 'warning';
  const termLabel = term ? [term.name, term.year].filter(Boolean).join(' ') : '';

  return (
    <Page>
      <Stack.Screen options={{ title: row.name }} />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{row.name.trim().charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{row.name}</Text>
        <Text style={styles.sub}>
          {cls.name}  |  {row.gender === 'M' ? 'Male' : 'Female'}  |  {termLabel}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile value={`${row.rank}/${classSize}`} label="Position" tone="primary" />
        <StatTile value={`${row.percentage.toFixed(1)}%`} label={`Grade ${row.grade}`} tone="accent" />
        <StatTile value={status} label="Result" tone={statusTone} />
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.headRow]}>
          <Text style={[styles.cell, styles.subjectCol, styles.headText]}>Subject</Text>
          <Text style={[styles.cell, styles.reportMark, styles.headText]}>Mark</Text>
          <Text style={[styles.cell, styles.reportGrade, styles.headText]}>Grade</Text>
        </View>
        {subjects.map((s, i) => {
          const m = row.marks[i];
          const g = gradeForMark(m, s.max_score);
          return (
            <View key={s.id} style={[styles.row, i % 2 === 1 && styles.altRow]}>
              <Text style={[styles.cell, styles.subjectCol]}>{s.name}</Text>
              <Text style={[styles.cell, styles.reportMark, m === null && styles.missing]}>
                {m === null ? '-' : `${m}/${s.max_score}`}
              </Text>
              <Text style={[styles.cell, styles.reportGrade]}>
                {g === null ? '-' : `${g}  ${gradeLabel(g)}`}
              </Text>
            </View>
          );
        })}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.cell, styles.subjectCol, styles.bold]}>TOTAL</Text>
          <Text style={[styles.cell, styles.reportMark, styles.bold]}>{row.total}/{maxTotal}</Text>
          <Text style={[styles.cell, styles.reportGrade, styles.bold]}>
            {row.grade}  {gradeLabel(row.grade)}
          </Text>
        </View>
      </View>

      <Text style={styles.note}>Pass mark: {passMark} (half of the total marks)</Text>

      {row.missing > 0 && (
        <Notice tone="warning">
          {row.missing} subject{row.missing > 1 ? 's have' : ' has'} no mark yet. Missing marks count as 0.
        </Notice>
      )}

      <GradeKey />

      <AppButton
        variant="navy"
        icon="share-outline"
        title={busy ? 'Creating PDF...' : 'Share student report (PDF)'}
        onPress={exportPdf}
        loading={busy}
      />
    </Page>
  );
}

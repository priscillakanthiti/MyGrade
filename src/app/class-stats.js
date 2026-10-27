import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { computeResults } from '../utils/ranking';
import { overview, genderStats, subjectStats, fmt } from '../utils/stats';
import Page from '../components/Page';
import StatTile from '../components/StatTile';
import SectionTitle from '../components/SectionTitle';
import Notice from '../components/Notice';
import styles from '../styles/stats.styles';
import { colors } from '../theme';

function barColor(pct) {
  if (pct === null || pct === undefined) return colors.borderStrong;
  if (pct >= 70) return colors.success;
  if (pct >= 50) return colors.primary;
  return colors.danger;
}

function Bar({ pct, color }) {
  const w = pct === null || pct === undefined ? 0 : Math.max(2, Math.min(100, pct));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${w}%`, backgroundColor: color || barColor(pct) }]} />
    </View>
  );
}

function names(list) {
  if (!list || list.length === 0) return '';
  return list.length > 2 ? `${list[0]}, ${list[1]} and ${list.length - 2} more` : list.join(' and ');
}

export default function ClassStats() {
  const db = useSQLiteContext();
  const { classId, termId } = useLocalSearchParams();
  const cid = Number(classId);
  const tid = termId ? Number(termId) : null;

  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const cls = await db.getFirstAsync('SELECT * FROM classes WHERE id = ?', cid);
    const term = tid
      ? await db.getFirstAsync('SELECT * FROM terms WHERE id = ?', tid)
      : await db.getFirstAsync('SELECT * FROM terms WHERE class_id = ? AND is_current = 1', cid);
    const subjects = await db.getAllAsync('SELECT * FROM subjects WHERE class_id = ? ORDER BY id', cid);
    const students = await db.getAllAsync('SELECT * FROM students WHERE class_id = ?', cid);
    const scores = term ? await db.getAllAsync('SELECT * FROM scores WHERE term_id = ?', term.id) : [];
    const result = computeResults(students, subjects, scores);
    setData({
      cls, term, subjects,
      rows: result.rows,
      overall: overview(result.rows, subjects),
      gender: genderStats(result.rows, subjects),
      perSubject: subjectStats(result.rows, subjects),
    });
  }, [db, cid, tid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!data) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title: 'Class Statistics' }} />
        <Text style={styles.msg}>Loading...</Text>
      </View>
    );
  }

  const { cls, term, subjects, rows, overall, gender, perSubject } = data;
  const termLabel = term ? [term.name, term.year].filter(Boolean).join(' ') : '';
  const hasMarks = perSubject.some((p) => p.entered > 0);

  if (subjects.length === 0 || rows.length === 0 || !hasMarks) {
    return (
      <View style={styles.centerMsg}>
        <Stack.Screen options={{ title: 'Class Statistics' }} />
        <Text style={styles.msg}>
          Add students and subjects, then enter some marks, to see the class statistics.
        </Text>
      </View>
    );
  }

  const noBoysOrGirls = gender.M.count === 0 || gender.F.count === 0;

  return (
    <Page>
      <Stack.Screen options={{ title: 'Class Statistics' }} />

      <View style={styles.header}>
        <Text style={styles.title}>{cls ? cls.name : ''}</Text>
        <Text style={styles.sub}>{termLabel}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile value={overall.students} label="Students" tone="primary" />
        <StatTile value={overall.average === null ? '-' : `${fmt(overall.average)}%`} label="Class average" tone="accent" />
        <StatTile
          value={overall.passRate === null ? '-' : `${fmt(overall.passRate, 0)}%`}
          label="Pass rate"
          tone="success"
        />
      </View>

      {overall.completeCount < rows.length && (
        <Notice tone="info">
          Averages use the marks entered so far. Pass rate counts only students with all marks entered.
        </Notice>
      )}

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Boys and girls</Text>
          <Text style={styles.cardSub}>Average percentage and pass rate by gender.</Text>
        </View>
        <View style={styles.twoCols}>
          <View style={styles.genderCol}>
            <Text style={styles.genderName}>Boys ({gender.M.count})</Text>
            <Text style={[styles.bigNumber, { color: colors.primary }]}>
              {gender.M.average === null ? '-' : `${fmt(gender.M.average)}%`}
            </Text>
            <Bar pct={gender.M.average} color={colors.primary} />
            <Text style={styles.smallLine}>
              Pass rate: {gender.M.passRate === null ? '-' : `${fmt(gender.M.passRate, 0)}%`}
            </Text>
          </View>
          <View style={styles.genderCol}>
            <Text style={styles.genderName}>Girls ({gender.F.count})</Text>
            <Text style={[styles.bigNumber, { color: colors.accent }]}>
              {gender.F.average === null ? '-' : `${fmt(gender.F.average)}%`}
            </Text>
            <Bar pct={gender.F.average} color={colors.accent} />
            <Text style={styles.smallLine}>
              Pass rate: {gender.F.passRate === null ? '-' : `${fmt(gender.F.passRate, 0)}%`}
            </Text>
          </View>
        </View>
        {noBoysOrGirls && (
          <Text style={styles.cardSub}>A comparison needs at least one boy and one girl in the class.</Text>
        )}
      </View>

      <SectionTitle title="Subject performance" meta={`${subjects.length} subjects`} />

      {perSubject.map((p) => (
        <View key={p.subject.id} style={styles.card}>
          <View style={styles.subjectHead}>
            <Text style={styles.subjectName} numberOfLines={1}>{p.subject.name}</Text>
            <View style={[styles.tag, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.tagText, { color: colors.primaryDark }]}>Out of {p.subject.max_score}</Text>
            </View>
          </View>

          {p.entered === 0 ? (
            <Text style={styles.cardSub}>No marks entered yet.</Text>
          ) : (
            <>
              <View style={styles.avgRow}>
                <Text style={styles.avgText}>
                  Average mark: {fmt(p.average)} of {p.subject.max_score}
                </Text>
                <Text style={[styles.avgPct, { color: barColor(p.averagePct) }]}>{fmt(p.averagePct, 0)}%</Text>
              </View>
              <Bar pct={p.averagePct} />

              <View style={styles.factRow}>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Highest</Text>
                  <Text style={[styles.factValue, { color: colors.success }]}>{p.highest}</Text>
                  <Text style={styles.factName} numberOfLines={2}>{names(p.highestNames)}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Lowest</Text>
                  <Text style={[styles.factValue, { color: colors.danger }]}>{p.lowest}</Text>
                  <Text style={styles.factName} numberOfLines={2}>{names(p.lowestNames)}</Text>
                </View>
              </View>

              <Text style={styles.genderLine}>
                Boys {p.boysPct === null ? '-' : `${fmt(p.boysPct, 0)}%`}   |   Girls{' '}
                {p.girlsPct === null ? '-' : `${fmt(p.girlsPct, 0)}%`}   |   {p.entered} of {rows.length} marks entered
              </Text>
            </>
          )}
        </View>
      ))}
    </Page>
  );
}

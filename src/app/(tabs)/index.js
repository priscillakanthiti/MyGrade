import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import BlueHeader from '../../components/BlueHeader';
import SchoolLogo from '../../components/SchoolLogo';
import Page from '../../components/Page';
import Dropdown from '../../components/Dropdown';
import StatTile from '../../components/StatTile';
import SectionTitle from '../../components/SectionTitle';
import EmptyState from '../../components/EmptyState';
import { useSelectedClass } from '../../state/ClassContext';
import { iconTones, common } from '../../styles/components.styles';
import styles from '../../styles/home.styles';
import { colors } from '../../theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const ACTIONS = [
  {
    key: 'students',
    title: 'Students',
    sub: 'Add, view and manage the class list',
    icon: 'people-outline',
    path: '/students',
    tone: 'primary',
  },
  {
    key: 'subjects',
    title: 'Subjects and marks',
    sub: 'Set up subjects and enter marks',
    icon: 'book-outline',
    path: '/subjects',
    tone: 'success',
  },
  {
    key: 'results',
    title: 'Results',
    sub: 'Rankings, grades and PDF reports',
    icon: 'stats-chart-outline',
    path: '/results',
    tone: 'accent',
  },
];

export default function Home() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { teacherId, teacherName } = useAuth();
  const { selectedClassId, setSelectedClassId } = useSelectedClass();

  const [classes, setClasses] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);

  const current =
    classes.find((c) => c.id === selectedClassId) || classes[0] || null;

  const load = useCallback(async () => {
    const list = await db.getAllAsync(
      'SELECT * FROM classes WHERE teacher_id = ? ORDER BY id DESC',
      teacherId,
    );
    setClasses(list);
    const cur = list.find((c) => c.id === selectedClassId) || list[0] || null;
    if (cur && cur.id !== selectedClassId) setSelectedClassId(cur.id);
    if (cur) {
      const st = await db.getFirstAsync(
        'SELECT COUNT(*) AS n FROM students WHERE class_id = ?',
        cur.id,
      );
      const su = await db.getFirstAsync(
        'SELECT COUNT(*) AS n FROM subjects WHERE class_id = ?',
        cur.id,
      );
      setStudentCount(st ? st.n : 0);
      setSubjectCount(su ? su.n : 0);
    } else {
      setStudentCount(0);
      setSubjectCount(0);
    }
  }, [db, teacherId, selectedClassId, setSelectedClassId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function go(path) {
    if (!current) return;
    router.push({ pathname: path, params: { classId: String(current.id) } });
  }

  return (
    <View style={common.screen}>
      <BlueHeader title="Dashboard" subtitle="My Grade App" />
      <Page>
        <View style={styles.greetRow}>
          <View style={styles.greetTexts}>
            <Text style={styles.greetSmall}>{greeting()}</Text>
            <Text style={styles.greetName} numberOfLines={1}>{teacherName}</Text>
            <Text style={styles.greetSchool}>Catholic Institute Primary School</Text>
          </View>
          <View style={styles.logoBox}>
            <SchoolLogo size={46} />
          </View>
        </View>

        {current ? (
          <>
            <View style={styles.panel}>
              <Dropdown
                label="Active class"
                icon="school-outline"
                value={current.id}
                options={classes.map((c) => ({ label: c.name, value: c.id }))}
                onChange={(id) => setSelectedClassId(id)}
              />
              <View style={styles.statsRow}>
                <StatTile value={studentCount} label="Students" tone="primary" />
                <StatTile value={subjectCount} label="Subjects" tone="accent" />
              </View>
            </View>

            <SectionTitle title="Quick access" />
            {ACTIONS.map((a) => {
              const t = iconTones[a.tone];
              return (
                <Pressable
                  key={a.key}
                  style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
                  onPress={() => go(a.path)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: t.bg }]}>
                    <Ionicons name={a.icon} size={24} color={t.fg} />
                  </View>
                  <View style={styles.actionTexts}>
                    <Text style={styles.actionTitle}>{a.title}</Text>
                    <Text style={styles.actionSub}>{a.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>
              );
            })}
          </>
        ) : (
          <EmptyState
            icon="school-outline"
            title="No class yet"
            actionTitle="Register Class"
            onAction={() => router.push('/register-class')}
          >
            Register your first class to start managing students and results.
          </EmptyState>
        )}

        <Text style={styles.footer}>Better Data. Better Decisions. Better Learning.</Text>
      </Page>
    </View>
  );
}

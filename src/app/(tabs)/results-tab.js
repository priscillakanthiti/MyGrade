import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import BlueHeader from '../../components/BlueHeader';
import Page from '../../components/Page';
import SectionTitle from '../../components/SectionTitle';
import EmptyState from '../../components/EmptyState';
import { common } from '../../styles/components.styles';
import styles from '../../styles/classes.styles';
import { badgeColors, colors } from '../../theme';
import { badgeText } from '../../utils/format';

export default function ResultsTab() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { teacherId } = useAuth();
  const [classes, setClasses] = useState([]);
  const [termsByClass, setTermsByClass] = useState({});

  const load = useCallback(async () => {
    const list = await db.getAllAsync(
      'SELECT * FROM classes WHERE teacher_id = ? ORDER BY id DESC',
      teacherId,
    );
    const map = {};
    for (const c of list) {
      map[c.id] = await db.getAllAsync('SELECT * FROM terms WHERE class_id = ? ORDER BY id', c.id);
    }
    setClasses(list);
    setTermsByClass(map);
  }, [db, teacherId]);

  function openResults(classId, termId) {
    router.push({
      pathname: '/results',
      params: { classId: String(classId), termId: termId ? String(termId) : '' },
    });
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={common.screen}>
      <BlueHeader title="Results" subtitle="Rankings, grades and reports" />
      <Page>
        <SectionTitle title="Choose a class" meta="Open its results" />

        {classes.length === 0 && (
          <EmptyState icon="stats-chart-outline" title="No classes yet">
            Register a class and enter marks to see results here.
          </EmptyState>
        )}

        {classes.map((c, i) => {
          const color = badgeColors[i % badgeColors.length];
          const terms = termsByClass[c.id] || [];
          return (
            <View key={c.id} style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <Pressable
                style={({ pressed }) => [styles.termHeader, pressed && styles.pressed]}
                onPress={() => openResults(c.id, null)}
              >
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.badgeText, { color: color.fg }]}>{badgeText(c.name)}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Text style={styles.cardMeta}>
                    {terms.length} {terms.length === 1 ? 'term' : 'terms'} recorded
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </Pressable>

              <View style={styles.termRow}>
                {terms.map((t) => (
                  <Pressable
                    key={t.id}
                    style={({ pressed }) => [
                      styles.termChip,
                      t.is_current === 1 && styles.termChipCurrent,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => openResults(c.id, t.id)}
                  >
                    <Text style={[styles.termChipText, t.is_current === 1 && styles.termChipTextCurrent]}>
                      {[t.name, t.year].filter(Boolean).join(' ')} results
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </Page>
    </View>
  );
}

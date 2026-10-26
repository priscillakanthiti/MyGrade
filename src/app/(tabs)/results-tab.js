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

  const load = useCallback(async () => {
    setClasses(
      await db.getAllAsync(
        'SELECT * FROM classes WHERE teacher_id = ? ORDER BY id DESC',
        teacherId,
      ),
    );
  }, [db, teacherId]);

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
          return (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: '/results',
                  params: { classId: String(c.id) },
                })
              }
            >
              <View style={[styles.badge, { backgroundColor: color.bg }]}>
                <Text style={[styles.badgeText, { color: color.fg }]}>{badgeText(c.name)}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.cardMeta}>{[c.term, c.year].filter(Boolean).join('  |  ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          );
        })}
      </Page>
    </View>
  );
}

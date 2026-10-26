import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import BlueHeader from '../../components/BlueHeader';
import Page from '../../components/Page';
import AppButton from '../../components/AppButton';
import SectionTitle from '../../components/SectionTitle';
import EmptyState from '../../components/EmptyState';
import { useSelectedClass } from '../../state/ClassContext';
import { common } from '../../styles/components.styles';
import styles from '../../styles/classes.styles';
import { badgeColors, colors } from '../../theme';
import { badgeText } from '../../utils/format';

export default function Classes() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { teacherId } = useAuth();
  const { setSelectedClassId } = useSelectedClass();
  const [classes, setClasses] = useState([]);

  const load = useCallback(async () => {
    setClasses(
      await db.getAllAsync(
        `SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
         FROM classes c WHERE c.teacher_id = ? ORDER BY c.id DESC`,
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
      <BlueHeader
        title="My Classes"
        subtitle="Manage the classes you teach"
        right={{ icon: 'add', onPress: () => router.push('/register-class') }}
      />
      <Page>
        <AppButton
          variant="soft"
          icon="add-circle-outline"
          title="Register a new class"
          onPress={() => router.push('/register-class')}
        />

        <SectionTitle
          title="All classes"
          meta={`${classes.length} ${classes.length === 1 ? 'class' : 'classes'}`}
        />

        {classes.length === 0 && (
          <EmptyState icon="school-outline" title="No classes yet">
            Register a class to start adding students and subjects.
          </EmptyState>
        )}

        {classes.map((c, i) => {
          const color = badgeColors[i % badgeColors.length];
          return (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => {
                setSelectedClassId(c.id);
                router.navigate('/');
              }}
            >
              <View style={[styles.badge, { backgroundColor: color.bg }]}>
                <Text style={[styles.badgeText, { color: color.fg }]}>{badgeText(c.name)}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.cardMeta}>{[c.term, c.year].filter(Boolean).join('  |  ')}</Text>
                <View style={styles.countRow}>
                  <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.countText}>{c.student_count} students</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          );
        })}
      </Page>
    </View>
  );
}

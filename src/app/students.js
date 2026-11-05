import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Segmented from '../components/Segmented';
import StatTile from '../components/StatTile';
import SectionTitle from '../components/SectionTitle';
import EmptyState from '../components/EmptyState';
import { common } from '../styles/components.styles';
import styles from '../styles/lists.styles';
import { badgeColors, colors } from '../theme';

const GENDERS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
];

export default function Students() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const cid = Number(classId);

  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);
  const [filter, setFilter] = useState('all'); // all | M | F

  const load = useCallback(async () => {
    setStudents(
      await db.getAllAsync(
        'SELECT * FROM students WHERE class_id = ? ORDER BY name COLLATE NOCASE', cid
      )
    );
  }, [db, cid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addStudent() {
    if (!name.trim() || !gender) {
      Alert.alert('Check input', 'Enter the student name and choose Male or Female.');
      return;
    }
    await db.runAsync(
      'INSERT INTO students (class_id, name, gender) VALUES (?, ?, ?)',
      cid, name.trim(), gender
    );
    setName('');
    setGender(null);
    load();
  }

  function removeStudent(s) {
    Alert.alert('Remove student', `Remove ${s.name}? Their marks will be deleted too.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM students WHERE id = ?', s.id);
          load();
        },
      },
    ]);
  }

  const males = students.filter((s) => s.gender === 'M').length;
  const females = students.filter((s) => s.gender === 'F').length;

  const FILTERS = [
    { label: `All (${students.length})`, value: 'all' },
    { label: `Boys (${males})`, value: 'M' },
    { label: `Girls (${females})`, value: 'F' },
  ];
  const shown = filter === 'all' ? students : students.filter((s) => s.gender === filter);
  const filterWord = filter === 'M' ? 'boys' : 'girls';

  return (
    <FlatList
      style={common.flex}
      contentContainerStyle={common.listContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      data={shown}
      keyExtractor={(s) => String(s.id)}
      ListHeaderComponent={
        <View style={[common.listItem, styles.header]}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add a student</Text>
            <AppInput
              label="Full name"
              icon="person-outline"
              placeholder="Student full name"
              value={name}
              onChangeText={setName}
            />
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Gender</Text>
              <Segmented options={GENDERS} value={gender} onChange={setGender} />
            </View>
            <AppButton title="Add Student" icon="person-add-outline" onPress={addStudent} />
            <AppButton
              variant="ghost"
              title="Add with full bio data"
              icon="document-text-outline"
              onPress={() => router.push({ pathname: '/student-profile', params: { classId: String(cid) } })}
            />
          </View>

          <View style={styles.statsRow}>
            <StatTile value={students.length} label="Total" tone="primary" onPress={() => setFilter('all')} />
            <StatTile value={males} label="Male" tone="accent" onPress={() => setFilter('M')} />
            <StatTile value={females} label="Female" tone="success" onPress={() => setFilter('F')} />
          </View>

          <SectionTitle
            title="Class list"
            meta={filter === 'all' ? `${students.length} enrolled` : `${shown.length} ${filterWord}`}
          />
          <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        </View>
      }
      ListEmptyComponent={
        <View style={common.listItem}>
          {students.length === 0 ? (
            <EmptyState icon="people-outline" title="No students yet">
              Add the first student using the form above.
            </EmptyState>
          ) : (
            <EmptyState icon="people-outline" title={`No ${filterWord} in this class`}>
              Choose All to see the whole class list.
            </EmptyState>
          )}
        </View>
      }
      renderItem={({ item, index }) => {
        const color = badgeColors[index % badgeColors.length];
        return (
          <Pressable
            style={({ pressed }) => [common.listItem, styles.card, pressed && { opacity: 0.85 }]}
            onPress={() =>
              router.push({
                pathname: '/student-profile',
                params: { classId: String(cid), studentId: String(item.id) },
              })
            }
          >
            <View style={[styles.avatar, { backgroundColor: color.bg }]}>
              <Text style={[styles.avatarText, { color: color.fg }]}>
                {item.name.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
            </View>
            <View style={styles.genderChip}>
              <Text style={styles.genderText}>{item.gender === 'M' ? 'Male' : 'Female'}</Text>
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => removeStudent(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

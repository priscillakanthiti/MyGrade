import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  const { classId } = useLocalSearchParams();
  const cid = Number(classId);

  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);

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

  return (
    <FlatList
      style={common.flex}
      contentContainerStyle={common.listContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      data={students}
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
          </View>

          <View style={styles.statsRow}>
            <StatTile value={students.length} label="Total" tone="primary" />
            <StatTile value={males} label="Male" tone="accent" />
            <StatTile value={females} label="Female" tone="success" />
          </View>

          <SectionTitle title="Class list" meta={`${students.length} enrolled`} />
        </View>
      }
      ListEmptyComponent={
        <View style={common.listItem}>
          <EmptyState icon="people-outline" title="No students yet">
            Add the first student using the form above.
          </EmptyState>
        </View>
      }
      renderItem={({ item, index }) => {
        const color = badgeColors[index % badgeColors.length];
        return (
          <View style={[common.listItem, styles.card]}>
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
          </View>
        );
      }}
    />
  );
}

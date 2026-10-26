import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import SectionTitle from '../components/SectionTitle';
import EmptyState from '../components/EmptyState';
import { common } from '../styles/components.styles';
import styles from '../styles/lists.styles';
import { badgeColors, colors } from '../theme';

export default function Subjects() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const cid = Number(classId);

  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState('');
  const [total, setTotal] = useState('100');

  const load = useCallback(async () => {
    setSubjects(await db.getAllAsync('SELECT * FROM subjects WHERE class_id = ? ORDER BY id', cid));
  }, [db, cid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addSubject() {
    const max = Number(total);
    if (!name.trim() || !max || max <= 0) {
      Alert.alert('Check input', 'Enter a subject name and total marks above 0.');
      return;
    }
    await db.runAsync(
      'INSERT INTO subjects (class_id, name, max_score) VALUES (?, ?, ?)',
      cid, name.trim(), max
    );
    setName('');
    setTotal('100');
    load();
  }

  function removeSubject(s) {
    Alert.alert('Remove subject', `Remove ${s.name}? All its marks will be deleted too.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM subjects WHERE id = ?', s.id);
          load();
        },
      },
    ]);
  }

  return (
    <FlatList
      style={common.flex}
      contentContainerStyle={common.listContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      data={subjects}
      keyExtractor={(s) => String(s.id)}
      ListHeaderComponent={
        <View style={[common.listItem, styles.header]}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add a subject</Text>
            <View style={styles.formRow}>
              <AppInput
                containerStyle={styles.grow2}
                label="Subject"
                placeholder="e.g. English"
                value={name}
                onChangeText={setName}
              />
              <AppInput
                containerStyle={styles.grow1}
                label="Total marks"
                placeholder="100"
                value={total}
                onChangeText={setTotal}
                keyboardType="numeric"
              />
            </View>
            <AppButton title="Add Subject" icon="add" onPress={addSubject} />
          </View>

          <SectionTitle
            title="Subjects"
            meta={`${subjects.length} in this class`}
          />
        </View>
      }
      ListEmptyComponent={
        <View style={common.listItem}>
          <EmptyState icon="book-outline" title="No subjects yet">
            Add the subjects taught in this class, then enter marks for each one.
          </EmptyState>
        </View>
      }
      renderItem={({ item, index }) => {
        const color = badgeColors[index % badgeColors.length];
        return (
          <View style={[common.listItem, styles.card]}>
            <View style={[styles.badge, { backgroundColor: color.bg }]}>
              <Ionicons name="book-outline" size={22} color={color.fg} />
            </View>
            <View style={styles.body}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardMeta}>Out of {item.max_score}</Text>
            </View>
            <AppButton
              size="sm"
              variant="soft"
              title="Marks"
              onPress={() =>
                router.push({
                  pathname: '/marks',
                  params: { classId: String(cid), subjectId: String(item.id) },
                })
              }
            />
            <Pressable style={styles.deleteBtn} onPress={() => removeSubject(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        );
      }}
    />
  );
}

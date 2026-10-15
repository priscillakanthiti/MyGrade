import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { theme, badgeColors } from '../theme';

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
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      data={subjects}
      keyExtractor={(s) => String(s.id)}
      ListHeaderComponent={
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add a Subject</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Subject (e.g. English)"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Total"
              value={total}
              onChangeText={setTotal}
              keyboardType="numeric"
            />
          </View>
          <Pressable style={styles.addBtn} onPress={addSubject}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addText}>Add Subject</Text>
          </Pressable>
          <Text style={styles.count}>
            {subjects.length} subject{subjects.length === 1 ? '' : 's'} in this class
          </Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No subjects yet.</Text>}
      renderItem={({ item, index }) => {
        const color = badgeColors[index % badgeColors.length];
        return (
          <View style={styles.card}>
            <View style={[styles.badge, { backgroundColor: color.bg }]}>
              <Ionicons name="book" size={22} color={color.fg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.muted}>Total marks: {item.max_score}</Text>
            </View>
            <Pressable
              style={styles.marksBtn}
              onPress={() =>
                router.push({
                  pathname: '/marks',
                  params: { classId: String(cid), subjectId: String(item.id) },
                })
              }
            >
              <Text style={styles.marksText}>Enter marks</Text>
            </Pressable>
            <Pressable onPress={() => removeSubject(item)} hitSlop={10}>
              <Ionicons name="trash-outline" size={22} color={theme.danger} />
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, paddingBottom: 30 },
  formCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 10, marginBottom: 6 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: '#F7FAFE',
  },
  addBtn: {
    backgroundColor: theme.primary, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  count: { textAlign: 'center', color: theme.muted },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  badge: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  muted: { color: theme.muted },
  marksBtn: { backgroundColor: theme.greenDark, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10 },
  marksText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
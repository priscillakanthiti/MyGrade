import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { theme, badgeColors } from '../theme';

export default function Students() {
  const db = useSQLiteContext();
  const { classId } = useLocalSearchParams();
  const cid = Number(classId);

  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);
  const [open, setOpen] = useState(false);

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
      Alert.alert('Check input', 'Enter the student name and choose M or F.');
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
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      data={students}
      keyExtractor={(s) => String(s.id)}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 6 }}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add a Student</Text>
            <TextInput
              style={styles.input}
              placeholder="Student full name"
              value={name}
              onChangeText={setName}
            />

            <Pressable style={styles.dropdown} onPress={() => setOpen(!open)}>
              <Text style={{ color: gender ? theme.text : '#8A97AB', fontSize: 16 }}>
                {gender || 'Gender'}
              </Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={theme.text} />
            </Pressable>
            {open && (
              <View style={styles.options}>
                {['M', 'F'].map((g) => (
                  <Pressable
                    key={g}
                    style={styles.option}
                    onPress={() => { setGender(g); setOpen(false); }}
                  >
                    <Text style={{ fontSize: 16, color: theme.text }}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable style={styles.addBtn} onPress={addStudent}>
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.addText}>Add Student</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <View style={[styles.stat, { backgroundColor: '#DDEBFA' }]}>
              <Text style={styles.statNum}>{students.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.green }]}>
              <Text style={styles.statNum}>{males}</Text>
              <Text style={styles.statLabel}>M</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.purple }]}>
              <Text style={styles.statNum}>{females}</Text>
              <Text style={styles.statLabel}>F</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No students yet.</Text>}
      renderItem={({ item, index }) => {
        const color = badgeColors[index % badgeColors.length];
        return (
          <View style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: color.bg }]}>
              <Text style={[styles.avatarText, { color: color.fg }]}>
                {item.name.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
            <View style={styles.genderChip}>
              <Text style={styles.genderText}>{item.gender}</Text>
            </View>
            <Pressable onPress={() => removeStudent(item)} hitSlop={10}>
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
  formCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 10 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: '#F7FAFE',
  },
  dropdown: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12,
    backgroundColor: '#F7FAFE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  options: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, overflow: 'hidden' },
  option: { padding: 12, backgroundColor: '#F7FAFE', borderBottomWidth: 1, borderBottomColor: theme.border },
  addBtn: {
    backgroundColor: theme.primary, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  stat: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: 'bold', color: theme.text },
  statLabel: { color: theme.text, fontWeight: '600' },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  genderChip: { backgroundColor: '#E8EEF8', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  genderText: { fontWeight: 'bold', color: theme.text },
});
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useFocusEffect, useRouter, Stack } from 'expo-router';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Segmented from '../components/Segmented';
import styles from '../styles/bio.styles';
import { colors } from '../theme';

const GENDERS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
];

const EMPTY = {
  name: '', gender: null, admission_no: '', date_of_birth: '',
  guardian_name: '', guardian_phone: '', address: '',
};

const FIELDS = [
  { key: 'admission_no', label: 'Admission number', icon: 'id-card-outline' },
  { key: 'date_of_birth', label: 'Date of birth', icon: 'calendar-outline' },
  { key: 'guardian_name', label: 'Parent or guardian', icon: 'people-outline' },
  { key: 'guardian_phone', label: 'Guardian phone', icon: 'call-outline' },
  { key: 'address', label: 'Home address', icon: 'home-outline' },
];

// Works in two ways: with studentId it shows (and can edit) that student,
// without studentId it opens an empty form to add a new student.
export default function StudentProfile() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { classId, studentId } = useLocalSearchParams();
  const cid = Number(classId);
  const sid = studentId ? Number(studentId) : null;

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(!sid);

  const load = useCallback(async () => {
    if (!sid) return;
    const s = await db.getFirstAsync('SELECT * FROM students WHERE id = ?', sid);
    if (s) {
      setForm({
        name: s.name || '', gender: s.gender || null,
        admission_no: s.admission_no || '', date_of_birth: s.date_of_birth || '',
        guardian_name: s.guardian_name || '', guardian_phone: s.guardian_phone || '',
        address: s.address || '',
      });
    }
  }, [db, sid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (!form.name.trim() || !form.gender) {
      Alert.alert('Check input', 'Enter the student name and choose Male or Female.');
      return;
    }
    const vals = [
      form.name.trim(), form.gender, form.admission_no.trim(), form.date_of_birth.trim(),
      form.guardian_name.trim(), form.guardian_phone.trim(), form.address.trim(),
    ];
    if (sid) {
      await db.runAsync(
        `UPDATE students SET name = ?, gender = ?, admission_no = ?, date_of_birth = ?,
         guardian_name = ?, guardian_phone = ?, address = ? WHERE id = ?`,
        ...vals, sid
      );
      setEditing(false);
    } else {
      await db.runAsync(
        `INSERT INTO students (class_id, name, gender, admission_no, date_of_birth,
         guardian_name, guardian_phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        cid, ...vals
      );
      router.back();
    }
  }

  const title = sid ? form.name || 'Student Profile' : 'New Student';

  if (editing) {
    return (
      <Page>
        <Stack.Screen options={{ title }} />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{sid ? 'Edit bio data' : 'Student bio data'}</Text>
          <AppInput label="Full name" icon="person-outline" placeholder="Student full name"
            value={form.name} onChangeText={set('name')} />
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Gender</Text>
            <Segmented options={GENDERS} value={form.gender} onChange={set('gender')} />
          </View>
          {FIELDS.map((f) => (
            <AppInput
              key={f.key}
              label={f.label}
              icon={f.icon}
              placeholder={f.key === 'date_of_birth' ? 'e.g. 14 March 2015' : ''}
              keyboardType={f.key === 'guardian_phone' ? 'phone-pad' : 'default'}
              value={form[f.key]}
              onChangeText={set(f.key)}
            />
          ))}
          <View style={styles.buttons}>
            {sid ? (
              <View style={styles.grow}>
                <AppButton variant="secondary" title="Cancel"
                  onPress={() => { load(); setEditing(false); }} />
              </View>
            ) : null}
            <View style={styles.grow}>
              <AppButton title={sid ? 'Save' : 'Add Student'} icon="checkmark" onPress={save} />
            </View>
          </View>
        </View>
      </Page>
    );
  }

  return (
    <Page>
      <Stack.Screen options={{ title }} />
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{form.name.trim().charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{form.name}</Text>
        <Text style={styles.meta}>{form.gender === 'M' ? 'Male' : 'Female'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bio data</Text>
        {FIELDS.map((f, i) => (
          <View key={f.key} style={[styles.row, i === FIELDS.length - 1 && styles.rowLast]}>
            <View style={styles.rowIcon}>
              <Ionicons name={f.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{f.label}</Text>
              <Text style={[styles.rowValue, !form[f.key] && styles.rowEmpty]}>
                {form[f.key] || 'Not recorded'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <AppButton icon="create-outline" title="Edit bio data" onPress={() => setEditing(true)} />
    </Page>
  );
}

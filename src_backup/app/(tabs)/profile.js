import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import BlueHeader from '../../components/BlueHeader';
import SchoolLogo from '../../components/SchoolLogo';
import { theme } from '../../theme';

export default function Profile() {
  const router = useRouter();
  const { teacherName, logout } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BlueHeader title="Profile" />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{teacherName.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{teacherName}</Text>
          <Text style={styles.muted}>Teacher</Text>
          <View style={{ marginTop: 14, alignItems: 'center' }}>
            <SchoolLogo size={60} />
            <Text style={styles.school}>Catholic Institute Primary School</Text>
          </View>
        </View>

        <Pressable style={styles.security} onPress={() => router.push('/account-security')}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
          <Text style={styles.securityText}>Security (change PIN, recovery question)</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </Pressable>

        <Pressable style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, alignItems: 'center', gap: 4 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 8 },
  muted: { color: theme.muted },
  school: { fontWeight: 'bold', color: theme.text, marginTop: 4, textAlign: 'center' },
  security: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  securityText: { flex: 1, color: theme.text, fontWeight: '600' },
  logout: {
    backgroundColor: theme.danger, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});
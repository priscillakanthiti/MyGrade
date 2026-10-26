import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import BlueHeader from '../../components/BlueHeader';
import SchoolLogo from '../../components/SchoolLogo';
import Page from '../../components/Page';
import AppButton from '../../components/AppButton';
import { common } from '../../styles/components.styles';
import styles from '../../styles/profile.styles';
import { colors } from '../../theme';

export default function Profile() {
  const router = useRouter();
  const { teacherName, logout } = useAuth();

  return (
    <View style={common.screen}>
      <BlueHeader title="Profile" subtitle="Your account" />
      <Page>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{teacherName.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{teacherName}</Text>
          <Text style={styles.role}>Teacher</Text>
          <View style={styles.divider} />
          <View style={styles.schoolRow}>
            <SchoolLogo size={44} />
            <Text style={styles.schoolName}>Catholic Institute Primary School</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
          onPress={() => router.push('/account-security')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.menuTexts}>
            <Text style={styles.menuTitle}>Security</Text>
            <Text style={styles.menuSub}>Change your PIN and recovery question</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        <AppButton variant="dangerOutline" icon="log-out-outline" title="Log out" onPress={logout} />
      </Page>
    </View>
  );
}

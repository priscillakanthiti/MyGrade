import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import BlueHeader from '../../components/BlueHeader';
import Page from '../../components/Page';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { common } from '../../styles/components.styles';
import styles from '../../styles/profile.styles';
import { colors } from '../../theme';

export default function Profile() {
  const router = useRouter();
  const { teacherName, schoolName, updateSchoolName, logout } = useAuth();
  const [school, setSchool] = useState(schoolName);

  useEffect(() => { setSchool(schoolName); }, [schoolName]);

  async function saveSchool() {
    await updateSchoolName(school);
    Alert.alert('Saved', school.trim() ? 'Your school name will appear on reports.' : 'School name removed from reports.');
  }

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
          {schoolName ? <Text style={styles.schoolLine}>{schoolName}</Text> : null}
        </View>

        <View style={styles.settingsCard}>
          <View>
            <Text style={styles.settingsTitle}>School name</Text>
            <Text style={styles.settingsSub}>Optional. It is printed at the top of your PDF reports.</Text>
          </View>
          <AppInput
            icon="business-outline"
            placeholder="e.g. Green Valley Primary School"
            value={school}
            onChangeText={setSchool}
          />
          <AppButton variant="soft" title="Save school name" onPress={saveSchool} />
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

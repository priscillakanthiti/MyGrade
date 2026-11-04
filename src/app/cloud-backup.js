import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { backupNow, getCloudState, linkCloud, unlinkCloud } from '../cloud/backup';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Segmented from '../components/Segmented';
import Notice from '../components/Notice';
import styles from '../styles/cloud.styles';
import { colors } from '../theme';

const MODES = [
  { label: 'Create account', value: 'signup' },
  { label: 'Sign in', value: 'signin' },
];

function when(iso) {
  if (!iso) return 'Not backed up yet';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 'Not backed up yet' : d.toLocaleString();
}

export default function CloudBackup() {
  const db = useSQLiteContext();
  const { teacherId } = useAuth();

  const [state, setState] = useState(null);
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => { setState(await getCloudState(teacherId)); }, [teacherId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function connect() {
    setError('');
    setBusy(true);
    const err = await linkCloud(db, teacherId, email, password, mode);
    setBusy(false);
    if (err) { setError(err); return; }
    setPassword('');
    await load();
    Alert.alert('Cloud backup is on', 'Your data has been backed up. It will now back up automatically whenever you are online.');
  }

  async function backupButton() {
    setError('');
    setBusy(true);
    const r = await backupNow(db, teacherId, { force: true });
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    await load();
    Alert.alert('Backed up', 'Your data is safely stored in the cloud.');
  }

  function disconnect() {
    Alert.alert(
      'Turn off cloud backup?',
      'Your data stays on this phone. The existing cloud copy is kept, but it will no longer be updated.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Turn off', style: 'destructive', onPress: async () => { await unlinkCloud(teacherId); load(); } },
      ]
    );
  }

  if (!state) return <Page><Text style={styles.sub}>Loading...</Text></Page>;

  return (
    <Page>
      {!state.configured ? (
        <Notice tone="warning" title="Cloud backup is not set up yet">
          The Supabase project URL and key have not been added to the app. Open src/cloud/config.js and paste them in.
        </Notice>
      ) : state.linked ? (
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Ionicons name="cloud-done-outline" size={26} color={colors.success} />
            </View>
            <View style={styles.statusBody}>
              <Text style={styles.statusTitle}>Cloud backup is on</Text>
              <Text style={styles.statusLine}>{state.email}</Text>
              <Text style={styles.statusLine}>Last backup: {when(state.lastBackup)}</Text>
            </View>
          </View>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <AppButton icon="cloud-upload-outline" title="Back up now" onPress={backupButton} loading={busy} />
          <AppButton variant="dangerOutline" title="Turn off cloud backup" onPress={disconnect} />
        </View>
      ) : (
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>Protect your data</Text>
            <Text style={styles.sub}>
              Link a cloud account so your classes, students and marks can be restored if this phone is lost or reset.
            </Text>
          </View>
          <Segmented options={MODES} value={mode} onChange={setMode} />
          <AppInput label="Email" icon="mail-outline" placeholder="you@example.com"
            autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <AppInput label="Password" icon="lock-closed-outline" placeholder="At least 6 characters"
            secureTextEntry value={password} onChangeText={setPassword} />
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <AppButton title={mode === 'signup' ? 'Create account and back up' : 'Sign in and back up'}
            onPress={connect} loading={busy} />
        </View>
      )}

      <Notice tone="info" title="Works offline">
        Everything in the app keeps working without internet. Backups upload by themselves when you are online.
      </Notice>
    </Page>
  );
}

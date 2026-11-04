import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { fetchCloudBackup, rememberLink } from '../cloud/backup';
import { restoreSnapshot, summarize } from '../cloud/snapshot';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import StatTile from '../components/StatTile';
import styles from '../styles/cloud.styles';

export default function Restore() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function findBackup() {
    setError('');
    setBusy(true);
    const r = await fetchCloudBackup(email, password);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    setFound(r);
  }

  async function doRestore() {
    setError('');
    setBusy(true);
    try {
      const r = await restoreSnapshot(db, found.snapshot);
      if (r.error) { setError(r.error); return; }
      await rememberLink(r.teacherId, found.user);
      Alert.alert(
        'Restore complete',
        `Sign in with the username "${found.snapshot.teacher.username}" and your PIN to continue.`,
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (e) {
      setError('The restore could not be completed and nothing was changed on this phone.');
    } finally {
      setBusy(false);
    }
  }

  if (found) {
    const s = summarize(found.snapshot);
    return (
      <Page>
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>Backup found</Text>
            <Text style={styles.sub}>
              {s.teacherName} ({s.username}). Saved {new Date(found.updatedAt).toLocaleString()}.
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <StatTile value={s.classes} label="Classes" tone="primary" />
            <StatTile value={s.students} label="Students" tone="accent" />
            <StatTile value={s.terms} label="Terms" tone="success" />
          </View>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <AppButton icon="cloud-download-outline" title="Restore to this phone" onPress={doRestore} loading={busy} />
          <AppButton variant="secondary" title="Back" onPress={() => { setFound(null); setError(''); }} />
        </View>
      </Page>
    );
  }

  return (
    <Page>
      <View style={styles.card}>
        <View>
          <Text style={styles.title}>Restore from cloud</Text>
          <Text style={styles.sub}>Sign in with the cloud account you used for backup to bring your data back.</Text>
        </View>
        <AppInput label="Email" icon="mail-outline" placeholder="you@example.com"
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AppInput label="Password" icon="lock-closed-outline" placeholder="Cloud account password"
          secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <AppButton title="Find my backup" onPress={findBackup} loading={busy} />
      </View>
    </Page>
  );
}

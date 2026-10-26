import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { theme } from '../theme';

export default function ForgotPin() {
  const router = useRouter();
  const { getSecurityQuestion, resetPin } = useAuth();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function findAccount() {
    setError('');
    if (!username.trim()) {
      setError('Enter your username.');
      return;
    }
    setBusy(true);
    const q = await getSecurityQuestion(username);
    setBusy(false);
    if (!q) {
      setError(
        'No recovery question was found for this username. If the account was created before recovery questions were added, a PIN reset is not possible.'
      );
      return;
    }
    setQuestion(q);
    setStep(2);
  }

  async function submitReset() {
    setError('');
    if (pin !== pin2) {
      setError('The two PINs do not match.');
      return;
    }
    setBusy(true);
    const err = await resetPin(username, answer, pin);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    Alert.alert('PIN changed', 'Your PIN has been changed. Please sign in with your new PIN.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.box}>
        <Text style={styles.title}>Reset your PIN</Text>

        {step === 1 ? (
          <>
            <Text style={styles.sub}>Enter your username to find your recovery question.</Text>
            <View style={styles.field}>
              <Ionicons name="person-outline" size={22} color={theme.muted} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={findAccount} disabled={busy}>
              <Text style={styles.btnText}>Continue</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.sub}>Answer your recovery question, then choose a new PIN.</Text>
            <View style={styles.questionBox}>
              <Text style={styles.questionText}>{question}</Text>
            </View>
            <View style={styles.field}>
              <Ionicons name="key-outline" size={22} color={theme.muted} />
              <TextInput
                style={styles.input}
                placeholder="Your answer"
                autoCapitalize="none"
                value={answer}
                onChangeText={setAnswer}
              />
            </View>
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.muted} />
              <TextInput
                style={styles.input}
                placeholder="New PIN (4 to 6 digits)"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={pin}
                onChangeText={setPin}
              />
            </View>
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.muted} />
              <TextInput
                style={styles.input}
                placeholder="Confirm new PIN"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={pin2}
                onChangeText={setPin2}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submitReset} disabled={busy}>
              <Text style={styles.btnText}>Change PIN</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  box: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 12,
    width: '100%', maxWidth: 440, alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  sub: { color: theme.muted, textAlign: 'center' },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F7FAFE', borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
  questionBox: { backgroundColor: '#DDEBFA', borderRadius: 12, padding: 14 },
  questionText: { color: theme.text, fontWeight: 'bold', fontSize: 16 },
  error: { color: theme.danger, textAlign: 'center' },
  btn: { backgroundColor: theme.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});
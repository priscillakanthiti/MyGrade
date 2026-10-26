import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import styles from '../styles/auth.styles';

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
    <ScrollView contentContainerStyle={styles.authScreen} keyboardShouldPersistTaps="handled">
      <View style={styles.authBox}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Reset your PIN</Text>

          {step === 1 ? (
            <>
              <Text style={styles.authSub}>Enter your username to find your recovery question.</Text>
              <AppInput
                label="Username"
                icon="at-outline"
                placeholder="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />
              {error ? <Notice tone="danger">{error}</Notice> : null}
              <AppButton title="Continue" onPress={findAccount} loading={busy} />
            </>
          ) : (
            <>
              <Text style={styles.authSub}>Answer your recovery question, then choose a new PIN.</Text>
              <View style={styles.questionBox}>
                <Text style={styles.questionLabel}>Recovery question</Text>
                <Text style={styles.questionText}>{question}</Text>
              </View>
              <AppInput
                label="Your answer"
                icon="key-outline"
                placeholder="Type your answer"
                autoCapitalize="none"
                value={answer}
                onChangeText={setAnswer}
              />
              <AppInput
                label="New PIN"
                icon="lock-closed-outline"
                placeholder="4 to 6 digits"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={pin}
                onChangeText={setPin}
              />
              <AppInput
                label="Confirm new PIN"
                icon="lock-closed-outline"
                placeholder="Repeat the new PIN"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={pin2}
                onChangeText={setPin2}
              />
              {error ? <Notice tone="danger">{error}</Notice> : null}
              <AppButton title="Change PIN" onPress={submitReset} loading={busy} />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

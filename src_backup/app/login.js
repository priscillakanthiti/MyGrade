import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import SchoolLogo from '../components/SchoolLogo';
import QuestionPicker from '../components/QuestionPicker';
import { theme } from '../theme';

export default function Login() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    const err = mode === 'login'
      ? await login(username, pin)
      : await register(name, username, pin, question, answer);
    setBusy(false);
    if (err) setError(err);
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <View style={styles.box}>
          <View style={{ alignItems: 'center' }}>
            <SchoolLogo size={110} />
            <Text style={styles.school}>Catholic Institute</Text>
            <Text style={styles.school}>Primary School</Text>
          </View>

          <Text style={styles.title}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.sub}>
            {mode === 'login' ? 'Sign in to continue' : 'Register as a teacher'}
          </Text>

          {mode === 'register' && (
            <View style={styles.field}>
              <Ionicons name="happy-outline" size={22} color={theme.muted} />
              <TextInput
                style={styles.input}
                placeholder="Full name (e.g. Madam Soso)"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

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

          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={22} color={theme.muted} />
            <TextInput
              style={styles.input}
              placeholder={mode === 'login' ? 'PIN' : 'PIN (4 to 6 digits)'}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={!showPin}
              value={pin}
              onChangeText={setPin}
            />
            <Pressable onPress={() => setShowPin(!showPin)} hitSlop={10}>
              <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.muted} />
            </Pressable>
          </View>

          {mode === 'register' && (
            <>
              <Text style={styles.hint}>
                Recovery question: used to reset your PIN if you forget it.
              </Text>
              <QuestionPicker value={question} onChange={setQuestion} />
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
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            <Text style={styles.primaryText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Pressable style={styles.outlineBtn} onPress={switchMode}>
            <Ionicons
              name={mode === 'login' ? 'person-add-outline' : 'log-in-outline'}
              size={20}
              color={theme.primary}
            />
            <Text style={styles.outlineText}>{mode === 'login' ? 'Sign Up' : 'Back to Sign In'}</Text>
          </Pressable>

          {mode === 'login' && (
            <Pressable onPress={() => router.push('/forgot-pin')}>
              <Text style={styles.link}>Forgot PIN?</Text>
            </Pressable>
          )}

          <Text style={styles.footer}>Better Data. Better Decisions. Better Learning.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.bg },
  box: { width: '100%', maxWidth: 400, gap: 12 },
  school: { fontSize: 20, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginTop: 14 },
  sub: { textAlign: 'center', color: theme.muted, marginBottom: 6, fontSize: 16 },
  hint: { color: theme.muted, fontSize: 13 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
  error: { color: theme.danger, textAlign: 'center' },
  primaryBtn: { backgroundColor: theme.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: theme.border },
  orText: { color: theme.muted },
  outlineBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: theme.primary, borderRadius: 12, padding: 14, backgroundColor: '#fff',
  },
  outlineText: { color: theme.primary, fontWeight: 'bold', fontSize: 17 },
  link: { textAlign: 'center', color: theme.primary, marginTop: 4 },
  footer: { textAlign: 'center', color: theme.muted, fontStyle: 'italic', marginTop: 16, fontSize: 12 },
});
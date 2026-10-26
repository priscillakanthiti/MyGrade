import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import SchoolLogo from '../components/SchoolLogo';
import QuestionPicker from '../components/QuestionPicker';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import styles from '../styles/auth.styles';
import { colors } from '../theme';

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

  const isLogin = mode === 'login';

  async function submit() {
    setError('');
    setBusy(true);
    const err = isLogin
      ? await login(username, pin)
      : await register(name, username, pin, question, answer);
    setBusy(false);
    if (err) setError(err);
  }

  function switchMode() {
    setMode(isLogin ? 'register' : 'login');
    setError('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.authScreen} keyboardShouldPersistTaps="handled">
        <View style={styles.authBox}>
          <View style={styles.brand}>
            <SchoolLogo size={88} />
            <Text style={styles.brandName}>Catholic Institute Primary School</Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{isLogin ? 'Welcome back' : 'Create account'}</Text>
            <Text style={styles.authSub}>
              {isLogin ? 'Sign in to continue to your classes' : 'Register as a teacher'}
            </Text>

            {!isLogin && (
              <AppInput
                label="Full name"
                icon="person-outline"
                placeholder="e.g. Madam Soso"
                value={name}
                onChangeText={setName}
              />
            )}

            <AppInput
              label="Username"
              icon="at-outline"
              placeholder="Enter your username"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />

            <AppInput
              label="PIN"
              icon="lock-closed-outline"
              placeholder={isLogin ? 'Enter your PIN' : '4 to 6 digits'}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={!showPin}
              value={pin}
              onChangeText={setPin}
              right={
                <Pressable onPress={() => setShowPin(!showPin)} hitSlop={10}>
                  <Ionicons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              }
            />

            {!isLogin && (
              <>
                <Text style={styles.hint}>
                  Recovery question: used to reset your PIN if you forget it.
                </Text>
                <QuestionPicker value={question} onChange={setQuestion} />
                <AppInput
                  icon="key-outline"
                  placeholder="Your answer"
                  autoCapitalize="none"
                  value={answer}
                  onChangeText={setAnswer}
                />
              </>
            )}

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <AppButton
              title={isLogin ? 'Sign In' : 'Create Account'}
              onPress={submit}
              loading={busy}
            />

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <AppButton
              variant="secondary"
              icon={isLogin ? 'person-add-outline' : 'log-in-outline'}
              title={isLogin ? 'Sign Up' : 'Back to Sign In'}
              onPress={switchMode}
            />

            {isLogin && (
              <Pressable onPress={() => router.push('/forgot-pin')}>
                <Text style={styles.link}>Forgot PIN?</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.authFooter}>Better Data. Better Decisions. Better Learning.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

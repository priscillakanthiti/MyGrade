import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import QuestionPicker from '../components/QuestionPicker';
import { theme } from '../theme';

export default function AccountSecurity() {
  const db = useSQLiteContext();
  const { teacherId, changePin, setSecurityQuestion } = useAuth();

  const [hasQuestion, setHasQuestion] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [pinError, setPinError] = useState('');

  const [qPin, setQPin] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [qError, setQError] = useState('');

  const load = useCallback(async () => {
    const t = await db.getFirstAsync('SELECT security_question FROM teachers WHERE id = ?', teacherId);
    setHasQuestion(!!(t && t.security_question));
  }, [db, teacherId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function submitPin() {
    setPinError('');
    if (newPin !== newPin2) {
      setPinError('The two new PINs do not match.');
      return;
    }
    const err = await changePin(currentPin, newPin);
    if (err) {
      setPinError(err);
      return;
    }
    setCurrentPin(''); setNewPin(''); setNewPin2('');
    Alert.alert('PIN changed', 'Your PIN has been updated.');
  }

  async function submitQuestion() {
    setQError('');
    const err = await setSecurityQuestion(qPin, question, answer);
    if (err) {
      setQError(err);
      return;
    }
    setQPin(''); setQuestion(''); setAnswer('');
    setHasQuestion(true);
    Alert.alert('Saved', 'Your recovery question has been saved.');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Change PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="Current PIN"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={currentPin}
          onChangeText={setCurrentPin}
        />
        <TextInput
          style={styles.input}
          placeholder="New PIN (4 to 6 digits)"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={newPin}
          onChangeText={setNewPin}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm new PIN"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={newPin2}
          onChangeText={setNewPin2}
        />
        {pinError ? <Text style={styles.error}>{pinError}</Text> : null}
        <Pressable style={styles.btn} onPress={submitPin}>
          <Text style={styles.btnText}>Change PIN</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Recovery question</Text>
        <View style={[styles.status, hasQuestion ? styles.statusOk : styles.statusWarn]}>
          <Text style={{ color: hasQuestion ? theme.greenDark : '#8A6100', fontWeight: 'bold', textAlign: 'center' }}>
            {hasQuestion
              ? 'A recovery question is set. You can change it below.'
              : 'No recovery question yet. Set one now, or you will not be able to reset a forgotten PIN.'}
          </Text>
        </View>
        <QuestionPicker value={question} onChange={setQuestion} />
        <TextInput
          style={styles.input}
          placeholder="Your answer"
          autoCapitalize="none"
          value={answer}
          onChangeText={setAnswer}
        />
        <TextInput
          style={styles.input}
          placeholder="Current PIN (to confirm it is you)"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={qPin}
          onChangeText={setQPin}
        />
        {qError ? <Text style={styles.error}>{qError}</Text> : null}
        <Pressable style={styles.btn} onPress={submitQuestion}>
          <Text style={styles.btnText}>Save recovery question</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 10,
    width: '100%', maxWidth: 480, alignSelf: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  input: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: '#F7FAFE',
  },
  error: { color: theme.danger, textAlign: 'center' },
  btn: { backgroundColor: theme.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  status: { borderRadius: 10, padding: 10 },
  statusOk: { backgroundColor: theme.green },
  statusWarn: { backgroundColor: '#FFF4D6' },
});
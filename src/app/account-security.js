import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import QuestionPicker from '../components/QuestionPicker';
import Page from '../components/Page';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Notice from '../components/Notice';
import styles from '../styles/forms.styles';

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
    <Page>
      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Change PIN</Text>
          <Text style={styles.cardSub}>Use 4 to 6 digits that are easy for you to remember.</Text>
        </View>
        <AppInput
          label="Current PIN"
          icon="lock-closed-outline"
          placeholder="Enter current PIN"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={currentPin}
          onChangeText={setCurrentPin}
        />
        <AppInput
          label="New PIN"
          icon="key-outline"
          placeholder="4 to 6 digits"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={newPin}
          onChangeText={setNewPin}
        />
        <AppInput
          label="Confirm new PIN"
          icon="key-outline"
          placeholder="Repeat the new PIN"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={newPin2}
          onChangeText={setNewPin2}
        />
        {pinError ? <Notice tone="danger">{pinError}</Notice> : null}
        <AppButton title="Change PIN" onPress={submitPin} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recovery question</Text>
        {hasQuestion ? (
          <Notice tone="success">A recovery question is set. You can change it below.</Notice>
        ) : (
          <Notice tone="warning">
            No recovery question yet. Set one now, or you will not be able to reset a forgotten PIN.
          </Notice>
        )}
        <QuestionPicker value={question} onChange={setQuestion} />
        <AppInput
          label="Your answer"
          icon="chatbubble-ellipses-outline"
          placeholder="Type your answer"
          autoCapitalize="none"
          value={answer}
          onChangeText={setAnswer}
        />
        <AppInput
          label="Current PIN"
          icon="lock-closed-outline"
          placeholder="Confirm it is you"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={qPin}
          onChangeText={setQPin}
        />
        {qError ? <Notice tone="danger">{qError}</Notice> : null}
        <AppButton title="Save recovery question" onPress={submitQuestion} />
      </View>
    </Page>
  );
}

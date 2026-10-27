import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { normalizeAnswer } from '../utils/security';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

async function hashValue(salt, value) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + value);
}

const PIN_RULE = /^\d{4,6}$/;

export function AuthProvider({ children }) {
  const db = useSQLiteContext();
  const [teacherId, setTeacherId] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(true);

  // Restore the previous session when the app opens
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('teacherId');
        if (saved) {
          const t = await db.getFirstAsync('SELECT * FROM teachers WHERE id = ?', Number(saved));
          if (t) {
            setTeacherId(t.id);
            setTeacherName(t.name);
            setSchoolName(t.school_name || '');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  async function startSession(t) {
    await SecureStore.setItemAsync('teacherId', String(t.id));
    setTeacherId(t.id);
    setTeacherName(t.name);
    setSchoolName(t.school_name || '');
  }

  async function register(name, username, pin, question, answer) {
    const u = username.trim().toLowerCase();
    if (!name.trim() || !u || !PIN_RULE.test(pin)) {
      return 'Enter your name, a username and a PIN of 4 to 6 digits.';
    }
    if (!question || normalizeAnswer(answer).length < 2) {
      return 'Choose a recovery question and type your answer. You will need it if you forget your PIN.';
    }
    const existing = await db.getFirstAsync('SELECT id FROM teachers WHERE username = ?', u);
    if (existing) return 'That username is already taken.';

    const salt = Crypto.randomUUID();
    const hash = await hashValue(salt, pin);
    const answerSalt = Crypto.randomUUID();
    const answerHash = await hashValue(answerSalt, normalizeAnswer(answer));

    const res = await db.runAsync(
      `INSERT INTO teachers (name, username, salt, password_hash, security_question, answer_salt, answer_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      name.trim(), u, salt, hash, question, answerSalt, answerHash
    );
    await startSession({ id: res.lastInsertRowId, name: name.trim() });
    return null;
  }

  async function login(username, pin) {
    const u = username.trim().toLowerCase();
    const cleanPin = String(pin || '').trim();
    if (!u || !cleanPin) return 'Enter your username and PIN.';

    const t = await db.getFirstAsync('SELECT * FROM teachers WHERE username = ?', u);
    if (!t) {
      const count = await db.getFirstAsync('SELECT COUNT(*) AS n FROM teachers');
      if (!count || count.n === 0) {
        return 'No accounts exist on this device yet. Tap Sign Up to create one. (Accounts are stored on the phone where they were created, so a new install or a different phone starts empty.)';
      }
      return 'No account found with that username on this device. Check the spelling, or tap Sign Up.';
    }
    const hash = await hashValue(t.salt, cleanPin);
    if (hash !== t.password_hash) return 'Incorrect PIN for this username.';
    await startSession(t);
    return null;
  }

  async function logout() {
    await SecureStore.deleteItemAsync('teacherId');
    setTeacherId(null);
    setTeacherName('');
    setSchoolName('');
  }

  // Optional school name that is printed on reports
  async function updateSchoolName(value) {
    const v = String(value || '').trim();
    await db.runAsync('UPDATE teachers SET school_name = ? WHERE id = ?', v, teacherId);
    setSchoolName(v);
  }

  // ----- Forgot PIN -----
  async function getSecurityQuestion(username) {
    const t = await db.getFirstAsync(
      'SELECT security_question FROM teachers WHERE username = ?',
      username.trim().toLowerCase()
    );
    return t && t.security_question ? t.security_question : null;
  }

  async function resetPin(username, answer, newPin) {
    if (!PIN_RULE.test(newPin)) return 'The new PIN must be 4 to 6 digits.';
    const t = await db.getFirstAsync(
      'SELECT * FROM teachers WHERE username = ?',
      username.trim().toLowerCase()
    );
    if (!t || !t.security_question) return 'No recovery question is set for this account.';
    const check = await hashValue(t.answer_salt, normalizeAnswer(answer));
    if (check !== t.answer_hash) return 'That answer is not correct.';

    const salt = Crypto.randomUUID();
    const hash = await hashValue(salt, newPin);
    await db.runAsync('UPDATE teachers SET salt = ?, password_hash = ? WHERE id = ?', salt, hash, t.id);
    return null;
  }

  // ----- Account security (logged in) -----
  async function changePin(currentPin, newPin) {
    if (!PIN_RULE.test(newPin)) return 'The new PIN must be 4 to 6 digits.';
    const t = await db.getFirstAsync('SELECT * FROM teachers WHERE id = ?', teacherId);
    if (!t) return 'Account not found.';
    const check = await hashValue(t.salt, currentPin);
    if (check !== t.password_hash) return 'Your current PIN is not correct.';

    const salt = Crypto.randomUUID();
    const hash = await hashValue(salt, newPin);
    await db.runAsync('UPDATE teachers SET salt = ?, password_hash = ? WHERE id = ?', salt, hash, teacherId);
    return null;
  }

  async function setSecurityQuestion(currentPin, question, answer) {
    if (!question || normalizeAnswer(answer).length < 2) {
      return 'Choose a question and type an answer.';
    }
    const t = await db.getFirstAsync('SELECT * FROM teachers WHERE id = ?', teacherId);
    if (!t) return 'Account not found.';
    const check = await hashValue(t.salt, currentPin);
    if (check !== t.password_hash) return 'Your current PIN is not correct.';

    const answerSalt = Crypto.randomUUID();
    const answerHash = await hashValue(answerSalt, normalizeAnswer(answer));
    await db.runAsync(
      'UPDATE teachers SET security_question = ?, answer_salt = ?, answer_hash = ? WHERE id = ?',
      question, answerSalt, answerHash, teacherId
    );
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        teacherId, teacherName, schoolName, loading,
        updateSchoolName,
        register, login, logout,
        getSecurityQuestion, resetPin, changePin, setSecurityQuestion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

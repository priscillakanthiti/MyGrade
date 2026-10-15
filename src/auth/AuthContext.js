import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

async function hashPin(salt, pin) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + pin);
}

export function AuthProvider({ children }) {
  const db = useSQLiteContext();
  const [teacherId, setTeacherId] = useState(null);
  const [teacherName, setTeacherName] = useState('');
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
  }

  async function register(name, username, pin) {
    const u = username.trim().toLowerCase();
    if (!name.trim() || !u || !/^\d{4,6}$/.test(pin)) {
      return 'Enter your name, a username and a PIN of 4 to 6 digits.';
    }
    const existing = await db.getFirstAsync('SELECT id FROM teachers WHERE username = ?', u);
    if (existing) return 'That username is already taken.';

    const salt = Crypto.randomUUID();
    const hash = await hashPin(salt, pin);
    const res = await db.runAsync(
      'INSERT INTO teachers (name, username, salt, password_hash) VALUES (?, ?, ?, ?)',
      name.trim(), u, salt, hash
    );
    await startSession({ id: res.lastInsertRowId, name: name.trim() });
    return null;
  }

  async function login(username, pin) {
    const u = username.trim().toLowerCase();
    const t = await db.getFirstAsync('SELECT * FROM teachers WHERE username = ?', u);
    if (!t) return 'Wrong username or PIN.';
    const hash = await hashPin(t.salt, pin);
    if (hash !== t.password_hash) return 'Wrong username or PIN.';
    await startSession(t);
    return null;
  }

  async function logout() {
    await SecureStore.deleteItemAsync('teacherId');
    setTeacherId(null);
    setTeacherName('');
  }

  return (
    <AuthContext.Provider value={{ teacherId, teacherName, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
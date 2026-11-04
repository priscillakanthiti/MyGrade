import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useAuth } from '../auth/AuthContext';
import { backupNow } from './backup';

// Backs up quietly when the app opens and whenever it goes to the background.
// Nothing happens (and nothing breaks) when the phone is offline.
export default function useAutoBackup() {
  const db = useSQLiteContext();
  const { teacherId } = useAuth();

  useEffect(() => {
    if (!teacherId) return undefined;
    const run = () => { backupNow(db, teacherId).catch(() => {}); };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') run();
    });
    return () => sub.remove();
  }, [db, teacherId]);
}

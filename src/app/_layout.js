import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDb } from '../db/database';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { ClassProvider } from '../state/ClassContext';
import { theme } from '../theme';

function RootNav() {
  const { teacherId, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.header },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Protected guard={!!teacherId}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="register-class" options={{ title: 'Register Class' }} />
        <Stack.Screen name="subjects" options={{ title: 'Subjects' }} />
        <Stack.Screen name="students" options={{ title: 'Students' }} />
        <Stack.Screen name="marks" options={{ title: 'Enter marks' }} />
        <Stack.Screen name="results" options={{ title: 'Results' }} />
        <Stack.Screen name="student-report" options={{ title: 'Student Report' }} />
      </Stack.Protected>
      <Stack.Protected guard={!teacherId}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="mygrade3.db" onInit={migrateDb}>
      <AuthProvider>
        <ClassProvider>
          <RootNav />
        </ClassProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}
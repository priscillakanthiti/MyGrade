import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDb } from '../db/database';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { ClassProvider } from '../state/ClassContext';
import { colors, font } from '../theme';

function RootNav() {
  const { teacherId, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: colors.white,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: font.weight.bold, fontSize: font.size.lg },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!!teacherId}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="register-class" options={{ title: 'Register Class' }} />
        <Stack.Screen name="subjects" options={{ title: 'Subjects' }} />
        <Stack.Screen name="students" options={{ title: 'Students' }} />
        <Stack.Screen name="marks" options={{ title: 'Enter Marks' }} />
        <Stack.Screen name="results" options={{ title: 'Results' }} />
        <Stack.Screen name="class-stats" options={{ title: 'Class Statistics' }} />
        <Stack.Screen name="student-report" options={{ title: 'Student Report' }} />
        <Stack.Screen name="new-term" options={{ title: 'Start New Term' }} />
        <Stack.Screen name="account-security" options={{ title: 'Security' }} />
      </Stack.Protected>
      <Stack.Protected guard={!teacherId}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-pin" options={{ title: 'Reset PIN' }} />
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
